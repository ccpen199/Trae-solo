import { ReactNode, useState } from 'react';
import { cn } from '../../lib/utils';

interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  defaultActiveKey?: string;
  activeKey?: string;
  onChange?: (key: string) => void;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export function Tabs({
  tabs,
  defaultActiveKey,
  activeKey: controlledActiveKey,
  onChange,
  className,
  variant = 'default',
}: TabsProps) {
  const [internalActiveKey, setInternalActiveKey] = useState(defaultActiveKey || tabs[0]?.key);
  const activeKey = controlledActiveKey ?? internalActiveKey;

  const handleTabClick = (key: string) => {
    if (controlledActiveKey === undefined) {
      setInternalActiveKey(key);
    }
    onChange?.(key);
  };

  const variants = {
    default: 'bg-dark-800/50 p-1 rounded-lg',
    pills: 'gap-1',
    underline: 'border-b border-dark-700/50',
  };

  const tabVariants = {
    default: (isActive: boolean) =>
      cn(
        'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
        isActive
          ? 'bg-dark-700 text-white shadow-sm'
          : 'text-dark-400 hover:text-dark-200'
      ),
    pills: (isActive: boolean) =>
      cn(
        'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
        isActive
          ? 'bg-brand-500/15 text-brand-400'
          : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'
      ),
    underline: (isActive: boolean) =>
      cn(
        'px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 -mb-px',
        isActive
          ? 'border-brand-500 text-brand-400'
          : 'border-transparent text-dark-400 hover:text-dark-200'
      ),
  };

  return (
    <div className={cn(variants[variant], className)}>
      <div className={cn(
        'flex',
        variant === 'underline' ? 'gap-0' : 'gap-1'
      )}>
        {tabs.map((tab) => {
          const isActive = activeKey === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={cn(
                tabVariants[variant](isActive),
                'flex items-center gap-2 whitespace-nowrap'
              )}
            >
              {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  'px-1.5 py-0.5 text-xs font-medium rounded-full',
                  isActive
                    ? 'bg-brand-500/20 text-brand-400'
                    : 'bg-dark-700 text-dark-400'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
