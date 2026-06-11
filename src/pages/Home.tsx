import { motion } from 'framer-motion';
import {
  Wallet,
  Car,
  TrendingUp,
  BadgePercent,
  ArrowRight,
  CreditCard,
  MapPin,
  Calculator,
  RefreshCw,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useStore } from '../store/useStore';
import dayjs from 'dayjs';

export default function Home() {
  const navigate = useNavigate();
  const { etcCard, vehicle, user, trafficRecords, monthlyTrafficData, rechargeBalance } = useStore();

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
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-dark-800">通行趋势</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-primary-500 rounded-full" />
                  通行次数
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-accent-500 rounded-full" />
                  消费金额
                </span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrafficData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#FF6B35"
                    strokeWidth={2}
                    fill="url(#colorAmount)"
                    name="消费金额"
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#0F52BA"
                    strokeWidth={2}
                    dot={{ fill: '#0F52BA', strokeWidth: 2 }}
                    name="通行次数"
                    yAxisId={0}
                  />
                </AreaChart>
              </ResponsiveContainer>
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
                  onClick={() => navigate(`/traffic/${record.id}`)}
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
