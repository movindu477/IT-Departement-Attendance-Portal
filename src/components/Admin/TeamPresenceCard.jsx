import React from 'react';
import { TrendingUp } from 'lucide-react';

const TILE_COLORS = [
  { bg: 'bg-teal-500/15', ink: 'text-teal-300' },
  { bg: 'bg-violet-500/15', ink: 'text-violet-300' },
  { bg: 'bg-amber-500/15', ink: 'text-amber-300' },
  { bg: 'bg-rose-500/15', ink: 'text-rose-300' },
];

const HOURS_TARGET = 160; // matches the staff dashboard's monthly target

/**
 * "Online Classes" equivalent - who is online right now, with how close each
 * person is to this month's hours target standing in for the reference
 * design's completion percentage.
 */
const TeamPresenceCard = ({ online, staffByUid }) => {
  return (
    <div className="bg-surface border border-line rounded-[20px] p-5 card-soft">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-ink">Who's online</h3>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {online.length} online
        </span>
      </div>

      {online.length === 0 ? (
        <p className="text-xs text-muted py-6 text-center">No one is online right now.</p>
      ) : (
        <div className="space-y-4">
          {online.map((m, i) => {
            const tile = TILE_COLORS[i % TILE_COLORS.length];
            const stats = staffByUid[m.uid];
            const pct = stats ? Math.min(100, Math.round((stats.totalHours / HOURS_TARGET) * 100)) : null;
            const initials = (m.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

            return (
              <div key={m.uid} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${tile.bg} ${tile.ink} flex items-center justify-center text-[12px] font-bold shrink-0`}>
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink truncate">{m.name}</p>
                  <p className="text-[11px] text-muted truncate">{m.jobTitle || 'Staff'}</p>
                </div>
                {pct !== null && (
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-semibold text-ink">{pct}%</p>
                    <p className="flex items-center justify-end gap-0.5 text-[10px] text-emerald-300">
                      <TrendingUp className="w-2.5 h-2.5" />
                      target
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamPresenceCard;
