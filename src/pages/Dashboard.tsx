import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, FileText, KeyRound, ShoppingBag, Users, Calendar, ChevronRight,
  Camera, QrCode, Bluetooth, Wifi, Clock, CheckCircle, AlertCircle,
  BarChart3, Store, AlertTriangle, TrendingUp, DollarSign, Trophy,
  Wrench, MessageSquare, HelpCircle, MapPin, Phone, Star, Tag,
  Heart, Share2, UserCheck, Package, CreditCard, Award, Zap,
  ShoppingCart, Repeat, Building2
} from 'lucide-react';
import { workOrderApi, socialApi, accessApi, analyticsApi, riskApi, mallApi } from '@/api';
import { useAuthStore } from '@/store';
import StatusBadge from '@/components/common/StatusBadge';
import type { WorkOrder, Activity, VisitorPass, AccessRecord, Alert, KPIData } from '@shared/types';

interface DashboardProps {}

const roleNames: Record<string, string> = {
  owner: '业主',
  tenant: '租户',
  visitor: '访客',
  property: '物业员工',
  merchant: '商户',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
};

const priorityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

const prioritySLA: Record<string, string> = {
  low: '24小时内响应',
  medium: '12小时内响应',
  high: '4小时内响应',
  urgent: '30分钟内响应',
};

const workOrderStatusSteps = [
  { key: 'pending', label: '待处理' },
  { key: 'assigned', label: '已接单' },
  { key: 'processing', label: '处理中' },
  { key: 'completed', label: '已完成' },
  { key: 'closed', label: '已关闭' },
];

const getSLAStatus = (order: WorkOrder) => {
  if (order.status !== 'pending') return null;
  const hours = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60);
  if (order.priority === 'urgent' && hours > 0.5) return { label: '已超时', color: 'text-red-600 bg-red-50' };
  if (order.priority === 'high' && hours > 4) return { label: '已超时', color: 'text-red-600 bg-red-50' };
  if (order.priority === 'medium' && hours > 12) return { label: '已超时', color: 'text-red-600 bg-red-50' };
  if (order.priority === 'low' && hours > 24) return { label: '已超时', color: 'text-red-600 bg-red-50' };
  if (order.priority === 'urgent') return { label: '需30分钟内响应', color: 'text-orange-600 bg-orange-50' };
  if (order.priority === 'high') return { label: '需4小时内响应', color: 'text-yellow-600 bg-yellow-50' };
  return null;
};

const getCurrentStepIndex = (status: string) => {
  const idx = workOrderStatusSteps.findIndex(s => s.key === status);
  return idx >= 0 ? idx : 0;
};

const toList = <T,>(value: unknown, keys: string[] = []): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    for (const key of keys) {
      const candidate = (value as Record<string, unknown>)[key];
      if (Array.isArray(candidate)) return candidate as T[];
    }
  }
  return [];
};

