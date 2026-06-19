import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  ChevronRight,
  Building,
  Clock,
  Star,
  TrendingUp,
  HeartHandshake,
  FileCheck,
  Stethoscope,
  Car,
  GraduationCap,
  Coffee,
  Grid3X3,
  List,
  CalendarCheck,
  FileEdit,
  Upload,
  Route,
  Bell,
  MessageSquare,
  Users,
  Building2,
  Shield,
  MapPin,
  ChevronDown,
  X,
  Eye,
} from "lucide-react";
import { useAppStore } from "@/store";
import { serviceDomains, mockDepartments, statusTextMap } from "@/data/mockData";
import type { ServiceDomain, AuthLevel, UserType } from "@/types";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  HeartHandshake,
  FileCheck,
  Stethoscope,
  Car,
  GraduationCap,
  Coffee,
};

const lifecycleQuickActions = [
  { key: "appointment", label: "预约", icon: CalendarCheck },
  { key: "apply", label: "申办", icon: FileEdit },
  { key: "upload", label: "材料", icon: Upload },
  { key: "track", label: "进度", icon: Route },
  { key: "push", label: "结果", icon: Bell },
  { key: "evaluate", label: "评价", icon: MessageSquare },
];

const districts = [
  "全市通办", "昆山开发区", "昆山高新区", "花桥经济开发区",
  "张浦镇", "周市镇", "陆家镇", "巴城镇",
  "千灯镇", "淀山湖镇", "周庄镇", "锦溪镇",
];

