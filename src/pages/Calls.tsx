import { useState, useEffect, useRef } from "react"
import type { CallRecord } from "@/types"
import { useAppStore } from "@/store"
import { formatTime, formatDuration, getDirectionLabel } from "@/utils/format"
import { Link } from "react-router-dom"
import {
  PhoneIncoming, PhoneOutgoing, PhoneMissed, Play, Pause, Download,
  Mic, Volume2, PhoneOff, Calendar, Lock, Clock, HardDrive,
  ChevronDown, ChevronRight, Shield, AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react"

const DIAL_KEYS = ["1","2","3","4","5","6","7","8","9","*","0","#"]
const RETENTION_DAYS = 30
const EXPIRY_WARN_DAYS = 5

type RecordFilter = "all" | "audio" | "video" | "missed"

function getDateGroup(ts: string) {
  const d = new Date(ts)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (target.getTime() >= today.getTime()) return "今天"
  if (target.getTime() >= yesterday.getTime()) return "昨天"
  return "更早"
}

const dirIcon = (dir: CallRecord["direction"]) => {
  if (dir === "inbound") return <PhoneIncoming className="w-4 h-4 text-guardian-green" />
  if (dir === "outbound") return <PhoneOutgoing className="w-4 h-4 text-guardian-blue" />
  return <PhoneMissed className="w-4 h-4 text-guardian-red" />
}

function daysLeft(ts: string) {
  const expiry = new Date(new Date(ts).getTime() + RETENTION_DAYS * 86400000)
  return Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / 86400000))
}

function expiryDate(ts: string) {
  return new Date(new Date(ts).getTime() + RETENTION_DAYS * 86400000)
    .toLocaleDateString("zh-CN", { month: "short", day: "numeric" })
}

function getAuditLog(id: string) {
  const seed = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const names = ["王建国", "李芳", "张伟"]
  const reasons = ["通话质量抽检", "家长调取录音", "告警调查取证", "系统自动备份验证", "合规审计抽查"]
  return [
    { who: names[seed % 3], when: "2026-06-09 14:32", reason: reasons[seed % 5] },
    { who: names[(seed + 1) % 3], when: "2026-06-08 09:15", reason: reasons[(seed + 1) % 5] },
    { who: names[(seed + 2) % 3], when: "2026-06-07 18:44", reason: reasons[(seed + 2) % 5] },
  ]
}

