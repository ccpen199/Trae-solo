import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, Moon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn, dayjs, sleepQualityColor } from '@/lib/utils';

export default function ScheduleCalendar() {
  const { sleepSessions, improvementPlan } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  const today = dayjs();
  const startOfMonth = currentMonth.startOf('month');
  const endOfMonth = currentMonth.endOf('month');
  const startDay = startOfMonth.day();
  const daysInMonth = currentMonth.daysInMonth();

  const calendarDays = useMemo(() => {
    const days: {
      date: ReturnType<typeof dayjs> | null;
      efficiency?: number;
      hasSession: boolean;
      tasksCompleted?: number;
      totalTasks?: number;
      isToday: boolean;
      isCurrentMonth: boolean;
    }[] = [];

    const prevMonth = currentMonth.subtract(1, 'month');
    const prevMonthDays = prevMonth.daysInMonth();
    for (let i = startDay - 1; i >= 0; i--) {
      const date = prevMonth.date(prevMonthDays - i);
      const session = sleepSessions.find((s) =>
        dayjs(s.startTime).isSame(date, 'day')
      );
      const dayTasks = improvementPlan.tasks.filter((t) =>
        dayjs(t.date).isSame(date, 'day')
      );
      days.push({
        date,
        efficiency: session?.sleepEfficiency,
        hasSession: !!session,
        tasksCompleted: dayTasks.filter((t) => t.completed).length,
        totalTasks: dayTasks.length,
        isToday: false,
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = currentMonth.date(i);
      const session = sleepSessions.find((s) =>
        dayjs(s.startTime).isSame(date, 'day')
      );
      const dayTasks = improvementPlan.tasks.filter((t) =>
        dayjs(t.date).isSame(date, 'day')
      );
      days.push({
        date,
        efficiency: session?.sleepEfficiency,
        hasSession: !!session,
        tasksCompleted: dayTasks.filter((t) => t.completed).length,
        totalTasks: dayTasks.length,
        isToday: date.isSame(today, 'day'),
        isCurrentMonth: true,
      });
    }

    const remaining = 42 - days.length;
    const nextMonth = currentMonth.add(1, 'month');
    for (let i = 1; i <= remaining; i++) {
      const date = nextMonth.date(i);
      const session = sleepSessions.find((s) =>
        dayjs(s.startTime).isSame(date, 'day')
      );
      const dayTasks = improvementPlan.tasks.filter((t) =>
        dayjs(t.date).isSame(date, 'day')
      );
      days.push({
        date,
        efficiency: session?.sleepEfficiency,
        hasSession: !!session,
        tasksCompleted: dayTasks.filter((t) => t.completed).length,
        totalTasks: dayTasks.length,
        isToday: false,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentMonth, startDay, daysInMonth, sleepSessions, improvementPlan.tasks, today]);

  const goToPrevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };

  const goToNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };

  const goToToday = () => {
    setCurrentMonth(dayjs());
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const getEfficiencyColor = (efficiency?: number) => {
    if (!efficiency) return 'bg-white/5';
    if (efficiency >= 90) return 'bg-mint-400/40';
    if (efficiency >= 80) return 'bg-night-300/50';
    if (efficiency >= 70) return 'bg-dream-400/40';
    return 'bg-coral-400/40';
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">睡眠日历</h3>
          <p className="text-sm text-silver-400 mt-0.5">查看每日睡眠效率与打卡记录</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="btn-secondary text-sm py-2 px-4"
          >
            今天
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevMonth}
              className="w-9 h-9 rounded-full flex items-center justify-center text-silver-300 hover:text-white hover:bg-white/10 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToNextMonth}
              className="w-9 h-9 rounded-full flex items-center justify-center text-silver-300 hover:text-white hover:bg-white/10 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center mb-4">
        <h2 className="text-xl font-semibold text-white font-display">
          {currentMonth.format('YYYY年 MM月')}
        </h2>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, i) => (
          <div
            key={day}
            className={cn(
              'text-center text-xs font-medium py-2',
              i === 0 || i === 6 ? 'text-coral-300' : 'text-silver-400'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map((day, idx) => {
          const allTasksDone = day.totalTasks && day.totalTasks > 0 && day.tasksCompleted === day.totalTasks;

          return (
            <div
              key={idx}
              className={cn(
                'relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 p-1.5 transition-all duration-300',
                day.isCurrentMonth ? 'text-white' : 'text-silver-500/50',
                day.isToday
                  ? 'ring-2 ring-dream-400 shadow-glow-dream bg-dream-400/10'
                  : 'bg-white/[0.03] hover:bg-white/[0.06]',
                day.hasSession && !day.isToday && getEfficiencyColor(day.efficiency)
              )}
            >
              <span className={cn(
                'text-sm font-medium',
                day.isToday && 'text-dream-200',
                !day.isCurrentMonth && 'opacity-40'
              )}>
                {day.date?.date()}
              </span>

              {day.hasSession && (
                <div className="flex items-center gap-0.5">
                  <Moon size={10} className={cn(sleepQualityColor(day.efficiency || 0))} />
                  <span className={cn('text-[10px] font-mono', sleepQualityColor(day.efficiency || 0))}>
                    {day.efficiency}%
                  </span>
                </div>
              )}

              {day.totalTasks && day.totalTasks > 0 && (
                <div className={cn(
                  'absolute bottom-1 right-1 w-4 h-4 rounded-full flex items-center justify-center',
                  allTasksDone
                    ? 'bg-mint-400 text-night-900'
                    : 'bg-white/10 text-silver-300'
                )}>
                  <Check size={10} strokeWidth={3} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-mint-400/50" />
          <span className="text-xs text-silver-400">高效 (≥90%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-night-300/50" />
          <span className="text-xs text-silver-400">良好 (≥80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-dream-400/50" />
          <span className="text-xs text-silver-400">一般 (≥70%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-coral-400/50" />
          <span className="text-xs text-silver-400">较差 (&lt;70%)</span>
        </div>
      </div>
    </div>
  );
}
