import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Fingerprint, ScanFace, Mic } from 'lucide-react'
import { identityAudits } from '@/mocks/data'
import type { IdentityAudit } from '@/types'

const methodConfig: Record<string, { icon: typeof ScanFace; label: string }> = {
  face: { icon: ScanFace, label: '人脸识别' },
  fingerprint: { icon: Fingerprint, label: '指纹识别' },
  voice: { icon: Mic, label: '声纹识别' },
}

const statusLabels: Record<string, string> = {
  passed: '通过',
  failed: '失败',
  suspicious: '可疑',
}

const statusBadge: Record<string, string> = {
  passed: 'gov-badge-green',
  failed: 'gov-badge-red',
  suspicious: 'gov-badge-gold',
}

function ScoreCell({ score }: { score: number }) {
  const color = score > 90 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-gov-red'
  return <span className={`font-mono font-bold ${color}`}>{score.toFixed(1)}</span>
}

export default function IdentityAuditPage() {
  const stats = useMemo(() => {
    const total = identityAudits.length
    const passed = identityAudits.filter((a) => a.status === 'passed').length
    const failed = identityAudits.filter((a) => a.status === 'failed').length
    const suspicious = identityAudits.filter((a) => a.status === 'suspicious').length
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0
    return { total, passed, failed, suspicious, passRate }
  }, [])

  const statCards = [
    { label: '今日审核总数', value: stats.total, color: 'text-gov-blue', bg: 'bg-gov-blue/10' },
    { label: '通过', value: stats.passed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '失败', value: stats.failed, color: 'text-gov-red', bg: 'bg-gov-red/10' },
    { label: '可疑', value: stats.suspicious, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="gov-section-title">实名认证审核</h1>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="gov-card p-4 text-center"
          >
            <p className="text-sm text-gov-text-secondary">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="gov-card p-5 flex items-center gap-6">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center bg-gov-blue/10`}>
          <span className="text-3xl font-bold text-gov-blue">{stats.passRate}%</span>
        </div>
        <div>
          <p className="font-semibold text-gov-text">实名认证通过率</p>
          <p className="text-sm text-gov-text-secondary mt-1">
            今日共审核 {stats.total} 人，通过 {stats.passed} 人
          </p>
        </div>
      </div>

      <div className="gov-card overflow-hidden">
        <table className="gov-table">
          <thead>
            <tr>
              <th>用户姓名</th>
              <th>身份证号</th>
              <th>认证方式</th>
              <th>认证时间</th>
              <th>匹配分值</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {identityAudits.map((audit: IdentityAudit, i: number) => {
              const method = methodConfig[audit.authMethod]
              const Icon = method.icon
              const isSuspicious = audit.status === 'suspicious'

              return (
                <motion.tr
                  key={audit.auditId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={isSuspicious ? 'border-l-4 border-l-gov-red' : ''}
                >
                  <td className="font-medium">{audit.userName}</td>
                  <td className="font-mono text-gov-text-secondary">{audit.idNumber}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-4 h-4 text-gov-blue" />
                      <span>{method.label}</span>
                    </div>
                  </td>
                  <td className="text-gov-text-secondary">{audit.authTime}</td>
                  <td><ScoreCell score={audit.matchScore} /></td>
                  <td><span className={statusBadge[audit.status]}>{statusLabels[audit.status]}</span></td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
