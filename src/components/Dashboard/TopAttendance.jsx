import React, { useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  FileText,
} from 'lucide-react';
import { resolveUserPortrait } from '../Layout/AvatarUpload';

const PER_PAGE = 4;

/**
 * Bottom-left overview table matching the "Patient Overview" card in the
 * reference UI. Displays the ranked team roster by default and allows
 * switching to the user's own daily attendance log rows or exporting Excel.
 */
const TopAttendance = ({
  ranked = [],
  loading,
  error,
  currentUid,
  workingDaysElapsed = 0,
  monthLabel = '',
  daysList = [],
  selectedDay = null,
  onSelectDay,
  onExportExcel,
}) => {
  const [viewMode, setViewMode] = useState('team'); // 'team' | 'logs'
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [checkedIds, setCheckedIds] = useState({});

  const toggleCheck = (id) => {
    setCheckedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter daily logs to show logged days first or all working days
  const loggedOrRecentDays = daysList.filter(
    (d) => d.hours !== '0.00' || d.status === 'Present' || d.status === 'Day Off' || !d.isWeekend
  );

  const activeItems = viewMode === 'team' ? ranked : loggedOrRecentDays;
  const pageCount = Math.max(1, Math.ceil(activeItems.length / PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const visibleRows = activeItems.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);

  return (
    <div className="bg-[#F2F4F7] rounded-[20px] p-5 border border-white/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)] flex flex-col justify-between h-full">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="text-[16px] font-medium text-[#1A1D21] tracking-tight">
            Attendance Overview
          </h3>
          <p className="text-[11.5px] text-[#6B7280] mt-0.5">
            Manage and monitor all team profiles and daily logs from a single dashboard.
          </p>
        </div>

        <div className="flex items-center gap-2 relative">
          {onExportExcel && (
            <button
              type="button"
              onClick={onExportExcel}
              title="Download monthly timesheet (.xlsx)"
              className="px-3 py-2 rounded-[12px] bg-[#E4E7EC] hover:bg-[#D8DCE3] text-[#2C3137]
                         text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#4A90E2]" />
              <span className="hidden sm:inline">Export .xls</span>
            </button>
          )}

          {/* Filter dropdown pill matching "Today v" in the reference image */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="px-3.5 py-2 rounded-[12px] bg-[#E4E7EC] hover:bg-[#D8DCE3] text-[#2C3137]
                         text-[12px] font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>{viewMode === 'team' ? 'Today' : monthLabel || 'Daily Logs'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#4B5563]" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1.5 w-40 rounded-[14px] bg-white border border-slate-100 shadow-lg py-1 z-30 text-[12px]">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('team');
                    setPage(0);
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 cursor-pointer ${
                    viewMode === 'team' ? 'font-semibold text-[#4A90E2]' : 'text-slate-700'
                  }`}
                >
                  Today (Team Roster)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('logs');
                    setPage(0);
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 cursor-pointer ${
                    viewMode === 'logs' ? 'font-semibold text-[#4A90E2]' : 'text-slate-700'
                  }`}
                >
                  My Daily Logs ({monthLabel})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading & error states */}
      {loading && viewMode === 'team' && (
        <div className="space-y-3 py-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-[#E4E7EC]/60 animate-pulse" />
          ))}
        </div>
      )}

      {error && !loading && viewMode === 'team' && (
        <p className="text-xs text-rose-500 flex items-center gap-2 py-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error.message}
        </p>
      )}

      {/* Table matching the reference "Patient Overview" layout */}
      {(!loading || viewMode === 'logs') && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="text-[11px] text-[#6B7280] font-normal border-b border-[#E2E6EC]">
                <th className="py-2.5 pl-1 pr-2 w-8">
                  <span className="w-4 h-4 rounded-[4px] border border-[#B0B7C3] inline-block align-middle" />
                </th>
                <th className="py-2.5 px-2 font-normal w-12">No</th>
                <th className="py-2.5 px-2 font-normal">Name</th>
                <th className="py-2.5 px-2 font-normal">
                  {viewMode === 'team' ? 'Days' : 'Hours'}
                </th>
                <th className="py-2.5 px-2 font-normal">
                  {viewMode === 'team' ? 'Last Logged' : 'Schedule'}
                </th>
                <th className="py-2.5 px-2 font-normal">
                  {viewMode === 'team' ? 'Email address' : 'Task / Remarks'}
                </th>
                <th className="py-2.5 px-2 font-normal">Status</th>
                <th className="py-2.5 pl-2 pr-1 font-normal text-right w-12">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E6E9EF]/70">
              {viewMode === 'team' &&
                visibleRows.map((m, idx) => {
                  const rowNum = safePage * PER_PAGE + idx + 1;
                  const days = m.stats?.daysPresent ?? 0;
                  const pct =
                    workingDaysElapsed > 0
                      ? Math.min(100, Math.round((days / workingDaysElapsed) * 100))
                      : 0;
                  const isSelf = m.uid === currentUid;
                  const emailText =
                    m.email ||
                    `${(m.name || 'staff').toLowerCase().replace(/\s+/g, '')}@apiit.lk`;
                  const isPresentOrOnline = m.isOnline || days > 0;

                  return (
                    <tr
                      key={m.uid}
                      className="text-[12.5px] text-[#1A1D21] hover:bg-white/50 transition-colors"
                    >
                      <td className="py-3 pl-1 pr-2">
                        <input
                          type="checkbox"
                          checked={!!checkedIds[m.uid]}
                          onChange={() => toggleCheck(m.uid)}
                          className="w-4 h-4 rounded-[4px] border-[#B0B7C3] accent-[#4A90E2] cursor-pointer align-middle"
                        />
                      </td>
                      <td className="py-3 px-2 text-[#374151] tabular-nums">
                        {String(rowNum + 25).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-[10px] overflow-hidden bg-[#DCE8F8] shrink-0 border border-white">
                            <img
                              src={resolveUserPortrait(m.avatar)}
                              alt={m.name || 'Member'}
                              className="w-full h-full rounded-[10px] object-cover object-top"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-[#1A1D21] text-[13px] truncate">
                                {m.name || 'Unnamed'}
                              </p>
                              {isSelf && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#4A90E2]/15 text-[#2563EB]">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[10.5px] text-[#6B7280] truncate">
                              P-{String(m.uid || '10021').slice(0, 5).toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-[#374151] tabular-nums">
                        {days} {workingDaysElapsed > 0 ? `(${pct}%)` : ''}
                      </td>
                      <td className="py-3 px-2 text-[#374151] tabular-nums">
                        {m.stats?.lastMarked || 'No logs yet'}
                      </td>
                      <td className="py-3 px-2 text-[#374151] truncate max-w-[180px]">
                        {emailText}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-[8px] text-[11px] font-medium ${
                            isPresentOrOnline
                              ? 'bg-[#CFE3FF] text-[#3B82F6]'
                              : 'bg-[#FDE2B8] text-[#D97706]'
                          }`}
                        >
                          {m.isOnline ? 'Active' : days > 0 ? 'Present' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 pl-2 pr-1 text-right">
                        <button
                          type="button"
                          onClick={() => setViewMode('logs')}
                          title="Switch to daily logs"
                          className="p-1 rounded-lg text-[#4B5563] hover:bg-[#E4E7EC] transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

              {viewMode === 'logs' &&
                visibleRows.map((day) => {
                  const worked = day.hours !== '0.00' || day.status === 'Present';
                  const isDayOff = day.status === 'Day Off';
                  const isSelected = selectedDay?.dateKey === day.dateKey;

                  return (
                    <tr
                      key={day.dateKey}
                      onClick={() => onSelectDay && onSelectDay(day)}
                      className={`text-[12.5px] text-[#1A1D21] hover:bg-white/60 transition-colors cursor-pointer ${
                        isSelected ? 'bg-white/80' : ''
                      }`}
                    >
                      <td
                        className="py-3 pl-1 pr-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={worked}
                          readOnly
                          className="w-4 h-4 rounded-[4px] border-[#B0B7C3] accent-[#4A90E2] align-middle"
                        />
                      </td>
                      <td className="py-3 px-2 text-[#374151] tabular-nums">
                        {String(day.dateNum).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-[10px] bg-[#DCE8F8] text-[#2563EB] font-semibold text-xs flex items-center justify-center shrink-0">
                            {day.dayOfWeek}
                          </div>
                          <div>
                            <p className="font-medium text-[#1A1D21] text-[13px]">
                              {monthLabel} {day.dateNum}
                            </p>
                            <p className="text-[10.5px] text-[#6B7280]">{day.dateKey}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-[#374151] tabular-nums">
                        {day.hours} hrs
                      </td>
                      <td className="py-3 px-2 text-[#374151] tabular-nums">
                        {day.checkIn && day.checkOut
                          ? `${day.checkIn} - ${day.checkOut}`
                          : isDayOff
                            ? 'Day Off'
                            : 'Not logged'}
                      </td>
                      <td className="py-3 px-2 text-[#374151] truncate max-w-[180px]">
                        {day.reason || (worked ? `Rs. ${day.salary.toFixed(0)} earned` : 'Click to log')}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-[8px] text-[11px] font-medium ${
                            worked
                              ? 'bg-[#CFE3FF] text-[#3B82F6]'
                              : 'bg-[#FDE2B8] text-[#D97706]'
                          }`}
                        >
                          {worked ? 'Present' : isDayOff ? 'Day Off' : 'Absent'}
                        </span>
                      </td>
                      <td className="py-3 pl-2 pr-1 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectDay) onSelectDay(day);
                          }}
                          className="p-1 rounded-lg text-[#4B5563] hover:bg-[#E4E7EC] transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

              {visibleRows.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#6B7280]">
                    No attendance records published yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Subtle pagination footer if there are more than PER_PAGE rows */}
      {activeItems.length > PER_PAGE && (
        <div className="flex items-center justify-end gap-2 pt-2 mt-2 border-t border-[#E2E6EC]/60">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="w-6 h-6 rounded-full border border-[#9CA3AF] text-[#374151] flex items-center justify-center disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] text-[#6B7280] tabular-nums">
            {safePage + 1} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={safePage >= pageCount - 1}
            className="w-6 h-6 rounded-full border border-[#9CA3AF] text-[#374151] flex items-center justify-center disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TopAttendance;
