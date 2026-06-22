import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  className?: string;
  id?: string;
}

const sizes = {
  sm: {
    trigger: 'h-8 px-3 text-sm',
    dropdown: 'py-1',
    item: 'px-3 py-1.5 text-sm',
  },
  md: {
    trigger: 'h-10 px-4 text-sm',
    dropdown: 'py-1.5',
    item: 'px-4 py-2 text-sm',
  },
  lg: {
    trigger: 'h-12 px-5 text-base',
    dropdown: 'py-2',
    item: 'px-5 py-2.5 text-base',
  },
};

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ options, value, defaultValue = '', onChange, placeholder = '请选择', disabled = false, size = 'md', error = false, className, id }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(value ?? defaultValue);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);

    const currentValue = value ?? internalValue;

    const selectedOption = options.find(opt => opt.value === currentValue);

    const handleToggle = () => {
      if (disabled) return;
      setIsOpen(!isOpen);
    };

    const handleSelect = (optValue: string) => {
      if (value === undefined) {
        setInternalValue(optValue);
      }
      onChange?.(optValue);
      setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    React.useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target as Node) &&
          triggerRef.current &&
          !triggerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    return (
      <div className={cn('relative w-full', className)}>
        <button
          ref={triggerRef}
          id={id}
          type="button"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={cn(
            'w-full flex items-center justify-between rounded-md border bg-white',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-darkroom-500' : 'border-paper-300',
            isOpen && !error && 'border-brand-400 ring-2 ring-brand-100',
            sizes[size].trigger
          )}
        >
          <span className={cn(
            'truncate',
            selectedOption ? 'text-paper-900' : 'text-paper-400'
          )}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={cn(
            'h-4 w-4 text-paper-500 flex-shrink-0 ml-2 transition-transform duration-200',
            isOpen && 'rotate-180'
          )} />
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            role="listbox"
            className={cn(
              'absolute z-50 w-full mt-1 bg-white rounded-md shadow-large border border-paper-200',
              'overflow-hidden animate-fade-in',
              sizes[size].dropdown
            )}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === currentValue}
                disabled={option.disabled}
                onClick={() => !option.disabled && handleSelect(option.value)}
                className={cn(
                  'w-full flex items-center justify-between text-left',
                  'transition-colors duration-150',
                  'focus:outline-none focus:bg-paper-100',
                  option.value === currentValue
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-paper-700 hover:bg-paper-100',
                  option.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',
                  sizes[size].item
                )}
              >
                <span className="truncate">{option.label}</span>
                {option.value === currentValue && (
                  <Check className="h-4 w-4 flex-shrink-0 ml-2 text-brand-500" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
