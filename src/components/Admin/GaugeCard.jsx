import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const COLORS = {
  blue: '#3B82F6',
  orange: '#F59E0B',
  green: '#22C55E',
};

/**
 * Half-circle gauge using the SVG `pathLength` trick: both arcs share one
 * path normalized to a length of 100, so the filled arc is just
 * `strokeDasharray={value} 100` - no manual arc-length math.
 */
const GaugeCard = ({ label, value, delta, tone = 'blue' }) => {
  const clamped = Math.max(0, Math.min(100, value));
  const color = COLORS[tone] || COLORS.blue;
  const isUp = typeof delta === 'number' ? delta >= 0 : null;

  return (
    <div className="bg-white rounded-[22px] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.05)] flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-[13px] font-medium text-slate-500">{label}</h4>
        {delta !== undefined && delta !== null && (
          <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${isUp ? 'text-emerald-500' : 'text-rose-400'}`}>
            {isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>

      <svg viewBox="0 0 100 54" className="w-full -mb-2">
        <path d="M 7 50 A 43 43 0 0 1 93 50" fill="none" stroke="#F1F5F9" strokeWidth="9" strokeLinecap="round" pathLength="100" />
        <path
          d="M 7 50 A 43 43 0 0 1 93 50"
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray={`${clamped} 100`}
        />
      </svg>
      <span className="text-[26px] font-semibold text-slate-900 tabular-nums -mt-1">{clamped}%</span>
    </div>
  );
};

export default GaugeCard;
