import { useState } from 'react';
import {
  ShoppingBag,
  CheckCircle,
  DollarSign,
  Bike,
  UserPlus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Ticket,
  Activity,
  Bell,
} from 'lucide-react';
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
} from 'recharts';
import Card from '../../components/ui/Card';
import Tag from '../../components/ui/Tag';

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
  color: string;
}

interface AlertItem {
  id: string;
  type: 'anomaly' | 'ticket' | 'capacity';
  title: string;
  description: string;
  time: string;
  level: 'high' | 'medium' | 'low';
}

const orderTrendData = [
  { date: '06-11', orders: 12580, completed: 12050 },
  { date: '06-12', orders: 13420, completed: 12980 },
  { date: '06-13', orders: 14150, completed: 13620 },
  { date: '06-14', orders: 15280, completed: 14750 },
  { date: '06-15', orders: 16890, completed: 16240 },
  { date: '06-16', orders: 18560, completed: 17890 },
  { date: '06-17', orders: 17230, completed: 16680 },
];

const revenueData = [
  { date: '06-11', revenue: 385000 },
  { date: '06-12', revenue: 412000 },
  { date: '06-13', revenue: 435000 },
  { date: '06-14', revenue: 468000 },
  { date: '06-15', revenue: 512000 },
  { date: '06-16', revenue: 568000 },
  { date: '06-17', revenue: 524000 },
];

const categoryData = [
  { name: '帮我买', value: 42, color: '#1E88E5' },
  { name: '帮我送', value: 30, color: '#4CAF50' },
  { name: '帮我取', value: 18, color: '#FFC107' },
  { name: '跑腿代办', value: 10, color: '#9C27B0' },
];

const alerts: AlertItem[] = [
  { id: '1', type: 'anomaly', title: '异常订单激增', description: '朝阳区超时订单同比增长23%', time: '2分钟前', level: 'high' },
  { id: '2', type: 'ticket', title: '申诉待处理', description: '有12笔申诉超过SLA处理时效', time: '5分钟前', level: 'high' },
  { id: '3', type: 'capacity', title: '低运力预警', description: '海淀区晚高峰运力缺口约85人', time: '15分钟前', level: 'medium' },
  { id: '4', type: 'anomaly', title: '虚假配送', description: '检测到3笔疑似虚假配送订单', time: '28分钟前', level: 'medium' },
  { id: '5', type: 'ticket', title: '用户投诉', description: '今日新增8笔骑手服务投诉', time: '45分钟前', level: 'low' },
];

function KpiCard({ title, value, icon, trend, trendValue, color }: KpiCardProps) {
  return (
    <div className="bg-admin-800/50 backdrop-blur rounded-2xl p-5 border border-admin-700/50">
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm text-gray-400">{title}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
        {trend && trendValue && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${
            trend === 'up' ? 'text-green-400' : 'text-red-400'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [selectedCity] = useState('北京市');

  const alertLevelColor = {
    high: 'bg-red-500/10 text-red-400 border-red-500/30',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  };

  const alertLevelLabel = {
    high: '紧急',
    medium: '重要',
    low: '一般',
  };

  const alertIcon = {
    anomaly: <AlertTriangle className="w-4 h-4" />,
    ticket: <Ticket className="w-4 h-4" />,
    capacity: <Activity className="w-4 h-4" />,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">城市运营看板</h1>
          <p className="text-gray-400 text-sm mt-1">当前城市：{selectedCity} · 实时数据更新中</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="bg-admin-800 text-white border border-admin-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option>北京市</option>
            <option>上海市</option>
            <option>广州市</option>
            <option>深圳市</option>
          </select>
          <button className="relative p-2.5 bg-admin-800 border border-admin-700 rounded-xl text-gray-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <KpiCard
          title="今日订单量"
          value="17,230"
          icon={<ShoppingBag className="w-5 h-5 text-blue-400" />}
          trend="up"
          trendValue="8.5%"
          color="bg-blue-500/15"
        />
        <KpiCard
          title="订单完成率"
          value="96.8%"
          icon={<CheckCircle className="w-5 h-5 text-green-400" />}
          trend="up"
          trendValue="0.3%"
          color="bg-green-500/15"
        />
        <KpiCard
          title="今日营收"
          value="¥52.4万"
          icon={<DollarSign className="w-5 h-5 text-amber-400" />}
          trend="up"
          trendValue="12.1%"
          color="bg-amber-500/15"
        />
        <KpiCard
          title="活跃骑手"
          value="2,847"
          icon={<Bike className="w-5 h-5 text-cyan-400" />}
          trend="down"
          trendValue="2.3%"
          color="bg-cyan-500/15"
        />
        <KpiCard
          title="新增用户"
          value="1,256"
          icon={<UserPlus className="w-5 h-5 text-purple-400" />}
          trend="up"
          trendValue="15.8%"
          color="bg-purple-500/15"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="bg-admin-800/50 border-admin-700/50 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">7日订单趋势</h3>
            <Tag color="blue" className="bg-blue-500/15 text-blue-400 border-blue-500/30">本周</Tag>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={orderTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
                <Line type="monotone" dataKey="orders" stroke="#1E88E5" strokeWidth={2.5} dot={{ fill: '#1E88E5', r: 4 }} name="订单量" />
                <Line type="monotone" dataKey="completed" stroke="#4CAF50" strokeWidth={2.5} dot={{ fill: '#4CAF50', r: 4 }} name="完成量" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-admin-800/50 border-admin-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">订单品类占比</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: number) => [`${value}%`, '占比']}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="bg-admin-800/50 border-admin-700/50 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">7日营收趋势</h3>
            <span className="text-sm text-gray-400">单位：元</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: number) => [`¥${value.toLocaleString()}`, '营收']}
                />
                <Bar dataKey="revenue" fill="#1E88E5" radius={[6, 6, 0, 0]} name="营收" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-admin-800/50 border-admin-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">实时告警</h3>
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{alerts.length}</span>
            </div>
            <button className="text-sm text-brand-400 hover:text-brand-300">全部</button>
          </div>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border ${alertLevelColor[alert.level]}`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">{alertIcon[alert.type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm text-white truncate">{alert.title}</span>
                      <span className="text-xs flex-shrink-0">{alertLevelLabel[alert.level]}</span>
                    </div>
                    <p className="text-xs mt-0.5 opacity-80">{alert.description}</p>
                    <p className="text-xs mt-1 opacity-60">{alert.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
