import React from 'react';
import { Avatar } from '../Layout/Avatar';

/**
 * Read-only roster table. There is deliberately no edit affordance anywhere
 * in this component - admin has read access to attendance, never write.
 */
const StaffTable = ({ staff, totals }) => {
  const money = n => `Rs. ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="bg-surface border border-line rounded-3xl overflow-hidden">
      <div className="px-5 py-4 border-b border-line flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink tracking-tight">Staff attendance</h3>
        <span className="text-[11px] text-muted">{staff.length} staff · read only</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="text-[10px] text-muted font-bold uppercase tracking-wider">
              <th className="px-5 py-3">Staff</th>
              <th className="px-3 py-3 text-right">Days present</th>
              <th className="px-3 py-3 text-right">Weekday hrs</th>
              <th className="px-3 py-3 text-right">Weekend hrs</th>
              <th className="px-3 py-3 text-right">Total hrs</th>
              <th className="px-5 py-3 text-right">Est. pay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {staff.map(s => (
              <tr key={s.uid} className="text-sm hover:bg-raised/60 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar user={s} size={32} />
                    <div className="min-w-0">
                      <p className="text-ink font-medium text-[13px] truncate">{s.name}</p>
                      {s.jobTitle && <p className="text-[11px] text-muted truncate">{s.jobTitle}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-right text-ink-soft tabular-nums">{s.daysPresent}</td>
                <td className="px-3 py-3 text-right text-ink-soft tabular-nums">{s.weekdayHours.toFixed(2)}</td>
                <td className="px-3 py-3 text-right text-ink-soft tabular-nums">{s.weekendHours.toFixed(2)}</td>
                <td className="px-3 py-3 text-right text-ink font-medium tabular-nums">{s.totalHours.toFixed(2)}</td>
                <td className="px-5 py-3 text-right text-mint-deep font-semibold tabular-nums">{money(s.estPay)}</td>
              </tr>
            ))}

            {staff.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted text-sm">
                  No staff attendance for this month yet.
                </td>
              </tr>
            )}
          </tbody>
          {totals && staff.length > 0 && (
            <tfoot>
              <tr className="text-sm border-t border-line-strong bg-raised/40">
                <td className="px-5 py-3 text-ink font-semibold">Total</td>
                <td className="px-3 py-3 text-right text-ink font-semibold tabular-nums">{totals.daysPresent}</td>
                <td className="px-3 py-3 text-right text-ink font-semibold tabular-nums">{totals.weekdayHours.toFixed(2)}</td>
                <td className="px-3 py-3 text-right text-ink font-semibold tabular-nums">{totals.weekendHours.toFixed(2)}</td>
                <td className="px-3 py-3 text-right text-ink font-semibold tabular-nums">{totals.totalHours.toFixed(2)}</td>
                <td className="px-5 py-3 text-right text-mint-deep font-bold tabular-nums">{money(totals.estPay)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default StaffTable;
