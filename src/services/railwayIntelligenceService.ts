import { Station, SearchResultTrain, Booking, ConnectingTrainRoute } from '../types';
import { STATIONS, INITIAL_TRAINS } from '../../server/railwayData';
import {
  resolveStation as resolveStationEngine,
  extractJourneyDetails as extractJourneyDetailsEngine,
  searchTrains as searchTrainsEngine,
  recommendTrains as recommendTrainsEngine,
  STATION_ALIASES as ENGINE_ALIASES,
} from '../../server/aiEngine';
import type {
  TrainRecommendationsResult,
  RecommendedTrainItem,
} from '../../server/aiEngine';

export const resolveStation = resolveStationEngine;
export const extractJourneyDetails = extractJourneyDetailsEngine;
export const searchTrains = searchTrainsEngine;
export const recommendTrains = recommendTrainsEngine;
export type { TrainRecommendationsResult, RecommendedTrainItem };

export interface ParsedRailwayQuery {
  intent:
    | 'SEARCH_TRAINS'
    | 'COMPARE_TRAINS'
    | 'LIVE_STATUS'
    | 'MISSED_TRAIN'
    | 'HOTELS_NEAR_JUNCTION'
    | 'VIEW_TICKET'
    | 'PRINT_TICKET'
    | 'FARE_CALCULATION'
    | 'INTERMEDIATE_STOPS'
    | 'GENERAL_QUESTION';
  sourceStation?: Station;
  destinationStation?: Station;
  targetStation?: Station; // For single-station queries like hotels or arrivals
  dateStr?: string;
  timeStr?: string;
  passengerCount?: number;
  preference?: 'Cheapest' | 'Fastest' | 'Earliest departure' | 'Comfortable' | 'Best overall';
  travelClass?: string;
  trainNumberOrName?: string;
  comparisonTrainIds?: string[];
  missingFields: string[];
}

