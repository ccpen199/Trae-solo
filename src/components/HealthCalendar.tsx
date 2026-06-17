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
  MapPin,
  Clock,
  ArrowRight,
  Stethoscope,
  Navigation,
  Bell,
  ShoppingCart,
} from 'lucide-react';
import type { HealthCalendarEvent } from '@shared/types';
import { cn } from '@/lib/utils';

interface HealthCalendarProps {
  events: HealthCalendarEvent[];
  compact?: boolean;
  onEventClick?: (event: HealthCalendarEvent) => void;
}

const typeConfig: Record<HealthCalendarEvent['type'], { icon: typeof Syringe; color: string; label: string; action: string; actionIcon: typeof Syringe }> = {
  vaccine: { icon: Syringe, color: 'bg-forest-100 text-forest-600', label: '疫苗', action: '预约接种', actionIcon: Syringe },
  deworming: { icon: Bug, color: 'bg-warm-100 text-warm-500', label: '驱虫', action: '购买驱虫药', actionIcon: ShoppingCart },
  checkup: { icon: Heart, color: 'bg-pink-100 text-pink-600', label: '体检', action: '预约体检', actionIcon: Heart },
  consultation: { icon: MessageCircle, color: 'bg-blue-100 text-blue-600', label: '问诊', action: '在线问诊', actionIcon: Stethoscope },
  custom: { icon: CalendarIcon, color: 'bg-gray-100 text-gray-600', label: '其他', action: '查看详情', actionIcon: CalendarIcon },
};

