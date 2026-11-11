import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { daysInMonth, weekdayIndexOf } from '../../utils/calendarUtils';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const pad = n => String(n).padStart(2, '0');
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Per-day markers derived straight from the records already loaded by
 *  useAdminData - no new queries. */
function buildDayMeta(staff, monthDate) {
  const days = daysInMonth(monthDate);
  const today = todayKey();
  const meta = {};

  days.forEach(dateKey => {
    let present = 0;
    let weekendWorked = false;
    staff.forEach(s => {
      const rec = (s.records || []).find(r => r.date === dateKey);
      const hours = rec ? Number(rec.hours) || 0 : 0;
      if (hours > 0) {
        present++;
        if (weekdayIndexOf(dateKey) === 0 || weekdayIndexOf(dateKey) === 6) weekendWorked = true;
      }
    });

    const isPast = dateKey < today;
    meta[dateKey] = {
      fullAttendance: staff.length > 0 && present === staff.length,
      weekendWorked,
      missed: isPast && staff.length > 0 && present === 0 && weekdayIndexOf(dateKey) !== 0 && weekdayIndexOf(dateKey) !== 6,
    };
  });

  return meta;
}

const CalendarWidget = ({ monthDate, shiftMonth, staff }) => {
  const dayMeta = useMemo(() => buildDayMeta(staff, monthDate), [staff, monthDate]);
  const today = todayKey();

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();

  const cells = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: count }, (_, i) => i + 1),
  ];

  return (
    <div className="bg-white rounded-[22px] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.05)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-slate-900">Calendar</h3>
        <div className="flex items-center gap-1 text-[12px] text-slate-500 font-medium">
          <button onClick={() => shiftMonth(-1)} className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          {MONTHS[month]} {year}
          <button onClick={() => shiftMonth(1)} className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {DOW.map((d, i) => (
          <span key={`${d}-${i}`} className="text-[10px] text-slate-300 font-medium pb-1.5">{d}</span>
        ))}

        {cells.map((d, i) => {
          if (d === null) return <span key={`e-${i}`} />;
          const dateKey = `${year}-${pad(month + 1)}-${pad(d)}`;
          const meta = dayMeta[dateKey] || {};
          const isToday = dateKey === today;

          return (
            <div key={dateKey} className="flex flex-col items-center gap-0.5 py-0.5">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] ${
                  isToday ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600'
                }`}
              >
                {d}
              </span>
              <span className="flex gap-0.5 h-1">
                {meta.fullAttendance && <span className="w-1 h-1 rounded-full bg-blue-400" />}
                {meta.weekendWorked && <span className="w-1 h-1 rounded-full bg-amber-400" />}
                {meta.missed && <span className="w-1 h-1 rounded-full bg-rose-400" />}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-3 border-t border-slate-100">
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="w-2 h-2 rounded-full bg-blue-400" /> Full attendance
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> Weekend worked
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="w-2 h-2 rounded-full bg-rose-400" /> Missed day
        </span>
      </div>
    </div>
  );
};

export default CalendarWidget;
