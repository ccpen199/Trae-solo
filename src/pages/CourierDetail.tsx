import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Phone, MapPin, Award, 
  Fingerprint, TrendingUp, Calendar, Clock,
  Loader2, AlertCircle, Package, CheckCircle,
  DollarSign
} from 'lucide-react';
import dayjs from 'dayjs';
import { StatusBadge } from '@/components/ui';
import { get as apiGet } from '@/utils/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import type { PickupTask } from 'shared/types';
import { cn } from '@/lib/utils';

interface CourierDetail {
  id: string;
  name: string;
  phone: string;
  idCard: string;
  avatar: string;
  outletName: string;
  certificationStatus: 'pending' | 'approved' | 'rejected';
  qualificationExpiryDate: string;
  deviceFingerprint: string;
  deviceInfo: string;
  createdAt: string;
  lastLoginAt: string;
  stats: {
    todayCompleted: number;
    weekCompleted: number;
    monthCompleted: number;
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
  };
  recentTasks: PickupTask[];
  performanceData: Array<{
    date: string;
    tasks: number;
    revenue: number;
  }>;
}

const mockCourier: CourierDetail = {
  id: '1',
  name: '张建国',
  phone: '13800138001',
  idCard: '110101********1234',
  avatar: '',
  outletName: '朝阳区建国路网点',
  certificationStatus: 'approved',
  qualificationExpiryDate: '2025-06-15T00:00:00Z',
  deviceFingerprint: 'DEV-8F7A2D1C-4E5B-4C3D-2E1F-0A1B2C3D4E5F',
  deviceInfo: 'iPhone 15 Pro, iOS 17.2',
  createdAt: '2023-06-15T00:00:00Z',
  lastLoginAt: '2024-01-15T08:30:00Z',
  stats: {
    todayCompleted: 15,
    weekCompleted: 86,
    monthCompleted: 328,
    todayRevenue: 425.5,
    weekRevenue: 2580.0,
    monthRevenue: 12580.0
  },
  recentTasks: [
    {
      id: 'task-1',
      taskNo: 'TK202401150001',
      orderId: '1',
      orderNo: 'ORD202401150001',
      courierId: '1',
      courierName: '张建国',
      outletId: '1',
      pickupCode: 'A1B2C3',
      senderAddress: '北京市朝阳区建国路88号',
      senderPhone: '13800138001',
      itemType: '电子产品',
      estimatedWeight: 2.5,
      actualWeight: 2.8,
      appointmentTime: '2024-01-15T14:00:00Z',
      status: 'completed',
      freight: 28.5,
      paymentMethod: 'wechat',
      weightCheckRule: 'tolerance',
      weightTolerance: 0.3,
      waybillNo: 'SF1234567890123',
      pickedAt: '2024-01-15T14:30:00Z',
      completedAt: '2024-01-15T14:35:00Z',
      createdAt: '2024-01-15T09:35:00Z',
      synced: true
    },
    {
      id: 'task-2',
      taskNo: 'TK202401150002',
      orderId: '2',
      orderNo: 'ORD202401150002',
      courierId: '1',
      courierName: '张建国',
      outletId: '1',
      pickupCode: 'D4E5F6',
      senderAddress: '北京市朝阳区光华路10号',
      senderPhone: '13800138002',
      itemType: '服装',
      estimatedWeight: 1.2,
      actualWeight: 1.3,
      appointmentTime: '2024-01-15T15:00:00Z',
      status: 'completed',
      freight: 15.0,
      paymentMethod: 'alipay',
      weightCheckRule: 'tolerance',
      weightTolerance: 0.3,
      waybillNo: 'SF1234567890124',
      pickedAt: '2024-01-15T15:15:00Z',
      completedAt: '2024-01-15T15:20:00Z',
      createdAt: '2024-01-15T10:00:00Z',
      synced: true
    },
    {
      id: 'task-3',
      taskNo: 'TK202401150003',
      orderId: '3',
      orderNo: 'ORD202401150003',
      courierId: '1',
      courierName: '张建国',
      outletId: '1',
      pickupCode: 'G7H8I9',
      senderAddress: '北京市朝阳区望京SOHO',
      senderPhone: '13800138003',
      itemType: '文件',
      estimatedWeight: 0.5,
      actualWeight: 0.5,
      appointmentTime: '2024-01-15T16:00:00Z',
      status: 'picked',
      freight: 12.0,
      paymentMethod: 'cash',
      weightCheckRule: 'none',
      waybillNo: 'SF1234567890125',
      pickedAt: '2024-01-15T16:10:00Z',
      createdAt: '2024-01-15T11:00:00Z',
      synced: true
    }
  ],
  performanceData: Array.from({ length: 30 }, (_, i) => {
    const date = dayjs().subtract(29 - i, 'day');
    return {
      date: date.format('MM-DD'),
      tasks: Math.floor(Math.random() * 15) + 5,
      revenue: Math.floor(Math.random() * 300) + 100
    };
  })
};

const certificationConfig: Record<string, { label: string; className: string }> = {
  pending: { label: '待审核', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '已认证', className: 'bg-green-100 text-green-800' },
  rejected: { label: '未通过', className: 'bg-red-100 text-red-800' }
};

