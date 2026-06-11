import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, DollarSign, AlertTriangle, X, Bell, Video, MessageSquare } from 'lucide-react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { PieChart, BarChart, LineChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useStore } from '@/store'

echarts.use([PieChart, BarChart, LineChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const methodBadge: Record<string, string> = { '扫码': 'badge-success', '蓝牙': 'badge-warning', 'NFC': 'badge-warning' }
const typeBadge: Record<string, string> = { '两轮': 'bg-electric/15 text-electric border border-electric/20', '三轮': 'bg-alert-blue/15 text-alert-blue border border-alert-blue/20', '四轮': 'bg-alert-orange/15 text-alert-orange border border-alert-orange/20' }
const grad = (c1: string, c2: string) => ({ type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: c1 }, { offset: 1, color: c2 }] })
const ttBase = { backgroundColor: '#0F1F3A', borderColor: '#243D63', textStyle: { color: '#E2E8F0' } }
const sevColor = (s: string) => s === '紧急' ? 'text-alert-red' : s === '重要' ? 'text-alert-orange' : 'text-alert-blue'
const actionBtn = (on: boolean, labelOn: string, labelOff: string, icon: React.ReactNode) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${on ? 'bg-electric/20 text-electric' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{icon}{on ? labelOn : labelOff}</span>
)

