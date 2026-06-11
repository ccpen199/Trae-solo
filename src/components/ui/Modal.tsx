import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  drawer?: boolean;
  drawerPosition?: 'left' | 'right';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  width = 'max-w-2xl',
  drawer = false,
  drawerPosition = 'right',
  className,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
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

  if (!open) return null;

  if (drawer) {
    return (
      <div className="fixed inset-0 z-50">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />
        <div
          className={cn(
            'absolute top-0 bottom-0 bg-space-blue-800 border border-space-blue-600 shadow-2xl flex flex-col',
            drawerPosition === 'right'
              ? 'right-0 animate-slide-in'
              : 'left-0 animate-slide-in',
            width,
            className
          )}
        >
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-space-blue-600">
              <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-100 hover:bg-space-blue-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4">
            {children}
          </div>
          {footer && (
            <div className="px-6 py-4 border-t border-space-blue-600 bg-space-blue-900/50">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative bg-space-blue-800 border border-space-blue-600 rounded-xl shadow-2xl w-full animate-slide-up',
          width,
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-space-blue-600">
            <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-100 hover:bg-space-blue-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-space-blue-600 bg-space-blue-900/30 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
