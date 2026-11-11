import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * "This week" — answers: did I hit a full day, which days fell short, and am I
 * up or down on last week?
 *
 * A dashed target line across the plot is the useful part: without it a bar
 * chart of hours tells you nothing about whether a day was actually complete.
 */
const HoursChart = ({
  data,
  standardDay = 8,
  weekTotal = 0,
  lastWeekTotal = 0,
  todayLabel,
}) => {
  const peak = Math.max(standardDay, ...data.map(d => d.value), 1);
  // Headroom so a bar at target doesn't touch the top edge.
  const axisMax = Math.ceil((peak * 1.15) / 2) * 2;

  const delta = weekTotal - lastWeekTotal;
  const hasLastWeek = lastWeekTotal > 0;
  const metTarget = data.filter(d => d.value >= standardDay).length;
  const loggedDays = data.filter(d => d.value > 0).length;
  const avgDay = loggedDays > 0 ? weekTotal / loggedDays : 0;

  const TrendIcon = delta > 0.05 ? TrendingUp : delta < -0.05 ? TrendingDown : Minus;
  const trendClass = delta > 0.05 ? 'text-emerald-500' : delta < -0.05 ? 'text-rose-500' : 'text-slate-400';

  const targetPct = axisMax > 0 ? (standardDay / axisMax) * 100 : 0;

  return (
    <div className="bg-white rounded-[22px] p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)] flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">This week</h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-semibold text-slate-900 tabular-nums tracking-tight">
              {weekTotal.toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-400">hrs logged</span>
          </div>
        </div>

        {hasLastWeek && (
          <span className={`shrink-0 flex items-center gap-1 text-[11px] font-medium ${trendClass}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            {delta > 0 ? '+' : ''}{delta.toFixed(1)}h
            <span className="text-slate-400 font-normal">vs last</span>
          </span>
        )}
      </div>

      {/* Plot */}
      <div className="relative flex-1 min-h-[92px] flex items-end justify-between gap-2 sm:gap-3">
        {/* Full-day target line */}
        <div
          className="absolute inset-x-0 border-t border-dashed border-slate-200 pointer-events-none"
          style={{ bottom: `${targetPct}%` }}
        >
          <span className="absolute -top-2 right-0 text-[9px] text-slate-400 bg-white px-1">
            {standardDay}h
          </span>
        </div>

        {data.map((d) => {
          const pct = axisMax > 0 ? (d.value / axisMax) * 100 : 0;
          const full = d.value >= standardDay;
          const isToday = d.label === todayLabel;

          return (
            <div key={d.label} className="relative flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div
                className="w-full max-w-[22px] flex flex-col justify-end h-full"
                title={`${d.label}: ${d.value.toFixed(2)} hrs${full ? ' — full day' : d.value > 0 ? ' — short' : ' — no log'}`}
              >
                {d.value > 0 ? (
                  <div
                    className={`chart-grow w-full rounded-t-md ${full ? 'bg-emerald-400' : 'bg-blue-400'}`}
                    style={{ height: `${pct}%` }}
                  />
                ) : (
                  <div className="w-full h-[3px] rounded-full bg-slate-100" />
                )}
              </div>
              <span className={`text-[10px] ${isToday ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
        <span className="text-[10px] text-slate-500">
          Avg <strong className="text-slate-900 font-semibold tabular-nums">{avgDay.toFixed(2)}h</strong>/day
        </span>
        <span className="text-[10px] text-slate-500">
          <strong className="text-slate-900 font-semibold tabular-nums">{metTarget}</strong>
          <span className="text-slate-400"> of {data.length} full days</span>
        </span>
      </div>
    </div>
  );
};

export default HoursChart;
