import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Shield,
  Database,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { dashboardStats, auditLogs } from '@/mock/data';

const kpiCards = [
  {
    label: '总办理量',
    value: '156,832',
    icon: BarChart3,
    gradient: 'from-blue-600 to-blue-400',
    trend: '+12.5%',
    up: true,
  },
  {
    label: '在线用户',
    value: '23,891',
    icon: Users,
    gradient: 'from-emerald-600 to-teal-400',
    trend: '+8.3%',
    up: true,
  },
  {
    label: '服务可用率',
    value: '99.7%',
    icon: TrendingUp,
    gradient: 'from-violet-600 to-purple-400',
    trend: '+0.2%',
    up: true,
  },
  {
    label: '平均处理时长',
    value: '3.2天',
    icon: Clock,
    gradient: 'from-amber-500 to-orange-400',
    trend: '-0.5天',
    up: false,
  },
];

const pieColors = ['#EF4444', '#1A56DB', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'];

export default function Dashboard() {
  const recentLogs = auditLogs.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="gov-stat-card relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.gradient} opacity-10 rounded-bl-full`} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gov-text-secondary">{card.label}</p>
                  <p className="text-3xl font-bold text-gov-text mt-1">{card.value}</p>
                </div>
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${card.gradient} text-white`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                {card.up ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-emerald-500" />
                )}
                <span className="text-sm font-medium text-emerald-500">{card.trend}</span>
                <span className="text-xs text-gov-text-secondary ml-1">较上月</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 gov-card p-6">
          <h3 className="gov-section-title mb-4">
            <ArrowUpRight className="w-5 h-5 text-gov-blue" />
            每日办理趋势
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dashboardStats.dailyTrend}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1A56DB" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1A56DB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#1A56DB"
                strokeWidth={2}
                fill="url(#areaGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="gov-card p-6">
          <h3 className="gov-section-title mb-4">
            <BarChart3 className="w-5 h-5 text-gov-blue" />
            服务域分布
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardStats.domainDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {dashboardStats.domainDistribution.map((_, index) => (
                  <Cell key={index} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value.toLocaleString()}`, '办理量']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {dashboardStats.domainDistribution.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: pieColors[index % pieColors.length] }}
                />
                <span className="text-gov-text-secondary truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="gov-card p-6">
        <h3 className="gov-section-title mb-4">最近活动</h3>
        <div className="space-y-3">
          {recentLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between py-2 border-b border-gov-border last:border-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    log.result === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-sm font-medium text-gov-text">{log.userName}</span>
                <span className="text-sm text-gov-text-secondary">{log.action}</span>
                <span className="text-sm text-gov-text-secondary">· {log.resource}</span>
              </div>
              <span className="text-xs text-gov-text-secondary">{log.timestamp.split(' ')[1]}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="gov-section-title mb-4">协同治理</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="gov-card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-600 to-blue-400 opacity-5 rounded-bl-full" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 text-white">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-gov-text">市公安局</h4>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-2xl font-bold text-gov-text">1,247</p>
                <p className="text-xs text-gov-text-secondary">身份核验数</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gov-text">583</p>
                <p className="text-xs text-gov-text-secondary">证照发放数</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gov-text">156</p>
                <p className="text-xs text-gov-text-secondary">跨部门协同数</p>
              </div>
            </div>
            <Link
              to="/admin/police"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gov-blue hover:text-gov-blue-light transition-colors"
            >
              进入管理
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="gov-card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-600 to-teal-400 opacity-5 rounded-bl-full" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-400 text-white">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-gov-text">市数据局</h4>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-2xl font-bold text-gov-text">2.8M</p>
                <p className="text-xs text-gov-text-secondary">数据共享量</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gov-text">47</p>
                <p className="text-xs text-gov-text-secondary">系统集成数</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gov-text">99.2%</p>
                <p className="text-xs text-gov-text-secondary">证照同步率</p>
              </div>
            </div>
            <Link
              to="/admin/data-bureau"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gov-blue hover:text-gov-blue-light transition-colors"
            >
              进入管理
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
