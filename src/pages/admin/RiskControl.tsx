import { useState } from 'react'
import {
  Users,
  DollarSign,
  ShieldAlert,
  Ban,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Zap,
  AlertTriangle,
  Search,
  OctagonX,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import AlertList from '@/components/risk/AlertList'
import RuleManager from '@/components/risk/RuleManager'
import ProcessModal from '@/components/risk/ProcessModal'
import { mockAlerts, mockRules, type RiskAlert } from '@/components/risk/data'

const monitorStats = [
  {
    label: '今日应发放人数',
    value: '28,560',
    unit: '人',
    change: '+2.1%',
    changePositive: true,
    icon: Users,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    accent: 'border-primary/20',
  },
  {
    label: '今日应发放金额',
    value: '8,756',
    unit: '万元',
    change: '+1.8%',
    changePositive: true,
    icon: DollarSign,
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    accent: 'border-success/20',
  },
  {
    label: '已拦截异常',
    value: '12',
    unit: '笔 / ¥36,800',
    change: 'danger',
    changePositive: false,
    icon: ShieldAlert,
    iconBg: 'bg-danger/10',
    iconColor: 'text-danger',
    accent: 'border-danger/30',
    highlight: true,
  },
  {
    label: '自动停发',
    value: '3',
    unit: '笔 / 死亡停发',
    change: 'warning',
    changePositive: false,
    icon: Ban,
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
    accent: 'border-warning/30',
    highlight: true,
  },
]

const regions = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安', '重庆']
const riskLevels = ['低风险', '中风险', '高风险', '严重']

const heatmapData: number[][] = [
  [2, 5, 1, 3, 4, 2, 6, 1, 3, 2],
  [4, 7, 5, 6, 8, 5, 9, 4, 6, 5],
  [3, 4, 6, 2, 5, 7, 3, 8, 4, 6],
  [1, 2, 1, 3, 2, 1, 2, 3, 1, 2],
]

function getHeatmapColor(value: number, row: number): string {
  const colors = [
    ['#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A'],
    ['#FFF8E1', '#FFECB3', '#FFE082', '#FFD54F', '#FFCA28'],
    ['#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D', '#FF9800'],
    ['#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#F44336'],
  ]
  const idx = Math.min(Math.floor(value / 2), 4)
  return colors[row][idx]
}

const interceptCases = [
  {
    name: '张某',
    desc: '在AB两省同时领取养老金',
    amount: '3200元/月',
    status: '已拦截',
  },
  {
    name: '李某',
    desc: '同时领取失业金和养老金',
    amount: '1800元/月',
    status: '已拦截',
  },
  {
    name: '王某',
    desc: '两地同时参保',
    amount: '-',
    status: '提示合并账户',
  },
]

const flowSteps = [
  { label: '发放校验', icon: CheckCircle2, color: '#00B42A', bg: '#E8FFEA' },
  { label: '跨省比对', icon: Zap, color: '#165DFF', bg: '#E8F0FF' },
  { label: '疑似重复', icon: AlertTriangle, color: '#FF7D00', bg: '#FFF3E0' },
  { label: '人工审核', icon: Search, color: '#722ED1', bg: '#F3E8FF' },
  { label: '确认拦截', icon: OctagonX, color: '#F53F3F', bg: '#FFECE8' },
]

const deathRecords = [
  { name: '陈某某', id: '320***********1234', deathDate: '2024-06-15', type: '企业职工', amount: 3280, triggerTime: '2024-06-18 08:12', status: 'stopped' },
  { name: '刘某某', id: '330***********5678', deathDate: '2024-06-14', type: '灵活就业', amount: 2650, triggerTime: '2024-06-18 07:58', status: 'stopped' },
  { name: '赵某某', id: '310***********9012', deathDate: '2024-06-16', type: '城乡居民', amount: 380, triggerTime: '2024-06-18 09:05', status: 'pending' },
  { name: '孙某某', id: '340***********3456', deathDate: '2024-06-10', type: '企业职工', amount: 4520, triggerTime: '2024-06-18 08:30', status: 'stopped' },
  { name: '周某某', id: '350***********7890', deathDate: '2024-06-12', type: '机关事业', amount: 5680, triggerTime: '2024-06-18 08:45', status: 'recover' },
]

const pieData = [
  { name: '已停发', value: 65, color: '#00B42A' },
  { name: '待确认', value: 25, color: '#FF7D00' },
  { name: '追缴中', value: 10, color: '#F53F3F' },
]

function getStatusStyle(status: string) {
  switch (status) {
    case 'stopped':
      return { label: '已停发', cls: 'bg-success/10 text-success' }
    case 'pending':
      return { label: '待家属确认', cls: 'bg-warning/10 text-warning' }
    case 'recover':
      return { label: '需追缴', cls: 'bg-danger/10 text-danger' }
    default:
      return { label: '处理中', cls: 'bg-gray-100 text-gray-500' }
  }
}

export default function RiskControl() {
  const [alerts, setAlerts] = useState<RiskAlert[]>(mockAlerts)
  const [rules, setRules] = useState(mockRules)
  const [processingAlert, setProcessingAlert] = useState<RiskAlert | null>(null)
  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  const handleProcess = (alert: RiskAlert) => {
    setProcessingAlert(alert)
  }

  const handleIgnore = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'ignored' as const } : a))
    )
  }

  const handleConfirmProcess = (id: string, result: string, note: string) => {
    void result
    void note
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'processed' as const } : a))
    )
    setProcessingAlert(null)
  }

  const handleToggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    )
  }

  return (
    <div className="-m-6 min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-[#0E42D2] via-[#165DFF] to-[#4080FF] rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar size={22} />
                今日待遇发放监控
              </h2>
              <p className="text-sm mt-1 opacity-90">{today}</p>
            </div>
            <div className="flex items-center gap-2 text-sm bg-white/15 px-4 py-2 rounded-lg backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              实时运行中 · 数据每 30 秒更新
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {monitorStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className={`bg-white/15 backdrop-blur-sm rounded-xl p-5 border ${stat.accent} transition-all hover:bg-white/20`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                      <Icon size={20} className={stat.iconColor} />
                    </div>
                    {stat.change && !stat.highlight && (
                      <span className="flex items-center gap-0.5 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                        <TrendingUp size={12} />
                        {stat.change}
                      </span>
                    )}
                    {stat.highlight && (
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
                        {stat.change === 'danger' ? '异常告警' : '待处理'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold">{stat.value}</span>
                    <span className="text-xs opacity-80">{stat.unit}</span>
                  </div>
                  <p className="text-sm mt-1.5 opacity-85">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">风险热力图</h3>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#C8E6C9' }} />
                  <span>低</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#FFD54F' }} />
                  <span>中</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#FF9800' }} />
                  <span>高</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#F44336' }} />
                  <span>严重</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="w-16 pb-2 text-right pr-3 font-medium text-gray-500"></th>
                    {regions.map((r) => (
                      <th key={r} className="pb-2 text-center font-medium text-gray-500 px-1">
                        {r}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {riskLevels.map((level, rowIdx) => (
                    <tr key={level}>
                      <td className="py-1 pr-3 text-right font-medium text-gray-600">{level}</td>
                      {regions.map((_, colIdx) => {
                        const val = heatmapData[rowIdx][colIdx]
                        return (
                          <td key={colIdx} className="p-1">
                            <div
                              className="aspect-square rounded-md flex items-center justify-center font-medium transition-transform hover:scale-110 cursor-default"
                              style={{
                                backgroundColor: getHeatmapColor(val, rowIdx),
                                color: rowIdx >= 2 ? '#fff' : '#1D2129',
                              }}
                              title={`${regions[colIdx]} · ${level}：${val} 条预警`}
                            >
                              {val}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold" style={{ color: '#F53F3F' }}>5</div>
                <div className="text-xs text-gray-500 mt-1">严重预警地区</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold" style={{ color: '#FF7D00' }}>18</div>
                <div className="text-xs text-gray-500 mt-1">高风险预警</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold" style={{ color: '#165DFF' }}>132</div>
                <div className="text-xs text-gray-500 mt-1">预警总数</div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900">重复领取拦截流程</h3>
              <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#E8F0FF', color: '#165DFF' }}>
                本月拦截 47 笔
              </span>
            </div>

            <div className="mb-6">
              <div className="flex items-start justify-between relative">
                <div className="absolute top-6 left-1/12 right-1/12 h-0.5 bg-gradient-to-r from-success via-primary to-danger" />
                {flowSteps.map((step, idx) => {
                  const Icon = step.icon
                  return (
                    <div key={step.label} className="flex flex-col items-center relative z-10 w-1/5">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm border-2 border-white"
                        style={{ backgroundColor: step.bg }}
                      >
                        <Icon size={22} style={{ color: step.color }} />
                      </div>
                      <span className="mt-2 text-xs font-medium" style={{ color: step.color }}>
                        {step.label}
                      </span>
                      {idx < flowSteps.length - 1 && (
                        <span className="hidden sm:block absolute -right-1 top-5 text-gray-300 text-xs" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-500 mb-1">典型拦截案例</p>
              {interceptCases.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
                    style={{
                      backgroundColor: idx < 2 ? '#F53F3F' : '#FF7D00',
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                      <span className="text-xs text-gray-400 truncate">{item.desc}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">{item.amount}</span>
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: idx < 2 ? '#F53F3F10' : '#FF7D0010',
                          color: idx < 2 ? '#F53F3F' : '#FF7D00',
                        }}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h3 className="text-base font-semibold text-gray-900">死亡停发自动触发</h3>
              <p className="text-xs text-gray-500 mt-1">对接民政数据，自动触发待遇停发流程</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-gray-500">已停发 65%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-gray-500">待确认 25%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-danger" />
                <span className="text-gray-500">追缴中 10%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-3 pr-4 font-medium">姓名</th>
                    <th className="pb-3 pr-4 font-medium">身份证号</th>
                    <th className="pb-3 pr-4 font-medium">死亡日期</th>
                    <th className="pb-3 pr-4 font-medium">待遇类型</th>
                    <th className="pb-3 pr-4 font-medium">月发放金额</th>
                    <th className="pb-3 pr-4 font-medium">触发时间</th>
                    <th className="pb-3 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {deathRecords.map((r, idx) => {
                    const st = getStatusStyle(r.status)
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 pr-4 font-medium text-gray-900">{r.name}</td>
                        <td className="py-3 pr-4 text-gray-600 font-mono">{r.id}</td>
                        <td className="py-3 pr-4 text-gray-600">{r.deathDate}</td>
                        <td className="py-3 pr-4 text-gray-600">{r.type}</td>
                        <td className="py-3 pr-4 font-semibold" style={{ color: '#165DFF' }}>
                          ¥{r.amount.toLocaleString()}
                        </td>
                        <td className="py-3 pr-4 text-gray-500 text-xs">{r.triggerTime}</td>
                        <td className="py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="lg:col-span-4 flex items-center justify-center">
              <div className="w-full max-w-xs">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                  {pieData.map((p) => (
                    <div key={p.name} className="flex flex-col items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-xs text-gray-500">{p.name}</span>
                      <span className="text-sm font-bold" style={{ color: p.color }}>
                        {p.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-8">
            <AlertList alerts={alerts} onProcess={handleProcess} onIgnore={handleIgnore} />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <RuleManager rules={rules} onToggle={handleToggleRule} />
          </div>
        </div>
      </div>

      {processingAlert && (
        <ProcessModal
          alert={processingAlert}
          onClose={() => setProcessingAlert(null)}
          onConfirm={handleConfirmProcess}
        />
      )}
    </div>
  )
}
