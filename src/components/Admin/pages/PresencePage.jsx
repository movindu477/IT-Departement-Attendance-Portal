import React from 'react';
import { useAdminShell } from '../AdminLayout';
import { resolveUserPortrait } from '../../Layout/AvatarUpload';

/** Full roster, online first - presence only, no attendance or pay data. */
const PresencePage = () => {
  const { byActivity, online } = useAdminShell();

  return (
    <div className="space-y-4">
      <div className="bg-[#F2F4F7] rounded-[20px] px-6 py-4 border border-white/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)] flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[17px] font-semibold text-slate-900 tracking-tight">Staff Presence Roster</h2>
          <p className="text-[11.5px] text-slate-500 mt-0.5">Who is online right now and when everyone else was last seen.</p>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-[10px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {online.length} Active Now
        </span>
      </div>

      <div className="bg-[#F2F4F7] rounded-[20px] p-5 border border-white/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)] overflow-hidden">
        <div className="divide-y divide-slate-200/60">
          {byActivity.map((m, idx) => (
            <div key={m.uid} className="flex items-center gap-4 px-3 py-3.5 hover:bg-white/50 rounded-xl transition-colors">
              <span className="text-[12px] text-slate-500 font-medium tabular-nums w-6">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="relative shrink-0">
                <img
                  src={resolveUserPortrait(m)}
                  alt={m.name}
                  className="w-10 h-10 rounded-[10px] object-cover object-top bg-slate-200 border border-white shadow-sm"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#F2F4F7] ${
                    m.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-slate-900 truncate">{m.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{m.jobTitle || 'Staff'} • ID #{String(m.uid || '10021').slice(0, 5).toUpperCase()}</p>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-[8px] text-[11px] font-medium ${
                  m.isOnline
                    ? 'bg-[#D6E6F9] text-[#2A6CB8]'
                    : 'bg-[#E5E8EF] text-slate-500'
                }`}
              >
                {m.isOnline ? 'Online' : m.lastSeenLabel ?? 'Never seen'}
              </span>
            </div>
          ))}

          {byActivity.length === 0 && (
            <p className="px-5 py-8 text-center text-slate-400 text-xs">No staff to show.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PresencePage;
