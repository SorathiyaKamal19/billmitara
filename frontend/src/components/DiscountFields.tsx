import { useLanguage } from '../context/LanguageContext';

interface DiscountFieldsProps {
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  discountReason?: string;
  onTypeChange: (type: 'fixed' | 'percentage') => void;
  onValueChange: (value: number) => void;
  onReasonChange?: (reason: string) => void;
  compact?: boolean;
}

export function DiscountFields({
  discountType,
  discountValue,
  discountReason = '',
  onTypeChange,
  onValueChange,
  onReasonChange,
  compact = false
}: DiscountFieldsProps) {
  const { t } = useLanguage();

  return (
    <div className={`grid gap-3 ${compact ? '' : 'rounded-xl border border-saffron/20 bg-saffron/10 p-4'}`}>
      {!compact && (
        <div>
          <p className="font-black">{t('ડિસ્કાઉન્ટ', 'Discount')}</p>
          <p className="text-sm text-gray-500">{t('ઓર્ડર અથવા બિલ પુષ્ટિ પહેલાં ડિસ્કાઉન્ટ લાગુ કરો.', 'Apply discount before confirming the order or bill.')}</p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[120px] flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-saffron">
            {discountType === 'fixed' ? '₹' : '%'}
          </span>
          <input
            className="input pl-9"
            type="number"
            min={0}
            placeholder={discountType === 'fixed' ? t('રકમ', 'Amount') : t('ટકા', 'Percentage')}
            value={discountValue || ''}
            onChange={(e) => onValueChange(Number(e.target.value))}
          />
        </div>
        <select
          className="input w-[150px]"
          value={discountType}
          onChange={(e) => onTypeChange(e.target.value as 'fixed' | 'percentage')}
        >
          <option value="fixed">{t('રકમ (₹)', 'Amount (₹)')}</option>
          <option value="percentage">{t('ટકા (%)', 'Percentage (%)')}</option>
        </select>
      </div>
      {onReasonChange && discountValue > 0 && (
        <input
          className="input"
          placeholder={t('ડિસ્કાઉન્ટનું કારણ (વૈકલ્પિક)', 'Reason for discount (optional)')}
          value={discountReason}
          onChange={(e) => onReasonChange(e.target.value)}
        />
      )}
    </div>
  );
}
