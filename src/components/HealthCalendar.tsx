import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Syringe,
  Bug,
  Heart,
  MessageCircle,
  Calendar as CalendarIcon,
  Check,
} from 'lucide-react';
import type { HealthCalendarEvent } from '@shared/types';
import { cn } from '@/lib/utils';

interface HealthCalendarProps {
  events: HealthCalendarEvent[];
  compact?: boolean;
  onEventClick?: (event: HealthCalendarEvent) => void;
}

const typeConfig: Record<HealthCalendarEvent['type'], { icon: typeof Syringe; color: string; label: string }> = {
  vaccine: { icon: Syringe, color: 'bg-forest-100 text-forest-600', label: '疫苗' },
  deworming: { icon: Bug, color: 'bg-warm-100 text-warm-500', label: '驱虫' },
  checkup: { icon: Heart, color: 'bg-pink-100 text-pink-600', label: '体检' },
  consultation: { icon: MessageCircle, color: 'bg-blue-100 text-blue-600', label: '问诊' },
  custom: { icon: CalendarIcon, color: 'bg-gray-100 text-gray-600', label: '其他' },
};

export default function HealthCalendar({ events, compact, onEventClick }: HealthCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => e.date.startsWith(dateStr));
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  if (compact) {
    const upcomingEvents = events
      .filter((e) => new Date(e.date) >= new Date(today.toDateString()))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);

    return (
      <div className="space-y-3">
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">暂无日程安排</p>
        ) : (
          upcomingEvents.map((event) => {
            const config = typeConfig[event.type];
            const Icon = config.icon;
            return (
              <button
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-cream-50 hover:bg-cream-100 transition-colors text-left"
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{event.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.date).toLocaleDateString('zh-CN', {
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                {event.completed && (
                  <span className="tag tag-green">
                    <Check className="w-3 h-3" /> 已完成
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    );
  }

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-bold text-lg text-gray-900">
          {year}年{month + 1}月
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl hover:bg-forest-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl hover:bg-forest-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const dayEvents = getEventsForDay(day);
          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
          return (
            <div
              key={idx}
              className={cn(
                'min-h-[60px] p-1.5 rounded-xl transition-colors',
                isToday ? 'bg-forest-50 ring-2 ring-forest-300' : 'hover:bg-cream-50'
              )}
            >
              <span
                className={cn(
                  'text-sm font-medium',
                  isToday ? 'text-forest-600' : 'text-gray-700'
                )}
              >
                {day}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-1 flex-wrap">
                  {dayEvents.slice(0, 3).map((event) => {
                    const config = typeConfig[event.type];
                    return (
                      <div
                        key={event.id}
                        onClick={() => onEventClick?.(event)}
                        className={cn('w-2 h-2 rounded-full', config.color.split(' ')[0])}
                        title={event.title}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
