import { Link } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import {
  Package, ListTodo, AlertTriangle, DollarSign, Printer,
  FilePlus2, MapPin, Users, ChevronRight, Megaphone,
  Check, Clock, TrendingUp, TrendingDown, ArrowRight,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { mockOrderStatusMap } from "@/mock";
import type { TaskPriority, Announcement } from "@/types";

const priorityStyles: Record<TaskPriority, { bar: string; tag: string; label: string }> = {
  high: { bar: "bg-alert-500", tag: "bg-alert-50 text-alert-600", label: "高优先级" },
  normal: { bar: "bg-ember-500", tag: "bg-ember-50 text-ember-600", label: "普通" },
  low: { bar: "bg-mint-500", tag: "bg-mint-50 text-mint-600", label: "低优先级" },
};

const announceTypeStyles: Record<Announcement["type"], { dot: string; text: string }> = {
  info: { dot: "bg-ink-500", text: "text-ink-600" },
  warning: { dot: "bg-ember-500", text: "text-ember-600" },
  success: { dot: "bg-mint-500", text: "text-mint-600" },
};

const quickEntries = [
  { to: "/print", label: "面单打印", icon: Printer, desc: "批量打单发货", color: "from-ember-500 to-ember-600" },
  { to: "/orders/create", label: "批量下单", icon: FilePlus2, desc: "快速录入运单", color: "from-mint-500 to-mint-600" },
  { to: "/tracking", label: "轨迹查询", icon: MapPin, desc: "实时物流追踪", color: "from-ink-500 to-ink-600" },
  { to: "/customers", label: "客户管理", icon: Users, desc: "客户绑定维护", color: "from-ink-600 to-ink-700" },
];

const statCards = [
  { key: "todayPickup", label: "今日揽收量", icon: Package, color: "bg-ember-500", deltaKey: "todayPickupDelta", unit: "件" },
  { key: "pendingTasks", label: "待办任务", icon: ListTodo, color: "bg-mint-500", unit: "项" },
  { key: "exceptions", label: "异常件数", icon: AlertTriangle, color: "bg-alert-500", unit: "件" },
  { key: "todayRevenue", label: "今日收入", icon: DollarSign, color: "bg-ink-600", deltaKey: "todayRevenueDelta", unit: "元", prefix: "¥" },
];

export default function Dashboard() {
  const summary = useAppStore((s) => s.summary);
  const tasks = useAppStore((s) => s.tasks);
  const orders = useAppStore((s) => s.orders);
  const announcements = useAppStore((s) => s.announcements);
  const metrics = useAppStore((s) => s.metrics);
  const completeTask = useAppStore((s) => s.completeTask);

  const chartData = metrics.slice(-7).map((m) => ({ date: m.date.slice(5), value: m.pickupCount }));

  const lineOption = {
    grid: { top: 20, right: 16, bottom: 24, left: 32 },
    tooltip: { trigger: "axis", backgroundColor: "rgba(15,22,33,0.92)", borderColor: "rgba(200,204,219,0.2)", textStyle: { color: "#E8EAF0", fontSize: 12 }, formatter: (p: Array<{ axisValue: string; value: number }>) => `${p[0].axisValue}<br/>揽收量：<b>${p[0].value} 件</b>` },
    xAxis: { type: "category", data: chartData.map((d) => d.date), axisLine: { lineStyle: { color: "#C8CCDB" } }, axisTick: { show: false }, axisLabel: { color: "#6B7390", fontSize: 11 } },
    yAxis: { type: "value", splitLine: { lineStyle: { color: "#E8EAF0", type: "dashed" } }, axisLabel: { color: "#6B7390", fontSize: 11 } },
    series: [{ type: "line", smooth: true, symbol: "circle", symbolSize: 6, data: chartData.map((d) => d.value), itemStyle: { color: "#FF6B35" }, lineStyle: { color: "#FF6B35", width: 2.5 }, areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(255,107,53,0.25)" }, { offset: 1, color: "rgba(255,107,53,0.02)" }] } } }],
  };

  return (
    <div className="space-y-6 animate-slideUp">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((sc) => {
          const Icon = sc.icon;
          const val = summary[sc.key as keyof typeof summary] as number;
          const delta = sc.deltaKey ? (summary[sc.deltaKey as keyof typeof summary] as number) : null;
          const isUp = delta !== null && delta >= 0;
          return (
            <div key={sc.key} className="group rounded-xl2 border border-ink-100 bg-white p-5 shadow-card transition hover:shadow-card-hover">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-medium text-ink-500">{sc.label}</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    {sc.prefix && <span className="text-lg font-semibold text-ink-500">{sc.prefix}</span>}
                    <span className="text-2xl font-bold text-ink-900 font-display">{typeof val === "number" ? val.toLocaleString() : val}</span>
                    <span className="text-xs text-ink-400">{sc.unit}</span>
                  </div>
                  {delta !== null && (
                    <div className={cn("mt-1.5 flex items-center gap-0.5 text-xs", isUp ? "text-mint-600" : "text-alert-500")}>
                      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {isUp ? "+" : ""}{delta}% 较昨日
                    </div>
                  )}
                </div>
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-white", sc.color)}><Icon className="h-5 w-5" /></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl2 border border-ink-100 bg-white shadow-card xl:col-span-2">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-ember-500" />
              <h3 className="text-sm font-semibold text-ink-800">待办任务队列</h3>
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-600">{tasks.length}</span>
            </div>
            <Link to="/tasks" className="flex items-center gap-0.5 text-xs text-ink-500 hover:text-ember-500">全部任务 <ChevronRight className="h-3 w-3" /></Link>
          </div>
          <div className="divide-y divide-ink-50">
            {tasks.slice(0, 5).map((t) => {
              const ps = priorityStyles[t.priority];
              const mins = Math.max(0, Math.floor((new Date(t.dueAt).getTime() - Date.now()) / 60000));
              return (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3 transition hover:bg-ink-50/60">
                  <div className={cn("h-10 w-1 rounded-full", ps.bar)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-ink-800">{t.title}</span>
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", ps.tag)}>{ps.label}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-ink-500">
                      <span className="truncate">{t.desc}</span>
                      <span className="flex items-center gap-0.5 flex-shrink-0"><Clock className="h-3 w-3" />{mins < 60 ? `${mins} 分钟后` : `${Math.floor(mins / 60)} 小时后`}</span>
                    </div>
                  </div>
                  <button onClick={() => completeTask(t.id)} className="flex h-7 w-7 items-center justify-center rounded-md border border-ink-200 text-ink-400 transition hover:border-mint-500 hover:bg-mint-50 hover:text-mint-500">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            {tasks.length === 0 && <div className="px-5 py-10 text-center text-sm text-ink-400">暂无待办任务 🎉</div>}
          </div>
        </div>

        <div className="rounded-xl2 border border-ink-100 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-mint-500" /><h3 className="text-sm font-semibold text-ink-800">实时公告</h3></div>
          </div>
          <div className="px-5 py-3 max-h-[340px] overflow-y-auto">
            {announcements.map((a) => {
              const ts = announceTypeStyles[a.type];
              return (
                <div key={a.id} className="border-b border-ink-50 py-3 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full", ts.dot)} />
                    <span className={cn("text-sm font-medium", ts.text)}>{a.title}</span>
                    <span className="ml-auto text-[11px] text-ink-400">{a.date}</span>
                  </div>
                  <p className="mt-1 pl-3.5 text-xs leading-relaxed text-ink-500">{a.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl2 border border-ink-100 bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><Package className="h-4 w-4 text-ember-500" /><h3 className="text-sm font-semibold text-ink-800">今日揽件量趋势</h3></div>
            <span className="text-xs text-ink-400">近 7 天</span>
          </div>
          <ReactECharts option={lineOption} style={{ height: 220 }} notMerge />
        </div>

        <div className="rounded-xl2 border border-ink-100 bg-white shadow-card xl:col-span-2">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <div className="flex items-center gap-2"><FilePlus2 className="h-4 w-4 text-ink-600" /><h3 className="text-sm font-semibold text-ink-800">最近订单</h3></div>
            <Link to="/orders" className="flex items-center gap-0.5 text-xs text-ember-500 hover:text-ember-600">查看全部 <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-ink-500">
                <th className="px-5 py-3 text-left font-medium">订单状态</th>
                <th className="px-5 py-3 text-left font-medium">快递公司</th>
                <th className="px-5 py-3 text-left font-medium">发件人</th>
                <th className="px-5 py-3 text-left font-medium">收件人</th>
                <th className="px-5 py-3 text-right font-medium">金额</th>
              </tr></thead>
              <tbody className="divide-y divide-ink-50">
                {orders.slice(0, 8).map((o) => {
                  const st = mockOrderStatusMap[o.status];
                  return (
                    <tr key={o.id} className="transition hover:bg-ink-50/50">
                      <td className="px-5 py-3"><span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", st.color)}>{st.label}</span></td>
                      <td className="px-5 py-3"><div className="font-medium text-ink-800">{o.expressCompany}</div><div className="text-xs text-ink-400 font-mono">{o.trackingNo}</div></td>
                      <td className="px-5 py-3"><div className="text-ink-700">{o.sender.name}</div><div className="truncate max-w-[160px] text-xs text-ink-400">{o.sender.address}</div></td>
                      <td className="px-5 py-3"><div className="text-ink-700">{o.receiver.name}</div><div className="truncate max-w-[160px] text-xs text-ink-400">{o.receiver.city} · {o.receiver.district}</div></td>
                      <td className="px-5 py-3 text-right font-semibold text-ink-800 font-display">¥{o.price.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-xl2 border border-ink-100 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-ember-500 to-mint-500 text-white"><ChevronRight className="h-3.5 w-3.5" /></div>
          <h3 className="text-sm font-semibold text-ink-800">快捷入口</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickEntries.map((q) => {
            const Icon = q.icon;
            return (
              <Link key={q.to} to={q.to} className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-ink-100 bg-ink-50/40 p-4 transition hover:border-ink-200 hover:bg-white hover:shadow-card">
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm", q.color)}><Icon className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink-800">{q.label}</div>
                  <div className="text-xs text-ink-500">{q.desc}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-ember-500" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