export default function Dashboard() {
  const { chargingPiles, chargingOrders, alertRecords, billingDetails, settlementDetails, pricingRules, stations } = useStore()
  const [range, setRange] = useState<'7d' | '30d'>('7d')
  const [settlePage, setSettlePage] = useState(1)
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertDisp, setAlertDisp] = useState<Record<string, { sms: boolean; sys: boolean }>>({})
  const [abnDisp, setAbnDisp] = useState<Record<string, { sms: boolean; sys: boolean }>>({})
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const days = range === '7d' ? 7 : 30
  const rangeStart = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - (days - 1)); return d.toISOString().slice(0, 10) }, [days])

  const rangeOrders = useMemo(() => chargingOrders.filter(o => o.start_time.slice(0, 10) >= rangeStart && o.start_time.slice(0, 10) <= todayStr), [chargingOrders, rangeStart, todayStr])
  const rangeAlerts = useMemo(() => alertRecords.filter(a => a.triggered_at.slice(0, 10) >= rangeStart && a.triggered_at.slice(0, 10) <= todayStr), [alertRecords, rangeStart, todayStr])
  const rangeSettlements = useMemo(() => settlementDetails.filter(s => s.settled_at.slice(0, 10) >= rangeStart && s.settled_at.slice(0, 10) <= todayStr), [settlementDetails, rangeStart, todayStr])

  const onlinePiles = chargingPiles.filter(p => p.status !== '离线').length
  const rangeIncome = rangeOrders.filter(o => o.status === '已完成').reduce((s, o) => s + o.total_amount, 0)
  const chargingCount = chargingPiles.filter(p => p.status === '充电中').length
  const idleCount = chargingPiles.filter(p => p.status === '空闲').length
  const faultCount = chargingPiles.filter(p => p.status === '故障').length
  const rangeCompleted = rangeOrders.filter(o => o.status === '已完成').length
  const rangeCharging = rangeOrders.filter(o => o.status === '充电中').length
  const rangeAbnormal = rangeOrders.filter(o => o.status === '异常终止').length
  const rangeRefunding = rangeOrders.filter(o => o.settlement_status === '退款中').length

  const alertMap: Record<string, number> = { '过载': 0, '高温': 0, '断连': 0, '拔枪': 0 }
  rangeAlerts.forEach(a => { alertMap[a.alert_type]++ })
  const alertHandled = rangeAlerts.filter(a => a.status === '已处理').length
  const alertPending = rangeAlerts.filter(a => a.status === '待处理').length
  const allPending = rangeAlerts.filter(a => a.status === '待处理')
  const pileAlertPending: Record<string, number> = {}
  rangeAlerts.filter(a => a.status === '待处理').forEach(a => { pileAlertPending[a.pile_id] = (pileAlertPending[a.pile_id] || 0) + 1 })
  const pileAlertCount: Record<string, number> = {}
  rangeAlerts.forEach(a => { pileAlertCount[a.pile_id] = (pileAlertCount[a.pile_id] || 0) + 1 })
  const top3Piles = Object.entries(pileAlertCount).sort((a, b) => b[1] - a[1]).slice(0, 3)

  const activeOrders = rangeOrders.filter(o => o.status === '充电中' || o.status === '异常终止').slice(0, 8)
  const recentPending = allPending.slice(0, 3)
  const videoRec = useMemo(() => { const m: Record<string, boolean> = {}; activeOrders.filter(o => o.status === '异常终止').forEach(o => { m[o.order_id] = o.order_id.charCodeAt(o.order_id.length - 1) % 2 === 0 }); return m }, [activeOrders])

  const revenueData = useMemo(() =>
    Array.from({ length: days }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (days - 1 - i)); const ds = d.toISOString().slice(0, 10)
      const db = billingDetails.filter(b => chargingOrders.some(o => o.order_id === b.order_id && o.start_time.slice(0, 10) === ds && o.status === '已完成'))
      const pk = db.reduce((s, b) => s + b.peak_energy * b.peak_price, 0), fl = db.reduce((s, b) => s + b.flat_energy * b.flat_price, 0), vl = db.reduce((s, b) => s + b.valley_energy * b.valley_price, 0)
      const el = db.reduce((s, b) => s + b.total_electric_fee, 0), sv = db.reduce((s, b) => s + b.service_fee, 0)
      return { date: `${d.getMonth() + 1}/${d.getDate()}`, electric: +el.toFixed(2), service: +sv.toFixed(2), peakFee: +pk.toFixed(2), flatFee: +fl.toFixed(2), valleyFee: +vl.toFixed(2), total: +(el + sv).toFixed(2) }
    })
  , [chargingOrders, billingDetails, days])

  const rangeBilling = useMemo(() => billingDetails.filter(b => rangeOrders.some(o => o.order_id === b.order_id && o.status === '已完成')), [rangeOrders, billingDetails])
  const timeOfUse = useMemo(() => {
    const pP = pricingRules.find(r => r.period === '峰时')?.price ?? 1.2, fP = pricingRules.find(r => r.period === '平时')?.price ?? 0.8, vP = pricingRules.find(r => r.period === '谷时')?.price ?? 0.4
    const pk = rangeBilling.reduce((s, b) => s + b.peak_energy, 0), fl = rangeBilling.reduce((s, b) => s + b.flat_energy, 0), vl = rangeBilling.reduce((s, b) => s + b.valley_energy, 0)
    return [{ period: '峰时', kwh: +pk.toFixed(1), amount: +(pk * pP).toFixed(2), avgPrice: pP }, { period: '平时', kwh: +fl.toFixed(1), amount: +(fl * fP).toFixed(2), avgPrice: fP }, { period: '谷时', kwh: +vl.toFixed(1), amount: +(vl * vP).toFixed(2), avgPrice: vP }]
  }, [rangeBilling, pricingRules])

  const totalSvcFee = rangeBilling.reduce((s, b) => s + b.service_fee, 0)
  const totalAmount = rangeBilling.reduce((s, b) => s + b.total_amount, 0)
  const totalKwh = rangeBilling.reduce((s, b) => s + b.peak_energy + b.flat_energy + b.valley_energy, 0)
  const avgSvcPerKwh = totalKwh > 0 ? totalSvcFee / totalKwh : 0
  const svcFeeRatio = totalAmount > 0 ? totalSvcFee / totalAmount : 0
  const gridTotal = rangeSettlements.reduce((s, r) => s + r.grid_share, 0)
  const propTotal = rangeSettlements.reduce((s, r) => s + r.property_share, 0)
  const opTotal = rangeSettlements.reduce((s, r) => s + r.operator_share, 0)
  const settlePageSize = 10, settleTotalPages = Math.ceil(rangeSettlements.length / settlePageSize), settlePaged = rangeSettlements.slice((settlePage - 1) * settlePageSize, settlePage * settlePageSize)

  const getPileType = (id: string) => chargingPiles.find(p => p.pile_id === id)?.pile_type ?? '-'
  const getStationName = (oid: string) => { const o = chargingOrders.find(x => x.order_id === oid); if (!o) return '-'; const p = chargingPiles.find(x => x.pile_id === o.pile_id); return p ? stations.find(s => s.station_id === p.station_id)?.name ?? '-' : '-' }

  const toggle = (setter: typeof setAlertDisp, id: string, type: 'sms' | 'sys') => setter(prev => ({ ...prev, [id]: { sms: type === 'sms' ? true : prev[id]?.sms ?? false, sys: type === 'sys' ? true : prev[id]?.sys ?? false } }))
  const handleAll = () => { const next: Record<string, { sms: boolean; sys: boolean }> = {}; allPending.forEach(a => { next[a.alert_id] = { sms: true, sys: true } }); setAlertDisp(next) }

  const pieOption = { backgroundColor: 'transparent', tooltip: { trigger: 'item' as const, ...ttBase }, legend: { bottom: 0, textStyle: { color: '#94A3B8' } }, series: [{ type: 'pie', radius: ['45%', '70%'], center: ['50%', '45%'], label: { color: '#E2E8F0' }, data: [{ value: chargingCount, name: '充电中', itemStyle: { color: '#00E5A0' } }, { value: idleCount, name: '空闲', itemStyle: { color: '#475569' } }, { value: faultCount, name: '故障', itemStyle: { color: '#FF4757' } }] }] }
  const alertTypes = ['拔枪', '断连', '高温', '过载']
  const barOption = { backgroundColor: 'transparent', tooltip: { trigger: 'axis' as const, ...ttBase }, grid: { left: 60, right: 20, top: 10, bottom: 30 }, xAxis: { type: 'value', axisLabel: { color: '#94A3B8' }, splitLine: { lineStyle: { color: '#1C3254' } } }, yAxis: { type: 'category', data: alertTypes, axisLabel: { color: '#94A3B8' } }, series: [{ type: 'bar', barWidth: 16, itemStyle: { borderRadius: [0, 4, 4, 0] }, data: alertTypes.map((t, i) => ({ value: alertMap[t], itemStyle: { color: ['#FF8C42', '#4DA6FF', '#FF4757', '#FF8C42'][i] } })) }] }
  const areaOption = { backgroundColor: 'transparent', tooltip: { trigger: 'axis' as const, ...ttBase, formatter: (params: any[]) => { const d = revenueData[params[0].dataIndex]; return `<b>${d.date}</b><br/>电费收入：¥${d.electric}<br/>&nbsp;&nbsp;峰时 ¥${d.peakFee} / 平时 ¥${d.flatFee} / 谷时 ¥${d.valleyFee}<br/>服务费：¥${d.service}<br/><b>合计：¥${d.total}</b>` } }, legend: { data: ['电费收入', '服务费'], textStyle: { color: '#94A3B8' } }, grid: { left: 60, right: 20, top: 40, bottom: 30 }, xAxis: { type: 'category', data: revenueData.map(d => d.date), axisLabel: { color: '#94A3B8' }, boundaryGap: false }, yAxis: { type: 'value', axisLabel: { color: '#94A3B8' }, splitLine: { lineStyle: { color: '#1C3254' } } }, series: [{ name: '电费收入', type: 'line', smooth: true, data: revenueData.map(d => d.electric), areaStyle: { color: grad('rgba(0,229,160,0.4)', 'rgba(0,229,160,0.02)') }, lineStyle: { color: '#00E5A0' }, itemStyle: { color: '#00E5A0' } }, { name: '服务费', type: 'line', smooth: true, data: revenueData.map(d => d.service), areaStyle: { color: grad('rgba(77,166,255,0.4)', 'rgba(77,166,255,0.02)') }, lineStyle: { color: '#4DA6FF' }, itemStyle: { color: '#4DA6FF' } }] }

  const rangeLabel = range === '7d' ? '近7天' : '近30天'
  const stats = [
    { label: `${rangeLabel}充电`, value: rangeOrders.length, arrow: '↑', trend: '+5.1%', color: 'text-alert-green', to: '/orders' },
    { label: `${rangeLabel}收入`, value: `¥${rangeIncome.toLocaleString()}`, arrow: '↑', trend: '+3.8%', color: 'text-alert-green', to: '' },
    { label: `${rangeLabel}告警`, value: rangeAlerts.length, arrow: '↓', trend: '-1.2%', color: 'text-alert-green', to: '', isAlert: true },
    { label: '在线桩数', value: `${onlinePiles}/${chargingPiles.length}`, arrow: '↑', trend: '+2.3%', color: 'text-alert-green', to: '/devices' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div /><div className="flex gap-1">
        {(['7d', '30d'] as const).map(r => (<button key={r} onClick={() => { setRange(r); setSettlePage(1) }} className={`px-3 py-1 text-xs rounded-md transition-colors ${range === r ? 'bg-electric/20 text-electric' : 'text-slate-400 hover:text-slate-200'}`}>{r === '7d' ? '7天' : '30天'}</button>))}
      </div></div>

      <div className="grid grid-cols-4 gap-4">{stats.map((s, i) => {
        const inner = (<motion.div key={s.label} className={`stat-card ${s.isAlert ? 'cursor-pointer' : ''}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} onClick={s.isAlert ? () => setShowAlertModal(true) : undefined}>
          <div className="text-xs text-slate-400">{s.label}</div><div className="text-3xl font-din font-bold text-white mt-1">{s.value}</div><div className={`text-xs mt-2 ${s.color}`}>{s.arrow} {s.trend}</div>
        </motion.div>)
        return s.to && !s.isAlert ? <Link key={s.label} to={s.to}>{inner}</Link> : <div key={s.label}>{inner}</div>
      })}</div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 card">
          <div className="section-title">实时充电与异常状态</div>
          <ReactEChartsCore echarts={echarts} option={pieOption} style={{ height: 200 }} />
          {activeOrders.length > 0 && (<div className="mt-2 space-y-1.5 max-h-[360px] overflow-y-auto">{activeOrders.map(o => {
            const pt = getPileType(o.pile_id), hpa = pileAlertPending[o.pile_id] > 0, isAbn = o.status === '异常终止', d = abnDisp[o.order_id]
            return (<div key={o.order_id}>
              <Link to="/orders" className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg bg-dark-700/50 hover:bg-dark-600/60 transition-colors">
                <span className="text-slate-300 font-mono text-xs">{o.order_id}</span>
                <span className="text-slate-400 text-xs">{o.pile_id}</span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${typeBadge[pt] || 'badge-info'}`}>{pt}</span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${methodBadge[o.start_method] || 'badge-info'}`}>{o.start_method}</span>
                <span className="text-slate-300 text-xs font-mono">{o.energy_kwh}kWh</span>
                <span className="flex items-center gap-1.5">
                  {isAbn ? <span className="badge-danger text-[10px]">异常终止</span> : <span className="badge-success">充电中</span>}
                  {hpa && <span className="w-2 h-2 rounded-full bg-alert-red animate-pulse" />}
                </span>
              </Link>
              {isAbn && (<div className="ml-2 mr-2 mt-1 p-2.5 rounded-lg bg-dark-800/80 border border-alert-red/20 space-y-2">
                {o.abort_reason && <div className="text-xs text-alert-orange"><AlertTriangle size={12} className="inline mr-1" />{o.abort_reason}</div>}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-500">告警处置：</span>
                  <button onClick={() => toggle(setAbnDisp, o.order_id, 'sms')}>{actionBtn(!!d?.sms, '已发送', '短信通知', <MessageSquare size={10} />)}</button>
                  <button onClick={() => toggle(setAbnDisp, o.order_id, 'sys')}>{actionBtn(!!d?.sys, '已发送', '系统告警', <Bell size={10} />)}</button>
                  <span className="mx-1 text-slate-700">|</span>
                  <span className="text-[10px] text-slate-500">视频识别：</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${videoRec[o.order_id] ? 'bg-electric/20 text-electric' : 'bg-slate-700 text-slate-500'}`}><Video size={10} />{videoRec[o.order_id] ? 'AI已识别' : '未识别'}</span>
                  <span className="mx-1 text-slate-700">|</span>
                  <span className="text-[10px] text-slate-500">远程控制：</span>
                  <Link to={`/devices/${o.pile_id}`} className="text-[10px] text-electric hover:underline">启停控制 →</Link>
                  <Link to={`/devices/${o.pile_id}`} className="text-[10px] text-electric hover:underline">功率调节 →</Link>
                </div>
              </div>)}
            </div>)
          })}</div>)}
        </div>
        <div className="col-span-4 card">
          <div className="section-title">{rangeLabel}告警汇总</div>
          <Link to="/alerts"><ReactEChartsCore echarts={echarts} option={barOption} style={{ height: 200 }} /></Link>
          <div className="mt-3 flex gap-2 items-center">
            <span className="badge-success text-[10px]">已处理 {alertHandled}</span>
            <button onClick={() => setShowAlertModal(true)} className="badge-danger text-[10px] cursor-pointer hover:opacity-80 transition-opacity">待处理 {alertPending}</button>
          </div>
          {recentPending.length > 0 && (<div className="mt-2 space-y-1.5"><div className="text-xs text-slate-500 mb-1">待处理告警</div>
            {recentPending.map(a => (<Link key={a.alert_id} to="/alerts" className="flex items-center justify-between text-xs px-2 py-1 rounded bg-dark-700/50 hover:bg-dark-600/60 transition-colors">
              <span className="badge-danger text-[10px]">{a.alert_type}</span><span className="text-slate-400 font-mono">{a.pile_id}</span><span className="text-slate-500">{a.triggered_at.slice(11, 16)}</span><span className={`text-[10px] ${sevColor(a.severity)}`}>{a.severity}</span>
            </Link>))}
          </div>)}
          {top3Piles.length > 0 && (<div className="mt-3 space-y-1.5"><div className="text-xs text-slate-500 mb-1">告警来源 TOP3</div>
            {top3Piles.map(([pid, cnt]) => (<Link key={pid} to={`/devices/${pid}`} className="flex items-center justify-between text-sm px-2 py-1 rounded-lg bg-dark-700/50 hover:bg-dark-600/60 transition-colors">
              <span className="text-slate-300">{pid}</span><span className="badge-danger text-[10px]">{cnt}条</span>
            </Link>))}
          </div>)}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4"><div className="section-title mb-0"><TrendingUp size={16} className="text-electric" />收入趋势（{rangeLabel}）</div></div>
        <ReactEChartsCore echarts={echarts} option={areaOption} style={{ height: 240 }} />
        <div className="mt-4 pt-4 border-t border-surface-border">
          <div className="text-xs text-slate-500 mb-3">分时电价拆分明细（{rangeLabel}）</div>
          <div className="grid grid-cols-3 gap-3">{timeOfUse.map(t => (<div key={t.period} className="rounded-lg bg-dark-700/50 p-3">
            <div className="flex items-center gap-2 mb-2"><span className={`text-xs font-medium px-1.5 py-0.5 rounded ${t.period === '峰时' ? 'bg-alert-red/15 text-alert-red' : t.period === '平时' ? 'bg-alert-orange/15 text-alert-orange' : 'bg-alert-blue/15 text-alert-blue'}`}>{t.period}</span><span className="text-xs text-slate-500">¥{t.avgPrice}/kWh</span></div>
            <div className="text-lg font-din font-bold text-white">{t.kwh} <span className="text-xs text-slate-400 font-normal">kWh</span></div><div className="text-sm text-electric mt-0.5">¥{t.amount.toLocaleString()}</div>
          </div>))}</div>
          <div className="mt-3 rounded-lg bg-dark-700/50 p-3 flex items-center gap-6">
            <div><div className="text-xs text-slate-500">服务费合计</div><div className="text-lg font-din font-bold text-[#4DA6FF]">¥{totalSvcFee.toFixed(2)}</div></div>
            <div><div className="text-xs text-slate-500">服务费/kWh</div><div className="text-lg font-din font-bold text-white">¥{avgSvcPerKwh.toFixed(3)}</div></div>
            <div><div className="text-xs text-slate-500">服务费占比</div><div className="text-lg font-din font-bold text-electric">{(svcFeeRatio * 100).toFixed(1)}%</div></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title"><DollarSign size={16} className="text-electric" />清分口径明细（{rangeLabel}）</div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg bg-dark-700/50 p-3 text-center"><div className="text-xs text-slate-400">电网分成</div><div className="text-xl font-din font-bold text-[#4DA6FF] mt-1">¥{gridTotal.toFixed(2)}</div></div>
          <div className="rounded-lg bg-dark-700/50 p-3 text-center"><div className="text-xs text-slate-400">物业分成</div><div className="text-xl font-din font-bold text-[#FF8C42] mt-1">¥{propTotal.toFixed(2)}</div></div>
          <div className="rounded-lg bg-dark-700/50 p-3 text-center"><div className="text-xs text-slate-400">运营方分成</div><div className="text-xl font-din font-bold text-electric mt-1">¥{opTotal.toFixed(2)}</div></div>
        </div>
        <div className="flex gap-3 mb-4">
          <span className="badge-success">已结算 {rangeCompleted}</span><span className="badge-info">充电中 {rangeCharging}</span><span className="badge-danger">异常终止 {rangeAbnormal}</span><span className="badge-warning">退款中 {rangeRefunding}</span>
        </div>
        {rangeSettlements.length > 0 && (<div className="overflow-hidden rounded-lg border border-surface-border"><table className="w-full text-sm">
          <thead><tr className="bg-dark-700/60 text-slate-400 text-xs"><th className="text-left px-3 py-2">订单号</th><th className="text-left px-3 py-2">站点</th><th className="text-right px-3 py-2">总金额</th><th className="text-right px-3 py-2">电网</th><th className="text-right px-3 py-2">物业</th><th className="text-right px-3 py-2">运营方</th><th className="text-center px-3 py-2">状态</th></tr></thead>
          <tbody>{settlePaged.map(r => { const o = chargingOrders.find(x => x.order_id === r.order_id); const ss = o?.settlement_status ?? '已结算'; return (
            <tr key={r.settlement_id} className="table-row cursor-pointer" onClick={() => window.location.href = '/orders'}>
              <td className="px-3 py-2 text-slate-300">{r.order_id}</td><td className="px-3 py-2 text-slate-400 text-xs">{getStationName(r.order_id)}</td><td className="px-3 py-2 text-right text-white">¥{r.total_amount}</td><td className="px-3 py-2 text-right text-[#4DA6FF]">¥{r.grid_share}</td><td className="px-3 py-2 text-right text-[#FF8C42]">¥{r.property_share}</td><td className="px-3 py-2 text-right text-electric">¥{r.operator_share}</td><td className="px-3 py-2 text-center"><span className={ss === '已结算' ? 'badge-success' : ss === '退款中' ? 'badge-danger' : 'badge-warning'}>{ss}</span></td>
            </tr>) })}</tbody>
        </table></div>)}
        {settleTotalPages > 1 && (<div className="flex items-center justify-center gap-2 mt-3">
          <button disabled={settlePage <= 1} onClick={() => setSettlePage(p => p - 1)} className="btn-ghost text-xs border border-surface-border disabled:opacity-30">上一页</button>
          <span className="text-xs text-slate-400">{settlePage}/{settleTotalPages}</span>
          <button disabled={settlePage >= settleTotalPages} onClick={() => setSettlePage(p => p + 1)} className="btn-ghost text-xs border border-surface-border disabled:opacity-30">下一页</button>
        </div>)}
        <Link to="/settlement" className="block mt-3 text-right text-xs text-electric hover:underline">查看完整报表 →</Link>
      </div>

      {showAlertModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAlertModal(false)}>
        <div className="w-full max-w-2xl max-h-[80vh] bg-dark-800 border border-surface-border rounded-xl shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
            <div className="flex items-center gap-2 text-white font-medium"><Bell size={18} className="text-alert-red" />待处理告警队列<span className="badge-danger text-[10px] ml-1">{allPending.length}</span></div>
            <button onClick={() => setShowAlertModal(false)} className="text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
            {allPending.map(a => { const d = alertDisp[a.alert_id]; return (
              <div key={a.alert_id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-dark-700/60 border border-surface-border/50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="badge-danger text-[10px] shrink-0">{a.alert_type}</span>
                  <span className="text-slate-300 font-mono text-xs shrink-0">{a.pile_id}</span>
                  <span className="text-slate-500 text-xs shrink-0">{a.triggered_at.slice(0, 16).replace('T', ' ')}</span>
                  <span className={`text-[10px] font-medium shrink-0 ${sevColor(a.severity)}`}>{a.severity}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => toggle(setAlertDisp, a.alert_id, 'sms')}>{actionBtn(!!d?.sms, '已发送', '短信通知', <MessageSquare size={10} />)}</button>
                  <button onClick={() => toggle(setAlertDisp, a.alert_id, 'sys')}>{actionBtn(!!d?.sys, '已发送', '系统告警', <Bell size={10} />)}</button>
                </div>
              </div>) })}
            {allPending.length === 0 && <div className="text-center text-slate-500 text-sm py-8">暂无待处理告警</div>}
          </div>
          <div className="px-5 py-3 border-t border-surface-border flex justify-end">
            <button onClick={handleAll} className="px-4 py-1.5 rounded-lg bg-electric/20 text-electric text-xs font-medium hover:bg-electric/30 transition-colors">全部处理</button>
          </div>
        </div>
      </div>)}
    </div>
  )
}
