import { useEffect, useState } from "react"
import { Clock, Moon, Wifi, Route, Shield, ChevronDown } from "lucide-react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { useAppStore } from "@/store"
import { formatTime, getAnomalyTypeLabel } from "@/utils/format"
import type { BehaviorAnomaly, BehaviorRule } from "@/types"

const TYPE_ICON: Record<string, React.ElementType> = {
  prolonged_stillness: Clock,
  nighttime_movement: Moon,
  signal_anomaly: Wifi,
  unusual_route: Route,
}

const TYPE_COLOR: Record<string, string> = {
  prolonged_stillness: "border-guardian-orange",
  nighttime_movement: "border-purple-500",
  signal_anomaly: "border-yellow-500",
  unusual_route: "border-red-500",
}

const TYPE_ICON_BG: Record<string, string> = {
  prolonged_stillness: "bg-guardian-orange/20 text-guardian-orange",
  nighttime_movement: "bg-purple-500/20 text-purple-400",
  signal_anomaly: "bg-yellow-500/20 text-yellow-400",
  unusual_route: "bg-red-500/20 text-red-400",
}

function confidenceColor(v: number) {
  if (v > 80) return "bg-red-500"
  if (v >= 50) return "bg-guardian-orange"
  return "bg-guardian-green"
}

const CHART_TT_STYLE = { background: "#1A2035", border: "1px solid #2D3A54", borderRadius: 8, fontSize: 12 }

const DEFAULT_RULES: Omit<BehaviorRule, "id">[] = [
  { type: "prolonged_stillness", threshold: 60, sensitivity: "medium", enabled: true, timeRange: undefined },
  { type: "nighttime_movement", threshold: 2200, sensitivity: "high", enabled: true, timeRange: { start: "22:00", end: "06:00" } },
  { type: "signal_anomaly", threshold: 3, sensitivity: "medium", enabled: true },
  { type: "unusual_route", threshold: 500, sensitivity: "low", enabled: true },
]

const RULE_LABELS: Record<string, string> = {
  prolonged_stillness: "长时间静止",
  nighttime_movement: "夜间异常移动",
  signal_anomaly: "信号异常",
  unusual_route: "异常路线",
}

const RULE_UNIT: Record<string, string> = { prolonged_stillness: "分钟", nighttime_movement: "", signal_anomaly: "次", unusual_route: "米" }

const SENSITIVITY_OPTS: { value: BehaviorRule["sensitivity"]; label: string }[] = [
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
]

