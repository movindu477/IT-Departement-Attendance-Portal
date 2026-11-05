import React, { useMemo, useState } from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import { useTeam } from '../../hooks/useTeam';
import AdminSidebar from './AdminSidebar';
import ReportAnalyticsCard from './ReportAnalyticsCard';
import TeamPresenceCard from './TeamPresenceCard';
import AttendanceBreakdownCard from './AttendanceBreakdownCard';
import StaffTable from './StaffTable';
import {
  Search, ChevronLeft, ChevronRight, Calendar, Lightbulb, MoreHorizontal,
  Users, CalendarCheck, Clock3, Wallet, AlertCircle, ShieldAlert, ArrowRight,
} from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const AdminDashboard = () => {
  const today = new Date();
  const [monthDate, setMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [showRateNote, setShowRateNote] = useState(false);
  const [search, setSearch] = useState('');

  const { staff, totals, rates, loading, error, monthKey } = useAdminData(monthDate);
  const { online } = useTeam();

  const visibleStaff = useMemo(() => {
    if (!search.trim()) return staff;
    const q = search.trim().toLowerCase();
    return staff.filter(s => s.name.toLowerCase().includes(q));
  }, [staff, search]);

  const staffByUid = useMemo(() => Object.fromEntries(staff.map(s => [s.uid, s])), [staff]);

  // Footer totals are derived from the visible (searched) rows, not the
  // org-wide totals, so they never show a figure that doesn't sum from what's
  // actually on screen.
  const visibleTotals = useMemo(() => visibleStaff.reduce((acc, s) => ({
    staffCount: acc.staffCount + 1,
    daysPresent: acc.daysPresent + s.daysPresent,
    weekdayHours: acc.weekdayHours + s.weekdayHours,
    weekendHours: acc.weekendHours + s.weekendHours,
    totalHours: acc.totalHours + s.totalHours,
    estPay: acc.estPay + s.estPay,
  }), { staffCount: 0, daysPresent: 0, weekdayHours: 0, weekendHours: 0, totalHours: 0, estPay: 0 }), [visibleStaff]);

  const monthLabel = `${MONTHS[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
  const shiftMonth = (delta) => setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + delta, 1));

  const attendancePct = totals && totals.staffCount > 0
    ? Math.min(100, Math.round((totals.daysPresent / (totals.staffCount * new Date().getDate())) * 100))
    : 0;

  const handleTeamExport = async () => {
    setExportError('');
    setExporting(true);
    try {
      const { generateTeamTimesheet } = await import('../../utils/generateTeamTimesheet');
      await generateTeamTimesheet(monthDate, staff, rates);
    } catch (err) {
      console.error('Team timesheet export failed:', err);
      setExportError('Could not build the team sheet. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h-full w-full flex overflow-hidden bg-[#F7F7F9] text-gray-900">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 px-6 py-4 flex items-center gap-4 border-b border-gray-100 bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-[13px] text-gray-700
                         placeholder:text-gray-400 focus:outline-none focus:border-violet-300 focus:bg-white transition-colors"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-300 bg-white border border-gray-200 rounded px-1.5 py-0.5">/</kbd>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-full pl-1 pr-3 py-1">
              <button
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-white hover:text-gray-700 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[12px] font-medium text-gray-700 min-w-[96px] text-center">{monthLabel}</span>
              <button
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-white hover:text-gray-700 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowRateNote(v => !v)}
                title="Pay rate assumptions"
                className="w-9 h-9 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors cursor-pointer"
              >
                <Lightbulb className="w-4 h-4" />
              </button>
              {showRateNote && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-[11px] text-gray-500 z-10">
                  Weekday pay uses each person's own configured rate. Weekend hours are assumed at Rs. {rates.weekendRate}/hr — unconfirmed, see export notes.
                </div>
              )}
            </div>

            <button
              title="More options"
              className="w-9 h-9 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {exportError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-red-100 text-red-600 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {exportError}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-red-100">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-600">Could not load admin data</h4>
                <p className="text-xs text-gray-500 mt-0.5">{error.message}</p>
              </div>
            </div>
          )}

          {!error && (
            <>
              {/* Stat tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-100 rounded-[20px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-5 min-h-[128px]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center text-gray-400">
                        <CalendarCheck className="w-4 h-4" />
                      </div>
                      <span className="text-[12px] text-gray-500">Days present</span>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live
                    </span>
                  </div>
                  <div>
                    <span className="text-[26px] font-semibold text-gray-900 tabular-nums">{loading ? '…' : totals?.daysPresent ?? 0}</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
                      <span>Progress</span>
                      <span className="font-medium text-gray-600">{attendancePct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-violet-400" style={{ width: `${attendancePct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-[20px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-5 min-h-[128px]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center text-gray-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-[12px] text-gray-500">Total staff</span>
                  </div>
                  <span className="text-[26px] font-semibold text-gray-900 tabular-nums">{loading ? '…' : totals?.staffCount ?? 0}</span>
                  <button
                    onClick={() => scrollTo('staff-table-section')}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-[11px] font-medium text-gray-500 transition-colors cursor-pointer"
                  >
                    View roster <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="bg-white border border-gray-100 rounded-[20px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-5 min-h-[128px]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center text-gray-400">
                      <Clock3 className="w-4 h-4" />
                    </div>
                    <span className="text-[12px] text-gray-500">Total hours</span>
                  </div>
                  <span className="text-[26px] font-semibold text-gray-900 tabular-nums">
                    {loading ? '…' : (totals?.totalHours ?? 0).toFixed(1)}
                  </span>
                  <button
                    onClick={() => scrollTo('analytics-section')}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-[11px] font-medium text-gray-500 transition-colors cursor-pointer"
                  >
                    View chart <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="bg-white border border-gray-100 rounded-[20px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-5 min-h-[128px]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center text-gray-400">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <span className="text-[12px] text-gray-500">Est. payroll</span>
                  </div>
                  <span className="text-[26px] font-semibold text-gray-900 tabular-nums">
                    Rs. {loading ? '…' : (totals?.estPay ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <button
                    onClick={handleTeamExport}
                    disabled={exporting || loading}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-[11px] font-medium text-violet-600 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {exporting ? 'Building…' : 'Export sheet'} <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Chart + presence */}
              <div id="analytics-section" className="grid grid-cols-1 lg:grid-cols-3 gap-5 scroll-mt-4">
                <div className="lg:col-span-2">
                  <ReportAnalyticsCard staff={loading ? [] : staff} monthDate={monthDate} />
                </div>

                <div className="space-y-5">
                  <TeamPresenceCard online={online} staffByUid={staffByUid} />
                  <AttendanceBreakdownCard staff={loading ? [] : staff} monthDate={monthDate} />
                </div>
              </div>

              {/* Table */}
              <div id="staff-table-section" className="scroll-mt-4">
                {loading ? (
                  <div className="bg-white border border-gray-100 rounded-[20px] p-10 flex flex-col items-center justify-center gap-3 text-gray-400">
                    <div className="w-9 h-9 rounded-full border-4 border-violet-100 border-t-violet-500 animate-spin" />
                    <p className="text-xs font-medium">Loading staff attendance…</p>
                  </div>
                ) : (
                  <StaffTable staff={visibleStaff} totals={visibleTotals} monthDate={monthDate} monthKey={monthKey} />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
