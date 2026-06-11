import { useState, useEffect } from 'react'
import { LayoutDashboard, CircleDot, Activity, AlertTriangle, DollarSign, BatteryCharging, Zap, RefreshCw, Plus, ClipboardCheck } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface DashboardData {
  kpi: { onlineRate: number; utilization: number; todayRevenue: number }
  stats: { totalPiles: number; charging: number; faultPiles: number; todayOrders: number }
  alerts: { id: string; station: string; type: string; time: string; status: string; desc?: string; piles?: number; action?: string }[]
  stationOrders: { name: string; orders: number }[]
}

const mockData: DashboardData = {
  kpi: { onlineRate: 97.3, utilization: 62.8, todayRevenue: 847320 },
  stats: { totalPiles: 12847, charging: 8072, faultPiles: 342, todayOrders: 15823 },
  alerts: [
    { id: 'CP-BJ-00312', station: '国网北京朝阳站', type: '通信故障', time: '10:23', status: '处理中', desc: '3号桩与平台通信中断超过15分钟', piles: 2, action: '派技术人员现场排查通信模块' },
    { id: 'CP-SH-01478', station: '特来电上海浦东站', type: '过温告警', time: '09:47', status: '未处理', desc: '5号桩充电模块温度达82°C', piles: 1, action: '暂停该桩充电并安排散热系统检查' },
    { id: 'CP-GZ-00891', station: '星星充电广州天河站', type: '接地故障', time: '09:15', status: '已处理', desc: '7号桩接地电阻异常', piles: 1, action: '已安排电气工程师现场维修' },
    { id: 'CP-SZ-00654', station: '云快充深圳南山站', type: '功率异常', time: '08:52', status: '未处理', desc: '2号桩输出功率仅为额定40%', piles: 1, action: '检查功率模块及电缆连接' },
    { id: 'CP-CD-00237', station: 'e充电成都高新站', type: '通信故障', time: '08:30', status: '处理中', desc: '整站6个桩通信不稳定', piles: 6, action: '检查站端通信网关及网络链路' },
  ],
  stationOrders: [
    { name: '国网北京朝阳站', orders: 856 }, { name: '特来电上海浦东站', orders: 743 },
    { name: '星星充电广州天河站', orders: 698 }, { name: '云快充深圳南山站', orders: 621 },
    { name: 'e充电成都高新站', orders: 587 }, { name: '国网杭州西湖站', orders: 534 },
    { name: '特来电南京鼓楼站', orders: 498 }, { name: '星星充电武汉光谷站', orders: 462 },
    { name: '云快充长沙岳麓站', orders: 431 }, { name: 'e充电重庆渝北站', orders: 398 },
  ],
}

const cities = [
  { name: '北京', x: 62, y: 22, volume: 1200, util: 0.78, revenue: 185600, orders: 2340, faults: 12 },
  { name: '上海', x: 76, y: 46, volume: 1100, util: 0.85, revenue: 210300, orders: 2780, faults: 8 },
  { name: '广州', x: 62, y: 72, volume: 900, util: 0.72, revenue: 142500, orders: 1890, faults: 15 },
  { name: '深圳', x: 64, y: 74, volume: 850, util: 0.82, revenue: 168200, orders: 2150, faults: 6 },
  { name: '成都', x: 36, y: 50, volume: 700, util: 0.65, revenue: 98700, orders: 1320, faults: 9 },
  { name: '杭州', x: 74, y: 48, volume: 650, util: 0.70, revenue: 112400, orders: 1480, faults: 5 },
  { name: '武汉', x: 60, y: 50, volume: 600, util: 0.68, revenue: 89600, orders: 1200, faults: 11 },
  { name: '南京', x: 70, y: 42, volume: 550, util: 0.63, revenue: 78300, orders: 1050, faults: 7 },
  { name: '重庆', x: 38, y: 52, volume: 580, util: 0.60, revenue: 72100, orders: 980, faults: 13 },
  { name: '西安', x: 46, y: 36, volume: 500, util: 0.55, revenue: 63500, orders: 860, faults: 4 },
  { name: '长沙', x: 58, y: 56, volume: 480, util: 0.58, revenue: 58200, orders: 790, faults: 6 },
  { name: '郑州', x: 56, y: 34, volume: 460, util: 0.52, revenue: 52800, orders: 720, faults: 8 },
  { name: '天津', x: 64, y: 24, volume: 440, util: 0.50, revenue: 48500, orders: 660, faults: 3 },
  { name: '苏州', x: 74, y: 46, volume: 420, util: 0.62, revenue: 56100, orders: 750, faults: 2 },
  { name: '哈尔滨', x: 72, y: 8, volume: 300, util: 0.42, revenue: 32400, orders: 440, faults: 5 },
  { name: '昆明', x: 34, y: 66, volume: 280, util: 0.38, revenue: 28700, orders: 390, faults: 4 },
  { name: '乌鲁木齐', x: 14, y: 18, volume: 180, util: 0.30, revenue: 15200, orders: 210, faults: 7 },
  { name: '拉萨', x: 20, y: 48, volume: 100, util: 0.25, revenue: 8900, orders: 120, faults: 2 },
]

