import { useState } from "react";
import {
  LayoutDashboard,
  FileCheck,
  CreditCard,
  ClipboardList,
  Activity,
  BarChart3,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Fingerprint,
  UserCheck,
  ScanFace,
  Building2,
  Swords,
  FileKey,
  KeyRound,
  UsersRound,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Clock3,
  Users2,
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
  Eye,
  User,
  FileText,
  XCircle,
  Globe,
  MapPin,
  Clock4,
  Zap,
  History,
  Lock,
  AlertOctagon,
  EyeOff,
  ShieldPlus,
  Network,
  Server,
  AlertCircle,
  Layers,
  ArrowLeftRight,
  ScanLine,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  mockStatsOverview,
  mockPendingApprovals,
  mockDepartments,
  mockServices,
  mockAuditLogs,
  mockServiceMonitors,
  mockHeatmapData,
  serviceDomains,
  statusTextMap,
  certificateCategories,
  mockCertificates,
} from "@/data/mockData";
import type { ServiceDomain } from "@/types";

const COLORS = ["#1E5AA8", "#10B981", "#F59E0B", "#8B5CF6", "#06B6D4", "#F43F5E"];

type TabKey =
  | "overview"
  | "approvals"
  | "services"
  | "audit"
  | "monitor"
  | "heatmap"
  | "certRegulation";

