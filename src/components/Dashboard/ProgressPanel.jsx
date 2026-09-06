import React, { useEffect, useState } from 'react';
import { Activity, Flame } from 'lucide-react';

// Counts up to `value` whenever it changes, so the numeric readout moves with
// the bar instead of snapping ahead of it.
function useCountUp(value, duration = 700) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const from = display;
    const delta = value - from;
    if (delta === 0) return;

    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutCubic, matching the bar's transition curve
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + delta * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // display is intentionally excluded — including it would restart the tween
    // on every animation frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return display;
}

const Bar = ({ label, current, target, unit, format, barClass, hint }) => {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const shown = useCountUp(pct);
  const shownValue = useCountUp(current);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <span className="text-[11px] text-ink-soft font-semibold">{label}</span>
        <span className="text-[11px] font-mono text-muted tabular-nums">
          <span className="text-ink font-bold">
            {format ? format(shownValue) : shownValue.toFixed(0)}
          </span>
          <span> / {format ? format(target) : target}{unit ? ` ${unit}` : ''}</span>
        </span>
      </div>

      <div className="w-full bg-subtle rounded-full h-2.5 overflow-hidden border border-line">
        <div
          className={`digital-bar h-full rounded-full ${barClass}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>

      <div className="flex justify-between items-center mt-1.5">
        <span className="text-[10px] text-muted">{hint}</span>
        <span className="text-[10px] font-mono text-ink-soft tabular-nums font-semibold">{shown.toFixed(1)}%</span>
      </div>
    </div>
  );
};

const ProgressPanel = ({
  totalHours,
  hoursTarget,
  totalWorkedDays,
  workingDaysInMonth,
  totalSalary,
  salaryGoal,
  currentStreak,
  monthLabel,
}) => (
  <div className="bg-surface border border-line/80 rounded-3xl p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h3 className="text-base font-bold text-ink tracking-tight flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand" />
          Monthly Progress
        </h3>
        <p className="text-[11px] text-muted mt-0.5">{monthLabel} · updates live as you log</p>
      </div>

      {currentStreak > 0 && (
        <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-soft border border-accent/20">
          <Flame className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-bold text-accent tabular-nums">{currentStreak}</span>
          <span className="text-[10px] text-accent/80 uppercase tracking-wider font-bold">streak</span>
        </div>
      )}
    </div>

    <div className="space-y-5">
      <Bar
        label="Hours Logged"
        current={totalHours}
        target={hoursTarget}
        unit="hrs"
        format={v => v.toFixed(2)}
        barClass="bg-brand"
        hint={`${Math.max(hoursTarget - totalHours, 0).toFixed(2)} hrs remaining`}
      />

      <Bar
        label="Days Present"
        current={totalWorkedDays}
        target={workingDaysInMonth}
        unit="days"
        format={v => v.toFixed(0)}
        barClass="bg-mint-ink"
        hint={`${Math.max(workingDaysInMonth - totalWorkedDays, 0)} working days left`}
      />

      <Bar
        label="Earnings"
        current={totalSalary}
        target={salaryGoal}
        format={v => `Rs. ${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        barClass="bg-accent"
        hint={`Rs. ${Math.max(salaryGoal - totalSalary, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} to goal`}
      />
    </div>
  </div>
);

export default ProgressPanel;
