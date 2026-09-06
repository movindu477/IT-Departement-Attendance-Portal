import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { createRobotScene } from '../../three/robotScene';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Occupies the reference's mint promo slot, but the promotional copy is gone —
 * the card is the assistant itself. The scene fills the card and the only text
 * is a small live status chip, so the bot is the subject rather than an aside.
 */
const RobotPanel = ({ onlineCount, teamCount }) => {
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

  return (
    <div className="relative rounded-3xl overflow-hidden bg-canvas border border-line min-h-[188px]">
      <div ref={hostRef} className="w-full h-[188px]" aria-hidden="true" />

      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <Sparkles className="w-6 h-6 text-mint-deep" />
          <p className="text-[11px] text-ink-soft">
            3D view unavailable — WebGL is disabled in this browser.
          </p>
        </div>
      )}

      {/* Single live chip; no promo copy */}
      <span
        className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full
                   bg-surface/80 border border-line backdrop-blur-sm px-3 py-1 text-[10px] font-semibold text-ink-soft
                   pointer-events-none"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-online animate-pulse" />
        {onlineCount} of {teamCount} online
      </span>
    </div>
  );
};

export default RobotPanel;
