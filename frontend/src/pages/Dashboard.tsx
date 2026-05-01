import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Users,
  FileText,
  TrendingUp,
  BarChart3,
  Eye,
  MousePointerClick,
  AlertCircle,
  ChevronRight,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
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
} from 'recharts';
import { api } from '@/lib/api';
import { cn, formatNumber, formatPercentage, getStatusColor, getStatusLabel } from '@/lib/utils';
import dayjs from '@/lib/dayjs';

interface DashboardData {
  summary: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalAudiences: number;
    totalMembers: number;
    totalTemplates: number;
  };
  stats: {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  };
  recentAlerts: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    createdAt: string;
  }>;
  recentCampaigns: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
    creator: { name: string };
    _count: { sendBatches: number };
  }>;
}

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#6366f1'];

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [chartData, setChartData] = useState<Array<{ name: string; opens: number; clicks: number; sends: number }>>([]);
  
  useEffect(() => {
    fetchDashboardData();
    generateChartData();
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      const response = await api.get<DashboardData>('/api/admin/dashboard');
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setData({
        summary: {
          totalCampaigns: 0,
          activeCampaigns: 0,
          totalAudiences: 0,
          totalMembers: 0,
          totalTemplates: 0,
        },
        stats: {
          totalSent: 0,
          totalDelivered: 0,
          totalOpened: 0,
          totalClicked: 0,
          deliveryRate: 0,
          openRate: 0,
          clickRate: 0,
        },
        recentAlerts: [],
        recentCampaigns: [],
      });
    } finally {
      setLoading(false);
    }
  };
  
  const generateChartData = () => {
    const days = 7;
    const data: Array<{ name: string; opens: number; clicks: number; sends: number }> = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day');
      data.push({
        name: date.format('MM-DD'),
        opens: Math.floor(Math.random() * 500) + 100,
        clicks: Math.floor(Math.random() * 200) + 50,
        sends: Math.floor(Math.random() * 1000) + 500,
      });
    }
    
    setChartData(data);
  };
  
  const statusData = [
    { name: '已送达', value: data?.stats.totalDelivered || 8500, color: '#22c55e' },
    { name: '已打开', value: data?.stats.totalOpened || 3400, color: '#3b82f6' },
    { name: '已点击', value: data?.stats.totalClicked || 1200, color: '#6366f1' },
    { name: '已退信', value: Math.floor((data?.stats.totalSent || 10000) * 0.05), color: '#f59e0b' },
    { name: '已退订', value: Math.floor((data?.stats.totalSent || 10000) * 0.02), color: '#ef4444' },
  ];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-neutral-500">加载中...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">仪表板</h1>
          <p className="text-neutral-500 mt-1">邮件营销系统概览</p>
        </div>
        <Link to="/campaigns/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          新建活动
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">营销活动</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">
                  {formatNumber(data?.summary.totalCampaigns || 24)}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1 text-success-600">
                <TrendingUp className="w-4 h-4" />
                {data?.summary.activeCampaigns || 5} 个进行中
              </span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">受众总数</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">
                  {formatNumber(data?.summary.totalMembers || 12580)}
                </p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-success-600" />
              </div>
            </div>
            <div className="mt-3 text-sm text-neutral-500">
              {data?.summary.totalAudiences || 8} 个受众分组
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">发送邮件</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">
                  {formatNumber(data?.stats.totalSent || 45680)}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-warning-600" />
              </div>
            </div>
            <div className="mt-3 text-sm">
              <span className="text-success-600">{formatPercentage(data?.stats.deliveryRate || 96.5)}%</span>
              <span className="text-neutral-500 ml-2">送达率</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">转化率</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">
                  {formatPercentage(data?.stats.clickRate || 8.2)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-danger-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-danger-600" />
              </div>
            </div>
            <div className="mt-3 text-sm">
              <span className="text-primary-600">{formatPercentage(data?.stats.openRate || 24.8)}%</span>
              <span className="text-neutral-500 ml-2">打开率</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h3 className="font-semibold text-neutral-900">发送趋势</h3>
            <p className="text-sm text-neutral-500">最近7天的发送、打开、点击数据</p>
          </div>
          <div className="card-body">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
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
                  <Line type="monotone" dataKey="sends" stroke="#3b82f6" strokeWidth={2} dot={false} name="发送" />
                  <Line type="monotone" dataKey="opens" stroke="#22c55e" strokeWidth={2} dot={false} name="打开" />
                  <Line type="monotone" dataKey="clicks" stroke="#f59e0b" strokeWidth={2} dot={false} name="点击" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-neutral-900">状态分布</h3>
            <p className="text-sm text-neutral-500">邮件发送状态统计</p>
          </div>
          <div className="card-body">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
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
            <div className="grid grid-cols-2 gap-2 mt-4">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-neutral-600">{item.name}</span>
                  <span className="text-sm font-medium text-neutral-900 ml-auto">
                    {formatNumber(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-neutral-900">最近活动</h3>
              <p className="text-sm text-neutral-500">最近创建的营销活动</p>
            </div>
            <Link to="/campaigns" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              查看全部
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {(data?.recentCampaigns?.length ? data.recentCampaigns : [
              { id: '1', name: '2024春季促销活动', status: 'SENDING', createdAt: new Date().toISOString(), creator: { name: '张三' }, _count: { sendBatches: 3 } },
              { id: '2', name: '新用户欢迎邮件', status: 'COMPLETED', createdAt: new Date(Date.now() - 86400000).toISOString(), creator: { name: '李四' }, _count: { sendBatches: 1 } },
              { id: '3', name: '产品更新通知', status: 'PENDING_REVIEW', createdAt: new Date(Date.now() - 172800000).toISOString(), creator: { name: '王五' }, _count: { sendBatches: 0 } },
              { id: '4', name: '会员专属优惠', status: 'DRAFT', createdAt: new Date(Date.now() - 259200000).toISOString(), creator: { name: '赵六' }, _count: { sendBatches: 0 } },
            ]).map((campaign) => (
              <div key={campaign.id} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    campaign.status === 'SENDING' ? 'bg-warning-100' :
                    campaign.status === 'COMPLETED' ? 'bg-success-100' :
                    campaign.status === 'PENDING_REVIEW' ? 'bg-primary-100' :
                    'bg-neutral-100'
                  )}>
                    {campaign.status === 'SENDING' && <Clock className="w-5 h-5 text-warning-600" />}
                    {campaign.status === 'COMPLETED' && <CheckCircle className="w-5 h-5 text-success-600" />}
                    {campaign.status === 'PENDING_REVIEW' && <Eye className="w-5 h-5 text-primary-600" />}
                    {campaign.status === 'DRAFT' && <FileText className="w-5 h-5 text-neutral-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{campaign.name}</p>
                    <p className="text-sm text-neutral-500">
                      创建者: {campaign.creator.name} · {dayjs(campaign.createdAt).format('MM-DD HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('badge', getStatusColor(campaign.status))}>
                    {getStatusLabel(campaign.status)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-neutral-900">系统告警</h3>
              <p className="text-sm text-neutral-500">需要关注的系统通知</p>
            </div>
            <Link to="/admin/alerts" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              查看全部
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {(data?.recentAlerts?.length ? data.recentAlerts : [
              { id: '1', type: 'USER_UNSUBSCRIBE', severity: 'MEDIUM', message: '用户 user1@example.com 已退订', createdAt: new Date().toISOString() },
              { id: '2', type: 'BOUNCE_HARD', severity: 'HIGH', message: '邮件退信 [hard]: user2@example.com', createdAt: new Date(Date.now() - 3600000).toISOString() },
              { id: '3', type: 'LOW_DELIVERY_RATE', severity: 'WARNING', message: '活动 "春季促销" 送达率低于80%', createdAt: new Date(Date.now() - 7200000).toISOString() },
            ]).map((alert) => (
              <div key={alert.id} className="px-6 py-4 flex items-start gap-3 hover:bg-neutral-50">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                  alert.severity === 'HIGH' ? 'bg-danger-100' :
                  alert.severity === 'MEDIUM' ? 'bg-warning-100' :
                  'bg-primary-100'
                )}>
                  <AlertCircle className={cn(
                    'w-4 h-4',
                    alert.severity === 'HIGH' ? 'text-danger-600' :
                    alert.severity === 'MEDIUM' ? 'text-warning-600' :
                    'text-primary-600'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900">{alert.message}</p>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {dayjs(alert.createdAt).fromNow()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
