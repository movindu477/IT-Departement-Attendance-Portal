import { useState, useEffect, useRef } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Smoothly interpolates a numeric value from 0 (on first mount) or from its
 * previous value to `target` over `duration` ms using a gentle easeOutQuart
 * curve so dashboard counters and arc gauges glide into place rather than
 * snapping in under a second.
 */
export function useSmoothNumber(target, duration = 2200) {
  const numericTarget = Number.isFinite(Number(target)) ? Number(target) : 0;
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      currentRef.current = numericTarget;
      setCurrent(numericTarget);
      return;
    }

    const startVal = currentRef.current;
    const delta = numericTarget - startVal;
    if (Math.abs(delta) < 0.001) {
      currentRef.current = numericTarget;
      setCurrent(numericTarget);
      return;
    }

    let rafId = null;
    let startTime = null;

    const step = (timestamp) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Silky easeOutQuart curve: smooth deceleration over the full 2.2s
      const eased = 1 - Math.pow(1 - progress, 4);
      const nextVal = startVal + delta * eased;

      currentRef.current = nextVal;
      setCurrent(nextVal);

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        currentRef.current = numericTarget;
        setCurrent(numericTarget);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [numericTarget, duration]);

  return current;
}

export default useSmoothNumber;

