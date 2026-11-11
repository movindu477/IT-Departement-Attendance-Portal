import React from 'react';
import { useAdminShell } from '../AdminLayout';
import StaffTable from '../StaffTable';

/** The day-by-day drill-down: expand any staff row to see every day of the
 *  selected month, in/out times, status and remarks. */
const AttendanceLogPage = () => {
  const { staff, totals, loading, monthDate, monthKey } = useAdminShell();

  return (
    <div className="space-y-4">
      <div className="bg-[#F2F4F7] rounded-[20px] px-6 py-4 border border-white/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <h2 className="text-[17px] font-semibold text-slate-900 tracking-tight">Attendance Schedule & Logs</h2>
        <p className="text-[11.5px] text-slate-500 mt-0.5">
          Expand any staff row for the full day-by-day record — check-in/out times, status badges, and remarks for every day of the month.
        </p>
      </div>

      {loading ? (
        <div className="bg-[#F2F4F7] rounded-[20px] p-10 border border-white/80 flex flex-col items-center justify-center gap-3 text-slate-400 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <div className="w-9 h-9 rounded-full border-4 border-blue-100 border-t-[#4A90E2] animate-spin" />
          <p className="text-xs font-medium text-slate-500">Loading staff attendance…</p>
        </div>
      ) : (
        <StaffTable staff={staff} totals={totals} monthDate={monthDate} monthKey={monthKey} />
      )}
    </div>
  );
};

export default AttendanceLogPage;
