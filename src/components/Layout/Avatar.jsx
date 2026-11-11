import React from 'react';

export function Avatar({ user, size = 40, status = null, className = '' }) {
  const initials = (user?.name || '?')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const statusColor =
    status === 'active' ? 'bg-online'
      : status === 'break' ? 'bg-accent'
        : status === 'offline' ? 'bg-offline'
          : null;

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.name || 'User avatar'}
          loading="lazy"
          className="w-full h-full rounded-[10px] object-cover bg-slate-100"
        />
      ) : (
        <div
          className="w-full h-full rounded-[10px] bg-gradient-to-tr from-blue-400 to-indigo-500
                     text-white flex items-center justify-center font-semibold"
          style={{ fontSize: size * 0.36 }}
        >
          {initials}
        </div>
      )}
      {statusColor && (
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${statusColor}`} />
      )}
    </div>
  );
}

export default Avatar;
