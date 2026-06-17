import type { Task, TaskType } from "@/types";
import { Video, FileText, Package, Clock, Zap, Users, ChevronRight, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const taskTypeConfig: Record<
  TaskType,
  { label: string; icon: React.ElementType; color: string; bgClass: string }
> = {
  media: {
    label: "媒体类",
    icon: Video,
    color: "text-cyber-cyan-400",
    bgClass: "bg-cyber-cyan-500/10 border-cyber-cyan-500/20",
  },
  survey: {
    label: "调研类",
    icon: FileText,
    color: "text-purple-400",
    bgClass: "bg-purple-500/10 border-purple-500/20",
  },
  experience: {
    label: "体验类",
    icon: Package,
    color: "text-amber-gold-400",
    bgClass: "bg-amber-gold-500/10 border-amber-gold-500/20",
  },
};

interface TaskCardProps {
  task: Task;
  className?: string;
}

export function TaskCard({ task, className }: TaskCardProps) {
  const navigate = useNavigate();
  const config = taskTypeConfig[task.type];
  const Icon = config.icon;
  const progress = (task.completed / task.quota) * 100;
  const hasPriceBoost = task.reward > task.originalReward;

  const riskChecks = [
    { key: "ip", label: "IP去重", enabled: task.riskConfig.ipDeduplication },
    { key: "device", label: "设备指纹", enabled: task.riskConfig.deviceFingerprintCheck },
    { key: "logic", label: "逻辑校验", enabled: task.riskConfig.logicValidation },
    { key: "anti", label: "防刷题", enabled: task.riskConfig.antiCheating },
  ].filter((c) => c.enabled);

  return (
    <div
      className={cn(
        "glass-card-hover p-5 cursor-pointer group",
        className
      )}
      onClick={() => navigate(`/executor/task/${task.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <span className={cn("tag", config.bgClass, config.color)}>
          <Icon className="w-3.5 h-3.5 mr-1.5" />
          {config.label}
        </span>
        <div className="flex items-center gap-2">
          {hasPriceBoost && (
            <span className="tag tag-gold animate-pulse">
              <Zap className="w-3.5 h-3.5 mr-1" />
              加价
            </span>
          )}
          <span className="tag tag-green flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            风控已启用
          </span>
        </div>
      </div>

      <h3 className="font-medium text-white mb-2 line-clamp-2 group-hover:text-cyber-cyan-400 transition-colors">
        {task.title}
      </h3>

      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{task.description}</p>

      {riskChecks.length > 0 && (
        <div className="mb-3 p-3 bg-deep-space-800/50 rounded-lg border border-white/5">
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyber-cyan-400" />
            可接任务风控校验
          </p>
          <div className="flex flex-wrap gap-2">
            {riskChecks.map((check) => (
              <span
                key={check.key}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-cyber-cyan-500/10 text-cyber-cyan-400 border border-cyber-cyan-500/20"
              >
                <CheckCircle2 className="w-3 h-3" />
                {check.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {task.estimatedTime}分钟
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {task.completed}/{task.quota}人
        </span>
        <span className="flex items-center gap-1 text-cyber-cyan-400">
          <AlertCircle className="w-3.5 h-3.5" />
          信用{task.executorQualification.minCreditScore}+
        </span>
      </div>

      <div className="progress-bar mb-4">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-2xl font-display font-bold text-amber-gold-400">
            ¥{task.reward.toFixed(1)}
          </span>
          {hasPriceBoost && (
            <span className="text-xs text-gray-500 line-through ml-2">
              ¥{task.originalReward.toFixed(1)}
            </span>
          )}
        </div>
        <button className="btn-primary px-4 py-2 text-sm flex items-center gap-1">
          立即接单
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export { taskTypeConfig };
