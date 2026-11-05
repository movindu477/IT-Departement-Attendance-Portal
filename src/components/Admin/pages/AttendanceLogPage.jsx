import React from 'react';
import { useAdminShell } from '../AdminLayout';
import StaffTable from '../StaffTable';

/** The day-by-day drill-down: expand any staff row to see every day of the
 *  selected month, in/out times, status and remarks. */
const AttendanceLogPage = () => {
  const { visibleStaff, loading, monthDate, monthKey } = useAdminShell();

  const visibleTotals = visibleStaff.reduce((acc, s) => ({
    staffCount: acc.staffCount + 1,
    daysPresent: acc.daysPresent + s.daysPresent,
    weekdayHours: acc.weekdayHours + s.weekdayHours,
    weekendHours: acc.weekendHours + s.weekendHours,
    totalHours: acc.totalHours + s.totalHours,
    estPay: acc.estPay + s.estPay,
  }), { staffCount: 0, daysPresent: 0, weekdayHours: 0, weekendHours: 0, totalHours: 0, estPay: 0 });

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-[17px] font-semibold text-ink">Attendance log</h2>
        <p className="text-[12px] text-muted mt-0.5">
          Expand a row for the full day-by-day record - check-in/out, status and remarks for every day of the month.
        </p>
      </div>

      {loading ? (
        <div className="bg-surface border border-line rounded-[20px] p-10 flex flex-col items-center justify-center gap-3 text-ink-soft">
          <div className="w-9 h-9 rounded-full border-4 border-violet-500/20 border-t-violet-400 animate-spin" />
          <p className="text-xs font-medium">Loading staff attendance…</p>
        </div>
      ) : (
        <StaffTable staff={visibleStaff} totals={visibleTotals} monthDate={monthDate} monthKey={monthKey} />
      )}
    </div>
  );
};

export default AttendanceLogPage;
