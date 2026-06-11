import { useNavigate } from 'react-router-dom'
import { Package, Monitor, Wrench, Coins, DollarSign, Clock, Eye } from 'lucide-react'
import type { Task } from '@/stores/task'

const categoryConfig = {
  physical: { icon: Package, label: '实物交付', bg: 'bg-blue-500/20', color: 'text-blue-400' },
  online: { icon: Monitor, label: '线上代办', bg: 'bg-purple-500/20', color: 'text-purple-400' },
  skill: { icon: Wrench, label: '技能支援', bg: 'bg-amber-primary/20', color: 'text-amber-primary' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: '待接单', color: 'bg-emerald-primary/20 text-emerald-primary' },
  in_progress: { label: '进行中', color: 'bg-blue-500/20 text-blue-400' },
  verifying: { label: '验证中', color: 'bg-purple-500/20 text-purple-400' },
  completed: { label: '已完成', color: 'bg-green-500/20 text-green-400' },
  disputed: { label: '争议中', color: 'bg-amber-primary/20 text-amber-primary' },
  cancelled: { label: '已取消', color: 'bg-cyber-dim/20 text-cyber-dim' },
}

export default function TaskCard({ task }: { task: Task }) {
  const navigate = useNavigate()
  const cat = categoryConfig[task.category]
  const status = statusConfig[task.status] || statusConfig.open
  const CatIcon = cat.icon
  const BountyIcon = task.bounty_type === 'coins' ? Coins : DollarSign

  const deadlineDate = new Date(task.deadline)
  const isOverdue = deadlineDate.getTime() < Date.now()
  const deadlineStr = deadlineDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })

  return (
    <div className="card-dark flex gap-3" onClick={() => navigate(`/task/${task.id}`)}>
      <div className={`shrink-0 w-11 h-11 rounded-lg ${cat.bg} flex items-center justify-center`}>
        <CatIcon className={`w-5 h-5 ${cat.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-cyber-text font-medium truncate">{task.title}</h3>
          <span className={`badge shrink-0 ${status.color}`}>{status.label}</span>
        </div>

        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {task.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="badge bg-emerald-primary/15 text-emerald-primary">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-1.5">
            <BountyIcon className={`w-3.5 h-3.5 ${task.bounty_type === 'coins' ? 'text-amber-primary' : 'text-green-400'}`} />
            <span className={`text-sm font-semibold ${task.bounty_type === 'coins' ? 'text-amber-primary' : 'text-green-400'}`}>
              {task.bounty_amount}{task.bounty_type === 'coins' ? ' 助利币' : ' 元'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-cyber-dim text-xs">
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-danger' : ''}`}>
              <Clock className="w-3 h-3" />
              {deadlineStr}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {task.view_count}
            </span>
            {task.exposure_weight > 1 && (
              <span className="text-amber-primary text-[10px] animate-glow-pulse">🔥</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-cyber-dim">
          <span>{task.publisher_nickname}</span>
          {task.publisher_credit_level && (
            <span className="badge bg-navy-600 text-cyber-muted text-[10px]">
              {task.publisher_credit_level}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
