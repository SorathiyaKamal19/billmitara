import { env } from '../config/env.js';

export function performanceHeaders(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.setHeader('X-Server-Time', new Date().toISOString());

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const roundedDuration = durationMs.toFixed(1);

    if (durationMs >= env.slowRequestMs) {
      console.warn(
        `[slow-api] ${req.method} ${req.originalUrl} ${res.statusCode} ${roundedDuration}ms`
      );
    }
  });

  const originalWriteHead = res.writeHead;
  res.writeHead = function writeHeadWithTiming(...args) {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const roundedDuration = durationMs.toFixed(1);
    res.setHeader('X-Response-Time', `${roundedDuration}ms`);
    res.setHeader('Server-Timing', `app;dur=${roundedDuration}`);
    return originalWriteHead.apply(this, args);
  };

  next();
}
