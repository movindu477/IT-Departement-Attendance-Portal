import React, { useMemo, useState } from 'react';
import { ChevronRight, Download, AlertCircle } from 'lucide-react';
import { Avatar } from '../Layout/Avatar';
import { daysInMonth, weekdayIndexOf, weekdayLabelOf, isWeekendIndex } from '../../utils/calendarUtils';

const BADGE_TONE = {
  green: 'bg-emerald-500/15 text-emerald-300',
  violet: 'bg-violet-500/15 text-violet-300',
  blue: 'bg-sky-500/15 text-sky-300',
  gray: 'bg-line text-muted',
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
    <div className="bg-subtle border-t border-line px-5 py-4">
      {!hasAnyRecord && (
        <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-3">
          Nothing submitted for {staff.name} this month — every day below is unlogged.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left border-collapse min-w-[520px]">
          <thead>
            <tr className="text-[10px] text-muted font-bold uppercase tracking-wider">
              <th className="px-4 py-2.5">Date</th>
              <th className="px-3 py-2.5">Day</th>
              <th className="px-3 py-2.5">In</th>
              <th className="px-3 py-2.5">Out</th>
              <th className="px-3 py-2.5 text-right">Hours</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-4 py-2.5">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {days.map(dateKey => {
              const record = byDate.get(dateKey);
              const s = dayState(dateKey, record);
              const dateNum = Number(dateKey.slice(-2));

              return (
                <tr
                  key={dateKey}
                  className={`text-[12px] ${s.muted ? 'text-muted' : 'text-ink-soft'} ${s.weekend && s.hours > 0 ? 'bg-violet-500/10' : ''}`}
                >
                  <td className="px-4 py-2 font-medium">{dateNum}</td>
                  <td className="px-3 py-2">{weekdayLabelOf(dateKey)}</td>
                  <td className="px-3 py-2 font-mono">{s.checkIn || '—'}</td>
                  <td className="px-3 py-2 font-mono">
                    <span className="inline-flex items-center gap-1">
                      {s.checkOut || '—'}
                      {s.unclosed && (
                        <AlertCircle className="w-3 h-3 text-amber-400" aria-label="Unclosed entry" />
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{s.hours > 0 ? s.hours.toFixed(2) : ''}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${BADGE_TONE[s.badge.tone]}`}>
                      {s.badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-ink-soft max-w-[180px] truncate" title={s.remarks || undefined}>
                    {s.remarks || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="text-[12px] border-t border-line bg-raised">
              <td colSpan={4} className="px-4 py-2 font-semibold text-ink">Total</td>
              <td className="px-3 py-2 text-right font-mono font-semibold text-ink">
                {staff.totalHours.toFixed(2)}
              </td>
              <td colSpan={2} className="px-4 py-2 text-[11px] text-muted">
                {staff.weekdayHours.toFixed(2)}h weekday · {staff.weekendHours.toFixed(2)}h weekend
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

const StaffRow = ({ staff, monthDate, onExport }) => {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => setExpanded(e => !e);
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <>
      <tr
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={toggle}
        onKeyDown={onKeyDown}
        className="text-[13px] cursor-pointer hover:bg-raised/60 transition-colors outline-none focus-visible:bg-raised"
      >
        <td className="px-4 py-3 w-8">
          <ChevronRight className={`w-3.5 h-3.5 text-muted transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </td>
        <td className="px-2 py-3">
          <div className="flex items-center gap-3">
            <Avatar user={staff} size={32} />
            <div className="min-w-0">
              <p className="text-ink font-medium text-[13px] truncate">{staff.name}</p>
              {staff.jobTitle && <p className="text-[11px] text-muted truncate">{staff.jobTitle}</p>}
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-right text-ink-soft tabular-nums">{staff.daysPresent}</td>
        <td className="px-3 py-3 text-right text-ink-soft tabular-nums">{staff.weekdayHours.toFixed(2)}</td>
        <td className="px-3 py-3 text-right text-ink-soft tabular-nums">{staff.weekendHours.toFixed(2)}</td>
        <td className="px-3 py-3 text-right text-ink font-medium tabular-nums">{staff.totalHours.toFixed(2)}</td>
        <td className="px-3 py-3 text-right text-violet-300 font-semibold tabular-nums">
          Rs. {staff.estPay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </td>
        <td className="px-4 py-3 text-right w-10">
          <button
            type="button"
            title={`Export ${staff.name}'s sheet`}
            onClick={(e) => { e.stopPropagation(); onExport(staff); }}
            className="p-1.5 rounded-lg text-muted hover:text-violet-300 hover:bg-violet-500/15 transition-colors cursor-pointer"
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
  const money = n => `Rs. ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const handleExport = async (member) => {
    const { generateTimesheet } = await import('../../utils/generateTimesheet');
    await generateTimesheet(monthDate, member.records, member);
  };

  return (
    <div className="bg-surface border border-line rounded-[20px] overflow-hidden card-soft">
      <div className="px-5 py-4 border-b border-line flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-ink">Staff attendance</h3>
        <span className="text-[11px] text-muted">{staff.length} staff · read only</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[720px]">
          <thead>
            <tr className="text-[10px] text-muted font-bold uppercase tracking-wider">
              <th className="px-4 py-3 w-8" />
              <th className="px-2 py-3">Staff</th>
              <th className="px-3 py-3 text-right">Days present</th>
              <th className="px-3 py-3 text-right">Weekday hrs</th>
              <th className="px-3 py-3 text-right">Weekend hrs</th>
              <th className="px-3 py-3 text-right">Total hrs</th>
              <th className="px-3 py-3 text-right">Est. pay</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {staff.map(s => (
              <StaffRow key={`${monthKey}-${s.uid}`} staff={s} monthDate={monthDate} onExport={handleExport} />
            ))}

            {staff.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-muted text-sm">
                  No staff attendance for this month yet.
                </td>
              </tr>
            )}
          </tbody>
          {totals && staff.length > 0 && (
            <tfoot>
              <tr className="text-[13px] border-t border-line-strong bg-raised">
                <td colSpan={2} className="px-4 py-3 text-ink font-semibold">Total</td>
                <td className="px-3 py-3 text-right text-ink font-semibold tabular-nums">{totals.daysPresent}</td>
                <td className="px-3 py-3 text-right text-ink font-semibold tabular-nums">{totals.weekdayHours.toFixed(2)}</td>
                <td className="px-3 py-3 text-right text-ink font-semibold tabular-nums">{totals.weekendHours.toFixed(2)}</td>
                <td className="px-3 py-3 text-right text-ink font-semibold tabular-nums">{totals.totalHours.toFixed(2)}</td>
                <td className="px-3 py-3 text-right text-violet-300 font-bold tabular-nums">{money(totals.estPay)}</td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default StaffTable;
