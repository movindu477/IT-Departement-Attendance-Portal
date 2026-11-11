import React, { useMemo } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { daysInMonth, weekdayIndexOf, isWeekendIndex } from '../../utils/calendarUtils';

/**
 * "Patient Demographics" equivalent - how this month's staff-days split
 * between weekday attendance, weekend attendance (the premium-rate case),
 * and days with nothing logged. Percentages are real; there are no
 * month-over-month deltas shown, since computing those would mean a second
 * month's worth of attendance queries for a cosmetic number.
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

  const pct = n => (totalSlots > 0 ? Math.round((n / totalSlots) * 100) : 0);
  const widthPct = n => (totalSlots > 0 ? (n / totalSlots) * 100 : 0);

  return (
    <div className="bg-white rounded-[22px] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold text-slate-900">Staff Demographics</h3>
        <MoreHorizontal className="w-4 h-4 text-slate-300" />
      </div>

      <div className="flex items-center flex-wrap gap-x-8 gap-y-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-[12px] text-slate-500">Weekday</span>
          <span className="text-[13px] font-semibold text-slate-900">{pct(weekdayPresent)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-[12px] text-slate-500">Weekend</span>
          <span className="text-[13px] font-semibold text-slate-900">{pct(weekendPresent)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[12px] text-slate-500">No entry</span>
          <span className="text-[13px] font-semibold text-slate-900">{pct(remaining)}%</span>
        </div>
      </div>

      <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100">
        {weekdayPresent > 0 && (
          <div className="bg-gradient-to-r from-blue-400 to-blue-300" style={{ width: `${widthPct(weekdayPresent)}%` }} />
        )}
        {weekendPresent > 0 && (
          <div className="bg-gradient-to-r from-amber-400 to-amber-300" style={{ width: `${widthPct(weekendPresent)}%` }} />
        )}
        {remaining > 0 && (
          <div className="bg-gradient-to-r from-emerald-400 to-emerald-300" style={{ width: `${widthPct(remaining)}%` }} />
        )}
      </div>
    </div>
  );
};

export default AttendanceBreakdownCard;
