import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, CalendarCheck2 } from 'lucide-react';
import { daysInMonth, weekdayIndexOf, weekdayLabelOf } from '../../utils/calendarUtils';
import { resolveUserPortrait } from '../Layout/AvatarUpload';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const pad = n => String(n).padStart(2, '0');
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function buildDayMeta(staff, monthDate) {
  const days = daysInMonth(monthDate);
  const today = todayKey();
  const meta = {};

  days.forEach(dateKey => {
    const entries = [];
    let present = 0;
    let dayOffCount = 0;
    let weekendWorked = false;
    const dow = weekdayIndexOf(dateKey);
    const isWeekend = dow === 0 || dow === 6;

    staff.forEach(s => {
      const rec = (s.records || []).find(r => r.date === dateKey);
      if (!rec) return;

      const hours = Number(rec.hours) || 0;
      const isDayOff =
        hours === 0 &&
        Boolean(rec.isDayOff || rec.status === 'Day Off' || rec.status === 'Leave' || rec.reason);

      if (hours > 0 || isDayOff || rec.checkIn) {
        if (hours > 0) {
          present++;
          if (isWeekend) weekendWorked = true;
        } else {
          dayOffCount++;
        }

        entries.push({
          staff: s,
          record: rec,
          hours,
          checkIn: rec.checkIn || '',
          checkOut: rec.checkOut || '',
          status: hours > 0 ? (isWeekend ? 'Weekend' : rec.status || 'Present') : (rec.status || 'Day Off'),
          reason: rec.reason || '',
          isDayOff: hours === 0,
        });
      }
    });

    const isPast = dateKey <= today;
    meta[dateKey] = {
      entries,
      presentCount: present,
      dayOffCount,
      logged: present > 0,
      hasDayOff: dayOffCount > 0,
      fullAttendance: staff.length > 0 && present === staff.length,
      weekendWorked,
      missed: isPast && staff.length > 0 && entries.length === 0 && !isWeekend,
    };
  });

  return meta;
}

function formatReadableDate(dateKey) {
  if (!dateKey) return '';
  const [y, m, d] = dateKey.split('-').map(Number);
  const dow = weekdayLabelOf(dateKey);
  return `${dow}, ${SHORT_MONTHS[(m || 1) - 1]} ${d}, ${y}`;
}

