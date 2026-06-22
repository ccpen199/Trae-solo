import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  labelPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, defaultChecked = false, onCheckedChange, disabled = false, label, labelPosition = 'right', size = 'md', className, id }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState(checked ?? defaultChecked);

    const isChecked = checked ?? internalChecked;

    const handleToggle = () => {
      if (disabled) return;

      const newValue = !isChecked;
      if (checked === undefined) {
        setInternalChecked(newValue);
      }
      onCheckedChange?.(newValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    };

    const sizes = {
      sm: {
        track: 'w-8 h-4',
        thumb: 'w-3 h-3',
        translate: isChecked ? 'translate-x-4' : 'translate-x-0.5',
      },
      md: {
        track: 'w-11 h-6',
        thumb: 'w-5 h-5',
        translate: isChecked ? 'translate-x-5' : 'translate-x-0.5',
      },
      lg: {
        track: 'w-14 h-8',
        thumb: 'w-7 h-7',
        translate: isChecked ? 'translate-x-6' : 'translate-x-0.5',
      },
    };

    const switchElement = (
      <button
        ref={ref}
        id={id}
        type="button"
        role="switch"
        aria-checked={isChecked}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative inline-flex items-center rounded-full transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2',
          isChecked ? 'bg-gradient-brand shadow-glow' : 'bg-paper-300',
          disabled && 'opacity-50 cursor-not-allowed',
          sizes[size].track,
          className
        )}
      >
        <span
          className={cn(
            'inline-block bg-white rounded-full shadow-md transition-transform duration-200',
            sizes[size].thumb,
            sizes[size].translate
          )}
        >
          <span className={cn(
            'absolute inset-0 rounded-full opacity-0 transition-opacity duration-200',
            isChecked && 'opacity-100',
            'bg-gradient-to-br from-brand-400/20 to-transparent'
          )} />
        </span>
      </button>
    );

    if (!label) return switchElement;

    return (
      <label className={cn(
        'inline-flex items-center gap-3 cursor-pointer',
        disabled && 'cursor-not-allowed'
      )}>
        {labelPosition === 'left' && (
          <span className={cn(
            'text-sm select-none',
            disabled ? 'text-paper-400' : 'text-paper-700'
          )}>
            {label}
          </span>
        )}
        {switchElement}
        {labelPosition === 'right' && (
          <span className={cn(
            'text-sm select-none',
            disabled ? 'text-paper-400' : 'text-paper-700'
          )}>
            {label}
          </span>
        )}
      </label>
    );
  }
);

Switch.displayName = 'Switch';

export { Switch };
