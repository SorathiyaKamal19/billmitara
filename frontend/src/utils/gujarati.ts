import { currentLanguage } from '../context/LanguageContext';

export function statusLabel(value: string) {
  const labels: Record<string, { gu: string; en: string }> = {
    available: { gu: 'ઉપલબ્ધ', en: 'Available' },
    running: { gu: 'ચાલુ', en: 'Running' },
    reserved: { gu: 'બુક થયેલ', en: 'Reserved' },
    cleaning: { gu: 'સફાઈમાં', en: 'Cleaning' },
    'in-kitchen': { gu: 'રસોડામાં', en: 'In kitchen' },
    ready: { gu: 'તૈયાર', en: 'Ready' },
    billed: { gu: 'બિલ થયેલ', en: 'Billed' },
    cancelled: { gu: 'રદ', en: 'Cancelled' },
    'dine-in': { gu: 'ટેબલ પર', en: 'Dine-in' },
    takeaway: { gu: 'પાર્સલ', en: 'Parcel' }
  };

  return labels[value]?.[currentLanguage()] || value;
}

export function foodTypeLabel(value: string) {
  const labels: Record<string, { gu: string; en: string }> = {
    veg: { gu: 'વેજ', en: 'Veg' },
    'non-veg': { gu: 'નોન-વેજ', en: 'Non-Veg' },
    egg: { gu: 'ઇંડા', en: 'Egg' }
  };

  return labels[value]?.[currentLanguage()] || value;
}

export function paymentLabel(value?: string) {
  const labels: Record<string, { gu: string; en: string }> = {
    cash: { gu: 'રોકડ', en: 'Cash' },
    upi: { gu: 'UPI', en: 'UPI' },
    partial: { gu: 'વિભાગિત', en: 'Partial' }
  };

  return value ? labels[value]?.[currentLanguage()] || value : '-';
}
