import { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  loadingLabel?: string;
  loading?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  loadingLabel = "Working...",
  loading = false,
  danger = false,
  onConfirm,
  onClose
}: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      icon={<AlertTriangle size={22} />}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-soft" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={
              danger
                ? "inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                : "btn-primary"
            }
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm leading-6 text-gray-600 dark:text-gray-300">{description}</div>
    </Modal>
  );
}
