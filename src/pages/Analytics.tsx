import { useState } from "react";
import { BarChart3, TrendingUp, Calendar } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
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

export default function Analytics() {
  const { metrics, templates, printJobs } = useAppStore();
  const [range, setRange] = useState<"7" | "30">("30");

  const displayData = metrics.slice(-parseInt(range));

  const suppliesData = Object.entries(
    metrics.slice(-parseInt(range)).reduce((acc, m) => {
      Object.entries(m.suppliesUsage).forEach(([k, v]) => {
        acc[k] = (acc[k] || 0) + v;
      });
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ["#FF6B35", "#22C55E", "#47506D", "#FF9C66", "#5FD694", "#9AA0B8"];

  const printStats = [
    { label: "总打印任务", value: printJobs.length },
    { label: "面单模板数", value: templates.length },
    {
      label: "成功率",
      value:
        printJobs.length > 0
          ? Math.round(
              (printJobs.reduce((acc, j) => acc + j.successCount, 0) /
                printJobs.reduce((acc, j) => acc + j.totalCount, 0)) *
                100
            ) + "%"
          : "0%",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-800">经营看板</h1>
          <p className="muted mt-1">数据驱动的网点运营分析</p>
        </div>
        <div className="flex items-center gap-2 bg-ink-50 rounded-xl p-1">
          {(["7", "30"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={
                range === r
                  ? "bg-white rounded-lg px-4 py-1.5 text-sm font-medium text-ink-800 shadow-sm"
                  : "px-4 py-1.5 text-sm text-ink-500 hover:text-ink-700"
              }
            >
              <Calendar size={14} className="inline mr-1" />
              {r}天
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {printStats.map((s) => (
          <div key={s.label} className="app-card p-5">
            <p className="text-sm text-ink-400">{s.label}</p>
            <p className="text-3xl font-bold text-ink-800 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="app-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-ember-500" />
            <h3 className="font-semibold text-ink-800">揽收量趋势</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9AA0B8" }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: "#9AA0B8" }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="pickupCount"
                  stroke="#FF6B35"
                  strokeWidth={2.5}
                  dot={{ fill: "#FF6B35", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="app-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-mint-500" />
            <h3 className="font-semibold text-ink-800">营收趋势</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9AA0B8" }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: "#9AA0B8" }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="app-card p-5">
        <h3 className="font-semibold text-ink-800 mb-4">各品牌面单使用量</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={suppliesData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {suppliesData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