export default function Services() {
  const services = useAppStore((s) => s.services);
  const selectedDomain = useAppStore((s) => s.selectedDomain);
  const searchKeyword = useAppStore((s) => s.searchKeyword);
  const user = useAppStore((s) => s.user);
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const setSelectedDomain = useAppStore((s) => s.setSelectedDomain);
  const setSearchKeyword = useAppStore((s) => s.setSearchKeyword);

  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedUserType, setSelectedUserType] = useState<UserType | "all">("all");
  const [selectedAuthLevel, setSelectedAuthLevel] = useState<AuthLevel | "all">("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "maintenance">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"apply" | "rating" | "time">("apply");
  const [displayCount, setDisplayCount] = useState(20);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(true);

  useEffect(() => {
    setDisplayCount(20);
  }, [selectedDomain, searchKeyword, selectedUserType, selectedAuthLevel, selectedDept, selectedDistrict, statusFilter, sortBy]);

  const filtered = useMemo(() => {
    let list = services.filter((s) => {
      const domainMatch = selectedDomain === "all" || s.category === selectedDomain;
      const kwMatch =
        !searchKeyword ||
        s.name.includes(searchKeyword) ||
        s.description.includes(searchKeyword) ||
        s.department.includes(searchKeyword) ||
        s.subCategory.includes(searchKeyword);
      const deptMatch = selectedDept === "all" || s.departmentId === selectedDept;
      const userTypeMatch =
        selectedUserType === "all" || s.userType.includes(selectedUserType);
      const authLevelMatch =
        selectedAuthLevel === "all" ||
        (selectedAuthLevel === "L1" && s.authLevel === "L1") ||
        (selectedAuthLevel === "L2" && s.authLevel !== "L3") ||
        (selectedAuthLevel === "L3" && s.authLevel === "L3");
      const districtMatch =
        selectedDistrict === "all" || s.district.includes(selectedDistrict);
      const statusMatch =
        statusFilter === "all" || s.status === statusFilter;
      return domainMatch && kwMatch && deptMatch && userTypeMatch && authLevelMatch && districtMatch && statusMatch;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "apply") return b.applyCount - a.applyCount;
      if (sortBy === "rating") return b.satisfactionRate - a.satisfactionRate;
      return a.handlingTime.localeCompare(b.handlingTime);
    });
    return list;
  }, [services, selectedDomain, searchKeyword, selectedDept, selectedUserType, selectedAuthLevel, selectedDistrict, statusFilter, sortBy]);

  const displayedList = filtered.slice(0, displayCount);
  const hasMore = displayCount < filtered.length;
  const remaining = filtered.length - displayCount;

  const stats = useMemo(() => {
    const total = services.length;
    const online = services.filter((s) => s.onlineAvailable).length;
    const filteredTotal = filtered.length;
    const filteredOnline = filtered.filter((s) => s.onlineAvailable).length;
    const citizenCount = services.filter((s) => s.userType.includes("citizen")).length;
    const enterpriseCount = services.filter((s) => s.userType.includes("enterprise")).length;
    return { total, online, filteredTotal, filteredOnline, citizenCount, enterpriseCount, depts: mockDepartments.length };
  }, [services, filtered]);

  const authLevelStats = useMemo(() => ({
    L1: services.filter((s) => s.authLevel === "L1").length,
    L2: services.filter((s) => s.authLevel === "L2").length,
    L3: services.filter((s) => s.authLevel === "L3").length,
  }), [services]);

  const userCanAccess = (svc: { authLevel: AuthLevel }) => {
    if (!isLoggedIn || !user) return svc.authLevel === "L1";
    const levels: AuthLevel[] = ["L1", "L2", "L3"];
    return levels.indexOf(user.authLevel) >= levels.indexOf(svc.authLevel);
  };

  const activeFilterCount = [
    selectedDept !== "all",
    selectedUserType !== "all",
    selectedAuthLevel !== "all",
    selectedDistrict !== "all",
    statusFilter !== "all",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedDept("all");
    setSelectedUserType("all");
    setSelectedAuthLevel("all");
    setSelectedDistrict("all");
    setStatusFilter("all");
    setSelectedDomain("all");
    setSearchKeyword("");
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        {/* 顶部统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "服务事项总数",
              value:
                selectedDomain === "all"
                  ? stats.total
                  : `${stats.filteredTotal}/${stats.total}`,
              icon: Grid3X3,
              color: "from-gov-500 to-gov-700",
              sub:
                selectedDomain !== "all"
                  ? `当前${serviceDomains.find((d) => d.code === selectedDomain)?.name || ""}`
                  : "全量接入",
            },
            {
              label: "可在线办理",
              value:
                selectedDomain === "all"
                  ? stats.online
                  : `${stats.filteredOnline}/${stats.filteredTotal}`,
              icon: FileCheck,
              color: "from-success-500 to-success-700",
              sub: selectedDomain !== "all" ? "当前可办/总数" : "全平台",
            },
            {
              label: "进驻部门",
              value: stats.depts,
              icon: Building,
              color: "from-violet-500 to-violet-700",
              sub: "协同治理",
            },
            {
              label: "本月办件量",
              value: "38,472",
              icon: TrendingUp,
              color: "from-amber-500 to-amber-700",
              sub: "持续上涨",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-shadow"
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br", s.color)}>
                <s.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">{s.value}</p>
                <p className="text-xs text-ink-light">
                  {s.label}
                  <span className="text-[10px] text-ink-lighter ml-1">({s.sub})</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* 左侧分类 */}
          <aside className="lg:col-span-1">
            <div className="card p-5 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-semibold text-ink flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gov-600" />
                  分类检索
                </h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-gov-600 hover:text-gov-700 flex items-center gap-0.5"
                  >
                    <X className="w-3 h-3" /> 清除
                  </button>
                )}
              </div>

              {/* 服务域 */}
              <div className="space-y-1 mb-5">
                <h4 className="text-xs font-medium text-ink-light mb-2 flex items-center gap-1.5">
                  <Grid3X3 className="w-3.5 h-3.5" /> 服务域
                </h4>
                <button
                  onClick={() => setSelectedDomain("all")}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-sm",
                    selectedDomain === "all"
                      ? "bg-gov-50 text-gov-700 font-medium"
                      : "text-ink hover:bg-ink-bg"
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                  全部服务
                  <span className="ml-auto text-xs text-ink-light">{services.length}</span>
                </button>
                {serviceDomains.map((domain) => {
                  const count = services.filter((s) => s.category === domain.code).length;
                  const IconComp = iconMap[domain.icon];
                  return (
                    <button
                      key={domain.code}
                      onClick={() => setSelectedDomain(domain.code as ServiceDomain)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-sm",
                        selectedDomain === domain.code
                          ? "bg-gov-50 text-gov-700 font-medium"
                          : "text-ink hover:bg-ink-bg"
                      )}
                    >
                      <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", domain.bgColor)}>
                        {IconComp && <IconComp className={cn("w-3.5 h-3.5", domain.textColor)} />}
                      </div>
                      {domain.name}
                      <span className="ml-auto text-xs text-ink-light">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* 服务对象 */}
              <div className="border-t border-ink-border pt-4 mb-4">
                <h4 className="text-xs font-medium text-ink-light mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> 服务对象
                </h4>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { k: "all", label: "全部" },
                    { k: "citizen", label: "市民" },
                    { k: "enterprise", label: "企业" },
                  ].map((t) => (
                    <button
                      key={t.k}
                      onClick={() => setSelectedUserType(t.k as UserType | "all")}
                      className={cn(
                        "px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
                        selectedUserType === t.k
                          ? "bg-gov-600 text-white"
                          : "bg-ink-bg text-ink hover:bg-gov-50 hover:text-gov-600"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 身份等级 */}
              <div className="border-t border-ink-border pt-4 mb-4">
                <h4 className="text-xs font-medium text-ink-light mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> 身份认证等级
                </h4>
                <div className="space-y-1.5">
                  {[
                    { k: "all" as const, label: "全部等级", desc: "" },
                    { k: "L1" as const, label: "L1 基础认证", desc: `${authLevelStats.L1}项 · 手机号即可`, color: "text-gray-600" },
                    { k: "L2" as const, label: "L2 实名认证", desc: `${authLevelStats.L2}项 · 身份证核验`, color: "text-violet-600" },
                    { k: "L3" as const, label: "L3 实人认证", desc: `${authLevelStats.L3}项 · 公安人脸比对`, color: "text-rose-600" },
                  ].map((a) => (
                    <button
                      key={a.k}
                      onClick={() => setSelectedAuthLevel(a.k)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left transition-colors",
                        selectedAuthLevel === a.k
                          ? "bg-gov-50 ring-1 ring-gov-200"
                          : "hover:bg-ink-bg"
                      )}
                    >
                      <Shield className={cn("w-4 h-4 shrink-0", a.color || "text-ink-light")} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink">{a.label}</div>
                        {a.desc && <div className="text-[10px] text-ink-light">{a.desc}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 办理部门 */}
              <div className="border-t border-ink-border pt-4 mb-4">
                <h4 className="text-xs font-medium text-ink-light mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> 办理部门
                </h4>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="input !py-2 !text-sm w-full"
                >
                  <option value="all">全部部门（{mockDepartments.length}个）</option>
                  {mockDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 区县范围 */}
              <div className="border-t border-ink-border pt-4 mb-4">
                <h4 className="text-xs font-medium text-ink-light mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> 服务范围
                </h4>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="input !py-2 !text-sm w-full"
                >
                  <option value="all">全部区县</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* 服务状态 */}
              <div className="border-t border-ink-border pt-4">
                <h4 className="text-xs font-medium text-ink-light mb-2 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> 服务状态
                </h4>
                <div className="space-y-1.5">
                  {[
                    { k: "all" as const, label: "全部服务", count: services.length },
                    { k: "online" as const, label: "正常服务", count: stats.online },
                    { k: "maintenance" as const, label: "维护中", count: services.filter((s) => s.status === "maintenance").length },
                  ].map((s) => (
                    <button
                      key={s.k}
                      onClick={() => setStatusFilter(s.k)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left text-sm transition-colors",
                        statusFilter === s.k
                          ? "bg-gov-50 text-gov-700 font-medium"
                          : "text-ink hover:bg-ink-bg"
                      )}
                    >
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        s.k === "online" ? "bg-success-500" : s.k === "maintenance" ? "bg-warning-500" : "bg-ink-lighter"
                      )} />
                      {s.label}
                      <span className="ml-auto text-xs text-ink-light">{s.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* 右侧服务列表 */}
          <main className="lg:col-span-3">
            <div className="card p-5 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-ink-light absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="输入服务名称、部门名称进行搜索..."
                    className="input pl-11"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ink-light">排序：</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="input !w-auto"
                  >
                    <option value="apply">办理量</option>
                    <option value="rating">好评率</option>
                    <option value="time">办理时长</option>
                  </select>
                  <div className="flex border border-ink-border rounded-md overflow-hidden">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "p-2 transition-colors",
                        viewMode === "grid" ? "bg-gov-50 text-gov-600" : "text-ink-light hover:bg-ink-bg"
                      )}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "p-2 transition-colors",
                        viewMode === "list" ? "bg-gov-50 text-gov-600" : "text-ink-light hover:bg-ink-bg"
                      )}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-sm text-ink-light mt-3 flex items-center gap-2 flex-wrap">
                共找到 <span className="text-gov-600 font-medium">{filtered.length}</span> 项服务
                {selectedUserType !== "all" && (
                  <span className="badge-primary text-[10px]">
                    {selectedUserType === "citizen" ? "市民" : "企业"}服务
                    <button onClick={() => setSelectedUserType("all")} className="ml-1 hover:text-white">×</button>
                  </span>
                )}
                {selectedAuthLevel !== "all" && (
                  <span className="badge-danger text-[10px]">
                    {selectedAuthLevel}认证要求
                    <button onClick={() => setSelectedAuthLevel("all")} className="ml-1 hover:text-white">×</button>
                  </span>
                )}
                {selectedDistrict !== "all" && (
                  <span className="badge-success text-[10px]">
                    {selectedDistrict}
                    <button onClick={() => setSelectedDistrict("all")} className="ml-1 hover:text-white">×</button>
                  </span>
                )}
                {statusFilter !== "all" && (
                  <span className="badge-gray text-[10px]">
                    {statusFilter === "online" ? "正常服务" : "维护中"}
                    <button onClick={() => setStatusFilter("all")} className="ml-1 hover:text-white">×</button>
                  </span>
                )}
                <span className="text-ink-lighter">|</span>
                <span>市民可办 <b className="text-gov-700">{stats.citizenCount}</b> 项</span>
                <span className="text-ink-lighter">·</span>
                <span>企业可办 <b className="text-amber-600">{stats.enterpriseCount}</b> 项</span>
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="card p-12 text-center">
                <Search className="w-12 h-12 text-ink-lighter mx-auto mb-4" />
                <p className="text-ink-light">没有找到匹配的服务，请尝试其他筛选条件</p>
              </div>
            ) : viewMode === "grid" ? (
              <>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {displayedList.map((svc) => {
                  const domain = serviceDomains.find((d) => d.code === svc.category);
                  const statusInfo = statusTextMap[svc.status === "online" ? "completed" : "draft"];
                  return (
                    <div
                      key={svc.id}
                      className="card-hover p-5 flex flex-col group"
                    >
                      <Link to={`/services/${svc.id}`} className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br",
                              domain?.color || "from-gov-500 to-gov-700"
                            )}
                          >
                            {domain && iconMap[domain.icon] && (
                              (() => {
                                const Ic = iconMap[domain.icon];
                                return <Ic className="w-6 h-6 text-white" />;
                              })()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-ink group-hover:text-gov-700 transition-colors line-clamp-2">
                                {svc.name}
                              </h3>
                              {svc.status !== "online" && (
                                <span className={cn("shrink-0", statusInfo.badge)}>
                                  {svc.status === "maintenance" ? "维护中" : "已下线"}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {svc.authLevel === "L1" && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-600 border border-gray-200 flex items-center gap-0.5">
                                  <Shield className="w-2.5 h-2.5" /> L1基础
                                </span>
                              )}
                              {svc.authLevel === "L2" && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 border border-violet-200 flex items-center gap-0.5">
                                  <Shield className="w-2.5 h-2.5" /> L2实名
                                </span>
                              )}
                              {svc.authLevel === "L3" && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-0.5">
                                  <Shield className="w-2.5 h-2.5" /> L3实人
                                </span>
                              )}
                              {svc.userType.includes("citizen") && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gov-50 text-gov-600 border border-gov-200">
                                  市民可办
                                </span>
                              )}
                              {svc.userType.includes("enterprise") && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
                                  企业可办
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-ink-light mt-1.5 flex items-center gap-1">
                              <Building className="w-3 h-3" /> {svc.department}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-ink-light line-clamp-2 mb-3">
                          {svc.description}
                        </p>
                      </Link>

                      <div className="flex items-center justify-between text-xs text-ink-light pt-3 border-t border-ink-border">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {svc.handlingTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-success-500" />
                          {svc.applyCount.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 text-warning-600">
                          <Star className="w-3 h-3 fill-current" />
                          {svc.satisfactionRate.toFixed(1)}%
                        </span>
                      </div>

                      <div className="flex gap-2 mt-3 mb-3">
                        {svc.status === "maintenance" && (
                          <span className="text-[10px] px-2 py-1 rounded bg-amber-50 text-amber-600 border border-amber-200">维护中·暂停服务</span>
                        )}
                        {svc.status === "offline" && (
                          <span className="text-[10px] px-2 py-1 rounded bg-red-50 text-red-600 border border-red-200">已下线</span>
                        )}
                        {svc.onlineAvailable && svc.status === "online" && (
                          <span className="badge-success">在线办理</span>
                        )}
                        {svc.appointmentAvailable && svc.status === "online" && (
                          <span className="badge-primary">可预约</span>
                        )}
                        {svc.fee === "免费" && <span className="badge-gray">免费</span>}
                      </div>

                      <div className="grid grid-cols-6 gap-1 pt-3 border-t border-dashed border-gray-200">
                        {lifecycleQuickActions.map((action) => {
                          const StepIcon = action.icon;
                          const isOffline = svc.status === "maintenance" || svc.status === "offline";
                          const isDisabled = isOffline || (!svc.onlineAvailable && ["track", "push", "evaluate"].includes(action.key));
                          const tabMap: Record<string, string> = {
                            appointment: "appointment",
                            apply: "apply",
                            upload: "materials",
                            track: "progress",
                            push: "result",
                            evaluate: "evaluate",
                          };
                          const linkTo = isDisabled ? "#" : `/services/${svc.id}?tab=${tabMap[action.key]}`;
                          return (
                            <Link
                              key={action.key}
                              to={linkTo}
                              className={cn(
                                "flex flex-col items-center gap-1 py-2 rounded-md transition-colors",
                                isDisabled
                                  ? "text-gray-300 cursor-not-allowed pointer-events-none"
                                  : "text-gov-600 hover:bg-gov-50"
                              )}
                              title={isOffline ? "服务维护中，暂不可用" : action.label}
                              onClick={(e) => isDisabled && e.preventDefault()}
                            >
                              <StepIcon className="w-4 h-4" />
                              <span className="text-[10px] font-medium">{action.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => setDisplayCount((c) => c + 20)}
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    加载更多
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-xs text-ink-light">
                      （已加载 {displayCount} / 共 {filtered.length} 项，剩余 {remaining} 项）
                    </span>
                  </button>
                </div>
              )}
              </>
            ) : (
              <>
              <div className="card divide-y divide-ink-border">
                {displayedList.map((svc) => {
                  const domain = serviceDomains.find((d) => d.code === svc.category);
                  return (
                    <div
                      key={svc.id}
                      className="flex items-center gap-4 p-4 hover:bg-gov-50/50 transition-colors group"
                    >
                      <Link to={`/services/${svc.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className={cn(
                            "w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br",
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
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium text-ink group-hover:text-gov-700 transition-colors">
                              {svc.name}
                            </h3>
                            {svc.authLevel === "L1" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-600 border border-gray-200">L1</span>}
                            {svc.authLevel === "L2" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 border border-violet-200">L2</span>}
                            {svc.authLevel === "L3" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">L3</span>}
                            {svc.onlineAvailable && svc.status === "online" && <span className="badge-success text-[10px]">在线办</span>}
                            {!userCanAccess(svc) && <span className="badge-danger text-[10px]">需升级认证</span>}
                          </div>
                          <p className="text-xs text-ink-light mt-0.5">
                            {svc.department} · {svc.subCategory} · {svc.handlingTime} · {svc.district.slice(0, 2).join("、")}
                          </p>
                        </div>
                      </Link>
                      <div className="hidden sm:flex items-center gap-6 text-sm text-ink-light shrink-0">
                        <span>{svc.applyCount.toLocaleString()}人办理</span>
                        <span className="text-warning-600 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          {svc.satisfactionRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="hidden md:flex items-center gap-1 shrink-0">
                        {lifecycleQuickActions.slice(0, 4).map((action) => {
                          const StepIcon = action.icon;
                          const isOffline = svc.status === "maintenance" || svc.status === "offline";
                          const isDisabled = isOffline;
                          const tabMap: Record<string, string> = {
                            appointment: "appointment",
                            apply: "apply",
                            upload: "materials",
                            track: "progress",
                          };
                          return (
                            <Link
                              key={action.key}
                              to={isDisabled ? "#" : `/services/${svc.id}?tab=${tabMap[action.key]}`}
                              className={cn(
                                "w-9 h-9 rounded-md flex items-center justify-center transition-colors",
                                isDisabled
                                  ? "text-gray-300 pointer-events-none"
                                  : "text-ink-light hover:text-gov-600 hover:bg-gov-50"
                              )}
                              title={isOffline ? "维护中" : action.label}
                              onClick={(e) => isDisabled && e.preventDefault()}
                            >
                              <StepIcon className="w-4 h-4" />
                            </Link>
                          );
                        })}
                      </div>
                      <ChevronRight className="w-5 h-5 text-ink-lighter group-hover:text-gov-600 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => setDisplayCount((c) => c + 20)}
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    加载更多
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-xs text-ink-light">
                      （已加载 {displayCount} / 共 {filtered.length} 项，剩余 {remaining} 项）
                    </span>
                  </button>
                </div>
              )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
