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
          <h2 className="text-[17px] font-semibold text-ink">Presence</h2>
          <p className="text-[12px] text-muted mt-0.5">Who's online right now and when everyone else was last seen.</p>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {online.length} online
        </span>
      </div>

      <div className="bg-surface border border-line rounded-[20px] overflow-hidden card-soft divide-y divide-line">
        {byActivity.map(m => (
          <div key={m.uid} className="flex items-center gap-3 px-5 py-3.5">
            <Avatar user={m} size={36} status={m.isOnline ? 'active' : 'offline'} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-ink truncate">{m.name}</p>
              <p className="text-[11px] text-muted truncate">{m.jobTitle || 'Staff'}</p>
            </div>
            <span className={`text-[11px] font-medium ${m.isOnline ? 'text-emerald-300' : 'text-muted'}`}>
              {m.lastSeenLabel ?? 'Never seen'}
            </span>
          </div>
        ))}

        {byActivity.length === 0 && (
          <p className="px-5 py-8 text-center text-muted text-sm">No staff to show.</p>
        )}
      </div>
    </div>
  );
};

export default PresencePage;
