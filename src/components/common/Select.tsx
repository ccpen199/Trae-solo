import { forwardRef, useState, useRef, useEffect, type SelectHTMLAttributes } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'onChange'> {
  options: SelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  searchable?: boolean;
  error?: string;
  onChange?: (value: string) => void;
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-5 py-3.5 text-lg',
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      options,
      placeholder = '请选择',
      size = 'md',
      searchable = false,
      error,
      value,
      onChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    const filteredOptions = options.filter((opt) =>
      opt.label.toLowerCase().includes(searchValue.toLowerCase())
    );

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
      onChange?.(optionValue);
      setIsOpen(false);
      setSearchValue('');
    };

    return (
      <div ref={containerRef} className="w-full relative">
        <motion.button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between rounded-button border border-neutral-200 bg-white transition-all duration-200 text-left',
            sizeClasses[size],
            isOpen && 'ring-2 ring-westlake-500 border-transparent',
            error && 'border-red-500 focus:ring-red-500',
            disabled && 'opacity-50 cursor-not-allowed bg-neutral-100',
            className
          )}
          whileTap={!disabled ? { scale: 0.99 } : undefined}
          disabled={disabled}
          {...props}
        >
          <span className={cn(selectedOption ? 'text-neutral-800' : 'text-neutral-400')}>
            {selectedOption?.label || placeholder}
          </span>
          <div className="flex items-center gap-2">
            {error && <AlertCircle className="w-4 h-4 text-red-500" />}
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </motion.div>
          </div>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 w-full mt-1 bg-white rounded-card shadow-lg border border-neutral-100 overflow-hidden"
            >
              {searchable && (
                <div className="p-2 border-b border-neutral-100">
                  <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-lg">
                    <Search className="w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder="搜索..."
                      className="flex-1 bg-transparent outline-none text-sm"
                      autoFocus
                    />
                  </div>
                </div>
              )}
              <div className="max-h-60 overflow-y-auto py-1">
                {filteredOptions.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-neutral-400">
                    暂无匹配选项
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => !option.disabled && handleSelect(option.value)}
                      disabled={option.disabled}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors',
                        value === option.value
                          ? 'bg-westlake-50 text-westlake-600'
                          : 'hover:bg-neutral-50 text-neutral-700',
                        option.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                      )}
                      whileHover={!option.disabled ? { x: 4 } : undefined}
                    >
                      <span>{option.label}</span>
                      {value === option.value && (
                        <Check className="w-4 h-4" />
                      )}
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-xs text-red-500"
          >
            {error}
          </motion.p>
        )}

        <select
          ref={ref}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className="hidden"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
