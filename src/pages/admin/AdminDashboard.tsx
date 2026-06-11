import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  Timer,
  FileText,
  Server,
  Wifi,
  Database,
  Cpu,
  HardDrive,
  AlertCircle,
  Minus,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import { mockSupervisionOrders, mockSupervisionStats } from '@/mock/data';
import { formatDate, getStatusColor } from '@/utils/format';
import type { SupervisionOrder } from '@/types';

const COLORS = ['#165DFF', '#0FC6C2', '#FF7D00', '#00B42A', '#722ED1', '#F53F3F'];

const AdminDashboard: React.FC = () => {
  const todayNewCount = mockSupervisionStats.trend[mockSupervisionStats.trend.length - 1]?.newCount || 0;

  const warningOrders = useMemo(() => {
    return mockSupervisionOrders
      .filter((o) => o.status === 'warning' || o.status === 'overdue')
      .sort((a, b) => {
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (a.status !== 'overdue' && b.status === 'overdue') return 1;
        return a.remainingDays - b.remainingDays;
      })
      .slice(0, 6);
  }, []);

  const slaByType = useMemo(() => {
    const typeMap: Record<string, { total: number; onTime: number }> = {};
    mockSupervisionOrders.forEach((order) => {
      if (!typeMap[order.businessType]) {
        typeMap[order.businessType] = { total: 0, onTime: 0 };
      }
      typeMap[order.businessType].total++;
      if (order.status !== 'overdue') {
        typeMap[order.businessType].onTime++;
      }
    });
    return Object.entries(typeMap)
      .map(([type, data]) => ({
        type,
        rate: Math.round((data.onTime / data.total) * 100),
        total: data.total,
      }))
      .sort((a, b) => b.rate - a.rate);
  }, []);

  const todayMessages = [
    { id: 1, type: 'success', title: '社保转移业务 YW202506105 已办结', time: '10分钟前', icon: CheckCircle },
    { id: 2, type: 'warning', title: '医保报销业务 YW202506108 即将超时', time: '25分钟前', icon: AlertTriangle },
    { id: 3, type: 'info', title: '新受理失业金申领业务 3 件', time: '1小时前', icon: FileText },
    { id: 4, type: 'danger', title: '工伤认定业务 YW202506102 已超时', time: '2小时前', icon: AlertCircle },
    { id: 5, type: 'success', title: '生育津贴业务 YW202506098 已办结', time: '3小时前', icon: CheckCircle },
  ];

  const systemStatus = [
    { name: '应用服务器', status: 'normal', value: '99.9%', icon: Server },
    { name: '数据库服务', status: 'normal', value: '正常', icon: Database },
    { name: '网络连通', status: 'normal', value: '100%', icon: Wifi },
    { name: 'CPU使用率', status: 'warning', value: '72%', icon: Cpu },
    { name: '内存使用', status: 'normal', value: '58%', icon: HardDrive },
  ];

  const statCards = [
    {
      title: '今日新增',
      value: todayNewCount,
      unit: '件',
      icon: FileText,
      trend: 12.5,
      trendLabel: '同比',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-500',
    },
    {
      title: '待办事项',
      value: mockSupervisionStats.normalCount,
      unit: '件',
      icon: Clock,
      trend: 5.2,
      trendLabel: '同比',
      color: 'from-violet-500 to-violet-600',
      bgColor: 'bg-violet-500/10',
      textColor: 'text-violet-500',
    },
    {
      title: '预警中',
      value: mockSupervisionStats.warningCount,
      unit: '件',
      icon: AlertTriangle,
      trend: -8.3,
      trendLabel: '同比',
      color: 'from-warning-500 to-warning-600',
      bgColor: 'bg-warning-500/10',
      textColor: 'text-warning-500',
    },
    {
      title: '已超时',
      value: mockSupervisionStats.overdueCount,
      unit: '件',
      icon: AlertCircle,
      trend: -15.6,
      trendLabel: '同比',
      color: 'from-danger-500 to-danger-600',
      bgColor: 'bg-danger-500/10',
      textColor: 'text-danger-500',
    },
    {
      title: '已办结',
      value: mockSupervisionStats.completedCount,
      unit: '件',
      icon: CheckCircle,
      trend: 22.1,
      trendLabel: '同比',
      color: 'from-success-500 to-success-600',
      bgColor: 'bg-success-500/10',
      textColor: 'text-success-500',
    },
    {
      title: '平均办理时长',
      value: mockSupervisionStats.avgHandlingDays,
      unit: '天',
      icon: Timer,
      trend: -3.2,
      trendLabel: '同比',
      color: 'from-secondary-500 to-secondary-600',
      bgColor: 'bg-secondary-500/10',
      textColor: 'text-secondary-500',
    },
  ];

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-3 h-3" />;
    if (trend < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = (trend: number, isGood: boolean) => {
    if (trend === 0) return 'text-neutral-400';
    if (isGood) {
      return trend > 0 ? 'text-success-500' : 'text-danger-500';
    }
    return trend > 0 ? 'text-danger-500' : 'text-success-500';
  };

  const renderOrderRow = (order: SupervisionOrder) => {
    const isOverdue = order.status === 'overdue';
    const statusColor = getStatusColor(order.status);

    return (
      <div
        key={order.id}
        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
          isOverdue ? 'bg-danger-50 hover:bg-danger-100/50' : 'bg-warning-50 hover:bg-warning-100/50'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isOverdue ? 'bg-danger-500/20 text-danger-500' : 'bg-warning-500/20 text-warning-500'
          }`}
        >
          {isOverdue ? <AlertCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-neutral-600 truncate">{order.businessType}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              statusColor === 'danger' ? 'bg-danger-500/20 text-danger-500' :
              statusColor === 'warning' ? 'bg-warning-500/20 text-warning-500' :
              'bg-neutral-100 text-neutral-500'
            }`}>
              {isOverdue ? '红警' : '橙警'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 truncate">{order.businessNo}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`text-sm font-semibold ${isOverdue ? 'text-danger-500' : 'text-warning-500'}`}>
            {isOverdue ? `超时 ${Math.abs(order.remainingDays)} 天` : `剩余 ${order.remainingDays} 天`}
          </p>
          <p className="text-xs text-neutral-400">{order.currentNode}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, index) => (
          <div
            key={card.title}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <Card hover className="relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-20 h-20 ${card.bgColor} rounded-bl-full -translate-y-6 translate-x-6`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-md`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs ${getTrendColor(card.trend, card.title === '已办结' || card.title === '今日新增')}`}>
                    {getTrendIcon(card.trend)}
                    <span>{Math.abs(card.trend)}%</span>
                  </div>
                </div>
                <p className="text-sm text-neutral-400 mb-1">{card.title}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-neutral-600">{card.value}</span>
                  <span className="text-xs text-neutral-400">{card.unit}</span>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-neutral-600">近7日业务量趋势</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-primary-500 rounded-full" />
                <span className="text-neutral-400">新增业务</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-success-500 rounded-full" />
                <span className="text-neutral-400">已办结</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockSupervisionStats.trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E6EB" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#86909C' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E6EB' }}
                  tickFormatter={(value) => formatDate(value, 'MM/DD')}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#86909C' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E6EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                  }}
                  labelFormatter={(label) => formatDate(label, 'YYYY年MM月DD日')}
                />
                <Line
                  type="monotone"
                  dataKey="newCount"
                  name="新增"
                  stroke="#165DFF"
                  strokeWidth={2.5}
                  dot={{ fill: '#165DFF', r: 4 }}
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="completedCount"
                  name="办结"
                  stroke="#00B42A"
                  strokeWidth={2.5}
                  dot={{ fill: '#00B42A', r: 4 }}
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <h3 className="text-base font-semibold text-neutral-600 mb-5">业务类型分布</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockSupervisionStats.businessTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="type"
                >
                  {mockSupervisionStats.businessTypeDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E6EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                  }}
                  formatter={(value: number, name: string) => [`${value} 件`, name]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-neutral-500">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-neutral-600">超时预警列表</h3>
            <button className="text-xs text-primary-500 hover:text-primary-600 transition-colors">
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {warningOrders.map((order) => renderOrderRow(order))}
          </div>
        </Card>

        <Card className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <h3 className="text-base font-semibold text-neutral-600 mb-5">SLA达标率</h3>
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-40 h-40">
              <RadialBarChart
                width={160}
                height={160}
                cx="50%"
                cy="50%"
                innerRadius="70%"
                outerRadius="100%"
                data={[{ name: '达标率', value: mockSupervisionStats.onTimeRate, fill: '#00B42A' }]}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  background={{ fill: '#E5E6EB' }}
                  dataKey="value"
                  cornerRadius={10}
                />
              </RadialBarChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-neutral-600">{mockSupervisionStats.onTimeRate}%</span>
                <span className="text-xs text-neutral-400">总体达标率</span>
              </div>
            </div>
          </div>
          <div className="space-y-2.5">
            {slaByType.map((item) => (
              <div key={item.type} className="flex items-center gap-3">
                <span className="text-xs text-neutral-500 w-20 truncate flex-shrink-0">{item.type}</span>
                <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.rate}%`,
                      backgroundColor: item.rate >= 95 ? '#00B42A' : item.rate >= 85 ? '#FF7D00' : '#F53F3F',
                    }}
                  />
                </div>
                <span className={`text-xs font-medium w-12 text-right flex-shrink-0 ${
                  item.rate >= 95 ? 'text-success-500' : item.rate >= 85 ? 'text-warning-500' : 'text-danger-500'
                }`}>
                  {item.rate}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-neutral-600">今日动态</h3>
              <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
            </div>
            <button className="text-xs text-primary-500 hover:text-primary-600 transition-colors">
              更多动态
            </button>
          </div>
          <div className="space-y-0">
            {todayMessages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 py-3 ${
                  index !== todayMessages.length - 1 ? 'border-b border-neutral-100' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  msg.type === 'success' ? 'bg-success-500/10 text-success-500' :
                  msg.type === 'warning' ? 'bg-warning-500/10 text-warning-500' :
                  msg.type === 'danger' ? 'bg-danger-500/10 text-danger-500' :
                  'bg-primary-500/10 text-primary-500'
                }`}>
                  <msg.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-600">{msg.title}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-neutral-600">系统运行状态</h3>
            <span className="text-xs text-success-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-success-500 rounded-full animate-pulse" />
              运行正常
            </span>
          </div>
          <div className="space-y-3">
            {systemStatus.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100/50 transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  item.status === 'normal' ? 'bg-success-500/10 text-success-500' :
                  item.status === 'warning' ? 'bg-warning-500/10 text-warning-500' :
                  'bg-danger-500/10 text-danger-500'
                }`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-600">{item.name}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`w-2 h-2 rounded-full ${
                    item.status === 'normal' ? 'bg-success-500' :
                    item.status === 'warning' ? 'bg-warning-500' :
                    'bg-danger-500'
                  }`} />
                  <span className={`text-sm font-medium ${
                    item.status === 'normal' ? 'text-success-500' :
                    item.status === 'warning' ? 'text-warning-500' :
                    'text-danger-500'
                  }`}>
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
