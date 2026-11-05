// Weekend pay rate is an unconfirmed inference (see admin plan Section 9.1):
// reconciling the sample payment sheet against four of five staff at
// Rs. 240/hr implies weekend hours are paid at Rs. 300/hr. Kept as a
// parameter with a visible default - never a hard-coded constant - until
// confirmed, and shown wherever pay is calculated so the assumption stays
// visible rather than buried in a formula.
export const DEFAULT_RATES = Object.freeze({ weekdayRate: 240, weekendRate: 300 });

/** True for Saturday/Sunday, given a local YYYY-MM-DD date key. */
export function isWeekendDateKey(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return dow === 0 || dow === 6;
}
