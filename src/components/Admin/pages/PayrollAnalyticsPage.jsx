import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useAdminShell } from '../AdminLayout';
import ReportAnalyticsCard from '../ReportAnalyticsCard';
import AttendanceBreakdownCard from '../AttendanceBreakdownCard';
import { Avatar } from '../../Layout/Avatar';

/** Numbers-and-charts view of payroll for the month - no per-day drill-down,
 *  that lives on the Attendance log page. */
const PayrollAnalyticsPage = () => {
  const { staff, totals, rates, loading, monthDate } = useAdminShell();
  const [search, setSearch] = useState('');
  const money = n => `Rs. ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const visible = useMemo(() => {
    if (!search.trim()) return staff;
    const q = search.trim().toLowerCase();
    return staff.filter(s => s.name.toLowerCase().includes(q));
  }, [staff, search]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[18px] font-semibold text-slate-900">Payroll analytics</h2>
        <p className="text-[12px] text-slate-400 mt-0.5">
          Weekday pay uses each person's own rate; weekend hours at Rs. {rates.weekendRate}/hr (unconfirmed default).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ReportAnalyticsCard staff={loading ? [] : visible} monthDate={monthDate} />
        </div>
        <AttendanceBreakdownCard staff={loading ? [] : visible} monthDate={monthDate} />
      </div>

      <div className="bg-white rounded-[22px] overflow-hidden shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
        <div className="px-5 py-4 flex items-center justify-between gap-3">
          <h3 className="text-[15px] font-semibold text-slate-900">Pay by staff</h3>
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
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[560px]">
            <thead>
              <tr className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-t border-slate-100">
                <th className="px-5 py-3">Staff</th>
                <th className="px-3 py-3 text-right">Rate (Rs/hr)</th>
                <th className="px-3 py-3 text-right">Weekday hrs</th>
                <th className="px-3 py-3 text-right">Weekend hrs</th>
                <th className="px-5 py-3 text-right">Est. pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visible.map(s => (
                <tr key={s.uid} className="text-[13px]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar user={s} size={28} />
                      <span className="text-slate-900 font-medium truncate">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-slate-500 tabular-nums">{s.weekdayRate}</td>
                  <td className="px-3 py-3 text-right text-slate-500 tabular-nums">{s.weekdayHours.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right text-slate-500 tabular-nums">{s.weekendHours.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right text-blue-600 font-semibold tabular-nums">{money(s.estPay)}</td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">No staff for this month.</td>
                </tr>
              )}
            </tbody>
            {totals && visible.length > 0 && (
              <tfoot>
                <tr className="text-[13px] border-t border-slate-200 bg-slate-50">
                  <td colSpan={4} className="px-5 py-3 text-slate-900 font-semibold">Total</td>
                  <td className="px-5 py-3 text-right text-blue-600 font-bold tabular-nums">
                    {money(visible.reduce((a, s) => a + s.estPay, 0))}
                  </td>
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
