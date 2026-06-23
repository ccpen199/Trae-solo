import { cn } from '@/lib/utils';
import React, { useState } from 'react';

interface TabItem {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface TabsProps {
  items: TabItem[];
  defaultActiveKey?: string;
  activeKey?: string;
  onChange?: (key: string) => void;
  className?: string;
  tabContentClassName?: string;
  children?: React.ReactNode;
}

interface TabPanelProps {
  tabKey: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ children }: TabPanelProps) {
  return <>{children}</>;
}

export default function Tabs({
  items,
  defaultActiveKey,
  activeKey: controlledActiveKey,
  onChange,
  className,
  children,
}: TabsProps) {
  const [uncontrolledActiveKey, setUncontrolledActiveKey] = useState(
    defaultActiveKey || items[0]?.key || ''
  );

  const isControlled = controlledActiveKey !== undefined;
  const activeKey = isControlled ? controlledActiveKey : uncontrolledActiveKey;

  const handleTabClick = (key: string) => {
    if (!isControlled) {
      setUncontrolledActiveKey(key);
    }
    onChange?.(key);
  };

  const getActiveTabContent = () => {
    if (!children) return null;
    const childrenArray = React.Children.toArray(children);
    return childrenArray.find(
      (child) =>
        React.isValidElement(child) && child.props.tabKey === activeKey
    );
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="relative border-b border-gray-200">
        <div className="flex gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === activeKey;
            return (
              <button
                key={item.key}
                onClick={() => handleTabClick(item.key)}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px',
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-4">{getActiveTabContent()}</div>
    </div>
  );
}
