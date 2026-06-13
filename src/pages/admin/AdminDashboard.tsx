import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Car,
  CreditCard,
  AlertTriangle,
  Activity,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useStore } from '../../store/useStore';
import dayjs from 'dayjs';

export default function AdminDashboard() {
  const { dashboardStats, dailyTrafficData, exceptionEvents, settlementRecords } = useStore();

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    transactions: Math.floor(Math.random() * 5000) + 1000,
    amount: Math.floor(Math.random() * 500000) + 50000,
  }));

  const eventTypeData = [
    { name: '跟车干扰', value: exceptionEvents.filter((e) => e.eventType === '跟车干扰').length, color: '#FF6B35' },
    { name: '标签失效', value: exceptionEvents.filter((e) => e.eventType === '标签失效').length, color: '#EF4444' },
    { name: '交易失败', value: exceptionEvents.filter((e) => e.eventType === '交易失败').length, color: '#F59E0B' },
    { name: '路径异常', value: exceptionEvents.filter((e) => e.eventType === '路径异常').length, color: '#10B981' },
    { name: '其他', value: exceptionEvents.filter((e) => e.eventType === '其他').length, color: '#6B7280' },
  ];

  const stats = [
    {
      label: '今日交易笔数',
      value: dashboardStats.todayTransactions.toLocaleString(),
      unit: '笔',
      icon: TrendingUp,
      color: 'bg-primary-500',
      trend: '+12.5%',
      trendUp: true,
    },
    {
      label: '今日交易金额',
      value: `¥${(dashboardStats.todayAmount / 10000).toFixed(1)}万`,
      unit: '',
      icon: DollarSign,
      color: 'bg-emerald-500',
      trend: '+8.3%',
      trendUp: true,
    },
    {
      label: '今日通行车次',
      value: dashboardStats.todayVehicles.toLocaleString(),
      unit: '辆',
      icon: Car,
      color: 'bg-accent-500',
      trend: '+15.2%',
      trendUp: true,
    },
    {
      label: '活跃卡数',
      value: `${(dashboardStats.activeCards / 10000).toFixed(0)}万`,
      unit: '张',
      icon: CreditCard,
      color: 'bg-purple-500',
      trend: '+2.1%',
      trendUp: true,
    },
    {
      label: '异常事件',
      value: dashboardStats.abnormalEvents,
      unit: '起',
      icon: AlertTriangle,
      color: 'bg-red-500',
      trend: '-3.2%',
      trendUp: false,
    },
    {
      label: '系统健康度',
      value: dashboardStats.systemHealth,
      unit: '%',
      icon: Activity,
      color: 'bg-cyan-500',
      trend: '+0.1%',
      trendUp: true,
    },
  ];

  const recentExceptions = exceptionEvents.slice(0, 5);
  const recentSettlements = settlementRecords.slice(0, 5);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case '高':
        return 'bg-red-100 text-red-700';
      case '中':
        return 'bg-yellow-100 text-yellow-700';
      case '低':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已完成':
        return 'text-green-500';
      case '对账中':
        return 'text-yellow-500';
      case '有差异':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">运营数据概览</h1>
              <p className="text-dark-400">实时监控全省ETC运营情况</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-dark-400">
                最后更新: {dayjs().format('YYYY-MM-DD HH:mm:ss')}
              </span>
              <button className="p-2 rounded-lg bg-dark-800 text-white hover:bg-dark-700 transition-colors">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + idx * 0.05 }}
              className="card-dark p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <span
                  className={`text-xs font-medium ${stat.trendUp ? 'text-green-400' : 'text-red-400'}`}
                >
                  {stat.trend}
                </span>
              </div>
              <p className="text-2xl font-bold text-white font-mono">
                {stat.value}
                <span className="text-sm font-normal text-dark-400 ml-1">{stat.unit}</span>
              </p>
              <p className="text-sm text-dark-400 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="card-dark p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">24小时交易趋势</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F52BA" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0F52BA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="hour" stroke="#6B7280" fontSize={11} />
                  <YAxis stroke="#6B7280" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="transactions"
                    stroke="#0F52BA"
                    strokeWidth={2}
                    fill="url(#colorTransactions)"
                    name="交易笔数"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="card-dark p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">异常事件分布</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={eventTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {eventTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                  />
                  <Legend
                    formatter={(value) => <span className="text-dark-300">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2 card-dark p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">近7日通行趋势</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrafficData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                  />
                  <Bar dataKey="vehicles" fill="#0F52BA" name="通行车次" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revenue" fill="#FF6B35" name="收入(万元)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="card-dark p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">实时异常告警</h3>
            <div className="space-y-3">
              {recentExceptions.map((event) => (
                <div
                  key={event.id}
                  className="p-4 bg-dark-700 rounded-xl hover:bg-dark-600 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        className={`w-4 h-4 ${
                          event.severity === '高'
                            ? 'text-red-400'
                            : event.severity === '中'
                            ? 'text-yellow-400'
                            : 'text-green-400'
                        }`}
                      />
                      <span className="text-white font-medium text-sm">{event.eventType}</span>
                    </div>
                    <span className={`badge ${getSeverityColor(event.severity)}`}>
                      {event.severity}
                    </span>
                  </div>
                  <p className="text-dark-300 text-xs mb-2 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-dark-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {dayjs(event.createdAt).format('HH:mm')}
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        event.status === '待处理' ? 'text-yellow-400' : 'text-green-400'
                      }`}
                    >
                      {event.status === '待处理' ? (
                        <XCircle className="w-3 h-3" />
                      ) : (
                        <CheckCircle className="w-3 h-3" />
                      )}
                      {event.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="card-dark p-6 mt-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">最近清分记录</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-3 text-dark-400 font-medium">结算日期</th>
                  <th className="text-right py-3 text-dark-400 font-medium">交易笔数</th>
                  <th className="text-right py-3 text-dark-400 font-medium">总金额</th>
                  <th className="text-right py-3 text-dark-400 font-medium">省中心分成</th>
                  <th className="text-right py-3 text-dark-400 font-medium">商户分成</th>
                  <th className="text-center py-3 text-dark-400 font-medium">差异</th>
                  <th className="text-center py-3 text-dark-400 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {recentSettlements.map((record) => (
                  <tr key={record.id} className="border-b border-dark-700 hover:bg-dark-800">
                    <td className="py-3 text-white font-mono">{record.settleDate}</td>
                    <td className="py-3 text-right text-white font-mono">
                      {record.totalTransactions.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-white font-mono">
                      ¥{record.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-dark-300 font-mono">
                      ¥{record.centerAmount.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-dark-300 font-mono">
                      ¥{record.merchantAmount.toLocaleString()}
                    </td>
                    <td className="py-3 text-center font-mono">
                      {record.diffAmount > 0 ? (
                        <span className="text-red-400">¥{record.diffAmount}</span>
                      ) : (
                        <span className="text-green-400">-</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`font-medium ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
    </div>
  );
}
