import { useMemo, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  FileText,
  MessageCircle,
  Heart,
  CreditCard,
  Car,
  ChevronRight,
  Shield,
  ClipboardCheck,
  ScrollText,
  AlertTriangle,
  Fingerprint,
  Plane,
  Search,
} from "lucide-react"
import { useAppStore } from "@/stores/useAppStore"
import { mockServiceGuides } from "@/lib/mockData"

const businessDomains = [
  {
    icon: FileText,
    title: "办事",
    description: "在线申办各类公安业务",
    to: "/service",
    color: "bg-gov-blue",
    lightColor: "bg-primary-50",
    textColor: "text-gov-blue",
  },
  {
    icon: MessageCircle,
    title: "咨询",
    description: "智能客服全天候答疑解惑",
    to: "/consult",
    color: "bg-status-info",
    lightColor: "bg-blue-50",
    textColor: "text-status-info",
  },
  {
    icon: Heart,
    title: "便民",
    description: "一站式便民服务查询办理",
    to: "/service",
    color: "bg-gov-red",
    lightColor: "bg-red-50",
    textColor: "text-gov-red",
  },
  {
    icon: CreditCard,
    title: "证照",
    description: "电子证照随身查随时用",
    to: "/certificate",
    color: "bg-gov-gold",
    lightColor: "bg-amber-50",
    textColor: "text-gov-gold",
  },
  {
    icon: Car,
    title: "交管",
    description: "交通违法查询与缴费处理",
    to: "/traffic",
    color: "bg-status-success",
    lightColor: "bg-green-50",
    textColor: "text-status-success",
  },
]

const hotServices = [
  { name: "户籍证明", icon: ClipboardCheck, to: "/service/sg1" },
  { name: "无犯罪记录证明", icon: ScrollText, to: "/service/sg2" },
  { name: "违法查询", icon: AlertTriangle, to: "/traffic" },
  { name: "护照办理", icon: Plane, to: "/service/sg4" },
  { name: "居住证申领", icon: Fingerprint, to: "/service/sg3" },
  { name: "港澳通行证", icon: Shield, to: "/service/sg5" },
]

const announcementTypeMap: Record<string, { label: string; className: string }> = {
  policy: { label: "政策", className: "badge-info" },
  notice: { label: "通知", className: "badge-warning" },
  safety: { label: "安全", className: "badge-error" },
}

