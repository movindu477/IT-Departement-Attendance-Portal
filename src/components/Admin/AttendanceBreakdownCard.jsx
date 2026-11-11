import React, { useMemo } from 'react';
import { AlignJustify } from 'lucide-react';
import { daysInMonth, weekdayIndexOf, isWeekendIndex } from '../../utils/calendarUtils';
import { useSmoothNumber } from '../../hooks/useSmoothNumber';

/**
 * "Patient Demographics" equivalent on the Admin dashboard - stepped gradient
 * skyline breakdown of Weekday attendance, Weekend attendance, and Unlogged
 * days with smooth 2.2s count-up and bar growth animations.
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

  const animWeekday = useSmoothNumber(pct(weekdayPresent), 2200);
  const animWeekend = useSmoothNumber(pct(weekendPresent), 2200);
  const animRemaining = useSmoothNumber(pct(remaining), 2200);
  const animBarFill = useSmoothNumber(100, 2200);

  return (
    <div className="bg-[#F2F4F7] rounded-[20px] p-5 border border-white/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)] flex flex-col justify-between min-h-[218px] h-full">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="text-[16px] font-medium text-[#1A1D21] tracking-tight">
          Staff Demographics
        </h3>
        <button
          type="button"
          className="w-8 h-8 rounded-[10px] bg-[#E4E7EC] hover:bg-[#D8DCE3] text-[#2C3137] flex items-center justify-center transition-colors cursor-pointer"
        >
          <AlignJustify className="w-4 h-4" strokeWidth={1.8} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mt-auto pt-3">
        {/* Bottom-left legend matching the reference image */}
        <div className="space-y-2.5 text-[12px] text-[#374151] shrink-0 pb-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4A90E2]" />
            <span>Weekday</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F5A623]" />
            <span>No Entry</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#95D600]" />
            <span>Weekend</span>
          </div>
        </div>

        {/* 3 contiguous stepped gradient bars matching "Patient Demographics" */}
        <div className="flex-1 grid grid-cols-3 items-end">
          {/* Step 1: Blue (Weekday) */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-[11px] text-[#374151] mb-1">
              <span className="w-2 h-2 rounded-full bg-[#4A90E2]" />
              <span className="truncate">Weekday: {weekdayPresent}d</span>
            </div>
            <span className="text-[24px] font-normal text-[#1A1D21] leading-none mb-2.5 tabular-nums">
              {Math.round(animWeekday)}%
            </span>
            <div
              className="w-full border-t-[3.5px] border-[#4A90E2] bg-gradient-to-b from-[#4A90E2]/40 via-[#4A90E2]/15 to-transparent"
              style={{ height: `${Math.round((animBarFill / 100) * 42)}px` }}
            />
          </div>

          {/* Step 2: Orange (Tallest middle step) */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-[11px] text-[#374151] mb-1">
              <span className="w-2 h-2 rounded-full bg-[#F5A623]" />
              <span className="truncate">No Entry: {remaining}d</span>
            </div>
            <span className="text-[24px] font-normal text-[#1A1D21] leading-none mb-2.5 tabular-nums">
              {Math.round(animRemaining)}%
            </span>
            <div
              className="w-full border-t-[3.5px] border-[#F5A623] bg-gradient-to-b from-[#F5A623]/40 via-[#F5A623]/15 to-transparent"
              style={{ height: `${Math.round((animBarFill / 100) * 88)}px` }}
            />
          </div>

          {/* Step 3: Lime-Green (Weekend) */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-[11px] text-[#374151] mb-1">
              <span className="w-2 h-2 rounded-full bg-[#95D600]" />
              <span className="truncate">Weekend: {weekendPresent}d</span>
            </div>
            <span className="text-[24px] font-normal text-[#1A1D21] leading-none mb-2.5 tabular-nums">
              {Math.round(animWeekend)}%
            </span>
            <div
              className="w-full border-t-[3.5px] border-[#95D600] bg-gradient-to-b from-[#95D600]/40 via-[#95D600]/15 to-transparent"
              style={{ height: `${Math.round((animBarFill / 100) * 26)}px` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceBreakdownCard;
