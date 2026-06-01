import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Film,
  Ticket,
  TrendingUp,
  DollarSign,
  Settings,
  Bell,
  Search,
  ChevronDown,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Menu,
  X,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import { mockData } from '../services/api';

const revenueData = [
  { date: '01/01', revenue: 12500, orders: 156 },
  { date: '01/02', revenue: 15800, orders: 189 },
  { date: '01/03', revenue: 18200, orders: 215 },
  { date: '01/04', revenue: 14600, orders: 178 },
  { date: '01/05', revenue: 21000, orders: 245 },
  { date: '01/06', revenue: 24500, orders: 289 },
  { date: '01/07', revenue: 22800, orders: 267 },
];

const topMovies = [
  { title: '流浪地球3', sales: 12580, percentage: 85 },
  { title: '疾速追杀5', sales: 10240, percentage: 72 },
  { title: '奥本海默', sales: 8960, percentage: 65 },
  { title: '沙丘2', sales: 7650, percentage: 58 },
  { title: '蜘蛛侠：平行宇宙2', sales: 6890, percentage: 52 },
];

const seatOccupancy = [
  { time: '10:00', rate: 45 },
  { time: '12:00', rate: 68 },
  { time: '14:00', rate: 82 },
  { time: '16:00', rate: 75 },
  { time: '18:00', rate: 88 },
  { time: '20:00', rate: 92 },
  { time: '22:00', rate: 78 },
];

const categoryData = [
  { name: '科幻', value: 35 },
  { name: '动作', value: 28 },
  { name: '剧情', value: 18 },
  { name: '喜剧', value: 12 },
  { name: '动画', value: 7 },
];

const COLORS = ['#DC2626', '#D97706', '#3B82F6', '#10B981', '#8B5CF6'];

const recentOrders = [
  { id: 'ORD202401001', user: '张三', movie: '流浪地球3', seats: '2张', amount: 196, time: '10:32', status: '已完成' },
  { id: 'ORD202401002', user: '李四', movie: '疾速追杀5', seats: '3张', amount: 264, time: '10:18', status: '已完成' },
  { id: 'ORD202401003', user: '王五', movie: '奥本海默', seats: '2张', amount: 176, time: '09:55', status: '处理中' },
  { id: 'ORD202401004', user: '赵六', movie: '沙丘2', seats: '4张', amount: 392, time: '09:42', status: '已完成' },
  { id: 'ORD202401005', user: '钱七', movie: '蜘蛛侠', seats: '2张', amount: 156, time: '09:28', status: '已退款' },
];

const menuItems = [
  { icon: LayoutDashboard, label: '数据概览', active: true },
  { icon: Film, label: '影片管理', active: false },
  { icon: Users, label: '用户管理', active: false },
  { icon: Ticket, label: '订单管理', active: false },
  { icon: BarChart3, label: '数据分析', active: false },
  { icon: Settings, label: '系统设置', active: false },
];

