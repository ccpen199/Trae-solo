import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type InputVariant = 'default' | 'filled' | 'outlined';
type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  size?: InputSize;
  prefix?: ReactNode;
  suffix?: ReactNode;
  clearable?: boolean;
  error?: string;
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
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleClear = () => {
      const event = { target: { value: '' } } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(event);
    };

    return (
      <div className="w-full">
        <motion.div
          className={cn(
            'flex items-center rounded-button transition-all duration-200 overflow-hidden',
            variantClasses[variant],
            sizeClasses[size],
            isFocused && 'ring-2 ring-westlake-500',
            error && 'border-red-500 focus:ring-red-500',
            disabled && 'opacity-50 cursor-not-allowed bg-neutral-100',
            className
          )}
          animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
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
        </motion.div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-xs text-red-500"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
