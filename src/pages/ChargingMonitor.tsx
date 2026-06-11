import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Zap, Battery, DollarSign, Activity, AlertTriangle, Play, Square, XCircle, CheckCircle, Clock, AlertOctagon, BarChart3, ChevronDown, ChevronUp, Send, Wrench, Timer } from 'lucide-react'

interface AlertItem {
  id: string; severity: 'warning' | 'fault'; message: string; time: string
  status: 'active' | 'reported' | 'dispatched' | 'repairing' | 'reviewing' | 'closed'
  faultType?: string; faultDesc?: string; severityLevel?: string; reportTime?: string
  dispatchTo?: string; estimatedArrival?: string; repairStartTime?: string
  repairEndTime?: string; repairDuration?: string; reviewTime?: string
  reviewer?: string; rootCause?: string; resolution?: string
}
interface ChartPoint { time: string; soc: number; power: number }
interface AuditStep { label: string; time: string; status: 'done' | 'current' | 'pending' }

const initialAlerts: AlertItem[] = [
  { id: 'a1', severity: 'warning', message: '充电功率波动，建议检查连接', time: '14:32', status: 'active' },
  { id: 'a2', severity: 'fault', message: '3号桩通信异常', time: '14:15', status: 'active' },
  { id: 'a3', severity: 'warning', message: '电池温度偏高，已自动降功率', time: '13:58', status: 'active' },
]
const faultTypes = ['通信故障', '过温告警', '接地故障', '功率异常', 'BMS异常']
const rootCauses = ['设备老化', '软件Bug', '外部环境', '人为操作']
const technicians = ['张工', '李工', '王工']
const arrivalOpts = ['30分钟', '1小时', '2小时']
const now = () => { const d = new Date(); return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}` }

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card p-6 w-[400px] space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="section-title mb-2">{title}</h3>
        {children}
      </div>
    </div>
  )
}

function ReportModal({ onSubmit, onClose }: { onSubmit: (t: string, d: string, s: string) => void; onClose: () => void }) {
  const [type, setType] = useState(faultTypes[0]); const [desc, setDesc] = useState(''); const [sev, setSev] = useState('一般')
  return (
    <Modal title="上报故障处理" onClose={onClose}>
      <div><label className="text-xs text-gray-400 mb-1 block">故障类型</label><select value={type} onChange={e => setType(e.target.value)} className="input-field w-full">{faultTypes.map(t => <option key={t}>{t}</option>)}</select></div>
      <div><label className="text-xs text-gray-400 mb-1 block">故障描述</label><textarea value={desc} onChange={e => setDesc(e.target.value)} className="input-field w-full h-20 resize-none" /></div>
      <div><label className="text-xs text-gray-400 mb-1 block">严重程度</label><div className="flex gap-4">{['一般', '紧急', '严重'].map(s => <label key={s} className="flex items-center gap-1.5 text-sm text-gray-300 cursor-pointer"><input type="radio" name="sev" checked={sev === s} onChange={() => setSev(s)} className="accent-electric-green" />{s}</label>)}</div></div>
      <div className="flex gap-3 pt-2"><button onClick={onClose} className="btn-secondary flex-1">取消</button><button onClick={() => onSubmit(type, desc, sev)} className="btn-primary flex-1">提交上报</button></div>
    </Modal>
  )
}

function DispatchModal({ onSubmit, onClose }: { onSubmit: (p: string, a: string) => void; onClose: () => void }) {
  const [person, setPerson] = useState(technicians[0]); const [arrival, setArrival] = useState(arrivalOpts[0])
  return (
    <Modal title="派单处理" onClose={onClose}>
      <div><label className="text-xs text-gray-400 mb-1 block">维修人员</label><select value={person} onChange={e => setPerson(e.target.value)} className="input-field w-full">{technicians.map(t => <option key={t}>{t}</option>)}</select></div>
      <div><label className="text-xs text-gray-400 mb-1 block">预计到达时间</label><select value={arrival} onChange={e => setArrival(e.target.value)} className="input-field w-full">{arrivalOpts.map(o => <option key={o}>{o}</option>)}</select></div>
      <div className="flex gap-3 pt-2"><button onClick={onClose} className="btn-secondary flex-1">取消</button><button onClick={() => onSubmit(person, arrival)} className="btn-primary flex-1">确认派单</button></div>
    </Modal>
  )
}

function ReviewModal({ onSubmit, onClose }: { onSubmit: (r: string, rc: string) => void; onClose: () => void }) {
  const [res, setRes] = useState(''); const [root, setRoot] = useState(rootCauses[0])
  return (
    <Modal title="故障复查" onClose={onClose}>
      <div><label className="text-xs text-gray-400 mb-1 block">处理说明</label><textarea value={res} onChange={e => setRes(e.target.value)} className="input-field w-full h-20 resize-none" /></div>
      <div><label className="text-xs text-gray-400 mb-1 block">根因分析</label><select value={root} onChange={e => setRoot(e.target.value)} className="input-field w-full">{rootCauses.map(c => <option key={c}>{c}</option>)}</select></div>
      <div className="flex gap-3 pt-2"><button onClick={onClose} className="btn-secondary flex-1">取消</button><button onClick={() => onSubmit(res, root)} className="btn-primary flex-1">确认关闭</button></div>
    </Modal>
  )
}

export default function ChargingMonitor() {
  const navigate = useNavigate()
  const [simulating, setSimulating] = useState(false)
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [currentMetrics, setCurrentMetrics] = useState({ power: 0, charged: 0, soc: 20, cost: 0 })
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts)
  const [reportTarget, setReportTarget] = useState<string | null>(null)
  const [dispatchTarget, setDispatchTarget] = useState<string | null>(null)
  const [reviewTarget, setReviewTarget] = useState<string | null>(null)
  const [showAudit, setShowAudit] = useState(false)
  const [expandedAudit, setExpandedAudit] = useState<Set<string>>(new Set())
  const [chargeComplete, setChargeComplete] = useState(false)
  const [elapsedMap, setElapsedMap] = useState<Record<string, number>>({})
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickRef = useRef(0)
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const auditSteps: AuditStep[] = [
    { label: '插枪检测', time: '14:28:05', status: 'done' }, { label: 'VIN识别', time: '14:28:12', status: 'done' },
    { label: '车牌认证', time: '14:28:18', status: 'done' }, { label: '充电启动', time: '14:30:00', status: 'done' },
    { label: '充电中', time: '14:30:01', status: chargeComplete ? 'done' : simulating ? 'current' : 'pending' },
    { label: '充电完成', time: '', status: chargeComplete ? 'done' : 'pending' },
  ]

  const generatePoint = useCallback((tick: number) => {
    const soc = Math.min(95, 20 + tick * 1.5)
    const power = soc < 80 ? 60 + Math.random() * 10 : Math.max(10, 60 - (soc - 80) * 3)
    const hour = 14 + Math.floor(tick * 2 / 60); const minute = (tick * 2) % 60
    return { time: `${hour}:${minute.toString().padStart(2, '0')}`, soc: Math.round(soc * 10) / 10, power: Math.round(power * 10) / 10 }
  }, [])

  const startSimulation = () => {
    setSimulating(true); setChargeComplete(false); setChartData([]); tickRef.current = 0
    const first = generatePoint(0); setChartData([first]); setCurrentMetrics({ power: first.power, charged: 0, soc: first.soc, cost: 0 })
    intervalRef.current = setInterval(() => {
      tickRef.current += 1; const tick = tickRef.current
      if (tick > 50) { stopSimulation(); setChargeComplete(true); return }
      const point = generatePoint(tick); const charged = tick * 1.2
      setChartData(prev => [...prev, point])
      setCurrentMetrics({ power: point.power, charged: Math.round(charged * 10) / 10, soc: point.soc, cost: Math.round(charged * 1.2 * 100) / 100 })
      if (tick === 10) setAlerts(prev => [...prev, { id: `a${Date.now()}`, severity: 'warning', message: '电池温度略高，已调整功率', time: point.time, status: 'active' }])
      if (tick === 25) setAlerts(prev => [...prev, { id: `a${Date.now()+1}`, severity: 'fault', message: 'BMS通信短暂中断，已恢复', time: point.time, status: 'active' }])
    }, 1000)
  }
  const stopSimulation = () => { setSimulating(false); if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null } }
  useEffect(() => { return () => { if (intervalRef.current) clearInterval(intervalRef.current); if (elapsedRef.current) clearInterval(elapsedRef.current) } }, [])

  useEffect(() => {
    const repairing = alerts.filter(a => a.status === 'repairing')
    if (repairing.length === 0 && elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null; return }
    if (repairing.length > 0 && !elapsedRef.current) {
      elapsedRef.current = setInterval(() => {
        setElapsedMap(prev => { const next = { ...prev }; repairing.forEach(a => { next[a.id] = (prev[a.id] || 0) + 1 }); return next })
      }, 1000)
    }
  }, [alerts])

  const handleReport = (id: string, type: string, desc: string, sev: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'reported', faultType: type, faultDesc: desc, severityLevel: sev, reportTime: now() } : a)); setReportTarget(null)
  }
  const handleDispatch = (id: string, person: string, arrival: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'dispatched', dispatchTo: person, estimatedArrival: arrival } : a)); setDispatchTarget(null)
  }
  const handleStartRepair = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'repairing', repairStartTime: now() } : a))
  const handleFinishRepair = (id: string) => {
    setAlerts(prev => prev.map(a => {
      if (a.id !== id) return a
      const dur = elapsedMap[id] ? `${Math.floor(elapsedMap[id] / 60)}分${elapsedMap[id] % 60}秒` : '--'
      return { ...a, status: 'reviewing', repairEndTime: now(), repairDuration: dur }
    }))
  }
  const handleEscalate = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, severity: 'fault', status: 'active' } : a))
  const handleReview = (id: string, resolution: string, root: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'closed', resolution, rootCause: root, reviewTime: now(), reviewer: '系统管理员' } : a)); setReviewTarget(null)
  }
  const toggleAudit = (id: string) => setExpandedAudit(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const activeCount = alerts.filter(a => a.status === 'active').length
  const processingCount = alerts.filter(a => ['reported', 'dispatched', 'repairing'].includes(a.status)).length
  const reviewingCount = alerts.filter(a => a.status === 'reviewing').length
  const closedCount = alerts.filter(a => a.status === 'closed').length

  const metricCards = [
    { label: '当前功率', value: `${currentMetrics.power}`, unit: 'kW', icon: Zap, color: 'text-ice-blue' },
    { label: '已充电量', value: `${currentMetrics.charged}`, unit: 'kWh', icon: Activity, color: 'text-electric-green' },
    { label: '当前SOC', value: `${currentMetrics.soc}`, unit: '%', icon: Battery, color: 'text-electric-green' },
    { label: '预计费用', value: `¥${currentMetrics.cost}`, unit: '', icon: DollarSign, color: 'text-amber-orange' },
  ]

  const statusBadge = (s: AlertItem['status']) => {
    if (s === 'active') return <span className="text-xs px-2 py-0.5 rounded bg-red-500/15 text-red-400">待处理</span>
    if (s === 'reported') return <span className="text-xs px-2 py-0.5 rounded bg-amber-orange/15 text-amber-orange">已上报</span>
    if (s === 'dispatched') return <span className="text-xs px-2 py-0.5 rounded bg-ice-blue/15 text-ice-blue">已派单</span>
    if (s === 'repairing') return <span className="text-xs px-2 py-0.5 rounded bg-ice-blue/15 text-ice-blue animate-pulse">维修中</span>
    if (s === 'reviewing') return <span className="text-xs px-2 py-0.5 rounded bg-amber-orange/15 text-amber-orange">待复查</span>
    return <span className="text-xs px-2 py-0.5 rounded bg-electric-green/15 text-electric-green flex items-center gap-1"><CheckCircle className="w-3 h-3" />已关闭</span>
  }

  const auditTrail = (a: AlertItem) => {
    const steps: { time: string; detail: string }[] = []
    if (a.reportTime) steps.push({ time: a.reportTime, detail: `故障类型: ${a.faultType} | 严重程度: ${a.severityLevel}` })
    if (a.dispatchTo) steps.push({ time: a.repairStartTime || '--', detail: `派单人员: ${a.dispatchTo} | 预计到达: ${a.estimatedArrival}` })
    if (a.repairStartTime) steps.push({ time: a.repairStartTime, detail: '开始维修' })
    if (a.repairEndTime) steps.push({ time: a.repairEndTime, detail: `维修时长: ${a.repairDuration}` })
    if (a.reviewTime) steps.push({ time: a.reviewTime, detail: `根因: ${a.rootCause} | 处理说明: ${a.resolution}` })
    return steps
  }

  const completeDuration = `${Math.round(chartData.length * 2 / 60)}时${(chartData.length * 2) % 60}分`

  return (
    <div className="space-y-6 animate-slide-up">
      {reportTarget && <ReportModal onSubmit={(t, d, s) => handleReport(reportTarget, t, d, s)} onClose={() => setReportTarget(null)} />}
      {dispatchTarget && <DispatchModal onSubmit={(p, a) => handleDispatch(dispatchTarget, p, a)} onClose={() => setDispatchTarget(null)} />}
      {reviewTarget && <ReviewModal onSubmit={(r, rc) => handleReview(reviewTarget, r, rc)} onClose={() => setReviewTarget(null)} />}

      <div className="glass-card p-3 flex items-center gap-6 text-xs overflow-x-auto">
        <div className="shrink-0"><span className="text-gray-400">订单号</span><span className="ml-2 text-gray-200 data-text cursor-pointer hover:text-electric-green transition-colors" onClick={() => navigate('/orders')}>ORD20260610001</span></div>
        <div className="shrink-0"><span className="text-gray-400">充电站</span><span className="ml-2 text-gray-200">国网北京朝阳站 · 3号桩</span></div>
        <div className="shrink-0"><span className="text-gray-400">启动时间</span><span className="ml-2 text-gray-200">2026-06-10 14:30</span></div>
        <div className="shrink-0"><span className="text-gray-400">车辆</span><span className="ml-2 text-gray-200">比亚迪汉EV 京A12345</span></div>
        <div className="shrink-0 ml-auto"><span className={`px-2 py-0.5 rounded-full text-xs ${chargeComplete ? 'bg-electric-green/15 text-electric-green' : simulating ? 'bg-ice-blue/15 text-ice-blue animate-pulse' : 'bg-gray-500/15 text-gray-400'}`}>{chargeComplete ? '充电完成' : simulating ? '充电中' : '待启动'}</span></div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="section-title mb-0">充电监控</h2>
        {simulating ? <button onClick={stopSimulation} className="btn-danger flex items-center gap-2"><Square className="w-4 h-4" />停止模拟</button> : <button onClick={startSimulation} className="btn-primary flex items-center gap-2"><Play className="w-4 h-4" />模拟充电</button>}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {metricCards.map(({ label, value, unit, icon: Icon, color }) => (
          <div key={label} className="stat-card glow-green">
            <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-400">{label}</span><Icon className={`w-4 h-4 ${color}`} /></div>
            <div className={`data-text text-2xl font-bold ${color} glow-text`}>{value}<span className="text-sm font-normal text-gray-400 ml-1">{unit}</span></div>
          </div>
        ))}
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-gray-200 mb-4">充电曲线</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
              <XAxis dataKey="time" tick={{ fill: '#6B7280', fontSize: 11 }} stroke="#1E2D45" />
              <YAxis yAxisId="left" tick={{ fill: '#00E599', fontSize: 11 }} stroke="#1E2D45" domain={[0, 100]} unit="%" />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#4FC3F7', fontSize: 11 }} stroke="#1E2D45" domain={[0, 80]} unit="kW" />
              <Tooltip contentStyle={{ background: '#111D33', border: '1px solid #1E2D45', borderRadius: 8, color: '#E2E8F0' }} labelStyle={{ color: '#9CA3AF' }} />
              <Legend wrapperStyle={{ color: '#9CA3AF', fontSize: 12 }} />
              <Line yAxisId="left" type="monotone" dataKey="soc" stroke="#00E599" strokeWidth={2} dot={false} name="SOC (%)" />
              <Line yAxisId="right" type="monotone" dataKey="power" stroke="#4FC3F7" strokeWidth={2} dot={false} name="功率 (kW)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-4">
        <button onClick={() => setShowAudit(!showAudit)} className="flex items-center gap-2 text-sm font-medium text-gray-200 w-full">充电审计追溯{showAudit ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}</button>
        {showAudit && (
          <div className="mt-4 flex items-start gap-0">
            {auditSteps.map((step, i) => (
              <div key={i} className="flex-1 relative">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${step.status === 'done' ? 'bg-electric-green/20' : step.status === 'current' ? 'bg-ice-blue/20' : 'bg-gray-700/30'}`}>
                    {step.status === 'done' ? <CheckCircle className="w-4 h-4 text-electric-green" /> : step.status === 'current' ? <div className="w-2.5 h-2.5 rounded-full bg-ice-blue animate-pulse" /> : <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />}
                  </div>
                  <span className={`text-xs mt-1.5 text-center ${step.status === 'done' ? 'text-electric-green' : step.status === 'current' ? 'text-ice-blue' : 'text-gray-600'}`}>{step.label}</span>
                  <span className="text-[10px] text-gray-500 mt-0.5">{step.time || '--:--'}</span>
                </div>
                {i < auditSteps.length - 1 && <div className={`absolute top-3 left-[calc(50%+12px)] right-[calc(-50%+12px)] h-0.5 ${step.status === 'done' ? 'bg-electric-green/40' : 'bg-gray-700/30'}`} />}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '待处理', value: activeCount, icon: AlertOctagon, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: '处理中', value: processingCount, icon: Wrench, color: 'text-ice-blue', bg: 'bg-ice-blue/10' },
          { label: '待复查', value: reviewingCount, icon: Clock, color: 'text-amber-orange', bg: 'bg-amber-orange/10' },
          { label: '已关闭', value: closedCount, icon: CheckCircle, color: 'text-electric-green', bg: 'bg-electric-green/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`stat-card ${bg} border-white/5`}>
            <div className="flex items-center gap-2 mb-1"><Icon className={`w-3.5 h-3.5 ${color}`} /><span className="text-xs text-gray-400">{label}</span></div>
            <div className={`data-text text-xl font-bold ${color} glow-text`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-gray-200 mb-3">告警信息</h3>
        {alerts.length === 0 ? <div className="text-sm text-gray-500 text-center py-4">暂无告警</div> : (
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id}>
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${alert.severity === 'fault' ? 'border-red-500/20 bg-red-500/5' : 'border-amber-orange/20 bg-amber-orange/5'} ${alert.status === 'closed' ? 'opacity-60' : ''}`}>
                  {alert.status === 'closed' ? <CheckCircle className="w-4 h-4 text-electric-green shrink-0" /> : alert.severity === 'fault' ? <XCircle className="w-4 h-4 text-red-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-orange shrink-0" />}
                  <span className={`text-sm ${alert.status === 'closed' ? 'text-gray-500 line-through' : alert.severity === 'fault' ? 'text-red-400' : 'text-amber-orange'}`}>{alert.message}</span>
                  <span className="text-xs text-gray-500 shrink-0">{alert.time}</span>
                  <div className="ml-auto shrink-0">{statusBadge(alert.status)}</div>
                  <div className="shrink-0 flex gap-2 items-center">
                    {alert.status === 'active' && alert.severity === 'warning' && (<>
                      <button onClick={() => setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: 'closed' } : a))} className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded border border-gray-600/30">忽略</button>
                      <button onClick={() => handleEscalate(alert.id)} className="text-xs text-amber-orange hover:text-amber-orange/80 px-2 py-1 rounded border border-amber-orange/30">升级为故障</button>
                    </>)}
                    {alert.status === 'active' && alert.severity === 'fault' && <button onClick={() => setReportTarget(alert.id)} className="text-xs text-electric-green hover:text-electric-green/80 px-2 py-1 rounded border border-electric-green/30">上报处理</button>}
                    {alert.status === 'reported' && <button onClick={() => setDispatchTarget(alert.id)} className="text-xs text-ice-blue hover:text-ice-blue/80 px-2 py-1 rounded border border-ice-blue/30 flex items-center gap-1"><Send className="w-3 h-3" />派单</button>}
                    {alert.status === 'dispatched' && (<>
                      <span className="text-xs text-ice-blue">已派单 → {alert.dispatchTo} · 预计{alert.estimatedArrival}到达</span>
                      <button onClick={() => handleStartRepair(alert.id)} className="text-xs text-electric-green hover:text-electric-green/80 px-2 py-1 rounded border border-electric-green/30 flex items-center gap-1"><Wrench className="w-3 h-3" />开始维修</button>
                    </>)}
                    {alert.status === 'repairing' && (<>
                      <span className="text-xs text-ice-blue flex items-center gap-1"><Timer className="w-3 h-3" />{Math.floor((elapsedMap[alert.id] || 0) / 60)}分{(elapsedMap[alert.id] || 0) % 60}秒</span>
                      <button onClick={() => handleFinishRepair(alert.id)} className="text-xs text-amber-orange hover:text-amber-orange/80 px-2 py-1 rounded border border-amber-orange/30">完成维修</button>
                    </>)}
                    {alert.status === 'reviewing' && <button onClick={() => setReviewTarget(alert.id)} className="text-xs text-ice-blue hover:text-ice-blue/80 px-2 py-1 rounded border border-ice-blue/30">复查</button>}
                    {alert.status === 'closed' && <button onClick={() => toggleAudit(alert.id)} className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded border border-gray-600/30 flex items-center gap-1">{expandedAudit.has(alert.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}审计追溯</button>}
                  </div>
                </div>
                {alert.status === 'closed' && expandedAudit.has(alert.id) && (
                  <div className="ml-4 mt-1 pl-4 border-l-2 border-electric-green/30 space-y-2 py-2">
                    {auditTrail(alert).map((step, i) => <div key={i} className="flex items-start gap-3 text-xs"><span className="text-electric-green shrink-0 w-12">{step.time}</span><span className="text-gray-300">{step.detail}</span></div>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {chargeComplete && (
        <div className="glass-card p-6 border-electric-green/20">
          <div className="flex items-center gap-3 mb-4"><CheckCircle className="w-6 h-6 text-electric-green" /><h3 className="text-lg font-semibold text-electric-green">充电完成</h3></div>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="stat-card"><span className="text-xs text-gray-400">总电量</span><div className="data-text text-xl text-electric-green glow-text">{currentMetrics.charged} <span className="text-sm font-normal text-gray-400">kWh</span></div></div>
            <div className="stat-card"><span className="text-xs text-gray-400">总费用</span><div className="data-text text-xl text-amber-orange glow-text">¥{currentMetrics.cost}</div></div>
            <div className="stat-card"><span className="text-xs text-gray-400">充电时长</span><div className="data-text text-xl text-ice-blue glow-text">{completeDuration}</div></div>
            <div className="stat-card"><span className="text-xs text-gray-400">最终SOC</span><div className="data-text text-xl text-electric-green glow-text">{currentMetrics.soc}%</div></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/orders')} className="btn-primary flex-1 flex items-center justify-center gap-2"><BarChart3 className="w-4 h-4" />查看完整订单</button>
            <button onClick={() => navigate('/')} className="btn-secondary flex-1">返回首页</button>
          </div>
        </div>
      )}
    </div>
  )
}
