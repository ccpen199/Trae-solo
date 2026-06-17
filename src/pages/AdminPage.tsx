import { useState } from "react";
import { MainLayout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { useAppStore } from "@/store/useAppStore";
import { mockCompletionRateData, mockROIData } from "@/data/mockData";
import {
  Settings,
  BarChart3,
  Building2,
  Users,
  ShieldCheck,
  SlidersHorizontal,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  ChevronRight,
  Search,
  Filter,
  Zap,
  DollarSign,
  Target,
  FileCheck,
  Wrench,
  Bell,
  Plus,
  Minus,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const { platformStats, enterprises, riskAlerts, tasks } = useAppStore();
  const [activeTab, setActiveTab] = useState<"dashboard" | "enterprises" | "users" | "system">("dashboard");

  const pendingEnterprises = enterprises.filter((e) => e.status === "pending");
  const unresolvedAlerts = riskAlerts.filter((a) => !a.resolved);

  const systemHealth = [
    { name: "AI审核引擎", status: "healthy", uptime: "99.9%" },
    { name: "风控引擎", status: "healthy", uptime: "99.8%" },
    { name: "OCR服务", status: "healthy", uptime: "99.5%" },
    { name: "支付结算", status: "warning", uptime: "98.7%" },
  ];

  return (
    <MainLayout title="管理后台" subtitle="平台全局管控">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          {[
            { key: "dashboard", label: "监控大屏", icon: BarChart3 },
            { key: "enterprises", label: "企业管理", icon: Building2 },
            { key: "users", label: "用户管理", icon: Users },
            { key: "system", label: "系统配置", icon: SlidersHorizontal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const badge = tab.key === "enterprises" ? pendingEnterprises.length : 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  "px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  isActive
                    ? "bg-cyber-cyan-500/15 text-cyber-cyan-400 border border-cyber-cyan-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {badge > 0 && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-warning-500/20 text-warning-500 rounded-full">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-6 gap-4">
              <StatCard
                title="注册用户"
                value={`${(platformStats.totalUsers / 10000).toFixed(1)}万`}
                icon={<Users className="w-6 h-6" />}
                trend={5.2}
                trendLabel="周增长"
                accentColor="#00F0FF"
              />
              <StatCard
                title="入驻企业"
                value={platformStats.totalEnterprises}
                icon={<Building2 className="w-6 h-6" />}
                trend={12}
                trendLabel="本月新增"
                accentColor="#FFB800"
              />
              <StatCard
                title="总任务数"
                value={platformStats.totalTasks}
                icon={<Target className="w-6 h-6" />}
                trend={8}
                trendLabel="今日新增"
                accentColor="#00E676"
              />
              <StatCard
                title="总提交数"
                value={`${(platformStats.totalSubmissions / 10000).toFixed(1)}万`}
                icon={<FileCheck className="w-6 h-6" />}
                accentColor="#FF9100"
              />
              <StatCard
                title="发放赏金"
                value={`${(platformStats.totalRewardsDistributed / 10000).toFixed(0)}万`}
                icon={<DollarSign className="w-6 h-6" />}
                trend={15}
                trendLabel="较上月"
                accentColor="#FF3D71"
              />
              <StatCard
                title="今日活跃"
                value={platformStats.todayActiveUsers.toLocaleString()}
                icon={<Activity className="w-6 h-6" />}
                trend={3.4}
                trendLabel="较昨日"
                accentColor="#00F0FF"
              />
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-white">全局任务完成率趋势</h3>
                    <p className="text-sm text-gray-500 mt-1">近7日完成率与目标值对比</p>
                  </div>
                  <span className="tag tag-red flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    拐点预警
                  </span>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockCompletionRateData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#666" fontSize={12} />
                      <YAxis
                        stroke="#666"
                        fontSize={12}
                        domain={[0, 1]}
                        tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0A1628",
                          border: "1px solid rgba(0,240,255,0.2)",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                        formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, ""]}
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#666"
                        strokeDasharray="5 5"
                        strokeWidth={1}
                        dot={false}
                        name="目标值"
                      />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        stroke="#FF3D71"
                        strokeWidth={2}
                        dot={{ fill: "#FF3D71", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                        name="实际完成率"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 rounded-xl bg-danger-500/5 border border-danger-500/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-white font-medium">完成率异常下降预警</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        近2天完成率从 73% 骤降至 42%，降幅达 42%。
                        主要影响为调研类任务，建议检查定价策略或任务难度设置。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-card p-5">
                  <h4 className="text-white font-medium mb-4">实时系统状态</h4>
                  <div className="space-y-3">
                    {systemHealth.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between p-3 rounded-lg bg-deep-space-800/30"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full animate-pulse",
                              item.status === "healthy" && "bg-success-500",
                              item.status === "warning" && "bg-warning-500",
                              item.status === "error" && "bg-danger-500"
                            )}
                          />
                          <span className="text-sm text-white">{item.name}</span>
                        </div>
                        <span className="text-xs text-gray-500 font-mono">{item.uptime}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-medium">活跃告警</h4>
                    <span className="tag tag-red">{unresolvedAlerts.length}</span>
                  </div>
                  <div className="space-y-2">
                    {unresolvedAlerts.slice(0, 3).map((alert) => (
                      <div
                        key={alert.id}
                        className="p-3 rounded-lg bg-deep-space-800/30 hover:bg-deep-space-800/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <Bell className="w-4 h-4 text-warning-500 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-white truncate">{alert.title}</p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {new Date(alert.detectedAt).toLocaleTimeString("zh-CN")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-white">平台收支趋势</h3>
                    <p className="text-sm text-gray-500 mt-1">近7天成本与收益</p>
                  </div>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockROIData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#666" fontSize={11} />
                      <YAxis stroke="#666" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0A1628",
                          border: "1px solid rgba(0,240,255,0.2)",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#00E676"
                        fill="url(#colorRev)"
                        name="平台收入"
                      />
                      <Area
                        type="monotone"
                        dataKey="cost"
                        stroke="#FF9100"
                        fill="url(#colorCost)"
                        name="任务支出"
                      />
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00E676" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00E676" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF9100" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#FF9100" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-white">任务类型分布</h3>
                    <p className="text-sm text-gray-500 mt-1">按任务类型统计数量</p>
                  </div>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "媒体类", value: 125, color: "#00F0FF" },
                        { name: "调研类", value: 89, color: "#A855F7" },
                        { name: "体验类", value: 42, color: "#FFB800" },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#666" fontSize={12} />
                      <YAxis stroke="#666" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0A1628",
                          border: "1px solid rgba(0,240,255,0.2)",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} name="任务数">
                        {[
                          { fill: "#00F0FF" },
                          { fill: "#A855F7" },
                          { fill: "#FFB800" },
                        ].map((entry, index) => (
                          <rect key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "enterprises" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" placeholder="搜索企业..." className="input-field pl-9 w-64 text-sm" />
                </div>
                <select className="input-field w-40 text-sm">
                  <option>全部状态</option>
                  <option>待审核</option>
                  <option>已认证</option>
                  <option>已拒绝</option>
                  <option>已冻结</option>
                </select>
                <button className="btn-secondary text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  筛选
                </button>
              </div>
              <button className="btn-primary text-sm">新增企业</button>
            </div>

            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="table-header">企业名称</th>
                    <th className="table-header">行业</th>
                    <th className="table-header">营业执照</th>
                    <th className="table-header">账户余额</th>
                    <th className="table-header">已完成任务</th>
                    <th className="table-header">状态</th>
                    <th className="table-header">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {enterprises.map((ent) => (
                    <tr key={ent.id} className="hover:bg-white/5 transition-colors">
                      <td className="table-cell">
                        <div>
                          <p className="text-white font-medium">{ent.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            联系人：{ent.contactPerson}
                          </p>
                        </div>
                      </td>
                      <td className="table-cell text-gray-400 text-sm">{ent.industry}</td>
                      <td className="table-cell">
                        <code className="text-xs text-gray-500 bg-deep-space-800 px-2 py-1 rounded">
                          {ent.licenseNo}
                        </code>
                      </td>
                      <td className="table-cell">
                        <span className="text-amber-gold-400 font-medium">
                          ¥{ent.balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="table-cell text-gray-400">{ent.completedTasks}</td>
                      <td className="table-cell">
                        <span
                          className={cn(
                            "tag",
                            ent.status === "approved" && "tag-green",
                            ent.status === "pending" && "tag-orange",
                            ent.status === "rejected" && "tag-red",
                            ent.status === "suspended" && "tag-red"
                          )}
                        >
                          {ent.status === "approved" && "已认证"}
                          {ent.status === "pending" && "待审核"}
                          {ent.status === "rejected" && "已拒绝"}
                          {ent.status === "suspended" && "已冻结"}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button className="text-cyber-cyan-400 hover:text-cyber-cyan-300 text-sm flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            详情
                          </button>
                          {ent.status === "pending" && (
                            <>
                              <button className="text-success-500 hover:text-success-400 text-sm">
                                通过
                              </button>
                              <button className="text-danger-500 hover:text-danger-400 text-sm">
                                拒绝
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" placeholder="搜索用户..." className="input-field pl-9 w-64 text-sm" />
                </div>
                <select className="input-field w-40 text-sm">
                  <option>全部状态</option>
                  <option>已认证</option>
                  <option>未认证</option>
                  <option>已封禁</option>
                </select>
              </div>
              <button className="btn-primary text-sm">导出用户数据</button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <StatCard
                title="总用户数"
                value={platformStats.totalUsers.toLocaleString()}
                icon={<Users className="w-6 h-6" />}
                accentColor="#00F0FF"
              />
              <StatCard
                title="实名认证"
                value="142,356"
                icon={<CheckCircle2 className="w-6 h-6" />}
                trend={91}
                trendLabel="认证率"
                accentColor="#00E676"
              />
              <StatCard
                title="今日活跃"
                value={platformStats.todayActiveUsers.toLocaleString()}
                icon={<Activity className="w-6 h-6" />}
                accentColor="#FFB800"
              />
              <StatCard
                title="封禁账号"
                value="238"
                icon={<ShieldCheck className="w-6 h-6" />}
                trend={-15}
                trendLabel="较上周"
                accentColor="#FF3D71"
              />
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-medium text-white mb-4">用户增长趋势</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={[
                      { date: "06-09", newUsers: 1200, active: 8500 },
                      { date: "06-10", newUsers: 1500, active: 9200 },
                      { date: "06-11", newUsers: 1800, active: 10500 },
                      { date: "06-12", newUsers: 1400, active: 9800 },
                      { date: "06-13", newUsers: 2100, active: 11200 },
                      { date: "06-14", newUsers: 1900, active: 10800 },
                      { date: "06-15", newUsers: 2300, active: 12500 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0A1628",
                        border: "1px solid rgba(0,240,255,0.2)",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="newUsers" fill="#00F0FF" name="新增用户" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="active" stroke="#FFB800" strokeWidth={2} name="活跃用户" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "system" && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-medium text-white mb-6">动态定价配置</h3>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: "基础赏金（媒体类）", value: "2.00元", min: 0.5, max: 10, step: 0.5, current: 2 },
                  { label: "基础赏金（调研类）", value: "8.00元", min: 2, max: 50, step: 1, current: 8 },
                  { label: "基础赏金（体验类）", value: "45.00元", min: 10, max: 200, step: 5, current: 45 },
                  { label: "难度系数上限", value: "3.0x", min: 1, max: 5, step: 0.5, current: 3 },
                  { label: "自动加价幅度", value: "25%", min: 5, max: 50, step: 5, current: 25 },
                  { label: "完成率触发阈值", value: "60%", min: 30, max: 90, step: 5, current: 60 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-400">{item.label}</label>
                      <span className="text-cyber-cyan-400 font-mono font-medium">{item.value}</span>
                    </div>
                    <input
                      type="range"
                      min={item.min}
                      max={item.max}
                      step={item.step}
                      defaultValue={item.current}
                      className="w-full h-2 bg-deep-space-700 rounded-lg appearance-none cursor-pointer accent-cyber-cyan-500"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button className="btn-secondary text-sm">恢复默认</button>
                <button className="btn-primary text-sm">保存配置</button>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-medium text-white mb-6">审核规则配置</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-400">AI审核置信度阈值</label>
                    <span className="text-success-500 font-mono font-medium">80分</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    defaultValue="80"
                    className="w-full h-2 bg-deep-space-700 rounded-lg appearance-none cursor-pointer accent-success-500"
                  />
                  <p className="text-xs text-gray-600 mt-2">高于此分数的提交将自动通过</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-400">人工抽检比例</label>
                    <span className="text-warning-500 font-mono font-medium">15%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    defaultValue="15"
                    className="w-full h-2 bg-deep-space-700 rounded-lg appearance-none cursor-pointer accent-warning-500"
                  />
                  <p className="text-xs text-gray-600 mt-2">AI通过的任务中抽取此比例进行人工复核</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-400">单日提现限额</label>
                    <span className="text-amber-gold-400 font-mono font-medium">2000元</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="100"
                    defaultValue="2000"
                    className="w-full h-2 bg-deep-space-700 rounded-lg appearance-none cursor-pointer accent-amber-gold-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-400">劳务个税税率</label>
                    <span className="text-danger-400 font-mono font-medium">20%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    defaultValue="20"
                    className="w-full h-2 bg-deep-space-700 rounded-lg appearance-none cursor-pointer accent-danger-500"
                  />
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-medium text-white mb-6">风控参数配置</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "设备指纹相似度阈值", value: "0.85", desc: "高于此值判定为同一设备" },
                  { label: "同一IP账号上限", value: "5个", desc: "同一IP最多允许的账号数" },
                  { label: "日完成任务上限", value: "50个", desc: "单用户每日任务上限" },
                  { label: "答题最短时长", value: "30秒", desc: "低于此时长标记异常" },
                  { label: "连续提交间隔", value: "10秒", desc: "提交间隔低于此值标记" },
                  { label: "风控告警等级", value: "中危以上", desc: "推送通知的告警级别" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-4 rounded-xl bg-deep-space-800/30 border border-white/5 hover:border-cyber-cyan-500/20 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white">{item.label}</span>
                      <Wrench className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-lg font-mono font-bold text-cyber-cyan-400">{item.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
