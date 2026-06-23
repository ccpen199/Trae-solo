import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  hideFooter?: boolean;
}

export function Modal({
  open,
  title,
  onClose,
  onConfirm,
  confirmText = '确认',
  cancelText = '取消',
  loading = false,
  children,
  className,
  hideFooter = false,
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-lg rounded-xl bg-white shadow-xl',
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {!hideFooter && (
          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <Button variant="secondary" onClick={onClose}>
              {cancelText}
            </Button>
            {onConfirm && (
              <Button loading={loading} onClick={onConfirm}>
                {confirmText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
