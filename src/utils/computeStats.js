import { format } from 'date-fns';

// Attendance records in this project store status as 'Present' / 'Day Off' /
// 'Absent' / 'Weekend', and `hours` as a formatted string ('8.30', '0.00').
export function computeMonthStats(records, monthKey) {
  const present = records
    .filter(r =>
      typeof r.date === 'string' &&
      r.date.startsWith(monthKey) &&
      r.status === 'Present' &&
      parseFloat(r.hours) > 0
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  // Consecutive working days present, counting backwards. Weekends don't break it.
  let streak = 0;
  const cursor = new Date();
  const presentDates = new Set(present.map(r => r.date));

  for (let i = 0; i < 60; i++) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      if (presentDates.has(format(cursor, 'yyyy-MM-dd'))) streak++;
      else if (i > 0) break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    daysPresent: present.length,
    currentStreak: streak,
    lastMarked: present.at(-1)?.date ?? null,
  };
}
