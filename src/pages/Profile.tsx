import { useState } from "react"
import { User, FileText, CreditCard, Lightbulb, Edit, Clock, ChevronRight } from "lucide-react"
import { useAppStore } from "@/stores/useAppStore"
import type { ServiceApplication, Suggestion } from "@/lib/mockData"

const tabs = [
  { key: "applications", label: "我的申办", icon: FileText },
  { key: "certificates", label: "我的证照", icon: CreditCard },
  { key: "suggestions", label: "我的建议", icon: Lightbulb },
] as const

type TabKey = (typeof tabs)[number]["key"]

const appStatusLabels: Record<ServiceApplication["status"], string> = {
  pending: "待受理",
  processing: "办理中",
  approved: "已通过",
  rejected: "已驳回",
  completed: "已办结",
}

const appStatusBadge: Record<ServiceApplication["status"], string> = {
  pending: "badge-warning",
  processing: "badge-info",
  approved: "badge-success",
  rejected: "badge-error",
  completed: "badge-success",
}

const sugStatusLabels: Record<Suggestion["status"], string> = {
  submitted: "已提交",
  assigned: "已受理",
  processing: "办理中",
  completed: "已完成",
}

const sugStatusBadge: Record<Suggestion["status"], string> = {
  submitted: "badge-warning",
  assigned: "badge-info",
  processing: "badge-info",
  completed: "badge-success",
}

function ProgressRing({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10 shrink-0">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E2E8F0" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke="#1A5FB4"
            strokeWidth="3"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-gov-blue">
          {current}/{total}
        </span>
      </div>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gov-blue rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function ApplicationsTab() {
  const applications = useAppStore((s) => s.applications)

  if (applications.length === 0) {
    return (
      <div className="card p-10 text-center text-neutral-slate">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>暂无申办记录</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <div key={app.id} className="card p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-base font-semibold text-primary">{app.typeName}</h4>
                <span className={appStatusBadge[app.status]}>{appStatusLabels[app.status]}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-neutral-slate">
                <Clock className="w-3.5 h-3.5" />
                <span>{app.submitTime}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 shrink-0 mt-1" />
          </div>
          <ProgressRing current={app.currentStep} total={app.totalSteps} />
        </div>
      ))}
    </div>
  )
}

function CertificatesTab() {
  const certificates = useAppStore((s) => s.certificates)

  const certStatusMap: Record<string, { label: string; className: string }> = {
    valid: { label: "有效", className: "badge-success" },
    expired: { label: "已过期", className: "badge-error" },
    revoked: { label: "已注销", className: "badge-warning" },
  }

  const certGradientMap: Record<string, string> = {
    id_card: "from-primary-800 via-primary-700 to-gov-blue",
    driver_license: "from-teal-700 via-teal-600 to-teal-500",
    passport: "from-red-800 via-red-700 to-red-600",
  }

  const certIconMap: Record<string, React.ReactNode> = {
    id_card: <CreditCard className="w-6 h-6" />,
    driver_license: <CreditCard className="w-6 h-6" />,
    passport: <CreditCard className="w-6 h-6" />,
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
      {certificates.map((cert) => {
        const status = certStatusMap[cert.status]
        return (
          <div
            key={cert.id}
            className={`snap-start shrink-0 w-64 bg-gradient-to-br ${certGradientMap[cert.type] ?? "from-primary-800 to-gov-blue"} rounded-xl p-5 text-white shadow-lg`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-white/15 backdrop-blur-sm">
                {certIconMap[cert.type]}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold truncate">{cert.typeName}</h4>
                <span className={`badge mt-0.5 ${status.className} !text-[10px]`}>
                  {status.label}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="opacity-70">持证人</span>
                <span className="font-medium">{cert.holderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">有效期至</span>
                <span>{cert.expiryDate}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SuggestionsTab() {
  const suggestions = useAppStore((s) => s.suggestions)

  if (suggestions.length === 0) {
    return (
      <div className="card p-10 text-center text-neutral-slate">
        <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>暂无建议记录</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {suggestions.map((sug) => (
        <div key={sug.id} className="card p-5">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm text-primary flex-1 mr-3 line-clamp-2">
              {sug.content.length > 50 ? sug.content.slice(0, 50) + "…" : sug.content}
            </p>
            <ChevronRight className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="badge-info">{sug.category}</span>
            <span className={sugStatusBadge[sug.status]}>{sugStatusLabels[sug.status]}</span>
            <span className="text-neutral-slate ml-auto">{sug.createdAt.split(" ")[0]}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState<TabKey>("applications")

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="card overflow-hidden">
        <div className="relative h-28 bg-gradient-to-r from-primary via-primary-700 to-gov-blue">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full border-2 border-white/20" />
            <div className="absolute -left-6 -bottom-6 w-32 h-32 rounded-full border border-white/10" />
          </div>
        </div>
        <div className="relative px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10">
            <div className="w-20 h-20 rounded-full bg-gov-blue border-4 border-white shadow-md flex items-center justify-center text-white text-2xl font-serif font-semibold shrink-0">
              张
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-serif font-semibold text-primary">张三</h2>
                <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gov-blue">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 text-sm text-neutral-slate">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gov-blue" />
              <span>身份证：5221********1234</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gov-blue" />
              <span>手机号：138****5678</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-neutral-border">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? "text-gov-blue"
                  : "text-neutral-slate hover:text-primary"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gov-blue rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      <div>
        {activeTab === "applications" && <ApplicationsTab />}
        {activeTab === "certificates" && <CertificatesTab />}
        {activeTab === "suggestions" && <SuggestionsTab />}
      </div>
    </div>
  )
}