export default function Home() {
  const { announcements } = useAppStore()
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState("")
  const trimmedKeyword = keyword.trim()
  const searchResults = useMemo(() => {
    if (!trimmedKeyword) return []
    return mockServiceGuides.filter((guide) => {
      const haystack = [
        guide.name,
        guide.category,
        guide.description,
        guide.processingTime,
        guide.fees,
        ...guide.requiredMaterials,
      ].join(" ")
      return haystack.includes(trimmedKeyword)
    }).slice(0, 4)
  }, [trimmedKeyword])

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigate(`/service?q=${encodeURIComponent(trimmedKeyword)}`)
  }

  return (
    <div className="animate-fade-in">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-gov-blue">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-gov-blue/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gov-gold/5 rounded-full blur-3xl" />
          <div className="absolute top-0 right-1/4 w-40 h-40 bg-white/3 rounded-full blur-2xl" />
        </div>

        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
                <Shield className="w-4 h-4 text-gov-gold" />
                <span className="text-sm text-white/90 font-medium">贵州省公安厅政务服务</span>
              </div>
            </div>

            <h1 className="animate-slide-up text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight mb-4"
              style={{ animationDelay: "0.1s" }}
            >
              贵州公安互联网+政务服务
            </h1>

            <p className="animate-slide-up text-lg sm:text-xl text-primary-200 mb-8 tracking-wide"
              style={{ animationDelay: "0.2s" }}
            >
              一网通办 · 最多跑一次
            </p>

            <div className="animate-slide-up flex flex-wrap gap-4"
              style={{ animationDelay: "0.3s" }}
            >
              <Link to="/service" className="btn-primary bg-white text-primary-800 hover:bg-primary-50 px-8 py-3 text-base shadow-lg shadow-black/10">
                立即办事
              </Link>
              <Link to="/consult" className="btn-secondary border-white/40 text-white hover:bg-white/10 px-8 py-3 text-base">
                智能咨询
              </Link>
            </div>

            <div className="animate-slide-up mt-8 max-w-xl" style={{ animationDelay: "0.4s" }}>
              <form onSubmit={handleSearch} className="flex items-center gap-2 rounded-xl bg-white/95 p-2 shadow-lg shadow-black/10">
                <Search className="w-5 h-5 text-gov-blue ml-2 shrink-0" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  className="flex-1 min-w-0 bg-transparent px-2 py-2 text-primary outline-none"
                  placeholder="搜索户籍证明、护照办理、居住证申领"
                />
                <button type="submit" className="btn-primary px-5 py-2" disabled={!trimmedKeyword}>
                  搜索
                </button>
              </form>
              {trimmedKeyword && (
                <div className="mt-2 overflow-hidden rounded-xl bg-white shadow-lg shadow-black/10">
                  {searchResults.length > 0 ? (
                    searchResults.map((guide) => (
                      <Link
                        key={guide.id}
                        to={`/service/${guide.id}`}
                        className="flex items-center justify-between border-b border-neutral-divider px-4 py-3 text-sm last:border-b-0 hover:bg-primary-50"
                      >
                        <span className="font-medium text-primary">{guide.name}</span>
                        <span className="text-neutral-slate">{guide.category} · {guide.processingTime}</span>
                      </Link>
                    ))
                  ) : (
                    <Link to={`/service?q=${encodeURIComponent(trimmedKeyword)}`} className="block px-4 py-3 text-sm text-primary hover:bg-primary-50">
                      查看“{trimmedKeyword}”相关结果
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="w-64 h-64 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center animate-pulse-slow">
                <Shield className="w-28 h-28 text-white/20" />
              </div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gov-gold/20 rounded-xl backdrop-blur-sm border border-gov-gold/20 flex items-center justify-center">
                <FileText className="w-8 h-8 text-gov-gold/60" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gov-red/20 rounded-xl backdrop-blur-sm border border-gov-red/20 flex items-center justify-center">
                <Heart className="w-8 h-8 text-gov-red/60" />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-neutral-bg to-transparent" />
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {businessDomains.map((domain, index) => {
            const Icon = domain.icon
            return (
              <Link
                key={domain.title}
                to={domain.to}
                className="animate-slide-up card p-5 sm:p-6 text-center group hover:-translate-y-1 transition-all duration-300"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <div className={`w-14 h-14 ${domain.lightColor} rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-7 h-7 ${domain.textColor}`} />
                </div>
                <h3 className="font-serif font-semibold text-primary text-lg mb-1">{domain.title}</h3>
                <p className="text-sm text-neutral-slate">{domain.description}</p>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="section-title mb-5">热门服务</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {hotServices.map((service, index) => {
                const Icon = service.icon
                return (
                  <Link
                    key={service.name}
                    to={service.to}
                    className="animate-slide-up card px-5 py-4 flex items-center justify-between group hover:-translate-y-0.5 transition-all duration-300"
                    style={{ animationDelay: `${0.6 + index * 0.08}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-gov-blue" />
                      </div>
                      <span className="font-medium text-primary">{service.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-slate group-hover:text-gov-blue group-hover:translate-x-0.5 transition-all duration-200" />
                  </Link>
                )
              })}
            </div>
          </div>

          <div>
            <h2 className="section-title mb-5">最新公告</h2>
            <div className="card divide-y divide-neutral-divider">
              {announcements.map((announcement, index) => {
                const typeInfo = announcementTypeMap[announcement.type]
                return (
                  <div
                    key={announcement.id}
                    className="animate-slide-up px-5 py-4 flex items-start gap-3 hover:bg-primary-50/50 transition-colors duration-200"
                    style={{ animationDelay: `${0.7 + index * 0.08}s` }}
                  >
                    <div className="relative shrink-0">
                      <span className={typeInfo.className}>{typeInfo.label}</span>
                      {!announcement.isRead && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-gov-red rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!announcement.isRead ? "font-semibold text-primary" : "text-neutral-slate"}`}>
                        {announcement.title}
                      </p>
                      <p className="text-xs text-neutral-slate/60 mt-1">{announcement.date}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
