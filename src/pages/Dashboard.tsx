import { useEffect, useState, Fragment } from "react"
import { Link } from "react-router-dom"
import {
  Watch, AlertTriangle, Phone, Users, Bell, MapPin, Zap,
  ChevronDown, Settings, Shield, EyeOff, Lock, Activity,
  CheckCircle2, Clock, FileText, Database, ShieldCheck, XCircle,
  Upload, ToggleLeft, ToggleRight, UserCheck, UserX, ClipboardList,
} from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { useAppStore } from "@/store"
import { formatTime, getSeverityClass, getAlertTypeLabel, getRoleLabel } from "@/utils/format"
import type { Alert, NotificationNode } from "@/types"

const PIE_COLORS = ["#EF4444", "#FF6B35", "#FBBF24", "#3B82F6"]
const PIE_LABELS: Record<string, string> = { sos: "SOS", geofence: "围栏越界", behavior: "异常行为", battery: "电量低" }
const STATUS_DOT: Record<string, string> = { online: "bg-guardian-green", offline: "bg-gray-500", sos: "bg-guardian-red" }
const ROLE_BADGE: Record<string, string> = {
  primary_guardian: "bg-guardian-blue/20 text-guardian-blue",
  temporary_caregiver: "bg-guardian-orange/20 text-guardian-orange",
  school_admin: "bg-purple-500/20 text-purple-400",
}
const MARKER_COLORS = ["#00C48C", "#1A6DFF", "#FF6B35", "#A855F7", "#FBBF24"]
const LATEST_FW = "2.1.3"
const CHAIN_ROLE: Record<string, string> = { guardian: "家长", relative: "亲属", school_admin: "学校" }
const CHAIN_ST: Record<string, string> = { responded: "已响应", notified: "已通知", pending: "待通知" }
const CHAIN_CLS: Record<string, string> = { responded: "text-guardian-green", notified: "text-guardian-orange", pending: "text-gray-500" }
const ANOMALY_LABEL: Record<string, string> = { prolonged_stillness: "长时间静止", nighttime_movement: "夜间移动", signal_anomaly: "信号异常", unusual_route: "异常路线" }
const CG_PERMS: Record<string, string[]> = { primary_guardian: ["查看位置","通话","修改围栏","管理设备","隐私策略"], temporary_caregiver: ["查看位置","通话"], school_admin: ["查看位置"] }
const POLICY_LABEL: Record<string, string> = { face_blur: "人脸模糊", location_strip: "位置脱敏", call_encrypt: "通话加密", data_mask: "数据脱敏" }
const POLICY_ICON: Record<string, typeof EyeOff> = { face_blur: EyeOff, location_strip: MapPin, call_encrypt: Lock, data_mask: Database }
const CHANGE_LOG = ["2026-06-08 开启上课模式","2026-06-05 禁用陌生号码呼入","2026-06-01 限制应用+3"]

