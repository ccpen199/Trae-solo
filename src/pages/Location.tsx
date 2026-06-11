import { useState, useEffect } from "react"
import { MapContainer, TileLayer, CircleMarker, Circle, Polyline } from "react-leaflet"
import { Link } from "react-router-dom"
import "leaflet/dist/leaflet.css"
import {
  MapPin, Shield, Play, ChevronDown, Trash2, CircleDot, Triangle, X,
  AlertTriangle, ExternalLink, Clock, CheckCircle2, Bell,
} from "lucide-react"
import { useAppStore } from "@/store"
import { formatTime, getSeverityClass } from "@/utils/format"
import type { Geofence } from "@/types"

const RULE_MAP: Record<string, string> = { enter: "进入", exit: "离开", both: "进出" }
const LEVEL_MAP: Record<string, string> = { low: "低", medium: "中", high: "高" }
const SOURCE_COLORS: Record<string, string> = { gps: "#22C55E", wifi: "#3B82F6", cell: "#FBBF24", fusion: "#FFFFFF" }
const SOURCE_LABELS: Record<string, string> = { gps: "GPS", wifi: "WiFi", cell: "基站", fusion: "融合" }
const SEVERITY_LABEL: Record<string, string> = { critical: "紧急", high: "高", medium: "中", low: "低" }
const STATUS_LABEL: Record<string, string> = { pending: "待处理", acknowledged: "已响应", resolved: "已解决", closed: "已关闭" }
const STATUS_CLS: Record<string, string> = { pending: "bg-red-500/20 text-red-400", acknowledged: "bg-yellow-500/20 text-yellow-400", resolved: "bg-green-500/20 text-green-400", closed: "bg-gray-500/20 text-gray-400" }
const ROLE_LABELS: Record<string, string> = { guardian: "家长", relative: "亲属", school_admin: "学校" }
const NODE_ST: Record<string, string> = { pending: "待通知", notified: "已通知", responded: "已响应" }
const LEVEL_CLS: Record<string, string> = { high: "bg-red-500/20 text-red-400", medium: "bg-yellow-500/20 text-yellow-400", low: "bg-green-500/20 text-green-400" }

const getConf = (a: number) => a < 20 ? "High" : a < 50 ? "Medium" : "Low"
const getConfCls = (c: string) => c === "High" ? "text-green-400" : c === "Medium" ? "text-yellow-400" : "text-red-400"
const fmtHm = (iso?: string) => iso ? new Date(iso).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) : "--"

