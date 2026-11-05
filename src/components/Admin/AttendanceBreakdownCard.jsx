import React, { useMemo } from 'react';
import { Info } from 'lucide-react';
import { daysInMonth, weekdayIndexOf, isWeekendIndex } from '../../utils/calendarUtils';

/**
 * "Assignment Breakdown" equivalent - how this month's staff-days split
 * between weekday attendance, weekend attendance (the premium-rate case),
 * and days with nothing logged.
 */
function computeBreakdown(staff, monthDate) {
  const days = daysInMonth(monthDate);
  let weekdayPresent = 0;
  let weekendPresent = 0;

  staff.forEach(s => {
    const byDate = new Map((s.records || []).map(r => [r.date, r]));
    days.forEach(dateKey => {
      const rec = byDate.get(dateKey);
      const hours = rec ? Number(rec.hours) || 0 : 0;
      if (hours <= 0) return;
      if (isWeekendIndex(weekdayIndexOf(dateKey))) weekendPresent++;
      else weekdayPresent++;
    });
  });

  const totalSlots = staff.length * days.length;
  const remaining = Math.max(0, totalSlots - weekdayPresent - weekendPresent);

  return { weekdayPresent, weekendPresent, remaining, totalSlots };
}

const AttendanceBreakdownCard = ({ staff, monthDate }) => {
  const { weekdayPresent, weekendPresent, remaining, totalSlots } = useMemo(
    () => computeBreakdown(staff, monthDate),
    [staff, monthDate]
  );

  const pct = n => (totalSlots > 0 ? (n / totalSlots) * 100 : 0);

  return (
    <div className="bg-white border border-gray-100 rounded-[20px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-gray-900">Attendance breakdown</h3>
        <Info className="w-4 h-4 text-gray-300" />
      </div>

      <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-gray-100">
        {weekdayPresent > 0 && <div className="bg-emerald-400" style={{ width: `${pct(weekdayPresent)}%` }} />}
        {weekendPresent > 0 && <div className="bg-violet-400" style={{ width: `${pct(weekendPresent)}%` }} />}
      </div>

      <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 mt-4">
        <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Weekday present
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <span className="w-2 h-2 rounded-full bg-violet-400" /> Weekend present
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <span className="w-2 h-2 rounded-full bg-gray-200" /> No entry
        </span>
      </div>
    </div>
  );
};

export default AttendanceBreakdownCard;
