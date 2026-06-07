import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workOrderApi } from '../utils/api';
import {
  WO_TYPE_MAP, WO_TYPE_COLOR,
  WO_STATUS_MAP, WO_STATUS_COLOR,
  WO_PRIORITY_MAP, WO_PRIORITY_COLOR,
  formatDateTime
} from '../utils/constants';
import {
  ClipboardList, Plus, Filter, AlertTriangle, Clock,
  CheckCircle2, Play, User, MapPin
} from 'lucide-react';

const WorkOrderList: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newOrder, setNewOrder] = useState({
    type: 'repair',
    propertyId: 4,
    description: '',
    priority: 'normal'
  });

  useEffect(() => { loadOrders(); }, [page, typeFilter, statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await workOrderApi.list(params);
      setOrders(res.list);
      setTotal(res.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!newOrder.description) { alert('请填写工单描述'); return; }
    try {
      await workOrderApi.create(newOrder);
      setShowCreate(false);
      setNewOrder({ type: 'repair', propertyId: 4, description: '', priority: 'normal' });
      loadOrders();
    } catch (e: any) { alert(e.message); }
  };

  const stats = [
    { label: '待处理', value: orders.filter(o => o.status !== 'completed').length, color: 'text-accent-600', bg: 'bg-accent-50' },
    { label: '紧急', value: orders.filter(o => o.priority === 'urgent' && o.status !== 'completed').length, color: 'text-red-600', bg: 'bg-red-50' },
    { label: '处理中', value: orders.filter(o => o.status === 'in_progress').length, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '已完成', value: orders.filter(o => o.status === 'completed').length, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '已超时', value: orders.filter(o => o.isOverdue).length, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">服务工单</h2>
          <p className="text-sm text-gray-500">保洁、维修、搬家、装修工单管理与SLA时效考核</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建工单
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm">
            <div className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-5 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">类型：</span>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setTypeFilter('')} className={`px-3 py-1 text-sm rounded-lg ${!typeFilter ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>全部</button>
            {Object.entries(WO_TYPE_MAP).map(([k, v]) => (
              <button key={k} onClick={() => setTypeFilter(k)} className={`px-3 py-1 text-sm rounded-lg ${typeFilter === k ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{v}</button>
            ))}
          </div>
        </div>
        <div className="h-6 w-px bg-gray-200" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">状态：</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
            <option value="">全部</option>
            {Object.entries(WO_STATUS_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">新建工单</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">工单类型</label>
                <select value={newOrder.type} onChange={e => setNewOrder({ ...newOrder, type: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {Object.entries(WO_TYPE_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">关联房源ID</label>
                <input type="number" value={newOrder.propertyId} onChange={e => setNewOrder({ ...newOrder, propertyId: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                <select value={newOrder.priority} onChange={e => setNewOrder({ ...newOrder, priority: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {Object.entries(WO_PRIORITY_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">问题描述</label>
                <textarea value={newOrder.description} onChange={e => setNewOrder({ ...newOrder, description: e.target.value })} rows={3} placeholder="请详细描述问题" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">创建</button>
            </div>
          </div>
        </div>
      )}

      {/* Orders list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map(o => (
          <div
            key={o.id}
            onClick={() => navigate(`/work-orders/${o.id}`)}
            className={`bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all border-l-4 ${
              o.isOverdue ? 'border-red-500' :
              o.priority === 'urgent' ? 'border-red-400' :
              o.priority === 'high' ? 'border-orange-400' :
              o.status === 'completed' ? 'border-green-400' :
              'border-primary-500'
            }`}
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${WO_TYPE_COLOR[o.type]}`}>
                    {WO_TYPE_MAP[o.type]}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${WO_PRIORITY_COLOR[o.priority]}`}>
                    {WO_PRIORITY_MAP[o.priority]}
                  </span>
                </div>
                {o.isOverdue && o.status !== 'completed' && (
                  <span className="text-xs text-red-600 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> 已超时 {Math.abs(o.remainingHours)}小时
                  </span>
                )}
              </div>

              <h4 className="font-medium text-gray-800 mb-2 line-clamp-2">{o.description}</h4>

              <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{o.property_name || o.address}</span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                {o.reporter_name && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <User className="w-3 h-3" />
                    <span>{o.reporter_name}</span>
                  </div>
                )}
                {o.assignee_name && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Play className="w-3 h-3" />
                    <span>{o.assignee_name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 text-xs rounded-full ${WO_STATUS_COLOR[o.status]}`}>
                  {WO_STATUS_MAP[o.status]}
                </span>
                {o.status !== 'completed' && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span className={o.remainingHours < 4 ? 'text-red-600' : ''}>
                      {o.remainingHours > 0 ? `剩余 ${o.remainingHours} 小时` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* SLA progress */}
              {o.status !== 'completed' && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>SLA时效</span>
                    <span>{o.sla_hours} 小时</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        o.isOverdue ? 'bg-red-500' :
                        o.remainingHours < o.sla_hours * 0.25 ? 'bg-accent-500' :
                        'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(0, 100 - (Math.abs(o.remainingHours) / o.sla_hours * 100)))}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!loading && orders.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center">
          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <div className="text-gray-500">暂无工单</div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderList;
