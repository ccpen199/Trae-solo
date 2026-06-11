import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock,
  FileText,
  CheckCircle2,
  Timer,
  Gavel,
  FolderKanban,
  Award,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import ConsultationCard from '@/components/ConsultationCard'
import { useConsultationStore } from '@/store/useConsultationStore'
import { useMonitoringStore } from '@/store/useMonitoringStore'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/utils/format'
import type { Lawyer, LawyerDailyStat } from '@/types'

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  unit?: string
  trend?: number
  color: string
  bgColor: string
}

function StatCard({ icon: Icon, label, value, unit, trend, color, bgColor }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900">{value}</span>
            {unit && <span className="text-sm text-slate-500">{unit}</span>}
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className={cn('h-3 w-3', trend >= 0 ? 'text-emerald-500' : 'text-red-500')} />
              <span className={cn('text-xs', trend >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                {trend >= 0 ? '+' : ''}{trend}% 较昨日
              </span>
            </div>
          )}
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', bgColor)}>
          <Icon className={cn('h-6 w-6', color)} />
        </div>
      </div>
    </motion.div>
  )
}

interface QuickActionProps {
  icon: React.ElementType
  label: string
  description: string
  to: string
  color: string
  bgColor: string
}

function QuickAction({ icon: Icon, label, description, to, color, bgColor }: QuickActionProps) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -2 }}
      onClick={() => navigate(to)}
      className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
    >
      <div className="flex items-start gap-4">
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl shrink-0', bgColor)}>
          <Icon className={cn('h-6 w-6', color)} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
              {label}
            </h3>
            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function LawyerDesk() {
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const { consultations, fetchConsultations } = useConsultationStore()
  const { stats, historyStats, fetchStats } = useMonitoringStore()

  const lawyer = currentUser as Lawyer
  const isLawyer = currentUser?.role === 'lawyer'

  useEffect(() => {
    if (isLawyer) {
      fetchConsultations(undefined, lawyer.id)
      fetchStats()
    }
  }, [isLawyer, lawyer?.id, fetchConsultations, fetchStats])

  const pendingToday = consultations.filter(
    (c) =>
      c.lawyerId === lawyer?.id &&
      c.status === 'dispatched' &&
      new Date(c.dispatchedAt || 0).toDateString() === new Date().toDateString()
  ).length

  const inProgressCount = consultations.filter(
    (c) => c.lawyerId === lawyer?.id && c.status === 'in_progress'
  ).length

  const now = Date.now()
  const monthStart = new Date(now).setDate(1)
  const completedThisMonth = consultations.filter(
    (c) =>
      c.lawyerId === lawyer?.id &&
      c.status === 'completed' &&
      (c.completedAt || 0) >= monthStart
  ).length

  const avgResponseTime = stats?.avgResponseTime || 0

  const recentConsultations = [...consultations]
    .filter((c) => c.lawyerId === lawyer?.id)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5)

  const chartData: LawyerDailyStat[] = historyStats
    .filter((s) => s.lawyerId === lawyer?.id)
    .slice(-7)
    .map((s) => ({
      ...s,
      date: s.date.slice(5),
    }))

  const hasZeroResponseWarning = lawyer && lawyer.responseRate < 60

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">律师工作台</h1>
            <p className="text-slate-500 mt-1">
              欢迎回来，{lawyer?.realName}律师 · {lawyer?.lawFirm}
            </p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p>今日日期</p>
            <p className="font-medium text-slate-700">{formatDateTime(Date.now()).slice(0, 10)}</p>
          </div>
        </div>

        {hasZeroResponseWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
          >
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-medium text-amber-800">响应率警告</p>
              <p className="text-sm text-amber-700">
                您的响应率较低（{lawyer.responseRate}%），请及时回复用户咨询，低于50%将影响您的抢单权限。
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Clock}
            label="今日待处理"
            value={pendingToday}
            unit="件"
            trend={5}
            color="text-amber-600"
            bgColor="bg-amber-50"
          />
          <StatCard
            icon={FileText}
            label="进行中"
            value={inProgressCount}
            unit="件"
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={CheckCircle2}
            label="本月已结案"
            value={completedThisMonth}
            unit="件"
            trend={12}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
          />
          <StatCard
            icon={Timer}
            label="平均响应时长"
            value={avgResponseTime}
            unit="分钟"
            trend={-8}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction
            icon={Gavel}
            label="抢单大厅"
            description="查看可抢案件，快速响应"
            to="/lawyer/grab"
            color="text-orange-600"
            bgColor="bg-orange-50"
          />
          <QuickAction
            icon={FolderKanban}
            label="我的案件"
            description="管理所有咨询案件"
            to="/lawyer/cases"
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <QuickAction
            icon={Award}
            label="资质中心"
            description="查看资质信息和信用评级"
            to="/lawyer/qualification"
            color="text-emerald-600"
            bgColor="bg-emerald-50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">最近咨询</h2>
              <button
                onClick={() => navigate('/lawyer/cases')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                查看全部
              </button>
            </div>
            <div className="space-y-3">
              {recentConsultations.length > 0 ? (
                recentConsultations.map((consultation) => (
                  <ConsultationCard
                    key={consultation.id}
                    consultation={consultation}
                    onClick={() => navigate(`/consultation/${consultation.id}`)}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>暂无咨询记录</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">活跃度趋势</h2>
              <span className="text-xs text-slate-500">最近7天</span>
            </div>
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      labelStyle={{ fontWeight: 600, color: '#1e293b' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="acceptedCount"
                      name="接单数"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completedCount"
                      name="完成数"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  暂无数据
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs text-slate-600">接单数</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-600">完成数</span>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
