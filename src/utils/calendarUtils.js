// Shared calendar helpers for the admin panel. Dates are always local
// YYYY-MM-DD strings - never parsed with `new Date(str)` directly, since
// that string form is parsed as UTC and rolls the day at UTC+5:30.

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Mon-first order, matching the export's week blocks and the reference chart's axis.
export const MON_FIRST_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const pad = n => String(n).padStart(2, '0');

/** Parses a local YYYY-MM-DD string into its Date, Sun=0..Sat=6 weekday index. */
export function weekdayIndexOf(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

/** Computed from the date, not trusted from a stored field - a bad stored
 *  value should show as a mismatch, not silently pass through. */
export function weekdayLabelOf(dateKey) {
  return WEEKDAY_LABELS[weekdayIndexOf(dateKey)];
}

export function isWeekendIndex(dayIndex) {
  return dayIndex === 0 || dayIndex === 6;
}

/** Every day of the month as a local YYYY-MM-DD string, in order. */
export function daysInMonth(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const count = new Date(year, month + 1, 0).getDate();
  const out = [];
  for (let d = 1; d <= count; d++) {
    out.push(`${year}-${pad(month + 1)}-${pad(d)}`);
  }
  return out;
}

/** Monday of the week containing `d`. */
export function mondayOf(d) {
  const out = new Date(d);
  const dow = out.getDay();
  out.setDate(out.getDate() + (dow === 0 ? -6 : 1 - dow));
  out.setHours(0, 0, 0, 0);
  return out;
}

/** Which Monday-start week block (0-indexed) a date key falls into, for the
 *  same week-block scheme generateTeamTimesheet.js lays out in the export. */
export function weekBlockIndexOf(dateKey, monthDate) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const firstMonday = mondayOf(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1));
  return Math.floor((date - firstMonday) / (7 * 24 * 60 * 60 * 1000));
}
