import { FormEvent, useState } from 'react';
import { Ban, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

interface CancelOrderDialogProps {
  orderId: string;
  orderLabel: string;
  onClose: () => void;
  onCancelled: () => void | Promise<void>;
}

export function CancelOrderDialog({
  orderId,
  orderLabel,
  onClose,
  onCancelled
}: CancelOrderDialogProps) {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const cleanReason = reason.trim();
    if (!cleanReason) {
      toast.error(t('ઓર્ડર રદ કરવાનું કારણ દાખલ કરો', 'Enter a reason for cancelling the order'));
      return;
    }

    try {
      setSaving(true);
      await api.patch(`/orders/${orderId}/status`, {
        status: 'cancelled',
        reason: cleanReason
      });
      toast.success(t('ઓર્ડર રદ થયો', 'Order cancelled'));
      await onCancelled();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          t('ઓર્ડર રદ કરી શકાયો નહીં', 'Could not cancel order')
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <form className="glass w-full max-w-md rounded-3xl p-6 shadow-2xl" onSubmit={submit}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-red-500/10 p-3 text-red-600">
              <Ban size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black">
                {t('ઓર્ડર રદ કરવાની પુષ્ટિ', 'Confirm order cancellation')}
              </h2>
              <p className="mt-1 text-sm text-gray-500">{orderLabel}</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl bg-gray-100 p-2 dark:bg-white/10"
            onClick={onClose}
            aria-label={t('બંધ કરો', 'Close')}
            disabled={saving}
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-5 text-sm text-gray-600 dark:text-gray-300">
          {t(
            'ગ્રાહક ચાલ્યા ગયા હોય અથવા અન્ય કારણ હોય તો કારણ લખો. રદ કર્યા પછી ટેબલ નવા ઓર્ડર માટે ઉપલબ્ધ થશે.',
            'Enter why the customer left or the order is being cancelled. The table will become available for a new order.'
          )}
        </p>

        <label className="mt-5 block text-sm font-bold">
          {t('રદ કરવાનું કારણ', 'Cancellation reason')}
        </label>
        <textarea
          className="input mt-2 min-h-28"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={t(
            'દા.ત. ગ્રાહક રાહ જોઈ શક્યા નહીં',
            'Example: Customer could not wait'
          )}
          autoFocus
          required
        />

        <div className="mt-6 flex gap-3">
          <button type="button" className="btn-soft flex-1" onClick={onClose} disabled={saving}>
            {t('પાછા જાઓ', 'Go back')}
          </button>
          <button type="submit" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-60" disabled={saving}>
            <Ban size={17} />
            {saving ? t('રદ થઈ રહ્યો છે...', 'Cancelling...') : t('ઓર્ડર રદ કરો', 'Cancel order')}
          </button>
        </div>
      </form>
    </div>
  );
}
