import type { DeviceStatus } from "@/types"
import { cn } from "@/lib/utils"

const statusConfig: Record<DeviceStatus, { label: string; dot: string; bg: string }> = {
  online: { label: "在线", dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700" },
  offline: { label: "离线", dot: "bg-gray-400", bg: "bg-gray-100 text-gray-600" },
  fault: { label: "故障", dot: "bg-red-500", bg: "bg-red-50 text-red-700" },
}

interface StatusBadgeProps {
  status: DeviceStatus
  size?: "sm" | "md"
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        config.bg
      )}
    >
      <span className={cn("rounded-full", size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2", config.dot)} />
      {config.label}
    </span>
  )
}
