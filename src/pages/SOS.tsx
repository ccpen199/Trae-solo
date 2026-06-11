import { useState, useEffect, useRef } from "react"
import type { Alert, WorkOrder } from "@/types"
import { useAppStore } from "@/store"
import { formatTime, formatDuration, getSeverityClass, getAlertTypeLabel } from "@/utils/format"
import {
  ShieldAlert, Bell, CheckCircle2, Clock, AlertTriangle,
  MapPinOff, BatteryWarning, WifiOff, Plus, MapPin,
  ClipboardCopy, Timer, FileText, MessageSquare, CheckSquare,
} from "lucide-react"

const TYPE_FILTERS = [
  { key: "all", label: "全部" }, { key: "sos", label: "SOS", icon: ShieldAlert },
  { key: "geofence", label: "围栏", icon: MapPinOff }, { key: "behavior", label: "行为", icon: AlertTriangle },
  { key: "battery", label: "电量", icon: BatteryWarning }, { key: "offline", label: "离线", icon: WifiOff },
]
const STATUS_FILTERS = [
  { key: "all", label: "全部" }, { key: "pending", label: "待处理" },
  { key: "acknowledged", label: "已响应" }, { key: "resolved", label: "已解决" },
]
const ROLE_LABELS: Record<string, string> = { guardian: "家长", relative: "亲属", school_admin: "学校管理员" }
const WO_STEPS = ["创建", "处理中", "已解决", "已关闭"]
const WO_STEP_MAP: Record<string, number> = { open: 0, in_progress: 1, resolved: 2, closed: 3 }

const fmtHm = (iso?: string) => iso ? new Date(iso).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--"
const respDur = (n?: string, r?: string) => n && r ? formatDuration(Math.floor((new Date(r).getTime() - new Date(n).getTime()) / 1000)) : null
const elapsed = (iso?: string) => iso ? formatDuration(Math.floor((Date.now() - new Date(iso).getTime()) / 1000)) : null
const deadlineRemain = (createdAt: string) => {
  const rem = new Date(createdAt).getTime() + 30 * 60000 - Date.now()
  if (rem <= 0) return { text: "已超时", color: "text-red-400" }
  const pct = 1 - rem / (30 * 60000)
  return { text: `剩余${Math.floor(rem / 60000)}分`, color: pct > 0.83 ? "text-red-400" : pct > 0.5 ? "text-orange-400" : "text-guardian-green" }
}

