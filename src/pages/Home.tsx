import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  Car,
  TrendingUp,
  TrendingDown,
  BadgePercent,
  ArrowRight,
  CreditCard,
  MapPin,
  Calculator,
  RefreshCw,
  Bell,
  ChevronRight,
  BarChart3,
  Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
  ComposedChart,
  Bar,
} from 'recharts';
import { useStore } from '../store/useStore';
import dayjs from 'dayjs';

export default function Home() {
  const navigate = useNavigate();
  const { etcCard, vehicle, user, trafficRecords, monthlyTrafficData, rechargeBalance } = useStore();
  const [chartType, setChartType] = useState<'trend' | 'comparison'>('trend');

  const quickActions = [
    { label: '立即充值', icon: CreditCard, color: 'from-primary-500 to-primary-600', path: '/recharge' },
    { label: '路费查询', icon: Calculator, color: 'from-accent-500 to-accent-600', path: '/toll-calculator' },
    { label: '附近网点', icon: MapPin, color: 'from-emerald-500 to-emerald-600', path: '/outlets' },
  ];

  const recentRecords = trafficRecords.slice(0, 3);
  const totalSpent = trafficRecords.reduce((sum, r) => sum + r.actualFee, 0);
  const totalSaved = trafficRecords.reduce((sum, r) => sum + r.discountFee, 0);
  const totalDistance = trafficRecords.reduce((sum, r) => sum + r.distance, 0);

  const stats = [
    { label: '本月通行', value: `${trafficRecords.length}`, unit: '次', icon: Car, color: 'bg-primary-500' },
    { label: '累计里程', value: `${totalDistance.toFixed(0)}`, unit: 'km', icon: TrendingUp, color: 'bg-emerald-500' },
    { label: '累计消费', value: `¥${totalSpent.toFixed(2)}`, unit: '', icon: Wallet, color: 'bg-accent-500' },
    { label: '累计优惠', value: `¥${totalSaved.toFixed(2)}`, unit: '', icon: BadgePercent, color: 'bg-purple-500' },
  ];

  const handleQuickRecharge = (amount: number) => {
    rechargeBalance(amount);
  };

  const avgMonthlyAmount = monthlyTrafficData.length > 0
    ? monthlyTrafficData.reduce((sum, d) => sum + d.amount, 0) / monthlyTrafficData.length
    : 0;
  const avgMonthlyCount = monthlyTrafficData.length > 0
    ? monthlyTrafficData.reduce((sum, d) => sum + d.count, 0) / monthlyTrafficData.length
    : 0;
  const latestMonth = monthlyTrafficData[monthlyTrafficData.length - 1];
  const prevMonth = monthlyTrafficData[monthlyTrafficData.length - 2];
  const amountMoM = prevMonth && prevMonth.amount > 0
    ? ((latestMonth?.amount || 0) - prevMonth.amount) / prevMonth.amount * 100
    : 0;
  const countMoM = prevMonth && prevMonth.count > 0
    ? ((latestMonth?.count || 0) - prevMonth.count) / prevMonth.count * 100
    : 0;

  return (
    <div className="min-h-screen bg-dark-100 py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
        >
          <div className="lg:col-span-2 bg-gradient-hero rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-white/70 text-sm mb-1">欢迎回来，{user.name}</p>
                  <h1 className="text-2xl font-bold">粤通卡服务中心</h1>
                </div>
                {etcCard.balance < 100 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-accent-500/20 rounded-lg animate-pulse-slow">
                    <Bell className="w-4 h-4 text-accent-300" />
                    <span className="text-sm text-accent-200">余额不足，请及时充值</span>
                  </div>
                )}
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-white/80" />
                    <div>
                      <p className="text-white/70 text-sm">{etcCard.type}</p>
                      <p className="text-white/60 text-xs">{etcCard.cardNo}</p>
                    </div>
                  </div>
                  <span className={`badge ${etcCard.status === '正常' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
                    {etcCard.status}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-white/60 text-sm mb-1">账户余额</p>
                    <p className="text-4xl font-bold font-mono animate-number">
                      ¥{etcCard.balance.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/60">{vehicle.plateNo}</span>
                    <span className="text-xs text-white/60">|</span>
                    <span className="text-xs text-white/60">有效期至 {etcCard.expiryDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {[100, 200, 500].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickRecharge(amount)}
                    className="flex-1 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    充 ¥{amount}
                  </button>
                ))}
                <button
                  onClick={() => navigate('/recharge')}
                  className="px-6 py-3 bg-white text-primary-600 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
                >
                  更多
                </button>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-dark-800 mb-4">快捷服务</h3>
            <div className="space-y-3">
              {quickActions.map((action, idx) => (
                <motion.button
                  key={action.label}
                  whileHover={{ x: 4 }}
                  onClick={() => navigate(action.path)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-dark-50 hover:bg-dark-100 transition-all duration-300 group"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-dark-800">{action.label}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-dark-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-300" />
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + idx * 0.05 }}
              className="stat-card"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <RefreshCw className="w-4 h-4 text-dark-400" />
              </div>
              <p className="text-2xl font-bold text-dark-800 font-mono animate-number">
                {stat.value}
                <span className="text-sm font-normal text-dark-500 ml-1">{stat.unit}</span>
              </p>
              <p className="text-sm text-dark-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 card p-6"
        >
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-semibold text-dark-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-500" />
                通行趋势
              </h3>
              <p className="text-xs text-dark-400 mt-0.5">
                数据统计：{monthlyTrafficData.length} 个月运营数据 · 自动更新
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-dark-100 rounded-lg p-0.5">
                <button
                  onClick={() => setChartType('trend')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    chartType === 'trend'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-dark-500 hover:text-dark-700'
                  }`}
                >
                  趋势图
                </button>
                <button
                  onClick={() => setChartType('comparison')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    chartType === 'comparison'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-dark-500 hover:text-dark-700'
                  }`}
                >
                  对比图
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="p-3 bg-dark-50 rounded-xl">
              <p className="text-xs text-dark-500">月均消费</p>
              <p className="text-lg font-bold font-mono text-accent-600">¥{avgMonthlyAmount.toFixed(0)}</p>
              <p className={`text-xs mt-0.5 flex items-center gap-0.5 ${amountMoM >= 0 ? 'text-success' : 'text-danger'}`}>
                {amountMoM >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(amountMoM).toFixed(1)}% 环比
              </p>
            </div>
            <div className="p-3 bg-dark-50 rounded-xl">
              <p className="text-xs text-dark-500">月均通行</p>
              <p className="text-lg font-bold font-mono text-primary-600">{Math.round(avgMonthlyCount)} 次</p>
              <p className={`text-xs mt-0.5 flex items-center gap-0.5 ${countMoM >= 0 ? 'text-success' : 'text-danger'}`}>
                {countMoM >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(countMoM).toFixed(1)}% 环比
              </p>
            </div>
            <div className="p-3 bg-dark-50 rounded-xl">
              <p className="text-xs text-dark-500">累计消费</p>
              <p className="text-lg font-bold font-mono text-dark-800">
                ¥{monthlyTrafficData.reduce((s, d) => s + d.amount, 0).toFixed(0)}
              </p>
              <p className="text-xs mt-0.5 text-dark-400">
                {monthlyTrafficData.length} 个月
              </p>
            </div>
            <div className="p-3 bg-dark-50 rounded-xl">
              <p className="text-xs text-dark-500">累计通行</p>
              <p className="text-lg font-bold font-mono text-dark-800">
                {monthlyTrafficData.reduce((s, d) => s + d.count, 0)} 次
              </p>
              <p className="text-xs mt-0.5 text-dark-400">
                日均 {Math.round(monthlyTrafficData.reduce((s, d) => s + d.count, 0) / (monthlyTrafficData.length * 30))} 次
              </p>
            </div>
          </div>

          <div className="h-72 min-h-[288px] w-full min-w-0 relative" style={{ position: 'relative', width: '100%', height: 288 }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'trend' ? (
                <AreaChart data={monthlyTrafficData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F52BA" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0F52BA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#9CA3AF"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#FF6B35"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `¥${value}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#0F52BA"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}次`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      padding: '10px 14px',
                    }}
                    labelStyle={{
                      fontWeight: 600,
                      color: '#1F2937',
                      marginBottom: 6,
                      fontSize: 13,
                    }}
                    itemStyle={{ fontSize: 12, padding: 2 }}
                    formatter={(value, name) => [
                      name === '消费金额' ? `¥${Number(value).toFixed(2)}` : `${value} 次`,
                      name
                    ]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="amount"
                    stroke="#FF6B35"
                    strokeWidth={2.5}
                    fill="url(#colorAmount)"
                    name="消费金额"
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="count"
                    stroke="#0F52BA"
                    strokeWidth={2}
                    fill="url(#colorCount)"
                    name="通行次数"
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              ) : (
                <ComposedChart data={monthlyTrafficData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF6B35" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#FF6B35" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#9CA3AF"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#FF6B35"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `¥${value}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#0F52BA"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}次`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      padding: '10px 14px',
                    }}
                    labelStyle={{
                      fontWeight: 600,
                      color: '#1F2937',
                      marginBottom: 6,
                      fontSize: 13,
                    }}
                    itemStyle={{ fontSize: 12, padding: 2 }}
                    formatter={(value, name) => [
                      name === '消费金额' ? `¥${Number(value).toFixed(2)}` : `${value} 次`,
                      name
                    ]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="amount"
                    fill="url(#barAmount)"
                    radius={[4, 4, 0, 0]}
                    name="消费金额"
                    barSize={28}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="count"
                    stroke="#0F52BA"
                    strokeWidth={2.5}
                    dot={{ fill: '#fff', stroke: '#0F52BA', strokeWidth: 2, r: 4 }}
                    name="通行次数"
                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-dark-100 flex items-center justify-between text-xs text-dark-400">
            <div className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-success" />
              <span>数据正常</span>
            </div>
            <span>数据更新时间：{dayjs().format('YYYY-MM-DD HH:mm')}</span>
          </div>
        </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-800">最近通行</h3>
              <button
                onClick={() => navigate('/traffic')}
                className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
              >
                查看全部
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {recentRecords.map((record) => (
                <div
                  key={record.id}
                  className="p-4 bg-dark-50 rounded-xl hover:bg-dark-100 transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate('/traffic')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Car className="w-5 h-5 text-primary-500" />
                      </div>
                      <div>
                        <p className="font-medium text-dark-800 text-sm">
                          {record.entryStation} → {record.exitStation}
                        </p>
                        <p className="text-xs text-dark-500">
                          {dayjs(record.exitTime).format('MM-DD HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-dark-800 font-mono">¥{record.actualFee.toFixed(2)}</p>
                      <p className="text-xs text-success">已优惠 ¥{record.discountFee.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`badge ${
                      record.status === '已完成' ? 'badge-success' :
                      record.status === '异常' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {record.status}
                    </span>
                    <span className="text-xs text-dark-400">{record.discountType}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
