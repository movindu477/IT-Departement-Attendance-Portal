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
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <TeamOverviewCard
          totals={totals}
          online={online}
          adminEmail={user?.email}
          loading={loading}
        />

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <GaugeCard label="Attendance rate" value={loading ? 0 : attendancePct} tone="blue" />
          <GaugeCard label="Hours progress" value={loading ? 0 : hoursPct} tone="orange" />
          <GaugeCard label="Export completion" value={loading ? 0 : exportPct} tone="green" />

          <div className="sm:col-span-3">
            <AttendanceBreakdownCard staff={loading ? [] : staff} monthDate={monthDate} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-white rounded-[22px] p-10 flex flex-col items-center justify-center gap-3 text-slate-400 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
              <div className="w-9 h-9 rounded-full border-4 border-blue-100 border-t-blue-400 animate-spin" />
              <p className="text-xs font-medium">Loading staff attendance…</p>
            </div>
          ) : (
            <StaffTable staff={staff} totals={totals} monthDate={monthDate} monthKey={monthKey} />
          )}
        </div>

        <CalendarWidget monthDate={monthDate} shiftMonth={shiftMonth} staff={loading ? [] : staff} />
      </div>
    </div>
  );
};

export default AdminOverviewPage;