export default function CourierDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [courier, setCourier] = useState<CourierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'performance'>('tasks');

  const fetchCourierDetail = async () => {
    setLoading(true);
    try {
      const data = await apiGet<CourierDetail>(`/couriers/${id}`);
      setCourier(data);
    } catch (error) {
      console.error('Fetch courier detail error:', error);
      setCourier(mockCourier);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCourierDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!courier) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">快递员不存在</p>
          <button
            onClick={() => navigate('/couriers')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            返回快递员列表
          </button>
        </div>
      </div>
    );
  }

  const certConfig = certificationConfig[courier.certificationStatus];
  const isExpiringSoon = dayjs(courier.qualificationExpiryDate).diff(dayjs(), 'month') <= 3;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/couriers')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">快递员详情</h1>
            <p className="text-gray-500 mt-1">{courier.name} 的详细信息</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-white text-4xl font-bold backdrop-blur-sm">
                {courier.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white">{courier.name}</h2>
                  <span className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    certConfig.className
                  )}>
                    {certConfig.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-white/80">
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {courier.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {courier.outletName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-600">今日完成</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{courier.stats.todayCompleted} 单</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">本周完成</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{courier.stats.weekCompleted} 单</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-gray-600">本月完成</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{courier.stats.monthCompleted} 单</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-gray-600">本月收入</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">¥{courier.stats.monthRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  基本信息
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">姓名</span>
                  <span className="text-gray-900 font-medium">{courier.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">手机号</span>
                  <span className="text-gray-900">{courier.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">身份证号</span>
                  <span className="text-gray-900 font-mono">{courier.idCard}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">所属网点</span>
                  <span className="text-gray-900">{courier.outletName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">入职时间</span>
                  <span className="text-gray-900">{dayjs(courier.createdAt).format('YYYY-MM-DD')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">最近登录</span>
                  <span className="text-gray-900">{dayjs(courier.lastLoginAt).format('YYYY-MM-DD HH:mm')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-500" />
                  资质信息
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">认证状态</span>
                  <span className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium',
                    certConfig.className
                  )}>
                    {certConfig.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">资质到期</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'font-medium',
                      isExpiringSoon ? 'text-red-600' : 'text-gray-900'
                    )}>
                      {dayjs(courier.qualificationExpiryDate).format('YYYY-MM-DD')}
                    </span>
                    {isExpiringSoon && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                        即将到期
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-purple-500" />
                  设备指纹
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <span className="text-xs text-gray-500 block mb-1">设备标识</span>
                  <span className="text-sm font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded block break-all">
                    {courier.deviceFingerprint}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">设备信息</span>
                  <span className="text-sm text-gray-600">{courier.deviceInfo}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className={cn(
                      'px-4 py-2 rounded-lg font-medium transition-colors',
                      activeTab === 'tasks'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    最近任务
                  </button>
                  <button
                    onClick={() => setActiveTab('performance')}
                    className={cn(
                      'px-4 py-2 rounded-lg font-medium transition-colors',
                      activeTab === 'performance'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    业绩图表
                  </button>
                </div>
              </div>

              <div className="p-4">
                {activeTab === 'tasks' ? (
                  <div className="space-y-3">
                    {courier.recentTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/tasks/${task.id}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-medium text-blue-600">{task.taskNo}</span>
                              <StatusBadge status={task.status} type="task" size="sm" />
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate max-w-md">{task.senderAddress}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-500 flex items-center gap-1">
                                <Package className="w-4 h-4" />
                                {task.itemType} · {task.actualWeight || task.estimatedWeight}kg
                              </span>
                              <span className="text-gray-500 flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                ¥{task.freight?.toFixed(2) || '-'}
                              </span>
                              <span className="text-gray-500 flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {dayjs(task.appointmentTime).format('HH:mm')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-4">近30天业绩趋势</h4>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={courier.performanceData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            interval={3}
                          />
                          <YAxis 
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            axisLine={{ stroke: '#e5e7eb' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                            }}
                            formatter={(value: number, name: string) => [
                              name === 'tasks' ? `${value} 单` : `¥${value}`,
                              name === 'tasks' ? '完成单数' : '收入'
                            ]}
                          />
                          <Bar 
                            dataKey="tasks" 
                            fill="#3b82f6" 
                            radius={[4, 4, 0, 0]}
                            name="tasks"
                          />
                          <Bar 
                            dataKey="revenue" 
                            fill="#10b981" 
                            radius={[4, 4, 0, 0]}
                            name="revenue"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <h4 className="text-sm font-medium text-gray-700 mt-8 mb-4">每日完成单量趋势</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={courier.performanceData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            interval={3}
                          />
                          <YAxis 
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            axisLine={{ stroke: '#e5e7eb' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                            }}
                            formatter={(value: number) => [`${value} 单`, '完成单数']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="tasks" 
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                            dot={{ fill: '#8b5cf6', r: 3 }}
                            activeDot={{ r: 5, fill: '#8b5cf6', stroke: 'white', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
