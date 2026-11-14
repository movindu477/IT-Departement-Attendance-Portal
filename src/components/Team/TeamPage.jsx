import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Users, Flame, CalendarCheck, AlertCircle } from 'lucide-react';
import { useTeam } from '../../hooks/useTeam';
import { useAuth } from '../../context/AuthContext';
import StaffRail from '../Layout/StaffRail';
import ThemeToggle from '../Layout/ThemeToggle';
import AvatarUpload, { resolveUserPortrait } from '../Layout/AvatarUpload';

const MemberCard = ({ member, isSelf }) => {
  const { stats } = member;

  return (
    <div
      className={`p-5 rounded-[20px] bg-[#F2F4F7] border border-white/80 transition-all ${
        member.isOnline
          ? 'shadow-[0_4px_16px_rgba(74,144,226,0.1)]'
          : 'shadow-[0_2px_10px_rgba(15,23,42,0.03)]'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="relative w-12 h-12 rounded-[10px] overflow-hidden bg-[#DCE8F8] border border-white shrink-0">
          <img
            src={resolveUserPortrait(member.avatar)}
            alt={member.name || 'Team member'}
            className="w-full h-full rounded-[10px] object-cover object-top"
          />
          <span
            className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
              member.isOnline ? 'bg-[#84CC16]' : 'bg-slate-400'
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#1A1D21] text-sm truncate">
              {member.name || 'Unnamed'}
            </h3>
            {isSelf && (
              <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-[#CFE3FF] text-[#2563EB]">
                You
              </span>
            )}
          </div>
          <p
            className={`text-[11px] mt-1 font-medium ${
              member.isOnline ? 'text-[#4A90E2]' : 'text-[#6B7280]'
            }`}
          >
            {member.lastSeenLabel ?? 'Never seen'}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3.5 border-t border-[#E2E6EC] flex items-center gap-5 text-xs">
        <span className="flex items-center gap-1.5 text-[#6B7280]">
          <CalendarCheck className="w-3.5 h-3.5 text-[#4A90E2]" />
          <span className="font-semibold text-[#1A1D21]">{stats.daysPresent}</span>
          <span className="text-[#6B7280]">days</span>
        </span>

        {stats.currentStreak !== null && stats.currentStreak > 0 && (
          <span className="flex items-center gap-1.5 text-[#6B7280]">
            <Flame className="w-3.5 h-3.5 text-[#F5A623]" />
            <span className="font-semibold text-[#1A1D21]">{stats.currentStreak}</span>
            <span className="text-[#6B7280]">streak</span>
          </span>
        )}

        {stats.lastMarked && (
          <span className="ml-auto text-[#6B7280] text-[11px] hidden sm:block">
            last {stats.lastMarked.slice(5)}
          </span>
        )}
      </div>
    </div>
  );
};

const TeamPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const monthKey = format(new Date(), 'yyyy-MM');
  const { byActivity, online, loading, error } = useTeam(monthKey);

  const backTo = isAdmin ? '/admin' : '/';

  return (
    <div className="h-full w-full flex overflow-hidden bg-[#E2E5EC] text-[#1A1D21]">
      <StaffRail activeSection="workspace" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="shrink-0 px-4 sm:px-6 pt-3.5 pb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-[120px]">
            <Link
              to={backTo}
              className="w-9 h-9 rounded-[12px] bg-[#F2F4F7] border border-white/80 hover:bg-white text-[#2C3137] flex items-center justify-center transition-colors"
              title={isAdmin ? 'Back to admin panel' : 'Back to Dashboard'}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-[13px] font-medium text-[#1A1D21] hidden sm:inline">
              Workspace
            </span>
          </div>

          {!isAdmin && (
            <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar mx-auto">
              {[
                { key: 'dashboard', label: 'Dashboard', to: '/' },
                { key: 'attendance', label: 'Attendance', to: '/' },
                { key: 'insights', label: 'Insights', to: '/' },
                { key: 'schedule', label: 'Schedule', to: '/' },
                { key: 'workspace', label: 'Workspace', to: '/team' },
              ].map((tab) => {
                const isActive = tab.key === 'workspace';
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => navigate(tab.to)}
                    className={`px-4 sm:px-5 py-2.5 rounded-[12px] text-[12.5px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#4A90E2] text-white shadow-[0_4px_12px_rgba(74,144,226,0.28)]'
                        : 'bg-[#F2F4F7] text-[#4B5563] border border-white/80 hover:bg-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          )}

          <div className="flex items-center gap-2.5 text-xs min-w-[120px] justify-end">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#F2F4F7] border border-white/80 text-[#374151]">
              <span className="w-2 h-2 rounded-full bg-[#84CC16]" />
              {online.length} online
            </span>
            <ThemeToggle />
            {!isAdmin && <AvatarUpload size={40} />}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
          {loading && (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-[#6B7280]">
              <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-[#4A90E2] animate-spin" />
              <p className="text-sm font-medium tracking-wide">Loading team...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-start gap-3 p-4 rounded-[20px] bg-[#F2F4F7] border border-rose-200">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wider mb-0.5 text-rose-500">
                  Could not load team
                </h4>
                <p className="text-xs text-slate-600">{error.message}</p>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[12px] text-[#6B7280]">
                  <strong className="text-[#1A1D21] font-medium">{byActivity.length}</strong>{' '}
                  member{byActivity.length === 1 ? '' : 's'} ·{' '}
                  {format(new Date(monthKey + '-01'), 'MMMM yyyy')}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {byActivity.map((m) => (
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
