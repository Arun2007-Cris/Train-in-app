import type { Train, SearchResultTrain, UserPreference, TravelClassType, ConnectingTrainRoute, Station } from '../src/types.ts';
import { STATIONS, INITIAL_TRAINS } from './railwayData.ts';

export interface SearchQueryParams {
  boarding_code: string;
  destination_code: string;
  journey_date: string; // "YYYY-MM-DD"
  journey_time: string; // "HH:MM"
  preference?: UserPreference;
  class_filter?: string;
  type_filter?: string;
  include_departed?: boolean;
}

// Convert "HH:MM" to minutes from midnight
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

// Format minutes from midnight to "Xh Ym"
export function formatDuration(durationMinutes: number): string {
  const h = Math.floor(durationMinutes / 60);
  const m = durationMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Compute journey duration considering overnight days
export function computeJourneyMinutes(
  depTime: string,
  arrTime: string,
  depDayOffset: number = 0,
  arrDayOffset: number = 0
): number {
  const depMinutes = timeToMinutes(depTime) + depDayOffset * 1440;
  let arrMinutes = timeToMinutes(arrTime) + arrDayOffset * 1440;

  if (arrMinutes < depMinutes) {
    // Crosses midnight without dayOffset provided
    arrMinutes += 1440;
  }
  return arrMinutes - depMinutes;
}

// Helper to check if train has departed relative to query date & time
export function hasTrainDeparted(
  queryDateStr: string,
  queryTimeStr: string,
  trainDepTimeStr: string,
  dayOffset: number
): boolean {
  try {
    const [queryYear, queryMonth, queryDay] = queryDateStr.split('-').map(Number);
    const [queryHour, queryMin] = queryTimeStr.split(':').map(Number);
    const queryTotalMinutes = new Date(queryYear, queryMonth - 1, queryDay, queryHour, queryMin).getTime();

    const [depHour, depMin] = trainDepTimeStr.split(':').map(Number);
    // Departure date with day offset applied
    const depDate = new Date(queryYear, queryMonth - 1, queryDay + dayOffset, depHour, depMin);
    const depTotalMinutes = depDate.getTime();

    // If query is on the same requested departure date and query time is strictly after departure time
    return queryTotalMinutes > depTotalMinutes;
  } catch (e) {
    return false;
  }
}

/**
 * Explainable AI Recommendation Scoring
 */
export function calculateAIScoreAndReason(
  train: Train,
  durationMinutes: number,
  baseFare: number,
  stopCount: number,
  depTime: string,
  queryTime: string,
  preference: UserPreference = 'Best overall'
): { score: number; reason: string; matches: string[] } {
  const matches: string[] = [];

  // 1. Normalized Speed Score (0 - 100): lower duration is higher score
  // Benchmark: 60 mins ~ 100 score, 600 mins ~ 50 score
  const speedScore = Math.max(30, Math.min(100, Math.round(110 - (durationMinutes / 60) * 8)));

  // 2. Normalized Fare Score (0 - 100): lower fare is higher score
  // Benchmark: ₹100 ~ 100, ₹1500 ~ 40
  const fareScore = Math.max(30, Math.min(100, Math.round(105 - (baseFare / 25))));

  // 3. Punctuality Score (0 - 100): delay penalties
  const delay = train.live_status?.delay_minutes || 0;
  let punctualityScore = 100;
  if (delay > 0 && delay <= 15) punctualityScore = 88;
  else if (delay > 15 && delay <= 30) punctualityScore = 70;
  else if (delay > 30) punctualityScore = 50;

  // 4. Stops Directness Score (0 - 100)
  const directnessScore = Math.max(40, Math.min(100, 100 - (stopCount * 6)));

  // 5. Comfort / Train Type Rating
  let comfortScore = 75;
  if (train.train_type === 'Vande Bharat') comfortScore = 99;
  else if (train.train_type === 'Tejas' || train.train_type === 'Rajdhani') comfortScore = 96;
  else if (train.train_type === 'Humsafar') comfortScore = 90;
  else if (train.train_type === 'Superfast') comfortScore = 84;
  else if (train.train_type === 'Jan Shatabdi') comfortScore = 82;
  else if (train.train_type === 'Express') comfortScore = 78;
  else if (train.train_type === 'MEMU') comfortScore = 65;

  // 6. Departure Proximity Score (how soon after query time)
  const qMins = timeToMinutes(queryTime);
  const dMins = timeToMinutes(depTime);
  let timeDiff = dMins - qMins;
  if (timeDiff < 0) timeDiff += 1440; // next day departure
  const proximityScore = Math.max(30, Math.min(100, Math.round(100 - (timeDiff / 30))));

  // Multi-Criteria Weighted AI Scoring based on User Preference
  let finalScore = 80;
  let reason = '';

  switch (preference) {
    case 'Cheapest': {
      finalScore = Math.round(fareScore * 0.55 + speedScore * 0.15 + directnessScore * 0.15 + punctualityScore * 0.15);
      matches.push('Affordable Fare');
      if (baseFare < 200) matches.push('Budget Star');
      reason = `Best budget efficiency: Starts at only ₹${baseFare} with solid reliability (${punctualityScore}% punctuality).`;
      break;
    }
    case 'Fastest': {
      finalScore = Math.round(speedScore * 0.55 + directnessScore * 0.20 + punctualityScore * 0.15 + comfortScore * 0.10);
      matches.push('Rapid Transit');
      if (durationMinutes < 180) matches.push('Express Sprint');
      reason = `Shortest travel time (${formatDuration(durationMinutes)}) with ${stopCount} intermediate stops and ${punctualityScore >= 90 ? 'punctual schedule' : 'steady pace'}.`;
      break;
    }
    case 'Earliest departure': {
      finalScore = Math.round(proximityScore * 0.55 + speedScore * 0.20 + punctualityScore * 0.15 + directnessScore * 0.10);
      matches.push('Earliest Boarding');
      reason = `Departs soonest at ${depTime}, minimizing waiting time at station by departing near your target schedule.`;
      break;
    }
    case 'Comfortable journey': {
      finalScore = Math.round(comfortScore * 0.50 + punctualityScore * 0.25 + directnessScore * 0.15 + speedScore * 0.10);
      matches.push('High Comfort');
      if (train.train_type === 'Vande Bharat' || train.train_type === 'Tejas' || train.train_type === 'Rajdhani') {
        matches.push('Luxury Class');
      }
      reason = `Superior onboard ergonomics: ${train.train_type} rakes, modern climate control and serene ride quality.`;
      break;
    }
    case 'Best overall':
    default: {
      finalScore = Math.round(
        speedScore * 0.25 +
        fareScore * 0.22 +
        comfortScore * 0.20 +
        punctualityScore * 0.18 +
        directnessScore * 0.15
      );
      matches.push('Balanced Choice');
      if (punctualityScore >= 95) matches.push('On-Time Streak');
      reason = `Optimal balance of speed (${formatDuration(durationMinutes)}), value (₹${baseFare}), and on-time performance (${delay === 0 ? 'Right on time' : `${delay}m delay`}).`;
      break;
    }
  }

  // Bound to 60 - 99 for believable academic scoring
  finalScore = Math.max(62, Math.min(99, finalScore));

  return {
    score: finalScore,
    reason,
    matches,
  };
}

/**
 * Evaluates a single train on a specific journey segment from boarding station to destination station
 */
export function evaluateTrainSegment(
  train: Train,
  boardingCode: string,
  destCode: string,
  journeyDate: string,
  journeyTime: string,
  preference: UserPreference = 'Best overall',
  ignoreDepartedCheck: boolean = false
): SearchResultTrain | null {
  const bIndex = train.stops.findIndex(
    (s) => s.station_code.toUpperCase() === boardingCode.toUpperCase().trim()
  );
  const dIndex = train.stops.findIndex(
    (s) => s.station_code.toUpperCase() === destCode.toUpperCase().trim()
  );

  if (bIndex === -1 || dIndex === -1 || bIndex >= dIndex) {
    return null;
  }

  const bStop = train.stops[bIndex];
  const dStop = train.stops[dIndex];
  const intermediate = train.stops.slice(bIndex, dIndex + 1);
  const stopsCount = Math.max(0, dIndex - bIndex - 1);
  const journeyDistance = Math.max(20, dStop.distance_km - bStop.distance_km);

  const durationMins = computeJourneyMinutes(
    bStop.departure_time,
    dStop.arrival_time,
    bStop.day_offset,
    dStop.day_offset
  );

  const isOvernight =
    dStop.day_offset > bStop.day_offset ||
    timeToMinutes(dStop.arrival_time) < timeToMinutes(bStop.departure_time);

  const hasDeparted =
    !ignoreDepartedCheck &&
    hasTrainDeparted(
      journeyDate,
      journeyTime,
      bStop.departure_time,
      bStop.day_offset
    );

  const calculatedClasses = train.classes.map((cls) => {
    const calculatedFare = Math.round(
      Math.max(
        cls.base_fare * 0.4,
        cls.fare_per_km * journeyDistance + cls.base_fare * 0.35
      )
    );
    return {
      class_name: cls.class_name,
      fare: calculatedFare,
      available_seats: cls.available_seats,
    };
  });

  const minFare =
    calculatedClasses.length > 0
      ? Math.min(...calculatedClasses.map((c) => c.fare))
      : 150;

  const { score, reason, matches } = calculateAIScoreAndReason(
    train,
    durationMins,
    minFare,
    stopsCount,
    bStop.departure_time,
    journeyTime,
    preference
  );

  return {
    ...train,
    boarding_stop: bStop,
    destination_stop: dStop,
    journey_distance_km: journeyDistance,
    departure_time: bStop.departure_time,
    arrival_time: dStop.arrival_time,
    journey_duration: formatDuration(durationMins),
    journey_duration_minutes: durationMins,
    is_overnight: isOvernight,
    base_fare: minFare,
    calculated_classes: calculatedClasses,
    ai_score: score,
    ai_reason: reason,
    ai_preference_matches: matches,
    stops_between_count: stopsCount,
    intermediate_stops: intermediate,
    is_available: !hasDeparted,
    availability_status: hasDeparted ? 'ALREADY_DEPARTED' : 'AVAILABLE',
    availability_reason: hasDeparted
      ? 'Train Not Available (Already departed for selected time)'
      : 'Available for booking',
  };
}

/**
 * Filter & evaluate trains based on stations, stops, direction, and timings
 */
export function searchAndEvaluateTrains(
  allTrains: Train[],
  params: SearchQueryParams
): {
  available_trains: SearchResultTrain[];
  unavailable_trains: SearchResultTrain[];
  connecting_trains: ConnectingTrainRoute[];
  total_found: number;
} {
  const available: SearchResultTrain[] = [];
  const unavailable: SearchResultTrain[] = [];

  const boardingCode = params.boarding_code.toUpperCase().trim();
  const destCode = params.destination_code.toUpperCase().trim();
  const journeyDate = params.journey_date || new Date().toISOString().split('T')[0];
  const journeyTime = params.journey_time || '10:00';
  const preference = params.preference || 'Best overall';

  for (const train of allTrains) {
    const boardingIndex = train.stops.findIndex(
      (s) => s.station_code.toUpperCase() === boardingCode
    );
    const destIndex = train.stops.findIndex(
      (s) => s.station_code.toUpperCase() === destCode
    );

    // Rule 1: Does train stop at boarding junction?
    if (boardingIndex === -1) {
      // Train does not stop at boarding
      unavailable.push({
        ...train,
        boarding_stop: train.stops[0],
        destination_stop: train.stops[train.stops.length - 1],
        journey_distance_km: 0,
        departure_time: '--:--',
        arrival_time: '--:--',
        journey_duration: '--',
        journey_duration_minutes: 0,
        is_overnight: false,
        base_fare: 0,
        calculated_classes: [],
        ai_score: 0,
        ai_reason: `Train ${train.train_number} does not stop at ${boardingCode}.`,
        ai_preference_matches: [],
        stops_between_count: 0,
        intermediate_stops: [],
        is_available: false,
        availability_status: 'NOT_AVAILABLE_HERE',
        availability_reason: 'Train Not Available Here (Does not stop at selected boarding station)',
        reason_code: 'NO_BOARDING_STOP',
        reason_text: 'Train Not Available Here (No halt at boarding station)',
      });
      continue;
    }

    // Rule 2 & 3: Does train stop at destination and is boarding before destination?
    if (destIndex === -1 || boardingIndex >= destIndex) {
      unavailable.push({
        ...train,
        boarding_stop: train.stops[boardingIndex],
        destination_stop: destIndex !== -1 ? train.stops[destIndex] : train.stops[train.stops.length - 1],
        journey_distance_km: 0,
        departure_time: '--:--',
        arrival_time: '--:--',
        journey_duration: '--',
        journey_duration_minutes: 0,
        is_overnight: false,
        base_fare: 0,
        calculated_classes: [],
        ai_score: 0,
        ai_reason: destIndex === -1
          ? `Train does not reach ${destCode}.`
          : `Train runs in reverse direction (${destCode} occurs before ${boardingCode}).`,
        ai_preference_matches: [],
        stops_between_count: 0,
        intermediate_stops: [],
        is_available: false,
        availability_status: 'NOT_AVAILABLE_HERE',
        availability_reason: 'Train Not Available Here (Destination is not downstream on this route)',
        reason_code: destIndex === -1 ? 'NO_DESTINATION_STOP' : 'WRONG_DIRECTION',
        reason_text: destIndex === -1
          ? 'Train Not Available Here (Does not reach destination)'
          : 'Wrong Direction (Runs on opposite line)',
      });
      continue;
    }

    const bStop = train.stops[boardingIndex];
    const dStop = train.stops[destIndex];
    const intermediate = train.stops.slice(boardingIndex, destIndex + 1);
    const stopsCount = Math.max(0, destIndex - boardingIndex - 1);
    const journeyDistance = Math.max(20, dStop.distance_km - bStop.distance_km);

    const durationMins = computeJourneyMinutes(
      bStop.departure_time,
      dStop.arrival_time,
      bStop.day_offset,
      dStop.day_offset
    );

    const isOvernight = dStop.day_offset > bStop.day_offset || timeToMinutes(dStop.arrival_time) < timeToMinutes(bStop.departure_time);

    // Rule 4: Has train already departed relative to user date and time?
    const hasDeparted = hasTrainDeparted(
      journeyDate,
      journeyTime,
      bStop.departure_time,
      bStop.day_offset
    );

    // Calculate dynamic fares for each class for this specific distance
    const calculatedClasses = train.classes.map((cls) => {
      // Pro-rate fare based on distance or base fare
      const calculatedFare = Math.round(
        Math.max(cls.base_fare * 0.4, cls.fare_per_km * journeyDistance + (cls.base_fare * 0.35))
      );
      return {
        class_name: cls.class_name,
        fare: calculatedFare,
        available_seats: cls.available_seats,
      };
    });

    const minFare = calculatedClasses.length > 0
      ? Math.min(...calculatedClasses.map((c) => c.fare))
      : 150;

    const { score, reason, matches } = calculateAIScoreAndReason(
      train,
      durationMins,
      minFare,
      stopsCount,
      bStop.departure_time,
      journeyTime,
      preference
    );

    const resultTrain: SearchResultTrain = {
      ...train,
      boarding_stop: bStop,
      destination_stop: dStop,
      journey_distance_km: journeyDistance,
      departure_time: bStop.departure_time,
      arrival_time: dStop.arrival_time,
      journey_duration: formatDuration(durationMins),
      journey_duration_minutes: durationMins,
      is_overnight: isOvernight,
      base_fare: minFare,
      calculated_classes: calculatedClasses,
      ai_score: score,
      ai_reason: reason,
      ai_preference_matches: matches,
      stops_between_count: stopsCount,
      intermediate_stops: intermediate,
      is_available: !hasDeparted,
      availability_status: hasDeparted ? 'ALREADY_DEPARTED' : 'AVAILABLE',
      availability_reason: hasDeparted ? 'Train Not Available (Already departed for selected time)' : 'Available for booking',
      reason_code: hasDeparted ? 'ALREADY_DEPARTED' : undefined,
      reason_text: hasDeparted ? 'Train Not Available (Already Departed for selected departure time)' : undefined,
    };

    if (hasDeparted) {
      unavailable.push(resultTrain);
    } else {
      available.push(resultTrain);
    }
  }

  // Sort available trains based on user preference
  available.sort((a, b) => {
    if (preference === 'Cheapest') return a.base_fare - b.base_fare;
    if (preference === 'Fastest') return a.journey_duration_minutes - b.journey_duration_minutes;
    if (preference === 'Earliest departure') {
      return timeToMinutes(a.departure_time) - timeToMinutes(b.departure_time);
    }
    // Default: Sort by AI Score descending
    return b.ai_score - a.ai_score;
  });

  // Calculate connecting routes
  const connectingRoutes = findConnectingTrainRoutes(allTrains, params);

  return {
    available_trains: available,
    unavailable_trains: unavailable,
    connecting_trains: connectingRoutes,
    total_found: available.length,
  };
}

/**
 * Intelligent Connecting Train Search Engine
 * Discovers connecting train pairs via junction stations when direct trains are absent or for flexible options
 */
// Twin/adjacent metropolitan interchange hubs (short suburban or metro transfer)
const TWIN_STATIONS: Record<string, string[]> = {
  MS: ['MAS'],
  MAS: ['MS'],
  CSMT: ['MMCT', 'KYN'],
  MMCT: ['CSMT', 'KYN'],
  KYN: ['CSMT', 'MMCT'],
  NDLS: ['ANVT'],
  ANVT: ['NDLS'],
  LKO: ['CNB'],
  CNB: ['LKO'],
  ADI: ['GNC'],
  GNC: ['ADI'],
};

export function findConnectingTrainRoutes(
  allTrains: Train[],
  params: SearchQueryParams
): ConnectingTrainRoute[] {
  const boardingCode = params.boarding_code.toUpperCase().trim();
  const destCode = params.destination_code.toUpperCase().trim();
  const journeyDate = params.journey_date || new Date().toISOString().split('T')[0];
  const journeyTime = params.journey_time || '08:00';
  const preference = params.preference || 'Best overall';

  if (!boardingCode || !destCode || boardingCode === destCode) {
    return [];
  }

  // Extract all distinct junction stations present in stops across all trains
  const junctionMap = new Map<string, string>();
  for (const train of allTrains) {
    for (const stop of train.stops) {
      const code = stop.station_code.toUpperCase();
      if (code !== boardingCode && code !== destCode) {
        junctionMap.set(code, stop.station_name);
      }
    }
  }

  const routes: ConnectingTrainRoute[] = [];

  for (const [junctionCode, junctionName] of junctionMap.entries()) {
    // Find candidate Leg 1 trains: boardingCode -> junctionCode
    const leg1Candidates: Train[] = [];
    // Leg 2 candidates can depart either from junctionCode directly or a twin station (e.g. MAS if leg1 arrives at MS)
    const leg2CandidateList: { train: Train; departFromCode: string; isTwinTransfer: boolean }[] = [];

    const departFromCodes = [junctionCode, ...(TWIN_STATIONS[junctionCode] || [])];

    for (const train of allTrains) {
      const bIdx = train.stops.findIndex((s) => s.station_code.toUpperCase() === boardingCode);
      const jIdx = train.stops.findIndex((s) => s.station_code.toUpperCase() === junctionCode);

      if (bIdx !== -1 && jIdx !== -1 && bIdx < jIdx) {
        leg1Candidates.push(train);
      }

      for (const dCode of departFromCodes) {
        const j2Idx = train.stops.findIndex((s) => s.station_code.toUpperCase() === dCode);
        const dIdx = train.stops.findIndex((s) => s.station_code.toUpperCase() === destCode);

        if (j2Idx !== -1 && dIdx !== -1 && j2Idx < dIdx) {
          leg2CandidateList.push({
            train,
            departFromCode: dCode,
            isTwinTransfer: dCode !== junctionCode,
          });
        }
      }
    }

    if (leg1Candidates.length === 0 || leg2CandidateList.length === 0) continue;

    for (const t1 of leg1Candidates) {
      for (const { train: t2, departFromCode, isTwinTransfer } of leg2CandidateList) {
        if (t1.train_id === t2.train_id) continue; // Must be different trains

        // Try checking departed status, but if departed allow next service so connecting option is NEVER empty
        let leg1Result = evaluateTrainSegment(t1, boardingCode, junctionCode, journeyDate, journeyTime, preference, false);
        if (!leg1Result || !leg1Result.is_available) {
          leg1Result = evaluateTrainSegment(t1, boardingCode, junctionCode, journeyDate, journeyTime, preference, true);
        }
        if (!leg1Result) continue;

        // Arrival of Leg 1 at junction
        const leg1ArrMinutes =
          timeToMinutes(leg1Result.arrival_time) +
          (leg1Result.destination_stop.day_offset || 0) * 1440;

        // Leg 2 departs from junction (or twin terminal)
        let leg2Result = evaluateTrainSegment(t2, departFromCode, destCode, journeyDate, leg1Result.arrival_time, preference, true);
        if (!leg2Result) continue;

        const leg2DepMinutes =
          timeToMinutes(leg2Result.departure_time) +
          (leg2Result.boarding_stop.day_offset || 0) * 1440;

        const minBufferNeeded = isTwinTransfer ? 45 : 15;
        let layoverMins = leg2DepMinutes - leg1ArrMinutes;
        // If leg2 departs earlier in the clock day than leg1 arrived, it connects on next day's run
        while (layoverMins < minBufferNeeded) {
          layoverMins += 1440; // Next daily service
        }

        // Limit layover to realistic window (up to 24 hours)
        if (layoverMins > 1440) continue;

        const totalDurationMins =
          leg1Result.journey_duration_minutes + layoverMins + leg2Result.journey_duration_minutes;
        const totalDistance = leg1Result.journey_distance_km + leg2Result.journey_distance_km;
        const totalFare = leg1Result.base_fare + leg2Result.base_fare;

        // Calculate layover buffer guidance
        let layoverAdvice = isTwinTransfer
          ? `Inter-terminal transit from ${junctionCode} to ${departFromCode} (${formatDuration(layoverMins)} safe transfer buffer).`
          : `Comfortable ${formatDuration(layoverMins)} transfer buffer at ${junctionName}.`;
        const aiTags: string[] = [
          isTwinTransfer ? `Via ${junctionCode} / ${departFromCode}` : `Via ${junctionCode}`,
          'Connected Transit',
        ];

        if (isTwinTransfer) {
          aiTags.push('Inter-Terminal Transit');
        } else if (layoverMins >= 25 && layoverMins <= 85) {
          layoverAdvice = `Optimal ${formatDuration(layoverMins)} cross-platform transfer at ${junctionName}. Perfect connection buffer.`;
          aiTags.push('Optimal Buffer');
        } else if (layoverMins < 25) {
          layoverAdvice = `Prompt ${formatDuration(layoverMins)} transfer at ${junctionName}. Follow station announcements for quick connection.`;
          aiTags.push('Quick Transfer');
        } else {
          layoverAdvice = `${formatDuration(layoverMins)} buffer at ${junctionName}. Relax in the AC waiting hall or grab refreshments.`;
          aiTags.push('Relaxed Layover');
        }

        if (t1.train_type === 'Vande Bharat' || t2.train_type === 'Vande Bharat') {
          aiTags.push('Vande Bharat Segment');
        }
        if (t1.train_type === 'Rajdhani' || t2.train_type === 'Rajdhani') {
          aiTags.push('Premium Corridor');
        }

        // AI Score for connection
        const speedScore = Math.max(30, Math.min(100, Math.round(110 - (totalDurationMins / 60) * 6)));
        const bufferScore =
          layoverMins >= 30 && layoverMins <= 90 ? 98 : layoverMins <= 180 ? 85 : 70;
        const connectionScore = Math.round(
          speedScore * 0.45 +
            bufferScore * 0.35 +
            ((leg1Result.ai_score + leg2Result.ai_score) / 2) * 0.2
        );

        const hubDisplay = isTwinTransfer
          ? `${junctionName} (${junctionCode} ➔ ${departFromCode})`
          : `${junctionName} (${junctionCode})`;

        const aiReason = `Seamless 2-train connective route via ${hubDisplay}. Board #${t1.train_number} ${t1.train_name} at ${leg1Result.departure_time}, transfer with a safe ${formatDuration(layoverMins)} buffer, and continue on #${t2.train_number} ${t2.train_name} reaching ${destCode} at ${leg2Result.arrival_time}.`;

        routes.push({
          connection_id: `conn-${t1.train_number}-${t2.train_number}-${junctionCode}-${departFromCode}`,
          junction_station_code: isTwinTransfer ? `${junctionCode} / ${departFromCode}` : junctionCode,
          junction_station_name: hubDisplay,
          leg1: leg1Result,
          leg2: leg2Result,
          layover_minutes: layoverMins,
          layover_duration: formatDuration(layoverMins),
          layover_advice: layoverAdvice,
          total_duration_minutes: totalDurationMins,
          total_duration: formatDuration(totalDurationMins),
          total_distance_km: totalDistance,
          total_base_fare: totalFare,
          ai_score: Math.max(65, Math.min(98, connectionScore)),
          ai_reason: aiReason,
          ai_tags: aiTags,
          is_viable: true,
        });
      }
    }
  }

  // Guaranteed Railway Connection Engine: If no single-junction route is discovered, synthesize via primary transfer hubs
  if (routes.length === 0) {
    const PRIMARY_HUBS = ['MAS', 'MS', 'TPJ', 'SRR', 'CBE', 'ED', 'SBC', 'NDLS', 'HWH', 'CSMT', 'BPL', 'NGP', 'BZA', 'CNB', 'PNBE', 'GHY', 'ADI', 'DG'];
    for (const hub of PRIMARY_HUBS) {
      if (hub === boardingCode || hub === destCode) continue;

      const t1List = allTrains.filter((t) => {
        const b = t.stops.findIndex((s) => s.station_code.toUpperCase() === boardingCode);
        const h = t.stops.findIndex((s) => s.station_code.toUpperCase() === hub || (TWIN_STATIONS[hub] && TWIN_STATIONS[hub].includes(s.station_code.toUpperCase())));
        return b !== -1 && h !== -1 && b < h;
      });

      const t2List = allTrains.filter((t) => {
        const h = t.stops.findIndex((s) => s.station_code.toUpperCase() === hub || (TWIN_STATIONS[hub] && TWIN_STATIONS[hub].includes(s.station_code.toUpperCase())));
        const d = t.stops.findIndex((s) => s.station_code.toUpperCase() === destCode);
        return h !== -1 && d !== -1 && h < d;
      });

      if (t1List.length > 0 && t2List.length > 0) {
        for (const t1 of t1List.slice(0, 3)) {
          for (const t2 of t2List.slice(0, 3)) {
            if (t1.train_id === t2.train_id) continue;
            const leg1Stop = t1.stops.find((s) => s.station_code.toUpperCase() === hub || (TWIN_STATIONS[hub] && TWIN_STATIONS[hub].includes(s.station_code.toUpperCase())));
            const hubStopCode = leg1Stop ? leg1Stop.station_code.toUpperCase() : hub;
            const leg1Res = evaluateTrainSegment(t1, boardingCode, hubStopCode, journeyDate, journeyTime, preference, true);

            const leg2Stop = t2.stops.find((s) => s.station_code.toUpperCase() === hub || (TWIN_STATIONS[hub] && TWIN_STATIONS[hub].includes(s.station_code.toUpperCase())));
            const departCode = leg2Stop ? leg2Stop.station_code.toUpperCase() : hub;
            const leg2Res = evaluateTrainSegment(t2, departCode, destCode, journeyDate, leg1Res ? leg1Res.arrival_time : '10:00', preference, true);

            if (leg1Res && leg2Res) {
              const leg1ArrMinutes = timeToMinutes(leg1Res.arrival_time) + (leg1Res.destination_stop.day_offset || 0) * 1440;
              const leg2DepMinutes = timeToMinutes(leg2Res.departure_time) + (leg2Res.boarding_stop.day_offset || 0) * 1440;
              let layoverMins = leg2DepMinutes - leg1ArrMinutes;
              while (layoverMins < 30) layoverMins += 1440;
              const totalDurationMins = leg1Res.journey_duration_minutes + layoverMins + leg2Res.journey_duration_minutes;
              const totalDist = leg1Res.journey_distance_km + leg2Res.journey_distance_km;
              const totalF = leg1Res.base_fare + leg2Res.base_fare;

              routes.push({
                connection_id: `conn-guaranteed-${t1.train_number}-${t2.train_number}-${hub}`,
                junction_station_code: departCode === hubStopCode ? hubStopCode : `${hubStopCode} / ${departCode}`,
                junction_station_name: `${leg1Stop?.station_name || hub} (Guaranteed Transit Junction)`,
                leg1: leg1Res,
                leg2: leg2Res,
                layover_minutes: layoverMins,
                layover_duration: formatDuration(layoverMins),
                layover_advice: `Guaranteed railway connection at ${leg1Stop?.station_name || hub} with a safe ${formatDuration(layoverMins)} transfer window.`,
                total_duration_minutes: totalDurationMins,
                total_duration: formatDuration(totalDurationMins),
                total_distance_km: totalDist,
                total_base_fare: totalF,
                ai_score: 84,
                ai_reason: `Guaranteed railway connective service via ${leg1Stop?.station_name || hub} interchange corridor. Board #${t1.train_number} ${t1.train_name} and switch to #${t2.train_number} ${t2.train_name}.`,
                ai_tags: ['Guaranteed Connection', `Via ${hub} Hub`],
                is_viable: true,
              });
            }
          }
        }
      }
      if (routes.length >= 4) break;
    }
  }

  // Sort connecting routes based on preference
  routes.sort((a, b) => {
    if (preference === 'Cheapest') return a.total_base_fare - b.total_base_fare;
    if (preference === 'Fastest') return a.total_duration_minutes - b.total_duration_minutes;
    return b.ai_score - a.ai_score;
  });

  // Deduplicate and return top diverse and optimal connections
  const uniqueKeys = new Set<string>();
  const topRoutes: ConnectingTrainRoute[] = [];
  for (const r of routes) {
    const key = `${r.junction_station_code}-${r.leg1.train_id}-${r.leg2.train_id}`;
    if (!uniqueKeys.has(key)) {
      uniqueKeys.add(key);
      topRoutes.push(r);
      if (topRoutes.length >= 8) break;
    }
  }

  return topRoutes;
}

// ============================================================================
// AUTOMATIC TRAIN RECOMMENDATION ENGINE & COPILOT TOOL FLOW
// ============================================================================

export const STATION_ALIASES: Record<string, string> = {
  // Tamil Nadu & Kerala
  'trichy': 'TPJ',
  'tiruchirappalli': 'TPJ',
  'tiruchchirappalli': 'TPJ',
  'tpj': 'TPJ',
  'coimbatore': 'CBE',
  'cbe': 'CBE',
  'kovai': 'CBE',
  'shoranur': 'SRR',
  'srr': 'SRR',
  'palakkad': 'PGT',
  'pgt': 'PGT',
  'palghat': 'PGT',
  'kozhikode': 'CLT',
  'clt': 'CLT',
  'calicut': 'CLT',
  'parpanangadi': 'PGI',
  'pgi': 'PGI',
  'tirur': 'TIR',
  'tir': 'TIR',
  'erode': 'ED',
  'ed': 'ED',
  'salem': 'SA',
  'sa': 'SA',
  'karur': 'KRR',
  'krr': 'KRR',
  'madurai': 'MDU',
  'mdu': 'MDU',
  'dindigul': 'DG',
  'dg': 'DG',
  'palani': 'PLNI',
  'plni': 'PLNI',
  'pollachi': 'POU',
  'pou': 'POU',
  'kovilpatti': 'CVP',
  'cvp': 'CVP',
  'tirunelveli': 'TEN',
  'ten': 'TEN',
  'nellai': 'TEN',
  'villupuram': 'VM',
  'vm': 'VM',
  'thanjavur': 'TJ',
  'tj': 'TJ',
  'tanjore': 'TJ',
  'tiruppur': 'TUP',
  'tup': 'TUP',
  'tirupur': 'TUP',
  'chennai': 'MAS',
  'chennai central': 'MAS',
  'mas': 'MAS',
  'chennai egmore': 'MS',
  'ms': 'MS',
  'karaikal': 'KIK',
  'kik': 'KIK',
  'ernakulam': 'ERS',
  'ers': 'ERS',
  'cochin': 'ERS',
  'kochi': 'ERS',
  'thrissur': 'TCR',
  'tcr': 'TCR',
  'trichur': 'TCR',
  'thiruvananthapuram': 'TVC',
  'tvc': 'TVC',
  'trivandrum': 'TVC',
  'kollam': 'QLN',
  'qln': 'QLN',
  'quilon': 'QLN',
  'alappuzha': 'ALLP',
  'allp': 'ALLP',
  'alleppey': 'ALLP',
  'kannur': 'CAN',
  'can': 'CAN',
  'cannanore': 'CAN',
  'mangaluru': 'MAQ',
  'maq': 'MAQ',
  'mangalore': 'MAQ',
  'kanyakumari': 'CAPE',
  'cape': 'CAPE',
  'kasaragod': 'KGQ',
  'kgq': 'KGQ',
  'puducherry': 'PDY',
  'pdy': 'PDY',
  'pondicherry': 'PDY',
  'rameshwaram': 'RMM',
  'rmm': 'RMM',

  // North, West, East & Central India
  'new delhi': 'NDLS',
  'delhi': 'NDLS',
  'ndls': 'NDLS',
  'anand vihar': 'ANVT',
  'anvt': 'ANVT',
  'kanpur': 'CNB',
  'kanpur central': 'CNB',
  'cnb': 'CNB',
  'lucknow': 'LKO',
  'lucknow charbagh': 'LKO',
  'lko': 'LKO',
  'amritsar': 'ASR',
  'asr': 'ASR',
  'ludhiana': 'LDH',
  'ldh': 'LDH',
  'jalandhar': 'JUC',
  'juc': 'JUC',
  'patna': 'PNBE',
  'pnbe': 'PNBE',
  'guwahati': 'GHY',
  'ghy': 'GHY',
  'ranchi': 'RNC',
  'rnc': 'RNC',
  'howrah': 'HWH',
  'kolkata': 'HWH',
  'calcutta': 'HWH',
  'hwh': 'HWH',
  'tatanagar': 'TATA',
  'tata': 'TATA',
  'jamshedpur': 'TATA',
  'mumbai': 'CSMT',
  'csmt': 'CSMT',
  'mumbai central': 'MMCT',
  'mmct': 'MMCT',
  'kalyan': 'KYN',
  'kyn': 'KYN',
  'ahmedabad': 'ADI',
  'adi': 'ADI',
  'gandhinagar': 'GNC',
  'gnc': 'GNC',
  'surat': 'ST',
  'st': 'ST',
  'vadodara': 'BRC',
  'brc': 'BRC',
  'bhopal': 'BPL',
  'bpl': 'BPL',
  'nagpur': 'NGP',
  'ngp': 'NGP',
  'bengaluru': 'SBC',
  'bangalore': 'SBC',
  'sbc': 'SBC',
  'hyderabad': 'HYB',
  'secunderabad': 'HYB',
  'hyb': 'HYB',
  'vijayawada': 'BZA',
  'bza': 'BZA',
  'visakhapatnam': 'VSKP',
  'vskp': 'VSKP',
  'vizag': 'VSKP',
  'bhubaneswar': 'BBS',
  'bbs': 'BBS',
  'goa': 'MAO',
  'madgaon': 'MAO',
  'mao': 'MAO',
  'agra': 'AGC',
  'agc': 'AGC',
  'gwalior': 'GWL',
  'gwl': 'GWL',
  'jhansi': 'VGLJ',
  'vglj': 'VGLJ',
  'itarsi': 'ET',
  'et': 'ET',
  'warangal': 'WL',
  'wl': 'WL',
  'renigunta': 'RU',
  'ru': 'RU',
  'bhusawal': 'BSL',
  'bsl': 'BSL',
  'kota': 'KOTA',
  'kota jn': 'KOTA',
};

const NLP_STOP_WORDS = new Set([
  'i', 'am', 'in', 'at', 'to', 'from', 'and', 'or', 'a', 'an', 'the',
  'is', 'it', 'can', 'take', 'train', 'trains', 'want', 'need', 'go',
  'reach', 'travel', 'by', 'for', 'with', 'my', 'me', 'how', 'all',
  'tomorrow', 'today', 'morning', 'evening', 'night', 'around', 'after', 'before'
]);

/**
 * 1. resolveStation()
 * Normalizes station names, codes, aliases, and city names using the station database.
 * Never guesses or fabricates stations.
 */
export function resolveStation(query: string): Station | undefined {
  if (!query) return undefined;
  const raw = query.trim();
  const clean = raw.toLowerCase()
    .replace(/\b(railway|station|junction|jn|terminal|central|main|city)\b/gi, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean || NLP_STOP_WORDS.has(clean) || clean.length < 2) return undefined;

  // 1. Direct uppercase station code match (2 to 5 letters)
  const upper = raw.toUpperCase();
  if (upper.length >= 2 && upper.length <= 5) {
    const codeMatch = STATIONS.find((s) => s.station_code === upper);
    if (codeMatch && !NLP_STOP_WORDS.has(upper.toLowerCase())) return codeMatch;
  }

  // 2. Exact alias lookup
  if (STATION_ALIASES[clean]) {
    const f = STATIONS.find((s) => s.station_code === STATION_ALIASES[clean]);
    if (f) return f;
  }
  if (STATION_ALIASES[raw.toLowerCase()]) {
    const f = STATIONS.find((s) => s.station_code === STATION_ALIASES[raw.toLowerCase()]);
    if (f) return f;
  }

  // 3. Station code match lowercase
  const byCode = STATIONS.find((s) => s.station_code.toLowerCase() === clean);
  if (byCode) return byCode;

  // 4. Exact city match
  const byCity = STATIONS.find((s) => s.city.toLowerCase() === clean);
  if (byCity) return byCity;

  // 5. Clean station name match (stripping junction/station)
  const byCleanName = STATIONS.find((s) => {
    const sClean = s.station_name.toLowerCase()
      .replace(/\b(railway|station|junction|jn|terminal|central|main|city)\b/gi, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return sClean === clean;
  });
  if (byCleanName) return byCleanName;

  return undefined;
}

export interface JourneyContext {
  source?: Station;
  destination?: Station;
  journeyDate?: string;
  journeyTime?: string;
  passengerCount?: number;
  preference?: string;
  lastTrains?: SearchResultTrain[];
  referencedTrain?: SearchResultTrain | null;
}

export interface ExtractedJourneyDetails {
  isJourneyQuery: boolean;
  sourceStation?: Station;
  destinationStation?: Station;
  journeyDate: string;
  journeyTime: string;
  passengerCount: number;
  preference: UserPreference;
  travelClass?: string;
  isOnlySourceProvided: boolean;
  isOnlyDestinationProvided: boolean;
  missingSource: boolean;
  missingDestination: boolean;
  missingFields?: string[];
  isFollowUp: boolean;
  followUpType?: 'FASTEST' | 'CHEAPEST' | 'FARE' | 'BOOK' | 'HOTELS' | 'EARLIEST' | 'DETAILS';
}

/**
 * Helper to locate all resolved station mentions in a text string
 */
function findStationsInText(text: string): Array<{ station: Station; start: number; end: number; phrase: string }> {
  const clean = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  const words = clean.split(/\s+/).filter(Boolean);
  const found: Array<{ station: Station; start: number; end: number; phrase: string }> = [];

  for (let len = 4; len >= 1; len--) {
    for (let i = 0; i <= words.length - len; i++) {
      const phrase = words.slice(i, i + len).join(' ');
      const stn = resolveStation(phrase);
      if (stn) {
        const overlaps = found.some((f) => (i >= f.start && i < f.end) || (i + len > f.start && i + len <= f.end));
        if (!overlaps) {
          found.push({
            station: stn,
            start: i,
            end: i + len,
            phrase,
          });
        }
      }
    }
  }

  found.sort((a, b) => a.start - b.start);
  return found;
}

/**
 * 2. extractJourneyDetails()
 * Extracts source, destination, date, time, passengers, preference, and class.
 * Handles diverse ways of expressing travel requests.
 */
export function extractJourneyDetails(
  userMessage: string,
  context?: JourneyContext
): ExtractedJourneyDetails {
  const text = (userMessage || '').trim();
  const lower = text.toLowerCase();
  const cleanWords = lower.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);

  // Follow-up intent checks
  let isFollowUp = false;
  let followUpType: ExtractedJourneyDetails['followUpType'] = undefined;

  if (
    lower.includes('which one is fastest') ||
    lower.includes('which is fastest') ||
    lower.includes('who is fastest') ||
    lower.includes('which is the fastest')
  ) {
    isFollowUp = true;
    followUpType = 'FASTEST';
  } else if (
    lower.includes('which is cheapest') ||
    lower.includes('which one is cheapest') ||
    lower.includes('lowest fare') ||
    lower.includes('lowest price')
  ) {
    isFollowUp = true;
    followUpType = 'CHEAPEST';
  } else if (
    lower.includes('what is its fare') ||
    lower.includes('what is the fare') ||
    lower.includes('how much is it') ||
    lower.includes('what is the price') ||
    lower.includes('tell me the fare')
  ) {
    isFollowUp = true;
    followUpType = 'FARE';
  } else if (
    lower.startsWith('book that') ||
    lower.startsWith('book this') ||
    lower.includes('book that one') ||
    lower.includes('book this train') ||
    lower.includes('book the fastest') ||
    lower.includes('book the cheapest') ||
    lower.startsWith('book it')
  ) {
    isFollowUp = true;
    followUpType = 'BOOK';
  } else if (
    lower.includes('hotel') ||
    lower.includes('stay') ||
    lower.includes('apartment') ||
    lower.includes('retiring room')
  ) {
    isFollowUp = true;
    followUpType = 'HOTELS';
  }

  // Passenger count extraction (default to context or 1)
  let passengerCount = context?.passengerCount || 1;
  const passMatch = lower.match(/(\d+)\s*(?:passenger|passengers|person|persons|people|traveler|travelers|pax|seats)/i);
  if (passMatch) {
    passengerCount = Math.max(1, parseInt(passMatch[1], 10));
  } else if (lower.match(/\bfor\s+(\d+)\b/i)) {
    const m = lower.match(/\bfor\s+(\d+)\b/i);
    if (m) passengerCount = Math.max(1, parseInt(m[1], 10));
  }

  // Date extraction
  let journeyDate = context?.journeyDate || new Date().toISOString().split('T')[0];
  const now = new Date();
  if (lower.includes('tomorrow')) {
    const tmr = new Date(now);
    tmr.setDate(now.getDate() + 1);
    journeyDate = tmr.toISOString().split('T')[0];
  } else if (lower.includes('day after tomorrow')) {
    const dat = new Date(now);
    dat.setDate(now.getDate() + 2);
    journeyDate = dat.toISOString().split('T')[0];
  } else if (lower.includes('today') || lower.includes('tonight')) {
    journeyDate = now.toISOString().split('T')[0];
  } else {
    // Check YYYY-MM-DD pattern
    const dateMatch = lower.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (dateMatch) journeyDate = dateMatch[1];
  }

  // Time extraction
  let journeyTime = context?.journeyTime || '08:00';
  if (lower.includes('tomorrow morning') || lower.includes('this morning') || lower.includes('morning')) {
    journeyTime = '08:00';
  } else if (lower.includes('afternoon')) {
    journeyTime = '13:00';
  } else if (lower.includes('tomorrow evening') || lower.includes('evening') || lower.includes('after 6')) {
    journeyTime = '18:00';
  } else if (lower.includes('tonight') || lower.includes('night')) {
    journeyTime = '20:30';
  }

  // Specific time pattern: e.g. "8 AM", "8:30 AM", "6 PM", "around 8 AM", "after 10 AM"
  const timeRegex = /(?:around|at|after|before)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i;
  const timeMatch = lower.match(timeRegex);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const period = timeMatch[3].toLowerCase();
    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    journeyTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // Preference extraction
  let preference: UserPreference = (context?.preference as UserPreference) || 'Best overall';
  if (
    lower.includes('fastest') ||
    lower.includes('fast') ||
    lower.includes('quick') ||
    lower.includes('shortest duration') ||
    lower.includes('less time')
  ) {
    preference = 'Fastest';
  } else if (
    lower.includes('cheapest') ||
    lower.includes('cheap') ||
    lower.includes('lowest fare') ||
    lower.includes('budget') ||
    lower.includes('economical') ||
    lower.includes('lowest price')
  ) {
    preference = 'Cheapest';
  } else if (
    lower.includes('leave early') ||
    lower.includes('earliest') ||
    lower.includes('early departure') ||
    lower.includes('first train')
  ) {
    preference = 'Earliest departure';
  } else if (
    lower.includes('comfortable') ||
    lower.includes('comfort') ||
    lower.includes('luxury') ||
    lower.includes('vande bharat')
  ) {
    preference = 'Comfortable journey';
  }

  // Class extraction
  let travelClass: string | undefined = undefined;
  if (lower.includes('sleeper') || lower.includes(' sl ')) travelClass = 'Sleeper';
  else if (lower.includes('3a') || lower.includes('3 tier') || lower.includes('third ac')) travelClass = 'AC 3 Tier';
  else if (lower.includes('2a') || lower.includes('2 tier') || lower.includes('second ac')) travelClass = 'AC 2 Tier';
  else if (lower.includes('1a') || lower.includes('first ac')) travelClass = 'First AC';
  else if (lower.includes('chair car') || lower.includes(' cc ')) travelClass = 'AC Chair Car';
  else if (lower.includes('2s') || lower.includes('second sitting')) travelClass = 'Second Class';

  // Station Extraction
  const foundStations = findStationsInText(text);

  let sourceStation: Station | undefined = undefined;
  let destinationStation: Station | undefined = undefined;

  if (foundStations.length >= 2) {
    const assignRoles = (stnObj: (typeof foundStations)[0]) => {
      const prev1 = cleanWords[stnObj.start - 1] || '';
      const prev2 = cleanWords[stnObj.start - 2] || '';
      const prev3 = cleanWords[stnObj.start - 3] || '';
      const prevWords = `${prev3} ${prev2} ${prev1}`.trim();

      if (
        prev1 === 'from' ||
        prev2 === 'from' ||
        prev1 === 'at' ||
        prev2 === 'at' ||
        prev1 === 'in' ||
        prevWords.includes('starting') ||
        prevWords.includes('board') ||
        prevWords.includes('currently')
      ) {
        return 'SOURCE';
      }
      if (
        prev1 === 'to' ||
        prev1 === 'towards' ||
        prev1 === 'reach' ||
        prev2 === 'reach' ||
        prevWords.includes('destination')
      ) {
        return 'DESTINATION';
      }
      return 'UNKNOWN';
    };

    const role0 = assignRoles(foundStations[0]);
    const role1 = assignRoles(foundStations[1]);

    if (role0 === 'SOURCE' && role1 !== 'SOURCE') {
      sourceStation = foundStations[0].station;
      destinationStation = foundStations[1].station;
    } else if (role0 === 'DESTINATION' && role1 !== 'DESTINATION') {
      destinationStation = foundStations[0].station;
      sourceStation = foundStations[1].station;
    } else if (role1 === 'DESTINATION') {
      destinationStation = foundStations[1].station;
      sourceStation = foundStations[0].station;
    } else if (role1 === 'SOURCE') {
      sourceStation = foundStations[1].station;
      destinationStation = foundStations[0].station;
    } else {
      sourceStation = foundStations[0].station;
      destinationStation = foundStations[1].station;
    }
  } else if (foundStations.length === 1) {
    const prev1 = cleanWords[foundStations[0].start - 1] || '';
    const prev2 = cleanWords[foundStations[0].start - 2] || '';
    const prevWords = `${prev2} ${prev1}`.trim();

    if (
      prev1 === 'to' ||
      prev1 === 'towards' ||
      prev1 === 'reach' ||
      prevWords.includes('destination')
    ) {
      destinationStation = foundStations[0].station;
      // Inherit source from context if known
      if (context?.source) {
        sourceStation = context.source;
      }
    } else {
      sourceStation = foundStations[0].station;
      // Inherit destination from context if known
      if (context?.destination) {
        destinationStation = context.destination;
      }
    }
  } else {
    // No stations detected in current message, inherit from context if follow-up
    if (context?.source) sourceStation = context.source;
    if (context?.destination) destinationStation = context.destination;
  }

  const isOnlySourceProvided = !!sourceStation && !destinationStation;
  const isOnlyDestinationProvided = !sourceStation && !!destinationStation;
  const missingSource = !sourceStation;
  const missingDestination = !destinationStation;

  const missingFields: string[] = [];
  if (missingSource) missingFields.push('Boarding Station / Source');
  if (missingDestination) missingFields.push('Destination Station');

  const isJourneyQuery =
    (!!sourceStation && !!destinationStation) ||
    isOnlySourceProvided ||
    isOnlyDestinationProvided ||
    lower.includes('train') ||
    lower.includes('travel') ||
    lower.includes('reach') ||
    lower.includes('to ') ||
    lower.includes('from ');

  return {
    isJourneyQuery,
    sourceStation,
    destinationStation,
    journeyDate,
    journeyTime,
    passengerCount,
    preference,
    travelClass,
    isOnlySourceProvided,
    isOnlyDestinationProvided,
    missingSource,
    missingDestination,
    missingFields,
    isFollowUp,
    followUpType,
  };
}

/**
 * 3. searchTrains()
 * Automatically queries actual available train data from the database.
 * Never invents trains, timings, or fares.
 */
export function searchTrains(params: {
  sourceCode: string;
  destCode: string;
  date?: string;
  time?: string;
  passengerCount?: number;
  preference?: UserPreference;
  travelClass?: string;
  includeDeparted?: boolean;
}): SearchResultTrain[] {
  const bCode = params.sourceCode.toUpperCase().trim();
  const dCode = params.destCode.toUpperCase().trim();
  const passCount = params.passengerCount || 1;
  const journeyDate = params.date || new Date().toISOString().split('T')[0];
  const journeyTime = params.time || '08:00';
  const preference = params.preference || 'Best overall';

  const matches: SearchResultTrain[] = [];

  for (const train of INITIAL_TRAINS) {
    const bIdx = train.stops.findIndex((s) => s.station_code.toUpperCase() === bCode);
    const dIdx = train.stops.findIndex((s) => s.station_code.toUpperCase() === dCode);

    if (bIdx !== -1 && dIdx !== -1 && bIdx < dIdx) {
      const evaluated = evaluateTrainSegment(
        train,
        bCode,
        dCode,
        journeyDate,
        journeyTime,
        preference,
        params.includeDeparted ?? true
      );

      if (evaluated) {
        // Recalculate total fare for passenger count
        const totalFareForPax = evaluated.base_fare * passCount;
        matches.push({
          ...evaluated,
          base_fare: evaluated.base_fare,
          total_fare: totalFareForPax,
          passenger_count: passCount,
        } as any);
      }
    }
  }

  // Sort based on requested preference
  if (preference === 'Cheapest') {
    matches.sort((a, b) => (a.base_fare || 0) - (b.base_fare || 0));
  } else if (preference === 'Fastest') {
    matches.sort((a, b) => a.journey_duration_minutes - b.journey_duration_minutes);
  } else if (preference === 'Earliest departure') {
    matches.sort((a, b) => a.departure_time.localeCompare(b.departure_time));
  } else {
    // Best overall
    matches.sort((a, b) => b.ai_score - a.ai_score);
  }

  return matches;
}

export interface RecommendedTrainItem {
  trainNumber: string;
  trainName: string;
  trainType: string;
  source: string;
  sourceCode: string;
  destination: string;
  destinationCode: string;
  departure: string;
  arrival: string;
  duration: string;
  durationMinutes: number;
  fare: string;
  totalFare: number;
  classes: string[];
  stops: number;
  runningDays: string;
  status: string;
  category: string;
  explanation: string;
  rawTrain: SearchResultTrain;
}

export interface TrainRecommendationsResult {
  type: 'train_recommendations';
  source: {
    name: string;
    code: string;
  };
  destination: {
    name: string;
    code: string;
  };
  trains: RecommendedTrainItem[];
  recommendations: {
    recommended?: RecommendedTrainItem;
    fastest?: RecommendedTrainItem;
    cheapest?: RecommendedTrainItem;
    earliest?: RecommendedTrainItem;
    comfortable?: RecommendedTrainItem;
  };
  explanation: string;
}

/**
 * 4. recommendTrains()
 * Analyzes train search results and assigns categorized recommendations:
 * ⭐ RECOMMENDED, ⚡ FASTEST, 💰 LOWEST FARE, 🌅 EARLIEST, 🛋️ COMFORTABLE.
 * Generates transparent, factual explanations grounded strictly in train data.
 */
export function recommendTrains(
  trains: SearchResultTrain[],
  options?: {
    preference?: UserPreference;
    queryTime?: string;
    passengerCount?: number;
    sourceStation?: Station;
    destinationStation?: Station;
  }
): TrainRecommendationsResult {
  const pref = options?.preference || 'Best overall';
  const pax = options?.passengerCount || 1;

  const srcStn = options?.sourceStation || {
    station_name: trains[0]?.boarding_stop?.station_name || trains[0]?.source || 'Source',
    station_code: trains[0]?.boarding_stop?.station_code || trains[0]?.source_code || 'SRC',
    station_id: 1,
    city: trains[0]?.boarding_stop?.station_name || 'Source',
    state: '',
  };

  const dstStn = options?.destinationStation || {
    station_name: trains[0]?.destination_stop?.station_name || trains[0]?.destination || 'Destination',
    station_code: trains[0]?.destination_stop?.station_code || trains[0]?.destination_code || 'DST',
    station_id: 2,
    city: trains[0]?.destination_stop?.station_name || 'Destination',
    state: '',
  };

  if (!trains || trains.length === 0) {
    return {
      type: 'train_recommendations',
      source: { name: srcStn.station_name, code: srcStn.station_code },
      destination: { name: dstStn.station_name, code: dstStn.station_code },
      trains: [],
      recommendations: {},
      explanation: 'No suitable trains were found for this journey.',
    };
  }

  // 1. Identify Fastest Train
  const fastestTrain = [...trains].sort((a, b) => a.journey_duration_minutes - b.journey_duration_minutes)[0];

  // 2. Identify Lowest Fare Train
  const cheapestTrain = [...trains].sort((a, b) => a.base_fare - b.base_fare)[0];

  // 3. Identify Earliest Train
  const queryTime = options?.queryTime || '08:00';
  const earliestTrain = [...trains].sort((a, b) => {
    const diffA = timeToMinutes(a.departure_time) - timeToMinutes(queryTime);
    const diffB = timeToMinutes(b.departure_time) - timeToMinutes(queryTime);
    const normA = diffA >= 0 ? diffA : diffA + 1440;
    const normB = diffB >= 0 ? diffB : diffB + 1440;
    return normA - normB;
  })[0];

  // 4. Identify Comfortable Train
  const comfortableTrain = [...trains].sort((a, b) => {
    const comfortRank = (t: SearchResultTrain) => {
      let r = 50;
      if (t.train_type === 'Vande Bharat') r += 45;
      else if (t.train_type === 'Tejas' || t.train_type === 'Rajdhani') r += 40;
      else if (t.train_type === 'Superfast') r += 25;
      else if (t.train_type === 'Express') r += 15;
      r -= (t.stops_between_count || 0) * 2;
      return r;
    };
    return comfortRank(b) - comfortRank(a);
  })[0];

  // 5. Identify Best Overall / Recommended Train
  let recommendedTrain: SearchResultTrain = trains[0];
  if (pref === 'Fastest') recommendedTrain = fastestTrain;
  else if (pref === 'Cheapest') recommendedTrain = cheapestTrain;
  else if (pref === 'Earliest departure') recommendedTrain = earliestTrain;
  else if (pref === 'Comfortable journey') recommendedTrain = comfortableTrain;
  else {
    // Best Overall: highest ai_score or balanced choice
    recommendedTrain = [...trains].sort((a, b) => b.ai_score - a.ai_score)[0];
  }

  // Helper to construct item
  const buildItem = (t: SearchResultTrain, category: string, reason: string): RecommendedTrainItem => {
    const classList = t.calculated_classes?.map((c) => `${c.class_name}: ₹${c.fare * pax}`) || [
      `Sleeper: ₹${t.base_fare * pax}`,
    ];
    const daysStr = t.runs_on_days?.join(', ') || 'Daily (Mon, Tue, Wed, Thu, Fri, Sat, Sun)';

    return {
      trainNumber: t.train_number,
      trainName: t.train_name,
      trainType: t.train_type,
      source: t.boarding_stop?.station_name || t.source,
      sourceCode: t.boarding_stop?.station_code || t.source_code,
      destination: t.destination_stop?.station_name || t.destination,
      destinationCode: t.destination_stop?.station_code || t.destination_code,
      departure: t.departure_time,
      arrival: t.arrival_time,
      duration: t.journey_duration,
      durationMinutes: t.journey_duration_minutes,
      fare: `₹${t.base_fare * pax}`,
      totalFare: t.base_fare * pax,
      classes: classList,
      stops: t.stops_between_count ?? 0,
      runningDays: daysStr,
      status: t.live_status?.status || 'On Time',
      category,
      explanation: reason,
      rawTrain: t,
    };
  };

  const recItem = buildItem(
    recommendedTrain,
    '⭐ RECOMMENDED',
    `⭐ I recommend Train ${recommendedTrain.train_number} because it provides a suitable departure time and direct journey to your destination.`
  );

  const fastItem = buildItem(
    fastestTrain,
    '⚡ FASTEST',
    `⚡ Train ${fastestTrain.train_number} is the quickest option, reaching in ${fastestTrain.journey_duration} with ${fastestTrain.stops_between_count || 0} stops.`
  );

  const cheapItem = buildItem(
    cheapestTrain,
    '💰 LOWEST FARE',
    `💰 Train ${cheapestTrain.train_number} offers the lowest fare starting at ₹${cheapestTrain.base_fare * pax}${pax > 1 ? ` for ${pax} passengers` : ''}.`
  );

  const earlyItem = buildItem(
    earliestTrain,
    '🌅 EARLIEST',
    `🌅 Train ${earliestTrain.train_number} provides the earliest departure at ${earliestTrain.departure_time}.`
  );

  const comfortItem = buildItem(
    comfortableTrain,
    '🛋️ COMFORTABLE',
    `🛋️ Train ${comfortableTrain.train_number} (${comfortableTrain.train_type}) offers superior ride comfort with modern coach amenities.`
  );

  // Collect distinct recommended items
  const itemsMap = new Map<string, RecommendedTrainItem>();
  itemsMap.set(recItem.trainNumber, recItem);
  if (!itemsMap.has(fastItem.trainNumber)) itemsMap.set(fastItem.trainNumber, fastItem);
  if (!itemsMap.has(cheapItem.trainNumber)) itemsMap.set(cheapItem.trainNumber, cheapItem);
  if (!itemsMap.has(earlyItem.trainNumber)) itemsMap.set(earlyItem.trainNumber, earlyItem);
  if (!itemsMap.has(comfortItem.trainNumber)) itemsMap.set(comfortItem.trainNumber, comfortItem);

  // Add remaining trains up to 6
  for (const t of trains) {
    if (!itemsMap.has(t.train_number)) {
      itemsMap.set(
        t.train_number,
        buildItem(t, '🚆 DIRECT EXPRESS', `Direct rail service from ${srcStn.station_name} to ${dstStn.station_name}.`)
      );
      if (itemsMap.size >= 6) break;
    }
  }

  const itemsList = Array.from(itemsMap.values());

  return {
    type: 'train_recommendations',
    source: { name: srcStn.station_name, code: srcStn.station_code },
    destination: { name: dstStn.station_name, code: dstStn.station_code },
    trains: itemsList,
    recommendations: {
      recommended: recItem,
      fastest: fastItem,
      cheapest: cheapItem,
      earliest: earlyItem,
      comfortable: comfortItem,
    },
    explanation: recItem.explanation,
  };
}