export default function Analytics() {
  const { devices, anomalies, behaviorRules, trendData, fetchAnomalies, fetchBehaviorRules, fetchTrendData, updateBehaviorRule } = useAppStore()
  const [deviceId, setDeviceId] = useState("")
  const [timeRange, setTimeRange] = useState<"7" | "30">("7")

  useEffect(() => {
    fetchAnomalies(deviceId ? { deviceId } : undefined)
    fetchBehaviorRules()
    fetchTrendData(deviceId ? { deviceId, days: timeRange } : { days: timeRange })
  }, [deviceId, timeRange])

  const rules = behaviorRules.length > 0 ? behaviorRules : DEFAULT_RULES.map((r, i) => ({ ...r, id: `default-${i}` }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">异常行为分析</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}
              className="appearance-none bg-guardian-dark-700 border border-guardian-dark-500 rounded-lg px-3 py-2 pr-8 text-sm text-gray-300 focus:outline-none focus:border-guardian-blue">
              <option value="">全部设备</option>
              {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          <div className="flex bg-guardian-dark-700 border border-guardian-dark-500 rounded-lg overflow-hidden">
            {(["7", "30"] as const).map((d) => (
              <button key={d} onClick={() => setTimeRange(d)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${timeRange === d ? "bg-guardian-blue text-white" : "text-gray-400 hover:text-gray-200"}`}>
                {d}天
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-guardian-orange" /> 实时异常
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {anomalies.length === 0 && (
            <div className="card text-gray-500 text-sm w-full text-center py-8">暂无异常记录</div>
          )}
          {anomalies.map((a: BehaviorAnomaly) => {
            const Icon = TYPE_ICON[a.type] || Shield
            return (
              <div key={a.id} className={`card-hover flex-shrink-0 w-72 border-l-4 ${TYPE_COLOR[a.type]} flex gap-3`}>
                <div className={`p-2.5 rounded-lg h-fit ${TYPE_ICON_BG[a.type]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{getAnomalyTypeLabel(a.type)}</span>
                    <span className="text-[10px] text-gray-500">{formatTime(a.timestamp)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 truncate">{a.description}</p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-guardian-dark-500 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${confidenceColor(a.confidence)}`} style={{ width: `${a.confidence}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">{a.confidence}%</span>
                  </div>
                  <button onClick={() => useAppStore.getState().fetchAnomalies(deviceId ? { deviceId } : undefined)}
                    className={`mt-2.5 text-xs px-2.5 py-1 rounded-md transition-colors ${a.resolved ? "bg-guardian-green/20 text-guardian-green" : "bg-guardian-dark-600 text-gray-400 hover:text-white"}`}>
                    {a.resolved ? "已处理" : "标记已处理"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 mb-4">异常趋势</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gStillness" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} /><stop offset="95%" stopColor="#FF6B35" stopOpacity={0} /></linearGradient>
                <linearGradient id="gNight" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#A78BFA" stopOpacity={0.3} /><stop offset="95%" stopColor="#A78BFA" stopOpacity={0} /></linearGradient>
                <linearGradient id="gSignal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FBBF24" stopOpacity={0.3} /><stop offset="95%" stopColor="#FBBF24" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
              <Tooltip contentStyle={CHART_TT_STYLE} itemStyle={{ color: "#E5E7EB" }} />
              <Area type="monotone" dataKey="stillness" stroke="#FF6B35" fill="url(#gStillness)" strokeWidth={2} name="静止" />
              <Area type="monotone" dataKey="nightMove" stroke="#A78BFA" fill="url(#gNight)" strokeWidth={2} name="夜间移动" />
              <Area type="monotone" dataKey="signalAnomaly" stroke="#FBBF24" fill="url(#gSignal)" strokeWidth={2} name="信号异常" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-400 mb-4">异常分布</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[
              { name: "长时间静止", value: anomalies.filter((a) => a.type === "prolonged_stillness").length },
              { name: "夜间移动", value: anomalies.filter((a) => a.type === "nighttime_movement").length },
              { name: "信号异常", value: anomalies.filter((a) => a.type === "signal_anomaly").length },
              { name: "异常路线", value: anomalies.filter((a) => a.type === "unusual_route").length },
            ]} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
              <Tooltip contentStyle={CHART_TT_STYLE} itemStyle={{ color: "#E5E7EB" }} />
              <Bar dataKey="value" fill="#1A6DFF" radius={[4, 4, 0, 0]} name="异常次数" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-guardian-blue" /> 告警规则配置
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-guardian-dark-500">
                <th className="text-left py-3 font-medium">规则类型</th>
                <th className="text-left py-3 font-medium">阈值</th>
                <th className="text-left py-3 font-medium">灵敏度</th>
                <th className="text-left py-3 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b border-guardian-dark-600 hover:bg-guardian-dark-600/30 transition-colors">
                  <td className="py-3 text-white font-medium">{RULE_LABELS[rule.type] || rule.type}</td>
                  <td className="py-3">
                    {rule.type === "nighttime_movement" ? (
                      <span className="text-gray-300">{rule.timeRange?.start}-{rule.timeRange?.end}</span>
                    ) : (
                      <span className="text-gray-300">{rule.threshold}{RULE_UNIT[rule.type]}</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      {SENSITIVITY_OPTS.map((opt) => (
                        <label key={opt.value} className="cursor-pointer">
                          <input type="radio" name={`sens-${rule.id}`} value={opt.value}
                            checked={rule.sensitivity === opt.value}
                            onChange={() => updateBehaviorRule(rule.id, { sensitivity: opt.value })}
                            className="hidden" />
                          <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                            rule.sensitivity === opt.value
                              ? "bg-guardian-blue/20 text-guardian-blue border border-guardian-blue/40"
                              : "bg-guardian-dark-600 text-gray-500 border border-transparent hover:text-gray-300"
                          }`}>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                  <td className="py-3">
                    <button onClick={() => updateBehaviorRule(rule.id, { enabled: !rule.enabled })}
                      className={`relative w-10 h-5 rounded-full transition-colors ${rule.enabled ? "bg-guardian-blue" : "bg-guardian-dark-500"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${rule.enabled ? "left-5" : "left-0.5"}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
