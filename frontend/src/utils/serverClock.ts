let serverOffsetMs = 0;

export function updateServerClock(serverTime: string | undefined) {
  if (!serverTime) return;
  const serverMs = new Date(serverTime).getTime();
  if (!Number.isFinite(serverMs)) return;
  serverOffsetMs = serverMs - Date.now();
}

export function synchronizedNow() {
  return Date.now() + serverOffsetMs;
}
