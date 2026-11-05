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
    <div className="h-full w-full flex overflow-hidden bg-canvas text-ink">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 px-6 py-4 flex items-center gap-4 border-b border-line bg-surface">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-raised border border-line text-[13px] text-ink
                         placeholder:text-muted focus:outline-none focus:border-violet-400/60 transition-colors"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted bg-surface border border-line rounded px-1.5 py-0.5">/</kbd>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1 bg-raised border border-line rounded-full pl-1 pr-3 py-1">
              <button
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:bg-line hover:text-ink transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <Calendar className="w-3.5 h-3.5 text-muted" />
              <span className="text-[12px] font-medium text-ink min-w-[96px] text-center">{monthLabel}</span>
              <button
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:bg-line hover:text-ink transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowRateNote(v => !v)}
                title="Pay rate assumptions"
                className="w-9 h-9 rounded-full bg-raised border border-line flex items-center justify-center text-muted hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
              >
                <Lightbulb className="w-4 h-4" />
              </button>
              {showRateNote && (
                <div className="absolute right-0 mt-2 w-64 bg-surface border border-line rounded-xl shadow-xl p-3 text-[11px] text-ink-soft z-10">
                  Weekday pay uses each person's own configured rate. Weekend hours are assumed at Rs. {rates.weekendRate}/hr — unconfirmed, see export notes.
                </div>
              )}
            </div>

            <button
              title="More options"
              className="w-9 h-9 rounded-full bg-raised border border-line flex items-center justify-center text-muted hover:bg-line hover:text-ink transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {exportError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-surface border border-danger/40 text-danger text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {exportError}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface border border-danger/40">
              <ShieldAlert className="w-5 h-5 text-danger shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-danger">Could not load admin data</h4>
                <p className="text-xs text-ink-soft mt-0.5">{error.message}</p>
              </div>
            </div>
          )}

          {!error && (
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
                  <div>
                    <span className="text-[26px] font-semibold text-ink tabular-nums">{loading ? '…' : totals?.daysPresent ?? 0}</span>
                  </div>
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
                    onClick={() => scrollTo('staff-table-section')}
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
                    onClick={() => scrollTo('analytics-section')}
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
                    onClick={handleTeamExport}
                    disabled={exporting || loading}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-[11px] font-medium text-violet-300 transition-colors cursor-pointer disabled:opacity-50"
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
                  <div className="bg-surface border border-line rounded-[20px] p-10 flex flex-col items-center justify-center gap-3 text-ink-soft">
                    <div className="w-9 h-9 rounded-full border-4 border-violet-500/20 border-t-violet-400 animate-spin" />
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
