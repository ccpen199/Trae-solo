import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DoorOpen, Wrench, AlertTriangle, CreditCard,
  HardDrive, Megaphone, Users2, BarChart3,
  Shield, Building2, User, ChevronRight, Eye, FileEdit, Send,
} from 'lucide-react'
import StatCard from '@/components/StatCard'
import StatusBadge from '@/components/StatusBadge'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { Announcement, RepairOrder, DeviceAlert } from '@/types'

const quickEntries = [
  { icon: DoorOpen, label: '门禁开锁', path: '/access', color: 'bg-blue-50 text-blue-600' },
  { icon: Wrench, label: '报事报修', path: '/repairs/create', color: 'bg-amber-50 text-amber-600' },
  { icon: HardDrive, label: '设备管理', path: '/devices', color: 'bg-emerald-50 text-emerald-600' },
  { icon: BarChart3, label: '统计报表', path: '/reports', color: 'bg-purple-50 text-purple-600' },
]

const ROLE_PERMISSIONS: Record<string, { label: string; scope: string; can: string[]; cant: string[]; accent: string }> = {
  street_admin: {
    label: '街道管理员',
    scope: '全辖区范围 · 行政级监管视图',
    can: ['查看全社区数据汇总', '导出统计报表', '管理组织架构', '发起跨社区督查'],
    cant: ['直接操作物业工单', '发布单社区公告'],
    accent: 'from-indigo-500 to-violet-600',
  },
  community_admin: {
    label: '社区管理员',
    scope: '单社区管辖 · 社区级统筹视图',
    can: ['监督社区物业', '审核业委会提案', '查看社区财务', '社区公告审核'],
    cant: ['跨社区数据访问', '修改物业服务范围'],
    accent: 'from-sky-500 to-cyan-600',
  },
  property_admin: {
    label: '物业管理员',
    scope: '物业全业务 · 运维执行视图',
    can: ['设备纳管与OTA升级', '工单派单与审核', '编辑发布公告', '邻里圈内容审核', '查看物业费流水'],
    cant: ['修改组织架构', '调整权限矩阵'],
    accent: 'from-emerald-500 to-teal-600',
  },
  owner_committee: {
    label: '业委会成员',
    scope: '监督视角 · 财务与业主诉求',
    can: ['查看物业费收支流水', '查看业主工单汇总', '参与公告联合审核'],
    cant: ['编辑发布公告', '派单与设备运维'],
    accent: 'from-amber-500 to-orange-600',
  },
  owner: {
    label: '业主 / 住户',
    scope: '本户业务 · 业主服务视图',
    can: ['四模门禁开锁', '提交报事报修', '缴纳物业费', '发布邻里圈', '查看定向公告'],
    cant: ['查看其他业主工单', '发布公告', '访问设备后台'],
    accent: 'from-rose-500 to-pink-600',
  },
  maintenance: {
    label: '维修人员',
    scope: '工单执行 · 维修处理视图',
    can: ['接单与维修反馈', '查看派单信息', '上传处理凭证'],
    cant: ['管理设备', '发布公告', '访问缴费流水'],
    accent: 'from-violet-500 to-fuchsia-600',
  },
}

