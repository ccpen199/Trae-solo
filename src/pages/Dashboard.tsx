import {
  Briefcase,
  Users,
  Handshake,
  Clock,
  Factory,
  Cog,
  Zap,
  Cpu,
  TrendingUp,
  TrendingDown,
  MapPin,
  ArrowRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePositionStore } from '../store/PositionStore'

const metrics = [
  {
    label: '活跃职位',
    value: '156',
    change: '↑12%',
    trend: 'up' as const,
    icon: Briefcase,
    color: 'from-blue-600 to-blue-700',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
  },
  {
    label: '人才库总量',
    value: '12,847',
    change: '↑8.5%',
    trend: 'up' as const,
    icon: Users,
    color: 'from-violet-600 to-violet-700',
    bg: 'bg-violet-50',
    text: 'text-violet-600',
  },
  {
    label: '本月匹配',
    value: '423',
    change: '↑15.3%',
    trend: 'up' as const,
    icon: Handshake,
    color: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
  },
  {
    label: '平均到岗天数',
    value: '38',
    change: '↓5天',
    trend: 'down' as const,
    icon: Clock,
    color: 'from-emerald-600 to-emerald-700',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
  },
]

const domains = [
  {
    name: '汽车制造',
    icon: Factory,
    positions: 52,
    talents: 3240,
    skills: ['CATIA', 'ANSYS', 'ADAMS'],
    gradient: 'from-blue-600 to-blue-800',
  },
  {
    name: '零部件',
    icon: Cog,
    positions: 38,
    talents: 2860,
    skills: ['FMEA', 'APQP', 'SPC'],
    gradient: 'from-slate-600 to-slate-800',
  },
  {
    name: '新能源',
    icon: Zap,
    positions: 41,
    talents: 4120,
    skills: ['BMS', '电机控制', '功能安全'],
    gradient: 'from-emerald-600 to-emerald-800',
  },
  {
    name: '智能驾驶',
    icon: Cpu,
    positions: 25,
    talents: 2627,
    skills: ['ASPICE', 'AUTOSAR', 'ROS2'],
    gradient: 'from-violet-600 to-violet-800',
  },
]

const cities = [
  { name: '上海', value: 96 },
  { name: '深圳', value: 91 },
  { name: '长春', value: 95 },
  { name: '合肥', value: 92 },
  { name: '北京', value: 90 },
  { name: '广州', value: 87 },
  { name: '武汉', value: 88 },
  { name: '重庆', value: 82 },
  { name: '常州', value: 78 },
  { name: '西安', value: 75 },
]

const recentMatches = [
  { position: '高级电驱系统工程师', candidate: '张伟明', score: 94, status: '面试中', statusColor: 'bg-amber-100 text-amber-700' },
  { position: 'ADAS算法工程师', candidate: '李思远', score: 91, status: 'Offer', statusColor: 'bg-blue-100 text-blue-700' },
  { position: '车身结构工程师', candidate: '王佳琪', score: 88, status: '已入职', statusColor: 'bg-emerald-100 text-emerald-700' },
  { position: 'BMS软件工程师', candidate: '陈晨', score: 86, status: '面试中', statusColor: 'bg-amber-100 text-amber-700' },
  { position: '功能安全经理', candidate: '刘思涵', score: 83, status: '待评估', statusColor: 'bg-slate-100 text-slate-600' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { positions } = usePositionStore()
  const activePositions = positions.filter((p) => p.status === 'active').length
  const dynamicMetrics = [
    {
      ...metrics[0],
      value: String(activePositions),
      change: `${positions.length} 总职位`,
    },
    ...metrics.slice(1),
  ]
  const maxCityValue = Math.max(...cities.map((c) => c.value))

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 p-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-amber-500/10" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-wide">车聘通 · 汽车行业人才匹配平台</h1>
          </div>
          <p className="text-blue-200/70 text-sm ml-[52px]">
            覆盖汽车全产业链的智能人才匹配引擎 · 实时追踪行业人才流动
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dynamicMetrics.map((m) => (
          <div
            key={m.label}
            className="group relative bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${m.bg} flex items-center justify-center`}>
                <m.icon className={`w-5 h-5 ${m.text}`} />
              </div>
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                  m.trend === 'up'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {m.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {m.change}
              </span>
            </div>
            <p className="text-slate-500 text-xs mb-1">{m.label}</p>
            <p className="text-2xl font-bold text-slate-900">{m.value}</p>
            <div
              className={`absolute bottom-0 left-0 h-1 rounded-b-xl bg-gradient-to-r ${m.color} w-0 group-hover:w-full transition-all duration-500`}
            />
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">行业领域聚焦</h2>
          <button onClick={() => navigate('/knowledge-graph')} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
            查看全部 <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {domains.map((d) => (
            <div
              key={d.name}
              className="group bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-300"
            >
              <div className={`bg-gradient-to-r ${d.gradient} p-4 flex items-center gap-3`}>
                <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-sm">
                  <d.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-semibold text-base">{d.name}</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">在招职位</span>
                  <span className="font-semibold text-slate-800">{d.positions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">人才储备</span>
                  <span className="font-semibold text-slate-800">{d.talents.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-2">热门技能</p>
                  <div className="flex flex-wrap gap-1.5">
                    {d.skills.map((s) => (
                      <span
                        key={s}
                        className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors duration-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <MapPin className="w-4 h-4 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-800">产业集群分布</h2>
          </div>
          <div className="space-y-3">
            {cities.map((c) => (
              <div key={c.name} className="flex items-center gap-3 group">
                <span className="text-sm text-slate-600 w-10 text-right font-medium group-hover:text-blue-600 transition-colors">
                  {c.name}
                </span>
                <div className="flex-1 h-7 bg-slate-50 rounded-md overflow-hidden relative">
                  <div
                    className="h-full rounded-md bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-700 ease-out flex items-center justify-end pr-2"
                    style={{ width: `${(c.value / maxCityValue) * 100}%` }}
                  >
                    <span className="text-xs font-semibold text-white">{c.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-800">最近匹配动态</h2>
            <button onClick={() => navigate('/matching')} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
              查看全部 <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-400 pb-3">职位</th>
                  <th className="text-left text-xs font-medium text-slate-400 pb-3">候选人</th>
                  <th className="text-center text-xs font-medium text-slate-400 pb-3">匹配度</th>
                  <th className="text-right text-xs font-medium text-slate-400 pb-3">状态</th>
                </tr>
              </thead>
              <tbody>
                {recentMatches.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3 text-sm text-slate-700 font-medium">{r.position}</td>
                    <td className="py-3 text-sm text-slate-600">{r.candidate}</td>
                    <td className="py-3 text-center">
                      <span
                        className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${
                          r.score >= 90
                            ? 'text-emerald-600 bg-emerald-50'
                            : r.score >= 85
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-amber-600 bg-amber-50'
                        }`}
                      >
                        {r.score}%
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${r.statusColor}`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
