import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"

interface KPICardProps {
  icon: ReactNode
  title: string
  value: string | number
  trend?: number
  unit?: string
  children?: ReactNode
}

export default function KPICard({ icon, title, value, trend, unit, children }: KPICardProps) {
  const isPositive = trend !== undefined && trend >= 0

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(10,46,60,0.15)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="flex flex-col gap-3 rounded-xl bg-[#0A2E3C] p-5 text-white"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-300">{title}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF6B35]/20 text-[#FF6B35]">
          {icon}
        </span>
      </div>

      <div className="flex items-end gap-2">
        <span className="font-display text-2xl font-bold">{value}</span>
        {unit && <span className="mb-0.5 text-sm text-gray-400">{unit}</span>}
      </div>

      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          <span>{isPositive ? "+" : ""}{trend}%</span>
        </div>
      )}
      {children && <div className="mt-1">{children}</div>}
    </motion.div>
  )
}
