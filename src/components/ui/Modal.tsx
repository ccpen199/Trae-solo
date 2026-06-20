import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
}

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md', closeOnOverlayClick = true }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-primary-900/60 backdrop-blur-sm animate-fade-in"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      <div
        className={cn(
          'relative bg-white rounded-2xl shadow-2xl w-full animate-slide-up overflow-hidden',
          sizeStyles[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-primary-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-primary-900 hover:bg-neutral-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-neutral-500 hover:text-primary-900 hover:bg-neutral-100 transition-colors"
          >
            <X size={20} />
          </button>
        )}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export { Modal };
export type { ModalProps, ModalSize };
