/**
 * Utility functions for calculating and formatting segment dates and journey timings.
 */

/**
 * Calculates a formatted date based on a base journey date string (YYYY-MM-DD or readable) and day offset.
 * Example: baseDate "2026-09-24", dayOffset 0 -> "Thu, 24 Sep 2026"
 * Example: baseDate "2026-09-24", dayOffset 1 -> "Fri, 25 Sep 2026"
 */
export function formatSegmentDate(
  baseDateStr?: string,
  dayOffset: number = 0,
  includeWeekday: boolean = true
): string {
  let base: Date;
  if (baseDateStr) {
    const parts = baseDateStr.split('-');
    if (parts.length === 3) {
      base = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      const parsed = Date.parse(baseDateStr);
      base = isNaN(parsed) ? new Date() : new Date(parsed);
    }
  } else {
    base = new Date();
  }

  // Add day offset
  const targetDate = new Date(base.getTime() + dayOffset * 24 * 60 * 60 * 1000);

  const options: Intl.DateTimeFormatOptions = includeWeekday
    ? { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }
    : { day: 'numeric', month: 'short', year: 'numeric' };

  return targetDate.toLocaleDateString('en-IN', options);
}

/**
 * Formats a short date like "24 Sep 2026"
 */
export function formatShortDate(baseDateStr?: string, dayOffset: number = 0): string {
  return formatSegmentDate(baseDateStr, dayOffset, false);
}

/**
 * Computes calendar dates for a two-leg connecting journey based on journey_date,
 * arrival/departure times, and layover minutes.
 */
export function computeConnectingRouteDates(
  baseJourneyDate: string | undefined,
  leg1DepTime: string,
  leg1ArrTime: string,
  leg1DayOffset: number = 0,
  layoverMinutes: number = 0,
  leg2DurationMinutes: number = 0
) {
  const leg1DepDate = formatSegmentDate(baseJourneyDate, leg1DayOffset, true);
  const leg1ShortDepDate = formatShortDate(baseJourneyDate, leg1DayOffset);

  // Check if leg 1 arrives next day
  const [depH, depM] = leg1DepTime.split(':').map((n) => parseInt(n, 10) || 0);
  const [arrH, arrM] = leg1ArrTime.split(':').map((n) => parseInt(n, 10) || 0);
  const leg1DepMins = depH * 60 + depM;
  const leg1ArrMins = arrH * 60 + arrM;

  let leg1ArrDayOffset = leg1DayOffset;
  if (leg1ArrMins < leg1DepMins) {
    leg1ArrDayOffset += 1;
  }

  const leg1ArrDate = formatSegmentDate(baseJourneyDate, leg1ArrDayOffset, true);
  const leg1ShortArrDate = formatShortDate(baseJourneyDate, leg1ArrDayOffset);

  // Transfer date
  const transferDayOffset = leg1ArrDayOffset;
  const transferDate = formatSegmentDate(baseJourneyDate, transferDayOffset, true);

  // Leg 2 departure day offset based on layover
  const leg2DepMinsTotal = leg1ArrMins + layoverMinutes;
  const leg2DayOffset = leg1ArrDayOffset + Math.floor(leg2DepMinsTotal / 1440);
  const leg2DepDate = formatSegmentDate(baseJourneyDate, leg2DayOffset, true);
  const leg2ShortDepDate = formatShortDate(baseJourneyDate, leg2DayOffset);

  // Leg 2 arrival day offset
  const leg2DepMinsInDay = leg2DepMinsTotal % 1440;
  const leg2ArrMinsTotal = leg2DepMinsInDay + leg2DurationMinutes;
  const leg2ArrDayOffset = leg2DayOffset + Math.floor(leg2ArrMinsTotal / 1440);
  const leg2ArrDate = formatSegmentDate(baseJourneyDate, leg2ArrDayOffset, true);
  const leg2ShortArrDate = formatShortDate(baseJourneyDate, leg2ArrDayOffset);

  return {
    leg1DepDate,
    leg1ShortDepDate,
    leg1ArrDate,
    leg1ShortArrDate,
    transferDate,
    leg2DepDate,
    leg2ShortDepDate,
    leg2ArrDate,
    leg2ShortArrDate,
    isOvernight: leg2ArrDayOffset > leg1DayOffset,
  };
}
