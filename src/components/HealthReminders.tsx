import { Syringe, Stethoscope, Bug, Check, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Reminder {
  id: number
  reminder_type: 'vaccine' | 'deworming' | 'flea_tick' | 'checkup'
  title: string
  reminder_date: string
  is_read: boolean
}

const typeConfig = {
  vaccine: {
    icon: Syringe,
    label: '疫苗',
    bgClass: 'bg-primary/10',
    iconClass: 'text-primary',
    borderClass: 'border-primary/20',
  },
  deworming: {
    icon: Bug,
    label: '驱虫',
    bgClass: 'bg-blue-50',
    iconClass: 'text-blue-600',
    borderClass: 'border-blue-200',
  },
  flea_tick: {
    icon: Bug,
    label: '体外驱虫',
    bgClass: 'bg-emerald-50',
    iconClass: 'text-emerald-600',
    borderClass: 'border-emerald-200',
  },
  checkup: {
    icon: Stethoscope,
    label: '体检',
    bgClass: 'bg-secondary/10',
    iconClass: 'text-secondary',
    borderClass: 'border-secondary/20',
  },
}

interface HealthRemindersProps {
  reminders: Reminder[]
  onComplete: (id: number) => void
}

function calculateDaysRemaining(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  const diff = target.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function HealthReminders({ reminders, onComplete }: HealthRemindersProps) {
  const unreadCount = reminders.filter((r) => !r.is_read).length

  if (reminders.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>暂无健康提醒</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span>还有 {unreadCount} 条未读提醒</span>
        </div>
      )}

      {reminders.map((reminder, index) => {
        const config = typeConfig[reminder.reminder_type] || typeConfig.vaccine
        const Icon = config.icon
        const daysRemaining = calculateDaysRemaining(reminder.reminder_date)
        const isOverdue = daysRemaining < 0
        const isUrgent = daysRemaining >= 0 && daysRemaining <= 7

        return (
          <div
            key={reminder.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl border transition-all opacity-0 animate-slideUp',
              config.borderClass,
              config.bgClass,
              !reminder.is_read && 'ring-2 ring-primary/20',
              `stagger-${Math.min(index + 1, 6)}`
            )}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={cn('p-2 rounded-lg', config.bgClass)}>
              <Icon className={cn('w-5 h-5', config.iconClass)} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-text-primary truncate">
                  {reminder.title}
                </h4>
                {!reminder.is_read && (
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                )}
              </div>

              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-text-secondary">
                  {reminder.reminder_date}
                </p>
                <p className={cn(
                  'text-sm font-medium',
                  isOverdue ? 'text-danger' : isUrgent ? 'text-primary' : 'text-text-secondary'
                )}>
                  {isOverdue
                    ? `已过期 ${Math.abs(daysRemaining)} 天`
                    : daysRemaining === 0
                    ? '今天到期'
                    : `还剩 ${daysRemaining} 天`}
                </p>
              </div>
            </div>

            <button
              onClick={() => onComplete(reminder.id)}
              className="p-2 hover:bg-white/80 rounded-lg transition-colors text-text-secondary hover:text-success"
              title="标记已完成"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
