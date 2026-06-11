import { motion } from 'framer-motion';
import {
  UserCheck,
  FileCheck2,
  Eye,
  Blocks,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import type { VerificationNode, VerificationStatus } from '@shared/types';
import { cn } from '@/lib/utils';

interface VerificationChainProps {
  nodes: VerificationNode[];
  className?: string;
}

const stepConfig = [
  {
    step: 1,
    icon: UserCheck,
    title: '经纪人认证',
    description: '经纪人身份与资质核验',
  },
  {
    step: 2,
    icon: FileCheck2,
    title: '业主授权',
    description: '房屋产权证明与业主委托验证',
  },
  {
    step: 3,
    icon: Eye,
    title: 'VR 水印',
    description: 'VR 全景拍摄与防伪水印嵌入',
  },
  {
    step: 4,
    icon: Blocks,
    title: '区块链存证',
    description: '验证数据上链，不可篡改',
  },
];

const statusConfig: Record<
  VerificationStatus,
  { icon: typeof CheckCircle2; color: string; bgColor: string; text: string }
> = {
  verified: {
    icon: CheckCircle2,
    color: 'text-accent-down',
    bgColor: 'bg-accent-down',
    text: '已验证',
  },
  pending: {
    icon: Clock,
    color: 'text-accent-verified',
    bgColor: 'bg-accent-verified',
    text: '待验证',
  },
  rejected: {
    icon: XCircle,
    color: 'text-accent-up',
    bgColor: 'bg-accent-up',
    text: '已拒绝',
  },
  expired: {
    icon: AlertCircle,
    color: 'text-neutral-500',
    bgColor: 'bg-neutral-500',
    text: '已过期',
  },
};

export default function VerificationChain({
  nodes,
  className,
}: VerificationChainProps) {
  const getNodeByStep = (step: number) =>
    nodes.find((n) => n.step === step);

  const formatHash = (hash: string) => {
    if (!hash) return '-';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="relative">
        <div className="absolute left-6 top-6 h-[calc(100%-3rem)] w-0.5 bg-gradient-to-b from-primary-200 via-primary-300 to-primary-200" />

        <div className="space-y-6">
          {stepConfig.map((config, index) => {
            const node = getNodeByStep(config.step);
            const status = node?.status || 'pending';
            const StatusIcon = statusConfig[status].icon;
            const StepIcon = config.icon;
            const isCompleted = status === 'verified';
            const isLast = index === stepConfig.length - 1;

            return (
              <motion.div
                key={config.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="relative pl-16"
              >
                <div
                  className={cn(
                    'absolute left-0 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white shadow-md',
                    isCompleted
                      ? statusConfig[status].bgColor
                      : 'bg-neutral-200'
                  )}
                >
                  <StepIcon
                    className={cn(
                      'h-6 w-6',
                      isCompleted ? 'text-white' : 'text-neutral-500'
                    )}
                  />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: isCompleted ? 1 : 0 }}
                    transition={{
                      delay: index * 0.1 + 0.3,
                      type: 'spring',
                      stiffness: 300,
                    }}
                    className={cn(
                      'absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full',
                      statusConfig[status].bgColor
                    )}
                  >
                    <StatusIcon className="h-3 w-3 text-white" />
                  </motion.div>
                </div>

                {!isLast && (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: isCompleted ? 1 : 0 }}
                    transition={{
                      delay: index * 0.1 + 0.5,
                      duration: 0.4,
                    }}
                    className={cn(
                      'absolute left-6 top-12 h-6 w-0.5 origin-top',
                      statusConfig[status].bgColor
                    )}
                  />
                )}

                <div className="rounded-lg border border-neutral-100 bg-white p-4 shadow-sm transition-all hover:shadow-md">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-semibold text-neutral-900">
                      {config.title}
                    </h4>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                        status === 'verified' && 'bg-accent-down/10 text-accent-down',
                        status === 'pending' && 'bg-accent-verified/10 text-accent-verified',
                        status === 'rejected' && 'bg-accent-up/10 text-accent-up',
                        status === 'expired' && 'bg-neutral-100 text-neutral-500'
                      )}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig[status].text}
                    </span>
                  </div>

                  <p className="mb-3 text-sm text-neutral-500">
                    {config.description}
                  </p>

                  {node && (
                    <div className="space-y-2 border-t border-neutral-100 pt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400">操作人</span>
                        <span className="font-mono text-neutral-600">
                          {node.operator}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400">时间戳</span>
                        <span className="font-mono text-neutral-600">
                          {formatDate(node.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400">区块哈希</span>
                        <span className="font-mono text-primary-600">
                          {formatHash(node.hash)}
                        </span>
                      </div>
                    </div>
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
