import { useEffect, useRef } from 'react';

import { useGameStore } from '@/stores/gameStore';

export function useGameLoop() {
  const tick = useGameStore((s) => s.tick);
  const tickRef = useRef(tick);
  tickRef.current = tick;

  useEffect(() => {
    let lastTime = performance.now();
    let animationFrameId: number;

    const loop = (time: number) => {
      const delta = (time - lastTime) / 1000; // in seconds
      lastTime = time;

      // cap delta to prevent huge jumps if tab was inactive
      if (delta < 1) {
        tickRef.current(delta);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);
}
