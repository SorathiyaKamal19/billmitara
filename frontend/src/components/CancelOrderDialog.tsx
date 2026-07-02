import { FormEvent, useState } from 'react';
import { Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { Modal } from './Modal';

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
      toast.error(t('ઓર્ડર રદ કરવા માટે કારણ દાખલ કરો', 'Enter a reason for cancelling the order'));
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
      toast.error(error?.response?.data?.message || t('ઓર્ડર રદ કરી શકાયો નહીં', 'Could not cancel order'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={t('ઓર્ડર રદ કરવાની પુષ્ટિ કરો', 'Confirm order cancellation')}
      description={orderLabel}
      icon={<Ban size={22} />}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-soft" onClick={onClose} disabled={saving}>
            {t('પાછા જાઓ', 'Go back')}
          </button>
          <button
            type="submit"
            form="cancel-order-form"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
          >
            <Ban size={17} />
            {saving ? t('રદ થઈ રહ્યું છે...', 'Cancelling...') : t('ઓર્ડર રદ કરો', 'Cancel order')}
          </button>
        </>
      }
    >
      <form id="cancel-order-form" onSubmit={submit}>
        <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
          {t(
            'ગ્રાહક કેમ ગયો અથવા ઓર્ડર કેમ રદ થઈ રહ્યો છે તે દાખલ કરો. ટેબલ નવા ઓર્ડર માટે ઉપલબ્ધ થશે.',
            'Enter why the customer left or the order is being cancelled. The table will become available for a new order.'
          )}
        </p>

        <label className="mt-5 block text-sm font-bold">{t('રદ કરવાનો કારણ', 'Cancellation reason')}</label>
        <textarea
          className="input mt-2 min-h-28"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={t('ઉદાહરણ: ગ્રાહક રાહ જોઈ શક્યો નહીં', 'Example: Customer could not wait')}
          autoFocus
          required
        />
      </form>
    </Modal>
  );
}