type RegulatoryRole = "shuiju" | "gongan" | "default";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [regulatoryRole, setRegulatoryRole] = useState<RegulatoryRole>("shuiju");

  const menuItems = [
    { key: "overview" as TabKey, label: "数据概览", icon: LayoutDashboard },
    {
      key: "approvals" as TabKey,
      label: "协同审批",
      icon: ClipboardList,
      badge: mockPendingApprovals.length,
    },
    { key: "services" as TabKey, label: "服务管理", icon: FileCheck },
    { key: "certRegulation" as TabKey, label: "证照监管", icon: CreditCard },
    { key: "audit" as TabKey, label: "审计日志", icon: ShieldAlert },
    { key: "monitor" as TabKey, label: "服务监控", icon: Activity },
    { key: "heatmap" as TabKey, label: "热力图统计", icon: BarChart3 },
  ];

  const roleInfo: Record<
    RegulatoryRole,
    { name: string; desc: string; icon: typeof Shield; color: string; tags: string[] }
  > = {
    shuiju: {
      name: "市数据局",
      desc: "政务数据资产管理 & 跨部门数据共享监管",
      icon: Network,
      color: "from-gov-500 to-gov-700",
      tags: ["数据共享交换", "证照目录管理", "407类目录运维"],
    },
    gongan: {
      name: "市公安局",
      desc: "公民身份强认证 · 人脸比对 · 访问安全溯源",
      icon: Shield,
      color: "from-rose-500 to-red-700",
      tags: ["公安人口库", "L3实人认证", "异常访问拦截"],
    },
    default: {
      name: "综合监管",
      desc: "多部门联合监管全局视角",
      icon: UsersRound,
      color: "from-violet-500 to-purple-700",
      tags: ["协同治理", "联合审批", "综合研判"],
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gov-600 to-gov-800 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900">政务工作台</div>
              <div className="text-xs text-gray-500">多部门协同治理 · 管理后台</div>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeTab === item.key
                    ? "bg-gov-50 text-gov-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-danger-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="px-3 mt-2">
          <div className="rounded-xl p-3 bg-gradient-to-br from-gov-50 to-gov-100 border border-gov-100">
            <div className="text-xs font-semibold text-gov-800 mb-2 flex items-center gap-1">
              <Server className="w-3.5 h-3.5" /> 系统健康度
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-gov-700">API接口可用</span>
                <span className="text-success-700 font-medium">99.94%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gov-700">公安库连通</span>
                <span className="text-success-700 font-medium">正常</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gov-700">国密引擎</span>
                <span className="text-success-700 font-medium">SM2/SM4 运行</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {menuItems.find((m) => m.key === activeTab)?.label}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                当前监管视角：{roleInfo[regulatoryRole].name} ·
                {roleInfo[regulatoryRole].desc}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {(
                [
                  { key: "shuiju", label: "市数据局视角", icon: Network },
                  { key: "gongan", label: "市公安局视角", icon: Shield },
                  { key: "default", label: "综合监管", icon: UsersRound },
                ] as const
              ).map((r) => {
                const Ic = r.icon;
                return (
                  <button
                    key={r.key}
                    onClick={() => setRegulatoryRole(r.key)}
                    className={
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border " +
                      (regulatoryRole === r.key
                        ? "bg-gov-600 text-white border-gov-600 shadow"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50")
                    }
                  >
                    <Ic className="w-3.5 h-3.5" />
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {regulatoryRole !== "default" && (
            <div
              className={
                "mt-4 rounded-xl p-4 border bg-gradient-to-r " +
                (regulatoryRole === "gongan"
                  ? "from-rose-50 to-orange-50 border-rose-200"
                  : "from-gov-50 to-blue-50 border-gov-200")
              }
            >
              <div className="flex items-start gap-3">
                <div
                  className={
                    "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br text-white shrink-0 " +
                    roleInfo[regulatoryRole].color
                  }
                >
                  {(() => {
                    const Icon = roleInfo[regulatoryRole].icon;
                    return <Icon className="w-5 h-5" />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-900 text-sm">
                      {roleInfo[regulatoryRole].name}监管工作台
                    </span>
                    {roleInfo[regulatoryRole].tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">
                    {roleInfo[regulatoryRole].desc}；今日已处理{" "}
                    {regulatoryRole === "gongan" ? "3,286 笔身份核验 / 2 笔异常拦截" : "18,942 条数据交换 / 4,512 次证照调用"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </header>

        <div className="p-6">
          {activeTab === "overview" && <OverviewPanel />}
          {activeTab === "approvals" && <ApprovalsPanel />}
          {activeTab === "services" && <ServicesPanel />}
          {activeTab === "audit" && <AuditPanel regulatoryRole={regulatoryRole} />}
          {activeTab === "monitor" && <MonitorPanel />}
          {activeTab === "heatmap" && <HeatmapPanel />}
          {activeTab === "certRegulation" && <CertRegulationPanel regulatoryRole={regulatoryRole} />}
        </div>
      </main>
    </div>
  );
}

function OverviewPanel() {
  const stats = mockStatsOverview;

  const statCards = [
    {
      label: "今日办件量",
      value: stats.todayCases.toLocaleString(),
      change: `+${stats.todayCasesChange}%`,
      icon: ClipboardList,
      color: "from-gov-500 to-gov-700",
    },
    {
      label: "在线服务数",
      value: `${stats.activeServices}/${stats.totalServices}项`,
      change: "覆盖率98.4%",
      icon: FileCheck,
      color: "from-emerald-500 to-teal-600",
    },
    {
      label: "证照库总量",
      value: (stats.totalCertificates / 10000).toFixed(1) + "万",
      change: `今日${stats.todayCertUsage.toLocaleString()}次调用`,
      icon: CreditCard,
      color: "from-violet-500 to-purple-600",
    },
    {
      label: "平均办结时效",
      value: `${stats.avgProcessingTime}天`,
      change: `${stats.satisfactionRate}%满意度`,
      icon: Clock,
      color: "from-amber-500 to-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="flex items-center gap-1 text-xs text-success-600">
                  <TrendingUp className="w-3 h-3" />
                  {card.change}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{card.value}</div>
              <div className="text-sm text-gray-500">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">近7天办件趋势</h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-gov-500" />
                办件量
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-success-500" />
                办结量
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="cases"
                  stroke="#1E5AA8"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  name="办件量"
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  name="办结量"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">服务域分布</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.serviceDomainStats}
                  dataKey="count"
                  nameKey="domainName"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                >
                  {stats.serviceDomainStats.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {stats.serviceDomainStats.map((s, i) => (
              <div key={s.domain} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="text-gray-600 flex-1">{s.domainName}</span>
                <span className="text-gray-900 font-medium">{s.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4">部门办件排名</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.departmentRanking}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="department" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <Tooltip />
              <Legend />
              <Bar dataKey="cases" fill="#1E5AA8" radius={[4, 4, 0, 0]} name="办件数" />
              <Bar dataKey="avgTime" fill="#F59E0B" radius={[4, 4, 0, 0]} name="平均用时(天)" />
              <Bar dataKey="satisfaction" fill="#10B981" radius={[4, 4, 0, 0]} name="满意度(%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ApprovalsPanel() {
  const priorityMap = {
    high: { text: "高", className: "badge-danger" },
    medium: { text: "中", className: "badge-warning" },
    low: { text: "低", className: "badge-gray" },
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-danger-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-danger-600" />
          </div>
          <div>
            <div className="text-xl font-bold">
              {mockPendingApprovals.filter((p) => p.priority === "high").length}
            </div>
            <div className="text-xs text-gray-500">高优先级待办</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center">
            <Clock3 className="w-5 h-5 text-warning-600" />
          </div>
          <div>
            <div className="text-xl font-bold">{mockPendingApprovals.length}</div>
            <div className="text-xs text-gray-500">我的待办</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gov-100 flex items-center justify-center">
            <Users2 className="w-5 h-5 text-gov-600" />
          </div>
          <div>
            <div className="text-xl font-bold">{mockDepartments.length}</div>
            <div className="text-xs text-gray-500">协同部门</div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">待办审批列表</h3>
          <select className="input w-auto text-sm">
            <option>全部部门</option>
            {mockDepartments.map((d) => (
              <option key={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="divide-y divide-gray-100">
          {mockPendingApprovals.map((item) => (
            <div key={item.id} className="p-4 hover:bg-gray-50 transition cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={priorityMap[item.priority].className}>
                      {priorityMap[item.priority].text}优先级
                    </span>
                    <span className="badge-gray">{item.caseNo}</span>
                    <span className="badge-primary">{item.currentDept}</span>
                  </div>
                  <div className="font-medium text-gray-900 mb-1">{item.serviceName}</div>
                  <div className="text-sm text-gray-500">
                    申请人：{item.applicantName} · 提交时间：{item.submitTime}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400">协同部门：</span>
                    {item.requiredDepts.map((dept) => (
                      <span key={dept} className="badge-primary text-xs">
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <div className="text-right mr-3">
                    <div className="text-xs text-gray-500">截止日期</div>
                    <div className="text-sm font-medium text-danger-600">{item.deadline}</div>
                  </div>
                  <button className="btn-primary text-sm py-2 flex items-center gap-1">
                    办理
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServicesPanel() {
  const [searchText, setSearchText] = useState("");
  const [domainFilter, setDomainFilter] = useState<ServiceDomain | "all">("all");

  const filtered = mockServices.filter((s) => {
    const matchSearch = s.name.includes(searchText) || s.department.includes(searchText);
    const matchDomain = domainFilter === "all" || s.category === domainFilter;
    return matchSearch && matchDomain;
  });

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索服务名称、部门..."
              className="input pl-10"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              className="input w-auto"
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value as ServiceDomain | "all")}
            >
              <option value="all">全部服务域</option>
              {serviceDomains.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">服务名称</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">服务域</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">办理部门</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">状态</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">办件量</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">满意度</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.slice(0, 15).map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 text-sm">{s.name}</div>
                  <div className="text-xs text-gray-400">{s.subCategory}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge-${s.category === "livelihood" ? "danger" : s.category === "government" ? "primary" : s.category === "medical" ? "success" : s.category === "traffic" ? "warning" : s.category === "education" ? "primary" : "primary"} text-xs`}>
                    {s.categoryName}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{s.department}</td>
                <td className="px-4 py-3">
                  {s.status === "online" ? (
                    <span className="flex items-center gap-1 text-xs text-success-600">
                      <ToggleRight className="w-4 h-4" />
                      已上线
                    </span>
                  ) : s.status === "maintenance" ? (
                    <span className="flex items-center gap-1 text-xs text-warning-600">
                      <Clock4 className="w-4 h-4" />
                      维护中
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <ToggleLeft className="w-4 h-4" />
                      已下线
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                  {s.applyCount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-success-600 font-medium">
                  {s.satisfactionRate.toFixed(1)}%
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="text-gov-600 hover:text-gov-700 text-xs flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      查看
                    </button>
                    <button className="text-gov-600 hover:text-gov-700 text-xs flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      编辑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditPanel({ regulatoryRole }: { regulatoryRole: RegulatoryRole }) {
  const [searchText, setSearchText] = useState("");
  const [authFilter, setAuthFilter] = useState<"all" | "face" | "sms" | "sso">("all");

  const gonganAuditExtension = [
    { id: "ga1", createdAt: "2025-05-08 14:23:05", userName: "强认证引擎", action: "L3人脸比对-公安人口库", resource: "身份证尾号3812", authMethod: "face", ip: "10.8.22.51", result: "success", score: "98.7%" },
    { id: "ga2", createdAt: "2025-05-08 14:18:44", userName: "系统拦截", action: "异常IP访问拦截", resource: "登录网关", authMethod: "geo", ip: "203.0.113.88", result: "failed", score: "黑名单" },
    { id: "ga3", createdAt: "2025-05-08 13:52:11", userName: "国密SM2", action: "证照签名核验", resource: "电子驾驶证#E3205", authMethod: "sm2", ip: "10.8.22.101", result: "success", score: "签名有效" },
    { id: "ga4", createdAt: "2025-05-08 11:07:33", userName: "强认证引擎", action: "L2身份证OCR", resource: "身份证尾号0048", authMethod: "ocr", ip: "10.8.22.51", result: "success", score: "99.2%" },
    { id: "ga5", createdAt: "2025-05-08 09:45:02", userName: "系统拦截", action: "高频访问限流", resource: "证照查询API", authMethod: "rate", ip: "198.51.100.17", result: "failed", score: "240次/5min" },
  ];

  const shuijuAuditExtension = [
    { id: "sj1", createdAt: "2025-05-08 15:02:33", userName: "数据交换总线", action: "跨部门证照调阅", resource: "不动产权证#KS2024", authMethod: "sso", ip: "10.8.22.105", result: "success", score: "市资规局→住建局" },
    { id: "sj2", createdAt: "2025-05-08 14:58:12", userName: "目录同步", action: "407类目录元数据更新", resource: "医疗健康类+8项", authMethod: "api", ip: "10.8.22.108", result: "success", score: "版本v2025.05" },
    { id: "sj3", createdAt: "2025-05-08 12:30:41", userName: "数据交换总线", action: "证照批量授权", resource: "社保类证照#328项", authMethod: "batch", ip: "10.8.22.105", result: "success", score: "医保局→民政局" },
    { id: "sj4", createdAt: "2025-05-08 11:44:20", userName: "异常检测", action: "越权访问告警", resource: "税务登记#TAX88", authMethod: "rule", ip: "10.8.22.203", result: "failed", score: "不在授权清单" },
  ];

  const roleStats = {
    gongan: [
      { label: "L3实人认证", value: "3,286", icon: ScanFace, color: "from-rose-500 to-red-600", note: "今日人脸比对" },
      { label: "异常拦截", value: "2", icon: ShieldX, color: "from-danger-500 to-danger-700", note: "IP黑名单/高频" },
      { label: "国密核验", value: "18,942", icon: FileKey, color: "from-violet-500 to-purple-600", note: "SM2/SM4签名" },
      { label: "认证成功率", value: "99.92%", icon: ShieldCheck, color: "from-success-500 to-emerald-600", note: "近7天均值" },
    ],
    shuiju: [
      { label: "证照调用", value: "4,512", icon: CreditCard, color: "from-gov-500 to-gov-700", note: "今日跨部门" },
      { label: "数据交换", value: "18,942", icon: Network, color: "from-cyan-500 to-blue-600", note: "条/今日" },
      { label: "目录覆盖", value: "407/407", icon: Layers, color: "from-emerald-500 to-teal-600", note: "已全量接入" },
      { label: "接口可用", value: "99.97%", icon: Server, color: "from-amber-500 to-orange-600", note: "API网关" },
    ],
    default: [
      { label: "成功操作", value: String(mockAuditLogs.filter((l) => l.result === "success").length), icon: ShieldCheck, color: "from-gov-500 to-gov-700", note: "审计日志" },
      { label: "失败操作", value: String(mockAuditLogs.filter((l) => l.result === "failed").length), icon: ShieldAlert, color: "from-danger-500 to-danger-700", note: "审计日志" },
      { label: "活跃用户", value: "2", icon: User, color: "from-warning-500 to-amber-600", note: "今日登录" },
      { label: "资源类型", value: "8", icon: Globe, color: "from-emerald-500 to-teal-600", note: "业务分类" },
    ],
  };

  const roleColumns = {
    gongan: ["认证方式", "核验得分/原因"],
    shuiju: ["数据流向/触发", "批次/版本"],
    default: [],
  };

  const extLogs =
    regulatoryRole === "gongan"
      ? gonganAuditExtension
      : regulatoryRole === "shuiju"
      ? shuijuAuditExtension
      : [];

  const allLogs = [
    ...mockAuditLogs.map((l) => ({ ...l, ext1: "-", ext2: "-" })),
    ...extLogs.map((l) => ({
      ...l,
      resourceId: "ext",
      userName: l.userName,
      action: l.action,
      resource: l.resource,
      ip: l.ip,
      result: (l.result === "success" ? "success" : "failed") as "success" | "failed",
      ext1: l.authMethod,
      ext2: l.score,
    })),
  ];

  const filtered = allLogs.filter(
    (l) =>
      l.userName.includes(searchText) ||
      l.action.includes(searchText) ||
      l.resource.includes(searchText)
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roleStats[regulatoryRole].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="card p-4 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label} · {s.note}</div>
              </div>
            </div>
          );
        })}
      </div>

      {regulatoryRole === "gongan" && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-danger-600" /> 近7天身份认证趋势（公安局视角）
            </h3>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" />L3人脸</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gov-500" />L2证件</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-danger-500" />异常拦截</span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { d: "05-02", face: 2890, ocr: 1650, block: 3 },
                { d: "05-03", face: 3012, ocr: 1721, block: 1 },
                { d: "05-04", face: 2680, ocr: 1480, block: 0 },
                { d: "05-05", face: 3210, ocr: 1802, block: 4 },
                { d: "05-06", face: 3450, ocr: 1920, block: 2 },
                { d: "05-07", face: 3120, ocr: 1750, block: 1 },
                { d: "05-08", face: 3286, ocr: 1842, block: 2 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="d" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <Tooltip />
                <Area type="monotone" dataKey="face" stackId="1" stroke="#F43F5E" fill="#F43F5E" fillOpacity={0.25} strokeWidth={2} name="L3人脸" />
                <Area type="monotone" dataKey="ocr" stackId="2" stroke="#1E5AA8" fill="#1E5AA8" fillOpacity={0.25} strokeWidth={2} name="L2证件" />
                <Area type="monotone" dataKey="block" stroke="#DC2626" fill="#DC2626" fillOpacity={0.6} strokeWidth={2} name="异常拦截" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {regulatoryRole === "shuiju" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-gov-600" /> 407类证照覆盖率（数据局视角）
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={certificateCategories.map((c, i) => ({
                  subject: c.name.slice(0, 4),
                  接入率: Math.min(100, 85 + (i * 3) % 15),
                  调用活跃度: Math.min(100, 60 + ((i * 7) % 40)),
                }))}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="接入率" dataKey="接入率" stroke="#1E5AA8" fill="#1E5AA8" fillOpacity={0.5} />
                  <Radar name="调用活跃度" dataKey="调用活跃度" stroke="#10B981" fill="#10B981" fillOpacity={0.4} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-cyan-600" /> 跨部门数据交换Top榜（近7天）
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { dept: "公安局↔数据局", count: 42890 },
                  { dept: "住建局↔资规局", count: 31240 },
                  { dept: "医保局↔民政局", count: 28450 },
                  { dept: "税务局↔市监局", count: 24180 },
                  { dept: "教育局↔公安局", count: 18905 },
                  { dept: "交通局↔公安局", count: 15620 },
                ]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <YAxis dataKey="dept" type="category" width={100} tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <Tooltip />
                  <Bar dataKey="count" name="交换次数" fill="#06B6D4" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索用户、操作、资源、IP..."
              className="input pl-10"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          {regulatoryRole === "gongan" && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                className="input w-auto text-sm"
                value={authFilter}
                onChange={(e) => setAuthFilter(e.target.value as typeof authFilter)}
              >
                <option value="all">全部认证方式</option>
                <option value="face">L3人脸比对</option>
                <option value="sms">短信验证</option>
                <option value="sso">单点登录</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">时间</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">主体</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">操作</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">目标资源</th>
              {regulatoryRole !== "default" && (
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{roleColumns[regulatoryRole][0]}</th>
              )}
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">IP地址</th>
              {regulatoryRole !== "default" && (
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{roleColumns[regulatoryRole][1]}</th>
              )}
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">结果</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-500">{log.createdAt}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gov-100 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-gov-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{log.userName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{log.action}</td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600">{log.resource}</span>
                  {log.resourceId !== "ext" && <span className="text-xs text-gray-400 ml-1">#{log.resourceId}</span>}
                </td>
                {regulatoryRole !== "default" && (
                  <td className="px-4 py-3 text-sm text-gray-600">{log.ext1 || "-"}</td>
                )}
                <td className="px-4 py-3 text-sm font-mono text-gray-500">{log.ip}</td>
                {regulatoryRole !== "default" && (
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {log.ext2 === "黑名单" || log.ext2?.includes("越权") || log.ext2?.includes("不在") ? (
                      <span className="badge-danger">{log.ext2}</span>
                    ) : log.ext2 && log.ext2 !== "-" ? (
                      <span className="badge-primary">{log.ext2}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                )}
                <td className="px-4 py-3">
                  {log.result === "success" ? (
                    <span className="flex items-center gap-1 text-xs text-success-600">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      成功
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-danger-600">
                      <XCircle className="w-3.5 h-3.5" />
                      失败
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MonitorPanel() {
  const statusConfig = {
    normal: { text: "正常", className: "text-success-600 bg-success-50", dot: "bg-success-500" },
    warning: { text: "告警", className: "text-warning-600 bg-warning-50", dot: "bg-warning-500" },
    error: { text: "异常", className: "text-danger-600 bg-danger-50", dot: "bg-danger-500" },
  };

  const normalCount = mockServiceMonitors.filter((m) => m.status === "normal").length;
  const warningCount = mockServiceMonitors.filter((m) => m.status === "warning").length;
  const errorCount = mockServiceMonitors.filter((m) => m.status === "error").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gov-100 flex items-center justify-center">
            <Activity className="w-5 h-5 text-gov-600" />
          </div>
          <div>
            <div className="text-xl font-bold">{mockServiceMonitors.length}</div>
            <div className="text-xs text-gray-500">监控服务数</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-success-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-success-600">{normalCount}</div>
            <div className="text-xs text-gray-500">运行正常</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-warning-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-warning-600">{warningCount}</div>
            <div className="text-xs text-gray-500">告警</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-danger-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-danger-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-danger-600">{errorCount}</div>
            <div className="text-xs text-gray-500">异常</div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">服务可用性监控</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">服务名称</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">状态</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">可用率</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">平均响应</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">错误数</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">最后检查</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockServiceMonitors.map((m) => (
              <tr key={m.serviceId} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-sm text-gray-900">{m.serviceName}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[m.status].className}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[m.status].dot} animate-pulse`} />
                    {statusConfig[m.status].text}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          m.uptime >= 99 ? "bg-success-500" : m.uptime >= 95 ? "bg-warning-500" : "bg-danger-500"
                        }`}
                        style={{ width: `${m.uptime}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-900 font-medium">{m.uptime.toFixed(1)}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{m.avgResponseTime}ms</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-sm font-medium ${
                      m.errorCount > 10 ? "text-danger-600" : m.errorCount > 0 ? "text-warning-600" : "text-gray-600"
                    }`}
                  >
                    {m.errorCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{m.lastCheck}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CertRegulationPanel({ regulatoryRole }: { regulatoryRole: RegulatoryRole }) {
  const [catFilter, setCatFilter] = useState<string>("all");
  const totalCount = certificateCategories.reduce((s, c) => s + c.count, 0);
  const heldCount = mockCertificates.length;

  const catStats = certificateCategories.map((c, i) => ({
    ...c,
    accessRate: Math.min(100, 90 - ((i * 11) % 18)),
    avgResponse: 80 + ((i * 13) % 140),
    errorCount: (i * 3) % 12,
  }));

  const abnormalIPs = regulatoryRole === "gongan" ? [
    { ip: "203.0.113.88", area: "境外代理", count: 847, level: "danger", lastSeen: "14:18", action: "已封禁" },
    { ip: "198.51.100.17", area: "可疑IDC", count: 1240, level: "danger", lastSeen: "09:45", action: "限流中" },
    { ip: "192.0.2.112", area: "苏州市", count: 238, level: "warning", lastSeen: "12:03", action: "观察" },
    { ip: "198.51.100.203", area: "越权访问源", count: 14, level: "warning", lastSeen: "11:44", action: "待核查" },
  ] : [];

  const smStats = [
    { algo: "SM2 非对称签名", signCount: 9421, verifyCount: 9412, failCount: 9 },
    { algo: "SM4 对称加密", encryptCount: 18942, decryptCount: 18933, failCount: 5 },
    { algo: "SM3 摘要哈希", hashCount: 28450, verifyCount: 28448, failCount: 2 },
  ];

  const heldTypes = mockCertificates.map((c) => c.categoryCode);
  const filteredCats = catStats.filter((c) => catFilter === "all" || c.code === catFilter);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
            <Layers className="w-3.5 h-3.5 text-gov-500" /> 目录总量
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
          <div className="text-[11px] text-gray-400 mt-1">覆盖10大类</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success-500" /> 已接入
          </div>
          <div className="text-2xl font-bold text-success-600">{totalCount}</div>
          <div className="text-[11px] text-gray-400 mt-1">覆盖率 100%</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
            <UsersRound className="w-3.5 h-3.5 text-violet-500" /> 市民持卡
          </div>
          <div className="text-2xl font-bold text-violet-600">28.4万</div>
          <div className="text-[11px] text-gray-400 mt-1">人均 {heldCount} 张</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
            <ScanLine className="w-3.5 h-3.5 text-cyan-500" /> 今日调用
          </div>
          <div className="text-2xl font-bold text-gov-700">4,512</div>
          <div className="text-[11px] text-gray-400 mt-1">环比 +12.3%</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
            <KeyRound className="w-3.5 h-3.5 text-violet-600" /> 亮证次数
          </div>
          <div className="text-2xl font-bold text-violet-700">1,286</div>
          <div className="text-[11px] text-gray-400 mt-1">二维码扫码</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-danger-500" /> 异常调用
          </div>
          <div className="text-2xl font-bold text-danger-600">
            {regulatoryRole === "gongan" ? "2" : "4"}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            {regulatoryRole === "gongan" ? "IP/越权拦截" : "告警待处理"}
          </div>
        </div>
      </div>

      {regulatoryRole === "shuiju" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gov-600" /> 分类调用Top榜（近7天）
              </h3>
              <select
                className="input w-auto text-sm"
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
              >
                <option value="all">全部分类</option>
                {certificateCategories.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={catStats.slice(0, catFilter === "all" ? 10 : filteredCats.length).map((c) => ({
                    name: c.name,
                    调阅次数: 320 + (c.count * 17) % 9800,
                    亮证次数: 80 + (c.count * 9) % 3200,
                    核验次数: 150 + (c.count * 11) % 5400,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="调阅次数" fill="#1E5AA8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="亮证次数" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="核验次数" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-cyan-600" /> 跨部门调用矩阵
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500">调用方\被调</th>
                    <th className="py-2 text-gray-500">公安</th>
                    <th className="py-2 text-gray-500">数据局</th>
                    <th className="py-2 text-gray-500">市监</th>
                    <th className="py-2 text-gray-500">资规</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { d: "公安局", gongan: "-", sj: "3289", sc: "238", zg: "102" },
                    { d: "数据局", gongan: "4521", sj: "-", sc: "1890", zg: "2103" },
                    { d: "市监局", gongan: "820", sj: "1450", sc: "-", zg: "398" },
                    { d: "住建局", gongan: "308", sj: "2840", sc: "502", zg: "4521" },
                  ].map((r) => (
                    <tr key={r.d}>
                      <td className="py-2.5 text-gray-700 font-medium">{r.d}</td>
                      <td className="py-2.5 text-center">
                        <span className={r.gongan === "-" ? "text-gray-300" : "bg-gov-50 text-gov-700 px-2 py-0.5 rounded"}>{r.gongan}</span>
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={r.sj === "-" ? "text-gray-300" : "bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded"}>{r.sj}</span>
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={r.sc === "-" ? "text-gray-300" : "bg-violet-50 text-violet-700 px-2 py-0.5 rounded"}>{r.sc}</span>
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={r.zg === "-" ? "text-gray-300" : "bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded"}>{r.zg}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 p-3 rounded-lg bg-gov-50 border border-gov-100">
              <div className="text-xs font-semibold text-gov-800 mb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> 407类目录接入进度
              </div>
              <div className="w-full h-2 bg-gov-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-gov-500 to-gov-700 rounded-full" style={{ width: "100%" }} />
              </div>
              <div className="text-[11px] text-gov-700 mt-1 flex justify-between">
                <span>10大类全量接入</span>
                <span className="font-semibold">{totalCount}/{totalCount} · 100%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {regulatoryRole === "gongan" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card p-5 lg:col-span-2">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldPlus className="w-4 h-4 text-rose-600" /> L3实人认证率趋势 & 异常拦截（公安局视角）
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { d: "周一", rate: 99.8, l3: 3012, inter: 1 },
                  { d: "周二", rate: 99.7, l3: 2890, inter: 3 },
                  { d: "周三", rate: 99.9, l3: 3120, inter: 0 },
                  { d: "周四", rate: 99.6, l3: 3450, inter: 4 },
                  { d: "周五", rate: 99.92, l3: 3286, inter: 2 },
                  { d: "周六", rate: 99.85, l3: 2140, inter: 1 },
                  { d: "周日", rate: 99.91, l3: 1980, inter: 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="d" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#9CA3AF" domain={[99, 100]} />
                  <Tooltip />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="l3" name="L3认证次数" stroke="#F43F5E" fill="#F43F5E" fillOpacity={0.25} strokeWidth={2} />
                  <Area yAxisId="right" type="monotone" dataKey="rate" name="成功率(%)" stroke="#10B981" fill="#10B981" fillOpacity={0.15} strokeWidth={2} />
                  <Line yAxisId="left" type="monotone" dataKey="inter" name="异常拦截" stroke="#DC2626" strokeWidth={2} dot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-danger-600" /> 异常IP来源分析
            </h3>
            <div className="space-y-2.5">
              {abnormalIPs.map((ip) => (
                <div key={ip.ip} className="p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-semibold text-gray-900">{ip.ip}</span>
                    <span className={
                      ip.level === "danger"
                        ? "bg-danger-100 text-danger-700 text-[10px] px-2 py-0.5 rounded-full font-medium"
                        : "bg-warning-100 text-warning-700 text-[10px] px-2 py-0.5 rounded-full font-medium"
                    }>
                      {ip.level === "danger" ? "高危" : "警告"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">{ip.area} · 访问 {ip.count} 次</span>
                    <span className="text-gray-400">{ip.lastSeen} 活跃</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={
                      ip.action.includes("封禁")
                        ? "text-xs text-danger-600 font-medium flex items-center gap-1"
                        : ip.action.includes("限流")
                        ? "text-xs text-warning-600 font-medium flex items-center gap-1"
                        : "text-xs text-gov-600 font-medium flex items-center gap-1"
                    }>
                      {ip.action.includes("封禁") ? <ShieldX className="w-3 h-3" /> : ip.action.includes("限流") ? <AlertTriangle className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {ip.action}
                    </span>
                    <button className="text-[11px] text-gov-600 hover:text-gov-700 font-medium">详情 →</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 p-3 rounded-lg bg-rose-50 border border-rose-100">
              <div className="text-xs font-semibold text-rose-800 mb-2 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" /> 国密签名核验统计
              </div>
              <div className="space-y-1.5">
                {smStats.map((s) => (
                  <div key={s.algo} className="text-[11px] flex justify-between items-center">
                    <span className="text-rose-700">{s.algo}</span>
                    <span className="text-gray-600">
                      <span className="text-emerald-600 font-medium">{(s.signCount + s.encryptCount + s.hashCount).toLocaleString()}</span>
                      <span className="mx-1 text-gray-400">/</span>
                      <span className="text-danger-600 font-medium">失败 {s.failCount}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {regulatoryRole === "default" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-600" /> 10大类证照接入量与持有分布
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={certificateCategories.map((c) => ({
                    name: c.name.slice(0, 4),
                    目录数: c.count,
                    已持有: heldTypes.includes(c.code) ? c.count : Math.floor(c.count * 0.3),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="目录数" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="已持有" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gov-600" /> 综合监管·调用安全雷达
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={[
                  { subject: "身份认证", A: 99, fullMark: 100 },
                  { subject: "权限管控", A: 96, fullMark: 100 },
                  { subject: "访问审计", A: 98, fullMark: 100 },
                  { subject: "数据加密", A: 99, fullMark: 100 },
                  { subject: "异常拦截", A: 92, fullMark: 100 },
                  { subject: "接口稳定", A: 97, fullMark: 100 },
                ]}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="综合评分" dataKey="A" stroke="#1E5AA8" fill="#1E5AA8" fillOpacity={0.45} strokeWidth={2} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gov-600" /> 证照分类监管清单（{totalCount}类）
          </h3>
          <select
            className="input w-auto text-sm"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            <option value="all">全部分类</option>
            {certificateCategories.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">分类代码</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">分类名称</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">所属组</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">证照数量</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">认证等级</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">调用成功率</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">平均响应</th>
                {regulatoryRole === "gongan" && (
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">异常次数</th>
                )}
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCats.map((c) => (
                <tr key={c.code} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">{c.code.toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{c.name}</span>
                      {c.canDelegate && <span className="text-[10px] px-1.5 py-0.5 bg-violet-50 text-violet-700 rounded border border-violet-100">可委托</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge-primary text-xs">{c.group}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">{c.count}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={
                      c.requiredAuthLevel === "L3"
                        ? "badge-danger text-xs"
                        : c.requiredAuthLevel === "L2"
                        ? "badge-warning text-xs"
                        : "badge-gray text-xs"
                    }>
                      🔐 {c.requiredAuthLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success-500 rounded-full"
                          style={{ width: `${c.accessRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{c.accessRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.avgResponse}ms</td>
                  {regulatoryRole === "gongan" && (
                    <td className="px-4 py-3">
                      <span className={
                        c.errorCount > 8
                          ? "text-sm font-bold text-danger-600"
                          : c.errorCount > 3
                          ? "text-sm font-bold text-warning-600"
                          : "text-sm text-gray-500"
                      }>
                        {c.errorCount}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs text-success-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 正常接入
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function HeatmapPanel() {
  const [selectedDomain, setSelectedDomain] = useState<ServiceDomain | "all">("all");
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const districts = Array.from(new Set(mockHeatmapData.map((d) => d.area)));

  const filteredData = mockHeatmapData.filter(
    (d) => selectedDomain === "all" || d.serviceCategory === selectedDomain
  );

  const getHeatmapValue = (area: string, hour: number) => {
    const matches = filteredData.filter((d) => d.area === area && d.hour === hour);
    return matches.reduce((sum, d) => sum + d.count, 0);
  };

  const maxValue = Math.max(
    ...districts.flatMap((area) => hours.map((h) => getHeatmapValue(area, h)))
  );

  const getColor = (value: number) => {
    const ratio = value / maxValue;
    if (ratio === 0) return "bg-gray-100";
    if (ratio < 0.2) return "bg-gov-100";
    if (ratio < 0.4) return "bg-gov-200";
    if (ratio < 0.6) return "bg-gov-400";
    if (ratio < 0.8) return "bg-gov-600";
    return "bg-gov-800";
  };

  const getTextColor = (value: number) => {
    const ratio = value / maxValue;
    return ratio > 0.5 ? "text-white" : "text-gray-700";
  };

  const peakHour = hours.reduce((peak, h) => {
    const total = districts.reduce((sum, a) => sum + getHeatmapValue(a, h), 0);
    const peakTotal = districts.reduce((sum, a) => sum + getHeatmapValue(a, peak), 0);
    return total > peakTotal ? h : peak;
  }, 0);

  const peakDistrict = districts.reduce((peak, d) => {
    const total = hours.reduce((sum, h) => sum + getHeatmapValue(d, h), 0);
    const peakTotal = hours.reduce((sum, h) => sum + getHeatmapValue(peak, h), 0);
    return total > peakTotal ? d : peak;
  }, districts[0]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gov-100 flex items-center justify-center">
            <Zap className="w-5 h-5 text-gov-600" />
          </div>
          <div>
            <div className="text-xl font-bold">{filteredData.length}</div>
            <div className="text-xs text-gray-500">数据样本</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <div className="text-xl font-bold">{districts.length}</div>
            <div className="text-xs text-gray-500">覆盖区域</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-xl font-bold">{peakHour}:00</div>
            <div className="text-xs text-gray-500">访问高峰时段</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <div className="text-xl font-bold">{peakDistrict}</div>
            <div className="text-xs text-gray-500">最活跃区域</div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">服务域筛选：</span>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedDomain("all")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                selectedDomain === "all"
                  ? "bg-gov-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              全部
            </button>
            {serviceDomains.map((d) => (
              <button
                key={d.code}
                onClick={() => setSelectedDomain(d.code)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  selectedDomain === d.code
                    ? "bg-gov-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5 overflow-x-auto">
        <h3 className="font-semibold text-gray-900 mb-4">市民使用行为热力图（区域 × 时段）</h3>
        <div className="min-w-[800px]">
          <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(24, 1fr)` }}>
            <div className="text-xs text-gray-400 text-center py-2">区域\时段</div>
            {hours.map((h) => (
              <div key={h} className="text-xs text-gray-400 text-center py-2">
                {h}
              </div>
            ))}

            {districts.map((district) => (
              <div key={district} className="contents">
                <div className="text-xs text-gray-700 font-medium py-2 pr-2">
                  {district}
                </div>
                {hours.map((h) => {
                  const value = getHeatmapValue(district, h);
                  return (
                    <div
                      key={`${district}-${h}`}
                      className={`${getColor(value)} ${getTextColor(value)} aspect-square rounded flex items-center justify-center text-xs font-medium cursor-pointer hover:ring-2 hover:ring-gov-400 transition`}
                      title={`${district} ${h}:00 - ${value}次访问`}
                    >
                      {value > maxValue * 0.3 ? value : ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-end gap-4">
            <span className="text-xs text-gray-500">访问量：</span>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded bg-gray-100" />
              <span className="text-xs text-gray-500">低</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded bg-gov-200" />
              <span className="text-xs text-gray-500">中</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded bg-gov-400" />
              <span className="text-xs text-gray-500">较高</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded bg-gov-600" />
              <span className="text-xs text-gray-500">高</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded bg-gov-800" />
              <span className="text-xs text-gray-500">极高</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
