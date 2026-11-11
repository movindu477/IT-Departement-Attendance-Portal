import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useSmoothNumber } from '../../hooks/useSmoothNumber';

const TONES = {
  1: { color: '#4A90E2', triangleClass: 'text-[#4A90E2]', isDown: false },
  2: { color: '#F5A623', triangleClass: 'text-[#F5A623]', isDown: true },
  3: { color: '#95D600', triangleClass: 'text-[#95D600]', isDown: false },
};

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const safeEnd = Math.max(startAngle + 0.5, endAngle);
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, safeEnd);
  const largeArcFlag = safeEnd - startAngle <= 180 ? '0' : '1';
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

/**
 * Sweeping bottom-right arc gauge card matching the reference UI ("Vitals
 * Stability", "Treatment Progress", "Medication Adherence") with smooth 2.2s
 * count-up and arc sweep animations.
 */
const StatCard = ({
  label,
  value,
  numericValue,
  suffix = '%',
  unit,
  delta,
  percentage = 75,
  tone = 1,
  isDown,
  onAction,
  actionLabel,
}) => {
  const t = TONES[tone] ?? TONES[1];
  const targetPct = Math.max(4, Math.min(100, Number(percentage) || 0));
  const animatedPct = useSmoothNumber(targetPct, 2200);

  // Determine numeric value to count up smoothly
  const parsedNum =
    numericValue !== undefined
      ? Number(numericValue)
      : typeof value === 'number'
        ? value
        : parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
  const isPercentDisplay = String(value).trim().endsWith('%') || numericValue !== undefined;
  const animatedNum = useSmoothNumber(parsedNum, 2200);

  const downArrow = isDown !== undefined ? isDown : t.isDown;

  // Arc geometry: starts at bottom-center of the card and sweeps to the right edge
  const cx = 178;
  const cy = 136;
  const r = 104;
  const startAngle = 182;
  const maxSweep = 114; // 182deg -> 296deg
  const trackEndAngle = 304;
  const activeEndAngle = startAngle + (animatedPct / 100) * maxSweep;

  const trackPath = describeArc(cx, cy, r, startAngle, trackEndAngle);
  const activePath = describeArc(cx, cy, r, startAngle, activeEndAngle);
  const dot = polarToCartesian(cx, cy, r, activeEndAngle);

  const formattedDisplay = isPercentDisplay
    ? `${Math.round(animatedNum)}${suffix}`
    : value;

  return (
    <div className="bg-[#F2F4F7] rounded-[20px] p-5 border border-white/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)] relative overflow-hidden min-h-[174px] flex flex-col justify-between">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <h4 className="text-[15px] font-medium text-[#1A1D21] tracking-tight">{label}</h4>

        <button
          type="button"
          onClick={onAction}
          aria-label={actionLabel || `View ${label}`}
          className="shrink-0 w-8 h-8 rounded-[10px] bg-[#E4E7EC] hover:bg-[#D8DCE3] text-[#2C3137]
                     flex items-center justify-center transition-colors cursor-pointer"
        >
          <ArrowUpRight className="w-4 h-4" strokeWidth={1.8} />
        </button>
      </div>

      {/* Bottom-left metric readout */}
      <div className="relative z-10 mt-auto pt-6">
        {delta && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] font-normal mb-1">
            <span>{delta}</span>
            <span className={`text-[9px] leading-none ${t.triangleClass}`}>
              {downArrow ? '▼' : '▲'}
            </span>
          </div>
        )}
        <div className="flex items-baseline gap-1.5">
          <span className="text-[28px] font-normal tracking-tight tabular-nums text-[#1A1D21] leading-none">
            {formattedDisplay}
          </span>
          {unit && <span className="text-xs font-medium text-[#6B7280]">{unit}</span>}
        </div>
      </div>

      {/* Bottom-right sweeping arc with glowing dot */}
      <svg
        viewBox="0 0 230 132"
        className="absolute bottom-0 right-0 w-[72%] h-[82%] pointer-events-none select-none"
        preserveAspectRatio="xMaxYMax meet"
      >
        {/* Full grey arc track */}
        <path
          d={trackPath}
          fill="none"
          stroke="#DCE1E8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Active colored arc smoothly sweeping into place */}
        <path
          d={activePath}
          fill="none"
          stroke={t.color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Soft halo + solid indicator dot riding the tip of the active arc */}
        <circle cx={dot.x} cy={dot.y} r="7" fill={t.color} fillOpacity="0.18" />
        <circle cx={dot.x} cy={dot.y} r="3.5" fill={t.color} />
      </svg>
    </div>
  );
};

export default StatCard;
