import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Cpu, Wifi, Play, Square, Upload, Shield, AlertTriangle, ArrowUpDown, CheckSquare, Square as CheckboxSquare, ChevronDown, ChevronUp, FileCheck } from 'lucide-react'
import { useStore } from '@/store'

const sc: Record<string, string> = { '充电中': 'bg-alert-green', '空闲': 'bg-slate-400', '故障': 'bg-alert-red', '离线': 'bg-alert-orange' }
const sb: Record<string, string> = { '充电中': 'badge-success', '空闲': 'badge-info', '故障': 'badge-danger', '离线': 'badge-warning' }
const hc = (s: number) => s >= 80 ? 'text-alert-green' : s >= 60 ? 'text-alert-orange' : 'text-alert-red'
const hb = (s: number) => s >= 80 ? 'bg-alert-green' : s >= 60 ? 'bg-alert-orange' : 'bg-alert-red'
const now = () => new Date().toLocaleString('zh-CN')

type RE = { pile_id: string; action: string; oldStatus: string; newStatus: string; result: string; time: string }
type BM = { type: 'start' | 'stop' | 'upgrade' | null; selected: Set<string>; logs: Array<{ pile_id: string; status: string; time: string }>; upgrading: Set<string> }

export default function Devices() {
  const { chargingPiles, stations, safetyConfig, updatePileStatus } = useStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [stationFilter, setStationFilter] = useState('')
  const [bm, setBm] = useState<BM>({ type: null, selected: new Set(), logs: [], upgrading: new Set() })
  const [receipts, setReceipts] = useState<RE[]>([])
  const [rOpen, setROpen] = useState(false)
  const [delivered, setDelivered] = useState<Record<string, string>>({})
  const [auditMap] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {}
    chargingPiles.forEach((p) => { m[p.pile_id] = Math.random() > 0.3 })
    return m
  })
  const filtered = chargingPiles.filter((p) => {
    if (search && !p.pile_id.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && p.status !== statusFilter) return false
    if (typeFilter && p.pile_type !== typeFilter) return false
    if (stationFilter && p.station_id !== stationFilter) return false
    return true
  })
  const addR = useCallback((es: RE[]) => { setReceipts((p) => [...es, ...p]); setROpen(true) }, [])
  const closeBm = () => setBm({ type: null, selected: new Set(), logs: [], upgrading: new Set() })
  const selectAll = () => setBm((p) => ({ ...p, selected: p.selected.size === filtered.length ? new Set() : new Set(filtered.map((f) => f.pile_id)) }))
  const toggleSel = (id: string) => setBm((p) => { const n = new Set(p.selected); n.has(id) ? n.delete(id) : n.add(id); return { ...p, selected: n } })
  const executeBatch = () => {
    const es: RE[] = []; const ls: BM['logs'] = []; const t = now()
    bm.selected.forEach((id) => {
      const pile = chargingPiles.find((p) => p.pile_id === id)
      if (!pile) return
      if (bm.type === 'start') { updatePileStatus(id, '充电中'); es.push({ pile_id: id, action: '批量启动', oldStatus: pile.status, newStatus: '充电中', result: '成功', time: t }); ls.push({ pile_id: id, status: '成功', time: t }) }
      else if (bm.type === 'stop') { updatePileStatus(id, '空闲'); es.push({ pile_id: id, action: '批量停止', oldStatus: pile.status, newStatus: '空闲', result: '成功', time: t }); ls.push({ pile_id: id, status: '成功', time: t }) }
      else if (bm.type === 'upgrade') {
        setBm((p) => { const u = new Set(p.upgrading); u.add(id); return { ...p, upgrading: u, logs: [...p.logs, { pile_id: id, status: '升级中', time: t }] } })
        setTimeout(() => {
          const dt = now()
          setBm((p) => ({ ...p, logs: p.logs.map((l) => l.pile_id === id ? { ...l, status: '成功', time: dt } : l), upgrading: new Set([...p.upgrading].filter((x) => x !== id)) }))
          addR([{ pile_id: id, action: '固件升级', oldStatus: pile.firmware_version, newStatus: 'v2.3.0', result: '成功', time: dt }])
        }, 1500 + Math.random() * 2000)
      }
    })
    if (bm.type !== 'upgrade') { addR(es); setBm((p) => ({ ...p, logs: ls })) }
  }
  const doThreshold = (pid: string) => { const t = now(); setDelivered((p) => ({ ...p, [pid]: t })); addR([{ pile_id: pid, action: '阈值下发', oldStatus: '未下发', newStatus: `max:${safetyConfig.max_power_w}W temp:${safetyConfig.temp_threshold_c}°C`, result: '成功', time: t }]) }
  const doRecheck = (pid: string, conn: boolean) => { const t = now(); addR([{ pile_id: pid, action: '通信复查', oldStatus: conn ? '已连接' : '断开', newStatus: conn ? '正常' : '断连', result: conn ? '正常' : '仍断连', time: t }]) }
  const td = chargingPiles.length, on = chargingPiles.filter((p) => p.status !== '离线').length, ft = chargingPiles.filter((p) => p.status === '故障').length, gb = chargingPiles.filter((p) => p.gbt_connected).length

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-white flex items-center gap-2">
        <Cpu className="w-5 h-5 text-electric" />设备管理
        <span className="ml-2 text-xs bg-electric/15 text-electric px-2 py-0.5 rounded-full">{filtered.length}</span>
      </h1>
      <div className="grid grid-cols-4 gap-4">
        {[{ l: '总设备', v: td, i: Cpu, c: 'text-electric' }, { l: '在线', v: on, i: Wifi, c: 'text-alert-green' }, { l: '故障', v: ft, i: AlertTriangle, c: 'text-alert-red' }, { l: '国标已连接', v: gb, i: Shield, c: 'text-electric' }].map((s) => (
          <div key={s.l} className="card flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-dark-700 ${s.c}`}><s.i className="w-4 h-4" /></div>
            <div><div className="text-xs text-slate-400">{s.l}</div><div className={`text-lg font-semibold font-mono ${s.c}`}>{s.v}</div></div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索桩编号..." className="input-field pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-28">
              <option value="">全部状态</option><option value="充电中">充电中</option><option value="空闲">空闲</option><option value="故障">故障</option><option value="离线">离线</option>
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field w-28">
              <option value="">全部类型</option><option value="两轮">两轮</option><option value="三轮">三轮</option><option value="四轮">四轮</option>
            </select>
            <select value={stationFilter} onChange={(e) => setStationFilter(e.target.value)} className="input-field w-36">
              <option value="">全部站点</option>{stations.map((s) => <option key={s.station_id} value={s.station_id}>{s.name}</option>)}
            </select>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setBm({ type: 'start', selected: new Set(), logs: [], upgrading: new Set() })} className="btn-ghost text-xs flex items-center gap-1.5 border border-surface-border"><Play className="w-3 h-3" />批量启停</button>
            <button onClick={() => setBm({ type: 'upgrade', selected: new Set(), logs: [], upgrading: new Set() })} className="btn-ghost text-xs flex items-center gap-1.5 border border-surface-border"><Upload className="w-3 h-3" />固件批量升级</button>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="w-full">
            <thead><tr className="bg-dark-700">
              {['桩编号', '站点', '类型', '状态', '国标通信', '固件', '在线率', '健康度', '阈值下发', '通信复查', '安全审计', '操作'].map((h) => (
                <th key={h} className="text-xs text-slate-400 uppercase tracking-wider py-3 px-2 text-left font-medium whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">{h}{h === '在线率' && <ArrowUpDown className="w-3 h-3" />}</span>
                </th>))}
            </tr></thead>
            <tbody>{filtered.map((p, i) => (
              <motion.tr key={p.pile_id} className="table-row" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <td className="text-sm py-3 px-2 font-mono text-electric">{p.pile_id}</td>
                <td className="text-sm py-3 px-2 text-slate-300">{p.station_name}</td>
                <td className="text-sm py-3 px-2 text-slate-300">{p.pile_type}</td>
                <td className="text-sm py-3 px-2"><span className="inline-flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${sc[p.status]}`} /><span className={sb[p.status]}>{p.status}</span></span></td>
                <td className="text-sm py-3 px-2">
                  <span className="inline-flex items-center gap-1.5">
                    {p.gbt_connected ? <><span className="w-2 h-2 rounded-full bg-alert-green" /><span className="text-alert-green text-xs">已连接</span></> : <><span className="w-2 h-2 rounded-full bg-alert-red" /><span className="text-alert-red text-xs">断开</span></>}
                  </span>
                  <div className="text-[10px] text-slate-500">{p.last_heartbeat.slice(11, 19)}</div>
                </td>
                <td className="text-sm py-3 px-2"><span className="inline-flex items-center gap-1 text-slate-300 font-mono text-xs">{p.firmware_version !== 'v2.3.0' && <span className="w-1.5 h-1.5 rounded-full bg-alert-orange" />}{p.firmware_version}</span></td>
                <td className="text-sm py-3 px-2"><div className="flex items-center gap-1.5"><div className="w-12 h-1.5 bg-dark-500 rounded-full overflow-hidden"><div className="h-full bg-electric rounded-full" style={{ width: `${p.online_rate}%` }} /></div><span className="text-slate-300 font-mono text-xs">{p.online_rate}%</span></div></td>
                <td className="text-sm py-3 px-2"><div className="flex items-center gap-1.5"><div className="w-8 h-1.5 bg-dark-500 rounded-full overflow-hidden"><div className={`h-full ${hb(p.health_score)} rounded-full`} style={{ width: `${p.health_score}%` }} /></div><span className={`font-mono text-xs ${hc(p.health_score)}`}>{p.health_score}</span></div></td>
                <td className="text-sm py-3 px-2">
                  {delivered[p.pile_id] ? <span className="flex items-center gap-1"><FileCheck className="w-3.5 h-3.5 text-alert-green" /><span className="text-[10px] text-slate-400">{delivered[p.pile_id].slice(11, 19)}</span></span>
                    : <span className="flex items-center gap-1"><span className="text-xs text-slate-500">未下发</span><button onClick={() => doThreshold(p.pile_id)} className="text-[10px] text-electric hover:text-electric-light">下发</button></span>}
                </td>
                <td className="text-sm py-3 px-2">
                  {p.gbt_connected ? <span className="flex items-center gap-1"><span className="badge-success text-[10px] !px-1.5 !py-0">正常</span><span className="text-[10px] text-slate-500">{p.last_heartbeat.slice(11, 19)}</span></span>
                    : <span className="flex items-center gap-1"><span className="badge-danger text-[10px] !px-1.5 !py-0">断连</span><button onClick={() => doRecheck(p.pile_id, p.gbt_connected)} className="text-[10px] text-electric hover:text-electric-light">复查</button></span>}
                </td>
                <td className="text-sm py-3 px-2">
                  <span className="flex items-center gap-1">
                    {auditMap[p.pile_id] ? <span className="badge-success text-[10px] !px-1.5 !py-0">已审计</span> : <span className="badge-warning text-[10px] !px-1.5 !py-0">待审计</span>}
                    <Link to="/safety" className="text-[10px] text-electric hover:text-electric-light">审计</Link>
                  </span>
                </td>
                <td className="text-sm py-3 px-2">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => { const old = p.status; const nx = p.status === '充电中' ? '空闲' : '充电中'; updatePileStatus(p.pile_id, nx); addR([{ pile_id: p.pile_id, action: nx === '充电中' ? '启动' : '停止', oldStatus: old, newStatus: nx, result: '成功', time: now() }]) }}
                      className={`p-1.5 rounded-md transition-colors ${p.status === '充电中' ? 'bg-alert-red/15 text-alert-red hover:bg-alert-red/25' : 'bg-alert-green/15 text-alert-green hover:bg-alert-green/25'}`}>
                      {p.status === '充电中' ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <Link to={`/devices/${p.pile_id}`} className="p-1.5 rounded-md bg-dark-700 text-slate-400 hover:text-electric hover:bg-dark-600 transition-colors"><Wifi className="w-3.5 h-3.5" /></Link>
                    <Link to={`/devices/${p.pile_id}`} className="p-1.5 rounded-md bg-dark-700 text-slate-400 hover:text-electric hover:bg-dark-600 transition-colors"><Upload className="w-3.5 h-3.5" /></Link>
                    <Link to={`/devices/${p.pile_id}`} className="text-electric hover:text-electric-light transition-colors text-xs ml-0.5">详情</Link>
                  </div>
                </td>
              </motion.tr>))}
            </tbody>
          </table>
        </div>
      </div>
      <AnimatePresence>{bm.type && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="bg-dark-800 border border-surface-border rounded-2xl p-5 w-[520px] max-h-[80vh] overflow-auto" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">{bm.type === 'start' ? '批量启动' : bm.type === 'stop' ? '批量停止' : '固件批量升级'}</h3>
              <button onClick={closeBm} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>
            <div className="flex items-center justify-between mb-3">
              <button onClick={selectAll} className="text-xs text-electric hover:text-electric-light flex items-center gap-1">
                {bm.selected.size === filtered.length ? <CheckSquare className="w-3.5 h-3.5" /> : <CheckboxSquare className="w-3.5 h-3.5" />}
                {bm.selected.size === filtered.length ? '取消全选' : '全选'}
              </button>
              <span className="text-xs text-slate-400">已选 {bm.selected.size} 台</span>
            </div>
            <div className="space-y-1 max-h-48 overflow-auto mb-4">
              {filtered.map((p) => (
                <label key={p.pile_id} onClick={() => toggleSel(p.pile_id)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-dark-600 cursor-pointer">
                  {bm.selected.has(p.pile_id) ? <CheckSquare className="w-4 h-4 text-electric" /> : <CheckboxSquare className="w-4 h-4 text-slate-500" />}
                  <span className="text-sm font-mono text-electric">{p.pile_id}</span>
                  <span className="text-xs text-slate-400 ml-2">{p.station_name}</span>
                  <span className={`ml-auto text-xs ${sb[p.status]}`}>{p.status}</span>
                </label>))}
            </div>
            {bm.type === 'upgrade' ? (
              <button onClick={executeBatch} disabled={bm.selected.size === 0 || bm.upgrading.size > 0} className="btn-primary w-full disabled:opacity-40">
                {bm.upgrading.size > 0 ? `升级中 (${bm.upgrading.size}台)...` : '执行升级'}
              </button>
            ) : (
              <button onClick={executeBatch} disabled={bm.selected.size === 0} className="btn-primary w-full disabled:opacity-40">
                {bm.type === 'start' ? '执行启动' : '执行停止'}
              </button>
            )}
            {bm.logs.length > 0 && (
              <div className="mt-4 border-t border-surface-border pt-3">
                <div className="text-xs text-slate-400 mb-2">操作回执</div>
                <div className="space-y-1 max-h-32 overflow-auto">
                  {bm.logs.map((l, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-electric">{l.pile_id}</span>
                      <span className={l.status === '成功' ? 'text-alert-green' : 'text-alert-orange'}>{l.status}</span>
                      <span className="text-slate-500 ml-auto">{l.time.slice(11, 19)}</span>
                    </div>))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
      <div className="card">
        <button onClick={() => setROpen(!rOpen)} className="flex items-center justify-between w-full">
          <span className="section-title !mb-0"><FileCheck className="w-4 h-4 text-electric" />操作回执{receipts.length > 0 && <span className="text-xs bg-electric/15 text-electric px-2 py-0.5 rounded-full ml-2">{receipts.length}</span>}</span>
          {rOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        <AnimatePresence>{rOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            {receipts.length === 0 ? <p className="text-sm text-slate-500 py-4 text-center">暂无操作回执</p> : (
              <div className="mt-3 space-y-1 max-h-60 overflow-auto">
                {receipts.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg bg-dark-700/50">
                    <span className="text-slate-500 font-mono">{r.time.slice(11, 19)}</span>
                    <span className="font-mono text-electric">{r.pile_id}</span>
                    <span className="text-slate-300">{r.action}</span>
                    <span className="text-slate-400">{r.oldStatus}</span><span className="text-slate-500">→</span><span className="text-white">{r.newStatus}</span>
                    <span className={`ml-auto ${r.result === '成功' ? 'text-alert-green' : r.result === '仍断连' ? 'text-alert-red' : 'text-alert-orange'}`}>{r.result}</span>
                  </div>))}
              </div>
            )}
          </motion.div>
        )}</AnimatePresence>
      </div>
    </div>
  )
}
