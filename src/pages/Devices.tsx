import { useState, useEffect } from "react"
import { Watch, Footprints, Plus, Settings, Upload, Shield, X, Save } from "lucide-react"
import type { DeviceSettings } from "@/types"
import { useAppStore } from "@/store"
import { getStatusColor } from "@/utils/format"

type PanelType = "settings" | "permissions" | "ota"

const STATUS_LABEL: Record<string, string> = { online: "在线", offline: "离线", sos: "SOS" }
const STATUS_BG: Record<string, string> = {
  online: "bg-guardian-green/20 text-guardian-green",
  offline: "bg-gray-500/20 text-gray-400",
  sos: "bg-red-500/20 text-red-400 animate-pulse",
}

function SignalDots({ strength }: { strength: number }) {
  return (
    <div className="flex items-end gap-0.5">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`w-1.5 rounded-sm ${i <= strength ? "bg-guardian-green" : "bg-guardian-dark-500"}`}
          style={{ height: `${4 + i * 3}px` }} />
      ))}
    </div>
  )
}

function BatteryBar({ level }: { level: number }) {
  const color = level > 50 ? "bg-guardian-green" : level > 20 ? "bg-guardian-orange" : "bg-guardian-red"
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="h-2 flex-1 rounded-full bg-guardian-dark-500">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${level}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-8">{level}%</span>
    </div>
  )
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button className={`w-10 h-5 rounded-full transition-colors relative ${on ? "bg-guardian-blue" : "bg-guardian-dark-500"}`}
      onClick={onToggle}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  )
}