const statsCards = [
  { title: '今日用户', value: '1,284', change: '+12.5%', up: true, icon: Users, color: 'from-blue-500 to-blue-600' },
  { title: '今日订单', value: '326', change: '+8.2%', up: true, icon: Ticket, color: 'from-green-500 to-green-600' },
  { title: '今日票房', value: '¥58,420', change: '+15.3%', up: true, icon: DollarSign, color: 'from-yellow-500 to-yellow-600' },
  { title: '上座率', value: '78.5%', change: '-2.1%', up: false, icon: TrendingUp, color: 'from-red-500 to-red-600' },
];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-cinema-bg flex">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900/50 border-r border-slate-700/50 transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cinema-red to-red-700 flex items-center justify-center">
                <Film className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-bold text-lg">Admin</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5 text-slate-400" /> : <Menu className="w-5 h-5 text-slate-400" />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                item.active
                  ? 'bg-cinema-red text-white shadow-lg shadow-cinema-red/20'
                  : 'text-slate-400 hover:bg-slate-700/30 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-slate-900/30 border-b border-slate-700/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">数据概览</h1>
              <p className="text-slate-400 text-sm mt-1">欢迎回来，管理员</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cinema-red transition-colors w-64"
                />
              </div>

              <button className="relative p-2 hover:bg-slate-700/50 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-slate-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-cinema-red rounded-full"></span>
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-slate-700/50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cinema-gold to-yellow-600 flex items-center justify-center">
                  <span className="text-white font-semibold">管</span>
                </div>
                <div className="hidden md:block">
                  <p className="text-white text-sm font-medium">管理员</p>
                  <p className="text-slate-400 text-xs">admin@cinema.com</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((card, index) => (
              <div
                key={index}
                className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">{card.title}</p>
                    <p className="text-2xl font-bold text-white mt-2">{card.value}</p>
                    <div className={`flex items-center gap-1 mt-2 ${card.up ? 'text-green-400' : 'text-red-400'}`}>
                      {card.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      <span className="text-sm font-medium">{card.change}</span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">营收趋势</h3>
                  <p className="text-slate-400 text-sm">近7天票房数据</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-cinema-red text-white text-sm rounded-lg">周</button>
                  <button className="px-3 py-1.5 bg-slate-700/50 text-slate-400 text-sm rounded-lg hover:bg-slate-600/50 transition-colors">月</button>
                  <button className="px-3 py-1.5 bg-slate-700/50 text-slate-400 text-sm rounded-lg hover:bg-slate-600/50 transition-colors">年</button>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#DC2626" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                    <YAxis stroke="#94A3B8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #475569',
                        borderRadius: '12px',
                        color: '#F1F5F9',
                      }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#DC2626" strokeWidth={2} fill="url(#revenueGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white">类型分布</h3>
                <p className="text-slate-400 text-sm">本月票房类型占比</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #475569',
                        borderRadius: '12px',
                        color: '#F1F5F9',
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {categoryData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                    <span className="text-slate-300 text-sm">{item.name}</span>
                    <span className="text-slate-500 text-sm ml-auto">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white">时段上座率</h3>
                <p className="text-slate-400 text-sm">各场次平均上座率</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seatOccupancy}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="time" stroke="#94A3B8" fontSize={12} />
                    <YAxis stroke="#94A3B8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #475569',
                        borderRadius: '12px',
                        color: '#F1F5F9',
                      }}
                    />
                    <Bar dataKey="rate" fill="#D97706" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white">影片销量榜</h3>
                <p className="text-slate-400 text-sm">本周销量TOP5</p>
              </div>
              <div className="space-y-4">
                {topMovies.map((movie, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-slate-400 text-white' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{movie.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cinema-red to-red-500 rounded-full transition-all duration-1000"
                            style={{ width: `${movie.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-slate-400 text-xs w-10">{movie.percentage}%</span>
                      </div>
                    </div>
                    <span className="text-cinema-gold font-semibold text-sm">¥{movie.sales.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">最新订单</h3>
                  <p className="text-slate-400 text-sm">实时订单记录</p>
                </div>
                <button className="px-4 py-2 bg-slate-700/50 text-slate-300 text-sm rounded-lg hover:bg-slate-600/50 transition-colors">
                  查看全部
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="px-6 py-4 text-left text-slate-400 text-sm font-medium">订单号</th>
                    <th className="px-6 py-4 text-left text-slate-400 text-sm font-medium">用户</th>
                    <th className="px-6 py-4 text-left text-slate-400 text-sm font-medium">影片</th>
                    <th className="px-6 py-4 text-left text-slate-400 text-sm font-medium">座位</th>
                    <th className="px-6 py-4 text-left text-slate-400 text-sm font-medium">金额</th>
                    <th className="px-6 py-4 text-left text-slate-400 text-sm font-medium">时间</th>
                    <th className="px-6 py-4 text-left text-slate-400 text-sm font-medium">状态</th>
                    <th className="px-6 py-4 text-right text-slate-400 text-sm font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, index) => (
                    <tr key={index} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-cinema-red font-mono text-sm">{order.id}</span>
                      </td>
                      <td className="px-6 py-4 text-white text-sm">{order.user}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{order.movie}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{order.seats}</td>
                      <td className="px-6 py-4 text-cinema-gold font-semibold">¥{order.amount}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{order.time}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          order.status === '已完成' ? 'bg-green-500/20 text-green-400' :
                          order.status === '处理中' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-1.5 hover:bg-slate-600/50 rounded-lg transition-colors">
                            <Eye className="w-4 h-4 text-slate-400" />
                          </button>
                          <button className="p-1.5 hover:bg-slate-600/50 rounded-lg transition-colors">
                            <Edit className="w-4 h-4 text-slate-400" />
                          </button>
                          <button className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
