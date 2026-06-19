import { currentLanguage } from '../context/LanguageContext';

const TIMEZONE = 'Asia/Kolkata';

function locale() {
  return currentLanguage() === 'en' ? 'en-IN' : 'gu-IN';
}

export function money(value: number | undefined) {
  return new Intl.NumberFormat(locale(), { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}

export function moneyPrecise(value: number | undefined) {
  return new Intl.NumberFormat(locale(), { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
}

export function shortDate(value: string) {
  return new Intl.DateTimeFormat(locale(), { dateStyle: 'medium', timeStyle: 'short', timeZone: TIMEZONE }).format(new Date(value));
}

export function formatOrderTime(value: string) {
  return new Intl.DateTimeFormat(locale(), {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: TIMEZONE
  }).format(new Date(value));
}

export function formatBillDateTime(value: string | Date) {
  return new Intl.DateTimeFormat(locale(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: TIMEZONE
  }).format(new Date(value));
}

export function calcClientTotals({
  subtotal,
  charge = 0,
  discount = 0,
  gstEnabled = true,
  gstRate = 5
}: {
  subtotal: number;
  charge?: number;
  discount?: number;
  gstEnabled?: boolean;
  gstRate?: number;
}) {
  const taxable = Math.max(subtotal + charge - discount, 0);
  const gst = gstEnabled ? Number((taxable * (gstRate / 100)).toFixed(2)) : 0;
  const exactTotal = Number((taxable + gst).toFixed(2));
  const roundedTotal = Math.round(exactTotal);
  const roundOff = Number((roundedTotal - exactTotal).toFixed(2));
  return { taxable, gst, exactTotal, roundOff, total: roundedTotal };
}
