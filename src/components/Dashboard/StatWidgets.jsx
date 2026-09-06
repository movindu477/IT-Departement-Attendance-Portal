import React from 'react';
import { CheckCircle2, Clock3, DollarSign } from 'lucide-react';

/**
 * Pastel stat tiles, matching the reference: a soft tinted card, a dark navy
 * chip carrying the icon + label, the figure in large ink, and a rounded
 * navy pill at the bottom for the supporting metric.
 */
const Tile = ({ tint, ink, label, value, icon: Icon, footer }) => (
  <div className={`${tint} rounded-3xl p-5 relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-line transition-all hover:shadow-md`}>
    <div className="flex items-center gap-2 mb-3">
      <span className="w-7 h-7 rounded-xl bg-chip flex items-center justify-center shrink-0 shadow-xs">
        <Icon className="w-3.5 h-3.5 text-white" />
      </span>
      <span className={`text-[11px] font-bold tracking-tight ${ink}`}>{label}</span>
    </div>

    <p className="text-2xl font-extrabold text-ink tracking-tight truncate">{value}</p>

    {footer && (
      <div className="mt-3.5 inline-flex items-center gap-1.5 bg-chip text-white rounded-full px-3 py-1 text-[10px] font-semibold shadow-xs">
        {footer}
      </div>
    )}
  </div>
);

const StatWidgets = ({
  totalWorkedDays,
  totalHoursDecimal,
  totalSalary,
  workingDaysElapsed,
}) => (
  <div className="space-y-4">
    <Tile
      tint="bg-lav"
      ink="text-lav-ink"
      label="Worked Days"
      value={`${totalWorkedDays} Days`}
      icon={CheckCircle2}
      footer={
        <span className="text-[10px] font-semibold">
          {workingDaysElapsed > 0 ? `of ${workingDaysElapsed} so far` : 'No days elapsed'}
        </span>
      }
    />

    <Tile
      tint="bg-sky"
      ink="text-sky-ink"
      label="Monthly Hours"
      value={`${totalHoursDecimal} hrs`}
      icon={Clock3}
      footer={<span className="text-[10px] font-semibold">This month</span>}
    />

    <Tile
      tint="bg-mint"
      ink="text-mint-ink"
      label="Total Earnings"
      value={`Rs. ${totalSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      icon={DollarSign}
      footer={<span className="text-[10px] font-semibold">Earned to date</span>}
    />
  </div>
);

export default StatWidgets;

