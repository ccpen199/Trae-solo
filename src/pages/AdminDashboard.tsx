import { useState } from "react";
import {
  LayoutDashboard,
  FileCheck,
  CreditCard,
  ClipboardList,
  Activity,
  BarChart3,
  Shield,
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
  ShieldCheck,
  ShieldAlert,
  XCircle,
  Globe,
  MapPin,
  Clock4,
  Zap,
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
} from "@/data/mockData";
import type { ServiceDomain } from "@/types";

const COLORS = ["#1E5AA8", "#10B981", "#F59E0B", "#8B5CF6", "#06B6D4", "#F43F5E"];

type TabKey = "overview" | "approvals" | "services" | "audit" | "monitor" | "heatmap";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const menuItems = [
    { key: "overview" as TabKey, label: "数据概览", icon: LayoutDashboard },
    { key: "approvals" as TabKey, label: "协同审批", icon: ClipboardList, badge: mockPendingApprovals.length },
    { key: "services" as TabKey, label: "服务管理", icon: FileCheck },
    { key: "audit" as TabKey, label: "审计日志", icon: ShieldAlert },
    { key: "monitor" as TabKey, label: "服务监控", icon: Activity },
    { key: "heatmap" as TabKey, label: "热力图统计", icon: BarChart3 },
  ];

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
              <div className="text-xs text-gray-500">管理后台</div>
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
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {menuItems.find((m) => m.key === activeTab)?.label}
            </h1>
            <p className="text-xs text-gray-500">市数据局 · 李主任</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge-primary">市公安局</span>
            <span className="badge-success">市数据局</span>
          </div>
        </header>

        <div className="p-6">
          {activeTab === "overview" && <OverviewPanel />}
          {activeTab === "approvals" && <ApprovalsPanel />}
          {activeTab === "services" && <ServicesPanel />}
          {activeTab === "audit" && <AuditPanel />}
          {activeTab === "monitor" && <MonitorPanel />}
          {activeTab === "heatmap" && <HeatmapPanel />}
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

function AuditPanel() {
  const [searchText, setSearchText] = useState("");

  const filtered = mockAuditLogs.filter(
    (l) =>
      l.userName.includes(searchText) ||
      l.action.includes(searchText) ||
      l.resource.includes(searchText)
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gov-100 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-gov-600" />
          </div>
          <div>
            <div className="text-xl font-bold">{mockAuditLogs.filter((l) => l.result === "success").length}</div>
            <div className="text-xs text-gray-500">成功操作</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-danger-100 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-danger-600" />
          </div>
          <div>
            <div className="text-xl font-bold">{mockAuditLogs.filter((l) => l.result === "failed").length}</div>
            <div className="text-xs text-gray-500">失败操作</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center">
            <User className="w-5 h-5 text-warning-600" />
          </div>
          <div>
            <div className="text-xl font-bold">2</div>
            <div className="text-xs text-gray-500">活跃用户</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Globe className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xl font-bold">8</div>
            <div className="text-xs text-gray-500">资源类型</div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索用户、操作、资源..."
            className="input pl-10"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">时间</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">用户</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">操作</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">资源</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">IP地址</th>
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
                  <span className="text-xs text-gray-400 ml-1">#{log.resourceId}</span>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-gray-500">{log.ip}</td>
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
