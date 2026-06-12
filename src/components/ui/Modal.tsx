import {
  ReactNode,
  useEffect,
  useCallback,
  MouseEvent,
  KeyboardEvent,
} from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  contentClassName?: string;
  showClose?: boolean;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  closeOnOverlay = true,
  closeOnEsc = true,
  size = 'md',
  className,
  contentClassName,
  showClose = true,
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: globalThis.KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEsc, onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDownDiv = (e: KeyboardEvent<HTMLDivElement>) => {
    if (closeOnEsc && e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center p-4',
        className
      )}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDownDiv}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm animate-fade-in" />

      <div
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-card border border-ink-100',
          'animate-scale-in flex flex-col overflow-hidden',
          sizeClasses[size],
          contentClassName
        )}
      >
        {(title || showClose) && (
          <div className="flex items-start justify-between px-6 pt-5 pb-2">
            <div className="flex flex-col gap-1 pr-4">
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-ink-900 tracking-tight"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm text-ink-500">{description}</p>
              )}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 -mr-1 -mt-1 w-8 h-8 rounded-xl flex items-center justify-center text-ink-400 hover:text-ink-700 hover:bg-cream-100 transition-colors"
                aria-label="关闭"
              >
                <X size={18} strokeWidth={2.25} />
              </button>
            )}
          </div>
        )}

        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-ink-100 bg-cream-100/40 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
