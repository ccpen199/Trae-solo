import ReactECharts from "echarts-for-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAppStore } from "@/stores";
import { cn, getTimeRemaining } from "@/utils";
import {
  Users,
  UserCheck,
  FileText,
  Wallet,
  Stamp,
  Vote,
  ClipboardList,
  AlertTriangle,
  Wrench,
  ShieldCheck,
  Building2,
  HandCoins,
  Store,
  Settings,
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronRight,
} from "lucide-react";

const Dashboard = () => {
  const { communityHealth, todos, councilMembers, repairTickets } = useAppStore();
  const todayLabel = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  const activeMembers = councilMembers.filter((m) => m.status === "active");
  const activeTickets = repairTickets.filter((t) => t.status !== "completed");

  const radarOption = {
    radar: {
      indicator: communityHealth.indicators.map((i) => ({ name: i.name, max: 100 })),
      radius: "65%",
      center: ["50%", "50%"],
      splitNumber: 4,
      axisName: { color: "#1E40AF", fontSize: 12 },
      splitLine: { lineStyle: { color: "#BFDBFE" } },
      splitArea: { show: true, areaStyle: { color: ["#EFF6FF", "#DBEAFE", "#BFDBFE", "#93C5FD"] } },
      axisLine: { lineStyle: { color: "#93C5FD" } },
    },
    series: [{
      type: "radar",
      data: [{
        value: communityHealth.indicators.map((i) => i.value),
        areaStyle: { color: "rgba(14, 165, 233, 0.3)" },
        lineStyle: { color: "#0EA5E9", width: 2 },
        itemStyle: { color: "#0EA5E9" },
      }],
    }],
  };

  const lineOption = {
    grid: { left: "3%", right: "4%", bottom: "3%", top: "10%", containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: communityHealth.trend.map((t) => t.date.slice(5) + "月"),
      axisLine: { lineStyle: { color: "#93C5FD" } },
      axisLabel: { color: "#64748B", fontSize: 10 },
    },
    yAxis: {
      type: "value",
      min: 70,
      max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: "#E2E8F0" } },
      axisLabel: { color: "#64748B", fontSize: 10 },
    },
    series: [{
      type: "line",
      smooth: true,
      data: communityHealth.trend.map((t) => t.score.toFixed(1)),
      lineStyle: { color: "#1E40AF", width: 2 },
      areaStyle: {
        color: {
          type: "linear", x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: "rgba(30, 64, 175, 0.3)" }, { offset: 1, color: "rgba(30, 64, 175, 0.05)" }],
        },
      },
      itemStyle: { color: "#1E40AF" },
    }],
  };

  const statCards = [
    { title: "业主总数", value: 1200, suffix: "户", icon: Users, trend: 2.5, color: "from-primary-500 to-primary-700" },
    { title: "在任委员", value: activeMembers.length, suffix: "人", icon: UserCheck, trend: 0, color: "from-trust-500 to-trust-700" },
    { title: "活跃工单", value: activeTickets.length, suffix: "个", icon: ClipboardList, trend: -12.3, color: "from-amber-500 to-orange-600" },
    { title: "本月结余", value: 43.3, prefix: "+", suffix: "万", icon: Wallet, trend: 8.7, color: "from-emerald-500 to-green-600" },
  ];

  const quickEntries = [
    { title: "民主议事", to: "/council/motions", icon: Vote, color: "bg-primary-100 text-primary-700" },
    { title: "财务透明", to: "/finance/overview", icon: HandCoins, color: "bg-emerald-100 text-emerald-700" },
    { title: "印章管控", to: "/seal/applications", icon: Stamp, color: "bg-amber-100 text-amber-700" },
    { title: "物业协同", to: "/property/tickets", icon: Building2, color: "bg-trust-100 text-trust-700" },
    { title: "邻里经济", to: "/economy/home", icon: Store, color: "bg-rose-100 text-rose-700" },
    { title: "后台管理", to: "/admin/owners", icon: Settings, color: "bg-slate-100 text-slate-700" },
  ];

  const recentActivities = [
    { time: "10:30", action: "业主15提交了电梯故障工单" },
    { time: "09:30", action: "李建国提交了用章申请" },
    { time: "09:00", action: "系统自动升级路灯工单至街道督办" },
    { time: "昨天", action: "业主1完成了下水道疏通工单评价" },
    { time: "昨天", action: "《更换物业公司议案》投票率达到71.3%" },
  ];

  const getPriorityBadge = (priority: string) => {
    const styles = { high: "bg-rose-100 text-rose-700 border-rose-200", medium: "bg-amber-100 text-amber-700 border-amber-200", low: "bg-slate-100 text-slate-600 border-slate-200" };
    const labels = { high: "高优", medium: "中优", low: "低优" };
    return <span className={cn("px-2 py-0.5 text-xs rounded border", styles[priority as keyof typeof styles])}>{labels[priority as keyof typeof labels]}</span>;
  };

  const getTodoIcon = (type: string) => {
    const icons: Record<string, React.ElementType> = { seal: Stamp, approval: FileText, vote: Vote, supervision: AlertTriangle, ticket: Wrench, verification: ShieldCheck };
    return icons[type] || ClipboardList;
  };

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-slate-50 to-primary-50">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-primary-800">工作台</h1>
        <p className="text-sm text-slate-500 mt-1">欢迎回来，今天是 {todayLabel}</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div key={idx} whileHover={{ y: -4 }} className="bg-white rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 border border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.title}</p>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold text-slate-800">{card.prefix}{card.value}</span>
                    <span className="text-sm text-slate-500">{card.suffix}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {card.trend > 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : card.trend < 0 ? <TrendingDown className="w-4 h-4 text-rose-500" /> : null}
                    <span className={cn("text-xs", card.trend > 0 ? "text-emerald-600" : card.trend < 0 ? "text-rose-600" : "text-slate-500")}>
                      {card.trend > 0 ? "+" : ""}{card.trend}%
                    </span>
                    <span className="text-xs text-slate-400">较上月</span>
                  </div>
                </div>
                <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center", card.color)}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-12 gap-6">
        <motion.div variants={item} className="col-span-5 bg-white rounded-xl p-5 shadow-card border border-slate-100">
          <h3 className="text-lg font-semibold text-primary-800 mb-4">健康度评估</h3>
          <div className="relative">
            <ReactECharts option={radarOption} style={{ height: "280px" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-3xl font-bold text-primary-700">{communityHealth.overallScore}</div>
              <div className="text-sm font-medium text-trust-600 bg-trust-50 px-2 py-0.5 rounded mt-1">良好</div>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-medium text-slate-600 mb-2">健康度趋势（近12个月）</h4>
            <ReactECharts option={lineOption} style={{ height: "120px" }} />
          </div>
        </motion.div>

        <motion.div variants={item} className="col-span-4 bg-white rounded-xl p-5 shadow-card border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary-800">待办事项</h3>
            <span className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">共 {todos.length} 条</span>
          </div>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {todos.slice(0, 6).map((todo, idx) => {
              const Icon = getTodoIcon(todo.type);
              const remaining = todo.deadline ? getTimeRemaining(todo.deadline) : null;
              return (
                <motion.div key={todo.id} whileHover={{ x: 4 }} className="flex gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-primary-100">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                      <Icon className="w-4 h-4" />
                    </div>
                    {idx < todos.length - 1 && <div className="absolute top-full left-1/2 w-px h-3 bg-slate-200 -translate-x-1/2" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 truncate">{todo.title}</span>
                      {getPriorityBadge(todo.priority)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">{todo.description}</p>
                    {remaining && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span className="text-xs text-amber-600">剩余 {remaining.days}天{remaining.hours}小时</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div variants={item} className="col-span-3 space-y-6">
          <div className="bg-white rounded-xl p-5 shadow-card border border-slate-100">
            <h3 className="text-lg font-semibold text-primary-800 mb-4">快捷入口</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickEntries.map((entry, idx) => {
                const Icon = entry.icon;
                return (
                  <motion.div key={idx} whileHover={{ y: -4 }}>
                  <Link to={entry.to} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-white hover:shadow-card cursor-pointer transition-all duration-300 border border-transparent hover:border-primary-200">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", entry.color)}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{entry.title}</span>
                  </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-card border border-slate-100">
            <h3 className="text-lg font-semibold text-primary-800 mb-4">最近动态</h3>
            <div className="space-y-3">
              {recentActivities.map((activity, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-primary-400 mt-2" />
                    {idx < recentActivities.length - 1 && <div className="absolute top-full left-1/2 w-px h-6 bg-slate-200 -translate-x-1/2" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{activity.action}</p>
                    <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