export default function Location() {
  const { devices, geofences, locations, alerts, workOrders, fetchDevices, fetchGeofences, fetchLocations, fetchAlerts, fetchWorkOrders, deleteGeofence } = useAppStore()
  const [selectedDevice, setSelectedDevice] = useState("")
  const [mapMode, setMapMode] = useState<"standard" | "fusion">("fusion")
  const [tab, setTab] = useState<"geofence" | "trajectory" | "breach">("geofence")
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [detailFence, setDetailFence] = useState<Geofence | null>(null)
  const [trajDate, setTrajDate] = useState(new Date().toISOString().slice(0, 10))
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => { fetchDevices(); fetchGeofences(); fetchAlerts(); fetchWorkOrders() }, [])
  useEffect(() => { if (!selectedDevice && devices.length > 0) setSelectedDevice(devices[0].id) }, [devices])
  useEffect(() => { if (selectedDevice) fetchLocations({ deviceId: selectedDevice }) }, [selectedDevice])

  const sortedLocs = locations.slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  const trajPts = sortedLocs.map((l) => [l.lat, l.lng] as [number, number])

  useEffect(() => {
    if (!isPlaying || trajPts.length < 2) return
    setProgress(0)
    const step = 100 / trajPts.length
    let cur = 0
    const timer = setInterval(() => { cur += step; if (cur >= 100) { cur = 100; setIsPlaying(false) }; setProgress(cur) }, 500)
    return () => clearInterval(timer)
  }, [isPlaying])

  const handlePlay = () => {
    if (!selectedDevice) return
    const from = new Date(trajDate).toISOString()
    const to = new Date(new Date(trajDate).getTime() + 86400000).toISOString()
    fetchLocations({ deviceId: selectedDevice, from, to }).then(() => setIsPlaying(true))
  }

  const fenceCenter = (f: Geofence): [number, number] => [f.coordinates[0].lat, f.coordinates[0].lng]
  const isBreached = (f: Geofence) =>
    !f.enabled || (selectedDevice && locations.some((l) => {
      const d = Math.sqrt((l.lat - f.coordinates[0].lat) ** 2 + (l.lng - f.coordinates[0].lng) ** 2)
      return d * 111000 > (f.radius ?? 500)
    }))

  const markerPos = selectedDevice ? devices.find((d) => d.id === selectedDevice)?.lastLocation : null
  const geoAlerts = alerts.filter((a) => a.type === "geofence")
  const activeBreach = geoAlerts.filter((a) => a.status === "pending" || a.status === "acknowledged")
  const breachedFences = geofences.filter((f) => isBreached(f))
  const latestLoc = locations.length > 0 ? [...locations].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] : null
  const markerColor = mapMode === "fusion" && latestLoc ? (SOURCE_COLORS[latestLoc.mode] || "#1A6DFF") : "#1A6DFF"

  const srcCounts = locations.reduce<Record<string, number>>((acc, l) => { acc[l.mode] = (acc[l.mode] || 0) + 1; return acc }, {})
  const locBefore = (ts: string) => {
    const t = new Date(ts).getTime()
    const before = sortedLocs.filter(l => new Date(l.timestamp).getTime() <= t)
    return before.length > 0 ? before[before.length - 1] : null
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 bg-guardian-dark-800 border-b border-guardian-dark-500">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-guardian-blue" />
          <h1 className="text-lg font-semibold text-white">定位与围栏</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)}
              className="appearance-none bg-guardian-dark-700 text-sm text-gray-200 rounded-lg px-3 py-1.5 pr-7 border border-guardian-dark-500 focus:outline-none focus:border-guardian-blue">
              <option value="">选择设备</option>
              {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          <div className="flex rounded-lg overflow-hidden border border-guardian-dark-500">
            {(["standard", "fusion"] as const).map((m) => (
              <button key={m} onClick={() => setMapMode(m)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${mapMode === m ? "bg-guardian-blue text-white" : "bg-guardian-dark-700 text-gray-400"}`}>
                {m === "standard" ? "标准" : "融合"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {breachedFences.length > 0 && (
        <Link to="/sos" className="flex items-center justify-center gap-2 py-2 bg-red-600/90 text-white text-sm font-medium animate-pulse hover:bg-red-600 transition">
          <AlertTriangle className="w-4 h-4" />
          ⚠ 围栏越界告警: {breachedFences[0].name}{breachedFences.length > 1 ? ` 等${breachedFences.length}个` : ""} - 点击查看
        </Link>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[70%] relative">
          <MapContainer center={[39.9042, 116.4074]} zoom={13} className="h-full w-full" style={{ background: "#0B0F1A" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://osm.org/copyright">OSM</a>' />
            {markerPos && (
              <CircleMarker center={[markerPos.lat, markerPos.lng]} radius={10}
                pathOptions={{ color: markerColor, fillColor: markerColor, fillOpacity: 0.8, weight: 2 }} />
            )}
            {mapMode === "fusion" && locations.map((l) => (
              <CircleMarker key={l.id} center={[l.lat, l.lng]} radius={5}
                pathOptions={{ color: SOURCE_COLORS[l.mode], fillColor: SOURCE_COLORS[l.mode], fillOpacity: 0.7, weight: 1 }} />
            ))}
            {geofences.map((f) => {
              const br = isBreached(f); const color = br ? "#EF4444" : "#1A6DFF"; const hl = highlightId === f.id
              return f.type === "circle" ? (
                <Circle key={f.id} center={fenceCenter(f)} radius={f.radius ?? 500}
                  pathOptions={{ color, dashArray: "8 4", weight: hl ? 3 : 2, fillOpacity: hl ? 0.12 : 0.06 }} />
              ) : (
                <Polyline key={f.id} positions={f.coordinates.map((c) => [c.lat, c.lng])}
                  pathOptions={{ color, dashArray: "8 4", weight: hl ? 3 : 2 }} />
              )
            })}
            {tab === "trajectory" && trajPts.length > 1 && (
              <Polyline positions={trajPts} pathOptions={{ color: "#FF6B35", weight: 3 }} />
            )}
          </MapContainer>

          {mapMode === "fusion" && (
            <div className="absolute top-4 right-4 bg-guardian-dark-800/90 backdrop-blur rounded-lg px-3 py-2 text-xs space-y-1">
              {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: SOURCE_COLORS[k] }} />
                  <span className="text-gray-300">{v}</span>
                </div>
              ))}
            </div>
          )}

          {selectedDevice && (
            <div className="absolute bottom-4 left-4 bg-guardian-dark-800/90 backdrop-blur rounded-lg px-3 py-2 text-xs text-gray-300 space-y-0.5">
              {latestLoc ? (
                <>
                  <div>精度: {latestLoc.accuracy}m · 更新: {formatTime(latestLoc.timestamp)}</div>
                  <div>定位来源: {SOURCE_LABELS[latestLoc.mode] ?? latestLoc.mode}</div>
                  <div>置信度: <span className={getConfCls(getConf(latestLoc.accuracy))}>{getConf(latestLoc.accuracy)}</span></div>
                  {latestLoc.speed > 0 && <div>速度: {latestLoc.speed} km/h</div>}
                </>
              ) : <div className="text-gray-500">等待定位数据...</div>}
              <div className="mt-1 pt-1 border-t border-guardian-dark-500 space-y-0.5">
                {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SOURCE_COLORS[k] }} />
                    <span>{v}: {srcCounts[k] ?? 0}点</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-[30%] bg-guardian-dark-800 border-l border-guardian-dark-500 flex flex-col">
          <div className="flex border-b border-guardian-dark-500">
            {(["geofence", "trajectory", "breach"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === t ? "text-guardian-blue border-b-2 border-guardian-blue" : "text-gray-400"}`}>
                {t === "geofence" ? "电子围栏" : t === "trajectory" ? "历史轨迹" : "越界记录"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {tab === "geofence" ? (
              <div className="space-y-2">
                {geofences.map((f) => {
                  const br = isBreached(f); const hl = highlightId === f.id
                  const lastA = geoAlerts.filter(a => a.deviceId === f.deviceId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
                  const nSum = lastA?.notificationChain.map(n => `${ROLE_LABELS[n.role] ?? n.role}·${NODE_ST[n.status] ?? n.status}`).join(" / ")
                  return (
                    <div key={f.id} onClick={() => setHighlightId(hl ? null : f.id)} onDoubleClick={() => setDetailFence(f)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${hl ? "border-guardian-blue bg-guardian-dark-600" : "border-guardian-dark-500 bg-guardian-dark-700 hover:border-guardian-dark-500/80"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {f.type === "circle" ? <CircleDot className="w-4 h-4 text-guardian-blue" /> : <Triangle className="w-4 h-4 text-guardian-blue" />}
                          <span className="text-sm text-gray-200 font-medium">{f.name}</span>
                          {br && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">越界{activeBreach.length > 0 ? `(${activeBreach.length})` : ""}</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${LEVEL_CLS[f.alertLevel] ?? ""}`}>{LEVEL_MAP[f.alertLevel]}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${f.rule === "both" ? "bg-guardian-blue/20 text-guardian-blue" : "bg-guardian-orange/20 text-guardian-orange"}`}>{RULE_MAP[f.rule]}</span>
                          <button onClick={(e) => { e.stopPropagation(); deleteGeofence(f.id) }} className="text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Shield className={`w-3 h-3 ${f.enabled ? "text-guardian-green" : "text-gray-500"}`} />
                        <span className="text-[11px] text-gray-400">{f.enabled ? "已启用" : "已禁用"}</span>
                      </div>
                      {lastA && (
                        <div className="mt-1.5 pt-1.5 border-t border-guardian-dark-500/50 space-y-0.5">
                          <div className="text-[10px] text-gray-400">最近越界: {formatTime(lastA.timestamp)} · <span className={STATUS_CLS[lastA.status]}>{STATUS_LABEL[lastA.status]}</span></div>
                          {nSum && <div className="text-[10px] text-gray-500">{nSum}</div>}
                          {(() => { const wo = workOrders.find(w => w.alertId === lastA.id); const dl = new Date(lastA.timestamp).getTime() + 30*60000 - Date.now(); return wo
                            ? <div className="text-[10px] text-gray-400">工单: {wo.assignee} · {wo.status}</div>
                            : <div className="text-[10px] text-gray-600">无工单</div>
                          })()}
                          {(() => { const dl = new Date(lastA.timestamp).getTime() + 30*60000 - Date.now(); return dl > 0
                            ? <div className="text-[10px] text-guardian-orange">时限: 剩{Math.floor(dl/60000)}分</div>
                            : <div className="text-[10px] text-guardian-red">时限: 已超时</div>
                          })()}
                        </div>
                      )}
                    </div>
                  )
                })}
                {geofences.length === 0 && <p className="text-center text-gray-500 text-sm py-8">暂无围栏数据</p>}
              </div>
            ) : tab === "trajectory" ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">选择日期</label>
                  <input type="date" value={trajDate} onChange={(e) => setTrajDate(e.target.value)}
                    className="w-full bg-guardian-dark-700 border border-guardian-dark-500 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-guardian-blue" />
                </div>
                <button onClick={handlePlay} disabled={!selectedDevice}
                  className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-guardian-blue text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-guardian-blue/90 transition">
                  <Play className="w-4 h-4" /> 播放轨迹
                </button>
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>进度</span><span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 bg-guardian-dark-600 rounded-full overflow-hidden">
                    <div className="h-full bg-guardian-blue rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                {locations.length > 0 && (
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg bg-guardian-dark-700 text-[10px] space-y-0.5">
                      <div className="font-medium text-gray-300">轨迹证据</div>
                      <div className="text-gray-400">总距离: {(sortedLocs.reduce((s,l,i) => i===0?0:s+Math.sqrt((l.lat-sortedLocs[i-1].lat)**2+(l.lng-sortedLocs[i-1].lng)**2)*111, 0)).toFixed(1)}km</div>
                      <div className="text-gray-400">采样点: {locations.length}个 · 时段: {formatTime(sortedLocs[0]?.timestamp)} — {formatTime(sortedLocs[sortedLocs.length-1]?.timestamp)}</div>
                      <div className="text-gray-400">来源: GPS {srcCounts["gps"]??0} / WiFi {srcCounts["wifi"]??0} / 基站 {srcCounts["cell"]??0} / 融合 {srcCounts["fusion"]??0}</div>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                    {locations.slice(0, 30).map((l) => {
                      const conf = getConf(l.accuracy)
                      return (
                        <div key={l.id} className="flex items-center justify-between text-[11px] px-2 py-1 bg-guardian-dark-700 rounded">
                          <div className="flex items-center gap-1.5">
                            {mapMode === "fusion" && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SOURCE_COLORS[l.mode] }} />}
                            <span className="text-gray-300">[{l.lat.toFixed(4)}, {l.lng.toFixed(4)}]</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {mapMode === "fusion" && (
                              <>
                                <span className="text-gray-400">{SOURCE_LABELS[l.mode]}</span>
                                <span className={getConfCls(conf)}>{conf}</span>
                                <span className="text-gray-500">{l.accuracy}m</span>
                                {l.speed > 0 && <span className="text-gray-500">{l.speed}km/h</span>}
                              </>
                            )}
                            <span className="text-gray-500">{formatTime(l.timestamp)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {geoAlerts.length === 0 && <p className="text-center text-gray-500 text-sm py-8">暂无越界记录</p>}
                {geoAlerts.map((a) => {
                  const bl = locBefore(a.timestamp); const conf = bl ? getConf(bl.accuracy) : null
                  return (
                    <div key={a.id} className="p-3 rounded-lg border border-guardian-dark-500 bg-guardian-dark-700 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-200 font-medium truncate mr-2">{a.description}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${getSeverityClass(a.severity)}`}>{SEVERITY_LABEL[a.severity] ?? a.severity}</span>
                      </div>
                      <div className="text-[11px] space-y-0.5">
                        <div className="text-gray-400">触发时间: {new Date(a.timestamp).toLocaleString("zh-CN")}</div>
                        {mapMode === "fusion" && bl && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <span className="flex items-center gap-1">定位来源: <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: SOURCE_COLORS[bl.mode] }} />{SOURCE_LABELS[bl.mode]}</span>
                            <span>置信度: <span className={getConfCls(conf!)}>{conf}</span></span>
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] space-y-0.5">
                        <div className="text-gray-500">通知对象:</div>
                        {a.notificationChain.map((n, i) => (
                          <div key={i} className="flex items-center gap-1.5 pl-2">
                            {n.status === "responded" ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : n.status === "notified" ? <Bell className="w-3 h-3 text-blue-400" /> : <Clock className="w-3 h-3 text-gray-500" />}
                            <span className="text-gray-300">{ROLE_LABELS[n.role] ?? n.role}: {n.name}</span>
                            <span className={n.status === "responded" ? "text-green-400" : n.status === "notified" ? "text-blue-400" : "text-gray-500"}>{NODE_ST[n.status] ?? n.status}</span>
                            {n.notifiedAt && <span className="text-gray-600">({fmtHm(n.notifiedAt)})</span>}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={`px-1.5 py-0.5 rounded ${STATUS_CLS[a.status] ?? ""}`}>{STATUS_LABEL[a.status] ?? a.status}</span>
                        <Link to="/sos" className="flex items-center gap-1 text-guardian-blue hover:underline">完整处理记录 → <ExternalLink className="w-3 h-3" /></Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {detailFence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDetailFence(null)}>
          <div className="bg-guardian-dark-800 border border-guardian-dark-500 rounded-xl w-[420px] p-5 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">{detailFence.name}</h3>
              <button onClick={() => setDetailFence(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">类型</span><span className="text-gray-200">{detailFence.type === "circle" ? "圆形围栏" : "多边形围栏"}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">中心坐标</span><span className="text-gray-200">{detailFence.coordinates[0].lat.toFixed(4)}, {detailFence.coordinates[0].lng.toFixed(4)}</span></div>
              {detailFence.radius && <div className="flex justify-between"><span className="text-gray-400">半径</span><span className="text-gray-200">{detailFence.radius}m</span></div>}
              <div className="flex justify-between"><span className="text-gray-400">规则</span><span className="text-guardian-blue">{RULE_MAP[detailFence.rule]}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">时间</span><span className="text-gray-200">{detailFence.schedule.start} - {detailFence.schedule.end}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">告警级别</span><span className={`${detailFence.alertLevel === "high" ? "text-red-400" : detailFence.alertLevel === "medium" ? "text-guardian-orange" : "text-guardian-green"}`}>{LEVEL_MAP[detailFence.alertLevel]}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
