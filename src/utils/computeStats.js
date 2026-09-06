import { format } from 'date-fns';

// Consecutive working days present, counting backwards from today. Weekends
// don't break it. Only meaningful for the current month, hence the guard in
// computeMonthStats below.
function computeStreak(presentDates) {
  let streak = 0;
  const cursor = new Date();

  for (let i = 0; i < 60; i++) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      if (presentDates.has(format(cursor, 'yyyy-MM-dd'))) streak++;
      else if (i > 0) break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

// Attendance records in this project store status as 'Present' / 'Day Off' /
// 'Absent' / 'Weekend', and `hours` as a formatted string ('8.30', '0.00').
//
// currentStreak is null — not 0 — for any month other than the current one,
// because the streak walks backwards from today and cannot describe a past
// month. A real zero and "not applicable" must not look alike.
export function computeMonthStats(records, monthKey) {
  const isCurrentMonth = monthKey === format(new Date(), 'yyyy-MM');

  const present = records
    .filter(r =>
      typeof r.date === 'string' &&
      r.date.startsWith(monthKey) &&
      r.status === 'Present' &&
      parseFloat(r.hours) > 0
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const dates = present.map(r => r.date);

  return {
    daysPresent: present.length,
    currentStreak: isCurrentMonth ? computeStreak(new Set(dates)) : null,
    lastMarked: dates.at(-1) ?? null,
  };
}
