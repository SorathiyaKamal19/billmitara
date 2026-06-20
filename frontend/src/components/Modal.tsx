import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";

interface ModalProps {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg";
  closeLabel?: string;
}

const sizeClass = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg"
};

export function Modal({
  title,
  description,
  icon,
  children,
  footer,
  onClose,
  size = "md",
  closeLabel = "Close"
}: ModalProps) {
  const modal = (
    <div className="fixed inset-0 left-0 top-0 z-[100] flex h-dvh w-screen items-start justify-center overflow-y-auto bg-gray-950/70 px-3 py-4 backdrop-blur-xl sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={clsx("my-auto flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-lg border border-white/70 bg-white shadow-2xl ring-1 ring-gray-950/5 dark:border-white/10 dark:bg-gray-950 dark:ring-white/10 sm:max-h-[calc(100dvh-3rem)]", sizeClass[size])}>
        <div className="border-b border-gray-200 bg-gray-50/80 px-5 py-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              {icon && (
                <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-saffron/10 text-saffron">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <h2 id="modal-title" className="text-xl font-black leading-tight text-gray-950 dark:text-white">
                  {title}
                </h2>
                {description && <div className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">{description}</div>}
              </div>
            </div>
            <button type="button" className="btn-soft shrink-0 px-2.5" onClick={onClose} aria-label={closeLabel}>
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto px-5 py-5">{children}</div>

        {footer && (
          <div className="shrink-0 flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50/80 px-5 py-4 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