const DEFAULT_PERM = {
  label: '平台用户',
  scope: '标准用户视图',
  can: [],
  cant: [],
  accent: 'from-slate-500 to-slate-600',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [stats, setStats] = useState({
    accessCount: 0,
    pendingRepairs: 0,
    activeAlerts: 0,
    paymentRate: 0,
  })
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  const rolePerm = useMemo(() => {
    const code = user?.role?.name || ''
    return ROLE_PERMISSIONS[code] || DEFAULT_PERM
  }, [user?.role])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accessRes, repairsRes, alertsStats, paymentRes, announcementsRes] = await Promise.all([
          api.access.records({ pageSize: 1 }),
          api.repairs.list({ status: 'pending', pageSize: 1 }),
          api.alerts.stats(),
          api.reports.payment(),
          api.announcements.list({ pageSize: 5 }),
        ])
        setStats({
          accessCount: accessRes.total || 0,
          pendingRepairs: repairsRes.total || 0,
          activeAlerts: alertsStats.active || 0,
          paymentRate: paymentRes.collectionRate || 0,
        })
        setAnnouncements(announcementsRes.list || [])
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div className={`relative overflow-hidden rounded-2xl p-6 text-white bg-gradient-to-br ${rolePerm.accent} shadow-xl`}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white blur-3xl" />
          <div className="absolute right-40 bottom-0 w-60 h-60 rounded-full bg-white/50 blur-3xl" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold border border-white/30">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider opacity-80 mb-1">欢迎进入治理工作台</div>
              <div className="text-2xl font-bold">{user?.name || '用户'}</div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm opacity-90">
                <span className="inline-flex items-center gap-1"><Shield size={14} />{rolePerm.label}</span>
                <span className="opacity-60">·</span>
                <span className="inline-flex items-center gap-1"><Building2 size={14} />{user?.organization?.name || '未分配组织'}</span>
                <span className="opacity-60">·</span>
                <span className="inline-flex items-center gap-1"><User size={14} />{user?.phone || ''}</span>
              </div>
            </div>
          </div>
          <div className="sm:ml-auto flex items-center gap-3">
            <button onClick={() => navigate('/permissions')} className="px-4 h-10 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur border border-white/30 text-sm font-medium transition-colors inline-flex items-center gap-2">
              <Eye size={16} />权限边界
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="rounded-xl bg-white/10 backdrop-blur border border-white/20 p-4">
            <div className="text-xs uppercase tracking-wider opacity-80 mb-2">数据范围</div>
            <div className="text-sm font-medium">{rolePerm.scope}</div>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur border border-white/20 p-4">
            <div className="text-xs uppercase tracking-wider opacity-80 mb-2 flex items-center gap-1.5"><FileEdit size={12} />可执行操作</div>
            <div className="flex flex-wrap gap-1.5">
              {rolePerm.can.slice(0, 4).map((p, i) => (
                <span key={i} className="text-[11px] px-2 py-1 rounded-md bg-white/20">{p}</span>
              ))}
              {rolePerm.can.length === 0 && <span className="text-[11px] opacity-70">暂无（公共用户）</span>}
            </div>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur border border-white/20 p-4">
            <div className="text-xs uppercase tracking-wider opacity-80 mb-2 flex items-center gap-1.5"><Shield size={12} />权限边界（不允许）</div>
            <div className="flex flex-wrap gap-1.5">
              {rolePerm.cant.length === 0 ? (
                <span className="text-[11px] opacity-70">完全授权</span>
              ) : rolePerm.cant.slice(0, 3).map((p, i) => (
                <span key={i} className="text-[11px] px-2 py-1 rounded-md bg-black/20">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DoorOpen}
          label="累计通行人次"
          value={loading ? '...' : stats.accessCount.toLocaleString()}
          trend={{ value: 12.4, direction: 'up' }}
          color="blue"
        />
        <StatCard
          icon={Wrench}
          label="待处理工单"
          value={loading ? '...' : String(stats.pendingRepairs)}
          trend={{ value: stats.pendingRepairs > 10 ? 18 : 6, direction: stats.pendingRepairs > 10 ? 'up' : 'down' }}
          color="amber"
        />
        <StatCard
          icon={AlertTriangle}
          label="设备告警"
          value={loading ? '...' : String(stats.activeAlerts)}
          trend={{ value: stats.activeAlerts > 3 ? 21 : 4, direction: stats.activeAlerts > 3 ? 'up' : 'down' }}
          color="red"
        />
        <StatCard
          icon={CreditCard}
          label="物业费收缴率"
          value={loading ? '...' : `${stats.paymentRate}%`}
          trend={{ value: stats.paymentRate >= 80 ? 5 : 9, direction: stats.paymentRate >= 80 ? 'up' : 'down' }}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickEntries.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-lg hover:border-emerald-200 hover:-translate-y-0.5 transition-all flex flex-col items-center gap-3 group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
              <item.icon size={24} />
            </div>
            <span className="text-sm font-medium text-slate-700">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Megaphone size={18} className="text-emerald-500" />
              <h3 className="font-semibold text-slate-800">最新公告</h3>
            </div>
            <button onClick={() => navigate('/announcements')} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1">
              查看全部<ChevronRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {announcements.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">暂无公告</div>
            ) : (
              announcements.map((a) => (
                <div key={a.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusBadge status={a.priority} />
                    <span className="text-sm text-slate-700 truncate">{a.title}</span>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0 ml-4">
                    {a.created_at?.slice(0, 10) || ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Send size={18} className="text-emerald-500" />
              <h3 className="font-semibold text-slate-800">治理功能入口</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-100">
            <button onClick={() => navigate('/announcements/create')} className="p-5 flex items-center gap-3 hover:bg-emerald-50 transition-colors text-left">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Megaphone size={20} className="text-emerald-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">发布公告</div>
                <div className="text-[11px] text-slate-400">按楼栋/单元定向推送</div>
              </div>
            </button>
            <button onClick={() => navigate('/community')} className="p-5 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users2 size={20} className="text-blue-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">邻里圈</div>
                <div className="text-[11px] text-slate-400">实名发布与审核</div>
              </div>
            </button>
            <button onClick={() => navigate('/payments')} className="p-5 flex items-center gap-3 hover:bg-amber-50 transition-colors text-left">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <CreditCard size={20} className="text-amber-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">物业缴费</div>
                <div className="text-[11px] text-slate-400">在线缴纳与电子票据</div>
              </div>
            </button>
            <button onClick={() => navigate('/community/review')} className="p-5 flex items-center gap-3 hover:bg-rose-50 transition-colors text-left">
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                <Shield size={20} className="text-rose-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">内容审核</div>
                <div className="text-[11px] text-slate-400">邻里圈实名审核台</div>
              </div>
            </button>
            <button onClick={() => navigate('/alerts')} className="p-5 flex items-center gap-3 hover:bg-red-50 transition-colors text-left">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">设备告警</div>
                <div className="text-[11px] text-slate-400">分级响应与处理记录</div>
              </div>
            </button>
            <button onClick={() => navigate('/reports')} className="p-5 flex items-center gap-3 hover:bg-violet-50 transition-colors text-left">
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                <BarChart3 size={20} className="text-violet-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">统计报表</div>
                <div className="text-[11px] text-slate-400">响应时效与完成率</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