export default function SOS() {
  const { alerts, devices, fetchAlerts, fetchDevices, acknowledgeAlert, resolveAlert, createWorkOrder } = useAppStore()
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selected, setSelected] = useState<Alert | null>(null)
  const [assignee, setAssignee] = useState("")
  const [workOrders, setWorkOrders] = useState<Record<string, WorkOrder>>({})
  const [woNote, setWoNote] = useState("")
  const [tick, setTick] = useState(0)
  const autoCreated = useRef(new Set<string>())

  useEffect(() => { fetchAlerts(); fetchDevices() }, [])
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(id) }, [])
  useEffect(() => {
    alerts.filter(a => isCritical(a) && !autoCreated.current.has(a.id)).forEach(a => {
      autoCreated.current.add(a.id)
      createWorkOrder(a.id, "系统自动分派")
      setWorkOrders(prev => ({ ...prev, [a.id]: { id: `WO-${a.id.slice(0, 8)}`, alertId: a.id, assignee: "系统自动分派", status: "open", notes: [], createdAt: a.timestamp } }))
    })
  }, [alerts])

  const filtered = alerts.filter(a => (typeFilter === "all" || a.type === typeFilter) && (statusFilter === "all" || a.status === statusFilter))
  const stats = { pending: filtered.filter(a => a.status === "pending").length, acknowledged: filtered.filter(a => a.status === "acknowledged").length, resolved: filtered.filter(a => a.status === "resolved").length }
  const devName = (id: string) => devices.find(d => d.id === id)?.name ?? "未知设备"
  const devOf = (id: string) => devices.find(d => d.id === id)
  const isCritical = (a: Alert) => a.severity === "critical" || a.type === "sos"

  const statusDot = (s: string) => <span className={`w-2.5 h-2.5 rounded-full ${s === "pending" ? "bg-guardian-orange" : s === "acknowledged" ? "bg-guardian-blue" : "bg-guardian-green"}`} />
  const nodeIcon = (s: string) => s === "responded" ? <CheckCircle2 className="w-5 h-5 text-guardian-green" /> : s === "notified" ? <Bell className="w-5 h-5 text-guardian-blue" /> : <Clock className="w-5 h-5 text-gray-500" />
  const lineColor = (s: string) => s === "responded" ? "bg-guardian-green" : s === "notified" ? "bg-guardian-blue" : "bg-gray-600"
  const needsEscalation = (n: { status: string; notifiedAt?: string; role: string }) =>
    n.status !== "responded" && !!n.notifiedAt && (Date.now() - new Date(n.notifiedAt).getTime()) / 60000 >= 5 && n.role === "guardian"

  const chainLine = (chain: Alert["notificationChain"]) =>
    chain.map(n => {
      const r = ROLE_LABELS[n.role] || n.role
      const s = n.status === "responded" ? `已响应(${respDur(n.notifiedAt, n.respondedAt) ?? "?"})` : n.status === "notified" ? `已通知(等待${elapsed(n.notifiedAt) ?? "?"})` : "待通知"
      return `${r}·${s}`
    }).join(" → ")

  const reviewOf = (aid: string, aStatus: string) => {
    if (aStatus === "resolved" || aStatus === "closed") return { label: "复查:已通过", color: "text-guardian-green" }
    const wo = workOrders[aid]
    if (!wo) return { label: "复查:未完成", color: "text-orange-400" }
    if (wo.notes.some(n => n.content === "复查通过")) return { label: "复查:已通过", color: "text-guardian-green" }
    if (wo.notes.some(n => n.content === "复查待定")) return { label: "复查:待定", color: "text-yellow-400" }
    return { label: "复查:未完成", color: "text-orange-400" }
  }

  const handleCreateWO = async () => {
    if (!selected || !assignee.trim()) return
    await createWorkOrder(selected.id, assignee.trim())
    setWorkOrders(prev => ({ ...prev, [selected.id]: { id: `WO-${selected.id.slice(0, 8)}`, alertId: selected.id, assignee: assignee.trim(), status: "open", notes: [], createdAt: new Date().toISOString() } }))
    setAssignee("")
  }
  const pushNote = (content: string) => {
    if (!selected) return
    const wo = workOrders[selected.id]; if (!wo) return
    setWorkOrders(prev => ({ ...prev, [selected.id]: { ...wo, notes: [...wo.notes, { author: "当前用户", content, timestamp: new Date().toISOString() }] } }))
  }

  void tick
  const sevLabel = (s: string) => s === "critical" ? "紧急" : s === "high" ? "高" : s === "medium" ? "中" : "低"
  const statusLabel = (s: string) => s === "pending" ? "待处理" : s === "acknowledged" ? "已响应" : "已解决"

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">SOS告警中心</h1>
        <div className="flex gap-2">
          {TYPE_FILTERS.map(f => (
            <button key={f.key} onClick={() => setTypeFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === f.key ? "bg-guardian-blue text-white" : "bg-guardian-dark-700 text-gray-400 hover:text-white"}`}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex gap-2">
          {STATUS_FILTERS.map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === f.key ? "bg-guardian-dark-600 text-white" : "bg-guardian-dark-800 text-gray-500 hover:text-gray-300"}`}>{f.label}</button>
          ))}
        </div>
        <div className="ml-auto flex gap-4 text-sm">
          <span>待处理 <b className="text-guardian-orange">{stats.pending}</b></span>
          <span>已响应 <b className="text-guardian-blue">{stats.acknowledged}</b></span>
          <span>已解决 <b className="text-guardian-green">{stats.resolved}</b></span>
        </div>
      </div>

      <div className="flex gap-5">
        <div className="flex-1 relative pl-8">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-guardian-dark-600" />
          <div className="space-y-3">
            {filtered.map((alert, i) => {
              const rv = reviewOf(alert.id, alert.status)
              const dl = deadlineRemain(alert.timestamp)
              const wo = workOrders[alert.id]
              const esc = alert.notificationChain.find(n => needsEscalation(n))
              return (
                <div key={alert.id} onClick={() => setSelected(alert)}
                  className={`relative animate-slide-in-right cursor-pointer rounded-xl p-4 transition-all ${selected?.id === alert.id ? "bg-guardian-dark-700 ring-1 ring-guardian-blue/40" : "bg-guardian-dark-800 hover:bg-guardian-dark-700"} ${isCritical(alert) ? "border-l-4 border-l-guardian-red shadow-sm shadow-red-500/10" : "border-l-4 border-l-transparent"}`}
                  style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="absolute -left-[22px] top-5 w-3 h-3 rounded-full bg-guardian-dark-800 ring-2 ring-guardian-dark-600" />
                  {isCritical(alert) && <span className="absolute -left-[24px] top-4 w-4 h-4 rounded-full bg-guardian-red animate-ping-slow opacity-40" />}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSeverityClass(alert.severity)}`}>{sevLabel(alert.severity)}</span>
                      <span className="text-sm font-medium text-guardian-blue">{getAlertTypeLabel(alert.type)}</span>
                      <span className="text-sm text-gray-400">{devName(alert.deviceId)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">{statusDot(alert.status)}<span className="text-xs text-gray-500">{statusLabel(alert.status)}</span></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-300 line-clamp-2">{alert.description}</p>
                  <div className="mt-1.5 text-[11px] text-gray-400 leading-relaxed">{chainLine(alert.notificationChain)}</div>
                  {esc && <div className="mt-1 flex items-center gap-1 text-[11px] text-yellow-400"><AlertTriangle className="w-3 h-3" />{ROLE_LABELS[esc.role]}未响应,已升级至亲属</div>}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
                    {wo ? <span className="text-gray-300">工单:{wo.id} · {wo.assignee} · {WO_STEPS[WO_STEP_MAP[wo.status] ?? 0]}</span> : <span className="text-gray-600">未创建工单</span>}
                    <span className={dl.color}>时限:{dl.text}</span>
                    <span className={rv.color}>{rv.label}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{formatTime(alert.timestamp)}</span>
                    {alert.status === "pending" && (
                      <div className="flex gap-2">
                        <button onClick={e => { e.stopPropagation(); acknowledgeAlert(alert.id) }} className="px-2.5 py-1 rounded text-xs bg-guardian-blue/20 text-guardian-blue hover:bg-guardian-blue/30 transition-colors">响应</button>
                        <button onClick={e => { e.stopPropagation(); resolveAlert(alert.id) }} className="px-2.5 py-1 rounded text-xs bg-guardian-green/20 text-guardian-green hover:bg-guardian-green/30 transition-colors">解决</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && <div className="text-center py-12 text-gray-500">暂无告警记录</div>}
          </div>
        </div>

        {selected ? (
          <div className="w-[380px] shrink-0 space-y-4 animate-slide-in-right">
            <div className="card space-y-3">
              <h3 className="text-lg font-bold text-white">告警详情</h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-gray-500">类型</span><span className="text-guardian-blue">{getAlertTypeLabel(selected.type)}</span>
                <span className="text-gray-500">级别</span><span className={`inline-block w-fit px-2 py-0.5 rounded text-xs font-semibold ${getSeverityClass(selected.severity)}`}>{selected.severity}</span>
                <span className="text-gray-500">设备</span><span className="text-white">{devName(selected.deviceId)}</span>
                <span className="text-gray-500">时间</span><span className="text-white">{formatTime(selected.timestamp)}</span>
              </div>
              {selected.locationLat != null && selected.locationLng != null && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <MapPin className="w-3.5 h-3.5 text-guardian-orange" /><span>{selected.locationLat.toFixed(4)}, {selected.locationLng.toFixed(4)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-400"><Timer className="w-3.5 h-3.5" /><span>告警持续: {elapsed(selected.timestamp) ?? "未知"}</span></div>
              {devOf(selected.deviceId) && (() => {
                const d = devOf(selected.deviceId)!
                return <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className={`w-2 h-2 rounded-full ${d.status === "online" ? "bg-guardian-green" : d.status === "sos" ? "bg-guardian-red" : "bg-gray-500"}`} />
                  <span>关联设备: {d.status === "online" ? "在线" : d.status === "sos" ? "SOS中" : "离线"}</span>
                  <span className="ml-auto">电量 {d.batteryLevel}%</span>
                </div>
              })()}
              <p className="text-sm text-gray-300">{selected.description}</p>
            </div>

            <div className="card space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Bell className="w-4 h-4 text-guardian-blue" />通知链路</h3>
              <div className="space-y-0">
                {selected.notificationChain.map((node, i) => (
                  <div key={i}>
                    <div className="flex items-start gap-3 py-2">
                      {nodeIcon(node.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{ROLE_LABELS[node.role] || node.role}</span>
                          <span className="text-xs text-gray-400">{node.name}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs">
                          <span className="text-gray-500">通知: {fmtHm(node.notifiedAt)}</span>
                          {node.status === "responded" ? <>
                            <span className="text-gray-500">响应: {fmtHm(node.respondedAt)}</span>
                            <span className="text-guardian-green font-medium">用时 {respDur(node.notifiedAt, node.respondedAt)}</span>
                          </> : node.status === "notified" ? <span className="text-guardian-orange">等待响应 · 已过 {elapsed(node.notifiedAt)}</span>
                            : <span className="text-gray-500">等待响应</span>}
                        </div>
                        {needsEscalation(node) && <div className="mt-1 flex items-center gap-1 text-xs text-yellow-400"><AlertTriangle className="w-3 h-3" /> 已升级至亲属</div>}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${node.status === "responded" ? "bg-green-500/20 text-green-400" : node.status === "notified" ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-400"}`}>
                        {node.status === "responded" ? "已响应" : node.status === "notified" ? "已通知" : "待通知"}
                      </span>
                    </div>
                    {i < selected.notificationChain.length - 1 && <div className={`ml-[10px] w-0.5 h-5 ${lineColor(node.status)}`} />}
                  </div>
                ))}
              </div>
            </div>

            <div className="card space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-guardian-red" />升级闭环</h3>
              {selected.notificationChain.map((node, i) => {
                const nc = node.status === "responded" ? "text-guardian-green" : node.status === "notified" ? "text-guardian-blue" : "text-gray-500"
                const nb = node.status === "responded" ? "border-guardian-green/30 bg-green-500/5" : node.status === "notified" ? "border-guardian-blue/30 bg-blue-500/5" : "border-gray-600/30 bg-gray-500/5"
                const st = node.status === "responded" ? `已响应 · ${respDur(node.notifiedAt, node.respondedAt) ?? "?"}` : node.status === "notified" ? `已通知 · 等待${elapsed(node.notifiedAt) ?? ""}` : "待通知"
                return <div key={i}>
                  <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${nb}`}>
                    <span className={`text-xs font-bold ${nc}`}>L{i + 1}</span>
                    <div className="flex-1 min-w-0"><div className="text-sm text-white font-medium">{ROLE_LABELS[node.role]}({node.name})</div><div className={`text-xs ${nc}`}>{st}</div></div>
                    {node.status === "responded" ? <CheckCircle2 className="w-4 h-4 text-guardian-green" /> : <Clock className="w-4 h-4 text-gray-500" />}
                  </div>
                  {i < selected.notificationChain.length - 1 && <div className="flex justify-center py-0.5"><span className="text-gray-600 text-[10px]">▼</span></div>}
                </div>
              })}
              {selected.notificationChain.every(n => n.status === "responded")
                ? <div className="text-xs text-guardian-green font-medium text-center">闭环完成 ✓</div>
                : <div className="text-xs text-orange-400 text-center">闭环未完成 - {(() => { const p = selected.notificationChain.find(n => n.status !== "responded"); return p ? `${ROLE_LABELS[p.role]}未响应` : "未知" })()}</div>}
            </div>

            <div className="card space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-guardian-blue" />工单信息</h3>
              {workOrders[selected.id] ? (() => {
                const wo = workOrders[selected.id]
                const stepIdx = WO_STEP_MAP[wo.status] ?? 0
                const dl = deadlineRemain(wo.createdAt)
                return <>
                  <div className="flex items-center gap-2 text-xs"><ClipboardCopy className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-400">工单编号:</span><span className="text-white font-mono">{wo.id}</span></div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-5 h-5 rounded-full bg-guardian-blue/20 text-guardian-blue flex items-center justify-center text-xs font-bold">{wo.assignee[0]}</div>
                    <span className="text-white">{wo.assignee}</span><span className="text-gray-500 ml-auto">分派: {formatTime(wo.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs"><Timer className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-400">处理时限:</span><span className={`font-medium ${dl.color}`}>{dl.text}</span></div>
                  <div className="flex items-center gap-1 my-1">
                    {WO_STEPS.map((s, si) => <div key={s} className="flex items-center gap-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${si <= stepIdx ? "bg-guardian-blue" : "bg-guardian-dark-500"}`} />
                      <span className={`text-[10px] ${si <= stepIdx ? "text-white" : "text-gray-600"}`}>{s}</span>
                      {si < WO_STEPS.length - 1 && <div className={`w-4 h-0.5 ${si < stepIdx ? "bg-guardian-blue" : "bg-guardian-dark-500"}`} />}
                    </div>)}
                  </div>
                  {wo.notes.length > 0 && <div className="space-y-2 max-h-32 overflow-y-auto">
                    {wo.notes.map((n, ni) => <div key={ni} className="flex gap-2 text-xs">
                      <MessageSquare className="w-3 h-3 text-gray-500 mt-0.5 shrink-0" />
                      <div><span className="text-gray-400">{n.author}</span><span className="text-gray-600 mx-1">·</span>
                        <span className={n.content === "复查待定" ? "text-yellow-400" : n.content === "复查通过" ? "text-guardian-green" : "text-white"}>{n.content}</span>
                        <div className="text-gray-600">{fmtHm(n.timestamp)}</div></div>
                    </div>)}
                  </div>}
                  <div className="flex gap-2">
                    <input value={woNote} onChange={e => setWoNote(e.target.value)} placeholder="添加处理记录"
                      className="flex-1 bg-guardian-dark-800 border border-guardian-dark-500 rounded-lg px-3 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-guardian-blue" />
                    <button onClick={() => { pushNote(woNote); setWoNote("") }} disabled={!woNote.trim()} className="px-2 py-1 rounded-lg bg-guardian-dark-600 text-white text-xs hover:bg-guardian-dark-500 disabled:opacity-40"><MessageSquare className="w-3 h-3" /></button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => pushNote("复查通过")} className="flex-1 px-2 py-1.5 rounded-lg bg-guardian-green/10 text-guardian-green text-xs hover:bg-guardian-green/20 flex items-center justify-center gap-1"><CheckSquare className="w-3.5 h-3.5" /> 复查通过</button>
                    <button onClick={() => pushNote("复查待定")} className="flex-1 px-2 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 text-xs hover:bg-yellow-500/20 flex items-center justify-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> 复查待定</button>
                  </div>
                </>
              })() : (
                <div className="flex gap-2">
                  <input value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="输入负责人"
                    className="flex-1 bg-guardian-dark-800 border border-guardian-dark-500 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-guardian-blue" />
                  <button onClick={handleCreateWO} disabled={!assignee.trim()}
                    className="px-3 py-1.5 rounded-lg bg-guardian-blue text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"><Plus className="w-4 h-4" /> 创建工单</button>
                </div>
              )}
            </div>

            {(() => {
              const rv = reviewOf(selected.id, selected.status)
              const wo = workOrders[selected.id]
              const isRes = selected.status === "resolved" || selected.status === "closed"
              return <div className="card space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><CheckSquare className="w-4 h-4 text-guardian-green" />复查结论</h3>
                {isRes
                  ? <div className={`text-sm ${rv.color}`}>复查通过 · 复查人:系统 · 复查时间:{new Date().toLocaleDateString("zh-CN")}</div>
                  : selected.status === "acknowledged"
                    ? <div className={`text-sm ${rv.color}`}>复查待定 · 等待最终确认</div>
                    : <div className={`text-sm ${rv.color}`}>未复查</div>}
                {wo && <button onClick={() => pushNote("复查通过")} className="w-full px-2 py-1.5 rounded-lg bg-guardian-green/10 text-guardian-green text-xs hover:bg-guardian-green/20 flex items-center justify-center gap-1"><CheckSquare className="w-3.5 h-3.5" />添加复查</button>}
              </div>
            })()}
          </div>
        ) : (
          <div className="w-[380px] shrink-0 flex items-center justify-center rounded-xl bg-guardian-dark-800 border border-guardian-dark-500 text-gray-500 text-sm">选择告警查看详情</div>
        )}
      </div>
    </div>
  )
}