const statusColor: Record<string, string> = {
  '处理中': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  '未处理': 'bg-red-500/20 text-red-400 border border-red-500/30',
  '已处理': 'bg-electric-green/20 text-electric-green border border-electric-green/30',
}

const drillDownData: Record<string, { label: string; items: { name: string; value: string }[] }> = {
  '在线率': { label: '运营商在线率', items: [{ name: '国网', value: '97.8%' }, { name: '特来电', value: '96.5%' }, { name: '星星充电', value: '98.1%' }] },
  '利用率': { label: '时段利用率', items: [{ name: '高峰期', value: '78%' }, { name: '低谷期', value: '45%' }] },
  '今日营收': { label: '运营商营收', items: [{ name: '国网', value: '¥352,400' }, { name: '特来电', value: '¥268,920' }, { name: '星星充电', value: '¥226,000' }] },
}

function dotColor(util: number) { return util >= 0.75 ? '#FF8C00' : util >= 0.55 ? '#4FC3F7' : '#2563EB' }
function dotSize(volume: number) { return Math.max(6, Math.min(16, volume / 80)) }

interface Inspection {
  id: string; station: string; type: string; scheduled: string; status: string; assignee: string
}

const INSPECTION_TYPES = ['日常巡检', '专项巡检', '故障复查']
const INSPECTION_STATUS: Record<string, string> = {
  '待执行': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  '执行中': 'bg-ice-blue/20 text-ice-blue border border-ice-blue/30',
  '已完成': 'bg-electric-green/20 text-electric-green border border-electric-green/30',
}

