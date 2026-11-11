import React, { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

/**
 * Roster card: circular portrait, name with a state badge, a dated line and a
 * short note. Read-only — there are no per-card actions.
 */
const MemberCard = ({
  member,
  isSelf = false,
  badge,
  badgeTone = 'azure',      // 'azure' = ranked/idle, 'mint' = active now
  dateLine,
  note,
}) => {
  const [imgError, setImgError] = useState(false);

  const initials = (member?.name || '?')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const badgeClass = badgeTone === 'mint'
    ? 'bg-emerald-50 text-emerald-600'
    : 'bg-blue-50 text-blue-600';

  const showPhoto = member?.avatar && !imgError;

  return (
    <div className="flex flex-col items-center text-center px-1">
      <div className="relative">
        {showPhoto ? (
          <img
            src={member.avatar}
            alt={member.name || 'Team member'}
            onError={() => setImgError(true)}
            loading="lazy"
            className="w-16 h-16 rounded-full object-cover bg-slate-100"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100
                          flex items-center justify-center text-base font-semibold text-slate-500">
            {initials}
          </div>
        )}

        {member?.isOnline && (
          <span
            className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-online border-2 border-white"
            title="Online now"
          />
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-center gap-1.5 flex-wrap">
        <h4 className="text-[13px] font-semibold text-slate-900 truncate max-w-[130px]">
          {member?.name || 'Unnamed'}
        </h4>
        {badge && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
            {badge}
          </span>
        )}
        {isSelf && (
          <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded
                           border border-slate-200 text-slate-500">
            You
          </span>
        )}
      </div>

      {dateLine && (
        <p className="mt-1.5 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <CalendarIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          {dateLine}
        </p>
      )}

      {note && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400 line-clamp-2">
          {note}
        </p>
      )}
    </div>
  );
};

export default MemberCard;
