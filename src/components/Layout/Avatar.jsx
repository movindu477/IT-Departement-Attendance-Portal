import React from 'react';

export function Avatar({ user, size = 40, status = null, className = '' }) {
  const initials = (user?.name || '?')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const statusColor =
    status === 'active' ? 'bg-emerald-500'
    : status === 'break' ? 'bg-amber-500'
    : status === 'offline' ? 'bg-slate-500'
    : null;

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.name || 'User avatar'}
          loading="lazy"
          className="w-full h-full rounded-xl object-cover bg-slate-900 ring-2 ring-violet-500/30"
        />
      ) : (
        <div
          className="w-full h-full rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600
                     text-white flex items-center justify-center font-semibold
                     ring-2 ring-violet-500/30"
          style={{ fontSize: size * 0.36 }}
        >
          {initials}
        </div>
      )}
      {statusColor && (
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950 ${statusColor}`} />
      )}
    </div>
  );
}

export default Avatar;
