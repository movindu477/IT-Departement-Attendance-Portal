import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Users, Flame, CalendarCheck, AlertCircle } from 'lucide-react';
import { useTeam } from '../../hooks/useTeam';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../Layout/Avatar';

const MemberCard = ({ member, isSelf }) => {
  const { stats } = member;

  return (
    <div className={`p-5 rounded-3xl border transition-all ${
      member.isOnline
        ? 'bg-canvas border-emerald-200 shadow-[0_4px_20px_rgba(16,185,129,0.06)]'
        : 'bg-canvas border-line/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]'
    }`}>
      <div className="flex items-start gap-4">
        <Avatar user={member} size={48} status={member.isOnline ? 'active' : 'offline'} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-ink text-sm truncate">{member.name || 'Unnamed'}</h3>
            {isSelf && (
              <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full
                               bg-[#111827] text-white">You</span>
            )}
          </div>
          <p className={`text-[11px] mt-1 font-semibold ${member.isOnline ? 'text-emerald-600' : 'text-muted'}`}>
            {member.lastSeenLabel ?? 'Never seen'}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-line flex items-center gap-5 text-xs">
        <span className="flex items-center gap-1.5 text-muted">
          <CalendarCheck className="w-3.5 h-3.5 text-ink-soft" />
          <span className="font-extrabold text-ink">{stats.daysPresent}</span>
          <span className="text-muted font-medium">days</span>
        </span>

        {/* null means "not applicable for this month", not a zero streak */}
        {stats.currentStreak !== null && stats.currentStreak > 0 && (
          <span className="flex items-center gap-1.5 text-muted">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-extrabold text-ink">{stats.currentStreak}</span>
            <span className="text-muted font-medium">streak</span>
          </span>
        )}

        {stats.lastMarked && (
          <span className="ml-auto text-muted text-[11px] font-medium hidden sm:block">
            last {stats.lastMarked.slice(5)}
          </span>
        )}
      </div>
    </div>
  );
};

const TeamPage = () => {
  const { user } = useAuth();
  const monthKey = format(new Date(), 'yyyy-MM');
  const { byActivity, online, loading, error } = useTeam(monthKey);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-canvas text-ink">

      <header className="h-16 shrink-0 bg-surface border-b border-line px-4 sm:px-8 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 -ml-2 text-muted hover:text-ink hover:bg-subtle rounded-lg transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h2 className="text-lg font-bold text-ink tracking-tight flex items-center gap-2">
            <Users className="w-4 h-4 text-brand" />
            My Team
          </h2>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-ink-soft">
            <span className="w-2 h-2 rounded-full bg-online" />
            {online.length} online
          </span>
          <span className="text-muted hidden sm:block">·</span>
          <span className="text-muted hidden sm:block">
            {format(new Date(monthKey + '-01'), 'MMMM yyyy')}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        {loading && (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-ink-soft">
            <div className="w-10 h-10 rounded-full border-4 border-brand/20 border-t-brand animate-spin" />
            <p className="text-sm font-medium tracking-wide">Loading team...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-soft border-l-4 border-accent border-y border-r border-accent/20">
            <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wider mb-0.5 text-accent">
                Could not load team
              </h4>
              <p className="text-xs text-ink/90 font-light">{error.message}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="text-[11px] text-muted uppercase tracking-wider font-bold mb-4">
              {byActivity.length} member{byActivity.length === 1 ? '' : 's'}
              <span className="normal-case font-normal tracking-normal text-muted">
                {' '}— attendance counts only, no hours or pay
              </span>
            </p>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {byActivity.map(m => (
                <MemberCard key={m.uid} member={m} isSelf={m.uid === user?.uid} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TeamPage;
