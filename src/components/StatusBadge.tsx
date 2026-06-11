import { cn } from "@/lib/utils";

type StatusType =
  | "active"
  | "pending"
  | "rejected"
  | "approved"
  | "expired"
  | "unused"
  | "used"
  | "draft"
  | "executing"
  | "completed"
  | "confirmed"
  | "cancelled"
  | "purchased"
  | "suspended"
  | "blacklisted"
  | "applying"
  | "shipped";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  active: { label: "已激活", className: "bg-green-50 text-green-700 border-green-200" },
  pending: { label: "待审核", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  rejected: { label: "已驳回", className: "bg-red-50 text-red-700 border-red-200" },
  approved: { label: "已通过", className: "bg-green-50 text-green-700 border-green-200" },
  expired: { label: "已过期", className: "bg-gray-50 text-gray-600 border-gray-200" },
  unused: { label: "未使用", className: "bg-blue-50 text-blue-700 border-blue-200" },
  used: { label: "已使用", className: "bg-gray-50 text-gray-600 border-gray-200" },
  draft: { label: "草稿", className: "bg-gray-50 text-gray-600 border-gray-200" },
  executing: { label: "执行中", className: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "已完成", className: "bg-green-50 text-green-700 border-green-200" },
  confirmed: { label: "已确认", className: "bg-green-50 text-green-700 border-green-200" },
  cancelled: { label: "已取消", className: "bg-gray-50 text-gray-600 border-gray-200" },
  purchased: { label: "已购", className: "bg-green-50 text-green-700 border-green-200" },
  suspended: { label: "已暂停", className: "bg-orange-50 text-orange-700 border-orange-200" },
  blacklisted: { label: "黑名单", className: "bg-red-50 text-red-700 border-red-200" },
  applying: { label: "申请中", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  shipped: { label: "已发货", className: "bg-blue-50 text-blue-700 border-blue-200" },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  if (!config) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
