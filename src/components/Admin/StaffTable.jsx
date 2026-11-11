import React, { useMemo, useState } from 'react';
import { ChevronRight, Download, AlertCircle, Search, MoreHorizontal } from 'lucide-react';
import { Avatar } from '../Layout/Avatar';
import { daysInMonth, weekdayIndexOf, weekdayLabelOf, isWeekendIndex } from '../../utils/calendarUtils';

const BADGE_TONE = {
  green: 'bg-blue-50 text-blue-600',
  violet: 'bg-amber-50 text-amber-600',
  blue: 'bg-slate-100 text-slate-500',
  gray: 'bg-slate-50 text-slate-300',
};

/**
 * Day-level display state. Weekday is computed from the date key, never
 * trusted from the stored dayOfWeek field, so a bad stored value shows up as
 * a mismatch instead of silently passing through.
 */
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
    <div className="bg-slate-50 border-t border-slate-100 px-5 py-4">
      {!hasAnyRecord && (
        <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
          Nothing submitted for {staff.name} this month — every day below is unlogged.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
        <table className="w-full text-left border-collapse min-w-[520px]">
          <thead>
            <tr className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <th className="px-4 py-2.5">Date</th>
              <th className="px-3 py-2.5">Day</th>
              <th className="px-3 py-2.5">In</th>
              <th className="px-3 py-2.5">Out</th>
              <th className="px-3 py-2.5 text-right">Hours</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-4 py-2.5">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {days.map(dateKey => {
              const record = byDate.get(dateKey);
              const s = dayState(dateKey, record);
              const dateNum = Number(dateKey.slice(-2));

              return (
                <tr
                  key={dateKey}
                  className={`text-[12px] ${s.muted ? 'text-slate-300' : 'text-slate-600'} ${s.weekend && s.hours > 0 ? 'bg-amber-50/50' : ''}`}
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
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${BADGE_TONE[s.badge.tone]}`}>
                      {s.badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-500 max-w-[180px] truncate" title={s.remarks || undefined}>
                    {s.remarks || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="text-[12px] border-t border-slate-100 bg-slate-50">
              <td colSpan={4} className="px-4 py-2 font-semibold text-slate-900">Total</td>
              <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900">
                {staff.totalHours.toFixed(2)}
              </td>
              <td colSpan={2} className="px-4 py-2 text-[11px] text-slate-400">
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
    ? { label: 'Active', tone: 'bg-blue-50 text-blue-600' }
    : { label: 'No activity', tone: 'bg-amber-50 text-amber-600' };

  return (
    <>
      <tr
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={toggle}
        onKeyDown={onKeyDown}
        className="text-[13px] cursor-pointer hover:bg-slate-50 transition-colors outline-none focus-visible:bg-slate-50"
      >
        <td className="px-4 py-3 w-8">
          <ChevronRight className={`w-3.5 h-3.5 text-slate-300 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </td>
        <td className="px-2 py-3 text-slate-400 tabular-nums">{String(index + 1).padStart(2, '0')}</td>
        <td className="px-2 py-3">
          <div className="flex items-center gap-3">
            <Avatar user={staff} size={32} />
            <div className="min-w-0">
              <p className="text-slate-900 font-medium text-[13px] truncate">{staff.name}</p>
              {staff.jobTitle && <p className="text-[11px] text-slate-400 truncate">{staff.jobTitle}</p>}
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-right text-slate-500 tabular-nums">{staff.daysPresent}</td>
        <td className="px-3 py-3 text-right text-slate-900 font-medium tabular-nums">{staff.totalHours.toFixed(2)}</td>
        <td className="px-3 py-3 text-right text-blue-600 font-semibold tabular-nums">
          Rs. {staff.estPay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </td>
        <td className="px-3 py-3">
          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium ${status.tone}`}>
            {status.label}
          </span>
        </td>
        <td className="px-4 py-3 text-right w-10">
          <button
            type="button"
            title={`Export ${staff.name}'s sheet`}
            onClick={(e) => { e.stopPropagation(); onExport(staff); }}
            className="p-1.5 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
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

/**
 * Read-only roster table. There is deliberately no edit affordance anywhere
 * in this component - admin has read access to attendance, never write.
 * Rows are keyed by month so switching months collapses any open detail
 * panel rather than showing stale days.
 */
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
    <div className="bg-white rounded-[22px] overflow-hidden shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
      <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-[15px] font-semibold text-slate-900">Staff Overview</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff..."
              className="pl-8 pr-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[12px] text-slate-700
                         placeholder:text-slate-300 focus:outline-none focus:border-blue-300 w-40 transition-colors"
            />
          </div>
          <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-t border-slate-100">
              <th className="px-4 py-3 w-8" />
              <th className="px-2 py-3">No</th>
              <th className="px-2 py-3">Name</th>
              <th className="px-3 py-3 text-right">Days present</th>
              <th className="px-3 py-3 text-right">Total hrs</th>
              <th className="px-3 py-3 text-right">Est. pay</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-4 py-3 w-10">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {visible.map((s, i) => (
              <StaffRow key={`${monthKey}-${s.uid}`} staff={s} index={i} monthDate={monthDate} onExport={handleExport} />
            ))}

            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-slate-400 text-sm">
                  No staff attendance for this month yet.
                </td>
              </tr>
            )}
          </tbody>
          {totals && visible.length > 0 && (
            <tfoot>
              <tr className="text-[13px] border-t border-slate-200 bg-slate-50">
                <td colSpan={3} className="px-4 py-3 text-slate-900 font-semibold">Total</td>
                <td className="px-3 py-3 text-right text-slate-900 font-semibold tabular-nums">{visibleTotals.daysPresent}</td>
                <td className="px-3 py-3 text-right text-slate-900 font-semibold tabular-nums">{visibleTotals.totalHours.toFixed(2)}</td>
                <td className="px-3 py-3 text-right text-blue-600 font-bold tabular-nums">{money(visibleTotals.estPay)}</td>
                <td colSpan={2} className="px-4 py-3" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default StaffTable;
