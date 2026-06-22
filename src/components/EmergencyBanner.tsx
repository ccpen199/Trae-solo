import { useEffect, useState } from 'react';
import { AlertTriangle, X, ChevronRight } from 'lucide-react';
import { useAppStore, type AlertItem } from '@/store';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { normalizeAlertItem, unwrapApiData } from '@/lib/api';

const levelConfig = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', bar: 'bg-blue-500' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200', bar: 'bg-yellow-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', bar: 'bg-orange-500' },
  red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', bar: 'bg-red-500' },
};

const levelLabel: Record<AlertItem['level'], string> = {
  blue: '蓝色预警',
  yellow: '黄色预警',
  orange: '橙色预警',
  red: '红色预警',
};

export default function EmergencyBanner() {
  const { activeAlerts, removeAlert, setAlerts } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/alerts/active');
        if (res.ok) {
          const payload = await res.json() as any;
          const alerts = unwrapApiData<any[]>(payload);
          if (Array.isArray(alerts) && alerts.length > 0) {
            setAlerts(alerts.map(normalizeAlertItem));
            return;
          }
        }
      } catch {
        setAlerts([
          {
            id: 'demo-1',
            level: 'red',
            title: '暴雨红色预警',
            content: '盐城市气象台发布暴雨红色预警信号，预计未来3小时内部分地区将出现100毫米以上降水，请广大市民注意防范。',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'demo-2',
            level: 'orange',
            title: '高温橙色预警',
            content: '今日最高气温可达37-39度，请广大市民做好防暑降温措施，减少户外活动。',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
        ]);
      }

      setAlerts([
        {
          id: 'demo-1',
          level: 'red',
          title: '暴雨红色预警',
          content: '盐城市气象台发布暴雨红色预警信号，预计未来3小时内部分地区将出现100毫米以上降水，请广大市民注意防范。',
          timestamp: new Date().toISOString(),
        },
      ]);
    };
    fetchAlerts();
  }, [setAlerts]);

  useEffect(() => {
    if (activeAlerts.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % activeAlerts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeAlerts.length]);

  const visibleAlerts = activeAlerts.filter((a) => !dismissed.includes(a.id));
  if (visibleAlerts.length === 0) return null;

  const current = visibleAlerts[currentIndex % visibleAlerts.length];
  const config = levelConfig[current.level];

  return (
    <div
      className={cn(
        'relative overflow-hidden border-b animate-fade-in-up',
        config.bg,
        config.border,
      )}
    >
      <div className={cn('absolute left-0 top-0 bottom-0 w-1', config.bar)} />
      <div className="container mx-auto px-4 py-2.5 pl-5 flex items-center gap-3">
        <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', config.bar)}>
          <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn('text-xs font-bold px-2 py-0.5 rounded', config.bar, 'text-white')}>
              {levelLabel[current.level]}
            </span>
            <span className={cn('font-semibold text-sm md:text-base truncate', config.text)}>
              {current.title}
            </span>
          </div>
          <p className={cn('text-xs md:text-sm truncate animate-marquee whitespace-nowrap md:whitespace-normal md:animate-none', config.text)}>
            {current.content}
          </p>
        </div>
        <Link
          to="/emergency"
          className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/60 hover:bg-white transition-colors"
        >
          查看详情
          <ChevronRight className="w-4 h-4" />
        </Link>
        <button
          onClick={() => setDismissed((d) => [...d, current.id])}
          className="p-1.5 rounded-lg hover:bg-white/60 transition-colors"
          aria-label="关闭预警"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
