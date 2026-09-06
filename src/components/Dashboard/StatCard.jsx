import React from 'react';
import { ArrowUpRight } from 'lucide-react';

/**
 * Top-row metric tile. Each tile carries a solid brand fill; the ink and the
 * control chrome flip with it so contrast holds on both the dark purple and
 * the two bright fills.
 */
const TONES = {
  1: { bg: 'bg-tone-1', ink: 'text-tone-1-ink', soft: 'text-tone-1-ink/75', ring: 'border-tone-1-ink/30', hover: 'hover:bg-tone-1-ink/15' },
  2: { bg: 'bg-tone-2', ink: 'text-tone-2-ink', soft: 'text-tone-2-ink/70', ring: 'border-tone-2-ink/25', hover: 'hover:bg-tone-2-ink/10' },
  3: { bg: 'bg-tone-3', ink: 'text-tone-3-ink', soft: 'text-tone-3-ink/70', ring: 'border-tone-3-ink/25', hover: 'hover:bg-tone-3-ink/10' },
};

const StatCard = ({ label, value, unit, delta, tone = 1, onAction, actionLabel }) => {
  const t = TONES[tone] ?? TONES[1];

  return (
    <div className={`${t.bg} rounded-3xl p-5 flex flex-col justify-between gap-5 min-h-[118px]`}>
      <div className="flex items-start justify-between gap-3">
        <p className={`text-[13px] leading-snug max-w-[70%] ${t.soft}`}>{label}</p>

        <button
          type="button"
          onClick={onAction}
          aria-label={actionLabel || `View ${label}`}
          className={`shrink-0 w-8 h-8 rounded-full border ${t.ring} ${t.ink} ${t.hover}
                      flex items-center justify-center transition-colors cursor-pointer`}
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={`text-3xl font-semibold tracking-tight tabular-nums ${t.ink}`}>{value}</span>
        {unit && <span className={`text-lg font-medium ${t.ink}`}>{unit}</span>}
        {delta && <span className={`text-[11px] font-medium ${t.soft}`}>{delta}</span>}
      </div>
    </div>
  );
};

export default StatCard;
