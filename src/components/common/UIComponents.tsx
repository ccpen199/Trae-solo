import * as React from 'react';
import { cn } from '@/utils/common';
import { X } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-primary-200 border-t-primary-600',
        sizeClasses[size],
        className
      )}
    />
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnClickOutside?: boolean;
}

const modalSizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnClickOutside = true,
}: ModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={closeOnClickOutside ? onClose : undefined}
      />
      <div
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-float animate-slide-up',
          modalSizeClasses[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
            <h3 className="font-display text-lg font-semibold text-neutral-900">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 -mr-2 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-neutral-100">{footer}</div>}
      </div>
    </div>
  );
}

interface TabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex border-b border-neutral-200', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-5 py-3 font-medium text-sm border-b-2 -mb-px transition-all duration-200',
            activeTab === tab.id
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

interface ProgressProps {
  value: number;
  max?: number;
  color?: 'primary' | 'accent' | 'mint' | 'success';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const progressColors: Record<string, string> = {
  primary: 'bg-primary-500',
  accent: 'bg-accent-500',
  mint: 'bg-mint-400',
  success: 'bg-green-500',
};

const progressSizeClasses: Record<string, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3.5',
};

export function Progress({
  value,
  max = 100,
  color = 'primary',
  size = 'md',
  showLabel = false,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="w-full">
      <div className={cn('w-full bg-neutral-100 rounded-full overflow-hidden', progressSizeClasses[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', progressColors[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-neutral-500">
          <span>{value.toFixed(0)}/{max}</span>
          <span>{percentage.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
}

interface StepsProps {
  steps: { id: string; label: string; description?: string }[];
  currentStep: number;
  className?: string;
}

export function Steps({ steps, currentStep, className }: StepsProps) {
  return (
    <div className={cn('flex items-center justify-between w-full', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300',
                  isCompleted
                    ? 'bg-primary-500 text-white'
                    : isCurrent
                    ? 'bg-primary-100 text-primary-700 ring-4 ring-primary-50'
                    : 'bg-neutral-100 text-neutral-500'
                )}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span
                className={cn(
                  'mt-2 text-sm font-medium',
                  isCurrent ? 'text-primary-700' : 'text-neutral-500'
                )}
              >
                {step.label}
              </span>
              {step.description && (
                <span className="mt-0.5 text-xs text-neutral-400">{step.description}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-4 rounded-full transition-all duration-300',
                  isCompleted ? 'bg-primary-500' : 'bg-neutral-200'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
