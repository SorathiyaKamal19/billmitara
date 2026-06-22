import { useEffect, useMemo, useState } from 'react';
import { synchronizedNow } from '../utils/serverClock';

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

function parseTime(value: string | Date | undefined) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

export function useElapsedTime(since: string | Date | undefined) {
  const start = useMemo(() => parseTime(since), [since]);
  const [elapsed, setElapsed] = useState('00:00');

  useEffect(() => {
    if (!start) {
      setElapsed('00:00');
      return;
    }

    const startTime = start;

    function tick() {
      setElapsed(formatElapsed(synchronizedNow() - startTime));
    }

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [start]);

  return elapsed;
}