export default function Dashboard() {
  const { devices, alerts, members, callRecords, workOrders, privacyPolicies, anomalies, encryptionStatus, geofences,
    fetchDevices, fetchAlerts, fetchMembers, fetchCallRecords, fetchWorkOrders, fetchPrivacyPolicies, fetchAnomalies, fetchEncryptionStatus, fetchGeofences } = useAppStore()
  const [now, setNow] = useState(new Date())
  const [mapTooltip, setMapTooltip] = useState<string | null>(null)
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null)
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null)
  const [policyOverrides, setPolicyOverrides] = useState<Record<string, boolean>>({})
  const [upgradingDevices, setUpgradingDevices] = useState<Set<string>>(new Set())
  const [anomalyDispatch, setAnomalyDispatch] = useState<Record<string, string>>({})
  const [anomalyReview, setAnomalyReview] = useState<Record<string, string>>({})
  const [anomalyResult, setAnomalyResult] = useState<Record<string, string>>({})
  const [dispatchInput, setDispatchInput] = useState("")
  const [dispatchingId, setDispatchingId] = useState<string | null>(null)

  useEffect(() => { fetchDevices(); fetchAlerts(); fetchMembers(); fetchCallRecords(); fetchWorkOrders(); fetchPrivacyPolicies(); fetchAnomalies(); fetchEncryptionStatus(); fetchGeofences() }, [])
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t) }, [])

  const activeAlerts = alerts.filter((a) => a.status === "pending" || a.status === "acknowledged")
  const onlineDevices = devices.filter((d) => d.status === "online")
  const recentAlerts = [...alerts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)
  const pendingCount = alerts.filter((a) => a.status === "pending").length
  const ackCount = alerts.filter((a) => a.status === "acknowledged").length
  const resolvedCount = alerts.filter((a) => a.status === "resolved").length
  const recordings = callRecords.filter((c) => c.hasRecording).length
  const primaryGuardians = members.filter((m) => m.role === "primary_guardian")
  const tempCaregivers = members.filter((m) => m.role === "temporary_caregiver")

  const alertTypeCounts = ["sos", "geofence", "behavior", "battery"].map((type) => ({
    key: type, name: PIE_LABELS[type], value: alerts.filter((a) => a.type === type).length,
  }))

  const mapDevices = devices.filter((d) => d.lastLocation)
  const lats = mapDevices.map((d) => d.lastLocation!.lat)
  const lngs = mapDevices.map((d) => d.lastLocation!.lng)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
  const latR = maxLat - minLat || 0.01, lngR = maxLng - minLng || 0.01
  const markerPos = (d: typeof devices[0]) => {
    if (!d.lastLocation) return { x: 50, y: 50 }
    return { x: 15 + ((d.lastLocation.lng - minLng) / lngR) * 70, y: 15 + ((maxLat - d.lastLocation.lat) / latR) * 70 }
  }

  const devAlerts = (did: string) => activeAlerts.filter((a) => a.deviceId === did)
  const alertWo = (aid: string) => workOrders.find((wo) => wo.alertId === aid)
  const dlInfo = (ts: string) => { const r = new Date(ts).getTime() + 30 * 60000 - Date.now(); if (r <= 0) return { text: "已超时", cls: "text-guardian-red" }; const m = Math.floor(r / 60000); return { text: `剩${m}分`, cls: m < 10 ? "text-guardian-orange" : "text-guardian-green" } }
  const chainInline = (ch: NotificationNode[]) => ch.map((n) => `${CHAIN_ROLE[n.role]}·${CHAIN_ST[n.status]}`).join(" → ")
  const guardianOf = (did: string) => members.find((m) => m.role === "primary_guardian")?.name ?? "未绑定"
  const cgOf = () => members.filter((m) => m.role === "temporary_caregiver").map((m) => m.name).join(", ")

  const pEnabled = (cat: string) => policyOverrides[cat] ?? privacyPolicies.find(p => p.category === cat)?.enabled ?? false
  const togglePolicy = (cat: string) => setPolicyOverrides(prev => ({ ...prev, [cat]: !pEnabled(cat) }))
  const allEnabled = ["face_blur","location_strip","call_encrypt","data_mask"].every(c => pEnabled(c))

  const startUpgrade = (did: string) => { setUpgradingDevices(prev => new Set(prev).add(did)); setTimeout(() => setUpgradingDevices(prev => { const n = new Set(prev); n.delete(did); return n }), 3000) }

  const dispatchAnomaly = (aid: string) => { if (!dispatchInput.trim()) return; setAnomalyDispatch(prev => ({ ...prev, [aid]: dispatchInput.trim() })); setDispatchInput(""); setDispatchingId(null) }
  const reviewAnomaly = (aid: string, result: string) => { setAnomalyReview(prev => ({ ...prev, [aid]: result })) }
  const resolveAnomaly = (aid: string) => { setAnomalyResult(prev => ({ ...prev, [aid]: "已处理" })) }

  const unresolvedAnomalies = anomalies.filter((a) => !a.resolved && !anomalyResult[a.id]).length
  const activeGeofences = geofences.filter((g) => g.enabled).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">仪表盘总览</h1>
          <p className="text-sm text-gray-500 mt-1">{now.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}&nbsp;{now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        <Link to="/sos" className="relative p-2.5 rounded-lg bg-guardian-dark-700 border border-guardian-dark-500 hover:border-guardian-blue/50 transition-colors">
          <Bell className="w-5 h-5 text-gray-400" />
          {activeAlerts.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-guardian-red text-[10px] font-bold text-white flex items-center justify-center animate-pulse">{activeAlerts.length}</span>}
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { key: "devices", label: "在线设备", value: onlineDevices.length, total: devices.length, icon: Watch, color: "text-guardian-green", glow: "shadow-guardian-green/10", sub: `${devices.length - onlineDevices.length}离线 · ${devices.filter(d => d.status === "sos").length}SOS` },
          { key: "alerts", label: "活跃告警", value: activeAlerts.length, total: alerts.length, icon: AlertTriangle, color: activeAlerts.length > 0 ? "text-guardian-orange" : "text-gray-400", glow: "shadow-guardian-orange/10", sub: `${pendingCount}待处理 · ${ackCount}已响应 · ${resolvedCount}已解决` },
          { key: "calls", label: "今日通话", value: callRecords.length, total: callRecords.length, icon: Phone, color: "text-guardian-blue", glow: "shadow-guardian-blue/10", sub: `${callRecords.filter(c=>c.direction==="inbound").length}来电 · ${callRecords.filter(c=>c.direction==="outbound").length}去电 · ${callRecords.filter(c=>c.direction==="missed").length}未接 · ${recordings}录音` },
          { key: "members", label: "家庭成员", value: members.length, total: members.length, icon: Users, color: "text-purple-400", glow: "shadow-purple-500/10", sub: `${primaryGuardians.length}主监护 · ${tempCaregivers.length}临时看护 · ${members.filter(m=>m.role==="school_admin").length}校方` },
        ].map((s) => (
          <div key={s.key} className={`card-hover flex items-start gap-3 shadow-lg ${s.glow}`}>
            <div className={`p-2.5 rounded-xl bg-guardian-dark-600 ${s.color} mt-1`}><s.icon className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2"><p className="text-2xl font-bold text-white">{s.value}</p><span className="text-xs text-gray-500">/ {s.total}</span></div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-[10px] text-gray-400 mt-1 truncate">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 card relative overflow-hidden" style={{ minHeight: 340 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-guardian-dark-800 via-guardian-dark-700 to-[#0d1525]" />
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative z-10"><h3 className="text-sm font-medium text-gray-400 mb-2">设备位置</h3></div>
          {mapDevices.map((d, i) => {
            const pos = markerPos(d); const color = MARKER_COLORS[i % MARKER_COLORS.length]
            return (
              <div key={d.id} className="absolute z-10" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                <button onClick={() => setMapTooltip(mapTooltip === d.id ? null : d.id)} className="relative flex flex-col items-center">
                  <span className="absolute w-5 h-5 rounded-full animate-ping-slow opacity-30" style={{ backgroundColor: color }} />
                  <span className="w-3 h-3 rounded-full border-2 border-white/30 shadow-lg" style={{ backgroundColor: color }} />
                  <span className="mt-1.5 text-[10px] font-medium text-gray-300 whitespace-nowrap bg-guardian-dark-900/70 px-1.5 py-0.5 rounded">{d.name}</span>
                </button>
                {mapTooltip === d.id && (
                  <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-20 bg-guardian-dark-800 border border-guardian-dark-500 rounded-lg p-3 shadow-xl min-w-[220px] animate-fade-in text-[11px]">
                    <p className="text-white font-medium">{d.name} <span className={`ml-1 w-2 h-2 rounded-full inline-block ${STATUS_DOT[d.status]}`} /></p>
                    <div className="mt-1.5 space-y-1 text-gray-400">
                      <p>电量 {d.batteryLevel}% · 固件 v{d.firmwareVersion}{d.firmwareVersion !== LATEST_FW && <span className="ml-1 text-guardian-orange">需升级</span>}</p>
                      <p>主监护: {guardianOf(d.id)} · 临时看护: {cgOf() || "无"} · 告警: {devAlerts(d.id).length}条</p>
                      <p>{d.settings?.blockUnknownCalls ? "屏蔽陌生号码" : "允许陌生号码"} · 限制{d.settings?.restrictedApps.length ?? 0}个应用{d.settings?.classModeEnabled ? " · 上课模式" : ""}</p>
                      <p>电量阈值: 预警{d.settings?.batteryWarningThreshold ?? 20}% / 危急{d.settings?.batteryCriticalThreshold ?? 10}%</p>
                    </div>
                    <div className="flex gap-3 mt-2 pt-2 border-t border-guardian-dark-500">
                      <Link to="/location" state={{ deviceId: d.id }} className="text-guardian-blue hover:underline flex items-center gap-0.5"><MapPin className="w-3 h-3" />轨迹</Link>
                      <Link to="/devices" className="text-guardian-blue hover:underline flex items-center gap-0.5"><Settings className="w-3 h-3" />设置</Link>
                      <Link to="/privacy" className="text-guardian-blue hover:underline flex items-center gap-0.5"><Shield className="w-3 h-3" />隐私</Link>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="col-span-2 card flex flex-col">
          <h3 className="text-sm font-medium text-gray-400 mb-2">告警统计</h3>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart><Pie data={alertTypeCounts} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} stroke="none">{alertTypeCounts.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}</Pie>
                <Tooltip contentStyle={{ background: "#1A2035", border: "1px solid #2D3A54", borderRadius: 8, fontSize: 12 }} itemStyle={{ color: "#E5E7EB" }} /></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-3">
            {alertTypeCounts.map((d, i) => (
              <Link key={d.key} to={`/sos?type=${d.key}`} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />{d.name} <span className="text-gray-300 font-medium ml-auto">{d.value}</span>
              </Link>
            ))}
          </div>
          <h4 className="text-xs font-medium text-gray-500 mb-2">最近告警</h4>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {recentAlerts.map((a: Alert) => (
              <div key={a.id} onClick={() => setExpandedAlert(expandedAlert === a.id ? null : a.id)} className="cursor-pointer">
                <div className="flex items-center text-xs gap-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${getSeverityClass(a.severity)}`}>{getAlertTypeLabel(a.type)}</span>
                  <span className="text-gray-500 truncate flex-1">{a.description}</span>
                  <span className="text-gray-600 whitespace-nowrap">{formatTime(a.timestamp)}</span>
                  <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform flex-shrink-0 ${expandedAlert === a.id ? "rotate-180" : ""}`} />
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] text-gray-400 mt-0.5">
                  <span>{chainInline(a.notificationChain)}</span>
                  <span className={dlInfo(a.timestamp).cls}>时限:{dlInfo(a.timestamp).text}</span>
                  {alertWo(a.id) && <span>工单:{alertWo(a.id)!.assignee}({alertWo(a.id)!.status})</span>}
                  <span className={a.status === "resolved" || a.status === "closed" ? "text-guardian-green" : "text-guardian-orange"}>{a.status === "resolved" || a.status === "closed" ? "已复查" : "待复查"}</span>
                </div>
                {expandedAlert === a.id && (
                  <div className="mt-1.5 p-2 rounded-lg bg-guardian-dark-700/50 animate-fade-in space-y-1 text-[10px]">
                    <div className="font-medium text-gray-300">通知链路详情</div>
                    {a.notificationChain.map((n, ni) => (
                      <div key={ni} className="flex items-center gap-2">
                        {n.status === "responded" ? <CheckCircle2 className="w-3 h-3 text-guardian-green" /> : n.status === "notified" ? <Bell className="w-3 h-3 text-guardian-orange" /> : <Clock className="w-3 h-3 text-gray-500" />}
                        <span className="text-gray-300">{CHAIN_ROLE[n.role]}({n.name})</span>
                        <span className={CHAIN_CLS[n.status]}>{CHAIN_ST[n.status]}</span>
                        {n.notifiedAt && <span className="text-gray-600">{formatTime(n.notifiedAt)}</span>}
                        {n.respondedAt && <span className="text-guardian-green">响应{formatTime(n.respondedAt)}</span>}
                      </div>
                    ))}
                    <div className="flex items-center gap-2 pt-1 border-t border-guardian-dark-500"><FileText className="w-3 h-3 text-gray-500" /><span className="text-gray-400">工单:</span>{alertWo(a.id) ? <span className="text-gray-300">负责人:{alertWo(a.id)!.assignee} · 状态:{alertWo(a.id)!.status}</span> : <Link to="/sos" className="text-guardian-blue hover:underline">创建工单 →</Link>}</div>
                    <Link to="/sos" className="block text-guardian-blue hover:underline pt-1">查看完整告警 →</Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">设备状态</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {devices.map((d) => {
            const needFW = d.firmwareVersion !== LATEST_FW
            const upgrading = upgradingDevices.has(d.id)
            return (
              <div key={d.id} className="card-hover flex flex-col" onClick={() => setExpandedDevice(expandedDevice === d.id ? null : d.id)}>
                <div className="flex items-start gap-3 cursor-pointer">
                  <div className={`p-2 rounded-lg bg-guardian-dark-600 flex-shrink-0 ${d.status === "online" ? "text-guardian-green" : d.status === "sos" ? "text-guardian-red animate-pulse" : "text-gray-500"}`}><Watch className="w-5 h-5" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{d.name}</span>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[d.status] || "bg-gray-500"}`} />
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ml-auto ${expandedDevice === d.id ? "rotate-180" : ""}`} />
                    </div>
                    <div className="mt-1 flex items-center gap-2"><Zap className="w-3 h-3 text-gray-500" /><div className="flex-1 h-1.5 rounded-full bg-guardian-dark-500 overflow-hidden"><div className={`h-full rounded-full transition-all ${d.batteryLevel > 20 ? "bg-guardian-green" : "bg-guardian-orange"}`} style={{ width: `${d.batteryLevel}%` }} /></div><span className="text-[10px] text-gray-500 w-7 text-right">{d.batteryLevel}%</span></div>
                    <div className="mt-2 space-y-1 text-[10px] text-gray-400">
                      <div className="flex flex-wrap gap-x-3">
                        <span><span className="text-gray-500">主监护:</span> <span className="text-gray-300">{guardianOf(d.id)}</span></span>
                        <span><span className="text-gray-500">临时看护:</span> <span className="text-gray-300">{cgOf() || "无"}</span></span>
                      </div>
                      <div className="flex flex-wrap gap-x-3">
                        <span><span className="text-gray-500">固件:</span> <span className="text-gray-300">v{d.firmwareVersion}</span>{needFW && <span className="ml-1 px-1 rounded bg-guardian-orange/20 text-guardian-orange">需升级</span>}</span>
                        {needFW && !upgrading && <button onClick={e => { e.stopPropagation(); startUpgrade(d.id) }} className="px-1.5 py-0.5 rounded bg-guardian-blue/20 text-guardian-blue hover:bg-guardian-blue/30 flex items-center gap-0.5"><Upload className="w-2.5 h-2.5" />升级固件</button>}
                        {upgrading && <span className="px-1.5 py-0.5 rounded bg-guardian-blue/20 text-guardian-blue animate-pulse">升级中...</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-3">
                        <span>{d.settings?.blockUnknownCalls ? <span className="text-guardian-green">屏蔽陌生号码</span> : <span className="text-gray-500">允许陌生号码</span>}</span>
                        <span>限制{d.settings?.restrictedApps.length ?? 0}个应用{d.settings?.classModeEnabled ? <span className="ml-1 text-guardian-blue">上课模式</span> : ""}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-3">
                        <span>阈值: <span className="text-guardian-orange">预警{d.settings?.batteryWarningThreshold ?? 20}%</span> / <span className="text-guardian-red">危急{d.settings?.batteryCriticalThreshold ?? 10}%</span></span>
                        {devAlerts(d.id).length > 0 && <span className="text-guardian-orange">活跃告警:{devAlerts(d.id).length}条</span>}
                      </div>
                    </div>
                    <div className="mt-2 flex gap-3" onClick={(e) => e.stopPropagation()}>
                      <Link to="/location" state={{ deviceId: d.id }} className="text-[10px] text-guardian-blue hover:underline flex items-center gap-0.5"><MapPin className="w-3 h-3" />轨迹</Link>
                      <Link to="/privacy" className="text-[10px] text-guardian-blue hover:underline flex items-center gap-0.5"><Shield className="w-3 h-3" />隐私</Link>
                      <Link to="/devices" className="text-[10px] text-guardian-blue hover:underline flex items-center gap-0.5"><Settings className="w-3 h-3" />设置</Link>
                    </div>
                  </div>
                </div>
                {expandedDevice === d.id && (
                  <div className="mt-3 p-2.5 rounded-lg bg-guardian-dark-700/50 animate-fade-in space-y-2 text-[10px]">
                    <div className="font-medium text-gray-300">监护人授权范围</div>
                    {members.map((m) => (
                      <div key={m.id} className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded ${ROLE_BADGE[m.role] || "bg-gray-500/20 text-gray-400"}`}>{getRoleLabel(m.role)}</span>
                          <span className="text-gray-300">{m.name}</span>
                          <span className="text-gray-500">{m.phone}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 pl-2">
                          {(CG_PERMS[m.role] ?? []).map(p => (
                            <span key={p} className="flex items-center gap-0.5 text-gray-400">
                              <CheckCircle2 className="w-2.5 h-2.5 text-green-400" />{p}
                            </span>
                          ))}
                          {m.role === "temporary_caregiver" && ["修改围栏","管理设备","隐私策略"].map(p => (
                            <span key={p} className="flex items-center gap-0.5 text-gray-600">
                              <XCircle className="w-2.5 h-2.5 text-red-400" />{p}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="pt-1.5 border-t border-guardian-dark-500">
                      <div className="font-medium text-gray-300 mb-1">策略变更记录</div>
                      {CHANGE_LOG.map((c, i) => <div key={i} className="text-gray-500 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{c}</div>)}
                    </div>
                    <div className="pt-1.5 border-t border-guardian-dark-500">
                      <span className="text-gray-500">OTA升级记录: </span>
                      <span className="text-gray-300">2026-05-20 v2.1.0 → v2.1.2</span>
                      {needFW && <span className="ml-2 text-guardian-orange">当前 v{d.firmwareVersion} → v{LATEST_FW} 待升级</span>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-guardian-blue" />隐私保护执行</h3>
            <Link to="/privacy" className="text-[10px] text-guardian-blue hover:underline">配置 →</Link>
          </div>
          <div className="space-y-2">
            {privacyPolicies.map((p) => {
              const Icon = POLICY_ICON[p.category] || Shield
              const on = pEnabled(p.category)
              return (
                <div key={p.id} className="flex items-center gap-2 text-xs">
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${on ? "text-guardian-green" : "text-gray-500"}`} />
                  <span className="text-gray-300 flex-1">{POLICY_LABEL[p.category] || p.name}</span>
                  <button onClick={() => togglePolicy(p.category)} className="flex-shrink-0">
                    {on ? <ToggleRight className="w-5 h-5 text-guardian-green" /> : <ToggleLeft className="w-5 h-5 text-gray-500" />}
                  </button>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${on ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-500"}`}>{on ? "执行中" : "未启用"}</span>
                </div>
              )
            })}
          </div>
          <div className="pt-2 border-t border-guardian-dark-500 text-[10px] space-y-1">
            <div className="flex items-center justify-between text-gray-400"><span>人脸模糊处理</span><span className={pEnabled("face_blur") ? "text-guardian-green" : "text-gray-500"}>{pEnabled("face_blur") ? "自动检测并模糊" : "未启用"}</span></div>
            <div className="flex items-center justify-between text-gray-400"><span>EXIF位置脱敏</span><span className={pEnabled("location_strip") ? "text-guardian-green" : "text-gray-500"}>{pEnabled("location_strip") ? "GPS元数据已剥离" : "未启用"}</span></div>
            <div className="flex items-center justify-between text-gray-400"><span>端到端加密</span><span className={pEnabled("call_encrypt") ? "text-guardian-green" : "text-gray-500"}>{pEnabled("call_encrypt") ? "AES-256-GCM" : "未启用"}</span></div>
            <div className="flex items-center justify-between text-gray-400"><span>数据脱敏</span><span className={pEnabled("data_mask") ? "text-guardian-green" : "text-gray-500"}>{pEnabled("data_mask") ? "字段级脱敏" : "未启用"}</span></div>
          </div>
          {!allEnabled && (
            <div className="pt-2 border-t border-guardian-dark-500 text-[10px] space-y-1">
              <div className="font-medium text-guardian-orange">加密差距分析</div>
              {!pEnabled("data_mask") && <div className="flex items-center justify-between text-gray-400"><span>数据脱敏策略未启用</span><button onClick={() => togglePolicy("data_mask")} className="text-guardian-blue hover:underline">立即开启</button></div>}
              {!pEnabled("location_strip") && <div className="flex items-center justify-between text-gray-400"><span>EXIF位置脱敏未启用</span><button onClick={() => togglePolicy("location_strip")} className="text-guardian-blue hover:underline">立即开启</button></div>}
              {!pEnabled("face_blur") && <div className="flex items-center justify-between text-gray-400"><span>人脸模糊未启用</span><button onClick={() => togglePolicy("face_blur")} className="text-guardian-blue hover:underline">立即开启</button></div>}
              {!pEnabled("call_encrypt") && <div className="flex items-center justify-between text-gray-400"><span>通话加密未启用</span><button onClick={() => togglePolicy("call_encrypt")} className="text-guardian-blue hover:underline">立即开启</button></div>}
            </div>
          )}
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span>加密状态:</span>
            <span className={allEnabled ? "text-guardian-green font-medium" : "text-guardian-orange font-medium"}>{allEnabled ? "全面保护" : "部分保护"}</span>
          </div>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2"><Activity className="w-4 h-4 text-guardian-orange" />异常行为判定</h3>
            <Link to="/analytics" className="text-[10px] text-guardian-blue hover:underline">分析 →</Link>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-400">待处理异常</span>
            <span className={`text-lg font-bold ${unresolvedAnomalies > 0 ? "text-guardian-orange" : "text-guardian-green"}`}>{unresolvedAnomalies}</span>
            <span className="text-gray-600">/ {anomalies.length}总计</span>
          </div>
          <div className="space-y-2">
            {anomalies.slice(0, 5).map((a) => {
              const resolved = a.resolved || anomalyResult[a.id]
              const dispatch = anomalyDispatch[a.id]
              const review = anomalyReview[a.id]
              return (
                <div key={a.id} className="p-2 rounded-lg bg-guardian-dark-700 space-y-1 text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${resolved ? "bg-guardian-green" : a.confidence > 0.8 ? "bg-guardian-red" : a.confidence > 0.5 ? "bg-guardian-orange" : "bg-yellow-400"}`} />
                    <span className="text-gray-300 flex-1 truncate">{ANOMALY_LABEL[a.type] || a.type}</span>
                    <span className="text-gray-500">置信度{(a.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                    <span className="flex items-center gap-0.5"><ClipboardList className="w-2.5 h-2.5" />{dispatch ? <span className="text-guardian-blue">已派单→{dispatch}</span> : dispatchingId === a.id
                      ? <span className="flex items-center gap-1"><input value={dispatchInput} onChange={e => setDispatchInput(e.target.value)} className="w-16 bg-guardian-dark-800 border border-guardian-dark-500 rounded px-1 py-0.5 text-[9px] text-white" placeholder="分派人" /><button onClick={() => dispatchAnomaly(a.id)} className="text-guardian-blue">确认</button></span>
                      : <button onClick={() => setDispatchingId(a.id)} className="text-gray-500 hover:text-guardian-blue">派单</button>
                    }</span>
                    <span className="flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" />{review ? <span className={review === "通过" ? "text-guardian-green" : "text-yellow-400"}>复查:{review}</span> : resolved
                      ? <span className="flex gap-1"><button onClick={() => reviewAnomaly(a.id, "通过")} className="text-guardian-green hover:underline">复查通过</button><button onClick={() => reviewAnomaly(a.id, "待定")} className="text-yellow-400 hover:underline">复查待定</button></span>
                      : <span className="text-gray-500">未复查</span>
                    }</span>
                    <span className="flex items-center gap-0.5"><FileText className="w-2.5 h-2.5" />{resolved ? <span className="text-guardian-green">已处理</span> : <button onClick={() => resolveAnomaly(a.id)} className="text-gray-500 hover:text-guardian-green">标记处理</button>}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="pt-2 border-t border-guardian-dark-500 space-y-1 text-[10px]">
            <div className="flex items-center justify-between text-gray-400"><span>检测规则</span><span>长时间静止 · 夜间移动 · 信号异常 · 路线偏移</span></div>
            <div className="flex items-center justify-between text-gray-400"><span>活跃围栏</span><span className="text-gray-300">{activeGeofences}个启用</span></div>
          </div>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2"><Users className="w-4 h-4 text-purple-400" />成员权限边界</h3>
            <Link to="/members" className="text-[10px] text-guardian-blue hover:underline">管理 →</Link>
          </div>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded-full bg-guardian-dark-500 flex items-center justify-center text-[9px] font-bold text-gray-300 flex-shrink-0">{m.name[0]}</div>
                <span className="text-gray-300 flex-1 truncate">{m.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${ROLE_BADGE[m.role] || "bg-gray-500/20 text-gray-400"}`}>{getRoleLabel(m.role)}</span>
                <span className="text-gray-500 text-[10px] flex-shrink-0">{(CG_PERMS[m.role] ?? []).length}项权限</span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-guardian-dark-500 text-[10px]">
            <div className="font-medium text-gray-400 mb-1">权限矩阵</div>
            <div className="grid grid-cols-3 gap-1 text-center text-[9px]">
              <div /><div className="text-guardian-blue">主监护</div><div className="text-guardian-orange">临时看护</div>
              {["设备管理", "围栏设置", "通话管理", "告警处理", "隐私策略"].map((perm) => (
                <Fragment key={perm}>
                  <div className="text-gray-500 text-left">{perm}</div>
                  <div><CheckCircle2 className="w-3 h-3 text-guardian-green mx-auto" /></div>
                  <div><XCircle className="w-3 h-3 text-gray-600 mx-auto" /></div>
                </Fragment>
              ))}
            </div>
          </div>
          <div className="pt-2 border-t border-guardian-dark-500 space-y-1 text-[10px] text-gray-400">
            <div className="flex items-center justify-between"><span>录音审计存储</span><span className="text-gray-300">{recordings}条 · 30天保留期</span></div>
            <div className="flex items-center justify-between"><span>加密传输</span><span className={pEnabled("call_encrypt") ? "text-guardian-green" : "text-gray-500"}>{pEnabled("call_encrypt") ? "TLS 1.3 + AES-256" : "未启用"}</span></div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {[
          { label: "SOS测试", path: "/sos", icon: AlertTriangle, cls: "btn-danger" },
          { label: "围栏设置", path: "/location", icon: MapPin, cls: "btn-outline" },
          { label: "通话拨号", path: "/calls", icon: Phone, cls: "btn-outline" },
          { label: "设备管理", path: "/devices", icon: Watch, cls: "btn-outline" },
          { label: "隐私保护", path: "/privacy", icon: ShieldCheck, cls: "btn-outline" },
          { label: "异常分析", path: "/analytics", icon: Activity, cls: "btn-outline" },
        ].map((a) => (
          <Link key={a.path} to={a.path} className={`${a.cls} flex items-center gap-2 flex-1 justify-center`}><a.icon className="w-4 h-4" />{a.label}</Link>
        ))}
      </div>
    </div>
  )
}
