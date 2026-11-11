import React, { useMemo, useState } from 'react';
import { ChevronRight, Download, AlertCircle, Search, ChevronDown } from 'lucide-react';
import { resolveUserPortrait } from '../Layout/AvatarUpload';
import { daysInMonth, weekdayIndexOf, weekdayLabelOf, isWeekendIndex } from '../../utils/calendarUtils';

const BADGE_TONE = {
  green: 'bg-[#CFE3FF] text-[#3B82F6]',
  violet: 'bg-[#FDE2B8] text-[#D97706]',
  blue: 'bg-slate-200/80 text-slate-600',
  gray: 'bg-slate-100 text-slate-400',
};

function dayState(dateKey, record) {
  const weekend = isWeekendIndex(weekdayIndexOf(dateKey));
  const hours = record ? Number(record.hours) || 0 : 0;
  const checkIn = record?.checkIn || '';
  const checkOut = record?.checkOut || '';
  const unclosed = !!checkIn && !checkOut;

  let badge;
  let muted = false;

  if (!record) {
    muted = true;
    badge = { label: weekend ? 'Weekend' : 'No entry', tone: 'gray' };
  } else if (hours > 0) {
    badge = weekend ? { label: 'Weekend', tone: 'violet' } : { label: record.status || 'Present', tone: 'green' };
  } else {
    badge = { label: record.status || 'Day off', tone: 'blue' };
  }

  return { weekend, hours, checkIn, checkOut, unclosed, badge, muted, remarks: record?.reason || '' };
}

