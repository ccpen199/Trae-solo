import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import {
  AlertTriangle,
  BookOpen,
  Fingerprint,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { timeoutWarnings, policyDocuments, identityAudits } from '@/mocks/data'
import { cn } from '@/lib/utils'

const pieData = [
  { name: '通过', value: identityAudits.filter((a) => a.status === 'passed').length, color: '#10B981' },
  { name: '失败', value: identityAudits.filter((a) => a.status === 'failed').length, color: '#C41E3A' },
  { name: '可疑', value: identityAudits.filter((a) => a.status === 'suspicious').length, color: '#D4A843' },
]

const summaryCards = [
  {
    title: '超时预警',
    icon: AlertTriangle,
    count: timeoutWarnings.filter((w) => w.status === 'active').length,
    accent: 'border-l-gov-red',
    iconBg: 'bg-gov-red/10',
    iconColor: 'text-gov-red',
    link: '/admin/timeout-warning',
  },
  {
    title: '政策文件',
    icon: BookOpen,
    count: policyDocuments.length,
    accent: 'border-l-gov-blue',
    iconBg: 'bg-gov-blue/10',
    iconColor: 'text-gov-blue',
    link: '/admin/policy-tags',
  },
  {
    title: '实名认证',
    icon: Fingerprint,
    count: identityAudits.length,
    accent: 'border-l-emerald-500',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    link: '/admin/identity-audit',
  },
]

const levelDotColor: Record<string, string> = {
  red: 'bg-gov-red',
  orange: 'bg-orange-500',
  yellow: 'bg-amber-400',
}

export default function AdminPage() {
  const navigate = useNavigate()
  const [supervisedIds, setSupervisedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>()
    timeoutWarnings.forEach((w) => {
      if (w.status === 'supervised') ids.add(w.warningId)
    })
    return ids
  })

  const top5Warnings = useMemo(() => timeoutWarnings.slice(0, 5), [])

  const passRate = useMemo(() => {
    const passed = identityAudits.filter((a) => a.status === 'passed').length
    return identityAudits.length > 0 ? Math.round((passed / identityAudits.length) * 100) : 0
  }, [])

  const suspiciousCount = useMemo(
    () => identityAudits.filter((a) => a.status === 'suspicious').length,
    []
  )

  const recentAudits = useMemo(() => identityAudits.slice(0, 3), [])

  const handleSupervise = (warningId: string) => {
    setSupervisedIds((prev) => {
      const next = new Set(prev)
      next.add(warningId)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="gov-section-title">后台管理中心</h1>

      <div className="grid grid-cols-3 gap-6">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link to={card.link}>
              <div className={`gov-card p-5 border-l-4 ${card.accent} hover:shadow-gov-md cursor-pointer`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gov-text-secondary">{card.title}</p>
                    <p className="text-3xl font-bold text-gov-text mt-1">{card.count}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                    <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 gov-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gov-text">超时预警督办</h2>
            <span className="text-sm text-gov-text-secondary">
              共 {timeoutWarnings.length} 条预警
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gov-border/50 text-gov-text-secondary">
                  <th className="text-left py-2.5 px-3 font-medium">业务类型</th>
                  <th className="text-left py-2.5 px-3 font-medium">申请人</th>
                  <th className="text-center py-2.5 px-3 font-medium">剩余天数</th>
                  <th className="text-left py-2.5 px-3 font-medium">经办人</th>
                  <th className="text-center py-2.5 px-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {top5Warnings.map((w) => {
                  const isSupervised = supervisedIds.has(w.warningId)
                  return (
                    <tr
                      key={w.warningId}
                      className="border-b border-gov-border/30 hover:bg-gov-bg-light/60 transition-colors"
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full shrink-0',
                              levelDotColor[w.level]
                            )}
                          />
                          <span className="font-medium text-gov-text">{w.businessType}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-gov-text">{w.applicantName}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={cn(
                            'font-semibold',
                            w.remainingDays < 0
                              ? 'text-gov-red'
                              : w.remainingDays < 3
                                ? 'text-orange-500'
                                : 'text-amber-500'
                          )}
                        >
                          {w.remainingDays < 0
                            ? `超时 ${Math.abs(w.remainingDays)}天`
                            : `${w.remainingDays}天`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gov-text-secondary">{w.handler}</td>
                      <td className="py-2.5 px-3 text-center">
                        {isSupervised ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            已督办
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSupervise(w.warningId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-gov-red/10 text-gov-red hover:bg-gov-red/20 transition-colors"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            督办
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gov-border/30">
            <span className="text-sm text-gov-text-secondary">
              活跃预警 {timeoutWarnings.filter((w) => !supervisedIds.has(w.warningId)).length} 条
              · 已督办 {supervisedIds.size} 条
            </span>
            <button
              onClick={() => navigate('/admin/timeout-warning')}
              className="text-sm text-gov-blue hover:underline"
            >
              进入预警督办中心 →
            </button>
          </div>
        </div>

        <div className="col-span-2 space-y-6">
          <div className="gov-card p-5">
            <h2 className="font-semibold text-gov-text mb-4">实名认证通过率</h2>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      strokeWidth={0}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gov-blue">{passRate}%</p>
                <div className="space-y-1 text-xs text-gov-text-secondary">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}：{d.value}人
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="gov-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gov-text">审计报表摘要</h2>
              <button
                onClick={() => navigate('/admin/identity-audit')}
                className="text-sm text-gov-blue hover:underline"
              >
                查看详情 →
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-gov-bg-light text-center">
                <p className="text-xs text-gov-text-secondary mb-1">今日认证请求</p>
                <p className="text-xl font-bold text-gov-text">{identityAudits.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-gov-bg-light text-center">
                <p className="text-xs text-gov-text-secondary mb-1">通过率</p>
                <p className="text-xl font-bold text-emerald-600">{passRate}%</p>
              </div>
              <div className="p-3 rounded-lg bg-gov-bg-light text-center">
                <p className="text-xs text-gov-text-secondary mb-1">异常记录</p>
                <p className={cn('text-xl font-bold', suspiciousCount > 0 ? 'text-gov-red' : 'text-gov-text')}>
                  {suspiciousCount}
                </p>
              </div>
            </div>
            <div className="space-y-0">
              <p className="text-xs font-medium text-gov-text-secondary mb-2">最近审计事件</p>
              {recentAudits.map((a, i) => {
                const statusConfig = {
                  passed: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  failed: { icon: XCircle, color: 'text-gov-red', bg: 'bg-gov-red/10' },
                  suspicious: { icon: AlertCircle, color: 'text-gov-red', bg: 'bg-gov-red/10' },
                }[a.status]
                const StatusIcon = statusConfig.icon
                return (
                  <div
                    key={a.auditId}
                    className="flex items-center gap-3 py-2.5 border-b border-gov-border/20 last:border-b-0"
                  >
                    <div className="relative">
                      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center', statusConfig.bg)}>
                        <StatusIcon className={cn('w-3.5 h-3.5', statusConfig.color)} />
                      </div>
                      {i < recentAudits.length - 1 && (
                        <div className="absolute top-7 left-1/2 -translate-x-1/2 w-px h-2 bg-gov-border/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gov-text truncate">
                        <span className="font-medium">{a.userName}</span>
                        <span className="text-gov-text-secondary"> · {a.authMethod === 'face' ? '人脸识别' : '指纹认证'}</span>
                      </p>
                      <p className="text-xs text-gov-text-muted">{a.authTime}</p>
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        a.status === 'passed'
                          ? 'text-emerald-600'
                          : a.status === 'failed'
                            ? 'text-gov-red'
                            : 'text-gov-red font-bold'
                      )}
                    >
                      {a.status === 'passed' ? '通过' : a.status === 'failed' ? '失败' : '可疑'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
