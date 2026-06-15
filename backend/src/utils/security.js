export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function boundedQueryString(value, maxLength = 80) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

export function boundedInt(value, { min = 1, max = 100, fallback = max } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}
