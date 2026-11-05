import React, { useMemo, useState } from 'react';
import { Flame } from 'lucide-react';
import { MON_FIRST_LABELS, weekdayLabelOf, weekBlockIndexOf } from '../../utils/calendarUtils';

const MODES = ['Daily', 'Weekly', 'Monthly'];

/**
 * "Daily" = team hours by weekday (matches the Mon..Sun axis of the reference
 * design exactly). "Weekly" = team hours by week-of-month block, same blocks
 * the Excel export lays out. "Monthly" = hours by staff member.
 */
function buildBars(staff, monthDate, mode) {
  if (mode === 'Monthly') {
    return staff.map(s => ({ label: s.name.split(' ')[0], value: s.totalHours }));
  }

  if (mode === 'Weekly') {
    const totals = {};
    staff.forEach(s => {
      (s.records || []).forEach(r => {
        const hours = Number(r.hours) || 0;
        if (hours <= 0) return;
        const block = weekBlockIndexOf(r.date, monthDate);
        totals[block] = (totals[block] || 0) + hours;
      });
    });
    const blocks = Object.keys(totals).map(Number).sort((a, b) => a - b);
    return blocks.map(b => ({ label: `Week ${b + 1}`, value: totals[b] }));
  }

  // Daily: by weekday, Mon-first
  const totals = Object.fromEntries(MON_FIRST_LABELS.map(l => [l, 0]));
  staff.forEach(s => {
    (s.records || []).forEach(r => {
      const hours = Number(r.hours) || 0;
      if (hours <= 0) return;
      totals[weekdayLabelOf(r.date)] += hours;
    });
  });
  return MON_FIRST_LABELS.map(label => ({ label, value: totals[label] }));
}

const ReportAnalyticsCard = ({ staff, monthDate }) => {
  const [mode, setMode] = useState('Daily');
  const bars = useMemo(() => buildBars(staff, monthDate, mode), [staff, monthDate, mode]);

  const peak = Math.max(1, ...bars.map(b => b.value));
  const axisMax = Math.ceil((peak * 1.2) / 8) * 8 || 8;
  const peakIdx = bars.reduce((best, b, i) => (b.value > bars[best]?.value ? i : best), 0);

  return (
    <div className="bg-surface border border-line rounded-[20px] p-5 card-soft h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h3 className="text-[15px] font-semibold text-ink">Report Analytics</h3>
        <div className="flex items-center gap-0.5 bg-raised rounded-full p-1">
          {MODES.map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                mode === m ? 'bg-ink text-canvas' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-stretch gap-3 min-h-[180px]">
        {/* Axis labels */}
        <div className="flex flex-col justify-between text-[10px] text-muted pb-6 pt-8 text-right w-8 shrink-0">
          <span>{axisMax}h</span>
          <span>{Math.round(axisMax * 0.66)}h</span>
          <span>{Math.round(axisMax * 0.33)}h</span>
          <span>0h</span>
        </div>

        <div className="flex-1 flex items-end justify-between gap-2 sm:gap-3">
          {bars.length === 0 && (
            <p className="w-full text-center text-xs text-muted pb-8">No hours logged this month.</p>
          )}
          {bars.map((b, i) => {
            const pct = axisMax > 0 ? (b.value / axisMax) * 100 : 0;
            const isPeak = i === peakIdx && b.value > 0;

            return (
              <div key={b.label} className="relative flex-1 flex flex-col items-center h-full justify-end">
                {isPeak && (
                  <div className="mb-1.5 flex items-center gap-1 bg-ink text-canvas text-[10px] font-medium px-2 py-1 rounded-lg whitespace-nowrap">
                    <Flame className="w-3 h-3 text-orange-500" />
                    {b.value.toFixed(1)} Hours
                  </div>
                )}
                <div className="w-full max-w-[26px] flex flex-col justify-end" style={{ height: '132px' }}>
                  <div
                    className={`digital-bar w-full rounded-t-lg ${isPeak ? 'bg-violet-400' : 'bg-raised'}`}
                    style={{ height: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted mt-2 truncate max-w-[48px]">{b.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReportAnalyticsCard;