export default function HealthCalendar({ events, compact, onEventClick }: HealthCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<HealthCalendarEvent | null>(null);

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
      .filter((e) => !e.completed)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 4);

    return (
      <div className="space-y-3">
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">暂无日程安排</p>
        ) : (
          upcomingEvents.map((event) => {
            const config = typeConfig[event.type];
            const Icon = config.icon;
            const ActionIcon = config.actionIcon;
            const eventDate = new Date(event.date);
            const isPast = eventDate < new Date(new Date().toDateString());
            const isToday = eventDate.toDateString() === new Date().toDateString();
            const isUpcoming = !isPast && !isToday;
            return (
              <div key={event.id} className="rounded-xl bg-cream-50 hover:bg-cream-100 transition-colors overflow-hidden">
                <button
                  onClick={() => onEventClick?.(event)}
                  className="w-full flex items-center gap-3 p-3 text-left"
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
                  {isToday && (
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-forest-100 text-forest-700">今日</span>
                  )}
                  {isUpcoming && (
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">待预约</span>
                  )}
                  {isPast && !event.completed && (
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-warm-100 text-warm-600">逾期</span>
                  )}
                  {event.completed && (
                    <span className="tag tag-green">
                      <Check className="w-3 h-3" /> 已完成
                    </span>
                  )}
                </button>
                {!event.completed && (
                  <div className="flex border-t border-cream-200/50">
                    <button
                      onClick={() => onEventClick?.(event)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold text-forest-600 hover:bg-forest-50/50 transition-colors"
                    >
                      <ActionIcon className="w-3 h-3" />
                      {config.action}
                    </button>
                    {(event.type === 'vaccine' || event.type === 'checkup') && (
                      <button
                        className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold text-blue-600 hover:bg-blue-50/50 transition-colors border-l border-cream-200/50"
                        onClick={() => onEventClick?.(event)}
                      >
                        <Navigation className="w-3 h-3" />
                        线下就医导航
                      </button>
                    )}
                    {event.type === 'deworming' && (
                      <button
                        className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold text-warm-600 hover:bg-warm-50/50 transition-colors border-l border-cream-200/50"
                        onClick={() => onEventClick?.(event)}
                      >
                        <ShoppingCart className="w-3 h-3" />
                        商城购药
                      </button>
                    )}
                  </div>
                )}
              </div>
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
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-forest-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-forest-50 transition-colors">
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
              <span className={cn('text-sm font-medium', isToday ? 'text-forest-600' : 'text-gray-700')}>
                {day}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-1 flex-wrap">
                  {dayEvents.slice(0, 3).map((event) => {
                    const config = typeConfig[event.type];
                    return (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={cn(
                          'w-2 h-2 rounded-full cursor-pointer hover:scale-150 transition-transform',
                          config.color.split(' ')[0],
                          event.completed && 'opacity-40'
                        )}
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

      {selectedEvent && (
        <div className="mt-4 p-4 rounded-2xl bg-cream-50 border border-cream-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(() => {
                const config = typeConfig[selectedEvent.type];
                const Icon = config.icon;
                return (
                  <>
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{selectedEvent.title}</p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(selectedEvent.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                        {selectedEvent.reminderDays > 0 && ` · 提前${selectedEvent.reminderDays}天提醒`}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
            <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
          </div>

          {selectedEvent.completed ? (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-forest-50 border border-forest-200">
              <Check className="w-4 h-4 text-forest-600" />
              <span className="text-xs text-forest-700 font-semibold">已完成</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {(() => {
                  const config = typeConfig[selectedEvent.type];
                  const ActionIcon = config.actionIcon;
                  return (
                    <button className="p-2.5 rounded-xl bg-forest-50 border border-forest-200 text-center hover:bg-forest-100 transition-colors">
                      <ActionIcon className="w-4 h-4 text-forest-600 mx-auto mb-1" />
                      <p className="text-[10px] font-semibold text-forest-700">{config.action}</p>
                    </button>
                  );
                })()}
                <button className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-center hover:bg-blue-100 transition-colors">
                  <Bell className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <p className="text-[10px] font-semibold text-blue-700">设置提醒</p>
                </button>
                {(selectedEvent.type === 'vaccine' || selectedEvent.type === 'checkup') && (
                  <button className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-center hover:bg-purple-100 transition-colors">
                    <Navigation className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                    <p className="text-[10px] font-semibold text-purple-700">线下导航</p>
                  </button>
                )}
                {selectedEvent.type === 'deworming' && (
                  <button className="p-2.5 rounded-xl bg-warm-50 border border-warm-200 text-center hover:bg-warm-100 transition-colors">
                    <ShoppingCart className="w-4 h-4 text-warm-600 mx-auto mb-1" />
                    <p className="text-[10px] font-semibold text-warm-700">商城购药</p>
                  </button>
                )}
                {selectedEvent.type === 'consultation' && (
                  <button className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-center hover:bg-sky-100 transition-colors">
                    <Clock className="w-4 h-4 text-sky-600 mx-auto mb-1" />
                    <p className="text-[10px] font-semibold text-sky-700">复诊提醒</p>
                  </button>
                )}
              </div>

              {selectedEvent.type === 'vaccine' && (
                <div className="p-2.5 rounded-xl bg-forest-50/50 border border-forest-100 text-[11px] text-forest-700 leading-relaxed">
                  <span className="font-semibold">疫苗提醒闭环：</span>接种提醒 → 选择医院 → 预约时间 → 线下接种 → 接种记录入档 → 下次加强针提醒
                </div>
              )}
              {selectedEvent.type === 'deworming' && (
                <div className="p-2.5 rounded-xl bg-warm-50/50 border border-warm-100 text-[11px] text-warm-700 leading-relaxed">
                  <span className="font-semibold">驱虫提醒闭环：</span>驱虫提醒 → 商城购药/医院开方 → 处方药双签验证 → 用药记录入档 → 下次驱虫周期提醒
                </div>
              )}
              {selectedEvent.type === 'checkup' && (
                <div className="p-2.5 rounded-xl bg-pink-50/50 border border-pink-100 text-[11px] text-pink-700 leading-relaxed">
                  <span className="font-semibold">体检提醒闭环：</span>体检提醒 → 选择医院套餐 → 预约时间 → 线下就医导航 → 体检报告入档 → 异常指标复诊提醒
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 flex-wrap text-[10px] text-gray-500">
          {Object.entries(typeConfig).map(([type, config]) => {
            const Icon = config.icon;
            const count = events.filter(e => e.type === type && !e.completed).length;
            return (
              <div key={type} className="flex items-center gap-1.5">
                <div className={cn('w-4 h-4 rounded flex items-center justify-center', config.color)}>
                  <Icon className="w-2.5 h-2.5" />
                </div>
                <span>{config.label} {count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
