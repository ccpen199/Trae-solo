import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Clock, Star, AlertTriangle, BarChart3, FileText, Download,
  Check, X, Filter, Search, Eye, Settings, Users, FileCheck, PieChart as PieChartIcon,
  BarChart2, RefreshCw, Activity, Layers, Shield,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
} from 'recharts'
import { mockEfficiencyMetrics } from '@/data/mockData'

const m = mockEfficiencyMetrics
const totalApps = m.reduce((s, x) => s + x.totalApplications, 0)
const avgDays = +(m.reduce((s, x) => s + x.avgProcessingDays, 0) / m.length).toFixed(1)
const avgComp = +(m.reduce((s, x) => s + x.completionRate, 0) / m.length).toFixed(1)
const avgSat = +(m.reduce((s, x) => s + x.satisfactionAvg, 0) / m.length).toFixed(1)
const allIntr = m.flatMap(x => x.abnormalInterruptions)
const overdue = allIntr.filter(x => x.type === '系统超时').length

const COLORS = ['#eab308', '#3b82f6', '#22c55e', '#f97316', '#ef4444']
const GOLD = '#eab308'
const TTS = { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }

const nav = [
  { id: 'overview', label: '效能总览', icon: Activity },
  { id: 'services', label: '事项管理', icon: Layers },
  { id: 'review', label: '审核复核', icon: FileCheck },
  { id: 'reports', label: '统计报表', icon: BarChart2 },
  { id: 'settings', label: '系统设置', icon: Settings },
]

const typeBadge: Record<string, string> = {
  '材料不全': 'bg-yellow-500/20 text-yellow-400', '系统超时': 'bg-blue-500/20 text-blue-400',
  '用户放弃': 'bg-gray-500/20 text-gray-400', '审核驳回': 'bg-red-500/20 text-red-400',
}
const statusBadge: Record<string, string> = {
  '待审核': 'bg-yellow-500/20 text-yellow-400', '已通过': 'bg-green-500/20 text-green-400',
  '已驳回': 'bg-red-500/20 text-red-400', '补正中': 'bg-blue-500/20 text-blue-400',
}

const reviewApps = [
  { id: 'a001', service: '公积金提取', applicant: '张明华', time: '2025-06-18 09:30', status: '待审核' },
  { id: 'a002', service: '户籍登记', applicant: '李国强', time: '2025-06-18 10:15', status: '待审核' },
  { id: 'a003', service: '社保卡申领', applicant: '王美玲', time: '2025-06-17 14:20', status: '已通过' },
  { id: 'a004', service: '居住证办理', applicant: '陈大伟', time: '2025-06-17 11:00', status: '补正中' },
  { id: 'a005', service: '公积金提取', applicant: '刘芳', time: '2025-06-16 16:45', status: '已驳回' },
]

const intrTypes = [
  { name: '材料不全', value: allIntr.filter(x => x.type === '材料不全').length },
  { name: '系统超时', value: allIntr.filter(x => x.type === '系统超时').length },
  { name: '用户放弃', value: allIntr.filter(x => x.type === '用户放弃').length },
  { name: '审核驳回', value: allIntr.filter(x => x.type === '审核驳回').length },
]

const cv = { hidden: { opacity: 0, y: 20 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08 } }) }
const pv = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } }

