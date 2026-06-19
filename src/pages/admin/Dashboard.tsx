import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, BarChart3, ClipboardCheck, Map as MapIcon, Key, Eye, FileText, Users, CheckCircle, XCircle } from 'lucide-react'
import { api } from '@/utils/api'

interface DashboardCard {
  label: string
  icon: React.ElementType
  to: string
  color: string
  count: number
  desc: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    pendingAudit: 0,
    highRisk: 0,
    verifiedMerchants: 0,
    totalViews: 0,
    auditPassed: 0,
    auditRejected: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.stats.audit().catch(() => ({ total: 0, approved: 0, rejected: 0, pending: 0 })),
      api.risk.stats().catch(() => ({ distribution: [], highRiskCount: 0 })),
      api.merchants.list().catch(() => ([])),
      api.posts.list({ limit: 1 }).catch(() => ({ total: 0 })),
      api.stats.traffic().catch(() => ({ viewsTrend: [] })),
    ]).then(([audit, risk, merchants, posts, traffic]) => {
      const viewsTrend: { value: number }[] = traffic.viewsTrend || []
      setStats({
        totalPosts: posts.total || 0,
        pendingAudit: audit.pending || 0,
        highRisk: risk.highRiskCount || 0,
        verifiedMerchants: merchants.filter((m: { licenseVerified: boolean }) => m.licenseVerified).length,
        totalViews: viewsTrend.reduce((s: number, p: { value: number }) => s + p.value, 0),
        auditPassed: audit.approved || 0,
        auditRejected: audit.rejected || 0,
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const cards: DashboardCard[] = [
    {
      label: '内容风控引擎',
      icon: ShieldAlert,
      to: '/admin/risk',
      color: 'text-red-500',
      count: stats.highRisk,
      desc: '高风险待处理',
    },
    {
      label: '流量分发看板',
      icon: BarChart3,
      to: '/admin/traffic',
      color: 'text-blue-500',
      count: stats.totalViews,
      desc: '近30日浏览量',
    },
    {
      label: '分级审核管理',
      icon: ClipboardCheck,
      to: '/admin/audit',
      color: 'text-amber-500',
      count: stats.pendingAudit,
      desc: '待审核内容',
    },
    {
      label: '地理围栏管理',
      icon: MapIcon,
      to: '/admin/geo',
      color: 'text-emerald-500',
      count: stats.totalPosts,
      desc: '平台信息总量',
    },
    {
      label: 'API开放管理',
      icon: Key,
      to: '/admin/api',
      color: 'text-purple-500',
      count: stats.verifiedMerchants,
      desc: '已认证商家',
    },
  ]

  const quickLinks = [
    { label: '新增敏感词', to: '/admin/risk', icon: FileText },
    { label: '处理审核任务', to: '/admin/audit', icon: ClipboardCheck },
    { label: '查看流量趋势', to: '/admin/traffic', icon: Eye },
    { label: '管理API密钥', to: '/admin/api', icon: Key },
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-800 mb-1">管理后台首页</h1>
        <p className="text-sm text-slate-500">平台治理总览 · 数据驱动决策</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card p-4 h-28 animate-pulse" />
            ))
          : cards.map((card) => {
              const Icon = card.icon
              return (
                <Link
                  key={card.to}
                  to={card.to}
                  className="card p-4 cursor-pointer hover:-translate-y-1 transition-transform"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-5 h-5 ${card.color}`} />
                    <span className="text-xs text-slate-400">{card.count.toLocaleString()}</span>
                  </div>
                  <div className="text-base font-semibold text-slate-800">{card.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{card.desc}</div>
                </Link>
              )
            })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-5 md:col-span-2">
          <h2 className="font-semibold text-navy-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            审核概况
          </h2>
          {loading ? (
            <div className="h-32 bg-slate-100 animate-pulse rounded-lg" />
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-slate-700">{stats.pendingAudit}</div>
                <div className="text-xs text-slate-500 mt-1">待审核</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-emerald-600 flex items-center justify-center gap-1">
                  <CheckCircle className="w-6 h-6" />
                  {stats.auditPassed}
                </div>
                <div className="text-xs text-emerald-600 mt-1">已通过</div>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red-600 flex items-center justify-center gap-1">
                  <XCircle className="w-6 h-6" />
                  {stats.auditRejected}
                </div>
                <div className="text-xs text-red-600 mt-1">已驳回</div>
              </div>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-navy-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            快捷入口
          </h2>
          <div className="space-y-2">
            {quickLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Icon className="w-4 h-4 text-navy-600" />
                  <span className="text-sm text-slate-700">{link.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-navy-800 mb-4">业务菜单导航</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.to}
                to={card.to}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-navy-50 hover:shadow-md transition-all"
              >
                <Icon className={`w-8 h-8 ${card.color}`} />
                <span className="text-sm font-medium text-slate-700">{card.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
