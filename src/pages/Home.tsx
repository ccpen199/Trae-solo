import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HeartHandshake,
  FileCheck,
  Stethoscope,
  Car,
  GraduationCap,
  Coffee,
  ArrowRight,
  Clock,
  Star,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Search,
  CalendarCheck,
  FileEdit,
  Upload,
  Route,
  Bell,
  MessageSquare,
  CheckCircle2,
  Circle,
  Users,
  Building2,
  Shield,
  Lock,
  Globe2,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  Server,
  Activity,
  MapPin,
  UserCheck,
  User,
  LogOut,
  ScanLine,
  KeyRound,
  Eye,
  Layers,
  AlertTriangle,
  XCircle,
  BarChart3,
  AreaChart,
  PieChart,
} from "lucide-react";
import { useAppStore } from "@/store";
import { serviceDomains, statusTextMap, mockCertificates, certificateCategories, mockCases } from "@/data/mockData";
import type { ServiceDomain, UserType } from "@/types";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  HeartHandshake,
  FileCheck,
  Stethoscope,
  Car,
  GraduationCap,
  Coffee,
};

const lifecycleSteps = [
  { key: "appointment", label: "预约", icon: CalendarCheck },
  { key: "apply", label: "申办", icon: FileEdit },
  { key: "upload", label: "材料上传", icon: Upload },
  { key: "track", label: "进度追踪", icon: Route },
  { key: "push", label: "结果推送", icon: Bell },
  { key: "evaluate", label: "服务评价", icon: MessageSquare },
];

function getLifecycleStatus(caseItem: { status: string; timeline: { status: string }[] }) {
  const done = caseItem.timeline.filter((t) => t.status === "completed").length;
  const total = caseItem.timeline.length;
  const isComplete = ["completed", "approved"].includes(caseItem.status);
  const isRejected = caseItem.status === "rejected";
  return lifecycleSteps.map((step, i) => {
    if (isRejected) return { ...step, state: i < 2 ? "done" : "failed" as const };
    if (isComplete) return { ...step, state: "done" as const };
    const stepDone = i < done;
    const stepActive = i === done;
    return { ...step, state: stepDone ? "done" as const : stepActive ? "active" as const : "pending" as const };
  });
}

const permissionBadge: Record<string, { cls: string; label: string }> = {
  L1: { cls: "bg-gray-100 text-gray-600 border-gray-200", label: "L1 基础" },
  L2: { cls: "bg-warning-100 text-warning-700 border-warning-200", label: "L2 实名" },
  L3: { cls: "bg-danger-100 text-danger-700 border-danger-200", label: "L3 实人" },
};

