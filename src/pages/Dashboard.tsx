import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, FileText, KeyRound, ShoppingBag, Users, Calendar, ChevronRight,
  Camera, QrCode, Bluetooth, Wifi, Clock, CheckCircle, AlertCircle,
  BarChart3, Store, AlertTriangle, TrendingUp, DollarSign, Trophy,
  Wrench, MessageSquare, HelpCircle, MapPin, Phone, Star, Tag,
  Heart, Share2, UserCheck, Package, CreditCard, Award, Zap,
  ShoppingCart, Repeat
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
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {workOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">暂无工单记录</div>
            ) : (
              workOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[order.priority]}`}>
                        {priorityLabels[order.priority]}优先级
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(order.created_at)}</span>
                  </div>
                  <h3 className="font-medium text-gray-800 mb-1">{order.title}</h3>
                  <p className="text-sm text-gray-500 mb-2 line-clamp-1">{order.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {order.location}
                    </span>
                    {order.status === 'completed' && !order.assignee_id && (
                      <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                        去评价 →
                      </button>
                    )}
                    {order.status === 'processing' && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        处理中，预计2小时内完成
                      </span>
                    )}
                  </div>
                </div>
              ))
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
          {activities.slice(0, 3).map((activity) => (
            <div key={activity.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-32 bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                <Calendar className="w-12 h-12 text-white/80" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{activity.title}</h3>
                  <StatusBadge status={activity.status} />
                </div>
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{activity.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <MapPin className="w-3 h-3" />
                  {activity.location}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500">{activity.participant_count}人已报名</span>
                  <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                    立即报名
                  </button>
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
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {user?.role === 'owner' && renderOwnerDashboard()}
      {user?.role === 'tenant' && renderTenantDashboard()}
      {user?.role === 'visitor' && renderVisitorDashboard()}
      {user?.role === 'property' && renderPropertyDashboard()}
      {user?.role === 'merchant' && renderMerchantDashboard()}
    </div>
  );
};

export default Dashboard;
