import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAdminShell } from '../AdminLayout';
import { resolveUserPortrait } from '../../Layout/AvatarUpload';
import { FileSpreadsheet, CheckCircle2, Circle } from 'lucide-react';

/**
 * Who has exported their own monthly sheet, from monthlyReports/{userId}_{month}.
 * The admin's own team export deliberately never writes to that collection
 * (see generateTeamTimesheet.js) - this list is staff self-exports only.
 */
const ReportsPage = () => {
  const { staff, rates, monthDate, monthKey, setExportError } = useAdminShell();
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
      <div className="bg-[#F2F4F7] rounded-[20px] px-6 py-4 border border-white/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)] flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[17px] font-semibold text-slate-900 tracking-tight">Workspace Export Reports</h2>
          <p className="text-[11.5px] text-slate-500 mt-0.5">Who has exported their own timesheet this month, plus the team-wide Excel export.</p>
        </div>
        <button
          onClick={handleTeamExport}
          disabled={exporting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-[#4A90E2] hover:bg-[#3B7FD0] text-[12px] font-semibold text-white shadow-[0_2px_8px_rgba(74,144,226,0.28)] transition-colors cursor-pointer disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4" />
          {exporting ? 'Building…' : 'Download Team Sheet'}
        </button>
      </div>

      {reportsError && (
        <p className="text-[12px] text-rose-600 bg-[#F2F4F7] border border-rose-200 rounded-xl px-4 py-2.5 shadow-sm">
          Could not load export records: {reportsError.message}
        </p>
      )}

      <div className="bg-[#F2F4F7] rounded-[20px] p-5 border border-white/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)] overflow-hidden">
        {loadingReports ? (
          <p className="px-5 py-8 text-center text-slate-400 text-xs">Loading export records…</p>
        ) : (
          <div className="divide-y divide-slate-200/60">
            {staff.map((s, idx) => {
              const exported = exportedUids.has(s.uid);
              return (
                <div key={s.uid} className="flex items-center gap-4 px-3 py-3.5 hover:bg-white/50 rounded-xl transition-colors">
                  <span className="text-[12px] text-slate-500 font-medium tabular-nums w-6">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <img
                    src={resolveUserPortrait(s)}
                    alt={s.name}
                    className="w-10 h-10 rounded-[10px] object-cover object-top bg-slate-200 border border-white shadow-sm shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">{s.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{s.jobTitle || 'Staff'}</p>
                  </div>
                  {exported ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] text-[11px] font-medium bg-[#D6E6F9] text-[#2A6CB8]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Exported
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] text-[11px] font-medium bg-[#FADFC2] text-[#A86A24]">
                      <Circle className="w-3.5 h-3.5" /> Pending
                    </span>
                  )}
                </div>
              );
            })}
            {staff.length === 0 && (
              <p className="px-5 py-8 text-center text-slate-400 text-xs">No staff to show.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
