import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, RefreshCw, AlertTriangle, Wrench, Clock, CheckCircle, XCircle, Plus, MessageSquare } from 'lucide-react';
import { setCurrentPage } from '../lib/appState';
import api from '../lib/api';
import dayjs from 'dayjs';

export default function AdminWorkOrders() {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'repair',
    priority: 'medium',
    charger_id: '',
    gun_id: '',
  });

  useEffect(() => {
    loadWorkOrders();
  }, [statusFilter]);

  const loadWorkOrders = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : undefined;
      const data = await api.operations.workOrders(params);
      setWorkOrders(data.work_orders);
    } catch (err) {
      console.error('Load work orders failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      alert('请输入工单标题');
      return;
    }

    try {
      const submitData: any = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
      };
      if (formData.charger_id) submitData.charger_id = parseInt(formData.charger_id);
      if (formData.gun_id) submitData.gun_id = parseInt(formData.gun_id);

      await api.operations.createWorkOrder(submitData);
      alert('工单创建成功');
      setShowCreateModal(false);
      setFormData({ title: '', description: '', type: 'repair', priority: 'medium', charger_id: '', gun_id: '' });
      loadWorkOrders();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateStatus = async (id: number, status: string, remark?: string) => {
    setActionLoading(id);
    try {
      await api.operations.updateWorkOrder(id, { status, remark });
      alert('状态已更新');
      loadWorkOrders();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
    };
    const labels: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      resolved: '已解决',
      closed: '已关闭',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
      critical: '紧急',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority] || 'bg-gray-100 text-gray-700'}`}>
        {labels[priority] || priority}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'repair':
        return <Wrench className="w-4 h-4 text-orange-500" />;
      case 'maintenance':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'inspection':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredOrders = workOrders.filter(w =>
    w.title.includes(searchText) ||
    w.order_no.includes(searchText) ||
    (w.station_name && w.station_name.includes(searchText))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentPage('admin-dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="font-bold text-gray-800 text-lg">工单管理</h1>
              <p className="text-sm text-gray-500">设备故障和维护工单处理</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            创建工单
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {[
              { value: '', label: '全部', count: workOrders.length },
              { value: 'pending', label: '待处理', count: workOrders.filter(w => w.status === 'pending').length },
              { value: 'processing', label: '处理中', count: workOrders.filter(w => w.status === 'processing').length },
              { value: 'resolved', label: '已解决', count: workOrders.filter(w => w.status === 'resolved').length },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${statusFilter === tab.value ? 'text-green-600 border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
                <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜索工单号、标题或站点..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-300 outline-none"
              />
            </div>
            <button
              onClick={loadWorkOrders}
              className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      {getTypeIcon(order.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800">{order.title}</span>
                        {getPriorityBadge(order.priority)}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span className="font-mono text-xs">{order.order_no}</span>
                        <span>·</span>
                        <span>{order.station_name || '未关联站点'}</span>
                        {order.charger_sn && (
                          <>
                            <span>·</span>
                            <span>桩 {order.charger_sn}</span>
                          </>
                        )}
                        {order.gun_no && (
                          <>
                            <span>·</span>
                            <span>{order.gun_no}号枪</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {order.description && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                    {order.description}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {dayjs(order.created_at).format('MM-DD HH:mm')}
                    </span>
                    {order.assignee_name && (
                      <span>处理人：{order.assignee_name}</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'processing')}
                          disabled={actionLoading === order.id}
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          开始处理
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'closed', '无需处理')}
                          disabled={actionLoading === order.id}
                          className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          关闭
                        </button>
                      </>
                    )}
                    {order.status === 'processing' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'resolved')}
                          disabled={actionLoading === order.id}
                          className="px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          标记解决
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'pending')}
                          disabled={actionLoading === order.id}
                          className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          挂起
                        </button>
                      </>
                    )}
                    {order.status === 'resolved' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'closed')}
                        disabled={actionLoading === order.id}
                        className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        关闭工单
                      </button>
                    )}
                    <button className="px-3 py-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredOrders.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500">暂无工单</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-gray-800 mb-4">创建工单</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">工单标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入工单标题"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">工单类型</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-300 outline-none"
                >
                  <option value="repair">故障维修</option>
                  <option value="maintenance">定期维护</option>
                  <option value="inspection">设备巡检</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-300 outline-none"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="critical">紧急</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">关联充电桩ID</label>
                <input
                  type="number"
                  value={formData.charger_id}
                  onChange={(e) => setFormData({ ...formData, charger_id: e.target.value })}
                  placeholder="选填，充电桩ID"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">关联充电枪ID</label>
                <input
                  type="number"
                  value={formData.gun_id}
                  onChange={(e) => setFormData({ ...formData, gun_id: e.target.value })}
                  placeholder="选填，充电枪ID"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">问题描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请详细描述问题"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-300 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
