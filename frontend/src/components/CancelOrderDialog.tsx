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
      toast.error(t('Enter a reason for cancelling the order', 'Enter a reason for cancelling the order'));
      return;
    }

    try {
      setSaving(true);
      await api.patch(`/orders/${orderId}/status`, {
        status: 'cancelled',
        reason: cleanReason
      });
      toast.success(t('Order cancelled', 'Order cancelled'));
      await onCancelled();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('Could not cancel order', 'Could not cancel order'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={t('Confirm order cancellation', 'Confirm order cancellation')}
      description={orderLabel}
      icon={<Ban size={22} />}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-soft" onClick={onClose} disabled={saving}>
            {t('Go back', 'Go back')}
          </button>
          <button
            type="submit"
            form="cancel-order-form"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
          >
            <Ban size={17} />
            {saving ? t('Cancelling...', 'Cancelling...') : t('Cancel order', 'Cancel order')}
          </button>
        </>
      }
    >
      <form id="cancel-order-form" onSubmit={submit}>
        <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
          {t(
            'Enter why the customer left or the order is being cancelled. The table will become available for a new order.',
            'Enter why the customer left or the order is being cancelled. The table will become available for a new order.'
          )}
        </p>

        <label className="mt-5 block text-sm font-bold">{t('Cancellation reason', 'Cancellation reason')}</label>
        <textarea
          className="input mt-2 min-h-28"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={t('Example: Customer could not wait', 'Example: Customer could not wait')}
          autoFocus
          required
        />
      </form>
    </Modal>
  );
}
