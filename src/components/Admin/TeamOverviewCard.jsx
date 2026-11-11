import React from 'react';
import { RefreshCw, Users as UsersIcon, MapPin, Mail } from 'lucide-react';

/**
 * Org-level stand-in for the reference design's "Patient details" card - a
 * generic team tile rather than a real photo (there is no single "subject"
 * for an attendance dashboard the way there is for a patient record).
 */
const TeamOverviewCard = ({ totals, online, adminEmail, loading, onRefresh }) => {
  const staffCount = totals?.staffCount ?? 0;
  const daysPresent = totals?.daysPresent ?? 0;
  const onlineCount = online.length;

  const pct = (n, max) => (max > 0 ? Math.min(100, Math.round((n / max) * 100)) : 0);

  return (
    <div className="bg-white rounded-[22px] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.05)] flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-slate-900">Team details</h3>
        <button
          onClick={onRefresh}
          title="Refresh"
          className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="w-full aspect-square max-h-[132px] rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mb-4">
        <UsersIcon className="w-12 h-12 text-white/90" />
      </div>

      <h4 className="text-[16px] font-semibold text-slate-900">IT Tech Team</h4>
      <p className="text-[12px] text-slate-400 mb-3">Department ID #APIIT-IT</p>

      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-2 text-[12px] text-slate-500">
          <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          APIIT, Sri Lanka
        </div>
        {adminEmail && (
          <div className="flex items-center gap-2 text-[12px] text-slate-500">
            <Mail className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            {adminEmail}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-auto pt-3 border-t border-slate-100">
        <div>
          <p className="text-[10px] text-slate-400 mb-1">Total staff</p>
          <p className="text-[17px] font-semibold text-slate-900 mb-1.5">{loading ? '…' : staffCount}</p>
          <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-blue-400" style={{ width: `${pct(staffCount, staffCount || 1)}%` }} />
          </div>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 mb-1">Days present</p>
          <p className="text-[17px] font-semibold text-slate-900 mb-1.5">{loading ? '…' : daysPresent}</p>
          <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-amber-400" style={{ width: `${pct(daysPresent, staffCount * 22)}%` }} />
          </div>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 mb-1">Online now</p>
          <p className="text-[17px] font-semibold text-slate-900 mb-1.5">{onlineCount}</p>
          <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-emerald-400" style={{ width: `${pct(onlineCount, staffCount || 1)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamOverviewCard;
