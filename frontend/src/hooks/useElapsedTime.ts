import { useEffect, useState } from 'react';

export function formatElapsed(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function useElapsedTime(since: string | undefined) {
  const [elapsed, setElapsed] = useState('00:00');

  useEffect(() => {
    if (!since) return;
    const start = new Date(since).getTime();
    function tick() {
      setElapsed(formatElapsed(Date.now() - start));
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [since]);

  return elapsed;
}