const CHECK_ITEMS = ['通信正常', '功率正常', '温度正常', '外观完好']

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>(mockData)
  const [drillDown, setDrillDown] = useState<string | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [cityPopup, setCityPopup] = useState<string | null>(null)
  const [inspections, setInspections] = useState<Inspection[]>([
    { id: 'INS-001', station: '国网北京朝阳站', type: '日常巡检', scheduled: '2026-06-10 09:00', status: '待执行', assignee: '张工' },
    { id: 'INS-002', station: '特来电上海浦东站', type: '故障复查', scheduled: '2026-06-10 14:00', status: '执行中', assignee: '李工' },
    { id: 'INS-003', station: '星星充电广州天河站', type: '专项巡检', scheduled: '2026-06-09 10:00', status: '已完成', assignee: '王工' },
  ])
  const [showInspectionModal, setShowInspectionModal] = useState(false)
  const [newInspection, setNewInspection] = useState({ station: '', type: '日常巡检', assignee: '', scheduled: '' })
  const [completeModal, setCompleteModal] = useState<string | null>(null)
  const [checks, setChecks] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/admin/dashboard').then(r => r.json()).then(payload => {
      if (payload?.kpi && payload?.stats && Array.isArray(payload?.alerts) && Array.isArray(payload?.stationOrders)) setData(payload)
      else setData(mockData)
    }).catch(() => setData(mockData))
  }, [])

  const handleRefresh = () => { setRefreshing(true); setTimeout(() => { setRefreshing(false) }, 1500) }
  const alertDetail = data.alerts.find(a => a.id === selectedAlert)

  const kpis = [
    { label: '在线率', value: `${data.kpi.onlineRate}%`, icon: Activity, color: 'text-electric-green' },
    { label: '利用率', value: `${data.kpi.utilization}%`, icon: CircleDot, color: 'text-ice-blue' },
    { label: '今日营收', value: `¥${data.kpi.todayRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-amber-orange' },
  ]
  const stats = [
    { label: '总桩数', value: data.stats.totalPiles.toLocaleString(), icon: BatteryCharging },
    { label: '充电中', value: data.stats.charging.toLocaleString(), icon: Zap },
    { label: '故障桩', value: data.stats.faultPiles.toLocaleString(), icon: AlertTriangle },
    { label: '今日订单', value: data.stats.todayOrders.toLocaleString(), icon: CircleDot },
  ]

  const createInspection = (station?: string) => {
    if (station) { setNewInspection({ station, type: '日常巡检', assignee: '', scheduled: '' }) }
    else { setNewInspection({ station: '', type: '日常巡检', assignee: '', scheduled: '' }) }
    setShowInspectionModal(true)
  }

  const addInspection = () => {
    if (!newInspection.station || !newInspection.assignee || !newInspection.scheduled) return
    const id = `INS-${String(inspections.length + 1).padStart(3, '0')}`
    setInspections(prev => [...prev, { id, station: newInspection.station, type: newInspection.type, scheduled: newInspection.scheduled, status: '待执行', assignee: newInspection.assignee }])
    setShowInspectionModal(false)
  }

  const cityStationMap: Record<string, string> = { '北京': '国网北京朝阳站', '上海': '特来电上海浦东站', '广州': '星星充电广州天河站', '深圳': '云快充深圳南山站', '成都': 'e充电成都高新站', '杭州': '国网杭州西湖站' }

  return (
    <div className="space-y-5 animate-slide-up">
      <h2 className="section-title flex items-center gap-2">
        <LayoutDashboard className="w-5 h-5 text-amber-orange" />运营看板
        <button onClick={handleRefresh} className="ml-auto btn-secondary text-xs flex items-center gap-1">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />刷新
        </button>
      </h2>

      <div className="grid grid-cols-3 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="stat-card glow-green flex items-center gap-4 p-5 cursor-pointer hover:ring-1 hover:ring-electric-green/30 transition-all" onClick={() => setDrillDown(drillDown === k.label ? null : k.label)}>
            <k.icon className={`w-8 h-8 ${k.color}`} />
            <div className="flex-1"><div className="text-gray-400 text-sm">{k.label}</div><div className="data-text text-2xl font-bold glow-text">{k.value}</div></div>
            <span className="text-gray-600 text-xs">▼</span>
          </div>
        ))}
      </div>

      {drillDown && drillDownData[drillDown] && (
        <div className="stat-card p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">{drillDownData[drillDown].label}</span>
            <button onClick={() => setDrillDown(null)} className="text-gray-500 hover:text-gray-300 text-xs">收起</button>
          </div>
          <div className="flex gap-4">
            {drillDownData[drillDown].items.map(item => (
              <div key={item.name} className="flex-1 bg-white/5 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-400 mb-1">{item.name}</div>
                <div className="data-text text-lg font-bold glow-text">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="stat-card flex items-center gap-3 p-4">
            <s.icon className="w-5 h-5 text-ice-blue" />
            <div><div className="text-gray-400 text-xs">{s.label}</div><div className="data-text text-xl font-semibold">{s.value}</div></div>
          </div>
        ))}
      </div>

      <div className="stat-card relative p-4" style={{ height: 320 }}>
        <h3 className="text-sm text-gray-400 mb-2">全国充电桩分布</h3>
        <div className="relative w-full h-[270px]">
          {cities.map(c => (
            <div key={c.name} className="absolute group cursor-pointer" style={{ left: `${c.x}%`, top: `${c.y}%`, transform: 'translate(-50%, -50%)' }} onClick={() => setCityPopup(cityPopup === c.name ? null : c.name)}>
              <div className="rounded-full animate-pulse-glow" style={{ width: dotSize(c.volume), height: dotSize(c.volume), backgroundColor: dotColor(c.util), boxShadow: `0 0 ${dotSize(c.volume)}px ${dotColor(c.util)}40` }} />
              {cityPopup === c.name && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-deep-blue-light border border-white/10 rounded-lg px-3 py-2 text-xs whitespace-nowrap z-20 shadow-lg">
                  <div className="font-semibold text-gray-100 mb-1">{c.name}</div>
                  <div className="text-gray-400">营收 <span className="text-electric-green data-text">¥{c.revenue.toLocaleString()}</span></div>
                  <div className="text-gray-400">订单 <span className="text-ice-blue data-text">{c.orders}</span></div>
                  <div className="text-gray-400">故障 <span className="text-red-400 data-text">{c.faults}</span></div>
                  <button onClick={(e) => { e.stopPropagation(); createInspection(cityStationMap[c.name]); setCityPopup(null) }} className="mt-2 btn-primary text-[10px] w-full">下发巡检</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card p-4">
          <h3 className="text-sm text-gray-400 mb-3">站点日均订单TOP10</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.stationOrders} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111D33', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#E2E8F0' }} />
              <Bar dataKey="orders" fill="#00E599" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-card p-4">
          <h3 className="text-sm text-gray-400 mb-3">告警列表</h3>
          <table className="w-full text-xs">
            <thead><tr className="text-gray-500 border-b border-white/5"><th className="text-left py-2 font-normal">设备ID</th><th className="text-left py-2 font-normal">场站</th><th className="text-left py-2 font-normal">类型</th><th className="text-left py-2 font-normal">时间</th><th className="text-left py-2 font-normal">状态</th></tr></thead>
            <tbody>{data.alerts.map(a => (
              <tr key={a.id} className={`border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors ${selectedAlert === a.id ? 'bg-electric-green/5' : ''}`} onClick={() => setSelectedAlert(selectedAlert === a.id ? null : a.id)}>
                <td className="py-2 data-text">{a.id}</td><td className="py-2 text-gray-300">{a.station}</td><td className="py-2 text-amber-orange">{a.type}</td><td className="py-2 text-gray-400 data-text">{a.time}</td>
                <td className="py-2"><span className={`px-2 py-0.5 rounded text-[10px] ${statusColor[a.status]}`}>{a.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {alertDetail && (
        <div className="stat-card p-4 animate-slide-up border border-amber-orange/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-100">告警详情 — {alertDetail.id}</span>
            <button onClick={() => setSelectedAlert(null)} className="text-gray-500 hover:text-gray-300 text-xs">关闭</button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="text-gray-300">{alertDetail.desc}</div>
            <div className="flex gap-6 text-xs">
              <span className="text-gray-400">影响桩数：<span className="text-red-400 data-text">{alertDetail.piles}</span></span>
              <span className="text-gray-400">建议操作：<span className="text-ice-blue">{alertDetail.action}</span></span>
            </div>
            <div className="flex gap-3 pt-2">
              <button className="btn-primary text-xs" onClick={() => { setSelectedAlert(null) }}>派单处理</button>
              <button className="btn-secondary text-xs" onClick={() => { setSelectedAlert(null) }}>标记误报</button>
            </div>
          </div>
        </div>
      )}

      <div className="stat-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm text-gray-400 flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4 text-ice-blue" />巡检任务</h3>
          <button onClick={() => createInspection()} className="btn-primary text-xs flex items-center gap-1"><Plus className="w-3 h-3" />新建巡检</button>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="text-gray-500 border-b border-white/5"><th className="text-left py-2 font-normal">任务ID</th><th className="text-left py-2 font-normal">场站</th><th className="text-left py-2 font-normal">巡检类型</th><th className="text-left py-2 font-normal">计划时间</th><th className="text-left py-2 font-normal">状态</th><th className="text-left py-2 font-normal">执行人</th><th className="text-left py-2 font-normal">操作</th></tr></thead>
          <tbody>{inspections.map(ins => (
            <tr key={ins.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
              <td className="py-2 data-text">{ins.id}</td><td className="py-2 text-gray-300">{ins.station}</td>
              <td className="py-2 text-ice-blue">{ins.type}</td><td className="py-2 text-gray-400 data-text">{ins.scheduled}</td>
              <td className="py-2"><span className={`px-2 py-0.5 rounded text-[10px] ${INSPECTION_STATUS[ins.status]}`}>{ins.status}</span></td>
              <td className="py-2 text-gray-300">{ins.assignee}</td>
              <td className="py-2">
                {ins.status === '待执行' && <button onClick={() => setInspections(prev => prev.map(i => i.id === ins.id ? { ...i, status: '执行中' } : i))} className="btn-primary text-[10px] px-2 py-0.5">开始巡检</button>}
                {ins.status === '执行中' && <button onClick={() => { setCompleteModal(ins.id); setChecks({}) }} className="btn-secondary text-[10px] px-2 py-0.5">完成巡检</button>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {showInspectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowInspectionModal(false)}>
          <div className="glass-card p-6 w-[440px] space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-gray-100 font-medium">新建巡检任务</h3>
            <div><label className="text-xs text-gray-400 mb-1 block">场站</label>
              <select value={newInspection.station} onChange={e => setNewInspection(f => ({ ...f, station: e.target.value }))} className="input-field w-full">
                <option value="">选择场站</option>
                {data.stationOrders.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select></div>
            <div><label className="text-xs text-gray-400 mb-1 block">巡检类型</label>
              <select value={newInspection.type} onChange={e => setNewInspection(f => ({ ...f, type: e.target.value }))} className="input-field w-full">
                {INSPECTION_TYPES.map(t => <option key={t}>{t}</option>)}
              </select></div>
            <div><label className="text-xs text-gray-400 mb-1 block">执行人</label>
              <input value={newInspection.assignee} onChange={e => setNewInspection(f => ({ ...f, assignee: e.target.value }))} className="input-field w-full" placeholder="输入执行人" /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">计划时间</label>
              <input type="datetime-local" value={newInspection.scheduled} onChange={e => setNewInspection(f => ({ ...f, scheduled: e.target.value }))} className="input-field w-full" /></div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowInspectionModal(false)} className="btn-secondary text-sm">取消</button>
              <button onClick={addInspection} className="btn-primary text-sm" disabled={!newInspection.station || !newInspection.assignee || !newInspection.scheduled}>确认创建</button>
            </div>
          </div>
        </div>
      )}

      {completeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setCompleteModal(null)}>
          <div className="glass-card p-6 w-[380px] space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-gray-100 font-medium">完成巡检</h3>
            <div className="space-y-2">
              {CHECK_ITEMS.map(item => (
                <label key={item} className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                  <input type="checkbox" checked={!!checks[item]} onChange={e => setChecks(prev => ({ ...prev, [item]: e.target.checked }))} className="accent-electric-green" />
                  {item}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setCompleteModal(null)} className="btn-secondary text-sm">取消</button>
              <button onClick={() => {
                if (CHECK_ITEMS.every(i => checks[i])) {
                  setInspections(prev => prev.map(i => i.id === completeModal ? { ...i, status: '已完成' } : i))
                  setCompleteModal(null)
                }
              }} className={`btn-primary text-sm ${!CHECK_ITEMS.every(i => checks[i]) ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!CHECK_ITEMS.every(i => checks[i])}>确认完成</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