const DailyDetailPanel = ({ staff, monthDate }) => {
  const days = useMemo(() => daysInMonth(monthDate), [monthDate]);
  const byDate = useMemo(() => new Map((staff.records || []).map(r => [r.date, r])), [staff.records]);
  const hasAnyRecord = (staff.records || []).length > 0;

  return (
    <div className="bg-white/70 border-t border-[#E2E6EC] px-5 py-4">
      {!hasAnyRecord && (
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
          Nothing submitted for {staff.name} this month — every day below is unlogged.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-[#E2E6EC] bg-white">
        <table className="w-full text-left border-collapse min-w-[520px]">
          <thead>
            <tr className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wider border-b border-slate-100">
              <th className="px-4 py-2.5">Date</th>
              <th className="px-3 py-2.5">Day</th>
              <th className="px-3 py-2.5">In</th>
              <th className="px-3 py-2.5">Out</th>
              <th className="px-3 py-2.5 text-right">Hours</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-4 py-2.5">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/70">
            {days.map(dateKey => {
              const record = byDate.get(dateKey);
              const s = dayState(dateKey, record);
              const dateNum = Number(dateKey.slice(-2));

              return (
                <tr
                  key={dateKey}
                  className={`text-[12px] ${s.muted ? 'text-slate-300' : 'text-[#2C3137]'} ${s.weekend && s.hours > 0 ? 'bg-amber-50/40' : ''}`}
                >
                  <td className="px-4 py-2 font-medium">{dateNum}</td>
                  <td className="px-3 py-2">{weekdayLabelOf(dateKey)}</td>
                  <td className="px-3 py-2 font-mono">{s.checkIn || '—'}</td>
                  <td className="px-3 py-2 font-mono">
                    <span className="inline-flex items-center gap-1">
                      {s.checkOut || '—'}
                      {s.unclosed && (
                        <AlertCircle className="w-3 h-3 text-amber-500" aria-label="Unclosed entry" />
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{s.hours > 0 ? s.hours.toFixed(2) : ''}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded-[6px] text-[10px] font-medium ${BADGE_TONE[s.badge.tone]}`}>
                      {s.badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-[#6B7280] max-w-[180px] truncate" title={s.remarks || undefined}>
                    {s.remarks || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="text-[12px] border-t border-slate-100 bg-slate-50/80">
              <td colSpan={4} className="px-4 py-2 font-semibold text-[#1A1D21]">Total</td>
              <td className="px-3 py-2 text-right font-mono font-semibold text-[#1A1D21]">
                {staff.totalHours.toFixed(2)}
              </td>
              <td colSpan={2} className="px-4 py-2 text-[11px] text-[#6B7280]">
                {staff.weekdayHours.toFixed(2)}h weekday · {staff.weekendHours.toFixed(2)}h weekend
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

const StaffRow = ({ staff, index, monthDate, onExport }) => {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => setExpanded(e => !e);
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  const status = staff.daysPresent > 0
    ? { label: 'Active', tone: 'bg-[#CFE3FF] text-[#3B82F6]' }
    : { label: 'No activity', tone: 'bg-[#FDE2B8] text-[#D97706]' };

  return (
    <>
      <tr
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={toggle}
        onKeyDown={onKeyDown}
        className="text-[12.5px] text-[#1A1D21] cursor-pointer hover:bg-white/60 transition-colors outline-none focus-visible:bg-white/60"
      >
        <td className="py-3 pl-1 pr-2 w-8">
          <ChevronRight className={`w-3.5 h-3.5 text-[#6B7280] transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </td>
        <td className="py-3 px-2 text-[#374151] tabular-nums">{String(index + 1).padStart(2, '0')}</td>
        <td className="py-3 px-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] overflow-hidden bg-[#DCE8F8] shrink-0 border border-white">
              <img
                src={resolveUserPortrait(staff.avatar)}
                alt={staff.name || 'Staff'}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[#1A1D21] font-medium text-[13px] truncate">{staff.name}</p>
              <p className="text-[10.5px] text-[#6B7280] truncate">
                {staff.jobTitle || `P-${String(staff.uid || '10021').slice(0, 5).toUpperCase()}`}
              </p>
            </div>
          </div>
        </td>
        <td className="py-3 px-3 text-right text-[#374151] tabular-nums">{staff.daysPresent}</td>
        <td className="py-3 px-3 text-right text-[#1A1D21] font-medium tabular-nums">{staff.totalHours.toFixed(2)}</td>
        <td className="py-3 px-3 text-right text-[#4A90E2] font-semibold tabular-nums">
          Rs. {staff.estPay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </td>
        <td className="py-3 px-3">
          <span className={`inline-flex items-center justify-center px-3 py-1 rounded-[8px] text-[11px] font-medium ${status.tone}`}>
            {status.label}
          </span>
        </td>
        <td className="py-3 pl-2 pr-1 text-right w-10">
          <button
            type="button"
            title={`Export ${staff.name}'s sheet`}
            onClick={(e) => { e.stopPropagation(); onExport(staff); }}
            className="p-1.5 rounded-lg text-[#4B5563] hover:text-[#4A90E2] hover:bg-white transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={8} className="p-0">
            <DailyDetailPanel staff={staff} monthDate={monthDate} />
          </td>
        </tr>
      )}
    </>
  );
};

const StaffTable = ({ staff, totals, monthDate, monthKey }) => {
  const [search, setSearch] = useState('');
  const money = n => `Rs. ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const visible = useMemo(() => {
    if (!search.trim()) return staff;
    const q = search.trim().toLowerCase();
    return staff.filter(s => s.name.toLowerCase().includes(q));
  }, [staff, search]);

  const visibleTotals = useMemo(() => visible.reduce((acc, s) => ({
    daysPresent: acc.daysPresent + s.daysPresent,
    weekdayHours: acc.weekdayHours + s.weekdayHours,
    weekendHours: acc.weekendHours + s.weekendHours,
    totalHours: acc.totalHours + s.totalHours,
    estPay: acc.estPay + s.estPay,
  }), { daysPresent: 0, weekdayHours: 0, weekendHours: 0, totalHours: 0, estPay: 0 }), [visible]);

  const handleExport = async (member) => {
    const { generateTimesheet } = await import('../../utils/generateTimesheet');
    await generateTimesheet(monthDate, member.records, member);
  };

  return (
    <div className="bg-[#F2F4F7] rounded-[20px] p-5 border border-white/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)] overflow-hidden">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="text-[16px] font-medium text-[#1A1D21] tracking-tight">Staff Overview</h3>
          <p className="text-[11.5px] text-[#6B7280] mt-0.5">
            Manage and monitor all staff attendance profiles from a single dashboard.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff..."
              className="pl-8 pr-3 py-2 rounded-[12px] bg-[#E4E7EC] text-[12px] text-[#1A1D21]
                         placeholder:text-[#6B7280] focus:outline-none focus:bg-white w-40 transition-colors"
            />
          </div>
          <div className="px-3.5 py-2 rounded-[12px] bg-[#E4E7EC] text-[#2C3137] text-[12px] font-medium flex items-center gap-1.5">
            <span>Today</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#4B5563]" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="text-[11px] text-[#6B7280] font-normal border-b border-[#E2E6EC]">
              <th className="py-2.5 pl-1 pr-2 w-8" />
              <th className="py-2.5 px-2 font-normal">No</th>
              <th className="py-2.5 px-2 font-normal">Name</th>
              <th className="py-2.5 px-3 font-normal text-right">Days present</th>
              <th className="py-2.5 px-3 font-normal text-right">Total hrs</th>
              <th className="py-2.5 px-3 font-normal text-right">Est. pay</th>
              <th className="py-2.5 px-3 font-normal">Status</th>
              <th className="py-2.5 pl-2 pr-1 font-normal text-right w-10">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E9EF]/70">
            {visible.map((s, i) => (
              <StaffRow key={`${monthKey}-${s.uid}`} staff={s} index={i} monthDate={monthDate} onExport={handleExport} />
            ))}

            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-[#6B7280] text-xs">
                  No staff attendance for this month yet.
                </td>
              </tr>
            )}
          </tbody>
          {totals && visible.length > 0 && (
            <tfoot>
              <tr className="text-[12.5px] border-t border-[#E2E6EC]">
                <td colSpan={3} className="py-3 px-2 text-[#1A1D21] font-semibold">Total</td>
                <td className="py-3 px-3 text-right text-[#1A1D21] font-semibold tabular-nums">{visibleTotals.daysPresent}</td>
                <td className="py-3 px-3 text-right text-[#1A1D21] font-semibold tabular-nums">{visibleTotals.totalHours.toFixed(2)}</td>
                <td className="py-3 px-3 text-right text-[#4A90E2] font-bold tabular-nums">{money(visibleTotals.estPay)}</td>
                <td colSpan={2} className="py-3 px-2" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default StaffTable;
