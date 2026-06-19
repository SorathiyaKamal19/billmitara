import http from 'http';
import https from 'https';
import { env } from '../config/env.js';

const MIN_INTERVAL_MINUTES = 1;
const REQUEST_TIMEOUT_MS = 10_000;

function getKeepAliveUrl() {
  return env.keepAlive.url || `${env.publicApiUrl.replace(/\/$/, '')}/api/health`;
}

function pingUrl(urlString) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const client = url.protocol === 'https:' ? https : http;
    const request = client.request(
      url,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'BillMitara-KeepAlive/1.0'
        }
      },
      (response) => {
        response.resume();
        response.on('end', () => resolve(response.statusCode || 0));
      }
    );

    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error(`Keep-alive ping timed out after ${REQUEST_TIMEOUT_MS}ms`));
    });
    request.on('error', reject);
    request.end();
  });
}

export function startKeepAliveCron() {
  if (!env.keepAlive.enabled) return undefined;

  const url = getKeepAliveUrl();
  const intervalMinutes = Math.max(env.keepAlive.intervalMinutes, MIN_INTERVAL_MINUTES);
  const intervalMs = intervalMinutes * 60 * 1000;

  async function runPing() {
    try {
      const statusCode = await pingUrl(url);
      if (statusCode < 200 || statusCode >= 400) {
        console.warn(`Keep-alive ping returned HTTP ${statusCode}`);
      }
    } catch (error) {
      console.warn(`Keep-alive ping failed: ${error.message}`);
    }
  }

  const warmupTimer = setTimeout(runPing, 5000);
  const interval = setInterval(runPing, intervalMs);
  warmupTimer.unref?.();
  interval.unref?.();

  console.log(`Keep-alive cron enabled: pinging ${url} every ${intervalMinutes} minute(s)`);

  return () => {
    clearTimeout(warmupTimer);
    clearInterval(interval);
  };
}
