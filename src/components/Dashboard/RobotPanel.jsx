import React, { useEffect, useRef, useState } from 'react';
import { Cpu, Wifi, Flame, Sparkles } from 'lucide-react';
import { createRobotScene } from '../../three/robotScene';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * WebGL panel under the team widgets. The scene is decorative, but the HUD on
 * top of it is not — it reports live presence and streak, so the space earns
 * its place instead of being a toy.
 */
const RobotPanel = ({ userName, onlineCount, teamCount, currentStreak, hoursLogged }) => {
  const hostRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let handle = null;
    try {
      handle = createRobotScene(host, { reducedMotion: prefersReducedMotion() });
    } catch (err) {
      console.error('robot scene failed to start:', err);
    }

    if (!handle) {
      setFailed(true);
      return;
    }

    return () => handle.dispose();
  }, []);

  const firstName = (userName || 'there').split(' ')[0];

  return (
    <div className="relative rounded-3xl overflow-hidden border border-line bg-gradient-to-b from-surface to-canvas card-soft">
      {/* Scene */}
      <div
        ref={hostRef}
        className="w-full h-[280px] sm:h-[320px]"
        aria-hidden="true"
      />

      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
          <Sparkles className="w-7 h-7 text-brand" />
          <p className="text-xs text-muted font-light">
            3D view unavailable — WebGL is disabled in this browser.
          </p>
        </div>
      )}

      {/* HUD ------------------------------------------------------------- */}
      <div className="absolute inset-x-0 top-0 p-4 sm:p-5 flex items-start justify-between gap-3 pointer-events-none">
        <div>
          <h3 className="text-sm font-bold text-ink tracking-tight flex items-center gap-2">
            <Cpu className="w-4 h-4 text-brand" />
            Workspace Assistant
          </h3>
          <p className="text-[11px] text-muted mt-0.5">
            Keeping pace with you, {firstName}.
          </p>
        </div>

        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface/80 border border-line text-[10px] font-bold uppercase tracking-wider text-mint-ink">
          <span className="w-1.5 h-1.5 rounded-full bg-online animate-pulse" />
          Online
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface/85 border border-line text-[10px] font-semibold text-ink-soft">
            <Wifi className="w-3 h-3 text-brand" />
            {onlineCount} of {teamCount} online
          </span>

          {currentStreak > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface/85 border border-line text-[10px] font-semibold text-ink-soft">
              <Flame className="w-3 h-3 text-accent" />
              {currentStreak} day streak
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface/85 border border-line text-[10px] font-semibold text-ink-soft font-mono tabular-nums">
            {hoursLogged} hrs logged
          </span>
        </div>
      </div>
    </div>
  );
};

export default RobotPanel;
