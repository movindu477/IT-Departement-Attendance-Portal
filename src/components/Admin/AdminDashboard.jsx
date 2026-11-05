import React, { useState } from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import { useTeam } from '../../hooks/useTeam';
import AdminSidebar from './AdminSidebar';
import TeamHoursChart from './TeamHoursChart';
import StaffTable from './StaffTable';
import { Avatar } from '../Layout/Avatar';
import {
  ChevronLeft, ChevronRight, Users, CalendarCheck, Clock3, Wallet,
  FileSpreadsheet, AlertCircle, ShieldAlert,
} from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const TILES = [
  { key: 'staffCount', label: 'Total staff', icon: Users, bg: 'bg-tone-1', ink: 'text-tone-1-ink', soft: 'text-tone-1-ink/75', unit: '' },
  { key: 'daysPresent', label: 'Days present', icon: CalendarCheck, bg: 'bg-tone-2', ink: 'text-tone-2-ink', soft: 'text-tone-2-ink/70', unit: '' },
  { key: 'totalHours', label: 'Total hours', icon: Clock3, bg: 'bg-tone-3', ink: 'text-tone-3-ink', soft: 'text-tone-3-ink/70', unit: 'hrs' },
  { key: 'estPay', label: 'Est. payroll', icon: Wallet, bg: 'bg-tone-1', ink: 'text-tone-1-ink', soft: 'text-tone-1-ink/75', unit: 'Rs' },
];

const AdminDashboard = () => {
  const today = new Date();
  const [monthDate, setMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const { staff, totals, rates, loading, error } = useAdminData(monthDate);
  const { online } = useTeam();

  const monthLabel = `${MONTHS[monthDate.getMonth()]} ${monthDate.getFullYear()}`;

  const shiftMonth = (delta) => {
    setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

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

  const tileValue = (key) => {
    if (!totals) return '—';
    if (key === 'estPay') return totals.estPay.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (key === 'totalHours') return totals.totalHours.toFixed(1);
    return totals[key];
  };

  return (
    <div className="h-full w-full flex overflow-hidden bg-canvas text-ink">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="shrink-0 px-5 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-4 border-b border-line">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight">Admin overview</h1>
            <p className="text-[12px] text-muted mt-0.5">Read-only payroll view across the whole team</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-surface border border-line rounded-xl px-2 py-1.5">
              <button
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                className="w-7 h-7 rounded-lg bg-raised border border-line text-ink flex items-center justify-center hover:bg-line transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-medium text-ink px-2 min-w-[108px] text-center">{monthLabel}</span>
              <button
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                className="w-7 h-7 rounded-lg bg-raised border border-line text-ink flex items-center justify-center hover:bg-line transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleTeamExport}
              disabled={exporting || loading || !!error}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-mint text-mint-ink text-[11px] font-semibold
                         hover:bg-mint-deep transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              {exporting ? 'Building…' : 'Download team sheet'}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 space-y-5">
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {TILES.map(t => {
                  const Icon = t.icon;
                  return (
                    <div key={t.key} className={`${t.bg} rounded-3xl p-5 flex flex-col justify-between gap-5 min-h-[112px]`}>
                      <div className="flex items-start justify-between gap-3">
                        <p className={`text-[12px] leading-snug ${t.soft}`}>{t.label}</p>
                        <Icon className={`w-4 h-4 ${t.ink}`} />
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        {t.unit === 'Rs' && <span className={`text-sm font-medium ${t.ink}`}>Rs.</span>}
                        <span className={`text-2xl font-semibold tracking-tight tabular-nums ${t.ink}`}>
                          {loading ? '…' : tileValue(t.key)}
                        </span>
                        {t.unit === 'hrs' && <span className={`text-sm font-medium ${t.ink}`}>hrs</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chart + presence */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                  <TeamHoursChart staff={loading ? [] : staff} monthLabel={monthLabel} />
                </div>

                <div className="bg-surface border border-line rounded-3xl p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-ink tracking-tight">Who's online</h3>
                    <span className="flex items-center gap-1.5 text-[11px] text-ink-soft">
                      <span className="w-2 h-2 rounded-full bg-online" />
                      {online.length}
                    </span>
                  </div>

                  {online.length === 0 ? (
                    <p className="text-xs text-muted py-6 text-center">No one is online right now.</p>
                  ) : (
                    <div className="space-y-3 flex-1">
                      {online.map(m => (
                        <div key={m.uid} className="flex items-center gap-3">
                          <Avatar user={m} size={32} status="active" />
                          <div className="min-w-0">
                            <p className="text-[12px] font-medium text-ink truncate">{m.name}</p>
                            <p className="text-[10px] text-muted truncate">{m.jobTitle || 'Staff'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-muted mt-4 pt-3 border-t border-line">
                    Weekend hours assumed at Rs. {rates.weekendRate}/hr — unconfirmed, see export notes.
                  </p>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div className="bg-surface border border-line rounded-3xl p-10 flex flex-col items-center justify-center gap-3 text-ink-soft">
                  <div className="w-9 h-9 rounded-full border-4 border-brand-soft border-t-brand animate-spin" />
                  <p className="text-xs font-medium">Loading staff attendance…</p>
                </div>
              ) : (
                <StaffTable staff={staff} totals={totals} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
