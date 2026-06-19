import { useMemo, useState } from "react";
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
} from "lucide-react";
import { useAppStore } from "@/store";
import { serviceDomains, mockDepartments, statusTextMap } from "@/data/mockData";
import type { ServiceDomain } from "@/types";
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

export default function Services() {
  const services = useAppStore((s) => s.services);
  const selectedDomain = useAppStore((s) => s.selectedDomain);
  const searchKeyword = useAppStore((s) => s.searchKeyword);
  const userTypeFilter = useAppStore((s) => s.userTypeFilter);
  const setSelectedDomain = useAppStore((s) => s.setSelectedDomain);
  const setSearchKeyword = useAppStore((s) => s.setSearchKeyword);

  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"apply" | "rating" | "time">("apply");
  const [displayCount, setDisplayCount] = useState(20);

  const filtered = useMemo(() => {
    let list = services.filter((s) => {
      const domainMatch = selectedDomain === "all" || s.category === selectedDomain;
      const kwMatch =
        !searchKeyword ||
        s.name.includes(searchKeyword) ||
        s.description.includes(searchKeyword) ||
        s.department.includes(searchKeyword) ||
        s.subCategory.includes(searchKeyword);
      const userTypeMatch =
        !userTypeFilter ||
        (userTypeFilter === "citizen" && s.category !== "government") ||
        (userTypeFilter === "enterprise" && (s.category === "government" || s.category === "lifestyle"));
      return domainMatch && kwMatch && userTypeMatch;
    });
    if (selectedDept !== "all") {
      list = list.filter((s) => s.departmentId === selectedDept);
    }
    if (onlineOnly) {
      list = list.filter((s) => s.onlineAvailable);
    }
    list = [...list].sort((a, b) => {
      if (sortBy === "apply") return b.applyCount - a.applyCount;
      if (sortBy === "rating") return b.satisfactionRate - a.satisfactionRate;
      return a.handlingTime.localeCompare(b.handlingTime);
    });
    return list;
  }, [services, selectedDomain, searchKeyword, userTypeFilter, selectedDept, onlineOnly, sortBy]);

  const displayedList = filtered.slice(0, displayCount);
  const hasMore = displayCount < filtered.length;
  const remaining = filtered.length - displayCount;

  const stats = useMemo(() => {
    const total = services.length;
    const online = services.filter((s) => s.onlineAvailable).length;
    return { total, online, depts: mockDepartments.length };
  }, [services]);

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        {/* 顶部统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "服务事项总数", value: stats.total, icon: Grid3X3, color: "from-gov-500 to-gov-700" },
            { label: "可在线办理", value: stats.online, icon: FileCheck, color: "from-success-500 to-success-700" },
            { label: "进驻部门", value: stats.depts, icon: Building, color: "from-violet-500 to-violet-700" },
            { label: "本月办件量", value: "38,472", icon: TrendingUp, color: "from-amber-500 to-amber-700" },
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
                <p className="text-xs text-ink-light">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* 左侧分类 */}
          <aside className="lg:col-span-1">
            <div className="card p-5 sticky top-20">
              <h3 className="font-serif text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-gov-600" />
                服务分类
              </h3>

              <div className="space-y-1 mb-6">
                <button
                  onClick={() => setSelectedDomain("all")}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                    selectedDomain === "all"
                      ? "bg-gov-50 text-gov-700 font-medium"
                      : "text-ink hover:bg-ink-bg"
                  )}
                >
                  <Grid3X3 className="w-5 h-5" />
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
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                        selectedDomain === domain.code
                          ? "bg-gov-50 text-gov-700 font-medium"
                          : "text-ink hover:bg-ink-bg"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", domain.bgColor)}>
                        {IconComp && <IconComp className={cn("w-4 h-4", domain.textColor)} />}
                      </div>
                      {domain.name}
                      <span className="ml-auto text-xs text-ink-light">{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-ink-border pt-4">
                <h4 className="text-sm font-medium text-ink mb-3">办理部门</h4>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="input"
                >
                  <option value="all">全部部门</option>
                  {mockDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <label className="flex items-center gap-2 mt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlineOnly}
                    onChange={(e) => setOnlineOnly(e.target.checked)}
                    className="w-4 h-4 text-gov-600 rounded border-ink-border focus:ring-gov-400"
                  />
                  <span className="text-sm text-ink">仅显示可在线办理</span>
                </label>
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
              <p className="text-sm text-ink-light mt-3">
                共找到 <span className="text-gov-600 font-medium">{filtered.length}</span> 项服务
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="card p-12 text-center">
                <Search className="w-12 h-12 text-ink-lighter mx-auto mb-4" />
                <p className="text-ink-light">没有找到匹配的服务，请尝试其他筛选条件</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((svc) => {
                  const domain = serviceDomains.find((d) => d.code === svc.category);
                  const statusInfo = statusTextMap[svc.status === "online" ? "completed" : "draft"];
                  return (
                    <Link
                      key={svc.id}
                      to={`/services/${svc.id}`}
                      className="card-hover p-5 flex flex-col group"
                    >
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
                          <p className="text-xs text-ink-light mt-1 flex items-center gap-1">
                            <Building className="w-3 h-3" /> {svc.department}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-ink-light line-clamp-2 mb-4 flex-1">
                        {svc.description}
                      </p>

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

                      <div className="flex gap-2 mt-3">
                        {svc.onlineAvailable && (
                          <span className="badge-success">在线办理</span>
                        )}
                        {svc.appointmentAvailable && (
                          <span className="badge-primary">可预约</span>
                        )}
                        {svc.fee === "免费" && <span className="badge-gray">免费</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="card divide-y divide-ink-border">
                {filtered.map((svc) => {
                  const domain = serviceDomains.find((d) => d.code === svc.category);
                  return (
                    <Link
                      key={svc.id}
                      to={`/services/${svc.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-gov-50/50 transition-colors group"
                    >
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
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-ink group-hover:text-gov-700 transition-colors">
                            {svc.name}
                          </h3>
                          {svc.onlineAvailable && <span className="badge-success text-[10px]">在线办</span>}
                        </div>
                        <p className="text-xs text-ink-light mt-0.5">
                          {svc.department} · {svc.subCategory} · {svc.handlingTime}
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-6 text-sm text-ink-light">
                        <span>{svc.applyCount.toLocaleString()}人办理</span>
                        <span className="text-warning-600 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          {svc.satisfactionRate.toFixed(1)}%
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-ink-lighter group-hover:text-gov-600 group-hover:translate-x-1 transition-all" />
                    </Link>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
