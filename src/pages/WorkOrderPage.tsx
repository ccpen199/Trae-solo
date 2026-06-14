import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Eye, Clock, User, MapPin, Star, Upload, X, ChevronRight, MessageSquare,
  AlertTriangle, CheckCircle, History, Home, FileText, Zap, Award,
  Filter, Search, Download, RefreshCw, Bell, Phone, ThumbsUp, ThumbsDown,
  Wrench, HelpCircle, Info, UserCheck
} from 'lucide-react';
import { workOrderApi } from '@/api';
import StatusBadge from '@/components/common/StatusBadge';
import { useAuthStore } from '@/store';
import type { WorkOrder, WorkOrderType, WorkOrderPriority, WorkOrderStatus, House } from '@shared/types';

interface WorkOrderWithExtra extends WorkOrder {
  user_name?: string;
  assignee_name?: string;
  assignee_phone?: string;
  house?: House;
  expected_time?: string;
  sla_warning?: boolean;
}

interface WorkOrderLog {
  id: number;
  work_order_id: number;
  operator_id: number;
  operator_name?: string;
  status: string;
  remark?: string;
  created_at: string;
}

interface WorkOrderEvaluation {
  id: number;
  work_order_id: number;
  rating: number;
  timelyRating?: number;
  attitudeRating?: number;
  qualityRating?: number;
  comment?: string;
  created_at: string;
}

const typeMap: Record<string, string> = {
  repair: '报修',
  complaint: '投诉',
  suggestion: '建议',
  consultation: '咨询',
  other: '其他',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600 border-gray-200',
  medium: 'bg-blue-100 text-blue-600 border-blue-200',
  high: 'bg-orange-100 text-orange-600 border-orange-200',
  urgent: 'bg-red-100 text-red-600 border-red-200',
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

const statusFilterOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'completed', label: '已完成' },
  { value: 'closed', label: '已关闭' },
];

const typeFilterOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'repair', label: '报修' },
  { value: 'complaint', label: '投诉' },
  { value: 'consultation', label: '咨询' },
  { value: 'suggestion', label: '建议' },
  { value: 'other', label: '其他' },
];

const typeOptions = [
  { value: 'repair', label: '报修' },
  { value: 'complaint', label: '投诉' },
  { value: 'suggestion', label: '建议' },
  { value: 'consultation', label: '咨询' },
];

const priorityOptions = [
  { value: 'low', label: '低 - 24小时内响应' },
  { value: 'medium', label: '中 - 12小时内响应' },
  { value: 'high', label: '高 - 4小时内响应' },
  { value: 'urgent', label: '紧急 - 30分钟内响应' },
];

const statusSteps = [
  { key: 'pending', label: '待处理', icon: Clock },
  { key: 'assigned', label: '已接单', icon: User },
  { key: 'processing', label: '处理中', icon: Zap },
  { key: 'completed', label: '已完成', icon: CheckCircle },
  { key: 'closed', label: '已关闭', icon: Award },
];