const CalendarWidget = ({ monthDate, shiftMonth, staff }) => {
  const dayMeta = useMemo(() => buildDayMeta(staff, monthDate), [staff, monthDate]);
  const allMonthDays = useMemo(() => daysInMonth(monthDate), [monthDate]);
  const today = todayKey();

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const monthPrefix = `${year}-${pad(month + 1)}`;

  // Pick a smart default date in the month: today if marked, or latest day with markings, or today/1st
  const defaultDateForMonth = useMemo(() => {
    const markedDays = allMonthDays.filter(dk => (dayMeta[dk]?.entries?.length || 0) > 0);
    if (today.startsWith(monthPrefix) && dayMeta[today]?.entries?.length > 0) {
      return today;
    }
    if (markedDays.length > 0) {
      return markedDays[markedDays.length - 1];
    }
    if (today.startsWith(monthPrefix)) {
      return today;
    }
    return `${monthPrefix}-01`;
  }, [allMonthDays, dayMeta, monthPrefix, today]);

  const [selectedDate, setSelectedDate] = useState(defaultDateForMonth);

  useEffect(() => {
    setSelectedDate(prev => {
      if (!prev || !prev.startsWith(monthPrefix)) {
        return defaultDateForMonth;
      }
      return defaultDateForMonth || prev;
    });
  }, [monthPrefix, defaultDateForMonth]);

  const stepSelectedDay = (delta) => {
    const idx = allMonthDays.indexOf(selectedDate);
    if (idx === -1) return;
    const nextIdx = idx + delta;
    if (nextIdx >= 0 && nextIdx < allMonthDays.length) {
      setSelectedDate(allMonthDays[nextIdx]);
    }
  };

  const firstDow = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();

  const cells = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: count }, (_, i) => i + 1),
  ];

  const selectedMeta = dayMeta[selectedDate] || { entries: [], presentCount: 0, dayOffCount: 0 };
  const selectedEntries = selectedMeta.entries || [];

  return (
    <div className="bg-[#F2F4F7] rounded-[20px] p-5 border border-white/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)] h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <div>
          <h3 className="text-[16px] font-medium text-[#1A1D21] tracking-tight">Calendar</h3>
          <p className="text-[10.5px] text-[#6B7280]">Click any date to inspect staff markings</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="w-6 h-6 rounded-full border border-[#4B5563] text-[#2C3137] flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[12px] font-medium text-[#2C3137] min-w-[92px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="w-6 h-6 rounded-full border border-[#4B5563] text-[#2C3137] flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-x-1 mb-1.5 text-center text-[11px] font-medium text-[#6B7280]">
        {DOW.map((d, i) => (
          <div key={`${d}-${i}`}>{d}</div>
        ))}
      </div>

      {/* Interactive Date Grid */}
      <div className="grid grid-cols-7 gap-x-1 gap-y-1 justify-items-center">
        {cells.map((d, i) => {
          if (d === null) {
            return <span key={`e-${i}`} className="w-8 h-8" />;
          }
          const dateKey = `${year}-${pad(month + 1)}-${pad(d)}`;
          const meta = dayMeta[dateKey] || {};
          const isToday = dateKey === today;
          const isSelected = dateKey === selectedDate;
          const totalMarked = meta.entries?.length || 0;

          let circleCls = 'text-[#2C3137] hover:bg-white/80';
          if (meta.logged) {
            circleCls = 'bg-emerald-500 text-white font-semibold shadow-[0_2px_6px_rgba(16,185,129,0.3)]';
          } else if (meta.hasDayOff || meta.weekendWorked) {
            circleCls = 'bg-amber-500 text-white font-semibold shadow-[0_2px_6px_rgba(245,158,11,0.3)]';
          } else if (meta.missed) {
            circleCls = 'bg-rose-500 text-white font-semibold shadow-[0_2px_6px_rgba(244,63,94,0.3)]';
          } else if (isSelected) {
            circleCls = 'bg-[#141619] text-white font-semibold shadow-[0_2px_8px_rgba(20,22,25,0.25)]';
          }

          if (isSelected && (meta.logged || meta.hasDayOff || meta.weekendWorked || meta.missed)) {
            circleCls += ' ring-2 ring-[#141619] ring-offset-2 ring-offset-[#F2F4F7]';
          } else if (isToday) {
            circleCls += ' ring-2 ring-[#4A90E2] ring-offset-2 ring-offset-[#F2F4F7]';
          }

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => setSelectedDate(dateKey)}
              title={
                totalMarked > 0
                  ? `${totalMarked} staff marked on ${formatReadableDate(dateKey)}`
                  : formatReadableDate(dateKey)
              }
              className="flex flex-col items-center py-0.5 cursor-pointer group focus:outline-none"
            >
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] transition-all ${circleCls}`}
              >
                {d}
              </span>
              <span className="flex items-center justify-center gap-0.5 h-1.5 mt-1">
                {meta.logged && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                {meta.hasDayOff && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                {meta.missed && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                {isToday && <span className="w-1.5 h-1.5 rounded-full bg-[#4A90E2]" />}
              </span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between flex-wrap gap-2 mt-3 pt-2.5 border-t border-[#E2E6EC]">
        <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-[#374151]">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Logged
        </span>
        <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-[#374151]">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> Day Off
        </span>
        <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-[#374151]">
          <span className="w-2 h-2 rounded-full bg-rose-500" /> Missed
        </span>
        <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-[#374151]">
          <span className="w-2 h-2 rounded-full ring-2 ring-[#4A90E2] ring-inset" /> Today
        </span>
      </div>

      {/* Day-by-Day Marked Users Inspector */}
      <div className="mt-3 pt-3 border-t border-[#E2E6EC] flex-1 flex flex-col min-h-[150px]">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <CalendarCheck2 className="w-3.5 h-3.5 text-[#4A90E2] shrink-0" />
            <span className="text-[12px] font-semibold text-[#1A1D21] truncate">
              {formatReadableDate(selectedDate)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2 py-0.5 rounded-[6px] bg-[#D6E6F9] text-[#2A6CB8] text-[10.5px] font-semibold">
              {selectedEntries.length} {selectedEntries.length === 1 ? 'User' : 'Users'} Marked
            </span>
            <button
              type="button"
              onClick={() => stepSelectedDay(-1)}
              disabled={allMonthDays.indexOf(selectedDate) <= 0}
              title="Previous day"
              className="w-5 h-5 rounded-md bg-white/80 hover:bg-white text-[#2C3137] flex items-center justify-center disabled:opacity-35 cursor-pointer"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => stepSelectedDay(1)}
              disabled={allMonthDays.indexOf(selectedDate) >= allMonthDays.length - 1}
              title="Next day"
              className="w-5 h-5 rounded-md bg-white/80 hover:bg-white text-[#2C3137] flex items-center justify-center disabled:opacity-35 cursor-pointer"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {selectedEntries.length === 0 ? (
          <div className="flex-1 rounded-[12px] bg-white/55 border border-white/80 px-3 py-4 flex flex-col items-center justify-center text-center">
            <p className="text-[11.5px] font-medium text-[#4B5563]">
              No users marked attendance on this date
            </p>
            <p className="text-[10.5px] text-[#9CA3AF] mt-0.5">
              Select a highlighted green or amber date above to view staff logs.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[175px] overflow-y-auto pr-0.5">
            {selectedEntries.map(item => (
              <div
                key={item.staff.uid}
                className="flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-[12px] bg-white/75 border border-white/90 shadow-[0_1px_4px_rgba(15,23,42,0.02)]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={resolveUserPortrait(item.staff)}
                    alt={item.staff.name}
                    className="w-8 h-8 rounded-[8px] object-cover object-top bg-slate-200 border border-white shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-[#1A1D21] truncate leading-tight">
                      {item.staff.name}
                    </p>
                    <p className="text-[10.5px] text-[#6B7280] flex items-center gap-1 truncate mt-0.5">
                      <Clock className="w-2.5 h-2.5 text-[#4A90E2] shrink-0" />
                      {item.checkIn
                        ? `${item.checkIn}${item.checkOut ? ` – ${item.checkOut}` : ' (Active)'}`
                        : item.reason || item.status}
                    </p>
                  </div>
                </div>

                <span
                  className={`shrink-0 px-2.5 py-1 rounded-[7px] text-[10.5px] font-semibold tabular-nums ${item.hours > 0
                      ? 'bg-emerald-500/15 text-emerald-700'
                      : 'bg-amber-500/15 text-amber-700'
                    }`}
                >
                  {item.hours > 0 ? `${item.hours.toFixed(1)}h` : item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarWidget;