export default function Devices() {
  const { devices, fetchDevices, updateDeviceSettings } = useAppStore()
  const [bindOpen, setBindOpen] = useState(false)
  const [expanded, setExpanded] = useState<{ id: string; type: PanelType } | null>(null)
  const [bindForm, setBindForm] = useState({ imei: "", name: "", type: "watch" as "watch" | "shoe" })
  const [editSettings, setEditSettings] = useState<Partial<DeviceSettings>>({})
  const [editPermissions, setEditPermissions] = useState<Partial<DeviceSettings>>({})
  const [otaProgress, setOtaProgress] = useState(0)
  const [otaStarted, setOtaStarted] = useState(false)

  useEffect(() => { fetchDevices() }, [fetchDevices])

  const togglePanel = (id: string, type: PanelType) => {
    const device = devices.find(d => d.id === id)
    if (expanded?.id === id && expanded?.type === type) { setExpanded(null); return }
    if (type === "settings") setEditSettings(device?.settings ?? { batteryWarningThreshold: 30, batteryCriticalThreshold: 10 })
    if (type === "permissions") setEditPermissions(device?.settings ?? { blockUnknownCalls: false, restrictedApps: [], classModeEnabled: false, classModeSchedule: [{ start: "08:00", end: "17:00" }] })
    if (type === "ota") { setOtaProgress(0); setOtaStarted(false) }
    setExpanded({ id, type })
  }

  const startOta = () => {
    setOtaStarted(true)
    setOtaProgress(0)
    const iv = setInterval(() => {
      setOtaProgress(p => {
        if (p >= 100) { clearInterval(iv); return 100 }
        return p + Math.random() * 15
      })
    }, 500)
  }

  const saveSettings = async (id: string) => {
    await updateDeviceSettings(id, editSettings)
    setExpanded(null)
  }

  const savePermissions = async (id: string) => {
    await updateDeviceSettings(id, editPermissions)
    setExpanded(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">设备管理</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setBindOpen(true)}>
          <Plus size={18} /> 绑定设备
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {devices.map(device => (
          <div key={device.id} className="space-y-3">
            <div className="card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-guardian-dark-600">
                    {device.type === "watch"
                      ? <Watch size={24} className="text-guardian-blue" />
                      : <Footprints size={24} className="text-guardian-orange" />}
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {device.name}
                      <span className={`w-2 h-2 rounded-full ${device.status === "online" ? "bg-guardian-green" : device.status === "sos" ? "bg-red-500 animate-pulse" : "bg-gray-500"}`} />
                    </div>
                    <div className="text-xs text-gray-500 font-mono">{device.imei}</div>
                    <div className={`text-xs ${getStatusColor(device.status)}`}>{STATUS_LABEL[device.status]}</div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BG[device.status]}`}>
                  {STATUS_LABEL[device.status]}
                </span>
              </div>

              <div className="space-y-2.5 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-8">电量</span>
                  <BatteryBar level={device.batteryLevel} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-8">信号</span>
                  <SignalDots strength={device.signalStrength} />
                </div>
                <div className="text-xs text-gray-500">固件 v{device.firmwareVersion}</div>
              </div>

              <div className="flex gap-2">
                <button className="btn-outline flex-1 text-xs py-1.5 flex items-center justify-center gap-1"
                  onClick={() => togglePanel(device.id, "settings")}><Settings size={14} /> 设置</button>
                <button className="btn-outline flex-1 text-xs py-1.5 flex items-center justify-center gap-1"
                  onClick={() => togglePanel(device.id, "ota")}><Upload size={14} /> OTA升级</button>
                <button className="btn-outline flex-1 text-xs py-1.5 flex items-center justify-center gap-1"
                  onClick={() => togglePanel(device.id, "permissions")}><Shield size={14} /> 权限管理</button>
              </div>
            </div>

            {expanded?.id === device.id && expanded.type === "settings" && (
              <div className="card animate-slide-up space-y-4">
                <h3 className="font-medium text-sm">设备设置</h3>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">电量预警阈值 ({editSettings.batteryWarningThreshold}%)</label>
                  <input type="range" min={0} max={100} value={editSettings.batteryWarningThreshold ?? 30}
                    onChange={e => setEditSettings(s => ({ ...s, batteryWarningThreshold: +e.target.value }))}
                    className="w-full accent-guardian-orange" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">电量严重阈值 ({editSettings.batteryCriticalThreshold}%)</label>
                  <input type="range" min={0} max={50} value={editSettings.batteryCriticalThreshold ?? 10}
                    onChange={e => setEditSettings(s => ({ ...s, batteryCriticalThreshold: +e.target.value }))}
                    className="w-full accent-guardian-red" />
                </div>
                <button className="btn-primary text-sm py-1.5 flex items-center gap-1" onClick={() => saveSettings(device.id)}>
                  <Save size={14} /> 保存
                </button>
              </div>
            )}

            {expanded?.id === device.id && expanded.type === "permissions" && (
              <div className="card animate-slide-up space-y-4">
                <h3 className="font-medium text-sm">权限管理</h3>
                {([
                  ["blockUnknownCalls", "禁用陌生号码呼入"],
                  ["restrictedApps", "限制系统应用"],
                  ["classModeEnabled", "上课模式"],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">{label}</span>
                    <Toggle on={!!editPermissions[key]} onToggle={() => setEditPermissions(s => ({ ...s, [key]: !s[key] }))} />
                  </div>
                ))}
                {editPermissions.classModeEnabled && (
                  <div className="flex items-center gap-3">
                    <input type="time" className="bg-guardian-dark-800 border border-guardian-dark-500 rounded px-2 py-1 text-sm"
                      value={editPermissions.classModeSchedule?.[0]?.start ?? "08:00"}
                      onChange={e => setEditPermissions(s => ({
                        ...s, classModeSchedule: [{ start: e.target.value, end: s.classModeSchedule?.[0]?.end ?? "17:00" }]
                      }))} />
                    <span className="text-gray-400">至</span>
                    <input type="time" className="bg-guardian-dark-800 border border-guardian-dark-500 rounded px-2 py-1 text-sm"
                      value={editPermissions.classModeSchedule?.[0]?.end ?? "17:00"}
                      onChange={e => setEditPermissions(s => ({
                        ...s, classModeSchedule: [{ start: s.classModeSchedule?.[0]?.start ?? "08:00", end: e.target.value }]
                      }))} />
                  </div>
                )}
                <button className="btn-primary text-sm py-1.5 flex items-center gap-1" onClick={() => savePermissions(device.id)}>
                  <Save size={14} /> 保存
                </button>
              </div>
            )}

            {expanded?.id === device.id && expanded.type === "ota" && (
              <div className="card animate-slide-up space-y-4">
                <h3 className="font-medium text-sm">OTA 升级</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">当前: <span className="text-white">v{device.firmwareVersion}</span></span>
                  <span className="text-gray-400">最新: <span className="text-guardian-green">v3.2.1</span></span>
                </div>
                {otaStarted && (
                  <div>
                    <div className="h-2 rounded-full bg-guardian-dark-500">
                      <div className="h-full rounded-full bg-guardian-blue transition-all duration-300"
                        style={{ width: `${Math.min(otaProgress, 100)}%` }} />
                    </div>
                    <span className="text-xs text-gray-400">{Math.min(Math.round(otaProgress), 100)}%</span>
                  </div>
                )}
                <button className="btn-primary text-sm py-1.5" onClick={startOta}
                  disabled={otaStarted && otaProgress < 100}>开始升级</button>
                <div className="bg-guardian-dark-800 rounded-lg p-3 text-xs font-mono text-gray-400 space-y-1 max-h-28 overflow-y-auto">
                  <div>[INFO] 检查固件更新...</div>
                  <div>[INFO] 发现新版本 v3.2.1</div>
                  {otaStarted && <div>[INFO] 下载固件包... {Math.min(Math.round(otaProgress), 100)}%</div>}
                  {otaProgress >= 100 && <div className="text-guardian-green">[SUCCESS] 升级完成</div>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {bindOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setBindOpen(false)}>
          <div className="card w-96 space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-medium">绑定设备</h3>
              <button onClick={() => setBindOpen(false)}><X size={18} className="text-gray-400 hover:text-white" /></button>
            </div>
            <input placeholder="IMEI号" value={bindForm.imei}
              onChange={e => setBindForm(s => ({ ...s, imei: e.target.value }))}
              className="w-full bg-guardian-dark-800 border border-guardian-dark-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-guardian-blue" />
            <input placeholder="设备名称" value={bindForm.name}
              onChange={e => setBindForm(s => ({ ...s, name: e.target.value }))}
              className="w-full bg-guardian-dark-800 border border-guardian-dark-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-guardian-blue" />
            <select value={bindForm.type}
              onChange={e => setBindForm(s => ({ ...s, type: e.target.value as "watch" | "shoe" }))}
              className="w-full bg-guardian-dark-800 border border-guardian-dark-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-guardian-blue">
              <option value="watch">手表</option>
              <option value="shoe">定位鞋</option>
            </select>
            <button className="btn-primary w-full" onClick={() => setBindOpen(false)}>确认绑定</button>
          </div>
        </div>
      )}
    </div>
  )
}
