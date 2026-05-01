import { useState } from 'react';
import {
  BarChart3,
  Eye,
  MousePointerClick,
  Mail,
  AlertCircle,
  Download,
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
  AreaChart,
  Area,
} from 'recharts';
import { cn, formatNumber, formatPercentage } from '@/lib/utils';
import dayjs from '@/lib/dayjs';

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  
  const generateTrendData = (days: number) => {
    const data: Array<{ name: string; sends: number; opens: number; clicks: number; unsubscribes: number }> = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day');
      data.push({
        name: date.format('MM-DD'),
        sends: Math.floor(Math.random() * 5000) + 1000,
        opens: Math.floor(Math.random() * 2000) + 500,
        clicks: Math.floor(Math.random() * 800) + 100,
        unsubscribes: Math.floor(Math.random() * 50) + 5,
      });
    }
    
    return data;
  };
  
  const [trendData] = useState(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return generateTrendData(days);
  });
  
  const channelData = [
    { name: '促销活动', value: 45, color: '#3b82f6' },
    { name: '欢迎序列', value: 25, color: '#22c55e' },
    { name: '产品通知', value: 15, color: '#f59e0b' },
    { name: '会员专享', value: 10, color: '#6366f1' },
    { name: '其他', value: 5, color: '#64748b' },
  ];
  
  const engagementData = [
    { name: '高活跃', count: 3500, percentage: 28 },
    { name: '中活跃', count: 5200, percentage: 41 },
    { name: '低活跃', count: 2800, percentage: 22 },
    { name: '不活跃', count: 1100, percentage: 9 },
  ];
  
  const timeRangeOptions = [
    { value: '7d', label: '近7天' },
    { value: '30d', label: '近30天' },
    { value: '90d', label: '近90天' },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">数据分析</h1>
          <p className="text-neutral-500 mt-1">邮件营销效果分析与数据报表</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input w-32"
          >
            {timeRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="btn-secondary">
            <Download className="w-4 h-4" />
            导出报表
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">发送总数</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">
                  {formatNumber(45680)}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-success-600">
              <span className="font-medium">+12.5%</span>
              <span className="text-neutral-500">vs 上期</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">送达率</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">
                  {formatPercentage(96.8)}
                </p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-success-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-success-600">
              <span className="font-medium">+2.1%</span>
              <span className="text-neutral-500">vs 上期</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">打开率</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">
                  {formatPercentage(24.8)}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-warning-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-danger-600">
              <span className="font-medium">-1.2%</span>
              <span className="text-neutral-500">vs 上期</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">点击率</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">
                  {formatPercentage(8.2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-danger-100 rounded-xl flex items-center justify-center">
                <MousePointerClick className="w-6 h-6 text-danger-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-success-600">
              <span className="font-medium">+0.8%</span>
              <span className="text-neutral-500">vs 上期</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h3 className="font-semibold text-neutral-900">发送趋势</h3>
            <p className="text-sm text-neutral-500">发送、打开、点击数据趋势</p>
          </div>
          <div className="card-body">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorSends" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Area type="monotone" dataKey="sends" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSends)" name="发送" />
                  <Area type="monotone" dataKey="opens" stroke="#22c55e" fillOpacity={1} fill="url(#colorOpens)" name="打开" />
                  <Line type="monotone" dataKey="clicks" stroke="#f59e0b" strokeWidth={2} dot={false} name="点击" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-neutral-900">活动类型分布</h3>
            <p className="text-sm text-neutral-500">各类别邮件占比</p>
          </div>
          <div className="card-body">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {channelData.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-neutral-600 flex-1">{item.name}</span>
                  <span className="text-sm font-medium text-neutral-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-neutral-900">退订趋势</h3>
            <p className="text-sm text-neutral-500">每日退订数量统计</p>
          </div>
          <div className="card-body">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="unsubscribes" fill="#ef4444" radius={[4, 4, 0, 0]} name="退订" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-neutral-900">用户活跃度分布</h3>
              <p className="text-sm text-neutral-500">按活跃度分级统计</p>
            </div>
            <span className="badge badge-warning">
              <AlertCircle className="w-3 h-3" />
              9% 不活跃
            </span>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {engagementData.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-neutral-900">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-600">{formatNumber(item.count)}</span>
                      <span className="text-sm text-neutral-500">({formatPercentage(item.percentage)})</span>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2.5">
                    <div
                      className={cn(
                        'h-2.5 rounded-full transition-all duration-500',
                        item.name === '高活跃' ? 'bg-success-500' :
                        item.name === '中活跃' ? 'bg-primary-500' :
                        item.name === '低活跃' ? 'bg-warning-500' :
                        'bg-danger-500'
                      )}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
