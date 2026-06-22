import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { classNames } from '@/utils/formatters';

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'success' | 'warn' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
  confirmDisabled?: boolean;
}

const variantStyles = {
  default: {
    iconBg: 'bg-brand-100 text-brand-700',
    confirmBtn: 'btn-primary',
    Icon: Info,
  },
  danger: {
    iconBg: 'bg-rose-100 text-rose-700',
    confirmBtn: 'btn-danger',
    Icon: XCircle,
  },
  success: {
    iconBg: 'bg-emerald-100 text-emerald-700',
    confirmBtn: 'btn-primary',
    Icon: CheckCircle2,
  },
  warn: {
    iconBg: 'bg-amber-100 text-amber-700',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white btn',
    Icon: AlertTriangle,
  },
  info: {
    iconBg: 'bg-sky-100 text-sky-700',
    confirmBtn: 'btn-primary',
    Icon: Info,
  },
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = '确定',
  cancelText = '取消',
  variant = 'default',
  onConfirm,
  onCancel,
  children,
  confirmDisabled,
}: ConfirmModalProps) {
  const style = variantStyles[variant];
  const Icon = style.Icon;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter' && !confirmDisabled) onConfirm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel, onConfirm, confirmDisabled]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in-up"
        style={{ animationDuration: '0.2s' }}
        onClick={onCancel}
      />
      <div
        className="relative card w-full max-w-md p-6 animate-fade-in-up"
        style={{ animationDuration: '0.3s' }}
      >
        <button
          className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 flex items-center justify-center"
          onClick={onCancel}
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-4 mb-5">
          <div
            className={classNames(
              'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
              style.iconBg
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-lg font-semibold text-slate-900 mb-1">{title}</h3>
            {description && (
              <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
            )}
          </div>
        </div>
        {children && <div className="mb-5">{children}</div>}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button className="btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={style.confirmBtn}
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
