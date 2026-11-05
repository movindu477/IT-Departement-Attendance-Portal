import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAdminShell } from '../AdminLayout';
import { Avatar } from '../../Layout/Avatar';
import { FileSpreadsheet, CheckCircle2, Circle } from 'lucide-react';

/**
 * Who has exported their own monthly sheet, from monthlyReports/{userId}_{month}.
 * The admin's own team export deliberately never writes to that collection
 * (see generateTeamTimesheet.js) - this list is staff self-exports only.
 */
const ReportsPage = () => {
  const { visibleStaff, staff, rates, monthDate, monthKey, setExportError } = useAdminShell();
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportsError, setReportsError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingReports(true);
    setReportsError(null);

    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'monthlyReports'), where('month', '==', monthKey)));
        if (!cancelled) setReports(snap.docs.map(d => d.data()));
      } catch (e) {
        if (!cancelled) setReportsError(e);
      } finally {
        if (!cancelled) setLoadingReports(false);
      }
    })();

    return () => { cancelled = true; };
  }, [monthKey]);

  const exportedUids = new Set(reports.map(r => r.userId));

  const handleTeamExport = async () => {
    setExportError('');
    setExporting(true);
    try {
      const { generateTeamTimesheet } = await import('../../../utils/generateTeamTimesheet');
      await generateTeamTimesheet(monthDate, staff, rates);
    } catch (err) {
      console.error('Team timesheet export failed:', err);
      setExportError('Could not build the team sheet. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[17px] font-semibold text-ink">Reports</h2>
          <p className="text-[12px] text-muted mt-0.5">Who has exported their own timesheet this month, plus the team-wide export.</p>
        </div>
        <button
          onClick={handleTeamExport}
          disabled={exporting}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-[11px] font-semibold text-violet-300 transition-colors cursor-pointer disabled:opacity-50"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          {exporting ? 'Building…' : 'Download team sheet'}
        </button>
      </div>

      {reportsError && (
        <p className="text-[12px] text-danger bg-surface border border-danger/30 rounded-xl px-3 py-2">
          Could not load export records: {reportsError.message}
        </p>
      )}

      <div className="bg-surface border border-line rounded-[20px] overflow-hidden card-soft divide-y divide-line">
        {loadingReports ? (
          <p className="px-5 py-8 text-center text-muted text-sm">Loading export records…</p>
        ) : (
          <>
            {visibleStaff.map(s => {
              const exported = exportedUids.has(s.uid);
              return (
                <div key={s.uid} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar user={s} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink truncate">{s.name}</p>
                    <p className="text-[11px] text-muted truncate">{s.jobTitle || 'Staff'}</p>
                  </div>
                  {exported ? (
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Exported
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
                      <Circle className="w-3.5 h-3.5" /> Not yet
                    </span>
                  )}
                </div>
              );
            })}
            {visibleStaff.length === 0 && (
              <p className="px-5 py-8 text-center text-muted text-sm">No staff to show.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
