import React from 'react';
import { Trophy, AlertCircle } from 'lucide-react';
import Avatar from '../Layout/Avatar';

const medal = ['text-accent', 'text-ink-soft', 'text-orange-400'];

const TopAttendance = ({ ranked, loading, error, currentUid }) => (
  <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col min-h-0">
    <h3 className="text-sm font-bold text-ink tracking-tight flex items-center gap-2 mb-4 shrink-0">
      <Trophy className="w-4 h-4 text-accent" />
      Top Attendance
    </h3>

    {loading && (
      <div className="space-y-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-line" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-24 rounded bg-line" />
              <div className="h-2 w-16 rounded bg-line" />
            </div>
          </div>
        ))}
      </div>
    )}

    {error && !loading && (
      <p className="text-xs text-accent flex items-center gap-2">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        {error.message}
      </p>
    )}

    {!loading && !error && (
      <ul className="space-y-1.5 overflow-y-auto -mr-2 pr-2">
        {ranked.slice(0, 6).map((m, i) => (
          <li
            key={m.uid}
            className={`flex items-center gap-3 py-2 px-2.5 rounded-2xl transition-all ${m.uid === currentUid ? 'bg-brand-soft/80 border border-brand/20 shadow-xs' : 'hover:bg-subtle'
              }`}
          >
            <span className={`w-4 text-[11px] font-bold tabular-nums shrink-0 ${medal[i] ?? 'text-muted'}`}>
              {i + 1}
            </span>
            <Avatar user={m} size={34} status={m.isOnline ? 'active' : null} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink truncate">{m.name || 'Unnamed'}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-ink tabular-nums leading-none">{m.stats.daysPresent}</p>
              <p className="text-[9px] text-muted uppercase tracking-wider mt-0.5">days</p>
            </div>
          </li>
        ))}

        {ranked.length === 0 && (
          <li className="text-xs text-muted py-4 text-center">No attendance published yet.</li>
        )}
      </ul>
    )}
  </div>
);

export default TopAttendance;
