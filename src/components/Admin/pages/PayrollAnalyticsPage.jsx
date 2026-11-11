import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useAdminShell } from '../AdminLayout';
import ReportAnalyticsCard from '../ReportAnalyticsCard';
import AttendanceBreakdownCard from '../AttendanceBreakdownCard';
import { resolveUserPortrait } from '../../Layout/AvatarUpload';
import { useSmoothNumber } from '../../../hooks/useSmoothNumber';

function AnimatedPay({ value }) {
  const smooth = useSmoothNumber(value, 2200);
  return <>Rs. {Math.round(smooth).toLocaleString()}</>;
}

/** Numbers-and-charts view of payroll for the month - no per-day drill-down,
 *  that lives on the Attendance log page. */
const PayrollAnalyticsPage = () => {
  const { staff, totals, rates, loading, monthDate } = useAdminShell();
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    if (!search.trim()) return staff;
    const q = search.trim().toLowerCase();
    return staff.filter(s => s.name.toLowerCase().includes(q));
  }, [staff, search]);

  const totalEstPay = useMemo(
    () => visible.reduce((a, s) => a + s.estPay, 0),
    [visible]
  );

  return (
    <div className="space-y-4">
      <div className="bg-[#F2F4F7] rounded-[20px] px-6 py-4 border border-white/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)] flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[17px] font-semibold text-slate-900 tracking-tight">Payroll Analytics</h2>
          <p className="text-[11.5px] text-slate-500 mt-0.5">
            Weekday pay uses each person's own rate; weekend hours at Rs. {rates.weekendRate}/hr (unconfirmed default).
          </p>
        </div>
        <div className="px-3.5 py-2 rounded-[10px] bg-[#E5E8EF] text-[12px] font-semibold text-slate-800 tabular-nums">
          Total Payroll: <span className="text-[#4A90E2]"><AnimatedPay value={loading ? 0 : totalEstPay} /></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-7">
          <ReportAnalyticsCard staff={loading ? [] : visible} monthDate={monthDate} />
        </div>
        <div className="lg:col-span-5">
          <AttendanceBreakdownCard staff={loading ? [] : visible} monthDate={monthDate} />
        </div>
      </div>

      <div className="bg-[#F2F4F7] rounded-[20px] p-5 border border-white/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)] overflow-hidden">
        <div className="pb-4 flex items-center justify-between gap-3">
          <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight">Pay by Staff</h3>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff..."
              className="pl-8 pr-3 py-1.5 rounded-[10px] bg-[#E5E8EF] text-[11.5px] text-slate-700
                         placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/30 w-44 transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[560px]">
            <thead>
              <tr className="text-[11px] text-slate-500 font-medium border-t border-b border-slate-200/70">
                <th className="px-4 py-2.5 font-medium">Staff</th>
                <th className="px-3 py-2.5 text-right font-medium">Rate (Rs/hr)</th>
                <th className="px-3 py-2.5 text-right font-medium">Weekday hrs</th>
                <th className="px-3 py-2.5 text-right font-medium">Weekend hrs</th>
                <th className="px-4 py-2.5 text-right font-medium">Est. pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50">
              {visible.map(s => (
                <tr key={s.uid} className="text-[12.5px] hover:bg-white/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={resolveUserPortrait(s)}
                        alt={s.name}
                        className="w-8 h-8 rounded-[9px] object-cover object-top bg-slate-200 border border-white shadow-sm shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-slate-900 font-semibold truncate">{s.name}</p>
                        <p className="text-[10.5px] text-slate-400 truncate">{s.jobTitle || 'Staff'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-slate-600 tabular-nums">{s.weekdayRate}</td>
                  <td className="px-3 py-3 text-right text-slate-600 tabular-nums">{s.weekdayHours.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right text-slate-600 tabular-nums">{s.weekendHours.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-[#4A90E2] font-semibold tabular-nums">
                    <AnimatedPay value={s.estPay} />
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-xs">No staff for this month.</td>
                </tr>
              )}
            </tbody>
            {totals && visible.length > 0 && (
              <tfoot>
                <tr className="text-[12.5px] border-t border-slate-200/80 bg-white/40">
                  <td colSpan={4} className="px-4 py-3 text-slate-900 font-semibold">Total</td>
                  <td className="px-4 py-3 text-right text-[#4A90E2] font-bold tabular-nums">
                    <AnimatedPay value={totalEstPay} />
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
