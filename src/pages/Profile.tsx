import { useEffect } from "react"
import { Bell, CheckCircle2, KeyRound, Lock, ShieldCheck, Smartphone, UserRound } from "lucide-react"
import { Link } from "react-router-dom"
import { useAppStore } from "@/store"
import { getRoleLabel, formatTime } from "@/utils/format"

const PERMISSION_LABELS: Record<string, string> = {
  "device:manage": "设备管理",
  "member:manage": "成员管理",
  "geofence:manage": "围栏管理",
  "call:manage": "通话管理",
  "alert:manage": "告警处理",
  "privacy:manage": "隐私策略",
  "analytics:view": "异常分析",
}

export default function Profile() {
  const { members, devices, alerts, fetchMembers, fetchDevices, fetchAlerts } = useAppStore()

  useEffect(() => {
    fetchMembers()
    fetchDevices()
    fetchAlerts()
  }, [fetchAlerts, fetchDevices, fetchMembers])

  const currentUser = members.find((m) => m.role === "primary_guardian") ?? members[0]
  const activeAlerts = alerts.filter((a) => a.status === "pending" || a.status === "acknowledged")
  const managedDevices = devices.length

  if (!currentUser) {
    return (
      <div className="card text-center py-12 text-gray-400">
        个人资料加载中
      </div>
    )
  }

  const permissions = currentUser.permissions.map((p) => PERMISSION_LABELS[p] ?? p)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">个人中心</h1>
          <p className="text-sm text-gray-500 mt-1">我的资料、账号安全和监护权限</p>
        </div>
        <Link to="/members" className="btn-outline flex items-center gap-2">
          <ShieldCheck size={16} /> 成员后台管理
        </Link>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-2 card">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-guardian-blue flex items-center justify-center text-2xl font-bold text-white">
              {currentUser.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold text-white">{currentUser.name}</h2>
              <p className="text-sm text-gray-500 font-mono mt-1">{currentUser.phone}</p>
              <span className="inline-flex mt-3 px-2.5 py-1 rounded-full bg-guardian-blue/15 text-guardian-blue text-xs font-medium">
                {getRoleLabel(currentUser.role)}
              </span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-guardian-dark-800 p-3">
              <div className="text-gray-500 mb-1">加入时间</div>
              <div className="text-gray-200">{formatTime(currentUser.joinedAt)}</div>
            </div>
            <div className="rounded-lg bg-guardian-dark-800 p-3">
              <div className="text-gray-500 mb-1">管理设备</div>
              <div className="text-gray-200">{managedDevices} 台</div>
            </div>
          </div>
        </div>

        <div className="col-span-3 grid grid-cols-3 gap-4">
          {[
            { label: "账号状态", value: "已认证", icon: CheckCircle2, cls: "text-guardian-green" },
            { label: "活跃告警", value: `${activeAlerts.length} 条`, icon: Bell, cls: activeAlerts.length > 0 ? "text-guardian-orange" : "text-guardian-green" },
            { label: "安全等级", value: "高", icon: Lock, cls: "text-guardian-blue" },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="card">
                <div className={`w-10 h-10 rounded-xl bg-guardian-dark-600 flex items-center justify-center ${item.cls}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="mt-3 text-2xl font-bold text-white">{item.value}</div>
                <div className="text-xs text-gray-500 mt-1">{item.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 card">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <UserRound className="w-4 h-4 text-guardian-blue" /> 权限边界
          </h2>
          <div className="flex flex-wrap gap-2">
            {permissions.map((permission) => (
              <span key={permission} className="px-3 py-1.5 rounded-full bg-guardian-green/15 text-guardian-green text-xs font-medium">
                {permission}
              </span>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link to="/privacy" className="rounded-lg border border-guardian-dark-500 bg-guardian-dark-800 p-3 hover:border-guardian-blue transition-colors">
              <div className="text-sm font-medium text-white">隐私策略</div>
              <div className="text-xs text-gray-500 mt-1">查看通话加密、数据脱敏和位置保护状态</div>
            </Link>
            <Link to="/analytics" className="rounded-lg border border-guardian-dark-500 bg-guardian-dark-800 p-3 hover:border-guardian-blue transition-colors">
              <div className="text-sm font-medium text-white">异常分析</div>
              <div className="text-xs text-gray-500 mt-1">查看行为异常和规则配置</div>
            </Link>
          </div>
        </div>

        <div className="col-span-2 card">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-guardian-orange" /> 账号安全
          </h2>
          <div className="space-y-3">
            {[
              { label: "登录密码", value: "已设置", action: "修改" },
              { label: "短信验证", value: "已绑定", action: "更换" },
              { label: "设备登录保护", value: "已开启", action: "查看" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-lg bg-guardian-dark-800 p-3 text-sm">
                <div>
                  <div className="text-gray-200">{row.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{row.value}</div>
                </div>
                <button className="text-xs text-guardian-blue hover:underline">{row.action}</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-guardian-green" /> 最近登录与操作
        </h2>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {[
            { time: "2026-06-09 09:32", text: "本机登录个人中心", ip: "127.0.0.1" },
            { time: "2026-06-09 09:18", text: "查看成员详情", ip: "127.0.0.1" },
            { time: "2026-06-08 20:45", text: "更新围栏通知策略", ip: "192.168.1.24" },
          ].map((item) => (
            <div key={`${item.time}-${item.text}`} className="rounded-lg bg-guardian-dark-800 border border-guardian-dark-600 p-3">
              <div className="text-gray-200">{item.text}</div>
              <div className="text-xs text-gray-500 mt-2">{item.time} · {item.ip}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
