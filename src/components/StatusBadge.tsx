import { clsx } from "clsx";

type StatusType = "healthy" | "warning" | "critical" | "connected" | "disconnected" | "expired" | "draft" | "reviewing" | "approved" | "archived" | "todo" | "in_progress" | "done" | "eligible" | "applying" | "disbursed" | "submitted" | "processing" | "resolved" | "low" | "medium" | "high" | "full" | "pending" | "generating" | "completed" | "active" | "inactive";

const statusConfig: Record<StatusType, { label: string; color: string; dot: string }> = {
  healthy: { label: "正常", color: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  warning: { label: "告警", color: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  critical: { label: "异常", color: "bg-red-50 text-red-700", dot: "bg-red-500 alert-pulse" },
  connected: { label: "已连接", color: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  disconnected: { label: "未连接", color: "bg-gray-50 text-gray-500", dot: "bg-gray-400" },
  expired: { label: "已过期", color: "bg-red-50 text-red-600", dot: "bg-red-400" },
  draft: { label: "草稿", color: "bg-gray-50 text-gray-600", dot: "bg-gray-400" },
  reviewing: { label: "审核中", color: "bg-blue-50 text-blue-600", dot: "bg-blue-400" },
  approved: { label: "已通过", color: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-400" },
  archived: { label: "已归档", color: "bg-gray-50 text-gray-500", dot: "bg-gray-300" },
  todo: { label: "待办", color: "bg-gray-50 text-gray-600", dot: "bg-gray-400" },
  in_progress: { label: "进行中", color: "bg-blue-50 text-blue-600", dot: "bg-blue-400" },
  done: { label: "已完成", color: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-400" },
  eligible: { label: "符合条件", color: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-400" },
  applying: { label: "申领中", color: "bg-blue-50 text-blue-600", dot: "bg-blue-400" },
  disbursed: { label: "已到账", color: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  submitted: { label: "已提交", color: "bg-blue-50 text-blue-600", dot: "bg-blue-400" },
  processing: { label: "处理中", color: "bg-amber-50 text-amber-600", dot: "bg-amber-400" },
  resolved: { label: "已解决", color: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-400" },
  low: { label: "空闲", color: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-400" },
  medium: { label: "适中", color: "bg-blue-50 text-blue-600", dot: "bg-blue-400" },
  high: { label: "较忙", color: "bg-amber-50 text-amber-600", dot: "bg-amber-400" },
  full: { label: "限流", color: "bg-red-50 text-red-600", dot: "bg-red-500 alert-pulse" },
  pending: { label: "待生成", color: "bg-gray-50 text-gray-500", dot: "bg-gray-300" },
  generating: { label: "生成中", color: "bg-blue-50 text-blue-500", dot: "bg-blue-400" },
  completed: { label: "已完成", color: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-400" },
  active: { label: "已激活", color: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-400" },
  inactive: { label: "未激活", color: "bg-gray-50 text-gray-500", dot: "bg-gray-300" },
};

interface StatusBadgeProps {
  status: StatusType;
  size?: "sm" | "md";
  pulse?: boolean;
}

export default function StatusBadge({ status, size = "sm", pulse = false }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, color: "bg-gray-50 text-gray-500", dot: "bg-gray-400" };
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full font-medium", size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm", config.color)}>
      <span className={clsx("rounded-full", size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2", config.dot, pulse && "alert-pulse")} />
      {config.label}
    </span>
  );
}
