import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Gift,
  Activity,
  ShoppingCart,
  TicketCheck,
  ShoppingBag,
  Plane,
  Stethoscope,
  Scale,
  CreditCard,
  Crown,
  Ticket,
  ClipboardList,
  AlertCircle,
  Clock,
  ChevronRight,
  Sparkles,
  BarChart3,
  TrendingUp,
  Target,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { useStore } from "@/store";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";

const quickEntries = [
  { label: "福利领取", icon: Gift, path: "/benefits", color: "bg-red-50 text-union-red" },
  { label: "积分商城", icon: ShoppingBag, path: "/benefits", color: "bg-amber-50 text-amber-600" },
  { label: "出行服务", icon: Plane, path: "/travel", color: "bg-blue-50 text-blue-600" },
  { label: "体检预约", icon: Stethoscope, path: "/life", color: "bg-green-50 text-green-600" },
  { label: "法律咨询", icon: Scale, path: "/life", color: "bg-purple-50 text-purple-600" },
  { label: "工会卡", icon: CreditCard, path: "/payment", color: "bg-cyan-50 text-cyan-600" },
  { label: "贵宾厅", icon: Crown, path: "/travel", color: "bg-union-gold/10 text-union-gold" },
  { label: "优先购票", icon: Ticket, path: "/travel", color: "bg-indigo-50 text-indigo-600" },
];

