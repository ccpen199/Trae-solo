import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  PlayCircle,
  BookOpen,
} from 'lucide-react';
import type { CBTModule } from '@/types';
import { cn } from '@/lib/utils';

interface CBTModuleCardProps {
  module: CBTModule;
  onSessionClick?: (sessionId: string) => void;
}

const typeIcons: Record<string, typeof BookOpen> = {
  sleep_restriction: BookOpen,
  stimulus_control: PlayCircle,
  cognitive_restructuring: BookOpen,
  relaxation: PlayCircle,
};

const typeLabels: Record<string, string> = {
  sleep_restriction: '睡眠限制',
  stimulus_control: '刺激控制',
  cognitive_restructuring: '认知重构',
  relaxation: '放松训练',
};

export default function CBTModuleCard({ module, onSessionClick }: CBTModuleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const completedCount = module.sessions.filter((s) => s.completed).length;
  const Icon = typeIcons[module.type] || BookOpen;

  return (
    <div className="glass-card-hover overflow-hidden">
      <div
        className="p-5 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dream-400/30 to-mint-400/30 flex items-center justify-center text-dream-300 flex-shrink-0">
            <Icon size={22} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="chip-dream text-xs">
                {typeLabels[module.type] || module.type}
              </span>
              <span className="text-xs text-silver-500">
                {completedCount}/{module.sessions.length} 节课
              </span>
            </div>

            <h3 className="font-semibold text-white text-base mb-1">
              {module.title}
            </h3>
            <p className="text-sm text-silver-400 line-clamp-2">
              {module.description}
            </p>

            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-silver-400">学习进度</span>
                <span className="text-xs font-mono text-mint-300">
                  {module.progress}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-mint-400 to-dream-400 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${module.progress}%` }}
                />
              </div>
            </div>
          </div>

          <button className="w-8 h-8 rounded-full flex items-center justify-center text-silver-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-white/5 px-5 py-4 space-y-2">
          <p className="text-xs text-silver-400 uppercase tracking-wider font-medium mb-3">
            课程章节
          </p>
          {module.sessions.map((session, index) => (
            <div
              key={session.id}
              onClick={(e) => {
                e.stopPropagation();
                onSessionClick?.(session.id);
              }}
              className={cn(
                'flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200',
                session.completed
                  ? 'bg-mint-400/10 hover:bg-mint-400/15'
                  : index === completedCount
                  ? 'bg-dream-400/15 hover:bg-dream-400/20 ring-1 ring-dream-400/30'
                  : 'bg-white/[0.03] hover:bg-white/[0.06]'
              )}
            >
              <div className="flex-shrink-0">
                {session.completed ? (
                  <CheckCircle2 size={22} className="text-mint-400" />
                ) : index === completedCount ? (
                  <PlayCircle size={22} className="text-dream-300 fill-dream-400/20" />
                ) : (
                  <Circle size={22} className="text-silver-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-silver-500 font-mono">
                    第{index + 1}节
                  </span>
                  {session.exercise && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-silver-300">
                      含练习
                    </span>
                  )}
                </div>
                <h4
                  className={cn(
                    'font-medium text-sm',
                    session.completed
                      ? 'text-silver-300'
                      : index === completedCount
                      ? 'text-white'
                      : 'text-silver-400'
                  )}
                >
                  {session.title}
                </h4>
              </div>

              {index === completedCount && !session.completed && (
                <span className="text-xs text-dream-300 font-medium flex-shrink-0">
                  继续
                </span>
              )}
              {session.completed && (
                <span className="text-xs text-mint-300 flex-shrink-0">
                  已完成
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
