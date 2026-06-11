import { useEffect } from "react"
import { EyeOff, MapPinOff, Lock, Database, Shield, CheckCircle, AlertTriangle, Clock } from "lucide-react"
import { PieChart, Pie, ResponsiveContainer } from "recharts"
import { useAppStore } from "@/store"
import type { PrivacyPolicy, EncryptionStatus } from "@/types"

const POLICY_META: Record<string, { icon: typeof EyeOff; label: string; desc: string }> = {
  face_blur: { icon: EyeOff, label: "人脸模糊处理", desc: "自动检测并模糊处理相册中的人脸信息" },
  location_strip: { icon: MapPinOff, label: "位置元数据脱敏", desc: "自动剥离照片EXIF中的GPS位置信息" },
  call_encrypt: { icon: Lock, label: "通话端到端加密", desc: "所有通话数据采用AES-256加密传输" },
  data_mask: { icon: Database, label: "敏感数据脱敏", desc: "自动模糊处理界面中的敏感个人信息" },
}

const DATA_RETENTION = [
  { label: "录音保留期", days: 30, max: 30 },
  { label: "位置数据保留期", days: 90, max: 90 },
  { label: "日志保留期", days: 180, max: 180 },
]

function SecurityScore({ score }: { score: number }) {
  const data = [
    { value: score, fill: score >= 80 ? "#00C48C" : score >= 60 ? "#FBBF24" : "#EF4444" },
    { value: 100 - score, fill: "#243049" },
  ]
  return (
    <div className="relative w-16 h-16">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={22} outerRadius={30} startAngle={90} endAngle={-270} stroke="none" />
        </PieChart>
      </ResponsiveContainer>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{score}%</span>
    </div>
  )
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-14 h-7 rounded-full transition-all duration-300 flex-shrink-0 ${
        enabled ? "bg-guardian-green shadow-lg shadow-guardian-green/30" : "bg-guardian-dark-500"
      }`}
    >
      <span
        className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
          enabled ? "translate-x-7" : "translate-x-0.5"
        }`}
      />
    </button>
  )
}

function PolicyCard({ policy }: { policy: PrivacyPolicy }) {
  const updatePrivacyPolicy = useAppStore((s) => s.updatePrivacyPolicy)
  const meta = POLICY_META[policy.category]
  if (!meta) return null
  const Icon = meta.icon
  return (
    <div
      className={`card relative overflow-hidden ${
        policy.enabled ? "shadow-lg shadow-guardian-green/10 border-guardian-green/20" : ""
      }`}
    >
      {policy.enabled && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-guardian-green via-guardian-green/60 to-transparent" />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className={`p-2.5 rounded-xl ${policy.enabled ? "bg-guardian-green/15 text-guardian-green" : "bg-guardian-dark-600 text-gray-500"}`}>
          <Icon className="w-5 h-5" />
        </div>
        <Toggle enabled={policy.enabled} onToggle={() => updatePrivacyPolicy(policy.id, !policy.enabled)} />
      </div>
      <div className="mt-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">{meta.label}</h3>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${policy.enabled ? "bg-guardian-green/15 text-guardian-green" : "bg-gray-700 text-gray-500"}`}>
            {policy.enabled ? "已启用" : "已禁用"}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{meta.desc}</p>
      </div>
      <div className="mt-3">
        <span className="text-[10px] px-2 py-0.5 rounded bg-guardian-dark-600 text-gray-400">{policy.category}</span>
      </div>
    </div>
  )
}

function EncryptionDashboard({ status }: { status: EncryptionStatus }) {
  const enabledBlocks = [
    status.callEncryption.enabled,
    status.dataMasking.enabled,
    status.faceBlur.enabled,
    status.locationStrip.enabled,
  ].filter(Boolean).length
  const score = Math.round((enabledBlocks / 4) * 100)
  const protectionLabel: Record<EncryptionStatus["overallStatus"], string> = {
    fully_protected: "全面保护",
    partially_protected: "部分保护",
    unprotected: "未保护",
  }
  const sections = [
    {
      title: "通话端到端加密",
      details: [
        { label: "算法", value: status.callEncryption.algorithm },
        { label: "密钥轮换", value: status.callEncryption.keyRotation },
        { label: "上次轮换", value: status.callEncryption.lastRotated },
      ],
      ok: status.callEncryption.enabled,
    },
    {
      title: "敏感数据脱敏",
      details: [
        { label: "手机号脱敏", value: status.dataMasking.maskPhone ? "已启用" : "未启用" },
        { label: "姓名脱敏", value: status.dataMasking.maskName ? "已启用" : "未启用" },
      ],
      ok: status.dataMasking.enabled,
    },
    {
      title: "图像与位置保护",
      details: [
        { label: "人脸模糊", value: status.faceBlur.enabled ? status.faceBlur.blurLevel : "未启用" },
        { label: "位置精度", value: status.locationStrip.enabled ? status.locationStrip.precisionLevel : "未启用" },
        { label: "整体状态", value: protectionLabel[status.overallStatus] },
      ],
      ok: status.faceBlur.enabled && status.locationStrip.enabled,
    },
  ]

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-guardian-blue" />
          加密状态监控
        </h3>
        <SecurityScore score={score} />
      </div>
      <div className="space-y-4">
        {sections.map((s) => (
          <div key={s.title} className="p-3 rounded-lg bg-guardian-dark-800 border border-guardian-dark-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-300">{s.title}</span>
              {s.ok ? (
                <CheckCircle className="w-4 h-4 text-guardian-green" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-guardian-orange" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {s.details.map((d) => (
                <div key={d.label} className="flex justify-between text-[11px]">
                  <span className="text-gray-500">{d.label}</span>
                  <span className="text-gray-300 font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DataMinimization() {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-guardian-orange" />
        数据最小化
      </h3>
      <div className="space-y-3">
        {DATA_RETENTION.map((d) => (
          <div key={d.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-400">{d.label}</span>
              <span className="text-gray-300 font-mono">{d.days}天</span>
            </div>
            <div className="h-1.5 rounded-full bg-guardian-dark-500 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-guardian-green to-guardian-blue transition-all"
                style={{ width: "70%" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Privacy() {
  const { privacyPolicies, encryptionStatus, fetchPrivacyPolicies, fetchEncryptionStatus } = useAppStore()

  useEffect(() => {
    fetchPrivacyPolicies()
    fetchEncryptionStatus()
  }, [])

  const enabledCount = privacyPolicies.filter((p) => p.enabled).length
  const securityScore = privacyPolicies.length > 0 ? Math.round((enabledCount / privacyPolicies.length) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">隐私保护</h1>
          <p className="text-sm text-gray-500 mt-1">管理与监控儿童数据隐私安全策略</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">安全评分</span>
          <SecurityScore score={securityScore} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-gray-400 mb-3">隐私策略引擎</h2>
        <div className="grid grid-cols-2 gap-4">
          {privacyPolicies.map((p) => (
            <PolicyCard key={p.id} policy={p} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3">
          {encryptionStatus && <EncryptionDashboard status={encryptionStatus} />}
        </div>
        <div className="col-span-2">
          <DataMinimization />
        </div>
      </div>
    </div>
  )
}
