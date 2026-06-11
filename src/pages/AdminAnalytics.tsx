import { useState } from "react";
import { Calendar, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from "recharts";

const BREAKFAST_DATA = [
  { hour: "6:00", 就餐人次: 45 }, { hour: "6:30", 就餐人次: 120 },
  { hour: "7:00", 就餐人次: 380 }, { hour: "7:30", 就餐人次: 520 },
  { hour: "8:00", 就餐人次: 410 }, { hour: "8:30", 就餐人次: 230 },
  { hour: "9:00", 就餐人次: 85 }, { hour: "9:30", 就餐人次: 30 },
];

const TREND_DATA = [
  { month: "1月", 人均消费: 820, 订单数: 4200 }, { month: "2月", 人均消费: 760, 订单数: 3800 },
  { month: "3月", 人均消费: 890, 订单数: 5100 }, { month: "4月", 人均消费: 850, 订单数: 4800 },
  { month: "5月", 人均消费: 920, 订单数: 5300 }, { month: "6月", 人均消费: 780, 订单数: 3900 },
  { month: "7月", 人均消费: 650, 订单数: 2800 }, { month: "8月", 人均消费: 580, 订单数: 2200 },
  { month: "9月", 人均消费: 880, 订单数: 5000 }, { month: "10月", 人均消费: 910, 订单数: 5200 },
  { month: "11月", 人均消费: 940, 订单数: 5500 }, { month: "12月", 人均消费: 870, 订单数: 4900 },
];

const TIME_DIST = [
  { time: "6-8时", 占比: 15 }, { time: "8-10时", 占比: 8 },
  { time: "10-12时", 占比: 5 }, { time: "12-14时", 占比: 25 },
  { time: "14-16时", 占比: 6 }, { time: "16-18时", 占比: 4 },
  { time: "18-20时", 占比: 22 }, { time: "20-22时", 占比: 12 },
  { time: "22-24时", 占比: 3 },
];

const CATEGORY_DATA = [
  { name: "正餐", value: 42, color: "#FF6B35" }, { name: "零食", value: 22, color: "#FFC857" },
  { name: "饮品", value: 18, color: "#2EC4B6" }, { name: "水果", value: 10, color: "#1B3A5C" },
  { name: "其他", value: 8, color: "#E63946" },
];

const CAT_BAR = [
  { name: "正餐", 消费额: 42000 }, { name: "零食", 消费额: 22000 },
  { name: "饮品", 消费额: 18000 }, { name: "水果", 消费额: 10000 },
  { name: "日用品", 消费额: 8000 },
];

const DEPARTMENTS = ["全部院系", "信息学部", "理学部", "人文社科学部", "工学部"];
const TIME_PERIODS = ["近7天", "近30天", "近3个月", "近半年"];

const CONSUMPTION_DETAILS = [
  { date: "2025-06-03", user: "林小溪", dept: "信息学部", type: "正餐", amount: 15.50, orderNo: "ORD20250603001" },
  { date: "2025-06-03", user: "张明远", dept: "理学部", type: "饮品", amount: 8.00, orderNo: "ORD20250603002" },
  { date: "2025-06-03", user: "王思琪", dept: "人文社科学部", type: "零食", amount: 12.80, orderNo: "ORD20250603003" },
  { date: "2025-06-02", user: "陈雨涵", dept: "工学部", type: "正餐", amount: 18.00, orderNo: "ORD20250602004" },
  { date: "2025-06-02", user: "赵天宇", dept: "信息学部", type: "水果", amount: 6.50, orderNo: "ORD20250602005" },
  { date: "2025-06-02", user: "刘芳芳", dept: "理学部", type: "正餐", amount: 22.00, orderNo: "ORD20250602006" },
  { date: "2025-06-01", user: "孙浩然", dept: "工学部", type: "饮品", amount: 9.50, orderNo: "ORD20250601007" },
  { date: "2025-06-01", user: "周小倩", dept: "人文社科学部", type: "零食", amount: 14.30, orderNo: "ORD20250601008" },
];

function GaugeChart({ value, label }: { value: number; label: string }) {
  const r = 50;
  const circ = Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="70" viewBox="0 0 120 70">
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#2EC4B6" strokeWidth="10" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
        <text x="60" y="55" textAnchor="middle" className="text-xl font-bold" fill="#1B3A5C">{value}%</text>
      </svg>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
    </div>
  );
}

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState({ start: "2025-01-01", end: "2025-12-31" });
  const [department, setDepartment] = useState("全部院系");
  const [timePeriod, setTimePeriod] = useState("近30天");
  const deptLabel = department === "全部院系" ? "" : ` — ${department}`;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1B3A5C]">消费行为分析</h1>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
            <Calendar size={16} className="text-gray-400" />
            <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="text-sm border-none outline-none text-gray-600" />
            <span className="text-gray-400">~</span>
            <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="text-sm border-none outline-none text-gray-600" />
          </div>
        </div>
        <div className="flex items-center justify-between mb-6 bg-white rounded-xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">院系筛选</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]"
            >
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">时段</span>
            {TIME_PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setTimePeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  timePeriod === p ? "bg-[#FF6B35] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-[#1B3A5C] mb-4">早餐热力分布{deptLabel}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={BREAKFAST_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="就餐人次" fill="#FF6B35" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-[#1B3A5C] mb-4">零食复购率{deptLabel}</h3>
            <div className="flex items-center justify-around h-[220px]">
              <GaugeChart value={68} label="复购率" />
              <div className="space-y-3 text-sm">
                <div><span className="text-gray-500">复购用户: </span><span className="font-bold text-[#1B3A5C]">3,456</span></div>
                <div><span className="text-gray-500">新用户: </span><span className="font-bold text-[#FF6B35]">1,628</span></div>
                <div><span className="text-gray-500">流失率: </span><span className="font-bold text-[#E63946]">12.3%</span></div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-[#1B3A5C] mb-4">消费趋势{deptLabel}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="人均消费" stroke="#FF6B35" strokeWidth={2} dot={{ fill: "#FF6B35", r: 3 }} />
                <Line type="monotone" dataKey="订单数" stroke="#2EC4B6" strokeWidth={2} dot={{ fill: "#2EC4B6", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-[#1B3A5C] mb-4">时段分布{deptLabel}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={TIME_DIST}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="占比" stroke="#1B3A5C" fill="#1B3A5C" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-[#1B3A5C] mb-4">品类占比{deptLabel}</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={CATEGORY_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                    {CATEGORY_DATA.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {CATEGORY_DATA.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-gray-600">{entry.name}</span>
                    <span className="font-medium text-[#1B3A5C] ml-auto">{entry.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-[#1B3A5C] mb-4">品类消费额{deptLabel}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={CAT_BAR} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={50} />
                <Tooltip />
                <Bar dataKey="消费额" fill="#FFC857" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1B3A5C]">消费明细追溯{deptLabel}</h3>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3A5C] text-white text-sm font-medium hover:bg-[#2a4f7a] transition-colors">
              <Download size={14} />导出明细
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-gray-500 font-medium">日期</th>
                <th className="text-left py-2 text-gray-500 font-medium">用户</th>
                <th className="text-left py-2 text-gray-500 font-medium">院系</th>
                <th className="text-left py-2 text-gray-500 font-medium">消费类型</th>
                <th className="text-right py-2 text-gray-500 font-medium">金额</th>
                <th className="text-right py-2 text-gray-500 font-medium">订单号</th>
              </tr>
            </thead>
            <tbody>
              {CONSUMPTION_DETAILS.map((row) => (
                <tr key={row.orderNo} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 text-gray-600">{row.date}</td>
                  <td className="py-2.5 text-[#1B3A5C]">{row.user}</td>
                  <td className="py-2.5 text-gray-600">{row.dept}</td>
                  <td className="py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#FF6B35]/10 text-[#FF6B35]">{row.type}</span>
                  </td>
                  <td className="py-2.5 text-right font-medium text-[#1B3A5C]">¥{row.amount.toFixed(2)}</td>
                  <td className="py-2.5 text-right text-gray-400 font-mono text-xs">{row.orderNo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
