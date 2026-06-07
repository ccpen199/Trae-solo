import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Thermometer, TrendingUp, Users, Heart } from 'lucide-react';
import type { TempTrend } from '@/types';

const tempTrendData: TempTrend[] = [
  { date: '01-01', value: 22 },
  { date: '01-02', value: 23 },
  { date: '01-03', value: 24 },
  { date: '01-04', value: 23 },
  { date: '01-05', value: 25 },
  { date: '01-06', value: 26 },
  { date: '01-07', value: 25 },
  { date: '01-08', value: 27 },
  { date: '01-09', value: 26 },
  { date: '01-10', value: 28 },
  { date: '01-11', value: 27 },
  { date: '01-12', value: 26 },
  { date: '01-13', value: 25 },
  { date: '01-14', value: 26 },
  { date: '01-15', value: 26 },
];

const categoryData = [
  { name: '物业服务', value: 35, color: '#FF6B35' },
  { name: '邻里互动', value: 28, color: '#1E3A5F' },
  { name: '商圈活动', value: 20, color: '#4CAF50' },
  { name: '社区活动', value: 17, color: '#FFC107' },
];

const satisfactionData = [
  { date: '01-01', value: 92 },
  { date: '01-02', value: 93 },
  { date: '01-03', value: 91 },
  { date: '01-04', value: 94 },
  { date: '01-05', value: 93 },
  { date: '01-06', value: 95 },
  { date: '01-07', value: 94 },
  { date: '01-08', value: 96 },
  { date: '01-09', value: 95 },
  { date: '01-10', value: 94 },
  { date: '01-11', value: 95 },
  { date: '01-12', value: 96 },
  { date: '01-13', value: 95 },
  { date: '01-14', value: 94 },
  { date: '01-15', value: 94.5 },
];

const activityData = [
  { name: '周一', posts: 45, tickets: 12, visits: 280 },
  { name: '周二', posts: 52, tickets: 18, visits: 320 },
  { name: '周三', posts: 38, tickets: 15, visits: 250 },
  { name: '周四', posts: 65, tickets: 22, visits: 380 },
  { name: '周五', posts: 78, tickets: 25, visits: 420 },
  { name: '周六', posts: 95, tickets: 10, visits: 520 },
  { name: '周日', posts: 82, tickets: 8, visits: 480 },
];

const metrics = [
  { label: '当前温度', value: '26°C', icon: Thermometer, color: 'primary', trend: '+2°C' },
  { label: '满意度', value: '94.5%', icon: Heart, color: 'secondary', trend: '+0.5%' },
  { label: '活跃用户', value: '1,256', icon: Users, color: 'green', trend: '+5.2%' },
  { label: '互动指数', value: '89.2', icon: TrendingUp, color: 'yellow', trend: '+3.8%' },
];

const CommunityMetrics: React.FC = () => {
  const getTempLevel = (temp: number) => {
    if (temp >= 28) return { label: '火热', color: 'text-red-500', bg: 'bg-red-500' };
    if (temp >= 24) return { label: '温暖', color: 'text-accent-yellow-500', bg: 'bg-accent-yellow-500' };
    if (temp >= 20) return { label: '温馨', color: 'text-accent-green-500', bg: 'bg-accent-green-500' };
    return { label: '平和', color: 'text-blue-500', bg: 'bg-blue-500' };
  };

  const currentLevel = getTempLevel(26);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">社区温度指数看板</h1>
        <p className="text-gray-500 mt-1">全方位监控社区运营状况和居民满意度</p>
      </div>

      <div className="gradient-primary rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-white/30 flex items-center justify-center">
                  <div className="text-center">
                    <Thermometer className="w-8 h-8 mx-auto mb-1" />
                    <span className="text-2xl font-bold">26°</span>
                  </div>
                </div>
              </div>
              <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full ${currentLevel.bg} text-sm font-medium`}>
                {currentLevel.label}
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold font-serif">社区温度指数</h2>
              <p className="text-white/80 mt-2">综合反映社区活跃度、居民满意度、物业服务质量等多维度指标</p>
            </div>
          </div>
          <div className="flex gap-4">
            {metrics.map((metric, idx) => (
              <div key={idx} className="text-center">
                <metric.icon className="w-6 h-6 mx-auto mb-2 text-white/80" />
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-sm text-white/70">{metric.label}</p>
                <p className="text-sm text-white/80 mt-1">{metric.trend}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-serif">温度趋势（近15天）</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={tempTrendData}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} domain={[18, 32]} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#FF6B35"
                strokeWidth={3}
                fill="url(#colorTemp)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-serif">满意度趋势（近15天）</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={satisfactionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} domain={[88, 100]} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [`${value}%`, '满意度']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#1E3A5F"
                strokeWidth={3}
                dot={{ fill: '#1E3A5F', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-serif">周活跃度统计</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend />
              <Bar dataKey="posts" fill="#FF6B35" name="帖子数" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tickets" fill="#1E3A5F" name="工单数" radius={[4, 4, 0, 0]} />
              <Bar dataKey="visits" fill="#4CAF50" name="访问量" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-serif">温度构成分析</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {categoryData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityMetrics;
