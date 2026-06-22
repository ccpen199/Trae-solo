import { forwardRef, useState, type TextareaHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'> {
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
  autoSize?: boolean;
  error?: string;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      className,
      rows = 4,
      maxLength,
      showCount = false,
      autoSize = false,
      error,
      value,
      onChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const currentLength = typeof value === 'string' ? value.length : 0;

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      if (autoSize) {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
      }
    };

    return (
      <div className="w-full">
        <motion.div
          className={cn(
            'relative rounded-button border border-neutral-200 bg-white transition-all duration-200 overflow-hidden',
            isFocused && 'ring-2 ring-westlake-500 border-transparent',
            error && 'border-red-500 focus:ring-red-500',
            disabled && 'opacity-50 cursor-not-allowed bg-neutral-100',
            className
          )}
          animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
        >
          <textarea
            ref={ref}
            rows={rows}
            maxLength={maxLength}
            value={value}
            onChange={onChange}
            onInput={handleInput}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              'w-full px-4 py-3 bg-transparent outline-none text-neutral-800 placeholder:text-neutral-400 resize-none disabled:cursor-not-allowed',
              autoSize && 'min-h-[80px]'
            )}
            {...props}
          />
          {(showCount || maxLength) && (
            <div className="absolute bottom-2 right-3 flex items-center gap-1 text-xs text-neutral-400">
              {error && <AlertCircle className="w-3 h-3 text-red-500" />}
              <span>
                {currentLength}
                {maxLength && `/${maxLength}`}
              </span>
            </div>
          )}
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

TextArea.displayName = 'TextArea';

export default TextArea;
