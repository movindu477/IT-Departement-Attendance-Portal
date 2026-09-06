import React from 'react';
import { CheckCircle2, Clock3, DollarSign } from 'lucide-react';

/**
 * Pastel stat tiles, matching the reference: a soft tinted card, a dark navy
 * chip carrying the icon + label, the figure in large ink, and a rounded
 * navy pill at the bottom for the supporting metric.
 */
const Tile = ({ tint, ink, label, value, icon: Icon, footer }) => (
  <div className={`${tint} rounded-3xl p-5 relative overflow-hidden border-2 border-slate-900 shadow-[0_5px_0_0_#0f172a,0_12px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_7px_0_0_#0f172a] transition-all`}>
    <div className="flex items-center gap-2 mb-3">
      <span className="w-7 h-7 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 shadow-xs">
        <Icon className="w-3.5 h-3.5 text-white" />
      </span>
      <span className={`text-[11px] font-bold tracking-tight ${ink}`}>{label}</span>
    </div>

    <p className="text-2xl font-extrabold text-slate-900 tracking-tight truncate">{value}</p>

    {footer && (
      <div className="mt-3.5 inline-flex items-center gap-1.5 bg-slate-900 text-white rounded-full px-3 py-1 text-[10px] font-semibold shadow-xs">
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
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

