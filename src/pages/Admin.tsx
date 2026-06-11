import { Users, ShoppingCart, Truck, AlertTriangle, Settings, UserPlus, FileText, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const KPI = [
  { label: "总用户数", value: "12,847", icon: Users, color: "#1B3A5C", bg: "bg-[#1B3A5C]/10" },
  { label: "今日订单", value: "386", icon: ShoppingCart, color: "#FF6B35", bg: "bg-[#FF6B35]/10" },
  { label: "配送中", value: "52", icon: Truck, color: "#2EC4B6", bg: "bg-[#2EC4B6]/10" },
  { label: "舆情告警", value: "7", icon: AlertTriangle, color: "#E63946", bg: "bg-[#E63946]/10" },
];

const TREND_DATA = [
  { month: "1月", 消费额: 42000 }, { month: "2月", 消费额: 38000 },
  { month: "3月", 消费额: 55000 }, { month: "4月", 消费额: 49000 },
  { month: "5月", 消费额: 63000 }, { month: "6月", 消费额: 71000 },
  { month: "7月", 消费额: 58000 }, { month: "8月", 消费额: 45000 },
  { month: "9月", 消费额: 67000 }, { month: "10月", 消费额: 73000 },
  { month: "11月", 消费额: 82000 }, { month: "12月", 消费额: 76000 },
];

const PIE_DATA = [
  { name: "餐饮", value: 45, color: "#FF6B35" },
  { name: "教材", value: 20, color: "#1B3A5C" },
  { name: "配送", value: 15, color: "#2EC4B6" },
  { name: "打印", value: 12, color: "#FFC857" },
  { name: "其他", value: 8, color: "#E63946" },
];

const ALERTS = [
  { id: 1, content: "食堂1号窗口卫生投诉增加", level: "高", time: "10分钟前" },
  { id: 2, content: "北区快递点排队过长反馈", level: "中", time: "30分钟前" },
  { id: 3, content: "二手交易纠纷：订单#2048", level: "低", time: "1小时前" },
  { id: 4, content: "图书馆占座系统异常", level: "高", time: "2小时前" },
  { id: 5, content: "东区宿舍热水供应投诉", level: "中", time: "3小时前" },
];

const LEVEL_COLORS: Record<string, string> = { "高": "text-[#E63946] bg-[#E63946]/10", "中": "text-[#FFC857] bg-[#FFC857]/10", "低": "text-[#2EC4B6] bg-[#2EC4B6]/10" };

const ACTIONS = [
  { label: "用户管理", icon: UserPlus, color: "bg-[#1B3A5C]" },
  { label: "系统设置", icon: Settings, color: "bg-[#FF6B35]" },
  { label: "数据报表", icon: FileText, color: "bg-[#2EC4B6]" },
  { label: "行为分析", icon: BarChart3, color: "bg-[#FFC857]" },
];

export default function Admin() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C] mb-6">管理控制台</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {KPI.map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{kpi.label}</span>
                <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon size={18} style={{ color: kpi.color }} />
                </div>
              </div>
              <div className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-[#1B3A5C] mb-4">消费趋势</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="消费额" stroke="#FF6B35" strokeWidth={2} dot={{ fill: "#FF6B35", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-[#1B3A5C] mb-4">订单分布</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {PIE_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {PIE_DATA.map((entry) => (
                <span key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-[#1B3A5C] mb-4">近期告警</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">内容</th>
                  <th className="text-center py-2 text-gray-500 font-medium w-20">级别</th>
                  <th className="text-right py-2 text-gray-500 font-medium w-24">时间</th>
                </tr>
              </thead>
              <tbody>
                {ALERTS.map((alert) => (
                  <tr key={alert.id} className="border-b border-gray-50">
                    <td className="py-2.5 text-gray-700">{alert.content}</td>
                    <td className="text-center py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full ${LEVEL_COLORS[alert.level]}`}>{alert.level}</span></td>
                    <td className="text-right py-2.5 text-gray-400 text-xs">{alert.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-[#1B3A5C] mb-4">快捷操作</h3>
            <div className="grid grid-cols-2 gap-3">
              {ACTIONS.map((action) => (
                <button key={action.label} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                    <action.icon size={18} className="text-white" />
                  </div>
                  <span className="text-xs text-gray-600">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
