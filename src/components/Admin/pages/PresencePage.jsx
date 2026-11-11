import React from 'react';
import { useAdminShell } from '../AdminLayout';
import { Avatar } from '../../Layout/Avatar';

/** Full roster, online first - presence only, no attendance or pay data. */
const PresencePage = () => {
  const { byActivity, online } = useAdminShell();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-slate-900">Presence</h2>
          <p className="text-[12px] text-slate-400 mt-0.5">Who's online right now and when everyone else was last seen.</p>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {online.length} online
        </span>
      </div>

      <div className="bg-white rounded-[22px] overflow-hidden shadow-[0_2px_12px_rgba(15,23,42,0.05)] divide-y divide-slate-50">
        {byActivity.map(m => (
          <div key={m.uid} className="flex items-center gap-3 px-5 py-3.5">
            <Avatar user={m} size={36} status={m.isOnline ? 'active' : 'offline'} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-slate-900 truncate">{m.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{m.jobTitle || 'Staff'}</p>
            </div>
            <span className={`text-[11px] font-medium ${m.isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
              {m.lastSeenLabel ?? 'Never seen'}
            </span>
          </div>
        ))}

        {byActivity.length === 0 && (
          <p className="px-5 py-8 text-center text-slate-400 text-sm">No staff to show.</p>
        )}
      </div>
    </div>
  );
};

export default PresencePage;
