import React, { useMemo, useState } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import { useAdminData } from '../../hooks/useAdminData';
import { useTeam } from '../../hooks/useTeam';
import AdminSidebar from './AdminSidebar';
import {
  Search, ChevronLeft, ChevronRight, Calendar, Lightbulb, MoreHorizontal,
  AlertCircle, ShieldAlert,
} from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Shell shared by every /admin/* page: sidebar, top bar (month picker,
 * search, rate note), and the month-scoped data every page needs. Child
 * routes read it via useOutletContext() / useAdminShell() below instead of
 * each re-fetching - there is exactly one useAdminData() call for the whole
 * admin section.
 */
const AdminLayout = () => {
  const today = new Date();
  const [monthDate, setMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [showRateNote, setShowRateNote] = useState(false);
  const [search, setSearch] = useState('');
  const [exportError, setExportError] = useState('');

  const { staff, totals, rates, loading, error, monthKey, reload } = useAdminData(monthDate);
  const { online, byActivity } = useTeam();

  const visibleStaff = useMemo(() => {
    if (!search.trim()) return staff;
    const q = search.trim().toLowerCase();
    return staff.filter(s => s.name.toLowerCase().includes(q));
  }, [staff, search]);

  const staffByUid = useMemo(() => Object.fromEntries(staff.map(s => [s.uid, s])), [staff]);

  const monthLabel = `${MONTHS[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
  const shiftMonth = (delta) => setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + delta, 1));

  const context = {
    monthDate, monthKey, monthLabel, shiftMonth,
    staff, visibleStaff, totals, rates, loading, error, reload,
    online, byActivity, staffByUid,
    search, setSearch,
    exportError, setExportError,
  };

  return (
    <div className="h-full w-full flex overflow-hidden bg-canvas text-ink">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
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

          {error ? (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface border border-danger/40">
              <ShieldAlert className="w-5 h-5 text-danger shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-danger">Could not load admin data</h4>
                <p className="text-xs text-ink-soft mt-0.5">{error.message}</p>
              </div>
            </div>
          ) : (
            <Outlet context={context} />
          )}
        </div>
      </div>
    </div>
  );
};

export const useAdminShell = () => useOutletContext();

export default AdminLayout;
