import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  MotionStatus,
  SealStatus,
  TicketStatus,
  SwapItemStatus,
  UserRole,
} from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date, format = "YYYY-MM-DD"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return format
    .replace("YYYY", String(year))
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hours)
    .replace("mm", minutes);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function formatPercent(value: number): string {
  return value.toFixed(1) + "%";
}

export function getMotionStatusLabel(status: MotionStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  const statusMap = {
    draft: { label: "草拟", color: "text-slate-600", bgColor: "bg-slate-100" },
    publicity: {
      label: "公示中",
      color: "text-amber-700",
      bgColor: "bg-amber-100",
    },
    voting: {
      label: "投票中",
      color: "text-primary-700",
      bgColor: "bg-primary-100",
    },
    passed: {
      label: "已通过",
      color: "text-emerald-700",
      bgColor: "bg-emerald-100",
    },
    rejected: {
      label: "已否决",
      color: "text-rose-700",
      bgColor: "bg-rose-100",
    },
  };
  return statusMap[status];
}

export function getSealStatusLabel(status: SealStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  const statusMap = {
    pending: {
      label: "待审批",
      color: "text-amber-700",
      bgColor: "bg-amber-100",
    },
    approved: {
      label: "已批准",
      color: "text-primary-700",
      bgColor: "bg-primary-100",
    },
    rejected: {
      label: "已拒绝",
      color: "text-rose-700",
      bgColor: "bg-rose-100",
    },
    in_use: {
      label: "使用中",
      color: "text-trust-700",
      bgColor: "bg-trust-100",
    },
    returned: {
      label: "已归还",
      color: "text-emerald-700",
      bgColor: "bg-emerald-100",
    },
  };
  return statusMap[status];
}

export function getTicketStatusLabel(status: TicketStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  const statusMap = {
    pending_assign: {
      label: "待派单",
      color: "text-amber-700",
      bgColor: "bg-amber-100",
    },
    assigned: {
      label: "已派单",
      color: "text-trust-700",
      bgColor: "bg-trust-100",
    },
    processing: {
      label: "处理中",
      color: "text-primary-700",
      bgColor: "bg-primary-100",
    },
    completed: {
      label: "已完成",
      color: "text-emerald-700",
      bgColor: "bg-emerald-100",
    },
    escalated: {
      label: "已督办",
      color: "text-rose-700",
      bgColor: "bg-rose-100",
    },
  };
  return statusMap[status];
}

export function getPriorityLabel(
  priority: "low" | "medium" | "high" | "urgent"
): { label: string; color: string; bgColor: string } {
  const map = {
    low: {
      label: "低",
      color: "text-slate-600",
      bgColor: "bg-slate-100",
    },
    medium: {
      label: "中",
      color: "text-amber-700",
      bgColor: "bg-amber-100",
    },
    high: {
      label: "高",
      color: "text-orange-700",
      bgColor: "bg-orange-100",
    },
    urgent: {
      label: "紧急",
      color: "text-rose-700",
      bgColor: "bg-rose-100",
    },
  };
  return map[priority];
}

export function getSwapStatusLabel(status: SwapItemStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  const map = {
    available: {
      label: "可兑换",
      color: "text-emerald-700",
      bgColor: "bg-emerald-100",
    },
    reserved: {
      label: "已预订",
      color: "text-amber-700",
      bgColor: "bg-amber-100",
    },
    swapped: {
      label: "已兑换",
      color: "text-slate-600",
      bgColor: "bg-slate-100",
    },
  };
  return map[status];
}

export function getSealTypeLabel(type: "official" | "finance" | "contract"): {
  label: string;
  color: string;
} {
  const map = {
    official: { label: "公章", color: "text-primary-700" },
    finance: { label: "财务专用章", color: "text-emerald-700" },
    contract: { label: "合同专用章", color: "text-trust-700" },
  };
  return map[type];
}

export function getRoleLabel(role: UserRole): string {
  const map: Record<UserRole, string> = {
    owner: "业主",
    council_director: "业委会主任",
    council_member: "业委会委员",
    property_admin: "物业管理员",
    maintenance_staff: "维修人员",
    street_officer: "街道工作人员",
  };
  return map[role];
}

export function getConditionLabel(
  condition: "new" | "like_new" | "good" | "fair"
): string {
  const map = {
    new: "全新",
    like_new: "九成新",
    good: "良好",
    fair: "一般",
  };
  return map[condition];
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function getTimeRemaining(endDate: string): {
  days: number;
  hours: number;
  minutes: number;
  totalMinutes: number;
} {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, totalMinutes: 0 };
  }

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  return { days, hours, minutes, totalMinutes };
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
