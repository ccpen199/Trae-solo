import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import HealthCalendar from '@/components/HealthCalendar';
import type { HealthCalendarEvent } from '@shared/types';
import { cn } from '@/lib/utils';

const mockEvents: HealthCalendarEvent[] = [
  {
    id: 'e1',
    ownerId: '1',
    petId: '1',
    type: 'vaccine',
    title: '豆豆 - 六联疫苗加强针',
    date: '2025-06-20',
    reminderDays: 3,
    completed: false,
  },
  {
    id: 'e2',
    ownerId: '1',
    petId: '1',
    type: 'deworming',
    title: '豆豆 - 体内驱虫',
    date: '2025-06-18',
    reminderDays: 3,
    completed: false,
  },
  {
    id: 'e3',
    ownerId: '1',
    petId: '2',
    type: 'checkup',
    title: '咪咪 - 年度体检',
    date: '2025-07-05',
    reminderDays: 7,
    completed: false,
  },
  {
    id: 'e4',
    ownerId: '1',
    petId: '1',
    type: 'vaccine',
    title: '豆豆 - 狂犬疫苗',
    date: '2025-06-10',
    reminderDays: 3,
    completed: true,
  },
  {
    id: 'e5',
    ownerId: '1',
    petId: '1',
    type: 'deworming',
    title: '豆豆 - 体外驱虫',
    date: '2025-06-08',
    reminderDays: 3,
    completed: true,
  },
  {
    id: 'e6',
    ownerId: '1',
    petId: '1',
    type: 'custom',
    title: '豆豆 - 美容洗澡',
    date: '2025-06-22',
    reminderDays: 1,
    completed: false,
  },
];

export default function Calendar() {
  const [selectedEvent, setSelectedEvent] = useState<HealthCalendarEvent | null>(null);
  const [events, setEvents] = useState(mockEvents);

  const upcomingEvents = events
    .filter((e) => !e.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const completedEvents = events
    .filter((e) => e.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const toggleComplete = (id: string) => {
    setEvents(events.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-title">健康日历</h1>
          <p className="section-subtitle">记录和提醒宠物健康事项</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-5 h-5" />
          添加提醒
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HealthCalendar events={events} onEventClick={setSelectedEvent} />
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-gray-900">待办事项</h3>
              <span className="tag tag-orange">{upcomingEvents.length} 项</span>
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">暂无待办事项</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => {
                  const daysUntil = Math.ceil(
                    (new Date(event.date).getTime() - Date.now()) / 86400000
                  );
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors',
                        selectedEvent?.id === event.id ? 'bg-forest-50 ring-2 ring-forest-300' : 'bg-cream-50 hover:bg-cream-100'
                      )}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComplete(event.id);
                        }}
                        className="w-6 h-6 rounded-full border-2 border-forest-300 flex items-center justify-center flex-shrink-0 hover:bg-forest-500 hover:border-forest-500 transition-colors group"
                      >
                        <Check className="w-4 h-4 text-transparent group-hover:text-white" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.date).toLocaleDateString('zh-CN', {
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'text-xs font-medium px-2 py-1 rounded-full flex-shrink-0',
                          daysUntil < 0
                            ? 'bg-red-100 text-red-600'
                            : daysUntil <= 3
                            ? 'bg-warm-100 text-warm-500'
                            : 'bg-forest-100 text-forest-600'
                        )}
                      >
                        {daysUntil < 0 ? `已逾期${-daysUntil}天` : daysUntil === 0 ? '今天' : `${daysUntil}天后`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {completedEvents.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-gray-900">已完成</h3>
                <span className="tag tag-green">{completedEvents.length} 项</span>
              </div>
              <div className="space-y-2">
                {completedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="w-6 h-6 rounded-full bg-forest-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500 line-through truncate">{event.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
