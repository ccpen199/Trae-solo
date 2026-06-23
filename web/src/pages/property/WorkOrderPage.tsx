import { useState, useEffect } from 'react';
import { workorderApi, adminApi } from '../../api';
import type { WorkOrder, User, WorkOrderStatus } from '../../types';

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待派单', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  assigned: { label: '已派单', color: 'text-blue-600', bg: 'bg-blue-50' },
  processing: { label: '处理中', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  resolved: { label: '已解决', color: 'text-green-600', bg: 'bg-green-50' },
  closed: { label: '已关闭', color: 'text-gray-500', bg: 'bg-gray-100' }
};

const priorityMap: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: '低', color: 'text-gray-600', bg: 'bg-gray-50' },
  medium: { label: '中', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  high: { label: '高', color: 'text-orange-600', bg: 'bg-orange-50' },
  urgent: { label: '紧急', color: 'text-red-600', bg: 'bg-red-50' }
};

const typeMap: Record<string, string> = {
  repair: '故障报修',
  maintenance: '保养维护',
  complaint: '投诉建议'
};

const tabs = [
  { key: 'all', label: '全部', filter: undefined },
  { key: 'pending', label: '待派单', filter: 'pending' },
  { key: 'processing', label: '处理中', filter: undefined, custom: (w: WorkOrder) => w.status === 'assigned' || w.status === 'processing' },
  { key: 'done', label: '已完成', filter: undefined, custom: (w: WorkOrder) => w.status === 'resolved' || w.status === 'closed' }
];

const WorkOrderPage = () => {
  const [workorders, setWorkorders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [propertyUsers, setPropertyUsers] = useState<User[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [woRes, usersRes] = await Promise.all([
        workorderApi.list({ pageSize: 200 }),
        adminApi.getUsers({ role: 'property', pageSize: 100 })
      ]);
      setWorkorders(woRes.items || []);
      setPropertyUsers(usersRes || []);
    } catch (error) {
      console.error('加载数据失败', error);
      alert('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredWorkorders = () => {
    const tab = tabs.find(t => t.key === activeTab);
    if (!tab) return workorders;
    if (tab.custom) return workorders.filter(tab.custom);
    if (tab.filter) return workorders.filter(w => w.status === tab.filter);
    return workorders;
  };

  const handleAssign = async (workorderId: string) => {
    if (!selectedAssignee) {
      alert('请选择处理人员');
      return;
    }
    setActionLoading(`assign-${workorderId}`);
    try {
      await workorderApi.assign(workorderId, selectedAssignee);
      alert('派单成功');
      setAssigningId(null);
      setSelectedAssignee('');
      loadAllData();
    } catch (error) {
      alert('派单失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (id: string, status: WorkOrderStatus) => {
    const statusLabel = statusMap[status]?.label || status;
    if (!confirm(`确认将工单状态更新为【${statusLabel}】？`)) return;
    setActionLoading(`update-${id}-${status}`);
    try {
      await workorderApi.update(id, { status });
      alert('状态更新成功');
      loadAllData();
    } catch (error) {
      alert('状态更新失败');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredWorkorders = getFilteredWorkorders();

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">工单管理</h1>
        <button
          onClick={loadAllData}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          🔄 刷新
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap bg-white p-2 rounded-xl shadow-sm w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-primary-500 text-white shadow'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : filteredWorkorders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-gray-400">暂无工单</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">工单ID</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">设备</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">描述</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">类型</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">优先级</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">状态</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">创建人</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">处理人</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">创建时间</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkorders.map((wo) => {
                  const status = statusMap[wo.status] || statusMap.closed;
                  const priority = priorityMap[wo.priority] || priorityMap.medium;
                  return (
                    <tr key={wo.id} className="border-b border-gray-50 hover:bg-gray-50 align-top">
                      <td className="px-6 py-4 font-mono text-xs text-gray-600 whitespace-nowrap">
                        {wo.id.slice(0, 10)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                        {wo.deviceName || wo.deviceId.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                        <div className="line-clamp-2">{wo.description}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {typeMap[wo.type] || wo.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${priority.bg} ${priority.color}`}>
                          {priority.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {wo.reporterName || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {wo.handlerName || '-'}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(wo.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          {wo.status === 'pending' && (
                            <>
                              {assigningId === wo.id ? (
                                <div className="flex flex-col gap-2">
                                  <select
                                    value={selectedAssignee}
                                    onChange={(e) => setSelectedAssignee(e.target.value)}
                                    className="px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-primary-500 outline-none"
                                  >
                                    <option value="">选择处理人员</option>
                                    {propertyUsers.map(u => (
                                      <option key={u.id} value={u.id}>{u.nickname || u.phone}</option>
                                    ))}
                                  </select>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleAssign(wo.id)}
                                      disabled={actionLoading !== null}
                                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                    >
                                      {actionLoading === `assign-${wo.id}` ? '处理中' : '确认派单'}
                                    </button>
                                    <button
                                      onClick={() => { setAssigningId(null); setSelectedAssignee(''); }}
                                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                                    >
                                      取消
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setAssigningId(wo.id)}
                                  className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 whitespace-nowrap"
                                >
                                  📤 派单
                                </button>
                              )}
                            </>
                          )}

                          {(wo.status === 'assigned' || wo.status === 'processing') && (
                            <div className="flex flex-col gap-1">
                              {wo.status === 'assigned' && (
                                <button
                                  onClick={() => handleUpdateStatus(wo.id, 'processing')}
                                  disabled={actionLoading !== null}
                                  className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 disabled:opacity-50 whitespace-nowrap"
                                >
                                  {actionLoading === `update-${wo.id}-processing` ? '处理中...' : '标记处理中'}
                                </button>
                              )}
                              <button
                                onClick={() => handleUpdateStatus(wo.id, 'resolved')}
                                disabled={actionLoading !== null}
                                className="px-3 py-1.5 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 disabled:opacity-50 whitespace-nowrap"
                              >
                                {actionLoading === `update-${wo.id}-resolved` ? '处理中...' : '标记已解决'}
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(wo.id, 'closed')}
                                disabled={actionLoading !== null}
                                className="px-3 py-1.5 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100 disabled:opacity-50 whitespace-nowrap"
                              >
                                {actionLoading === `update-${wo.id}-closed` ? '处理中...' : '关闭工单'}
                              </button>
                            </div>
                          )}

                          {(wo.status === 'resolved' || wo.status === 'closed') && (
                            <span className="text-xs text-gray-400">已完结</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderPage;
