import { useMemo, useState } from 'react';
import { Check, Star, Calendar, Flame, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn, dayjs } from '@/lib/utils';

const typeIcons: Record<string, typeof Calendar> = {
  schedule: Calendar,
  cbt: Sparkles,
  audio: Star,
  assessment: Calendar,
  habit: Flame,
};

const typeLabels: Record<string, string> = {
  schedule: '作息',
  cbt: 'CBT',
  audio: '音频',
  assessment: '评估',
  habit: '习惯',
};

const typeColors: Record<string, string> = {
  schedule: 'text-mint-300 bg-mint-400/15',
  cbt: 'text-dream-300 bg-dream-400/15',
  audio: 'text-coral-300 bg-coral-400/15',
  assessment: 'text-night-200 bg-night-300/20',
  habit: 'text-coral-300 bg-coral-400/15',
};

export default function TaskChecklist() {
  const { improvementPlan, completeTask } = useAppStore();
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const todayTasks = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return improvementPlan.tasks.filter((task) => task.date === today);
  }, [improvementPlan.tasks]);

  const completedCount = todayTasks.filter((t) => t.completed).length;
  const totalPoints = todayTasks
    .filter((t) => t.completed)
    .reduce((sum, t) => sum + t.rewardPoints, 0);
  const progress = todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0;

  const handleToggle = (taskId: string) => {
    setAnimatingId(taskId);
    completeTask(taskId);
    setTimeout(() => setAnimatingId(null), 600);
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">今日任务</h3>
          <p className="text-sm text-silver-400 mt-0.5">
            {dayjs().format('MM月DD日')} · 完成任务获得积分
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-mint-400/20 to-dream-400/20 border border-mint-400/30">
          <Star size={16} className="text-mint-300 fill-mint-300" />
          <span className="font-semibold text-white">+{totalPoints}</span>
          <span className="text-xs text-silver-300">积分</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-silver-300">
            已完成 {completedCount}/{todayTasks.length} 项
          </span>
          <span className="text-sm font-medium text-mint-300">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-mint-400 via-dream-400 to-mint-400 rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              backgroundSize: '200% 100%',
              animation: progress > 0 ? 'shimmer 2s linear infinite' : 'none',
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {todayTasks.map((task) => {
          const Icon = typeIcons[task.type] || Calendar;
          const isAnimating = animatingId === task.id;

          return (
            <div
              key={task.id}
              className={cn(
                'group relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300',
                task.completed
                  ? 'bg-mint-400/10 border border-mint-400/20'
                  : 'bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10',
                isAnimating && 'scale-[1.02]'
              )}
              onClick={() => handleToggle(task.id)}
            >
              <div
                className={cn(
                  'relative w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0',
                  task.completed
                    ? 'bg-gradient-to-br from-mint-400 to-dream-400 border-transparent shadow-glow-mint'
                    : 'border-silver-500 group-hover:border-mint-400/60'
                )}
              >
                <Check
                  size={14}
                  strokeWidth={3}
                  className={cn(
                    'text-night-900 transition-all duration-300',
                    task.completed
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-50'
                  )}
                />

                {isAnimating && task.completed && (
                  <div className="absolute inset-0 rounded-full bg-mint-400 animate-pulse-ring" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
                      typeColors[task.type] || 'bg-white/10 text-silver-300'
                    )}
                  >
                    <Icon size={10} />
                    {typeLabels[task.type] || task.type}
                  </span>
                </div>

                <h4
                  className={cn(
                    'font-medium text-sm transition-all duration-300',
                    task.completed
                      ? 'text-silver-400 line-through'
                      : 'text-white group-hover:text-dream-100'
                  )}
                >
                  {task.title}
                </h4>
                <p
                  className={cn(
                    'text-xs mt-0.5 transition-all duration-300',
                    task.completed ? 'text-silver-500' : 'text-silver-400'
                  )}
                >
                  {task.description}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Star
                  size={14}
                  className={cn(
                    'transition-all duration-300',
                    task.completed
                      ? 'text-mint-300 fill-mint-300'
                      : 'text-silver-500'
                  )}
                />
                <span
                  className={cn(
                    'text-sm font-mono transition-all duration-300',
                    task.completed ? 'text-mint-300' : 'text-silver-400'
                  )}
                >
                  +{task.rewardPoints}
                </span>
              </div>

              {task.completed && task.completedAt && (
                <div className="absolute bottom-2 right-4 text-[10px] text-silver-500">
                  {dayjs(task.completedAt).format('HH:mm')} 完成
                </div>
              )}
            </div>
          );
        })}
      </div>

      {todayTasks.length === 0 && (
        <div className="text-center py-8">
          <Calendar size={40} className="mx-auto text-silver-600 mb-3" />
          <p className="text-silver-400 text-sm">暂无今日任务</p>
          <p className="text-silver-500 text-xs mt-1">好好休息，明天继续加油</p>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
