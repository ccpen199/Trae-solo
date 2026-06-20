import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'default' | 'pills';
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  variant = 'default',
}) => {
  const [indicatorStyle, setIndicatorStyle] = React.useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const updateIndicator = React.useCallback(() => {
    const activeIndex = tabs.findIndex((t) => t.id === activeTab);
    const activeEl = tabRefs.current[activeIndex];
    const container = containerRef.current;
    if (activeEl && container) {
      const containerRect = container.getBoundingClientRect();
      const rect = activeEl.getBoundingClientRect();
      setIndicatorStyle({
        left: rect.left - containerRect.left,
        width: rect.width,
      });
    }
  }, [tabs, activeTab]);

  React.useEffect(() => {
    updateIndicator();
    const handler = () => updateIndicator();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [updateIndicator]);

  if (variant === 'pills') {
    return (
      <div className={cn('inline-flex p-1 rounded-2xl bg-ink-800/60 border border-white/[0.06]', className)}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2',
              activeTab === tab.id
                ? 'bg-gold-gradient text-ink-950 shadow-gold-sm'
                : 'text-ink-300 hover:text-ink-100 hover:bg-white/[0.03]',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center gap-1 border-b border-ink-700', className)}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={(el) => { tabRefs.current[index] = el; }}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-5 py-3 text-sm font-medium transition-colors duration-300 flex items-center gap-2 relative z-10 whitespace-nowrap',
            activeTab === tab.id ? 'text-gold-400' : 'text-ink-300 hover:text-ink-100',
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
      <span
        className="absolute bottom-[-1px] h-[2px] bg-gold-gradient rounded-full transition-all duration-300 ease-out"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
          boxShadow: '0 0 12px rgba(201,169,98,0.6)',
        }}
      />
    </div>
  );
};

export { Tabs };
