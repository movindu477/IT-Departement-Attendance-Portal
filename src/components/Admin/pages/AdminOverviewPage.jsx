import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { useAdminShell } from '../AdminLayout';
import TeamOverviewCard from '../TeamOverviewCard';
import GaugeCard from '../GaugeCard';
import AttendanceBreakdownCard from '../AttendanceBreakdownCard';
import StaffTable from '../StaffTable';
import CalendarWidget from '../CalendarWidget';

const HOURS_TARGET = 160; // matches the staff dashboard's monthly target
const EMPTY_STAFF = [];

const AdminOverviewPage = () => {
  const { user } = useAuth();
  const { staff, totals, loading, monthDate, monthKey, shiftMonth, online } = useAdminShell();
  const [exportedCount, setExportedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'monthlyReports'), where('month', '==', monthKey)));
        if (!cancelled) setExportedCount(snap.size);
      } catch {
        if (!cancelled) setExportedCount(0);
      }
    })();
    return () => { cancelled = true; };
  }, [monthKey]);

  const staffCount = totals?.staffCount ?? 0;
  const attendancePct = staffCount > 0
    ? Math.min(100, Math.round(((totals?.daysPresent ?? 0) / (staffCount * new Date().getDate())) * 100))
    : 0;
  const hoursPct = staffCount > 0
    ? Math.min(100, Math.round(((totals?.totalHours ?? 0) / (staffCount * HOURS_TARGET)) * 100))
    : 0;
  const exportPct = staffCount > 0 ? Math.round((exportedCount / staffCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Top 12-col Grid: Left 4 cols = Hero TeamOverviewCard, Right 8 cols = 3 Arc Gauges + Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-4">
          <TeamOverviewCard
            totals={totals}
            online={online}
            adminEmail={user?.email}
            loading={loading}
            shiftMonth={shiftMonth}
          />
        </div>

        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GaugeCard
              label="Attendance Stability"
              value={loading ? 0 : attendancePct}
              tone="blue"
              delta={`${totals?.daysPresent ?? 0}d`}
            />
            <GaugeCard
              label="Hours Progress"
              value={loading ? 0 : hoursPct}
              tone="orange"
              delta={`${(totals?.totalHours ?? 0).toFixed(0)}h`}
            />
            <GaugeCard
              label="Export Adherence"
              value={loading ? 0 : exportPct}
              tone="green"
              delta={`${exportedCount}/${staffCount}`}
            />
          </div>

          <div className="flex-1">
            <AttendanceBreakdownCard staff={loading ? EMPTY_STAFF : staff} monthDate={monthDate} />
          </div>
        </div>
      </div>

      {/* Bottom 12-col Grid: Left 8 cols = Staff Overview Table, Right 4 cols = Highlighted Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-8">
          {loading ? (
            <div className="bg-[#F2F4F7] rounded-[20px] p-10 border border-white/80 flex flex-col items-center justify-center gap-3 text-slate-400 shadow-[0_2px_10px_rgba(15,23,42,0.03)] h-full min-h-[300px]">
              <div className="w-9 h-9 rounded-full border-4 border-blue-100 border-t-[#4A90E2] animate-spin" />
              <p className="text-xs font-medium text-slate-500">Loading staff attendance…</p>
            </div>
          ) : (
            <StaffTable staff={staff} totals={totals} monthDate={monthDate} monthKey={monthKey} />
          )}
        </div>

        <div className="lg:col-span-4">
          <CalendarWidget monthDate={monthDate} shiftMonth={shiftMonth} staff={loading ? EMPTY_STAFF : staff} />
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
