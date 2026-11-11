import React from 'react';
import { Target, Clock, Sunrise, Zap } from 'lucide-react';

/**
 * "Month progress" — answers the question a timesheet user actually has:
 * am I going to hit the month's target at my current pace?
 *
 * The projection is the point of this widget. Hours-to-date alone can't tell
 * you that; hours-per-elapsed-working-day extrapolated over the month can.
 */
const Stat = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 min-w-0">
    <span className="w-7 h-7 shrink-0 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
      <Icon className="w-3.5 h-3.5 text-slate-500" />
    </span>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-slate-900 tabular-nums truncate">{value}</p>
      <p className="text-[9px] text-slate-400 truncate">{label}</p>
    </div>
  </div>
);

const MonthProgress = ({
  hoursLogged,
  target,
  workingDaysElapsed,
  workingDaysInMonth,
  avgDayLength,
  avgStartTime,
  overtimeHours,
  monthLabel,
}) => {
  const pct = target > 0 ? Math.min((hoursLogged / target) * 100, 100) : 0;

  // Pace: hours per elapsed working day, extrapolated across the whole month.
  const perDay = workingDaysElapsed > 0 ? hoursLogged / workingDaysElapsed : 0;
  const projected = perDay * workingDaysInMonth;
  const daysLeft = Math.max(workingDaysInMonth - workingDaysElapsed, 0);
  const onTrack = projected >= target;

  // What each remaining day needs to carry to still land on target.
  const needPerDay = daysLeft > 0 ? Math.max(target - hoursLogged, 0) / daysLeft : 0;

  return (
    <div className="bg-white rounded-[22px] p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Month progress</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">{monthLabel}</p>
        </div>

        <span
          className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full ${
            onTrack ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
          }`}
        >
          {onTrack ? 'On track' : 'Behind pace'}
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-slate-900 tabular-nums tracking-tight">
          {hoursLogged.toFixed(2)}
        </span>
        <span className="text-[11px] text-slate-400 tabular-nums">/ {target} hrs target</span>
      </div>

      <div className="mt-2.5 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className={`digital-bar h-2 rounded-full ${onTrack ? 'bg-emerald-400' : 'bg-blue-400'}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Month hours progress"
        />
      </div>

      <p className="mt-2 text-[10px] text-slate-500">
        {workingDaysElapsed > 0 ? (
          <>
            On pace for <strong className="text-slate-900 font-semibold tabular-nums">{projected.toFixed(0)} hrs</strong>
            {daysLeft > 0 && (
              <>
                {' '}· <strong className="text-slate-900 font-semibold tabular-nums">{needPerDay.toFixed(2)}h</strong>
                <span className="text-slate-400"> needed per remaining day</span>
              </>
            )}
          </>
        ) : (
          <span className="text-slate-400">No working days elapsed yet this month.</span>
        )}
      </p>

      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
        <Stat
          icon={Clock}
          label="avg day"
          value={avgDayLength > 0 ? `${avgDayLength.toFixed(2)}h` : '—'}
        />
        <Stat
          icon={Sunrise}
          label="avg start"
          value={avgStartTime || '—'}
        />
        <Stat
          icon={overtimeHours > 0 ? Zap : Target}
          label={overtimeHours > 0 ? 'overtime' : 'days left'}
          value={overtimeHours > 0 ? `${overtimeHours.toFixed(1)}h` : `${daysLeft}`}
        />
      </div>
    </div>
  );
};

export default MonthProgress;
