import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Users, Building2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, DifficultyLevel } from '@/types'
import { formatPrice, getTimeRemaining, getCommissionMultiplier } from '@/utils'
import DifficultyBadge from './DifficultyBadge'

const DIFFICULTY_BANDS: { level: DifficultyLevel; activeClass: string; bgClass: string }[] = [
  { level: 'L1', activeClass: 'bg-emerald-500', bgClass: 'bg-emerald-100' },
  { level: 'L2', activeClass: 'bg-sky-500', bgClass: 'bg-sky-100' },
  { level: 'L3', activeClass: 'bg-amber-500', bgClass: 'bg-amber-100' },
  { level: 'L4', activeClass: 'bg-orange-500', bgClass: 'bg-orange-100' },
  { level: 'L5', activeClass: 'bg-rose-500', bgClass: 'bg-rose-100' },
]

const ACCEPTANCE_PERIOD_TEXT: Record<string, string> = {
  '24h': '24小时',
  '72h': '72小时',
  '7d': '7天',
}

interface TaskCardProps {
  task: Task
  className?: string
}

export default function TaskCard({ task, className }: TaskCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const remainingSlots = task.totalSlots - task.takenSlots
  const displayStandards = task.deliveryStandards.slice(0, 2)
  const multiplier = getCommissionMultiplier(23)
  const commissionLabel = multiplier >= 1.15 ? '10单后+15%' : multiplier >= 1.08 ? '5单后+8%' : null

  return (
    <Link to={`/tasks/${task.id}`}>
      <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 24px -6px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.2 }}
      className={cn(
        'overflow-hidden rounded-xl border border-zinc-100 bg-white transition-colors',
        className,
      )}
    >
      <div className="flex h-1.5 w-full">
        {DIFFICULTY_BANDS.map((band) => (
          <div
            key={band.level}
            className={cn(
              'h-full flex-1 transition-all',
              band.level === task.difficulty
                ? cn(band.activeClass, 'shadow-md shadow-black/10')
                : band.bgClass,
            )}
            style={{
              borderRight: band.level !== 'L5' ? '2px solid white' : undefined,
            }}
          />
        ))}
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-serif text-base font-semibold text-zinc-900">
            {task.title}
          </h3>
          <DifficultyBadge level={task.difficulty} />
        </div>

        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary-400">
            {formatPrice(task.currentPrice)}
          </span>
          {commissionLabel && (
            <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              {commissionLabel}
            </span>
          )}
        </div>

        <div className="mb-3 space-y-1">
          {displayStandards.map((standard, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-xs text-zinc-500">
              <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" />
              <span className="line-clamp-2">{standard}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 border-t border-zinc-100 pt-3 text-sm text-zinc-500">
          <div className="flex items-center gap-1.5">
            <div
              className="relative"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="shrink-0" />
                <span>验收期：{ACCEPTANCE_PERIOD_TEXT[task.acceptancePeriod]}</span>
              </div>
              {showTooltip && (
                <div className="absolute bottom-full left-0 z-10 mb-2 whitespace-nowrap rounded-md bg-zinc-800 px-2 py-1 text-[11px] text-white shadow-lg">
                  超时自动验收
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={14} className="shrink-0" />
            <span className={cn(remainingSlots <= 2 && 'text-danger-400 font-medium')}>
              余 {remainingSlots} / {task.totalSlots} 名额
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building2 size={14} className="shrink-0" />
            <span>{task.employerName}</span>
          </div>
        </div>

        <div className="mt-3 border-t border-zinc-100 pt-3 text-xs text-zinc-400">
          {getTimeRemaining(task.deadline)}
        </div>
      </div>
      </motion.div>
    </Link>
  )
}