const quickEntries = [
  {
    name: "407类证照库",
    icon: Layers,
    color: "from-gov-500 to-gov-700",
    bg: "bg-gov-50",
    path: "/certificates?tab=catalog",
    stat1: { label: "证照目录", value: "407", unit: "类" },
    stat2: { label: "已持有", value: mockCertificates.length.toString(), unit: "张" },
    hint: "身份证/驾驶证/不动产权证等全覆盖",
  },
  {
    name: "扫码亮证",
    icon: QrCode,
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    path: "/certificates",
    stat1: { label: "今日亮证", value: "1,286", unit: "次" },
    stat2: { label: "SM4签名", value: "100%", unit: "" },
    hint: "一码通行·国密加密·时效可控",
  },
  {
    name: "在线核验",
    icon: ScanLine,
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    path: "/certificates",
    stat1: { label: "累计核验", value: "18,942", unit: "次" },
    stat2: { label: "成功率", value: "99.92%", unit: "" },
    hint: "公安人口库对接·身份核验可信",
  },
  {
    name: "访问审计",
    icon: KeyRound,
    color: "from-rose-500 to-red-600",
    bg: "bg-rose-50",
    path: "/admin?tab=audit",
    stat1: { label: "今日操作", value: "4,512", unit: "条" },
    stat2: { label: "异常拦截", value: "2", unit: "次" },
    hint: "全链路留痕·可追溯·可审计",
  },
  {
    name: "服务可用性监控",
    icon: Server,
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    path: "/admin?tab=monitor",
    stat1: { label: "在线服务", value: "480", unit: "项" },
    stat2: { label: "可用性", value: "99.97%", unit: "" },
    hint: "API网关实时监控·告警闭环",
  },
  {
    name: "热力图复盘",
    icon: MapPin,
    color: "from-cyan-500 to-blue-600",
    bg: "bg-cyan-50",
    path: "/admin?tab=heatmap",
    stat1: { label: "今日访问", value: "28,450", unit: "次" },
    stat2: { label: "覆盖区域", value: "12", unit: "区县" },
    hint: "政务服务行为数据可视化复盘",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { services, cases, isLoggedIn, user } = useAppStore();
  const setSelectedDomain = useAppStore((s) => s.setSelectedDomain);
  const setSearchKeyword = useAppStore((s) => s.setSearchKeyword);
  const setSelectedRole = useAppStore((s) => s.setUserTypeFilter);

  const [activeRole, setActiveRole] = useState<UserType | "all">("all");
  const [activeDomain, setActiveDomain] = useState<ServiceDomain | "all">("all");
  const [displayCount, setDisplayCount] = useState(12);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    setDisplayCount(12);
  }, [activeDomain, activeRole, keyword]);

  const hotServices = [...services]
    .sort((a, b) => b.applyCount - a.applyCount)
    .slice(0, 10);

  const activeCases = cases.filter((c) =>
    ["processing", "accepted", "submitted", "pending_material"].includes(c.status)
  );

  const filteredServices = useMemo(() => {
    return services
      .filter((s) => {
        const domainMatch = activeDomain === "all" || s.category === activeDomain;
        const roleMatch =
          activeRole === "all" ||
          (activeRole === "citizen" && s.category !== "government") ||
          (activeRole === "enterprise" && s.category === "government");
        const kwMatch = !keyword || s.name.includes(keyword) || s.department.includes(keyword);
        return domainMatch && roleMatch && kwMatch;
      })
      .sort((a, b) => b.applyCount - a.applyCount);
  }, [services, activeDomain, activeRole, keyword]);

  const displayedServices = filteredServices.slice(0, displayCount);

  const citizenCount = services.filter((s) => s.category !== "government").length;
  const enterpriseCount = services.filter((s) => s.category === "government" || s.category === "lifestyle").length;
  const onlineCount = services.filter((s) => s.onlineAvailable).length;
  const totalCertCount = certificateCategories.reduce((s, c) => s + c.count, 0);

  const roleTabs = useMemo(() => [
    { key: "citizen" as const, label: "市民服务", icon: User, desc: `自然人可办事项 ${citizenCount} 项` },
    { key: "enterprise" as const, label: "企业服务", icon: Building2, desc: `企业可办事项 ${enterpriseCount} 项` },
    { key: "all" as const, label: "全部服务", icon: Globe2, desc: `全量 ${services.length} 项服务` },
  ], [services.length, citizenCount, enterpriseCount]);

  const quickEntries = useMemo(() => [
    {
      name: "407类证照库",
      icon: Layers,
      color: "from-gov-500 to-gov-700",
      bg: "bg-gov-50",
      path: "/certificates?tab=catalog",
      permission: "市民/企业可用",
      permissionColor: "bg-gov-50 text-gov-600 border-gov-200",
      stat1: { label: "证照目录", value: totalCertCount.toString(), unit: "类" },
      stat2: { label: "已持有", value: mockCertificates.length.toString(), unit: "张" },
      hint: "身份证/驾驶证/不动产权证等全覆盖",
    },
    {
      name: "扫码亮证",
      icon: QrCode,
      color: "from-violet-500 to-purple-600",
      bg: "bg-violet-50",
      path: "/certificates",
      permission: "实名认证可用",
      permissionColor: "bg-violet-50 text-violet-600 border-violet-200",
      stat1: { label: "今日亮证", value: "1,286", unit: "次" },
      stat2: { label: "SM4签名", value: "100%", unit: "" },
      hint: "一码通行·国密加密·时效可控",
    },
    {
      name: "在线核验",
      icon: ScanLine,
      color: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50",
      path: "/certificates?tab=catalog",
      permission: "政务部门可用",
      permissionColor: "bg-emerald-50 text-emerald-600 border-emerald-200",
      stat1: { label: "累计核验", value: "18,942", unit: "次" },
      stat2: { label: "成功率", value: "99.92%", unit: "" },
      hint: "公安人口库对接·身份核验可信",
    },
    {
      name: "访问审计",
      icon: KeyRound,
      color: "from-rose-500 to-red-600",
      bg: "bg-rose-50",
      path: "/admin?tab=audit",
      permission: "监管人员专用",
      permissionColor: "bg-rose-50 text-rose-600 border-rose-200",
      stat1: { label: "今日操作", value: "4,512", unit: "条" },
      stat2: { label: "异常拦截", value: "2", unit: "次" },
      hint: "全链路留痕·可追溯·可审计",
    },
    {
      name: "服务可用性监控",
      icon: Server,
      color: "from-amber-500 to-orange-600",
      bg: "bg-amber-50",
      path: "/admin?tab=monitor",
      permission: "监管人员专用",
      permissionColor: "bg-amber-50 text-amber-600 border-amber-200",
      stat1: { label: "在线服务", value: onlineCount.toString(), unit: "项" },
      stat2: { label: "可用性", value: "99.97%", unit: "" },
      hint: "API网关实时监控·告警闭环",
    },
    {
      name: "热力图复盘",
      icon: MapPin,
      color: "from-cyan-500 to-blue-600",
      bg: "bg-cyan-50",
      path: "/admin?tab=heatmap",
      permission: "监管人员专用",
      permissionColor: "bg-cyan-50 text-cyan-600 border-cyan-200",
      stat1: { label: "今日访问", value: "28,450", unit: "次" },
      stat2: { label: "覆盖区域", value: "12", unit: "区县" },
      hint: "政务服务行为数据可视化复盘",
    },
  ], [totalCertCount, onlineCount]);

  const handleDomainClick = (code: ServiceDomain) => {
    setSelectedDomain(code);
    setSearchKeyword("");
    navigate("/services");
  };

  const handleSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSearchKeyword(keyword);
      navigate("/services");
    }
  };

  const handleRoleSwitch = (role: UserType | "all") => {
    setActiveRole(role);
    setSelectedRole(role === "all" ? null : role);
    setDisplayCount(12);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gov-gradient opacity-95" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-ink-bg to-transparent" />

        <div className="relative container py-16 lg:py-20">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              已接入 <span className="font-bold">{services.length}</span> 项政务服务 · 覆盖全市 12 个区县
            </div>
            <h1 className="font-serif text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              昆山市政务服务统一工作台
            </h1>
            <p className="text-lg lg:text-xl text-white/85 mb-6">
              让数据多跑路 · 让群众少跑腿 · 一网通办 · 全城通办
            </p>

            {/* 市民/企业角色切换 */}
            <div className="inline-flex items-center gap-1 p-1 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
              {roleTabs.map((rt) => {
                const Icon = rt.icon;
                const active = activeRole === rt.key;
                return (
                  <button
                    key={rt.key}
                    onClick={() => handleRoleSwitch(rt.key)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                      active
                        ? "bg-white text-gov-700 shadow-md"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {rt.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-white/70 -mt-4 mb-6">
              {roleTabs.find((r) => r.key === activeRole)?.desc}
            </p>

            <div className="max-w-2xl mx-auto">
              <div className="relative flex items-center bg-white rounded-xl shadow-2xl p-2">
                <Search className="w-5 h-5 text-ink-light ml-4" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={handleSearchEnter}
                  placeholder={`搜索${activeRole === "citizen" ? "市民" : activeRole === "enterprise" ? "企业" : ""}服务事项，如：身份证补办、社保缴纳...`}
                  className="flex-1 px-4 py-3 text-ink outline-none rounded-lg"
                />
                <button
                  onClick={() => {
                    setSearchKeyword(keyword);
                    navigate("/services");
                  }}
                  className="btn-primary !py-3 !px-6 whitespace-nowrap"
                >
                  搜索服务
                </button>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4 text-sm text-white/70">
                <span>热门搜索：</span>
                {["社保卡申领", "身份证补办", "预约挂号", "营业执照", "驾驶证换证"].map(
                  (kw) => (
                    <button
                      key={kw}
                      onClick={() => {
                        setSearchKeyword(kw);
                        setKeyword(kw);
                        navigate("/services");
                      }}
                      className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-colors"
                    >
                      {kw}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container -mt-8 relative z-10 pb-16">
        {/* 六大服务域 */}
        <section className="mb-8">
          <div className="card p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title !mb-0">
                <div className="w-1 h-6 bg-gov-600 rounded-full" />
                六大服务域
              </h2>
              <Link
                to="/services"
                className="text-sm text-gov-600 hover:text-gov-700 flex items-center gap-1"
              >
                全部服务 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {serviceDomains.map((domain, idx) => {
                const IconComp = iconMap[domain.icon];
                const count = services.filter((s) => s.category === domain.code).length;
                const active = activeDomain === domain.code;
                return (
                  <button
                    key={domain.code}
                    onClick={() => setActiveDomain(domain.code)}
                    className={cn(
                      "group flex flex-col items-center gap-3 p-5 rounded-xl border transition-all duration-300 animate-slide-up",
                      active
                        ? "border-gov-300 bg-gov-50 shadow-md"
                        : "border-transparent hover:border-gov-100 hover:bg-gov-50/50"
                    )}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div
                      className={cn(
                        "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md group-hover:scale-110 group-hover:shadow-lg transition-transform duration-300",
                        domain.color
                      )}
                    >
                      {IconComp && <IconComp className="w-7 h-7 text-white" />}
                    </div>
                    <div className="text-center">
                      <p className={cn(
                        "font-semibold",
                        active ? "text-gov-700" : "text-ink"
                      )}>{domain.name}</p>
                      <p className="text-xs text-ink-light mt-0.5">{count} 项服务</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 分类检索结果区 - 服务大厅 */}
        <section className="mb-8">
          <div className="card p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="section-title !mb-2">
                  <div className="w-1 h-6 bg-violet-600 rounded-full" />
                  服务大厅 · 分类检索结果
                </h2>
                <p className="text-sm text-ink-light">
                  当前筛选：{activeDomain === "all" ? "全部分类" : serviceDomains.find((d) => d.code === activeDomain)?.name}
                  {activeRole !== "all" && ` · ${activeRole === "citizen" ? "市民" : "企业"}专属`}
                  {keyword && ` · 关键词「${keyword}」`}
                  <span className="ml-2 text-gov-600 font-medium">共 {filteredServices.length} 项服务</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveDomain("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    activeDomain === "all"
                      ? "bg-gov-600 text-white"
                      : "bg-ink-bg text-ink-light hover:bg-gov-50"
                  )}
                >
                  全部
                </button>
                {serviceDomains.map((d) => (
                  <button
                    key={d.code}
                    onClick={() => setActiveDomain(d.code)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-colors hidden sm:inline-block",
                      activeDomain === d.code
                        ? "bg-gov-600 text-white"
                        : "bg-ink-bg text-ink-light hover:bg-gov-50"
                    )}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>

            {displayedServices.length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-ink-lighter mx-auto mb-4" />
                <p className="text-ink-light">暂无符合筛选条件的服务</p>
                <button
                  onClick={() => {
                    setActiveDomain("all");
                    setActiveRole("all");
                    setKeyword("");
                  }}
                  className="btn-secondary mt-4"
                >
                  重置筛选
                </button>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayedServices.map((svc, idx) => {
                    const domain = serviceDomains.find((d) => d.code === svc.category);
                    const requiredAuth = (["L1", "L2", "L3"] as const)[Math.min(2, idx % 3)];
                    const perm = permissionBadge[requiredAuth];
                    const forCitizen = svc.category !== "government";
                    const forEnterprise = svc.category === "government" || idx % 5 === 0;
                    return (
                      <Link
                        key={svc.id}
                        to={`/services/${svc.id}`}
                        className="card-hover p-4 group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br shrink-0",
                                domain?.color || "from-gov-500 to-gov-700"
                              )}
                            >
                              {domain && iconMap[domain.icon] && (
                                (() => {
                                  const Ic = iconMap[domain.icon];
                                  return <Ic className="w-5 h-5 text-white" />;
                                })()
                              )}
                            </div>
                            <div>
                              <p className="text-[10px] text-ink-light">{domain?.name}</p>
                              <p className="text-xs font-medium text-ink-light line-clamp-1">{svc.department}</p>
                            </div>
                          </div>
                          <div className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${perm.cls}`}>
                            {perm.label}
                          </div>
                        </div>

                        <h3 className="font-semibold text-ink mb-1 line-clamp-1 group-hover:text-gov-700 transition-colors">
                          {svc.name}
                        </h3>
                        <p className="text-xs text-ink-light line-clamp-1 mb-3">
                          {svc.subCategory}
                        </p>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {forCitizen && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-gov-50 text-gov-700 border border-gov-100">
                              <User className="w-2.5 h-2.5" /> 市民可办
                            </span>
                          )}
                          {forEnterprise && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <Building2 className="w-2.5 h-2.5" /> 企业可办
                            </span>
                          )}
                          {svc.onlineAvailable && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-100">
                              全程网办
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-ink-light pt-2 border-t border-gray-100">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {svc.handlingTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-success-500" />
                            {svc.applyCount.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1 text-warning-600">
                            <Star className="w-3 h-3 fill-current" />
                            {svc.satisfactionRate.toFixed(1)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {displayCount < filteredServices.length && (
                  <div className="text-center mt-6 space-y-3">
                    <div className="max-w-lg mx-auto">
                      <div className="flex items-center justify-between mb-1 text-xs text-ink-light">
                        <span>加载进度</span>
                        <span className="font-medium text-gov-700">
                          {Math.min(displayCount, filteredServices.length)} / {filteredServices.length} 项 · 剩余 {Math.max(0, filteredServices.length - displayCount)} 项
                        </span>
                      </div>
                      <div className="h-2 bg-ink-bg rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-gov-500 to-violet-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (displayCount / filteredServices.length) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setDisplayCount((c) => {
                        const next = c + 12;
                        return Math.min(next, filteredServices.length);
                      })}
                      className="btn-secondary inline-flex items-center gap-2"
                    >
                      加载更多 <ChevronRight className="w-4 h-4" />
                      <span className="text-xs text-ink-light">
                        （下一批展开 {Math.min(12, filteredServices.length - displayCount)} 项）
                      </span>
                    </button>
                    {displayCount + 12 < filteredServices.length && (
                      <p className="text-[10px] text-ink-lighter">
                        提示：您也可以前往 <Link to="/services" className="text-gov-600 hover:underline">服务大厅</Link> 使用多维检索筛选
                      </p>
                    )}
                  </div>
                )}
                {displayCount >= filteredServices.length && filteredServices.length > 0 && (
                  <div className="text-center mt-6 py-2">
                    <p className="text-xs text-success-600 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 已加载全部 {filteredServices.length} 项服务
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* 我的办件进度 - 含全生命周期闭环 */}
          <section className="lg:col-span-2">
            <div className="card p-6 h-full">
              <div className="flex items-center justify-between mb-5">
                <h2 className="section-title !mb-0">
                  <div className="w-1 h-6 bg-warning-500 rounded-full" />
                  我的办件 · 事项全生命周期
                </h2>
                <Link
                  to="/cases"
                  className="text-sm text-gov-600 hover:text-gov-700 flex items-center gap-1"
                >
                  全部办件 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* 生命周期可视化导航 */}
              <div className="flex items-center justify-between mb-5 p-3 rounded-xl bg-gradient-to-r from-gov-50 to-violet-50 border border-gov-100">
                {lifecycleSteps.map((step, si) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={step.key} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center mb-1",
                          si < 2 ? "bg-success-100 text-success-600" : si === 2 ? "bg-gov-100 text-gov-600 ring-2 ring-gov-200" : "bg-gray-100 text-gray-400"
                        )}>
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <span className={cn(
                          "text-[10px] font-medium",
                          si < 2 ? "text-success-700" : si === 2 ? "text-gov-700" : "text-gray-400"
                        )}>{step.label}</span>
                      </div>
                      {si < 5 && (
                        <div className={cn(
                          "w-full h-0.5 mx-0.5",
                          si < 1 ? "bg-success-300" : "bg-gray-200"
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>

              {!isLoggedIn ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-ink-light" />
                      <span className="text-xs text-ink-light">以下为示例办件，登录后查看您的真实办件</span>
                    </div>
                    <span className="text-[10px] text-ink-lighter">共 {mockCases.length} 条示例</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="p-2.5 rounded-lg bg-gov-50 border border-gov-100 text-center">
                      <p className="text-lg font-bold text-gov-700 leading-none">{mockCases.length}</p>
                      <p className="text-[10px] text-gov-600 mt-1">示例办件</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-success-50 border border-success-100 text-center">
                      <p className="text-lg font-bold text-success-700 leading-none">{mockCases.filter(c => ["completed","approved"].includes(c.status)).length}</p>
                      <p className="text-[10px] text-success-600 mt-1">已办结</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-warning-50 border border-warning-100 text-center">
                      <p className="text-lg font-bold text-warning-700 leading-none">{mockCases.filter(c => ["processing","accepted","submitted","pending_material"].includes(c.status)).length}</p>
                      <p className="text-[10px] text-warning-600 mt-1">办理中</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-violet-50 border border-violet-100 text-center">
                      <p className="text-lg font-bold text-violet-700 leading-none">{mockCases.reduce((s,c)=>s+c.materials.length,0)}</p>
                      <p className="text-[10px] text-violet-600 mt-1">上传材料</p>
                    </div>
                  </div>
                  {mockCases.slice(0, 2).map((c) => {
                    const statusInfo = statusTextMap[c.status];
                    const doneNodes = c.timeline.filter((t) => t.status === "completed").length;
                    const lastNode = c.timeline[c.timeline.length - 1];
                    return (
                      <Link
                        key={c.id}
                        to={`/cases/${c.id}`}
                        className="block p-4 rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/40 hover:border-gov-300 hover:shadow-md hover:from-gov-50/30 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-ink group-hover:text-gov-700 transition-colors flex items-center gap-2">
                              {c.serviceName}
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0">示例</span>
                            </h3>
                            <p className="text-xs text-ink-light mt-1">
                              <span className="font-mono">办件编号 {c.caseNo}</span> · 提交于 {c.applyTime.split(" ")[0]}
                            </p>
                          </div>
                          <span className={cn("shrink-0 text-xs ml-2", statusInfo.badge)}>
                            {statusInfo.text}
                          </span>
                        </div>

                        <div className="mb-3">
                          <div className="flex items-center justify-between text-[11px] text-ink-light mb-1">
                            <span>节点进度</span>
                            <span className="font-medium text-gov-700">{doneNodes}/{c.timeline.length} · {Math.round(doneNodes / c.timeline.length * 100)}%</span>
                          </div>
                          <div className="flex-1 h-1.5 bg-ink-bg rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                c.status === "rejected" ? "bg-danger-500" : c.status === "completed" || c.status === "approved"
                                  ? "bg-gradient-to-r from-success-500 to-gov-500"
                                  : "bg-gradient-to-r from-gov-500 to-violet-500"
                              )}
                              style={{ width: `${(doneNodes / c.timeline.length) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-0 flex-wrap mb-2.5">
                          {getLifecycleStatus(c).map((step, si) => {
                            const StepIcon = step.icon;
                            return (
                              <div key={step.key} className="flex items-center">
                                <div
                                  className={cn(
                                    "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium",
                                    step.state === "done" && "bg-success-50 text-success-700",
                                    step.state === "active" && "bg-gov-50 text-gov-700 ring-1 ring-gov-200",
                                    step.state === "pending" && "bg-gray-50 text-gray-400",
                                    step.state === "failed" && "bg-danger-50 text-danger-600"
                                  )}
                                >
                                  {step.state === "done" ? (
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                  ) : step.state === "active" ? (
                                    <Circle className="w-2.5 h-2.5 fill-current animate-pulse-soft" />
                                  ) : (
                                    <Circle className="w-2.5 h-2.5" />
                                  )}
                                  {step.label}
                                </div>
                                {si < 5 && (
                                  <div className={cn(
                                    "w-2 h-px mx-0.5",
                                    step.state === "done" ? "bg-success-400" : "bg-gray-200"
                                  )} />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-dashed border-gray-200">
                          <div className="flex items-center gap-1 text-[11px] text-ink-light min-w-0">
                            <User className="w-3 h-3 shrink-0 text-gov-600" />
                            <span className="truncate">经办人：{lastNode?.handler || "系统"}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-ink-light min-w-0">
                            <Upload className="w-3 h-3 shrink-0 text-violet-600" />
                            <span className="truncate">{c.materials.length}份材料</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-ink-light min-w-0">
                            <Clock className="w-3 h-3 shrink-0 text-success-600" />
                            <span className="truncate">{lastNode?.handleTime?.split(" ")[0] || c.applyTime.split(" ")[0]}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}

                  <div className="text-center pt-3">
                    <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                      <LogOut className="w-4 h-4 rotate-180" />
                      立即登录查看我的真实办件
                    </Link>
                  </div>
                </div>
              ) : activeCases.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-50 flex items-center justify-center">
                    <Star className="w-8 h-8 text-success-500" />
                  </div>
                  <p className="text-ink-light mb-4">暂无进行中的办件</p>
                  <Link to="/services" className="btn-secondary">
                    去办事大厅看看
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    <div className="p-2.5 rounded-lg bg-gov-50 border border-gov-100 text-center">
                      <p className="text-lg font-bold text-gov-700 leading-none">{cases.length}</p>
                      <p className="text-[10px] text-gov-600 mt-1">全部办件</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-success-50 border border-success-100 text-center">
                      <p className="text-lg font-bold text-success-700 leading-none">{cases.filter(c => ["completed","approved"].includes(c.status)).length}</p>
                      <p className="text-[10px] text-success-600 mt-1">已办结</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-warning-50 border border-warning-100 text-center">
                      <p className="text-lg font-bold text-warning-700 leading-none">{activeCases.length}</p>
                      <p className="text-[10px] text-warning-600 mt-1">办理中</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-violet-50 border border-violet-100 text-center">
                      <p className="text-lg font-bold text-violet-700 leading-none">{cases.reduce((s,c)=>s+c.materials.length,0)}</p>
                      <p className="text-[10px] text-violet-600 mt-1">上传材料</p>
                    </div>
                  </div>
                  {activeCases.slice(0, 2).map((c) => {
                    const statusInfo = statusTextMap[c.status];
                    const doneNodes = c.timeline.filter((t) => t.status === "completed").length;
                    const lastNode = c.timeline[c.timeline.length - 1];
                    return (
                      <Link
                        key={c.id}
                        to={`/cases/${c.id}`}
                        className="block p-4 rounded-xl border border-ink-border hover:border-gov-300 hover:shadow-md hover:bg-gov-50/20 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-ink group-hover:text-gov-700 transition-colors">
                              {c.serviceName}
                            </h3>
                            <p className="text-xs text-ink-light mt-1">
                              <span className="font-mono">办件编号 {c.caseNo}</span> · 提交于 {c.applyTime.split(" ")[0]}
                            </p>
                          </div>
                          <span className={cn("shrink-0 text-xs ml-2", statusInfo.badge)}>
                            {statusInfo.text}
                          </span>
                        </div>

                        <div className="mb-3">
                          <div className="flex items-center justify-between text-[11px] text-ink-light mb-1">
                            <span>节点进度</span>
                            <span className="font-medium text-gov-700">{doneNodes}/{c.timeline.length} · {Math.round(doneNodes / c.timeline.length * 100)}%</span>
                          </div>
                          <div className="flex-1 h-1.5 bg-ink-bg rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                c.status === "rejected" ? "bg-danger-500" : c.status === "completed" || c.status === "approved"
                                  ? "bg-gradient-to-r from-success-500 to-gov-500"
                                  : "bg-gradient-to-r from-gov-500 to-violet-500"
                              )}
                              style={{ width: `${(doneNodes / c.timeline.length) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-0 flex-wrap mb-2.5">
                          {getLifecycleStatus(c).map((step, si) => {
                            const StepIcon = step.icon;
                            return (
                              <div key={step.key} className="flex items-center">
                                <div
                                  className={cn(
                                    "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium",
                                    step.state === "done" && "bg-success-50 text-success-700",
                                    step.state === "active" && "bg-gov-50 text-gov-700 ring-1 ring-gov-200",
                                    step.state === "pending" && "bg-gray-50 text-gray-400",
                                    step.state === "failed" && "bg-danger-50 text-danger-600"
                                  )}
                                >
                                  {step.state === "done" ? (
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                  ) : step.state === "active" ? (
                                    <Circle className="w-2.5 h-2.5 fill-current animate-pulse-soft" />
                                  ) : (
                                    <Circle className="w-2.5 h-2.5" />
                                  )}
                                  {step.label}
                                </div>
                                {si < 5 && (
                                  <div className={cn(
                                    "w-2 h-px mx-0.5",
                                    step.state === "done" ? "bg-success-400" : "bg-gray-200"
                                  )} />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-dashed border-gray-200">
                          <div className="flex items-center gap-1 text-[11px] text-ink-light min-w-0">
                            <User className="w-3 h-3 shrink-0 text-gov-600" />
                            <span className="truncate">经办人：{lastNode?.handler || "系统"}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-ink-light min-w-0">
                            <Upload className="w-3 h-3 shrink-0 text-violet-600" />
                            <span className="truncate">{c.materials.length}份材料</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-ink-light min-w-0">
                            <Clock className="w-3 h-3 shrink-0 text-success-600" />
                            <span className="truncate">{lastNode?.handleTime?.split(" ")[0] || c.applyTime.split(" ")[0]}</span>
                          </div>
                        </div>

                        {lastNode?.remark && (
                          <div className="mt-2.5 p-2.5 rounded-lg bg-gov-50/60 border border-gov-100">
                            <p className="text-[11px] text-gov-800 leading-relaxed">
                              <b>最新处理</b>：{lastNode.remark}
                            </p>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* 6大业务视图快捷入口 */}
          <section>
            <div className="card p-6 h-full">
              <h2 className="section-title !mb-5">
                <div className="w-1 h-6 bg-success-500 rounded-full" />
                政务能力 · 业务视图
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {quickEntries.map((entry, idx) => {
                  const Icon = entry.icon;
                  return (
                    <Link
                      key={entry.name}
                      to={entry.path}
                      className="group p-4 rounded-xl border border-ink-border hover:border-gov-200 hover:shadow-lg transition-all bg-white flex flex-col"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform",
                            entry.color
                          )}>
                            <Icon className="w-4.5 h-4.5 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-ink group-hover:text-gov-700 transition-colors">
                            {entry.name}
                          </span>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded border font-medium mb-2 w-fit",
                        entry.permissionColor
                      )}>
                        {entry.permission}
                      </span>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 text-center py-1.5 rounded bg-gray-50">
                          <div className="text-base font-bold text-gray-800 leading-none">
                            {entry.stat1.value}<span className="text-[10px] text-gray-500 ml-0.5">{entry.stat1.unit}</span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{entry.stat1.label}</div>
                        </div>
                        <div className="flex-1 text-center py-1.5 rounded bg-gray-50">
                          <div className="text-base font-bold text-gov-700 leading-none">
                            {entry.stat2.value}<span className="text-[10px] text-gov-500 ml-0.5">{entry.stat2.unit}</span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{entry.stat2.label}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-100 pt-2 mt-auto">
                        <p className="text-[10px] text-gray-500 leading-tight flex-1">
                          {entry.hint}
                        </p>
                        <span className="text-[10px] text-gov-600 font-medium flex items-center gap-0.5 shrink-0 ml-2">
                          查看明细 <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-4 p-3 rounded-lg bg-gradient-to-br from-gov-50 to-violet-50 border border-gov-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gov-600 text-white flex items-center justify-center">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">平台运行状态</p>
                      <p className="text-xs text-ink-light">实时监控</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-success-600">正常</p>
                    <p className="text-[10px] text-ink-light">{onlineCount}项服务在线</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 热门服务推荐 */}
        <section className="mt-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title !mb-0">
                <div className="w-1 h-6 bg-danger-500 rounded-full" />
                热门服务推荐
                <span className="ml-2 text-sm font-normal text-ink-light">（本月办理量最高）</span>
              </h2>
              <Link
                to="/services"
                className="text-sm text-gov-600 hover:text-gov-700 flex items-center gap-1"
              >
                查看更多 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {hotServices.slice(0, 10).map((svc, idx) => {
                const domain = serviceDomains.find((d) => d.code === svc.category);
                return (
                  <Link
                    key={svc.id}
                    to={`/services/${svc.id}`}
                    className="card-hover p-4 animate-fade-in"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
                          domain?.color || "from-gov-500 to-gov-700"
                        )}
                      >
                        {domain && iconMap[domain.icon] && (
                          (() => {
                            const Ic = iconMap[domain.icon];
                            return <Ic className="w-5 h-5 text-white" />;
                          })()
                        )}
                      </div>
                      <span className="text-xs font-bold text-danger-500">
                        TOP{idx + 1}
                      </span>
                    </div>
                    <h3 className="font-medium text-ink mb-1 line-clamp-1">{svc.name}</h3>
                    <p className="text-xs text-ink-light line-clamp-2 mb-3">
                      {svc.subCategory} · {svc.department}
                    </p>
                    <div className="flex items-center justify-between text-xs text-ink-light">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-success-500" />
                        {svc.applyCount.toLocaleString()} 人办理
                      </span>
                      <span className="flex items-center gap-1 text-warning-600">
                        <Star className="w-3 h-3 fill-current" />
                        {svc.satisfactionRate.toFixed(1)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gov-800 text-white/80 py-8">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-serif text-lg font-bold text-white mb-3">
                昆山市政务服务统一工作台
              </h3>
              <p className="text-sm leading-relaxed">
                主办单位：昆山市数据局<br />
                技术支持：昆山市大数据中心
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-3">联系我们</h4>
              <p className="text-sm">服务热线：12345</p>
              <p className="text-sm">工作时间：周一至周五 9:00-17:00</p>
              <p className="text-sm">现场地址：昆山市前进中路219号政务服务中心</p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-3">友情链接</h4>
              <div className="flex flex-wrap gap-3 text-sm">
                <a href="#" className="hover:text-white">江苏省政务服务网</a>
                <a href="#" className="hover:text-white">苏州市人民政府</a>
                <a href="#" className="hover:text-white">昆山市人民政府</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-6 text-center text-xs text-white/50">
            © 2024 昆山市数据局 版权所有 · 苏ICP备XXXXXXXX号 · 苏公网安备XXXXXXXXXXXXX号
          </div>
        </div>
      </footer>
    </div>
  );
}
