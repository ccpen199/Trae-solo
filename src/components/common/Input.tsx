import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type InputVariant = 'default' | 'filled' | 'outlined';
type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  variant?: InputVariant;
  size?: InputSize;
  prefix?: ReactNode;
  suffix?: ReactNode;
  clearable?: boolean;
  error?: string;
  showCount?: boolean;
}

const variantClasses: Record<InputVariant, string> = {
  default: 'bg-white border border-neutral-200 focus:border-transparent',
  filled: 'bg-neutral-100 border border-transparent focus:bg-white focus:border-westlake-500',
  outlined: 'bg-transparent border-2 border-neutral-300 focus:border-westlake-500',
};

const sizeClasses: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-5 py-3.5 text-lg',
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      prefix,
      suffix,
      clearable = false,
      error,
      value,
      onChange,
      disabled,
      showCount,
      maxLength,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleClear = () => {
      const event = { target: { value: '' } } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(event);
    };

    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full">
        <div
          className={cn(
            'flex items-center rounded-button transition-all duration-200 overflow-hidden',
            variantClasses[variant],
            sizeClasses[size],
            isFocused && 'ring-2 ring-westlake-500',
            error && 'border-red-500 focus:ring-red-500',
            disabled && 'opacity-50 cursor-not-allowed bg-neutral-100',
            className
          )}
        >
          {prefix && <span className="mr-2 text-neutral-400">{prefix}</span>}
          <input
            ref={ref}
            className="flex-1 bg-transparent outline-none text-neutral-800 placeholder:text-neutral-400 disabled:cursor-not-allowed"
            value={value}
            onChange={onChange}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={maxLength}
            {...props}
          />
          <AnimatePresence>
            {clearable && value && !disabled && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={handleClear}
                className="ml-2 p-1 rounded-full hover:bg-neutral-100 transition-colors"
              >
                <X className="w-4 h-4 text-neutral-400" />
              </motion.button>
            )}
          </AnimatePresence>
          {error && <AlertCircle className="w-4 h-4 text-red-500 ml-2" />}
          {suffix && !error && <span className="ml-2 text-neutral-400">{suffix}</span>}
        </div>
        <div className="flex justify-between items-start mt-1">
          {error && <p className="text-xs text-red-500">{error}</p>}
          {showCount && maxLength && (
            <p className={cn('text-xs ml-auto', error ? 'text-red-400' : 'text-neutral-400')}>
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