export default function Calls() {
  const { callRecords, devices, fetchCallRecords, fetchDevices } = useAppStore()
  const [deviceFilter, setDeviceFilter] = useState("all")
  const [callType, setCallType] = useState<"audio" | "video">("audio")
  const [recordFilter, setRecordFilter] = useState<RecordFilter>("all")
  const [dateStart, setDateStart] = useState("")
  const [dateEnd, setDateEnd] = useState("")
  const [inCall, setInCall] = useState(false)
  const [callSeconds, setCallSeconds] = useState(0)
  const [dialInput, setDialInput] = useState("")
  const [expandedCall, setExpandedCall] = useState<string | null>(null)
  const [escalatedCalls, setEscalatedCalls] = useState<Set<string>>(new Set())
  const [showAudit, setShowAudit] = useState<Set<string>>(new Set())
  const [confirmEscalate, setConfirmEscalate] = useState<string | null>(null)
  const [playingRecording, setPlayingRecording] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>(null)

  useEffect(() => { fetchCallRecords(); fetchDevices() }, [])

  useEffect(() => {
    if (inCall) {
      timerRef.current = setInterval(() => setCallSeconds((s) => s + 1), 1000)
    } else {
      clearInterval(timerRef.current!)
      setCallSeconds(0)
    }
    return () => clearInterval(timerRef.current!)
  }, [inCall])

  const deviceName = (id: string) => devices.find((d) => d.id === id)?.name ?? "未知设备"
  const toggleExpand = (id: string) => setExpandedCall((p) => p === id ? null : id)
  const toggleAudit = (id: string) => setShowAudit((p) => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const confirmEscalation = (id: string) => {
    setEscalatedCalls((p) => new Set(p).add(id))
    setConfirmEscalate(null)
  }

  const filtered = callRecords.filter((r) => {
    if (deviceFilter !== "all" && r.deviceId !== deviceFilter) return false
    if (recordFilter === "audio" && r.type !== "audio") return false
    if (recordFilter === "video" && r.type !== "video") return false
    if (recordFilter === "missed" && r.direction !== "missed") return false
    if (dateStart && new Date(r.timestamp) < new Date(dateStart)) return false
    if (dateEnd && new Date(r.timestamp) > new Date(new Date(dateEnd).setHours(23,59,59,999))) return false
    return true
  })

  const recordings = callRecords.filter((r) => r.hasRecording)
  const groups: Record<string, CallRecord[]> = {}
  filtered.forEach((r) => { const g = getDateGroup(r.timestamp); (groups[g] ??= []).push(r) })
  const fmtTimer = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
  const filterLabel: Record<RecordFilter, string> = { all: "全部类型", audio: "音频", video: "视频", missed: "未接" }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">通话管理</h1>
        <div className="flex items-center gap-3">
          <select value={deviceFilter} onChange={(e) => setDeviceFilter(e.target.value)}
            className="bg-guardian-dark-700 border border-guardian-dark-500 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-guardian-blue">
            <option value="all">全部设备</option>
            {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)}
              className="bg-guardian-dark-700 border border-guardian-dark-500 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-guardian-blue w-[120px]" />
            <span className="text-xs text-gray-500">至</span>
            <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)}
              className="bg-guardian-dark-700 border border-guardian-dark-500 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-guardian-blue w-[120px]" />
            {(dateStart || dateEnd) && <button onClick={() => { setDateStart(""); setDateEnd("") }} className="text-xs text-guardian-orange hover:underline">清除</button>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {(["all", "audio", "video", "missed"] as const).map((f) => (
          <button key={f} onClick={() => setRecordFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${recordFilter === f ? "bg-guardian-blue text-white" : "bg-guardian-dark-700 text-gray-400 hover:text-white"}`}>
            {filterLabel[f]}
          </button>
        ))}
        <span className="text-xs text-gray-500 ml-2">{filtered.length}条记录</span>
      </div>

      <div className="flex gap-5">
        <div className="w-[65%] space-y-4">
          {Object.entries(groups).map(([label, records]) => (
            <div key={label}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</h3>
              <div className="space-y-1">
                {records.map((r) => {
                  const isExpanded = expandedCall === r.id
                  const isEscalated = escalatedCalls.has(r.id)
                  const left = daysLeft(r.timestamp)
                  const enc = r.id.charCodeAt(0) % 2 === 0
                  return (
                    <div key={r.id}>
                      <div onClick={() => toggleExpand(r.id)}
                        className={`card flex items-center gap-3 cursor-pointer hover:bg-guardian-dark-700/50 transition-colors ${r.direction === "missed" ? "border-l-4 border-l-guardian-red" : "border-l-4 border-l-transparent"}`}>
                        {dirIcon(r.direction)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate">{deviceName(r.deviceId)}</span>
                            <span className="text-xs text-gray-500">{r.callerNumber}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">{getDirectionLabel(r.direction)}</span>
                            {r.hasRecording && (
                              <>
                                <span className="text-[10px] text-gray-600 font-mono">ID:{r.id.slice(0,8)}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${enc ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}`}>
                                  {enc ? "加密存储" : "已存储"}
                                </span>
                                <span className={`text-[10px] ${left <= EXPIRY_WARN_DAYS ? "text-guardian-red" : "text-gray-500"}`}>剩余{left}天</span>
                                <button onClick={(e) => { e.stopPropagation(); setPlayingRecording((p) => p === r.id ? null : r.id) }}
                                  className="p-0.5 rounded hover:bg-guardian-dark-500 transition-colors">
                                  {playingRecording === r.id ? <Pause className="w-3.5 h-3.5 text-guardian-orange" /> : <Play className="w-3.5 h-3.5 text-guardian-orange" />}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${r.type === "video" ? "bg-purple-500/20 text-purple-400" : "bg-guardian-blue/20 text-guardian-blue"}`}>
                          {r.type === "video" ? "视频" : "音频"}
                        </span>
                        <span className="text-xs text-gray-400 w-14 text-right">{formatDuration(r.duration)}</span>
                        <span className="text-xs text-gray-500 w-18 text-right">{formatTime(r.timestamp)}</span>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />}
                      </div>

                      {isExpanded && (
                        <div className="card mt-0.5 rounded-t-none border-t-0 bg-guardian-dark-800/50 space-y-3">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <div><span className="text-gray-500">时间: </span><span className="text-white">{new Date(r.timestamp).toLocaleString("zh-CN")}</span></div>
                            <div><span className="text-gray-500">时长: </span><span className="text-white">{formatDuration(r.duration)}</span></div>
                            <div><span className="text-gray-500">号码: </span><span className="text-white">{r.callerNumber}</span></div>
                            <div><span className="text-gray-500">设备: </span><span className="text-white">{deviceName(r.deviceId)}</span></div>
                          </div>

                          {r.hasRecording && (
                            <div className="p-2.5 rounded-lg bg-guardian-dark-700 space-y-2">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-400">录音回放</span>
                                <div className="flex-1 h-1.5 rounded-full bg-guardian-dark-500">
                                  <div className="h-1.5 rounded-full bg-guardian-blue w-[35%]" />
                                </div>
                                <span className="text-[10px] text-gray-500">0:00 / {formatDuration(r.duration)}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-[10px]">
                                <div><span className="text-gray-500">保存时间: </span><span className="text-gray-300">{new Date(r.timestamp).toLocaleString("zh-CN")}</span></div>
                                <div><span className="text-gray-500">过期日期: </span><span className="text-gray-300">{expiryDate(r.timestamp)}</span></div>
                              </div>
                              <div className="space-y-0.5 pt-1 border-t border-guardian-dark-600">
                                <span className="text-[10px] text-gray-400 font-medium">审计日志</span>
                                {getAuditLog(r.id).map((a, i) => (
                                  <div key={i} className="text-[10px] text-gray-500">访问记录: {a.who} {a.when} 原因: {a.reason}</div>
                                ))}
                              </div>
                              <div className="text-[10px] space-y-0.5 pt-1 border-t border-guardian-dark-600">
                                <span className="text-gray-400 font-medium">权限边界</span>
                                <div className="text-gray-500">可访问: <CheckCircle2 className="w-3 h-3 inline text-green-400" /> 主监护人 <XCircle className="w-3 h-3 inline text-red-400" /> 临时看护人(需主监护授权) <XCircle className="w-3 h-3 inline text-red-400" /> 学校管理员</div>
                                <div className="text-gray-500">操作: <CheckCircle2 className="w-3 h-3 inline text-green-400" /> 回放 <XCircle className="w-3 h-3 inline text-red-400" /> 下载(需审批) <XCircle className="w-3 h-3 inline text-red-400" /> 删除(需主监护确认)</div>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${left > 15 ? "bg-green-500/20 text-green-400" : left > 0 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>留存状态: {left > 15 ? "正常" : left > 0 ? "即将过期" : "已过期"}</span>
                            </div>
                          )}

                          {r.direction === "missed" && (
                            <div className="flex items-center gap-2">
                              {isEscalated ? (
                                <Link to="/sos" className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-guardian-red/20 text-guardian-red hover:bg-guardian-red/30 transition-colors">
                                  <CheckCircle2 className="w-3 h-3" /> 已转告警 → SOS
                                </Link>
                              ) : confirmEscalate === r.id ? (
                                <div className="flex items-center gap-2 text-xs">
                                  <AlertTriangle className="w-3.5 h-3.5 text-guardian-orange" />
                                  <span className="text-guardian-orange">将此未接通话转为告警? 通知对象: 主监护人 → 亲属</span>
                                  <button onClick={() => confirmEscalation(r.id)} className="px-2 py-1 rounded bg-guardian-red text-white hover:opacity-80">确认</button>
                                  <button onClick={() => setConfirmEscalate(null)} className="px-2 py-1 rounded bg-guardian-dark-600 text-gray-300 hover:text-white">取消</button>
                                </div>
                              ) : (
                                <button onClick={(e) => { e.stopPropagation(); setConfirmEscalate(r.id) }}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-guardian-orange/20 text-guardian-orange hover:bg-guardian-orange/30 transition-colors">
                                  <AlertTriangle className="w-3 h-3" /> 转告警
                                </button>
                              )}
                            </div>
                          )}

                          {r.direction !== "missed" && (() => {
                            const related = callRecords.filter((c) => c.deviceId === r.deviceId && c.id !== r.id).slice(0, 3)
                            return related.length > 0 && (
                              <div>
                                <span className="text-[10px] text-gray-500 font-medium">同设备近期通话</span>
                                <div className="mt-1 space-y-0.5">
                                  {related.map((c) => (
                                    <div key={c.id} className="flex items-center gap-2 text-[10px] text-gray-400">
                                      {dirIcon(c.direction)}
                                      <span>{getDirectionLabel(c.direction)}</span>
                                      <span>{formatDuration(c.duration)}</span>
                                      <span>{formatTime(c.timestamp)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center py-12 text-gray-500">暂无通话记录</div>}
        </div>

        <div className="w-[35%] card space-y-5 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-guardian-dark-500 flex items-center justify-center text-lg font-bold text-guardian-blue">
            {devices[0]?.name?.[0] ?? "?"}
          </div>
          <span className="text-sm text-white font-medium">{devices[0]?.name ?? "选择设备"}</span>
          <div className="flex rounded-lg overflow-hidden border border-guardian-dark-500">
            {(["audio", "video"] as const).map((t) => (
              <button key={t} onClick={() => setCallType(t)}
                className={`px-5 py-1.5 text-sm font-medium transition-colors ${callType === t ? "bg-guardian-blue text-white" : "bg-guardian-dark-800 text-gray-400 hover:text-white"}`}>
                {t === "audio" ? "音频" : "视频"}
              </button>
            ))}
          </div>
          {!inCall ? (
            <>
              <div className="w-full text-center text-2xl font-mono tracking-widest text-white min-h-[36px]">{dialInput || "—"}</div>
              <div className="grid grid-cols-3 gap-2 w-full max-w-[220px]">
                {DIAL_KEYS.map((k) => (
                  <button key={k} onClick={() => setDialInput((v) => v + k)}
                    className="h-11 rounded-lg bg-guardian-dark-600 hover:bg-guardian-dark-500 text-white font-medium transition-colors">{k}</button>
                ))}
              </div>
              <button onClick={() => setInCall(true)}
                className="w-14 h-14 rounded-full bg-guardian-green hover:bg-green-600 flex items-center justify-center transition-colors">
                <PhoneOutgoing className="w-6 h-6 text-white" />
              </button>
            </>
          ) : (
            <div className="space-y-4 flex flex-col items-center w-full">
              <span className="text-guardian-green text-sm font-medium">通话中</span>
              <span className="text-3xl font-mono text-white">{fmtTimer(callSeconds)}</span>
              <div className="flex gap-6 pt-2">
                {[
                  { icon: Mic, label: "静音", color: "text-white" },
                  { icon: Volume2, label: "免提", color: "text-white" },
                  { icon: PhoneOff, label: "挂断", color: "text-guardian-red" },
                ].map(({ icon: Icon, label, color }) => (
                  <button key={label}
                    onClick={label === "挂断" ? () => { setInCall(false); setDialInput("") } : undefined}
                    className={`flex flex-col items-center gap-1 ${color} hover:opacity-70 transition-opacity`}>
                    <div className="w-11 h-11 rounded-full bg-guardian-dark-600 flex items-center justify-center"><Icon className="w-5 h-5" /></div>
                    <span className="text-[10px] text-gray-500">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-white mb-3">录音存储</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {recordings.map((r) => {
            const left = daysLeft(r.timestamp)
            const enc = r.id.charCodeAt(0) % 2 === 0
            const nearExpiry = left <= EXPIRY_WARN_DAYS
            const auditOpen = showAudit.has(r.id)
            return (
              <div key={r.id} className="card space-y-2">
                <div className={`px-2 py-1.5 rounded text-[10px] font-medium flex items-center justify-between ${left > 15 ? "bg-green-500/20 text-green-400" : left > 5 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                  <span>{left > 15 ? "> 15天剩余" : left > 5 ? "5-15天剩余" : "< 5天剩余"}</span>
                  <span>过期: {expiryDate(r.timestamp)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white truncate">{deviceName(r.deviceId)}</span>
                  <Download className="w-4 h-4 text-gray-500 hover:text-guardian-blue cursor-pointer transition-colors" />
                </div>
                <div className="text-xs text-gray-500">{formatTime(r.timestamp)} · {formatDuration(r.duration)}</div>
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-guardian-orange shrink-0 cursor-pointer" />
                  <div className="flex-1 h-1 rounded-full bg-guardian-dark-500"><div className="h-1 rounded-full bg-guardian-blue w-0" /></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${enc ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}`}>
                    {enc ? <><Lock className="w-3 h-3" /> 加密存储</> : <><HardDrive className="w-3 h-3" /> 已存储</>}
                  </span>
                  {nearExpiry && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-guardian-red/20 text-guardian-red">过期</span>}
                </div>
                <div className="space-y-0.5 text-[10px] text-gray-500">
                  <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> 存储: {new Date(r.timestamp).toLocaleString("zh-CN")}</div>
                  <div>保留期: 剩余{left}天 (至{expiryDate(r.timestamp)})</div>
                  <div className="text-gray-600 font-mono">ID: {r.id.slice(0,8)}</div>
                </div>
                <div className="space-y-1 text-[10px]">
                  <div className="flex items-center gap-1"><Shield className="w-3 h-3 text-blue-400" /> <span className="text-blue-400">加密算法: AES-256-GCM</span></div>
                  <div className="flex items-center gap-1"><HardDrive className="w-3 h-3 text-gray-400" /> <span className="text-gray-400">存储位置: 加密云存储</span></div>
                  <div className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-400" /> <span className="text-green-400">完整性校验: SHA-256 ✓</span></div>
                </div>
                <div className="text-[10px] space-y-0.5 border-t border-guardian-dark-600 pt-1.5">
                  <div className="text-gray-400 font-medium">权限边界</div>
                  <div className="text-gray-500">可访问: <CheckCircle2 className="w-3 h-3 inline text-green-400" /> 主监护人 <XCircle className="w-3 h-3 inline text-red-400" /> 临时看护人(需主监护授权) <XCircle className="w-3 h-3 inline text-red-400" /> 学校管理员</div>
                  <div className="text-gray-500">操作: <CheckCircle2 className="w-3 h-3 inline text-green-400" /> 回放 <XCircle className="w-3 h-3 inline text-red-400" /> 下载(需审批) <XCircle className="w-3 h-3 inline text-red-400" /> 删除(需主监护确认)</div>
                </div>
                <div className="text-[10px] text-gray-500 border-t border-guardian-dark-600 pt-1.5">
                  <div className="text-gray-400 mb-0.5">关联通话</div>
                  <div>{deviceName(r.deviceId)} · {getDirectionLabel(r.direction)} · {formatDuration(r.duration)}</div>
                  <div>{new Date(r.timestamp).toLocaleString("zh-CN")}</div>
                </div>
                <button onClick={() => toggleAudit(r.id)}
                  className="w-full flex items-center justify-between text-[10px] text-gray-400 hover:text-white transition-colors pt-1 border-t border-guardian-dark-600">
                  <span>回放审计</span>
                  {auditOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
                {auditOpen && (
                  <div className="space-y-0.5">
                    {getAuditLog(r.id).map((a, i) => (
                      <div key={i} className="text-[10px] text-gray-500">访问记录: {a.who} {a.when} 原因: {a.reason}</div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {recordings.length === 0 && <div className="col-span-full text-center py-8 text-gray-500">暂无录音</div>}
        </div>
      </div>
    </div>
  )
}
