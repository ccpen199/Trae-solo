import React, { useState, useMemo, useRef } from 'react'
import { MapContainer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { useStore } from '@/store'
import { X, Wrench, FileWarning, ChevronRight } from 'lucide-react'
import type { ChargingPile } from '@/types'
import 'leaflet/dist/leaflet.css'

const SC: Record<string, string> = { '运营中': '#00E5A0', '维护中': '#FF8C42', '已关闭': '#FF4757' }
const PC: Record<string, string> = { '充电中': '#00E5A0', '空闲': '#60A5FA', '故障': '#FF4757', '离线': '#FF8C42' }
const REGIONS = ['全部', '南山区', '福田区', '龙华区', '宝安区', '罗湖区']
const STATUSES = ['全部', '运营中', '维护中', '已关闭']

function FlyToCenter({ center }: { center: [number, number] }) { const map = useMap(); map.flyTo(center, 15, { duration: 0.8 }); return null }
function MapResizer({ open }: { open: boolean }) { const map = useMap(); React.useEffect(() => { setTimeout(() => map.invalidateSize(), 350) }, [open, map]); return null }
function PileSummary({ piles }: { piles: ChargingPile[] }) { const c = { '充电中': 0, '空闲': 0, '故障': 0, '离线': 0 }; piles.forEach(p => { if (c[p.status] !== undefined) c[p.status]++ }); return <div className="flex gap-2 flex-wrap text-[11px] mb-1">{Object.entries(c).map(([k, v]) => <span key={k} style={{ color: PC[k] }}>{k} {v}</span>)}</div> }

export default function ChargingMap() {
  const { stations, chargingPiles, alertRecords, settlementDetails, chargingOrders, handleAlert } = useStore()
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('全部')
  const [status, setStatus] = useState('全部')
  const [pileSearch, setPileSearch] = useState('')
  const [propertyOwner, setPropertyOwner] = useState('全部')
  const [faultOnly, setFaultOnly] = useState(false)
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null)
  const [selectedStation, setSelectedStation] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const alertRef = useRef<HTMLDivElement>(null)

  const propertyOwners = useMemo(() => ['全部', ...Array.from(new Set(stations.map(s => s.property_owner)))], [stations])
  const stationPilesMap = useMemo(() => {
    const m = new Map<string, typeof chargingPiles>()
    chargingPiles.forEach(p => { const arr = m.get(p.station_id) || []; arr.push(p); m.set(p.station_id, arr) })
    return m
  }, [chargingPiles])

  const filtered = useMemo(() => stations.filter(s => {
    if (search && !s.name.includes(search)) return false
    if (region !== '全部' && s.region !== region) return false
    if (status !== '全部' && s.status !== status) return false
    if (propertyOwner !== '全部' && s.property_owner !== propertyOwner) return false
    if (faultOnly && s.fault_count === 0) return false
    if (pileSearch) { const piles = stationPilesMap.get(s.station_id) || []; if (!piles.some(p => p.pile_id.toLowerCase().includes(pileSearch.toLowerCase()))) return false }
    return true
  }), [stations, stationPilesMap, search, region, status, pileSearch, propertyOwner, faultOnly])

  const ds = detailId ? stations.find(s => s.station_id === detailId) : null
  const dp = detailId ? (stationPilesMap.get(detailId) || []) : []

  const getPropShare = (sid: string) => { const ids = new Set(chargingOrders.filter(o => o.station_id === sid).map(o => o.order_id)); return settlementDetails.filter(sd => ids.has(sd.order_id)).reduce((s, sd) => s + sd.property_share, 0) }
  const getAlerts = (sid: string) => { const ids = new Set((stationPilesMap.get(sid) || []).map(p => p.pile_id)); return alertRecords.filter(a => ids.has(a.pile_id)) }

  const openDetail = (sid: string, lat?: number, lng?: number) => {
    setDetailId(sid)
    if (lat !== undefined && lng !== undefined) { setFlyTarget([lat, lng]); setSelectedStation(sid); setTimeout(() => setFlyTarget(null), 1000) }
  }
  const openAlerts = (sid: string) => { openDetail(sid); setTimeout(() => alertRef.current?.scrollIntoView({ behavior: 'smooth' }), 200) }

  const statusBadge = (s: string, lg?: boolean) => {
    const c = SC[s] || '#999'
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${lg ? 'text-sm' : ''}`} style={{ backgroundColor: c + '20', color: c }}><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />{s === '运营中' ? '正常运营' : s === '维护中' ? '维护中' : s === '已关闭' ? '已停运' : s}</span>
  }
  const pileBadge = (s: string) => { const c = PC[s] || '#999'; return <span className="px-1 rounded text-[10px] font-medium" style={{ backgroundColor: c + '20', color: c }}>{s}</span> }

  const selCls = "w-full mb-2 px-3 py-1.5 rounded-lg bg-dark-700 border border-surface-border text-slate-200 text-sm placeholder-slate-500 outline-none focus:border-electric/50 transition"

  return (
    <div className="relative h-[calc(100vh-7.5rem)] rounded-xl overflow-hidden flex">
      <div className="flex-1 transition-all duration-300">
        <MapContainer
          center={[22.5431, 114.0579]}
          zoom={12}
          className="h-full w-full z-0"
          attributionControl={false}
          style={{
            backgroundColor: '#0A1628',
            backgroundImage:
              'radial-gradient(circle at 35% 40%, rgba(0,229,160,0.16), transparent 18rem), linear-gradient(rgba(77,166,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(77,166,255,0.08) 1px, transparent 1px)',
            backgroundSize: 'auto, 48px 48px, 48px 48px',
          }}
        >
          {flyTarget && <FlyToCenter center={flyTarget} />}
          <MapResizer open={!!detailId} />
          {filtered.map(s => {
            const color = SC[s.status] || '#999'
            const piles = stationPilesMap.get(s.station_id) || []
            return (
              <React.Fragment key={s.station_id}>
                {s.fault_count > 0 && <CircleMarker center={[s.latitude, s.longitude]} radius={26} pathOptions={{ color: '#FF4757', fillColor: '#FF4757', fillOpacity: 0.08, weight: 1, dashArray: '4 4' }} />}
                <CircleMarker center={[s.latitude, s.longitude]} radius={20} pathOptions={{ color, fillColor: color, fillOpacity: 0.15, weight: 0 }} />
                <CircleMarker center={[s.latitude, s.longitude]} radius={12} pathOptions={{ color, fillColor: color, fillOpacity: 0.6, weight: 2 }}
                  eventHandlers={{ click: () => openDetail(s.station_id, s.latitude, s.longitude) }}>
                  <Popup><div className="text-sm min-w-[220px]" style={{ color: '#1a1a2e' }}><div className="font-bold text-base mb-1">{s.name}</div><div className="text-gray-500 text-xs mb-1">{s.address} · {s.region}</div><PileSummary piles={piles} /><div className="text-xs text-blue-600 mt-1">点击标记查看详情 →</div></div></Popup>
                </CircleMarker>
              </React.Fragment>
            )
          })}
        </MapContainer>
      </div>

      <div className={`transition-all duration-300 overflow-hidden border-l border-surface-border bg-dark-800/95 backdrop-blur-md ${detailId ? 'w-[380px]' : 'w-0'}`}>
        {ds && (
          <div className="w-[380px] h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-surface-border shrink-0">
              <h3 className="text-sm font-semibold text-slate-200 truncate">{ds.name}</h3>
              <button onClick={() => setDetailId(null)} className="text-slate-400 hover:text-slate-200 transition"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="flex items-center gap-2 flex-wrap">{statusBadge(ds.status, true)}<span className="text-slate-400">{ds.region}</span><span className="text-slate-500">{ds.address}</span></div>

              <section>
                <div className="font-medium text-slate-300 mb-2 flex items-center gap-1"><ChevronRight size={12} />桩号列表</div>
                <div className="space-y-1">{dp.map(p => (
                  <div key={p.pile_id} className="flex items-center justify-between py-1 px-2 rounded bg-dark-700/50">
                    <a href={`/devices/${p.pile_id}`} className="font-mono text-blue-400 hover:underline">{p.pile_id}</a>
                    <span className="flex items-center gap-1.5">{pileBadge(p.status)}<span className="text-slate-500">{p.pile_type}</span><span className={`w-1.5 h-1.5 rounded-full ${p.gbt_connected ? 'bg-green-500' : 'bg-red-400'}`} /><span className="text-slate-500 text-[10px]">{p.firmware_version}</span><span className="text-slate-400 text-[10px]">{(p.online_rate * 100).toFixed(0)}%</span></span>
                  </div>
                ))}</div>
              </section>

              {dp.some(p => p.status === '故障') && (
                <section>
                  <div className="font-medium text-slate-300 mb-2 flex items-center gap-1"><FileWarning size={12} />故障原因</div>
                  <div className="space-y-1">{dp.filter(p => p.status === '故障').flatMap(p =>
                    alertRecords.filter(a => a.pile_id === p.pile_id && a.status === '待处理').map(f => (
                      <div key={f.alert_id} className="py-1 px-2 rounded bg-red-900/20 border border-red-800/30">
                        <span className="font-mono text-red-400">{p.pile_id}</span><span className="text-red-300 ml-2">{f.alert_type}</span><span className="text-slate-500 ml-2">{f.severity}</span><span className="text-slate-500 ml-2">{f.triggered_at.slice(0, 16)}</span>
                      </div>
                    ))
                  )}</div>
                </section>
              )}

              {ds.status === '维护中' && (
                <section>
                  <div className="font-medium text-slate-300 mb-2 flex items-center gap-1"><Wrench size={12} />维护工单</div>
                  <div className="py-2 px-3 rounded bg-orange-900/20 border border-orange-800/30">
                    <div className="flex items-center justify-between mb-1"><span className="font-mono text-orange-400">WO-{ds.station_id}</span><span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-500/20 text-orange-400">进行中</span></div>
                    <div className="text-slate-400">类型: 定期检修 · 创建: 2024-12-01</div>
                  </div>
                </section>
              )}

              <section>
                <div className="font-medium text-slate-300 mb-2 flex items-center gap-1"><ChevronRight size={12} />物业分成</div>
                <div className="py-2 px-3 rounded bg-dark-700/50">
                  <div className="flex items-center justify-between mb-1"><span className="text-slate-400">物业方</span><span className="text-slate-200">{ds.property_owner}</span></div>
                  <div className="flex items-center justify-between mb-1"><span className="text-slate-400">本月分成</span><span className="text-emerald-400 font-medium">¥{getPropShare(ds.station_id).toFixed(2)}</span></div>
                  {(() => { const so = chargingOrders.filter(o => o.station_id === ds.station_id); return <div className="text-slate-500">已结算 {so.filter(o => o.settlement_status === '已结算').length} · 待结算 {so.filter(o => o.settlement_status === '待结算').length}</div> })()}
                </div>
              </section>

              <section ref={alertRef}>
                <div className="font-medium text-slate-300 mb-2 flex items-center gap-1"><FileWarning size={12} />告警明细</div>
                {(() => { const al = getAlerts(ds.station_id); return al.length === 0 ? <div className="text-slate-500 py-2">暂无告警</div> : (
                  <div className="space-y-1">{al.map(a => (
                    <div key={a.alert_id} className="flex items-center justify-between py-1 px-2 rounded bg-dark-700/50">
                      <span className="flex items-center gap-1.5">
                        <span className={`px-1 rounded text-[10px] font-medium ${a.status === '待处理' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{a.status}</span>
                        <span className="text-slate-300">{a.alert_type}</span><span className="font-mono text-slate-400">{a.pile_id}</span><span className="text-slate-500">{a.severity}</span><span className="text-slate-500 text-[10px]">{a.triggered_at.slice(0, 16)}</span>
                      </span>
                      {a.status === '待处理' && <button onClick={() => handleAlert(a.alert_id)} className="px-2 py-0.5 rounded text-[10px] bg-electric/20 text-electric hover:bg-electric/30 transition ml-2 shrink-0">处理</button>}
                    </div>
                  ))}</div>
                )})()}
              </section>
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-4 left-4 z-10 flex flex-col gap-3" style={{ maxHeight: 'calc(100vh - 8.5rem)', overflowY: 'auto' }}>
        <div className="bg-dark-800/80 backdrop-blur-md rounded-xl p-4 border border-surface-border w-64 shadow-card">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">站点筛选</h3>
          <input type="text" placeholder="搜索站点名称" value={search} onChange={e => setSearch(e.target.value)} className={selCls} />
          <input type="text" placeholder="搜索桩号 (如 P0001)" value={pileSearch} onChange={e => setPileSearch(e.target.value)} className={selCls} />
          <select value={region} onChange={e => setRegion(e.target.value)} className={selCls}>{REGIONS.map(r => <option key={r} value={r}>{r === '全部' ? '全部区域' : r}</option>)}</select>
          <select value={status} onChange={e => setStatus(e.target.value)} className={selCls}>{STATUSES.map(s => <option key={s} value={s}>{s === '全部' ? '全部状态' : s}</option>)}</select>
          <select value={propertyOwner} onChange={e => setPropertyOwner(e.target.value)} className={selCls}>{propertyOwners.map(p => <option key={p} value={p}>{p === '全部' ? '全部物业' : p}</option>)}</select>
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input type="checkbox" checked={faultOnly} onChange={e => setFaultOnly(e.target.checked)} className="w-3.5 h-3.5 rounded accent-electric" />
            <span className="text-xs text-slate-300">仅显示故障站点</span>
          </label>
          <button onClick={() => { if (filtered.length > 0) openDetail(filtered[0].station_id, filtered[0].latitude, filtered[0].longitude) }} className="w-full py-1.5 rounded-lg bg-electric/20 text-electric text-sm font-medium hover:bg-electric/30 transition">应用筛选</button>
          <div className="mt-2 text-xs text-slate-400 text-center">匹配 {filtered.length} 个站点</div>
        </div>

        <div className="bg-dark-800/80 backdrop-blur-md rounded-xl p-3 border border-surface-border shadow-card">
          <div className="text-xs text-slate-400 mb-2">图例</div>
          <div className="flex flex-col gap-1.5">
            {Object.entries(SC).map(([label, color]) => <div key={label} className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} /><span className="text-xs text-slate-300">{label}</span></div>)}
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full border border-dashed border-red-400 bg-red-400/20" /><span className="text-xs text-slate-300">故障分布</span></div>
            <div className="mt-1 border-t border-surface-border pt-1.5">
              <div className="text-xs text-slate-500 mb-1">物业归属</div>
              {propertyOwners.filter(p => p !== '全部').map(p => { const count = stations.filter(s => s.property_owner === p).length; return count > 0 ? <div key={p} className="flex items-center justify-between text-xs py-0.5"><span className="text-slate-300">{p}</span><span className="text-slate-500">{count}站</span></div> : null })}
            </div>
          </div>
        </div>

        <div className="bg-dark-800/80 backdrop-blur-md rounded-xl p-3 border border-surface-border shadow-card">
          <h3 className="text-sm font-semibold text-slate-200 mb-2">筛选结果</h3>
          <div className="flex flex-col gap-2" style={{ maxHeight: 320, overflowY: 'auto' }}>
            {filtered.length === 0 && <div className="text-xs text-slate-500">无匹配站点</div>}
            {filtered.map(s => {
              const piles = stationPilesMap.get(s.station_id) || []
              const alertCount = getAlerts(s.station_id).length
              const isSelected = selectedStation === s.station_id
              return (
                <div key={s.station_id} onClick={() => openDetail(s.station_id, s.latitude, s.longitude)}
                  className={`p-2 rounded-lg border cursor-pointer transition hover:border-electric/50 ${isSelected ? 'border-electric/60 bg-electric/5' : 'border-surface-border bg-dark-700/50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-200">{s.name}</span>{statusBadge(s.status)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{piles.length}桩</span>
                    {s.fault_count > 0 && <span className="text-red-400">故障{s.fault_count}</span>}
                    {alertCount > 9 && <span className="px-1 py-0 rounded bg-red-500/20 text-red-400 text-[10px] cursor-pointer hover:bg-red-500/30" onClick={e => { e.stopPropagation(); openAlerts(s.station_id) }}>9+ 告警</span>}
                    <span className="text-slate-500">{s.property_owner}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
