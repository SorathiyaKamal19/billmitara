import { money, moneyPrecise } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';

interface BillTotalsProps {
  subtotal: number;
  discount?: number;
  discountReason?: string;
  takeawayCharge?: number;
  gstEnabled?: boolean;
  gstRate?: number;
  gst?: number;
  roundOff?: number;
  total: number;
  totalLabel?: string;
  className?: string;
}

export function BillTotals({
  subtotal,
  discount = 0,
  discountReason,
  takeawayCharge = 0,
  gstEnabled = false,
  gstRate = 0,
  gst = 0,
  roundOff = 0,
  total,
  totalLabel,
  className = ''
}: BillTotalsProps) {
  const { t } = useLanguage();
  const finalLabel = totalLabel || t('કુલ', 'Total');

  return (
    <div className={`space-y-2 text-sm ${className}`}>
      <div className="flex justify-between">
        <span>{t('સબટોટલ', 'Subtotal')}</span>
        <b>{money(subtotal)}</b>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-emerald-700 dark:text-emerald-300">
          <span>
            {t('ડિસ્કાઉન્ટ', 'Discount')}{discountReason ? ` (${discountReason})` : ''}
          </span>
          <b>-{money(discount)}</b>
        </div>
      )}
      {takeawayCharge > 0 && (
        <div className="flex justify-between">
          <span>{t('પાર્સલ ચાર્જ', 'Parcel charge')}</span>
          <b>{money(takeawayCharge)}</b>
        </div>
      )}
      {gstEnabled && (
        <div className="flex justify-between">
          <span>GST {gstRate}%</span>
          <b>{moneyPrecise(gst)}</b>
        </div>
      )}
      {roundOff !== 0 && (
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>{t('રાઉન્ડ ઓફ', 'Round Off')}</span>
          <b>{roundOff > 0 ? '+' : ''}{moneyPrecise(roundOff)}</b>
        </div>
      )}
      <div className="flex justify-between border-t border-gray-200 pt-3 text-xl dark:border-white/10">
        <span className="font-black">{finalLabel}</span>
        <b>{money(total)}</b>
      </div>
    </div>
  );
}