// Comprehensive aliases mapping common names, nicknames, and codes to canonical station code
const STATION_ALIASES: Record<string, string> = {
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

export const railwayIntelligenceService = {
  /**
   * Resolves any input text into a canonical Station object
   */
  resolveStation: resolveStationEngine,

  /**
   * Extracts journey parameters and travel intents
   */
  extractJourneyDetails,

  /**
   * Searches trains from official dataset
   */
  searchTrains: searchTrainsEngine,

  /**
   * Evaluates and categorizes recommendations
   */
  recommendTrains: recommendTrainsEngine,

  /**
   * Extracts natural language parameters from user query
   */
  parseQuery(userText: string, context?: { source?: Station; destination?: Station; lastTrains?: SearchResultTrain[]; activeBooking?: Booking | null; passengerCount?: number; preference?: string }): ParsedRailwayQuery {
    const text = userText.toLowerCase().trim();
    const missingFields: string[] = [];

    // Intent detection
    let intent: ParsedRailwayQuery['intent'] = 'GENERAL_QUESTION';

    if (text.includes('hotel') || text.includes('stay') || text.includes('lodge') || text.includes('apartment') || text.includes('accommodation') || text.includes('room near')) {
      intent = 'HOTELS_NEAR_JUNCTION';
    } else if (text.includes('missed') || text.includes('left already') || text.includes('miss train')) {
      intent = 'MISSED_TRAIN';
    } else if (text.includes('compare') || text.includes('difference between') || text.includes('vs')) {
      intent = 'COMPARE_TRAINS';
    } else if (text.includes('print') && (text.includes('ticket') || text.includes('pnr') || text.includes('pdf'))) {
      intent = 'PRINT_TICKET';
    } else if (text.includes('ticket') || text.includes('my booking') || text.includes('pnr')) {
      intent = 'VIEW_TICKET';
    } else if (text.includes('where is') || text.includes('live status') || text.includes('running status') || text.includes('train location') || text.includes('is it late') || text.includes('delay')) {
      intent = 'LIVE_STATUS';
    } else if (text.includes('between') && (text.includes('stop') || text.includes('station') || text.includes('route'))) {
      intent = 'INTERMEDIATE_STOPS';
    } else if (text.includes('how much') || text.includes('fare for') || text.includes('cost for') || text.includes('price for')) {
      intent = 'FARE_CALCULATION';
    } else if (
      text.includes('train') ||
      text.includes('to') ||
      text.includes('from') ||
      text.includes('fastest') ||
      text.includes('cheapest') ||
      text.includes('earliest') ||
      text.includes('reach') ||
      text.includes('travel') ||
      text.includes('take') ||
      text.includes('go') ||
      text.includes('suggest')
    ) {
      intent = 'SEARCH_TRAINS';
    }

    // Extract robust details via AI engine
    const details = extractJourneyDetails(userText, {
      source: context?.source,
      destination: context?.destination,
      lastTrains: context?.lastTrains,
      passengerCount: context?.passengerCount,
      preference: context?.preference,
    });

    let targetStation: Station | undefined = details.destinationStation || details.sourceStation;
    if (intent === 'HOTELS_NEAR_JUNCTION') {
      targetStation = details.destinationStation || details.sourceStation || context?.destination || context?.source;
    }

    return {
      intent,
      sourceStation: details.sourceStation,
      destinationStation: details.destinationStation,
      targetStation,
      dateStr: details.journeyDate,
      timeStr: details.journeyTime,
      passengerCount: details.passengerCount,
      preference: details.preference as any,
      travelClass: details.travelClass,
      missingFields: details.missingFields,
    };
  },

  /**
   * Search real application trains using bundled dataset
   */
  searchTrains(params: {
    sourceCode: string;
    destCode: string;
    date?: string;
    time?: string;
    preference?: string;
    travelClass?: string;
    passengerCount?: number;
  }) {
    const bCode = params.sourceCode.toUpperCase();
    const dCode = params.destCode.toUpperCase();
    const passCount = params.passengerCount || 1;

    // Filter trains that stop at both source and destination in order
    const directMatches: any[] = [];

    for (const train of INITIAL_TRAINS) {
      const bIdx = train.stops.findIndex((s) => s.station_code.toUpperCase() === bCode);
      const dIdx = train.stops.findIndex((s) => s.station_code.toUpperCase() === dCode);

      if (bIdx !== -1 && dIdx !== -1 && bIdx < dIdx) {
        const bStop = train.stops[bIdx];
        const dStop = train.stops[dIdx];
        const stopsCount = Math.max(0, dIdx - bIdx - 1);
        const distKm = Math.max(30, dStop.distance_km - bStop.distance_km);

        // Calculate dynamic classes
        const classes = train.classes.map((cls) => {
          const fare = Math.round(Math.max(cls.base_fare * 0.4, cls.fare_per_km * distKm + cls.base_fare * 0.35));
          return {
            class_name: cls.class_name,
            fare,
            total_fare_for_passengers: fare * passCount,
            available_seats: cls.available_seats,
          };
        });

        // Filter by class if specified
        if (params.travelClass && !classes.some((c) => c.class_name.toLowerCase().includes(params.travelClass!.toLowerCase()))) {
          continue;
        }

        const minFare = classes.length > 0 ? Math.min(...classes.map((c) => c.fare)) : ((train as any).base_fare || 250);
        const totalFare = minFare * passCount;

        // Check if train has already departed today relative to search time
        const searchTime = params.time || '08:00';
        const hasDeparted = params.date === new Date().toISOString().split('T')[0] && bStop.departure_time < searchTime;

        directMatches.push({
          ...train,
          boarding_stop: bStop,
          destination_stop: dStop,
          departure_time: bStop.departure_time,
          arrival_time: dStop.arrival_time,
          journey_distance_km: distKm,
          stops_count: stopsCount,
          calculated_classes: classes,
          min_fare: minFare,
          total_fare: totalFare,
          passenger_count: passCount,
          has_departed: hasDeparted,
          intermediate_stops: train.stops.slice(bIdx, dIdx + 1),
        });
      }
    }

    // Sort by user preference
    if (params.preference === 'Cheapest') {
      directMatches.sort((a, b) => a.total_fare - b.total_fare);
    } else if (params.preference === 'Fastest') {
      directMatches.sort((a, b) => a.journey_duration_minutes - b.journey_duration_minutes);
    } else if (params.preference === 'Earliest departure') {
      directMatches.sort((a, b) => a.departure_time.localeCompare(b.departure_time));
    }

    return directMatches;
  },

  /**
   * Generates factual comparison between two trains
   */
  compareTwoTrains(t1: any, t2: any, passengerCount: number = 1): {
    table: Array<{ feature: string; train1: string; train2: string }>;
    analysis: string;
  } {
    const f1 = (t1.min_fare || t1.base_fare) * passengerCount;
    const f2 = (t2.min_fare || t2.base_fare) * passengerCount;

    const table = [
      { feature: 'Train Number & Name', train1: `#${t1.train_number} ${t1.train_name}`, train2: `#${t2.train_number} ${t2.train_name}` },
      { feature: 'Train Type', train1: t1.train_type, train2: t2.train_type },
      { feature: 'Departure Time', train1: t1.departure_time || t1.source_time, train2: t2.departure_time || t2.source_time },
      { feature: 'Arrival Time', train1: t1.arrival_time || t1.dest_time, train2: t2.arrival_time || t2.dest_time },
      { feature: 'Journey Duration', train1: t1.journey_duration, train2: t2.journey_duration },
      { feature: `Fare (${passengerCount} pax)`, train1: `₹${f1}`, train2: `₹${f2}` },
      { feature: 'Intermediate Stops', train1: `${t1.stops_count || t1.stops?.length || 0} stops`, train2: `${t2.stops_count || t2.stops?.length || 0} stops` },
      { feature: 'Live Running Status', train1: t1.live_status?.status || 'On Time', train2: t2.live_status?.status || 'On Time' },
    ];

    let analysis = '';
    if (f1 < f2 && t1.journey_duration_minutes <= t2.journey_duration_minutes) {
      analysis = `#${t1.train_number} ${t1.train_name} is superior in both fare (₹${f1} vs ₹${f2}) and duration (${t1.journey_duration}).`;
    } else if (f1 < f2) {
      analysis = `#${t1.train_number} is more economical (saving ₹${f2 - f1} total), while #${t2.train_number} is faster by comparison.`;
    } else {
      analysis = `#${t2.train_number} offers lower total fare (₹${f2}), making it the budget pick for ${passengerCount} traveler(s).`;
    }

    return { table, analysis };
  },

  /**
   * Retrieves intermediate stops between two stations in exact sequence order
   */
  getIntermediateStops(sourceCode: string, destCode: string): Array<{ station_name: string; station_code: string; distance_km: number }> {
    const bCode = sourceCode.toUpperCase();
    const dCode = destCode.toUpperCase();

    for (const train of INITIAL_TRAINS) {
      const bIdx = train.stops.findIndex((s) => s.station_code.toUpperCase() === bCode);
      const dIdx = train.stops.findIndex((s) => s.station_code.toUpperCase() === dCode);

      if (bIdx !== -1 && dIdx !== -1 && bIdx < dIdx) {
        return train.stops.slice(bIdx, dIdx + 1).map((s) => ({
          station_name: s.station_name,
          station_code: s.station_code,
          distance_km: s.distance_km,
        }));
      }
    }

    return [];
  },
};
