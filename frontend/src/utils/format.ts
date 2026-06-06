import { currentLanguage } from '../context/LanguageContext';

export function money(value: number | undefined) {
  return new Intl.NumberFormat(currentLanguage() === 'en' ? 'en-IN' : 'gu-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}

export function shortDate(value: string) {
  return new Intl.DateTimeFormat(currentLanguage() === 'en' ? 'en-IN' : 'gu-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
