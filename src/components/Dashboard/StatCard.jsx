import React from 'react';
import { CalendarCheck, Clock3, Wallet, ArrowUpRight } from 'lucide-react';

/**
 * Top-row metric tile, light theme matching the admin panel's stat tiles -
 * white card, a small icon box, the big number, and a delta line underneath.
 */
const TONES = {
  1: { icon: CalendarCheck, iconBg: 'bg-blue-50', iconInk: 'text-blue-500' },
  2: { icon: Clock3, iconBg: 'bg-amber-50', iconInk: 'text-amber-500' },
  3: { icon: Wallet, iconBg: 'bg-emerald-50', iconInk: 'text-emerald-500' },
};

const StatCard = ({ label, value, unit, delta, tone = 1, onAction, actionLabel }) => {
  const t = TONES[tone] ?? TONES[1];
  const Icon = t.icon;

  return (
    <div className="bg-white rounded-[22px] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.05)] flex flex-col justify-between gap-5 min-h-[118px]">
      <div className="flex items-start justify-between gap-3">
        <div className={`w-9 h-9 rounded-xl ${t.iconBg} ${t.iconInk} flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>

        <button
          type="button"
          onClick={onAction}
          aria-label={actionLabel || `View ${label}`}
          className="shrink-0 w-7 h-7 rounded-full border border-slate-100 text-slate-300
                      hover:text-slate-600 hover:border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div>
        <p className="text-[12px] text-slate-500 mb-1.5">{label}</p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[26px] font-semibold tracking-tight tabular-nums text-slate-900">{value}</span>
          {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
        </div>
        {delta && <span className="text-[11px] font-medium text-slate-400">{delta}</span>}
      </div>
    </div>
  );
};

export default StatCard;
