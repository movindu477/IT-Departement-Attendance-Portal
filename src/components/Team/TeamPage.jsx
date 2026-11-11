import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Users, Flame, CalendarCheck, AlertCircle } from 'lucide-react';
import { useTeam } from '../../hooks/useTeam';
import { useAuth } from '../../context/AuthContext';
import StaffRail from '../Layout/StaffRail';
import Avatar from '../Layout/Avatar';

const MemberCard = ({ member, isSelf }) => {
  const { stats } = member;

  return (
    <div className={`p-5 rounded-[22px] bg-white transition-all ${
      member.isOnline
        ? 'shadow-[0_2px_16px_rgba(16,185,129,0.1)]'
        : 'shadow-[0_2px_12px_rgba(15,23,42,0.05)]'
    }`}>
      <div className="flex items-start gap-4">
        <Avatar user={member} size={48} status={member.isOnline ? 'active' : 'offline'} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm truncate">{member.name || 'Unnamed'}</h3>
            {isSelf && (
              <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full
                               bg-slate-900 text-white">You</span>
            )}
          </div>
          <p className={`text-[11px] mt-1 font-semibold ${member.isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
            {member.lastSeenLabel ?? 'Never seen'}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-5 text-xs">
        <span className="flex items-center gap-1.5 text-slate-400">
          <CalendarCheck className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-extrabold text-slate-900">{stats.daysPresent}</span>
          <span className="text-slate-400 font-medium">days</span>
        </span>

        {/* null means "not applicable for this month", not a zero streak */}
        {stats.currentStreak !== null && stats.currentStreak > 0 && (
          <span className="flex items-center gap-1.5 text-slate-400">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-extrabold text-slate-900">{stats.currentStreak}</span>
            <span className="text-slate-400 font-medium">streak</span>
          </span>
        )}

        {stats.lastMarked && (
          <span className="ml-auto text-slate-400 text-[11px] font-medium hidden sm:block">
            last {stats.lastMarked.slice(5)}
          </span>
        )}
      </div>
    </div>
  );
};

const TeamPage = () => {
  const { user, isAdmin } = useAuth();
  const monthKey = format(new Date(), 'yyyy-MM');
  const { byActivity, online, loading, error } = useTeam(monthKey);

  // Admin has no staff dashboard of their own to go back to - only the
  // admin panel exists for that account.
  const backTo = isAdmin ? '/admin' : '/';

  return (
    <div className="h-full w-full flex overflow-hidden bg-slate-100 text-slate-900">
      <StaffRail />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 shrink-0 bg-white border-b border-slate-100 px-4 sm:px-8 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <Link
              to={backTo}
              className="p-2 -ml-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
              title={isAdmin ? 'Back to admin panel' : 'Back to Dashboard'}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              My Team
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-online" />
              {online.length} online
            </span>
            <span className="text-slate-300 hidden sm:block">·</span>
            <span className="text-slate-400 hidden sm:block">
              {format(new Date(monthKey + '-01'), 'MMMM yyyy')}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {loading && (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
              <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-400 animate-spin" />
              <p className="text-sm font-medium tracking-wide">Loading team...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white border-l-4 border-rose-400 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wider mb-0.5 text-rose-500">
                  Could not load team
                </h4>
                <p className="text-xs text-slate-600 font-light">{error.message}</p>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold mb-4">
                {byActivity.length} member{byActivity.length === 1 ? '' : 's'}
                <span className="normal-case font-normal tracking-normal text-slate-400">
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
    </div>
  );
};

export default TeamPage;