export default function WorkOrderPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isProperty = user?.role === 'property';

  const [activeTab, setActiveTab] = useState<string>(isProperty ? 'all' : 'my');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [workOrders, setWorkOrders] = useState<WorkOrderWithExtra[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    slaWarning: 0,
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderWithExtra | null>(null);
  const [workOrderLogs, setWorkOrderLogs] = useState<WorkOrderLog[]>([]);
  const [workOrderEvaluation, setWorkOrderEvaluation] = useState<WorkOrderEvaluation | null>(null);
  const [relatedOrders, setRelatedOrders] = useState<WorkOrder[]>([]);

  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    type: 'repair' as WorkOrderType,
    priority: 'medium' as WorkOrderPriority,
    location: '',
    images: [] as string[],
  });

  const [evaluationForm, setEvaluationForm] = useState({
    rating: 5,
    comment: '',
    timelyRating: 5,
    attitudeRating: 5,
    qualityRating: 5,
  });

  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchWorkOrders();
  }, [activeTab, statusFilter, typeFilter]);

  const fetchWorkOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { status?: string; type?: string; limit?: number; offset?: number } = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;

      const response = await workOrderApi.getWorkOrders(params);
      if (response.success) {
        const orders = response.data.workOrders || [];
        setWorkOrders(orders);
        setStats({
          total: orders.length,
          pending: orders.filter((o: WorkOrder) => o.status === 'pending').length,
          processing: orders.filter((o: WorkOrder) => o.status === 'processing' || o.status === 'assigned').length,
          completed: orders.filter((o: WorkOrder) => o.status === 'completed' || o.status === 'closed').length,
          slaWarning: orders.filter((o: WorkOrder) => o.priority === 'urgent' && o.status === 'pending').length,
        });
      } else {
        setError(response.error || '获取工单列表失败');
      }
    } catch (err) {
      setError('获取工单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkOrderDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const response = await workOrderApi.getWorkOrderDetail(id);
      if (response.success) {
        setSelectedWorkOrder(response.data.workOrder);
        setWorkOrderLogs(response.data.logs || []);
        setWorkOrderEvaluation(response.data.evaluation || null);
        setRelatedOrders(response.data.relatedOrders || []);
        setShowDetailModal(true);
      }
    } catch (err) {
      console.error('获取工单详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await workOrderApi.createWorkOrder(createForm);
      if (response.success) {
        setShowCreateModal(false);
        setCreateForm({
          title: '',
          description: '',
          type: 'repair',
          priority: 'medium',
          location: '',
          images: [],
        });
        fetchWorkOrders();
      }
    } catch (err) {
      console.error('创建工单失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (status: WorkOrderStatus, remark?: string) => {
    if (!selectedWorkOrder) return;
    setActionLoading(true);
    try {
      const response = await workOrderApi.updateWorkOrderStatus(selectedWorkOrder.id, { status, remark });
      if (response.success) {
        fetchWorkOrderDetail(selectedWorkOrder.id);
        fetchWorkOrders();
      }
    } catch (err) {
      console.error('更新状态失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkOrder) return;
    setActionLoading(true);
    try {
      const response = await workOrderApi.evaluateWorkOrder(selectedWorkOrder.id, evaluationForm);
      if (response.success) {
        fetchWorkOrderDetail(selectedWorkOrder.id);
        fetchWorkOrders();
        setEvaluationForm({ rating: 5, comment: '', timelyRating: 5, attitudeRating: 5, qualityRating: 5 });
      }
    } catch (err) {
      console.error('评价失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImageUpload = () => {
    const mockImages = [
      'https://picsum.photos/200/200?random=' + Date.now(),
      ...createForm.images,
    ].slice(0, 9);
    setCreateForm({ ...createForm, images: mockImages });
  };

  const removeImage = (index: number) => {
    const newImages = createForm.images.filter((_, i) => i !== index);
    setCreateForm({ ...createForm, images: newImages });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSLAStatus = (order: WorkOrderWithExtra) => {
    if (order.status !== 'pending') return null;
    const created = new Date(order.created_at).getTime();
    const now = Date.now();
    const hours = (now - created) / (1000 * 60 * 60);
    
    if (order.priority === 'urgent' && hours > 0.5) return { label: '已超时', color: 'text-red-600 bg-red-50' };
    if (order.priority === 'high' && hours > 4) return { label: '已超时', color: 'text-red-600 bg-red-50' };
    if (order.priority === 'medium' && hours > 12) return { label: '已超时', color: 'text-red-600 bg-red-50' };
    if (order.priority === 'low' && hours > 24) return { label: '已超时', color: 'text-red-600 bg-red-50' };
    
    if (order.priority === 'urgent') return { label: '需30分钟内响应', color: 'text-orange-600 bg-orange-50' };
    if (order.priority === 'high') return { label: '需4小时内响应', color: 'text-orange-600 bg-orange-50' };
    return null;
  };

  const getCurrentStep = (status: string) => {
    const idx = statusSteps.findIndex(s => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  const tabs = [
    ...(isProperty ? [{ value: 'all', label: '全部工单' }] : []),
    { value: 'my', label: '我的工单' },
  ];

  const filteredOrders = workOrders.filter(order => {
    if (!searchKeyword) return true;
    const keyword = searchKeyword.toLowerCase();
    return order.title.toLowerCase().includes(keyword) ||
           order.description.toLowerCase().includes(keyword) ||
           order.location.toLowerCase().includes(keyword);
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">物业服务工单中心</h1>
        <p className="text-gray-600">报事报修分级响应、维修进度实时推送、服务评价闭环、历史工单关联房屋档案</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">全部工单</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-500">待处理</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-500">处理中</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-500">已完成</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-500">SLA预警</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.slaWarning}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.value
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索工单标题/位置"
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusFilterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {typeFilterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            创建工单
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-gray-50 rounded-xl">
          <MessageSquare className="w-12 h-12 mb-4 text-gray-300" />
          <p>暂无工单记录</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            + 创建第一个工单
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const slaStatus = getSLAStatus(order);
            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => fetchWorkOrderDetail(order.id)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        order.type === 'repair' ? 'bg-blue-100 text-blue-600' :
                        order.type === 'complaint' ? 'bg-red-100 text-red-600' :
                        order.type === 'suggestion' ? 'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {order.type === 'repair' && <Wrench className="w-6 h-6" />}
                        {order.type === 'complaint' && <AlertTriangle className="w-6 h-6" />}
                        {order.type === 'suggestion' && <ThumbsUp className="w-6 h-6" />}
                        {order.type === 'consultation' && <HelpCircle className="w-6 h-6" />}
                        {order.type === 'other' && <FileText className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-gray-800">{order.title}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${priorityColors[order.priority]}`}>
                            {priorityLabels[order.priority]}优先级
                          </span>
                          {slaStatus && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${slaStatus.color}`}>
                              <AlertTriangle className="w-3 h-3 inline mr-1" />
                              {slaStatus.label}
                            </span>
                          )}
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-1 mb-2">{order.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {order.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {order.user_name || '业主'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(order.created_at)}
                          </span>
                          {order.assignee_name && (
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-green-500" />
                              处理人：{order.assignee_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {statusSteps.map((step, idx) => (
                          <React.Fragment key={step.key}>
                            <div className={`flex flex-col items-center ${idx <= getCurrentStep(order.status) ? 'text-blue-600' : 'text-gray-300'}`}>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                idx <= getCurrentStep(order.status) ? 'bg-blue-100' : 'bg-gray-100'
                              }`}>
                                <step.icon className="w-4 h-4" />
                              </div>
                              <span className="text-xs mt-1 whitespace-nowrap">{step.label}</span>
                            </div>
                            {idx < statusSteps.length - 1 && (
                              <div className={`w-12 h-0.5 mx-1 ${idx < getCurrentStep(order.status) ? 'bg-blue-500' : 'bg-gray-200'}`} />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                      {workOrderEvaluation && (
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= (workOrderEvaluation?.rating || 0)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800">创建工单</h2>
                <p className="text-sm text-gray-500 mt-1">请填写详细信息以便我们更好地为您服务</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkOrder} className="p-6 space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">分级响应机制</p>
                    <ul className="list-disc list-inside space-y-0.5 text-blue-600">
                      <li>紧急：30分钟内响应，如电梯故障、漏水</li>
                      <li>高：4小时内响应，如空调故障、门锁问题</li>
                      <li>中：12小时内响应，如灯具损坏、下水道堵塞</li>
                      <li>低：24小时内响应，如咨询、建议</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">工单标题 *</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请简要描述问题，如：客厅空调不制冷"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">详细描述 *</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                  placeholder="请详细描述问题情况，包括出现时间、具体现象等信息"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">工单类型 *</label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as WorkOrderType })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {typeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">优先级 *</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as WorkOrderPriority })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {priorityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">位置 *</label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={createForm.location}
                    onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例如：1号楼2单元301室客厅"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">图片上传</label>
                <p className="text-xs text-gray-500 mb-2">上传图片可以帮助我们更快了解问题（最多9张）</p>
                <div className="flex flex-wrap gap-2">
                  {createForm.images.map((img, index) => (
                    <div key={index} className="relative">
                      <img src={img} alt="" className="w-20 h-20 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {createForm.images.length < 9 && (
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
                    >
                      <Upload className="w-5 h-5 mb-1" />
                      <span className="text-xs">上传</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? '提交中...' : '提交工单'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedWorkOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800">工单详情</h2>
                <p className="text-sm text-gray-500 mt-1">工单编号: #{selectedWorkOrder.id}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{selectedWorkOrder.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${priorityColors[selectedWorkOrder.priority]}`}>
                          {priorityLabels[selectedWorkOrder.priority]}优先级
                        </span>
                        <StatusBadge status={selectedWorkOrder.status} />
                      </div>
                      <p className="text-gray-600">{selectedWorkOrder.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">SLA响应时效</p>
                      <p className="text-sm font-medium text-blue-600">{prioritySLA[selectedWorkOrder.priority]}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">工单类型</p>
                      <p className="text-sm font-medium text-gray-800">{typeMap[selectedWorkOrder.type] || selectedWorkOrder.type}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">提交时间</p>
                      <p className="text-sm font-medium text-gray-800">{formatDate(selectedWorkOrder.created_at)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">位置</p>
                      <p className="text-sm font-medium text-gray-800">{selectedWorkOrder.location}</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Home className="w-5 h-5 text-blue-500" />
                      关联房屋档案
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-500">房屋地址</span>
                        <span className="text-sm font-medium text-gray-800">1号楼2单元101室</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-500">房屋面积</span>
                        <span className="text-sm font-medium text-gray-800">120㎡</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-500">业主姓名</span>
                        <span className="text-sm font-medium text-gray-800">{selectedWorkOrder.user_name || '张先生'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-500">联系电话</span>
                        <span className="text-sm font-medium text-gray-800">138****8001</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-500">历史工单</span>
                        <span className="text-sm font-medium text-blue-600">{relatedOrders.length} 条</span>
                      </div>
                    </div>
                    {relatedOrders.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-2">最近历史工单</p>
                        <div className="space-y-2">
                          {relatedOrders.slice(0, 3).map((order) => (
                            <div key={order.id} className="p-2 bg-gray-50 rounded-lg text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-700">{order.title}</span>
                                <StatusBadge status={order.status} />
                              </div>
                              <p className="text-xs text-gray-400 mt-1">{formatDate(order.created_at)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-green-500" />
                      处理人员信息
                    </h4>
                    {selectedWorkOrder.assignee_name ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xl">{selectedWorkOrder.assignee_name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{selectedWorkOrder.assignee_name}</p>
                            <p className="text-sm text-gray-500">维修师傅 · 5年经验</p>
                            <div className="flex items-center gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              ))}
                              <span className="text-xs text-gray-500 ml-1">4.9分</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                            <Phone className="w-4 h-4" />
                            电话联系
                          </button>
                          <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium">
                            <MessageSquare className="w-4 h-4" />
                            发送消息
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>暂未分配处理人员</p>
                        <p className="text-xs text-gray-400 mt-1">系统将在15分钟内自动派单</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-purple-500" />
                    处理进度时间线
                  </h4>
                  <div className="relative pl-8">
                    {workOrderLogs.map((log, index) => (
                      <div key={log.id} className="relative pb-6 last:pb-0">
                        <div className="absolute left-[-32px] top-0 flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full ${index === 0 ? 'bg-blue-500 ring-4 ring-blue-100' : 'bg-gray-300'}`} />
                          {index < workOrderLogs.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 mt-1" />
                          )}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">{log.operator_name || '系统'}</span>
                              <StatusBadge status={log.status} />
                            </div>
                            <span className="text-xs text-gray-400">{formatDate(log.created_at)}</span>
                          </div>
                          {log.remark && <p className="text-sm text-gray-600">{log.remark}</p>}
                        </div>
                      </div>
                    ))}
                    {workOrderLogs.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p>暂无处理记录</p>
                      </div>
                    )}
                  </div>
                </div>

                {isProperty && selectedWorkOrder.status !== 'completed' && selectedWorkOrder.status !== 'closed' && (
                  <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h4 className="font-semibold text-gray-800 mb-4">工单操作</h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedWorkOrder.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus('assigned', '已接单，正在安排人员')}
                          disabled={actionLoading}
                          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                        >
                          接单
                        </button>
                      )}
                      {(selectedWorkOrder.status === 'pending' || selectedWorkOrder.status === 'assigned') && (
                        <button
                          onClick={() => handleUpdateStatus('processing', '已到达现场，开始处理')}
                          disabled={actionLoading}
                          className="px-5 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors font-medium"
                        >
                          开始处理
                        </button>
                      )}
                      {(selectedWorkOrder.status === 'processing' || selectedWorkOrder.status === 'assigned') && (
                        <button
                          onClick={() => handleUpdateStatus('completed', '处理完成，请用户验收')}
                          disabled={actionLoading}
                          className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                        >
                          处理完成
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {selectedWorkOrder.status === 'completed' && !workOrderEvaluation && !isProperty && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-5">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500" />
                      服务评价
                    </h4>
                    <form onSubmit={handleEvaluate} className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">响应速度</p>
                          <div className="flex justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setEvaluationForm({ ...evaluationForm, timelyRating: star })}
                                className="p-1"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    star <= evaluationForm.timelyRating
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">服务态度</p>
                          <div className="flex justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setEvaluationForm({ ...evaluationForm, attitudeRating: star })}
                                className="p-1"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    star <= evaluationForm.attitudeRating
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">处理质量</p>
                          <div className="flex justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setEvaluationForm({ ...evaluationForm, qualityRating: star })}
                                className="p-1"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    star <= evaluationForm.qualityRating
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="text-center py-2">
                        <p className="text-sm text-gray-600 mb-2">综合评分</p>
                        <div className="flex justify-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setEvaluationForm({ ...evaluationForm, rating: star })}
                              className="p-1"
                            >
                              <Star
                                className={`w-8 h-8 ${
                                  star <= evaluationForm.rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {evaluationForm.rating === 5 ? '非常满意' :
                           evaluationForm.rating === 4 ? '满意' :
                           evaluationForm.rating === 3 ? '一般' :
                           evaluationForm.rating === 2 ? '不满意' : '非常不满意'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">评价内容（选填）</label>
                        <textarea
                          value={evaluationForm.comment}
                          onChange={(e) => setEvaluationForm({ ...evaluationForm, comment: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                          placeholder="请分享您的服务体验..."
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors font-medium"
                        >
                          {actionLoading ? '提交中...' : '提交评价'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {workOrderEvaluation && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-5">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-green-500" />
                      用户已评价
                    </h4>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">响应速度</p>
                        <div className="flex justify-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= (workOrderEvaluation.timelyRating || workOrderEvaluation.rating)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">服务态度</p>
                        <div className="flex justify-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= (workOrderEvaluation.attitudeRating || workOrderEvaluation.rating)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">处理质量</p>
                        <div className="flex justify-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= (workOrderEvaluation.qualityRating || workOrderEvaluation.rating)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="text-sm text-gray-600">综合评分：</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= workOrderEvaluation.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-gray-800">{workOrderEvaluation.rating}分</span>
                    </div>
                    {workOrderEvaluation.comment && (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-gray-700">{workOrderEvaluation.comment}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-3 text-right">
                      评价时间：{formatDate(workOrderEvaluation.created_at)}
                    </p>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    关闭
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
