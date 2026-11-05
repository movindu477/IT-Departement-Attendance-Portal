import React from 'react';
import { useAdminShell } from '../AdminLayout';
import ReportAnalyticsCard from '../ReportAnalyticsCard';
import AttendanceBreakdownCard from '../AttendanceBreakdownCard';
import { Avatar } from '../../Layout/Avatar';

/** Numbers-and-charts view of payroll for the month - no per-day drill-down,
 *  that lives on the Attendance log page. */
const PayrollAnalyticsPage = () => {
  const { visibleStaff, totals, rates, loading, monthDate } = useAdminShell();
  const money = n => `Rs. ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[17px] font-semibold text-ink">Payroll analytics</h2>
        <p className="text-[12px] text-muted mt-0.5">
          Weekday pay uses each person's own rate; weekend hours at Rs. {rates.weekendRate}/hr (unconfirmed default).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ReportAnalyticsCard staff={loading ? [] : visibleStaff} monthDate={monthDate} />
        </div>
        <AttendanceBreakdownCard staff={loading ? [] : visibleStaff} monthDate={monthDate} />
      </div>

      <div className="bg-surface border border-line rounded-[20px] overflow-hidden card-soft">
        <div className="px-5 py-4 border-b border-line">
          <h3 className="text-[15px] font-semibold text-ink">Pay by staff</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[560px]">
            <thead>
              <tr className="text-[10px] text-muted font-bold uppercase tracking-wider">
                <th className="px-5 py-3">Staff</th>
                <th className="px-3 py-3 text-right">Rate (Rs/hr)</th>
                <th className="px-3 py-3 text-right">Weekday hrs</th>
                <th className="px-3 py-3 text-right">Weekend hrs</th>
                <th className="px-5 py-3 text-right">Est. pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visibleStaff.map(s => (
                <tr key={s.uid} className="text-[13px]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar user={s} size={28} />
                      <span className="text-ink font-medium truncate">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-ink-soft tabular-nums">{s.weekdayRate}</td>
                  <td className="px-3 py-3 text-right text-ink-soft tabular-nums">{s.weekdayHours.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right text-ink-soft tabular-nums">{s.weekendHours.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right text-violet-300 font-semibold tabular-nums">{money(s.estPay)}</td>
                </tr>
              ))}
              {visibleStaff.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted text-sm">No staff for this month.</td>
                </tr>
              )}
            </tbody>
            {totals && visibleStaff.length > 0 && (
              <tfoot>
                <tr className="text-[13px] border-t border-line-strong bg-raised">
                  <td colSpan={4} className="px-5 py-3 text-ink font-semibold">Total</td>
                  <td className="px-5 py-3 text-right text-violet-300 font-bold tabular-nums">{money(totals.estPay)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayrollAnalyticsPage;
