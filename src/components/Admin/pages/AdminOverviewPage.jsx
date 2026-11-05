import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminShell } from '../AdminLayout';
import ReportAnalyticsCard from '../ReportAnalyticsCard';
import TeamPresenceCard from '../TeamPresenceCard';
import AttendanceBreakdownCard from '../AttendanceBreakdownCard';
import { Users, CalendarCheck, Clock3, Wallet, ArrowRight } from 'lucide-react';

const AdminOverviewPage = () => {
  const navigate = useNavigate();
  const {
    staff, totals, rates, loading, monthDate, online, staffByUid, setExportError,
  } = useAdminShell();

  const attendancePct = totals && totals.staffCount > 0
    ? Math.min(100, Math.round((totals.daysPresent / (totals.staffCount * new Date().getDate())) * 100))
    : 0;

  const handleQuickExport = async () => {
    setExportError('');
    try {
      const { generateTeamTimesheet } = await import('../../../utils/generateTeamTimesheet');
      await generateTeamTimesheet(monthDate, staff, rates);
    } catch (err) {
      console.error('Team timesheet export failed:', err);
      setExportError('Could not build the team sheet. Please try again.');
    }
  };

  return (
    <>
      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-line rounded-[20px] p-5 card-soft flex flex-col justify-between gap-5 min-h-[128px]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg border border-line flex items-center justify-center text-muted">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <span className="text-[12px] text-ink-soft">Days present</span>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live
            </span>
          </div>
          <span className="text-[26px] font-semibold text-ink tabular-nums">{loading ? '…' : totals?.daysPresent ?? 0}</span>
          <div>
            <div className="flex items-center justify-between text-[11px] text-muted mb-1.5">
              <span>Progress</span>
              <span className="font-medium text-ink-soft">{attendancePct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-raised overflow-hidden">
              <div className="h-full rounded-full bg-violet-400" style={{ width: `${attendancePct}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-surface border border-line rounded-[20px] p-5 card-soft flex flex-col justify-between gap-5 min-h-[128px]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg border border-line flex items-center justify-center text-muted">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[12px] text-ink-soft">Total staff</span>
          </div>
          <span className="text-[26px] font-semibold text-ink tabular-nums">{loading ? '…' : totals?.staffCount ?? 0}</span>
          <button
            onClick={() => navigate('/admin/attendance')}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-raised hover:bg-line text-[11px] font-medium text-ink-soft transition-colors cursor-pointer"
          >
            View roster <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-surface border border-line rounded-[20px] p-5 card-soft flex flex-col justify-between gap-5 min-h-[128px]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg border border-line flex items-center justify-center text-muted">
              <Clock3 className="w-4 h-4" />
            </div>
            <span className="text-[12px] text-ink-soft">Total hours</span>
          </div>
          <span className="text-[26px] font-semibold text-ink tabular-nums">
            {loading ? '…' : (totals?.totalHours ?? 0).toFixed(1)}
          </span>
          <button
            onClick={() => navigate('/admin/payroll')}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-raised hover:bg-line text-[11px] font-medium text-ink-soft transition-colors cursor-pointer"
          >
            View chart <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-surface border border-line rounded-[20px] p-5 card-soft flex flex-col justify-between gap-5 min-h-[128px]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg border border-line flex items-center justify-center text-muted">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-[12px] text-ink-soft">Est. payroll</span>
          </div>
          <span className="text-[26px] font-semibold text-ink tabular-nums">
            Rs. {loading ? '…' : (totals?.estPay ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <button
            onClick={handleQuickExport}
            disabled={loading}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-[11px] font-medium text-violet-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            Export sheet <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Chart + presence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ReportAnalyticsCard staff={loading ? [] : staff} monthDate={monthDate} />
        </div>

        <div className="space-y-5">
          <TeamPresenceCard online={online} staffByUid={staffByUid} />
          <AttendanceBreakdownCard staff={loading ? [] : staff} monthDate={monthDate} />
        </div>
      </div>
    </>
  );
};

export default AdminOverviewPage;
