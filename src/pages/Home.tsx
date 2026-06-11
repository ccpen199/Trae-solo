import { Link } from 'react-router-dom'
import {
  UtensilsCrossed, ShoppingBag, MessageCircle, Settings,
  TrendingUp, Clock, Bike, BookOpen, Briefcase, ArrowRight,
  Package, Star, Zap, BarChart3, Target, Flame,
} from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis,
  BarChart, Bar, CartesianGrid,
} from 'recharts'
import { useStore } from '@/store'

const trendData = [
  { day: '周一', amount: 45 }, { day: '周二', amount: 52 },
  { day: '周三', amount: 38 }, { day: '周四', amount: 67 },
  { day: '周五', amount: 58 }, { day: '周六', amount: 42 },
  { day: '周日', amount: 35 },
]

const breakfastHeatmap = [
  { hour: '6:00', count: 12 }, { hour: '6:30', count: 28 },
  { hour: '7:00', count: 65 }, { hour: '7:30', count: 142 },
  { hour: '8:00', count: 198 }, { hour: '8:30', count: 156 },
  { hour: '9:00', count: 87 }, { hour: '9:30', count: 34 },
  { hour: '10:00', count: 15 },
]

const repurchaseData = [
  { name: '薯片类', rate: 68 }, { name: '饮料类', rate: 72 },
  { name: '方便面', rate: 55 }, { name: '坚果类', rate: 43 },
  { name: '日用品', rate: 31 }, { name: '文具类', rate: 22 },
]

const quickEntries = [
  { icon: UtensilsCrossed, label: '食堂预订', path: '/dining', color: 'from-[#FF6B35] to-[#FF8F65]', shadow: 'shadow-[#FF6B35]/30' },
  { icon: ShoppingBag, label: '校园超市', path: '/store', color: 'from-[#1B3A5C] to-[#2D5A8E]', shadow: 'shadow-[#1B3A5C]/30' },
  { icon: MessageCircle, label: '动态圈', path: '/social', color: 'from-[#2EC4B6] to-[#5EDACE]', shadow: 'shadow-[#2EC4B6]/30' },
  { icon: Settings, label: '管理控制台', path: '/admin', color: 'from-[#FFC857] to-[#FFD97D]', shadow: 'shadow-[#FFC857]/30' },
]

const recentOrders = [
  { id: '1', stall: '麻辣香锅', time: '12:30', status: '配送中', statusColor: 'bg-[#FF6B35]/10 text-[#FF6B35]' },
  { id: '2', stall: '轻食沙拉', time: '昨天', status: '已完成', statusColor: 'bg-[#2EC4B6]/10 text-[#2EC4B6]' },
  { id: '3', stall: '校园超市', time: '昨天', status: '已完成', statusColor: 'bg-[#2EC4B6]/10 text-[#2EC4B6]' },
]

const hotItems = [
  { name: '黄焖鸡米饭', price: 16, rating: 4.8, tag: '人气王' },
  { name: '冰美式咖啡', price: 8, rating: 4.5, tag: '复购王' },
  { name: '薯片大礼包', price: 12, rating: 4.3, tag: '临期特价' },
]

