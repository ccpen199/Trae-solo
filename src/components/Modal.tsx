import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ title, open, onClose, children, footer, className, size = 'md' }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        "relative w-full", sizeMap[size],
        "bg-vms-surface border border-vms-border rounded-2xl shadow-2xl shadow-black/50",
        "animate-in fade-in zoom-in-95 duration-200",
        className
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-vms-border">
          <h3 className="text-lg font-semibold text-white font-mono">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-vms-surface-2 text-vms-text-muted hover:text-vms-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-vms-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
