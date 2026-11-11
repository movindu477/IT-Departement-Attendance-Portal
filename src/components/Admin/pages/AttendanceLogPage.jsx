import React from 'react';
import { useAdminShell } from '../AdminLayout';
import StaffTable from '../StaffTable';

/** The day-by-day drill-down: expand any staff row to see every day of the
 *  selected month, in/out times, status and remarks. */
const AttendanceLogPage = () => {
  const { staff, totals, loading, monthDate, monthKey } = useAdminShell();

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-[18px] font-semibold text-slate-900">Attendance log</h2>
        <p className="text-[12px] text-slate-400 mt-0.5">
          Expand a row for the full day-by-day record - check-in/out, status and remarks for every day of the month.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-[22px] p-10 flex flex-col items-center justify-center gap-3 text-slate-400 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
          <div className="w-9 h-9 rounded-full border-4 border-blue-100 border-t-blue-400 animate-spin" />
          <p className="text-xs font-medium">Loading staff attendance…</p>
        </div>
      ) : (
        <StaffTable staff={staff} totals={totals} monthDate={monthDate} monthKey={monthKey} />
      )}
    </div>
  );
};

export default AttendanceLogPage;
