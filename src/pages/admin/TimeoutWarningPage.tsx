import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { timeoutWarnings } from '@/mocks/data'
import type { TimeoutWarning } from '@/types'

const levelLabels: Record<string, string> = {
  red: '红色预警',
  orange: '橙色预警',
  yellow: '黄色预警',
}

const levelDots: Record<string, string> = {
  red: 'bg-gov-red',
  orange: 'bg-orange-500',
  yellow: 'bg-amber-400',
}

const levelTextColors: Record<string, string> = {
  red: 'text-gov-red',
  orange: 'text-orange-500',
  yellow: 'text-amber-600',
}

const statusLabels: Record<string, string> = {
  active: '待督办',
  supervised: '已督办',
  resolved: '已解决',
}

const statusBadge: Record<string, string> = {
  active: 'gov-badge-red',
  supervised: 'gov-badge-gold',
  resolved: 'gov-badge-green',
}

function RemainingCell({ days }: { days: number }) {
  const color = days < 0 ? 'text-gov-red' : days < 3 ? 'text-orange-500' : 'text-amber-600'
  return (
    <span className={`font-bold ${color}`}>
      {days < 0 ? `${days}天` : `${days}天`}
    </span>
  )
}

export default function TimeoutWarningPage() {
  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { red: 0, orange: 0, yellow: 0 }
    timeoutWarnings.forEach((w) => { counts[w.level]++ })
    return counts
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="gov-section-title">超时预警督办</h1>

      <div className="gov-card p-4 flex items-center gap-6">
        <span className="text-sm text-gov-text-secondary font-medium">预警统计：</span>
        {(['red', 'orange', 'yellow'] as const).map((level) => (
          <div key={level} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${levelDots[level]}`} />
            <span className="text-sm text-gov-text">
              {levelLabels[level]}
              <span className={`font-bold ml-1 ${levelTextColors[level]}`}>{levelCounts[level]}</span>
              件
            </span>
          </div>
        ))}
        <div className="ml-auto text-sm text-gov-text-secondary">
          共 <span className="font-bold text-gov-text">{timeoutWarnings.length}</span> 件
        </div>
      </div>

      <div className="gov-card overflow-hidden">
        <table className="gov-table">
          <thead>
            <tr>
              <th>业务类型</th>
              <th>申请人</th>
              <th>提交日期</th>
              <th>截止日期</th>
              <th>剩余天数</th>
              <th>经办人</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {timeoutWarnings.map((w: TimeoutWarning, i: number) => (
              <motion.tr
                key={w.warningId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <td className="font-medium">{w.businessType}</td>
                <td>{w.applicantName}</td>
                <td className="text-gov-text-secondary">{w.submittedAt}</td>
                <td className="text-gov-text-secondary">{w.deadline}</td>
                <td><RemainingCell days={w.remainingDays} /></td>
                <td>{w.handler}</td>
                <td><span className={statusBadge[w.status]}>{statusLabels[w.status]}</span></td>
                <td>
                  {w.status === 'active' && (
                    <button className="gov-btn-danger !px-3 !py-1 !text-xs !rounded">
                      督办
                    </button>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