const demoRecommendations = [
  { id: "1", title: "端午节福利礼包", tag: "节日福利", image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Dragon+boat+festival+gift+box+red+and+gold+Chinese+style&image_size=landscape_4_3" },
  { id: "2", title: "夏季清凉慰问品", tag: "季节关怀", image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Summer+cooling+care+package+cold+drinks+and+fruits&image_size=landscape_4_3" },
  { id: "3", title: "年度健康体检套餐", tag: "健康福利", image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Health+checkup+medical+examination+modern+hospital&image_size=landscape_4_3" },
  { id: "4", title: "职工生日关怀券", tag: "生日福利", image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Birthday+birthday+cake+celebration+warm+lighting&image_size=landscape_4_3" },
  { id: "5", title: "秋游团建活动", tag: "团建活动", image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Autumn+team+building+outdoor+mountains+golden+leaves&image_size=landscape_4_3" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    memberStats,
    trends,
    funnel,
    voucherTemplates,
    members,
    budgets,
    recommendations,
    fetchMemberStats,
    fetchFunnel,
    fetchVoucherTemplates,
    fetchTrends,
    fetchMembers,
    fetchBudgets,
    fetchRecommendations,
  } = useStore();

  const [hoveredRec, setHoveredRec] = useState<string | null>(null);

  useEffect(() => {
    fetchMemberStats();
    fetchFunnel();
    fetchVoucherTemplates();
    fetchTrends();
    fetchMembers({ status: "pending" });
    fetchBudgets();
    fetchRecommendations();
  }, []);

  const pendingApprovals = members.filter((m) => m.status === "pending").length;
  const activeVouchers = voucherTemplates.filter((v) => v.status === "active");
  const unusedVouchers = activeVouchers.filter((v) => v.remainingQuantity > 0);
  const pendingBudgets = budgets.filter((b) => b.status === "pending");

  const expiringBenefits = activeVouchers
    .filter((v) => {
      const daysLeft = Math.ceil(
        (new Date(v.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysLeft >= 0 && daysLeft <= 7;
    })
    .slice(0, 3);

  const todoItems = [
    ...(pendingApprovals > 0
      ? [{ id: "pending", icon: ClipboardList, text: `${pendingApprovals} 条会员入会待审批`, status: "pending" as const, color: "text-yellow-600" }]
      : []),
    ...(unusedVouchers.length > 0
      ? [{ id: "unused", icon: TicketCheck, text: `${unusedVouchers.length} 张福利券未领取`, status: "unused" as const, color: "text-blue-600" }]
      : []),
    ...(expiringBenefits.length > 0
      ? [{ id: "expiring", icon: AlertCircle, text: `${expiringBenefits.length} 项福利即将过期`, status: "pending" as const, color: "text-red-500" }]
      : []),
    ...(pendingBudgets.length > 0
      ? [{ id: "budget", icon: Clock, text: `${pendingBudgets.length} 个预算方案待审批`, status: "pending" as const, color: "text-orange-500" }]
      : []),
  ];

  const chartData = trends.length > 0
    ? trends.map((t) => ({
        month: t.month,
        新增会员: t.newMembers,
        活跃会员: t.activeMembers,
      }))
    : [
        { month: "1月", 新增会员: 120, 活跃会员: 850 },
        { month: "2月", 新增会员: 98, 活跃会员: 920 },
        { month: "3月", 新增会员: 156, 活跃会员: 1100 },
        { month: "4月", 新增会员: 134, 活跃会员: 1050 },
        { month: "5月", 新增会员: 178, 活跃会员: 1200 },
        { month: "6月", 新增会员: 210, 活跃会员: 1350 },
      ];

  const totalBenefits = memberStats?.benefitCoverageRate
    ? `¥${(memberStats.benefitCoverageRate * 10000).toLocaleString()}`
    : "¥128,500";
  const serviceRate = memberStats?.benefitCoverageRate
    ? `${(memberStats.benefitCoverageRate * 100).toFixed(1)}%`
    : "78.5%";
  const pointsExchanged = trends.length > 0
    ? trends[trends.length - 1].pointsExchanged.toLocaleString()
    : "2,340";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="会员总数"
          value={memberStats?.totalMembers?.toLocaleString() ?? "—"}
          trend={memberStats ? { direction: "up", percentage: 5.2 } : undefined}
          color="red"
        />
        <StatCard
          icon={Gift}
          label="福利发放总额"
          value={totalBenefits}
          trend={{ direction: "up", percentage: 12.8 }}
          color="gold"
        />
        <StatCard
          icon={Activity}
          label="服务使用率"
          value={serviceRate}
          trend={{ direction: "up", percentage: 3.5 }}
          color="blue"
        />
        <StatCard
          icon={ShoppingCart}
          label="积分兑换量"
          value={pointsExchanged}
          trend={{ direction: "down", percentage: 2.1 }}
          color="green"
        />
      </div>

      <div className="card">
        <h3 className="text-base font-semibold text-gray-900 mb-4">快捷入口</h3>
        <div className="grid grid-cols-4 gap-3">
          {quickEntries.map((entry) => {
            const Icon = entry.icon;
            return (
              <button
                key={entry.label}
                onClick={() => navigate(entry.path)}
                className="flex flex-col items-center gap-2 py-4 px-2 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${entry.color} group-hover:scale-110 transition-transform duration-200`}>
                  <Icon size={22} />
                </div>
                <span className="text-sm text-gray-700 group-hover:text-union-red transition-colors">
                  {entry.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">待办事项</h3>
            <span className="text-xs text-union-red bg-union-red/5 px-2 py-1 rounded-full font-medium">
              {todoItems.length} 项待处理
            </span>
          </div>
          {todoItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <ClipboardList size={36} className="mb-2" />
              <p className="text-sm">暂无待办事项</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todoItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-gray-50 ${item.color}`}>
                      <Icon size={18} />
                    </div>
                    <span className="flex-1 text-sm text-gray-700">{item.text}</span>
                    <StatusBadge status={item.status} />
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-union-red transition-colors" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">会员趋势</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-union-red" />
                新增会员
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-union-gold" />
                活跃会员
              </span>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C41E3A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#C41E3A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4A843" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="新增会员" stroke="#C41E3A" strokeWidth={2} fill="url(#gradRed)" />
                <Area type="monotone" dataKey="活跃会员" stroke="#D4A843" strokeWidth={2} fill="url(#gradGold)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-union-gold" />
            <h3 className="text-base font-semibold text-gray-900">为您推荐</h3>
          </div>
          <button
            onClick={() => navigate("/benefits")}
            className="text-sm text-union-red hover:underline flex items-center gap-1"
          >
            查看全部 <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
          {demoRecommendations.map((rec) => (
            <div
              key={rec.id}
              className="shrink-0 w-56 rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 group cursor-pointer"
              onMouseEnter={() => setHoveredRec(rec.id)}
              onMouseLeave={() => setHoveredRec(null)}
            >
              <div className="h-32 overflow-hidden">
                <img
                  src={rec.image}
                  alt={rec.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                <h4 className="text-sm font-medium text-gray-900 mb-1.5 truncate">{rec.title}</h4>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-union-red/5 text-union-red">
                    {rec.tag}
                  </span>
                  <button className="text-xs text-union-red hover:text-union-red-dark font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    立即领取
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-union-red rounded-full" />
          <h2 className="text-lg font-semibold text-gray-900">运营复盘链路</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-union-red" />
              <h3 className="text-base font-semibold text-gray-900">权益转化漏斗</h3>
            </div>
            <div className="space-y-3">
              {(funnel.length > 0
                ? funnel
                : [
                    { stage: "注册会员", count: 12000, rate: 1.0 },
                    { stage: "领取福利", count: 8500, rate: 0.71 },
                    { stage: "使用福利", count: 5200, rate: 0.61 },
                    { stage: "积分兑换", count: 3100, rate: 0.36 },
                    { stage: "服务预约", count: 1850, rate: 0.22 },
                  ]
              ).map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-20 text-sm text-gray-600 shrink-0">{item.stage}</span>
                  <div className="flex-1 h-8 bg-gray-50 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-union-red/80 to-union-red rounded-lg transition-all duration-500"
                      style={{ width: `${item.rate * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-3">
                      <span className="text-xs font-medium text-white drop-shadow-sm">
                        {item.count.toLocaleString()} 人
                      </span>
                      <span className="text-xs font-semibold text-gray-700 bg-white/80 px-1.5 py-0.5 rounded">
                        {(item.rate * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="h-64 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={funnel.length > 0 ? funnel : [
                    { stage: "注册会员", count: 12000, rate: 1.0 },
                    { stage: "领取福利", count: 8500, rate: 0.71 },
                    { stage: "使用福利", count: 5200, rate: 0.61 },
                    { stage: "积分兑换", count: 3100, rate: 0.36 },
                    { stage: "服务预约", count: 1850, rate: 0.22 },
                  ]}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }}
                    formatter={(value: number, name: string) => [
                      name === "count" ? value.toLocaleString() + " 人" : (value * 100).toFixed(0) + "%",
                      name === "count" ? "人数" : "转化率"
                    ]}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {(funnel.length > 0 ? funnel : []).map((_, idx) => (
                      <Cell key={idx} fill={`rgba(196, 30, 58, ${0.9 - idx * 0.12})`} />
                    ))}
                    {funnel.length === 0 && [0,1,2,3,4].map((idx) => (
                      <Cell key={idx} fill={`rgba(196, 30, 58, ${0.9 - idx * 0.12})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-union-gold" />
              <h3 className="text-base font-semibold text-gray-900">月度趋势概览</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-union-red/5 to-union-red/10 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">累计发放金额</p>
                <p className="text-lg font-bold text-union-red">
                  ¥{(trends.length > 0 ? trends.slice(0, 6).reduce((s, t) => s + t.totalAmount, 0) : 485600).toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-union-gold/5 to-union-gold/10 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">月均增长率</p>
                <p className="text-lg font-bold text-union-gold">+12.6%</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trends.length > 0
                    ? trends.slice(0, 6).map((t) => ({
                        month: t.month.replace(/[^0-9]/g, "") + "月",
                        福利发放金额: t.totalAmount,
                      }))
                    : [
                        { month: "1月", 福利发放金额: 62000 },
                        { month: "2月", 福利发放金额: 58000 },
                        { month: "3月", 福利发放金额: 85000 },
                        { month: "4月", 福利发放金额: 78000 },
                        { month: "5月", 福利发放金额: 96000 },
                        { month: "6月", 福利发放金额: 106600 },
                      ]}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradTrendGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4A843" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => "¥" + (v / 1000).toFixed(0) + "k"} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }}
                    formatter={(value: number) => ["¥" + value.toLocaleString(), "福利发放金额"]}
                  />
                  <Area type="monotone" dataKey="福利发放金额" stroke="#D4A843" strokeWidth={2} fill="url(#gradTrendGold)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-union-red" />
                <h3 className="text-base font-semibold text-gray-900">推荐策略命中</h3>
              </div>
              <span className="text-xs text-union-red bg-union-red/5 px-2 py-1 rounded-full font-medium">
                {(recommendations.length > 0 ? recommendations.filter(r => r.enabled).length : 2)} 条生效
              </span>
            </div>
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {(recommendations.length > 0
                ? recommendations
                : [
                    { id: "r1", name: "新会员首月权益", conditions: { tags: ["新会员", "入职不满30天"] }, priority: 1, enabled: true },
                    { id: "r2", name: "生日月专属关怀", conditions: { tags: ["当月生日", "VIP会员"] }, priority: 2, enabled: true },
                    { id: "r3", name: "节日福利自动匹配", conditions: { tags: ["节日福利", "全体会员"] }, priority: 3, enabled: false },
                  ]
              ).map((rule) => (
                <div
                  key={rule.id}
                  className="p-3 rounded-xl border border-gray-100 hover:border-union-red/30 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900 leading-tight pr-2">{rule.name}</h4>
                    <span
                      className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        rule.enabled
                          ? "bg-green-50 text-green-600 border border-green-100"
                          : "bg-gray-100 text-gray-500 border border-gray-200"
                      }`}
                    >
                      {rule.enabled ? "已启用" : "已停用"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {rule.conditions.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-union-red/5 text-union-red border border-union-red/10"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">优先级</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        rule.priority <= 1
                          ? "bg-union-red/10 text-union-red"
                          : rule.priority <= 2
                          ? "bg-union-gold/10 text-union-gold"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      P{rule.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