export default function Home() {
  const user = useStore((s) => s.user)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B3A5C] via-[#1B3A5C]/95 to-[#FF6B35]/80 p-6 lg:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B35]/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#2EC4B6]/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={18} className="text-[#FFC857]" />
            <span className="text-xs font-medium text-[#FFC857]">校园生活，触手可及</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold mb-1">你好，{user.name}</h1>
          <p className="text-white/60 text-sm mb-5">
            {user.department} · {user.grade} · 余额 <span className="text-[#FFC857] font-semibold">¥{user.balance.toFixed(2)}</span>
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickEntries.map((entry) => (
              <Link key={entry.path} to={entry.path}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 ${entry.shadow} hover:shadow-lg`}>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${entry.color} flex items-center justify-center shadow-md`}>
                  <entry.icon size={20} className="text-white" />
                </div>
                <span className="text-sm font-medium">{entry.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-soft border border-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-[#FF6B35]" />
              <h3 className="font-semibold text-[#1B3A5C]">消费趋势</h3>
            </div>
            <span className="text-xs text-gray-400">近7天</span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                  formatter={(value: number) => [`¥${value}`, '消费']} />
                <Area type="monotone" dataKey="amount" stroke="#FF6B35" strokeWidth={2} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-[#1B3A5C]" />
              <h3 className="font-semibold text-[#1B3A5C]">最近订单</h3>
            </div>
            <Link to="/dining" className="text-xs text-[#FF6B35] hover:underline flex items-center gap-1">
              查看全部 <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-sm font-medium text-[#1B3A5C]">{order.stall}</div>
                  <div className="text-xs text-gray-400">{order.time}</div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${order.statusColor}`}>{order.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-50">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-[#FF6B35]" />
              <h3 className="font-semibold text-[#1B3A5C]">早餐下单热力</h3>
            </div>
            <Link to="/admin/analytics" className="text-xs text-[#FF6B35] hover:underline flex items-center gap-1">
              详情 <ArrowRight size={12} />
            </Link>
          </div>
          <p className="text-xs text-gray-400 mb-3">校方数据口径 · 各时段早餐订单量分布</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakfastHeatmap}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                  formatter={(value: number) => [`${value}单`, '订单量']} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#FF6B35" fillOpacity={0.86} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <span className="text-gray-400">峰值时段</span>
            <span className="px-2 py-0.5 rounded bg-[#FF6B35]/10 text-[#FF6B35] font-medium">7:30-8:30</span>
            <span className="text-gray-400">占比</span>
            <span className="font-semibold text-[#1B3A5C]">62.3%</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-50">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-[#2EC4B6]" />
              <h3 className="font-semibold text-[#1B3A5C]">零食复购率</h3>
            </div>
            <Link to="/admin/analytics" className="text-xs text-[#FF6B35] hover:underline flex items-center gap-1">
              详情 <ArrowRight size={12} />
            </Link>
          </div>
          <p className="text-xs text-gray-400 mb-3">校方数据口径 · 30天内同类商品二次购买比例</p>
          <div className="space-y-2.5">
            {repurchaseData.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="text-xs text-[#1B3A5C] w-14 shrink-0 text-right">{item.name}</span>
                <div className="flex-1 h-5 bg-gray-50 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.rate >= 60 ? 'bg-gradient-to-r from-[#2EC4B6] to-[#5EDACE]' :
                      item.rate >= 40 ? 'bg-gradient-to-r from-[#FFC857] to-[#FFD97D]' :
                      'bg-gradient-to-r from-[#9CA3AF] to-[#D1D5DB]'
                    }`}
                    style={{ width: `${item.rate}%` }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#1B3A5C]">{item.rate}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#2EC4B6]" />
              <span className="text-gray-400">高复购(≥60%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#FFC857]" />
              <span className="text-gray-400">中复购(40-60%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-gray-400">低复购(&lt;40%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <Bike size={18} className="text-[#2EC4B6]" />
            <h3 className="font-semibold text-[#1B3A5C]">西游侠在途</h3>
          </div>
          <div className="bg-gradient-to-r from-[#2EC4B6]/5 to-[#2EC4B6]/10 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2EC4B6] to-[#5EDACE] flex items-center justify-center shadow-md">
                <Bike size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[#1B3A5C]">骑手 李明 正在配送</div>
                <div className="text-xs text-gray-400 mt-1">预计 12:45 送达 · 桃李苑3号楼</div>
                <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-[#2EC4B6] to-[#5EDACE] rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <Star size={18} className="text-[#FFC857]" />
            <h3 className="font-semibold text-[#1B3A5C]">热门推荐</h3>
          </div>
          <div className="space-y-2.5">
            {hotItems.map((item) => (
              <div key={item.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFC857]/20 to-[#FF6B35]/20 flex items-center justify-center">
                  <Package size={18} className="text-[#FF6B35]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#1B3A5C]">{item.name}</div>
                  <div className="text-xs text-gray-400">评分 {item.rating}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[#FF6B35]">¥{item.price}</div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF6B35]/10 text-[#FF6B35] font-medium">{item.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={18} className="text-[#1B3A5C]" />
            <h3 className="font-semibold text-[#1B3A5C]">校方数据速览</h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-[#FF6B35]/5 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-[#FF6B35]">1,247</div>
              <div className="text-[10px] text-gray-400 mt-0.5">今日订单总量</div>
            </div>
            <div className="bg-[#2EC4B6]/5 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-[#2EC4B6]">52</div>
              <div className="text-[10px] text-gray-400 mt-0.5">当前配送中</div>
            </div>
            <div className="bg-[#1B3A5C]/5 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-[#1B3A5C]">62.3%</div>
              <div className="text-[10px] text-gray-400 mt-0.5">早餐集中时段占比</div>
            </div>
            <div className="bg-[#FFC857]/5 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-[#FFC857]">68%</div>
              <div className="text-[10px] text-gray-400 mt-0.5">零食复购率</div>
            </div>
          </div>
          <Link to="/admin/analytics" className="mt-3 flex items-center justify-center text-xs text-[#FF6B35] hover:underline gap-1">
            查看完整分析 <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Link to="/dining" className="group bg-white rounded-2xl p-4 shadow-soft border border-gray-50 hover:shadow-brand transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FF8F65] flex items-center justify-center">
              <UtensilsCrossed size={18} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1B3A5C]">食堂档口</div>
              <div className="text-xs text-gray-400">在线预订，配送到寝</div>
            </div>
          </div>
          <div className="flex items-center text-xs text-[#FF6B35] group-hover:gap-2 transition-all">
            立即点餐 <ArrowRight size={12} />
          </div>
        </Link>
        <Link to="/social/trade" className="group bg-white rounded-2xl p-4 shadow-soft border border-gray-50 hover:shadow-brand transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1B3A5C] to-[#2D5A8E] flex items-center justify-center">
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1B3A5C]">二手教材</div>
              <div className="text-xs text-gray-400">担保交易，安心购书</div>
            </div>
          </div>
          <div className="flex items-center text-xs text-[#1B3A5C] group-hover:gap-2 transition-all">
            去淘书 <ArrowRight size={12} />
          </div>
        </Link>
        <Link to="/social/intern" className="group bg-white rounded-2xl p-4 shadow-soft border border-gray-50 hover:shadow-brand transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2EC4B6] to-[#5EDACE] flex items-center justify-center">
              <Briefcase size={18} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1B3A5C]">实习推荐</div>
              <div className="text-xs text-gray-400">智能匹配，一键投递</div>
            </div>
          </div>
          <div className="flex items-center text-xs text-[#2EC4B6] group-hover:gap-2 transition-all">
            查看岗位 <ArrowRight size={12} />
          </div>
        </Link>
      </div>
    </div>
  )
}
