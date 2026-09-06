import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronRight, AlertCircle } from 'lucide-react';
import Avatar from '../Layout/Avatar';

const Row = ({ member }) => (
  <li className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-subtle transition-colors">
    <Avatar user={member} size={32} status={member.isOnline ? 'active' : 'offline'} />
    <div className="min-w-0 flex-1">
      <p className={`text-xs font-semibold truncate ${member.isOnline ? 'text-ink' : 'text-ink-soft'}`}>
        {member.name || 'Unnamed'}
      </p>
      <p className={`text-[10px] truncate ${member.isOnline ? 'text-mint-ink' : 'text-muted'}`}>
        {member.lastSeenLabel ?? 'Never seen'}
      </p>
    </div>
    <span
      className={`w-2 h-2 rounded-full shrink-0 ${member.isOnline ? 'bg-online' : 'bg-line-strong'}`}
      aria-label={member.isOnline ? 'Online' : 'Offline'}
    />
  </li>
);

const TeamStatus = ({ byActivity, online, loading, error }) => {
  const offline = byActivity.filter(m => !m.isOnline);

  return (
    <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-2 mb-4 shrink-0">
        <h3 className="text-sm font-bold text-ink tracking-tight flex items-center gap-2">
          <Users className="w-4 h-4 text-brand" />
          Team Status
        </h3>
        <Link
          to="/team"
          className="text-[10px] text-muted hover:text-brand flex items-center gap-0.5 transition-colors"
        >
          All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-line" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-20 rounded bg-line" />
                <div className="h-2 w-14 rounded bg-line" />
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
        <div className="overflow-y-auto -mr-2 pr-2 space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-mint-ink px-2 mb-1">
              Online — {online.length}
            </p>
            <ul>
              {online.map(m => <Row key={m.uid} member={m} />)}
              {online.length === 0 && (
                <li className="text-[11px] text-muted px-2 py-2">Nobody else is online.</li>
              )}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted px-2 mb-1">
              Offline — {offline.length}
            </p>
            <ul>
              {offline.map(m => <Row key={m.uid} member={m} />)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamStatus;