const Dashboard: React.FC<DashboardProps> = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [visitorPasses, setVisitorPasses] = useState<VisitorPass[]>([]);
  const [accessRecords, setAccessRecords] = useState<AccessRecord[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [merchantStats, setMerchantStats] = useState<any>(null);
  const [memberProfile, setMemberProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    fetchRoleSpecificData();
  }, [user]);

  const fetchRoleSpecificData = async () => {
    try {
      setLoading(true);
      setError('');

      const commonPromises: Promise<any>[] = [
        workOrderApi.getWorkOrders({ limit: 5 }),
        socialApi.getActivities('active'),
      ];

      if (user?.role === 'owner' || user?.role === 'tenant') {
        commonPromises.push(
          accessApi.getVisitorPasses(),
          accessApi.getAccessRecords(5),
          analyticsApi.getMemberProfile()
        );
      }

      if (user?.role === 'property') {
        commonPromises.push(
          analyticsApi.getPropertyKPI(),
          riskApi.getAlerts({ status: 'pending' })
        );
      }

      if (user?.role === 'merchant') {
        commonPromises.push(
          analyticsApi.getMerchantAnalytics(),
          mallApi.getOrders()
        );
      }

      const results = await Promise.all(commonPromises);

      if (results[0]?.success && results[0]?.data) {
        setWorkOrders(toList<WorkOrder>(results[0].data, ['workOrders', 'orders', 'items']));
      }
      if (results[1]?.success && results[1]?.data) {
        setActivities(toList<Activity>(results[1].data, ['activities', 'items']));
      }

      if (user?.role === 'owner' || user?.role === 'tenant') {
        if (results[2]?.success && results[2]?.data) {
          setVisitorPasses(toList<VisitorPass>(results[2].data, ['passes', 'visitorPasses', 'items']));
        }
        if (results[3]?.success && results[3]?.data) {
          setAccessRecords(toList<AccessRecord>(results[3].data, ['records', 'accessRecords', 'items']));
        }
        if (results[4]?.success && results[4]?.data) {
          setMemberProfile(results[4].data);
        }
      }

      if (user?.role === 'property') {
        if (results[2]?.success && results[2]?.data) {
          setKpiData(results[2].data.kpi);
        }
        if (results[3]?.success && results[3]?.data) {
          setAlerts(toList<Alert>(results[3].data, ['alerts', 'items']));
        }
      }

      if (user?.role === 'merchant') {
        if (results[2]?.success && results[2]?.data) {
          setMerchantStats(results[2].data.analytics);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${start.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} ${start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getPassStatusInfo = (pass: VisitorPass) => {
    const now = new Date();
    const validTo = new Date(pass.valid_to);
    const validFrom = new Date(pass.valid_from);
    const diffHours = (validTo.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (pass.status === 'expired' || now > validTo) {
      return { status: 'expired', label: '已过期', color: 'bg-red-100 text-red-600' };
    }
    if (pass.status === 'used') {
      return { status: 'used', label: '已使用', color: 'bg-gray-100 text-gray-600' };
    }
    if (now < validFrom) {
      return { status: 'pending', label: '未生效', color: 'bg-yellow-100 text-yellow-600' };
    }
    if (diffHours < 1) {
      return { status: 'expiring', label: `即将过期(${Math.round(diffHours * 60)}分钟)`, color: 'bg-orange-100 text-orange-600' };
    }
    return { status: 'active', label: '有效', color: 'bg-green-100 text-green-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const renderOwnerDashboard = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">欢迎回来，{user?.name} 业主</h1>
            <p className="text-blue-100">今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
          </div>
          {memberProfile && (
            <div className="text-right">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <p className="text-sm text-blue-100">会员等级</p>
                <p className="text-xl font-bold flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-300" />
                  {memberProfile.level === 'gold' ? '金卡会员' : memberProfile.level === 'silver' ? '银卡会员' : '普通会员'}
                </p>
                <p className="text-sm text-blue-100 mt-1">积分: {memberProfile.points?.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => navigate('/workorder')} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <span className="text-gray-700 font-medium block">创建工单</span>
          <span className="text-xs text-gray-400">报事报修/投诉建议</span>
        </button>
        <button onClick={() => navigate('/access')} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all group">
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <span className="text-gray-700 font-medium block">访客通行证</span>
          <span className="text-xs text-gray-400">生成二维码/蓝牙/NFC</span>
        </button>
        <button onClick={() => navigate('/mall')} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all group">
          <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <span className="text-gray-700 font-medium block">社区商城</span>
          <span className="text-xs text-gray-400">积分抵扣/优惠券</span>
        </button>
        <button onClick={() => navigate('/social')} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all group">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6 text-white" />
          </div>
          <span className="text-gray-700 font-medium block">邻里社交</span>
          <span className="text-xs text-gray-400">楼栋群/闲置流转</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-green-500" />
            无感通行方式
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-800">人脸识别</p>
              <p className="text-xs text-green-600">已激活</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-800">二维码</p>
              <p className="text-xs text-blue-600">动态刷新</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <Bluetooth className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-800">蓝牙</p>
              <p className="text-xs text-purple-600">自动感应</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-800">NFC</p>
              <p className="text-xs text-orange-600">一碰开门</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-green-500" />
              门禁设备状态
            </h3>
            <button onClick={() => navigate('/access')} className="text-xs text-blue-600">查看详情</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">3</p>
              <p className="text-xs text-gray-500">在线设备</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">1</p>
              <p className="text-xs text-gray-500">离线设备</p>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            <p className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-red-500" />
              2号楼单元门离线2小时
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              异常访客风险
            </h3>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-600">
              需关注
            </span>
          </div>
          <p className="text-xs text-gray-600 mb-2">
            同一访客24小时内频繁出入5次以上
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              风险等级:
              <span className="text-orange-600 font-medium">中危</span>
            </span>
            {user?.role === 'property' && (
              <button onClick={() => navigate('/risk')} className="text-xs text-blue-600">处理</button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-500" />
              通行证管理
            </h3>
            <button onClick={() => navigate('/access')} className="text-xs text-blue-600">管理</button>
          </div>
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">今日生成</span>
              <span className="font-medium text-gray-800">2张</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">有效中</span>
              <span className="font-medium text-green-600">1张</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">待生效</span>
              <span className="font-medium text-blue-600">1张</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">已过期</span>
              <span className="font-medium text-red-600">1张</span>
            </div>
          </div>
          <div className="space-y-2 pt-3 border-t border-gray-100">
            <div className="p-2 bg-red-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-gray-700">李访客通行证</span>
                </div>
                <span className="text-xs text-red-600 font-medium">已过期</span>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => navigate('/access')} className="flex-1 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors">
                  重新激活
                </button>
                <button onClick={() => navigate('/access')} className="flex-1 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">
                  删除
                </button>
              </div>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-gray-700">王访客通行证</span>
                </div>
                <span className="text-xs text-blue-600 font-medium">待生效</span>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => navigate('/access')} className="flex-1 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors">
                  延期
                </button>
                <button onClick={() => navigate('/access')} className="flex-1 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors">
                  撤销
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-800">我的工单</h2>
            </div>
            <button onClick={() => navigate('/workorder')} className="flex items-center text-sm text-blue-600 hover:text-blue-700">
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-5 gap-2 p-4 border-b border-gray-100 bg-gray-50">
            <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
              <p className="text-xl font-bold text-gray-800">{workOrders.length}</p>
              <p className="text-xs text-gray-500">全部工单</p>
            </div>
            <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
              <p className="text-xl font-bold text-yellow-600">
                {workOrders.filter(o => o.status === 'pending').length}
              </p>
              <p className="text-xs text-gray-500">待处理</p>
            </div>
            <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
              <p className="text-xl font-bold text-blue-600">
                {workOrders.filter(o => o.status === 'processing' || o.status === 'assigned').length}
              </p>
              <p className="text-xs text-gray-500">处理中</p>
            </div>
            <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
              <p className="text-xl font-bold text-green-600">
                {workOrders.filter(o => o.status === 'completed' || o.status === 'closed').length}
              </p>
              <p className="text-xs text-gray-500">已完成</p>
            </div>
            <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
              <p className="text-xl font-bold text-purple-600">85%</p>
              <p className="text-xs text-gray-500">投诉闭环率</p>
            </div>
          </div>

          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {workOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">暂无工单记录</div>
            ) : (
              workOrders.map((order) => {
                const slaStatus = getSLAStatus(order);
                const currentStep = getCurrentStepIndex(order.status);
                return (
                  <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[order.priority]}`}>
                          {priorityLabels[order.priority]}优先级
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600">
                          {prioritySLA[order.priority]}
                        </span>
                        {slaStatus && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${slaStatus.color}`}>
                            {slaStatus.label}
                          </span>
                        )}
                        <StatusBadge status={order.status} />
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(order.created_at)}</span>
                    </div>
                    <h3 className="font-medium text-gray-800 mb-1">{order.title}</h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-1">{order.description}</p>
                    
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">处理进度</span>
                        <span className="text-xs text-gray-500">{workOrderStatusSteps[currentStep]?.label}</span>
                      </div>
                      <div className="relative">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all"
                            style={{ width: `${(currentStep / (workOrderStatusSteps.length - 1)) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          {workOrderStatusSteps.map((step, idx) => (
                            <div key={step.key} className="flex flex-col items-center">
                              <div className={`w-2 h-2 rounded-full ${idx <= currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
                              <span className={`text-[10px] mt-0.5 ${idx <= currentStep ? 'text-green-600' : 'text-gray-400'}`}>
                                {step.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {order.status === 'processing' && (
                      <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-blue-700">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>进度推送：维修师傅已出发，预计15分钟后到达</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order.location}
                        </span>
                        <button 
                          onClick={() => navigate('/workorder')}
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          房屋档案(历史工单3条)
                        </button>
                      </div>
                      {order.status === 'completed' && (
                        <button 
                          onClick={() => navigate('/workorder')}
                          className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 px-3 py-1 bg-amber-50 rounded-lg"
                        >
                          <Star className="w-3 h-3" />
                          去评价
                        </button>
                      )}
                      {order.status === 'closed' && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            5.0分
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <CheckCircle className="w-3 h-3" />
                            已复查
                          </div>
                        </div>
                      )}
                      {order.status === 'processing' && (
                        <button 
                          onClick={() => navigate('/workorder')}
                          className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1 px-3 py-1 bg-green-50 rounded-lg"
                        >
                          <CheckCircle className="w-3 h-3" />
                          确认完成
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold text-gray-800">访客通行证</h2>
              </div>
              <button onClick={() => navigate('/access')} className="text-xs text-blue-600 hover:text-blue-700">
                管理
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
              {visitorPasses.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-4">暂无有效通行证</p>
              ) : (
                visitorPasses.slice(0, 3).map((pass) => {
                  const statusInfo = getPassStatusInfo(pass);
                  return (
                    <div key={pass.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-800 text-sm">{pass.visitor_name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">有效期: {formatDate(pass.valid_from)} ~ {formatDate(pass.valid_to)}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-800">最近通行记录</h2>
              </div>
            </div>
            <div className="p-4 space-y-2 max-h-40 overflow-y-auto">
              {accessRecords.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-4">暂无通行记录</p>
              ) : (
                accessRecords.slice(0, 3).map((record) => (
                  <div key={record.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        record.result === 'success' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {record.result === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{record.person_name}</p>
                        <p className="text-xs text-gray-500">{record.access_type === 'qr' ? '二维码' : record.access_type === 'face' ? '人脸识别' : record.access_type === 'bluetooth' ? '蓝牙' : record.access_type === 'nfc' ? 'NFC' : '门禁卡'}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(record.access_time)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-800">社区商圈</h2>
            </div>
            <button onClick={() => navigate('/mall')} className="flex items-center text-sm text-blue-600 hover:text-blue-700">
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800 text-sm">我的会员</p>
                      <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700 font-medium">
                        {memberProfile?.level === 'gold' ? '金卡' : memberProfile?.level === 'silver' ? '银卡' : '普通'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      积分余额: <span className="text-yellow-600 font-medium">{memberProfile?.points?.toLocaleString() || 0}</span>
                      <span className="mx-1">·</span>
                      可抵扣: <span className="text-green-600 font-medium">¥{(memberProfile?.points || 0) / 100}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => navigate('/mall')} className="text-xs text-purple-600 hover:text-purple-700">
                  会员权益
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 pt-2 border-t border-purple-100">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  100积分=1元
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  累计消费返积分: 1,250
                </span>
                <button onClick={() => navigate('/mall')} className="text-blue-600 hover:text-blue-700 ml-auto">
                  积分通兑规则 →
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-gray-800 text-sm">我的优惠券</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600">2张可用</span>
                    <span className="text-xs text-orange-500">1张即将过期</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">累计已核销: 8张</span>
                  <button onClick={() => navigate('/mall')} className="text-xs text-blue-600 hover:text-blue-700 ml-auto">
                    核销流水 →
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Store className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800 text-sm">优质商户</p>
                    <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-600 font-medium">A级</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span>2家已审核通过</span>
                    <button onClick={() => navigate('/mall')} className="text-blue-600 hover:text-blue-700">
                      经营排行 →
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Trophy className="w-3 h-3 text-yellow-500" />
                <span className="text-gray-600">Top 3</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-800">邻里社交</h2>
            </div>
            <button onClick={() => navigate('/social')} className="flex items-center text-sm text-blue-600 hover:text-blue-700">
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800 text-sm">实名楼栋群</p>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-600 text-white font-medium">官方认证</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-0.5">已加入 · 业主身份已验证</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">156人</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('/social')} className="flex-1 py-1.5 text-xs bg-white text-blue-600 rounded border border-blue-200 hover:bg-blue-50 transition-colors">
                  进入群聊
                </button>
                <button onClick={() => navigate('/social')} className="flex-1 py-1.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">
                  查看公告
                </button>
              </div>
            </div>

            <div className="p-3 bg-pink-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800 text-sm">兴趣圈子</p>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-pink-100 text-pink-600">健身爱好者</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">已加入2个 · 89人</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('/social')} className="flex-1 py-1.5 text-xs bg-white text-pink-600 rounded border border-pink-200 hover:bg-pink-50 transition-colors">
                  查看活动
                </button>
                <button onClick={() => navigate('/social')} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">
                  退出圈子
                </button>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800 text-sm">闲置流转</p>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-100 text-green-600">实名发布</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">3件在售 · 15人浏览</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('/social')} className="flex-1 py-1.5 text-xs bg-white text-yellow-600 rounded border border-yellow-200 hover:bg-yellow-50 transition-colors">
                  查看闲置
                </button>
                <button onClick={() => navigate('/social')} className="flex-1 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                  发布闲置
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-800">社区活动</h2>
          </div>
          <button onClick={() => navigate('/social')} className="flex items-center text-sm text-blue-600 hover:text-blue-700">
            查看全部 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-4 p-4">
          {[
            { ...activities[0], registerStatus: 'approved', isOfficial: true },
            { ...activities[1], registerStatus: 'pending', isOfficial: true },
            { ...activities[2], registerStatus: 'not_registered', isOfficial: false },
          ].map((activity, index) => (
            <div key={activity.id ?? `activity-${index}`} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className={`h-32 bg-gradient-to-br ${
                index === 0 ? 'from-blue-400 to-indigo-500' :
                index === 1 ? 'from-green-400 to-teal-500' :
                'from-orange-400 to-pink-500'
              } flex items-center justify-center relative`}>
                <Calendar className="w-12 h-12 text-white/80" />
                {activity.isOfficial && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] bg-white/90 text-blue-600 font-medium">
                    官方活动
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{activity.title}</h3>
                  <div className="flex items-center gap-1">
                    <StatusBadge status={activity.status} />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{activity.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <MapPin className="w-3 h-3" />
                  {activity.location}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500">{activity.participant_count}人已报名</span>
                  {activity.registerStatus === 'not_registered' && (
                    <button onClick={() => navigate('/social')} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                      立即报名
                    </button>
                  )}
                  {activity.registerStatus === 'pending' && (
                    <span className="px-3 py-1 bg-yellow-50 text-yellow-600 rounded-lg text-xs font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      审核中
                    </span>
                  )}
                  {activity.registerStatus === 'approved' && (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        已通过
                      </span>
                      <button onClick={() => navigate('/social')} className="px-2 py-1 bg-red-50 text-red-500 rounded-lg text-xs hover:bg-red-100 transition-colors">
                        退出
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTenantDashboard = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">欢迎回来，{user?.name} 租户</h1>
            <p className="text-green-100">今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
            <p className="text-sm text-green-100">房屋信息</p>
            <p className="font-medium">1号楼2单元101室</p>
            <p className="text-xs text-green-200">租约至 2026-12-31</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => navigate('/workorder')} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <span className="text-gray-700 font-medium block">维修报修</span>
          <span className="text-xs text-gray-400">设施故障上报</span>
        </button>
        <button onClick={() => navigate('/access')} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all group">
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <span className="text-gray-700 font-medium block">通行权限</span>
          <span className="text-xs text-gray-400">查看/申请通行</span>
        </button>
        <button onClick={() => navigate('/mall')} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all group">
          <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <span className="text-gray-700 font-medium block">生活服务</span>
          <span className="text-xs text-gray-400">周边商户优惠</span>
        </button>
        <button onClick={() => navigate('/social')} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all group">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <span className="text-gray-700 font-medium block">邻里互助</span>
          <span className="text-xs text-gray-400">交流/求助/分享</span>
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              我的报修工单
            </h2>
            <button onClick={() => navigate('/workorder')} className="text-xs text-blue-600">查看全部</button>
          </div>
          <div className="divide-y divide-gray-50">
            {workOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">暂无报修记录</div>
            ) : (
              workOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-800">{order.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[order.priority]}`}>
                        {priorityLabels[order.priority]}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{order.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>提交时间: {formatDate(order.created_at)}</span>
                    {order.status === 'processing' && order.assignee_id && (
                      <span className="text-green-600">维修师傅已接单</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              近期社区活动
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {activities.slice(0, 3).map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-800">{activity.title}</h3>
                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                    {activity.participant_count}人参与
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-2 line-clamp-1">{activity.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {getActivityTime(activity.start_time, activity.end_time)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                  <MapPin className="w-3 h-3" />
                  {activity.location}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderVisitorDashboard = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">欢迎访问，{user?.name}</h1>
        <p className="text-purple-100">今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">我的通行证</h2>
              <p className="text-sm text-gray-500">扫码通行，无需等待</p>
            </div>
          </div>
          <div className="flex justify-center p-6 bg-gray-50 rounded-xl">
            <div className="w-40 h-40 bg-white p-2 rounded-lg shadow-sm">
              <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                <QrCode className="w-24 h-24 text-gray-600" />
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">二维码动态刷新，请勿截图</p>
            <p className="text-xs text-gray-400 mt-1">支持蓝牙/NFC感应开门</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">通行方式</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <QrCode className="w-6 h-6 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-800">二维码通行</p>
                <p className="text-xs text-gray-500">对准扫码区域即可</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Camera className="w-6 h-6 text-gray-400" />
              <div className="flex-1">
                <p className="font-medium text-gray-500">人脸识别</p>
                <p className="text-xs text-gray-400">需业主授权后开通</p>
              </div>
              <AlertCircle className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Bluetooth className="w-6 h-6 text-gray-400" />
              <div className="flex-1">
                <p className="font-medium text-gray-500">蓝牙感应</p>
                <p className="text-xs text-gray-400">需业主授权后开通</p>
              </div>
              <AlertCircle className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-purple-500" />
          社区便民服务
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Phone className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm font-medium text-gray-800">紧急呼叫</p>
          </div>
          <div className="text-center p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <MapPin className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm font-medium text-gray-800">园区导航</p>
          </div>
          <div className="text-center p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <ShoppingBag className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm font-medium text-gray-800">周边商家</p>
          </div>
          <div className="text-center p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <HelpCircle className="w-6 h-6 text-orange-500" />
            </div>
            <p className="text-sm font-medium text-gray-800">帮助中心</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPropertyDashboard = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">欢迎回来，{user?.name} 物业管理员</h1>
            <p className="text-orange-100">今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/property/dashboard')} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl px-4 py-2 transition-colors">
              <BarChart3 className="w-5 h-5 inline mr-2" />
              KPI驾驶舱
            </button>
            <button onClick={() => navigate('/risk')} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl px-4 py-2 transition-colors">
              <AlertTriangle className="w-5 h-5 inline mr-2" />
              风险预警
            </button>
          </div>
        </div>
      </div>

      {kpiData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">工单及时率</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{kpiData.workOrderTimelyRate}%</p>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${kpiData.workOrderTimelyRate}%` }} />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">投诉闭环率</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{kpiData.complaintCloseRate}%</p>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${kpiData.complaintCloseRate >= 80 ? 'bg-green-500' : kpiData.complaintCloseRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${kpiData.complaintCloseRate}%` }} />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">设备在线率</span>
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{kpiData.deviceOnlineRate}%</p>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${kpiData.deviceOnlineRate >= 90 ? 'bg-green-500' : kpiData.deviceOnlineRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${kpiData.deviceOnlineRate}%` }} />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">待处理告警</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-600">{alerts.length}</p>
            <p className="text-xs text-gray-400 mt-2">需及时处理</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              待处理工单
            </h2>
            <button onClick={() => navigate('/workorder')} className="text-xs text-blue-600">查看全部</button>
          </div>
          <div className="divide-y divide-gray-50">
            {workOrders.filter(w => w.status === 'pending' || w.status === 'processing').slice(0, 5).map((order) => (
              <div key={order.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[order.priority]}`}>
                      {priorityLabels[order.priority]}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <button className="text-xs text-blue-600 hover:text-blue-700">处理 →</button>
                </div>
                <h3 className="font-medium text-gray-800 mb-1">{order.title}</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    <UserCheck className="w-4 h-4" />
                    报修人: {order.user_name || '业主'}
                  </span>
                  <span className="text-gray-400">{formatDate(order.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              实时告警
            </h2>
            <button onClick={() => navigate('/risk')} className="text-xs text-red-600">处理</button>
          </div>
          <div className="divide-y divide-gray-50">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">暂无待处理告警</div>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium text-gray-800 text-sm">{alert.title}</h3>
                    <StatusBadge status={alert.level} />
                  </div>
                  <p className="text-xs text-gray-500 mb-1 line-clamp-1">{alert.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />
                    {alert.location}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800 text-sm">高空抛物告警</p>
              <p className="text-xs text-red-600 font-medium">1条待处置</p>
            </div>
          </div>
          <button onClick={() => navigate('/risk')} className="w-full py-2 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
            去处置
          </button>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800 text-sm">消防通道占压</p>
              <p className="text-xs text-orange-600 font-medium">1条待复查</p>
            </div>
          </div>
          <button onClick={() => navigate('/property/dashboard')} className="w-full py-2 text-xs bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors">
            去复查
          </button>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Wifi className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800 text-sm">设备离线</p>
              <p className="text-xs text-yellow-600 font-medium">1台待处理</p>
            </div>
          </div>
          <button onClick={() => navigate('/access')} className="w-full py-2 text-xs bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors">
            去处理
          </button>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800 text-sm">异常访客聚类</p>
              <p className="text-xs text-purple-600 font-medium">2条需关注</p>
            </div>
          </div>
          <button onClick={() => navigate('/risk')} className="w-full py-2 text-xs bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors">
            去核实
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">风险处置与复查</h2>
              <p className="text-sm text-gray-500">完整链路：告警产生 → 现场处置 → 填写记录 → 主管复查</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/property/dashboard')} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              查看KPI驾驶舱
            </button>
            <button onClick={() => navigate('/risk')} className="px-4 py-2 bg-white text-gray-700 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              风险预警中心
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-600">1</p>
            <p className="text-xs text-gray-500 mt-1">待处置</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">1</p>
            <p className="text-xs text-gray-500 mt-1">处理中</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">1</p>
            <p className="text-xs text-gray-500 mt-1">待复查</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">3</p>
            <p className="text-xs text-gray-500 mt-1">已完成</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <button onClick={() => navigate('/workorder')} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all text-left">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">工单管理</h3>
              <p className="text-sm text-gray-500">派单、接单、进度追踪、服务评价</p>
            </div>
          </div>
        </button>
        <button onClick={() => navigate('/access')} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all text-left">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
              <Camera className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">通行管理</h3>
              <p className="text-sm text-gray-500">设备状态、通行记录、访客管理</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const renderMerchantDashboard = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">欢迎回来，{user?.name} 商户管理员</h1>
            <p className="text-orange-100">今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
          </div>
          <button onClick={() => navigate('/merchant/dashboard')} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl px-4 py-2 transition-colors">
            <Store className="w-5 h-5 inline mr-2" />
            经营分析
          </button>
        </div>
      </div>

      {merchantStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <ShoppingCart className="w-4 h-4" />
              今日订单
            </div>
            <p className="text-2xl font-bold text-gray-800">{merchantStats.orderCount || 0}</p>
            <p className="text-xs text-green-600 mt-1">↑ 12% 较昨日</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <DollarSign className="w-4 h-4" />
              今日销售额
            </div>
            <p className="text-2xl font-bold text-gray-800">¥{merchantStats.totalRevenue?.toLocaleString() || 0}</p>
            <p className="text-xs text-green-600 mt-1">↑ 8% 较昨日</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Tag className="w-4 h-4" />
              核销转化率
            </div>
            <p className="text-2xl font-bold text-gray-800">{merchantStats.conversionRate || 0}%</p>
            <p className="text-xs text-green-600 mt-1">↑ 5% 较上周</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Repeat className="w-4 h-4" />
              复购频次
            </div>
            <p className="text-2xl font-bold text-gray-800">{merchantStats.repeatPurchaseRate || 0}%</p>
            <p className="text-xs text-green-600 mt-1">↑ 3% 较上月</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <button onClick={() => navigate('/mall')} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-amber-200 transition-all text-left">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
              <Package className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">商品管理</h3>
              <p className="text-sm text-gray-500">上下架、库存、价格调整</p>
            </div>
          </div>
        </button>
        <button onClick={() => navigate('/mall')} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all text-left">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-7 h-7 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">优惠券管理</h3>
              <p className="text-sm text-gray-500">发放、核销、统计分析</p>
            </div>
          </div>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            商户评级
          </h2>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
            <span className="ml-2 font-semibold text-amber-600">4.8</span>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">A</p>
              <p className="text-sm text-gray-500">资质等级</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">资质审核状态</span>
                <StatusBadge status="approved" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">累计订单</span>
                <span className="font-medium">{merchantStats?.orderCount || 0} 单</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">月均营收</span>
                <span className="font-medium text-green-600">¥{(merchantStats?.totalRevenue || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-800">今日核销流水</h2>
          </div>
          <button onClick={() => navigate('/merchant/dashboard')} className="text-xs text-green-600 hover:text-green-700">
            查看全部 →
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { user: '张先生', coupon: '满100减20优惠券', amount: '¥80.00', time: '10:30' },
            { user: '王女士', coupon: '新人专享8折券', amount: '¥128.00', time: '11:15' },
            { user: '李先生', coupon: '会员积分抵扣', amount: '¥150.00', time: '14:20' },
          ].map((item, index) => (
            <div key={index} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{item.user}</p>
                  <p className="text-xs text-gray-500">{item.coupon}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-800 text-sm">{item.amount}</p>
                <p className="text-xs text-gray-400">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <button onClick={() => navigate('/merchant/dashboard')} className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-6 shadow-sm hover:shadow-md transition-all text-white text-left">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">经营分析</h3>
              <p className="text-sm text-white/80">销售趋势、商品排行、核销统计</p>
            </div>
          </div>
        </button>
        <button onClick={() => navigate('/mall')} className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 shadow-sm hover:shadow-md transition-all text-white text-left">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">会员管理</h3>
              <p className="text-sm text-white/80">会员列表、等级权益、积分管理</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-6 border border-indigo-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              user?.role === 'owner' ? 'bg-blue-500' :
              user?.role === 'tenant' ? 'bg-green-500' :
              user?.role === 'visitor' ? 'bg-purple-500' :
              user?.role === 'property' ? 'bg-red-500' : 'bg-orange-500'
            }`}>
              {user?.role === 'owner' && <UserCheck className="w-8 h-8 text-white" />}
              {user?.role === 'tenant' && <Users className="w-8 h-8 text-white" />}
              {user?.role === 'visitor' && <Users className="w-8 h-8 text-white" />}
              {user?.role === 'property' && <Building2 className="w-8 h-8 text-white" />}
              {user?.role === 'merchant' && <Store className="w-8 h-8 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-800">{user?.name}</h2>
                <span className={`px-3 py-0.5 rounded-full text-sm font-medium ${
                  user?.role === 'owner' ? 'bg-blue-100 text-blue-700' :
                  user?.role === 'tenant' ? 'bg-green-100 text-green-700' :
                  user?.role === 'visitor' ? 'bg-purple-100 text-purple-700' :
                  user?.role === 'property' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {roleNames[user?.role || '']}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {user?.role === 'owner' && '权限：房产管理 · 通行控制 · 工单服务 · 商圈消费 · 邻里社交 · 个人中心'}
                {user?.role === 'tenant' && '权限：通行控制 · 工单服务 · 商圈消费 · 邻里社交 · 个人中心'}
                {user?.role === 'visitor' && '权限：通行控制 · 商圈消费 · 个人中心'}
                {user?.role === 'property' && '权限：工作台 · 通行管理 · 工单中心 · KPI驾驶舱 · 风险预警 · 商户审核'}
                {user?.role === 'merchant' && '权限：工作台 · 商户后台 · 订单管理 · 经营分析 · 个人中心'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">快速切换角色：</span>
            <div className="flex gap-2">
              {[
                { role: 'owner', label: '业主', color: 'bg-blue-500' },
                { role: 'tenant', label: '租户', color: 'bg-green-500' },
                { role: 'visitor', label: '访客', color: 'bg-purple-500' },
                { role: 'property', label: '物业', color: 'bg-red-500' },
                { role: 'merchant', label: '商户', color: 'bg-orange-500' },
              ].map((item) => (
                <button
                  key={item.role}
                  onClick={() => {
                    const event = new CustomEvent('switchRole', { detail: item.role });
                    window.dispatchEvent(event);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    user?.role === item.role
                      ? `${item.color} text-white shadow-md`
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {user?.role === 'owner' && renderOwnerDashboard()}
      {user?.role === 'tenant' && renderTenantDashboard()}
      {user?.role === 'visitor' && renderVisitorDashboard()}
      {user?.role === 'property' && renderPropertyDashboard()}
      {user?.role === 'merchant' && renderMerchantDashboard()}
    </div>
  );
};

export default Dashboard;