function StatCard({ label, value, icon: I, trend, up, accent, children }: any) {
  return (
    <motion.div custom={0} variants={cv} initial="hidden" animate="visible" className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
      <div className="flex items-start justify-between">
        <div><span className="text-gray-400 text-xs">{label}</span><p className={`text-2xl font-bold mt-1 ${accent || 'text-white'}`}>{value}</p></div>
        <div className={`p-2 rounded-lg ${accent ? 'bg-yellow-500/10' : 'bg-gray-700/50'}`}><I className={`w-5 h-5 ${accent || 'text-gray-400'}`} /></div>
      </div>
      {trend !== undefined && <div className="flex items-center gap-1 mt-2 text-xs">{up ? <TrendingUp className="w-3 h-3 text-green-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}<span className={up ? 'text-green-400' : 'text-red-400'}>{trend}</span><span className="text-gray-500">较昨日</span></div>}
      {children}
    </motion.div>
  )
}

function MiniPie({ value, color }: { value: number; color: string }) {
  return <ResponsiveContainer width={50} height={50}><PieChart><Pie data={[{ value }, { value: 100 - value }]} cx="50%" cy="50%" innerRadius={15} outerRadius={22} dataKey="value" strokeWidth={0}><Cell fill={color} /><Cell fill="#374151" /></Pie></PieChart></ResponsiveContainer>
}

function Card({ title, icon: I, color, children }: any) {
  return <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700/50"><h2 className="text-base font-semibold mb-4 flex items-center gap-2"><I className={`w-5 h-5 ${color || 'text-yellow-500'}`} /> {title}</h2>{children}</div>
}

export default function Monitor() {
  const [tab, setTab] = useState('overview')
  const [sel, setSel] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [rv, setRv] = useState<any>(null)
  const [tr, setTr] = useState('30')
  const [sk, setSk] = useState('totalApplications')
  const [sa, setSa] = useState(false)
  const [cmt, setCmt] = useState('')

  const sorted = useMemo(() => [...m].sort((a, b) => {
    const av: any = a[sk as keyof typeof a], bv: any = b[sk as keyof typeof b]
    return sa ? av - bv : bv - av
  }), [sk, sa])

  const dates = m[0].trendData.map(d => d.date)
  const trend = dates.map((date, i) => { const p: Record<string, any> = { date }; m.forEach(x => { p[x.serviceName] = x.trendData[i].applications }); return p })
  const barData = m.map(x => ({ name: x.serviceName, days: x.avgProcessingDays }))
  const catData = m.map(x => ({ name: x.serviceName, value: x.totalApplications }))
  const selected = m[sel]
  const medals = ['text-yellow-400', 'text-gray-300', 'text-amber-600']
  const sortLabels: Record<string, string> = { serviceName: '服务名称', totalApplications: '办件量', avgProcessingDays: '平均天数', satisfactionAvg: '满意度', completionRate: '完成率' }
  const trs = [['7', '近7天'], ['30', '近30天'], ['90', '近90天'], ['365', '本年度']]

  const hSort = (k: string) => { if (sk === k) setSa(!sa); else { setSk(k); setSa(false) } }
  const openRv = (item: any) => { setRv(item); setShowModal(true) }

  const ChartGrid = ({ stroke = '#374151', fs = 11 }: any) => <><CartesianGrid strokeDasharray="3 3" stroke={stroke} /><XAxis dataKey="date" stroke="#9ca3af" fontSize={fs} /><YAxis stroke="#9ca3af" fontSize={fs} /><Tooltip contentStyle={TTS} /></>

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      <aside className="w-56 bg-gray-950 border-r border-gray-800 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8 px-2"><Shield className="w-7 h-7 text-yellow-500" /><span className="text-lg font-bold">政务管理后台</span></div>
        <nav className="space-y-1">
          {nav.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${tab === item.id ? 'bg-yellow-500/10 text-yellow-400 border-l-2 border-yellow-500' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
              <item.icon className="w-5 h-5" /><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center"><Users className="w-5 h-5 text-gray-400" /></div>
            <div><p className="text-sm font-medium">管理员</p><p className="text-xs text-gray-500">admin@wuxi.gov</p></div>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <AnimatePresence mode="wait">
          {tab === 'overview' && (
            <motion.div key="o" variants={pv} initial="initial" animate="animate" exit="exit" className="space-y-6">
              <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold">服务效能监控面板</h1><p className="text-gray-400 text-sm mt-1">实时监控政务服务运行效能</p></div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700"><RefreshCw className="w-4 h-4" /> 刷新</button>
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500 text-gray-900 rounded-lg text-sm font-medium hover:bg-yellow-400"><Download className="w-4 h-4" /> 导出</button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="今日办件量" value="1,258" icon={TrendingUp} trend="+12.5%" up accent="text-yellow-400" />
                <StatCard label="办结率" value={`${avgComp}%`} icon={Check} accent="text-green-400"><div className="flex items-center justify-end -mt-8"><MiniPie value={avgComp} color="#22c55e" /></div></StatCard>
                <StatCard label="平均用时" value={`${avgDays}天`} icon={Clock} trend="-0.3天" up accent="text-blue-400" />
                <StatCard label="满意度" value={avgSat} icon={Star} accent="text-yellow-400"><div className="flex gap-0.5 mt-2">{[1,2,3,4,5].map(i => <Star key={i} className={`w-3 h-3 ${i <= Math.floor(avgSat) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />)}</div></StatCard>
                <StatCard label="超期预警" value={overdue} icon={AlertTriangle} accent={overdue > 0 ? 'text-red-400' : 'text-gray-400'} />
                <StatCard label="异常中断" value={allIntr.length} icon={X} trend="+2" up={false} accent="text-orange-400" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="办件量趋势" icon={BarChart3}>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={trend}><ChartGrid /><Legend />{m.map((x, i) => <Area key={x.serviceId} type="monotone" dataKey={x.serviceName} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.2} strokeWidth={2} />)}</AreaChart>
                  </ResponsiveContainer>
                </Card>
                <Card title="平均办理天数" icon={Clock} color="text-green-400">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={barData}><ChartGrid /><Bar dataKey="days" fill={GOLD} radius={[4, 4, 0, 0]} /></BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              <Card title="服务排名" icon={BarChart2}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left py-3 px-3">排名</th>
                      {['serviceName', 'totalApplications', 'avgProcessingDays', 'satisfactionAvg', 'completionRate'].map(k => (
                        <th key={k} className="text-left py-3 px-3 cursor-pointer hover:text-white" onClick={() => hSort(k)}>
                          <div className="flex items-center gap-1">{sortLabels[k]}{sk === k && (sa ? '↑' : '↓')}</div>
                        </th>
                      ))}
                      <th className="text-left py-3 px-3">操作</th>
                    </tr></thead>
                    <tbody>
                      {sorted.map((x, i) => (
                        <tr key={x.serviceId} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                          <td className="py-3 px-3">{i < 3 ? <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-700/50 font-bold ${medals[i]}`}>{i + 1}</span> : <span className="text-gray-500 px-2">{i + 1}</span>}</td>
                          <td className="py-3 px-3 font-medium">{x.serviceName}</td>
                          <td className="py-3 px-3 text-yellow-400">{x.totalApplications.toLocaleString()}</td>
                          <td className="py-3 px-3">{x.avgProcessingDays}天</td>
                          <td className="py-3 px-3">{x.satisfactionAvg}</td>
                          <td className="py-3 px-3">{x.completionRate}%</td>
                          <td className="py-3 px-3"><button className="text-yellow-400 hover:text-yellow-300 text-xs flex items-center gap-1"><Eye className="w-3 h-3" /> 查看详情</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="中断类型分布" icon={AlertTriangle} color="text-orange-400">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={intrTypes} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                        {intrTypes.map((_, i) => <Cell key={i} fill={['#eab308', '#3b82f6', '#6b7280', '#ef4444'][i]} />)}
                      </Pie>
                      <Tooltip contentStyle={TTS} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
                <div className="lg:col-span-2">
                  <Card title="异常中断列表" icon={X} color="text-red-400">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="text-gray-400 border-b border-gray-700">
                          <th className="text-left py-2 px-2">申请编号</th><th className="text-left py-2 px-2">中断类型</th><th className="text-left py-2 px-2">发生时间</th><th className="text-left py-2 px-2">描述</th><th className="text-left py-2 px-2">状态</th><th className="text-left py-2 px-2">操作</th>
                        </tr></thead>
                        <tbody>
                          {allIntr.slice(0, 5).map(item => (
                            <tr key={item.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                              <td className="py-2 px-2 font-mono">{item.applicationId}</td>
                              <td className="py-2 px-2"><span className={`px-2 py-0.5 rounded-full ${typeBadge[item.type]}`}>{item.type}</span></td>
                              <td className="py-2 px-2 text-gray-300">{item.occurredAt}</td>
                              <td className="py-2 px-2 text-gray-300">{item.description}</td>
                              <td className="py-2 px-2"><span className={`px-2 py-0.5 rounded-full ${item.resolution ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{item.resolution ? '已解决' : '未解决'}</span></td>
                              <td className="py-2 px-2"><button className="text-yellow-400 hover:text-yellow-300">处理</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'services' && (
            <motion.div key="s" variants={pv} initial="initial" animate="animate" exit="exit">
              <h1 className="text-2xl font-bold mb-6">事项管理</h1>
              <div className="bg-gray-800/60 rounded-xl p-8 border border-gray-700/50 text-center"><Layers className="w-16 h-16 text-gray-600 mx-auto mb-4" /><p className="text-gray-400">事项管理模块建设中...</p></div>
            </motion.div>
          )}

          {tab === 'review' && (
            <motion.div key="r" variants={pv} initial="initial" animate="animate" exit="exit" className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">审核复核</h1>
                <div className="flex items-center gap-2">
                  <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input placeholder="搜索申请..." className="bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm w-60 focus:outline-none focus:border-yellow-500" /></div>
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 border border-gray-700"><Filter className="w-4 h-4" /> 筛选</button>
                </div>
              </div>
              <div className="bg-gray-800/60 rounded-xl border border-gray-700/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/80"><tr className="text-gray-400">
                    <th className="text-left py-3 px-4">申请编号</th><th className="text-left py-3 px-4">服务事项</th><th className="text-left py-3 px-4">申请人</th><th className="text-left py-3 px-4">提交时间</th><th className="text-left py-3 px-4">状态</th><th className="text-left py-3 px-4">操作</th>
                  </tr></thead>
                  <tbody>
                    {reviewApps.map(item => (
                      <tr key={item.id} className="border-t border-gray-700/50 hover:bg-gray-700/30">
                        <td className="py-3 px-4 font-mono text-yellow-400">{item.id}</td>
                        <td className="py-3 px-4">{item.service}</td>
                        <td className="py-3 px-4">{item.applicant}</td>
                        <td className="py-3 px-4 text-gray-400">{item.time}</td>
                        <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge[item.status]}`}>{item.status}</span></td>
                        <td className="py-3 px-4"><button onClick={() => openRv(item)} className="text-yellow-400 hover:text-yellow-300 text-xs flex items-center gap-1"><Eye className="w-3 h-3" /> 审核</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {tab === 'reports' && (
            <motion.div key="rp" variants={pv} initial="initial" animate="animate" exit="exit" className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">统计报表</h1>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                    {trs.map(([d, l]) => <button key={d} onClick={() => setTr(d)} className={`px-3 py-1.5 text-xs rounded-md transition ${tr === d ? 'bg-yellow-500 text-gray-900 font-medium' : 'text-gray-400 hover:text-white'}`}>{l}</button>)}
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 border border-gray-700"><FileText className="w-4 h-4" /> 导出Excel</button>
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 border border-gray-700"><Download className="w-4 h-4" /> 导出PDF</button>
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500 text-gray-900 rounded-lg text-sm font-medium hover:bg-yellow-400"><FileText className="w-4 h-4" /> 生成报表</button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[['总办件量', totalApps.toLocaleString(), 'text-yellow-400', '↑ 8.2% 同比'],
                  ['办结率', `${avgComp}%`, 'text-green-400', '↑ 2.1% 环比'],
                  ['平均满意度', `${avgSat}分`, 'text-blue-400', '↑ 0.3分 提升'],
                  ['异常率', '1.2%', 'text-red-400', '↓ 0.5% 改善']].map(([label, val, color, t]) => (
                  <div key={label} className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
                    <p className="text-gray-400 text-xs">{label}</p>
                    <p className={`text-2xl font-bold ${color} mt-1`}>{val}</p>
                    <p className={`text-xs mt-1 ${t.startsWith('↑') ? 'text-green-400' : 'text-red-400'}`}>{t}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="办件量趋势" icon={BarChart3}>
                  <ResponsiveContainer width="100%" height={280}><LineChart data={trend}><ChartGrid /><Legend />{m.map((x, i) => <Line key={x.serviceId} type="monotone" dataKey={x.serviceName} stroke={COLORS[i]} strokeWidth={2} dot={false} />)}</LineChart></ResponsiveContainer>
                </Card>
                <Card title="服务类别分布" icon={PieChartIcon} color="text-green-400">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={catData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                        {catData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                      </Pie>
                      <Tooltip contentStyle={TTS} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
                <Card title="满意度分布" icon={Star}>
                  <ResponsiveContainer width="100%" height={280}><BarChart data={selected.satisfactionDistribution.map(d => ({ score: `${d.score}星`, count: d.count }))}><ChartGrid /><Bar dataKey="count" fill={GOLD} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
                </Card>
                <Card title="办理时效对比" icon={Clock} color="text-blue-400">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={barData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#9ca3af" fontSize={11} />
                      <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={11} width={80} />
                      <Tooltip contentStyle={TTS} />
                      <Bar dataKey="days" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </motion.div>
          )}

          {tab === 'settings' && (
            <motion.div key="st" variants={pv} initial="initial" animate="animate" exit="exit">
              <h1 className="text-2xl font-bold mb-6">系统设置</h1>
              <div className="bg-gray-800/60 rounded-xl p-8 border border-gray-700/50 text-center"><Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" /><p className="text-gray-400">系统设置模块建设中...</p></div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showModal && rv && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-gray-800 rounded-xl w-full max-w-lg border border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-700"><h3 className="text-lg font-semibold">申请审核</h3><button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button></div>
              <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-400 text-xs">申请编号</p><p className="font-mono text-yellow-400">{rv.id}</p></div>
                  <div><p className="text-gray-400 text-xs">服务事项</p><p>{rv.service}</p></div>
                  <div><p className="text-gray-400 text-xs">申请人</p><p>{rv.applicant}</p></div>
                  <div><p className="text-gray-400 text-xs">提交时间</p><p className="text-gray-300">{rv.time}</p></div>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-2">材料预览</p>
                  <div className="space-y-2">
                    {[['身份证.pdf', '已验证', 'text-green-400'], ['购房合同.pdf', '待核验', 'text-yellow-400'], ['收入证明.pdf', '已验证', 'text-green-400']].map(([name, s, c]) => (
                      <div key={name} className="flex items-center justify-between p-2.5 bg-gray-700/40 rounded-lg text-sm">
                        <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-blue-400" /> {name}</span>
                        <span className={`text-xs ${c}`}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400"><Check className="w-4 h-4" /> 电子证照库比对通过</div>
                <div>
                  <p className="text-gray-400 text-xs mb-2">审核意见</p>
                  <textarea value={cmt} onChange={e => setCmt(e.target.value)} placeholder="请输入审核意见..." className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-sm resize-none h-20 focus:outline-none focus:border-yellow-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t border-gray-700">
                <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 flex items-center gap-1.5"><X className="w-4 h-4" /> 驳回</button>
                <button className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 flex items-center gap-1.5"><Check className="w-4 h-4" /> 通过</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
