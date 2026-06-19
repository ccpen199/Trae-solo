import { motion } from 'framer-motion';
import { Check, MessageSquare, AlertTriangle, Scale, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DisputeStage, ServiceEvaluation } from '@/types';

interface ProcessTimelineProps {
  stages: DisputeStage;
  evaluations?: ServiceEvaluation[];
  disputedAt?: string;
  resolvedAt?: string;
}

const stageList: {
  key: DisputeStage;
  label: string;
  icon: typeof MessageSquare;
  description: string;
}[] = [
  {
    key: 'evaluation',
    label: '服务评价',
    icon: MessageSquare,
    description: '用户提交评价或投诉',
  },
  {
    key: 'appeal',
    label: '申诉受理',
    icon: AlertTriangle,
    description: '平台介入并受理申诉',
  },
  {
    key: 'arbitration',
    label: '仲裁调解',
    icon: Scale,
    description: '组织双方进行调解仲裁',
  },
  {
    key: 'resolved',
    label: '处理完结',
    icon: CheckCircle,
    description: '纠纷处理完毕并归档',
  },
];

const stageOrder: DisputeStage[] = ['evaluation', 'appeal', 'arbitration', 'resolved'];

export default function ProcessTimeline({
  stages,
  disputedAt,
  resolvedAt,
}: ProcessTimelineProps) {
  const currentIndex = stageOrder.indexOf(stages);

  return (
    <div className="rounded-xl border border-primary-100/50 bg-white p-6 shadow-card">
      <h3 className="mb-6 font-serif text-lg font-semibold text-primary-800">
        纠纷处理进度
      </h3>

      <div className="relative">
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-primary-100" />

        <motion.div
          className="absolute left-[19px] top-2 w-0.5 bg-gold-gradient"
          initial={{ height: 0 }}
          animate={{
            height: `${Math.max((currentIndex / (stageList.length - 1)) * 100, 0)}%`,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            maxHeight: 'calc(100% - 1rem)',
          }}
        />

        <div className="space-y-6">
          {stageList.map((stage, index) => {
            const Icon = stage.icon;
            const isCompleted = index < currentIndex;
            const isActive = index === currentIndex;
            const isPending = index > currentIndex;

            return (
              <motion.div
                key={stage.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="relative flex items-start gap-4"
              >
                <div
                  className={cn(
                    'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300',
                    isCompleted &&
                      'border-accent-gold bg-gold-gradient text-primary-900 shadow-gold',
                    isActive &&
                      'border-primary-700 bg-primary-700 text-white shadow-lg ring-4 ring-primary-700/20',
                    isPending &&
                      'border-primary-200 bg-white text-primary-300'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>

                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <h4
                      className={cn(
                        'font-medium',
                        isCompleted && 'text-primary-800',
                        isActive && 'text-primary-900',
                        isPending && 'text-primary-400'
                      )}
                    >
                      {stage.label}
                    </h4>
                    {isActive && (
                      <span className="badge bg-primary-50 text-primary-600 border-primary-100 border animate-pulse-slow">
                        进行中
                      </span>
                    )}
                    {isCompleted && (
                      <span className="badge bg-accent-gold/10 text-accent-gold-dark border-accent-gold/30 border">
                        已完成
                      </span>
                    )}
                  </div>

                  <p
                    className={cn(
                      'mt-1 text-sm',
                      isCompleted || isActive ? 'text-primary-500' : 'text-primary-300'
                    )}
                  >
                    {stage.description}
                  </p>

                  {stage.key === 'appeal' && disputedAt && (isCompleted || isActive) && (
                    <p className="mt-1 text-xs text-primary-400">
                      受理时间：{new Date(disputedAt).toLocaleString('zh-CN')}
                    </p>
                  )}

                  {stage.key === 'resolved' && resolvedAt && isCompleted && (
                    <p className="mt-1 text-xs text-primary-400">
                      完结时间：{new Date(resolvedAt).toLocaleString('zh-CN')}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
