import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import { AlertTriangle, BookOpen, Fingerprint } from 'lucide-react'
import { timeoutWarnings, policyDocuments, identityAudits } from '@/mocks/data'

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

const levelColors: Record<string, string> = {
  red: 'bg-gov-red',
  orange: 'bg-orange-500',
  yellow: 'bg-amber-400',
}

export default function AdminPage() {
  const latestWarnings = useMemo(() => timeoutWarnings.slice(0, 3), [])
  const passRate = useMemo(() => {
    const passed = identityAudits.filter((a) => a.status === 'passed').length
    return identityAudits.length > 0 ? Math.round((passed / identityAudits.length) * 100) : 0
  }, [])

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
          <h2 className="font-semibold text-gov-text mb-4">最新超时预警</h2>
          <div className="space-y-3">
            {latestWarnings.map((w, i) => (
              <motion.div
                key={w.warningId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-gov-bg-light"
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${levelColors[w.level]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gov-text truncate">
                    {w.businessType} - {w.applicantName}
                  </p>
                  <p className="text-xs text-gov-text-secondary">
                    截止 {w.deadline} · 剩余
                    <span className={`font-semibold ${w.remainingDays < 0 ? 'text-gov-red' : w.remainingDays < 3 ? 'text-orange-500' : 'text-amber-500'}`}>
                      {w.remainingDays}天
                    </span>
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  w.status === 'active' ? 'bg-gov-red/10 text-gov-red' :
                  w.status === 'supervised' ? 'bg-gov-gold/10 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {w.status === 'active' ? '待督办' : w.status === 'supervised' ? '已督办' : '已解决'}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="col-span-2 gov-card p-5">
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
      </div>
    </div>
  )
}
