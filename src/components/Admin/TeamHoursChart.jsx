import React from 'react';

/**
 * Horizontal hours bar per staff member for the selected month. Horizontal
 * rather than vertical bars because the label is a name, not a 3-letter day
 * abbreviation, and this stays legible for a roster of any size.
 */
const TeamHoursChart = ({ staff, monthLabel }) => {
  const peak = Math.max(1, ...staff.map(s => s.totalHours));

  return (
    <div className="bg-surface border border-line rounded-3xl p-5 flex flex-col h-full">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-ink tracking-tight">Hours by staff</h3>
        <span className="text-[11px] text-muted">{monthLabel}</span>
      </div>

      {staff.length === 0 ? (
        <p className="text-xs text-muted py-6 text-center">No attendance logged this month.</p>
      ) : (
        <div className="space-y-3.5 flex-1">
          {staff.map(s => {
            const pct = peak > 0 ? (s.totalHours / peak) * 100 : 0;
            return (
              <div key={s.uid} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-[11px] text-ink-soft truncate" title={s.name}>
                  {s.name}
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-raised overflow-hidden">
                  <div
                    className="digital-bar h-full rounded-full bg-mint"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-[11px] font-mono text-ink tabular-nums">
                  {s.totalHours.toFixed(1)}h
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamHoursChart;
