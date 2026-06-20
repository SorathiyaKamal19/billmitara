import { Timer } from 'lucide-react';
import { formatOrderTime } from '../utils/format';
import { useElapsedTime } from '../hooks/useElapsedTime';
import { useLanguage } from '../context/LanguageContext';
import { StatusBadge } from './StatusBadge';

interface OrderTimerProps {
  orderId?: string;
  createdAt: string | Date;
  status?: string;
  expectedMinutes?: string;
  compact?: boolean;
}

export function OrderTimer({
  orderId,
  createdAt,
  status,
  expectedMinutes = '15–20',
  compact = false
}: OrderTimerProps) {
  const { t } = useLanguage();
  const elapsed = useElapsedTime(createdAt);

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
        <span>{t('મૂક્યું', 'Placed')} {formatOrderTime(createdAt)}</span>
        <span className="inline-flex items-center gap-1 font-bold text-saffron">
          <Timer size={13} />
          {elapsed}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-saffron/20 bg-saffron/5 p-4 text-sm">
      {orderId && (
        <p className="text-xs font-bold uppercase tracking-wider text-saffron">
          {t('ઓર્ડર', 'Order')} #{orderId.slice(-6).toUpperCase()}
        </p>
      )}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div>
          <p className="text-xs text-gray-500">{t('મૂક્યું', 'Placed')}</p>
          <p className="font-bold">{formatOrderTime(createdAt)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{t('ગયેલો સમય', 'Elapsed Time')}</p>
          <p className="inline-flex items-center gap-1.5 font-black text-saffron">
            <Timer size={16} />
            {elapsed}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{t('અપેક્ષિત સમય', 'Expected Time')}</p>
          <p className="font-semibold">{expectedMinutes} {t('મિનિટ', 'min')}</p>
        </div>
        {status && (
          <div>
            <p className="text-xs text-gray-500">{t('સ્થિતિ', 'Status')}</p>
            <StatusBadge value={status} />
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-gray-500">
        {t('વ્યસ્ત સમયે ઓર્ડર તૈયાર થવામાં', 'Please allow')} {expectedMinutes} {t('મિનિટનો સમય આપો.', 'minutes for order preparation during busy hours.')}
      </p>
    </div>
  );
}
