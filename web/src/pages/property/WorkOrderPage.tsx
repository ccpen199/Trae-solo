import { useState, useEffect } from 'react';
import { workorderApi } from '../../api';
import type { WorkOrder } from '../../types';

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: '待处理', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  in_progress: { label: '处理中', color: 'text-blue-600', bg: 'bg-blue-50' },
  resolved: { label: '已解决', color: 'text-green-600', bg: 'bg-green-50' },
  closed: { label: '已关闭', color: 'text-gray-500', bg: 'bg-gray-100' }
};

const priorityMap: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: '高', color: 'text-red-600', bg: 'bg-red-50' },
  medium: { label: '中', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  low: { label: '低', color: 'text-green-600', bg: 'bg-green-50' }
};

const WorkOrderPage = () => {
  const [workorders, setWorkorders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkorder, setNewWorkorder] = useState({
    title: '',
    description: '',
    deviceId: '',
    priority: 'medium'
  });

  useEffect(() => {
    loadWorkorders();
  }, [filterStatus]);

  const loadWorkorders = async () => {
    setLoading(true);
    try {
      const res = await workorderApi.list({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        pageSize: 100
      });
      setWorkorders(res.items);
    } catch (error) {
      console.error('加载工单列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newWorkorder.title || !newWorkorder.description) {
      alert('请填写完整信息');
      return;
    }
    try {
      await workorderApi.create(newWorkorder);
      setShowCreateModal(false);
      setNewWorkorder({ title: '', description: '', deviceId: '', priority: 'medium' });
      loadWorkorders();
      alert('工单创建成功');
    } catch (error) {
      alert('创建失败');
    }
  };

  const handleUpdateStatus = async (id: string, status: WorkOrder['status']) => {
    try {
      await workorderApi.update(id, { status });
      loadWorkorders();
    } catch (error) {
      alert('更新失败');
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">工单管理</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
        >
          + 创建工单
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: 'all', label: '全部' },
          { value: 'open', label: '待处理' },
          { value: 'in_progress', label: '处理中' },
          { value: 'resolved', label: '已解决' },
          { value: 'closed', label: '已关闭' }
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilterStatus(item.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === item.value
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : workorders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-gray-400">暂无工单</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workorders.map((wo) => {
            const status = statusMap[wo.status];
            const priority = priorityMap[wo.priority];
            return (
              <div key={wo.id} className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-800">{wo.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${priority.bg} ${priority.color}`}>
                        {priority.label}优先级
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{wo.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>工单号: {wo.id.slice(0, 8)}</span>
                      <span>设备: {wo.deviceId.slice(0, 8)}</span>
                      <span>创建: {new Date(wo.createdAt).toLocaleString('zh-CN')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    {wo.status === 'open' && (
                      <button
                        onClick={() => handleUpdateStatus(wo.id, 'in_progress')}
                        className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        开始处理
                      </button>
                    )}
                    {wo.status === 'in_progress' && (
                      <button
                        onClick={() => handleUpdateStatus(wo.id, 'resolved')}
                        className="px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        标记解决
                      </button>
                    )}
                    {wo.status === 'resolved' && (
                      <button
                        onClick={() => handleUpdateStatus(wo.id, 'closed')}
                        className="px-3 py-1.5 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        关闭工单
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-5">创建工单</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">工单标题</label>
                <input
                  type="text"
                  value={newWorkorder.title}
                  onChange={(e) => setNewWorkorder({ ...newWorkorder, title: e.target.value })}
                  placeholder="请输入工单标题"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">问题描述</label>
                <textarea
                  value={newWorkorder.description}
                  onChange={(e) => setNewWorkorder({ ...newWorkorder, description: e.target.value })}
                  placeholder="请详细描述问题"
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">关联设备ID</label>
                <input
                  type="text"
                  value={newWorkorder.deviceId}
                  onChange={(e) => setNewWorkorder({ ...newWorkorder, deviceId: e.target.value })}
                  placeholder="请输入设备ID"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">优先级</label>
                <div className="flex gap-2">
                  {[
                    { value: 'low', label: '低' },
                    { value: 'medium', label: '中' },
                    { value: 'high', label: '高' }
                  ].map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setNewWorkorder({ ...newWorkorder, priority: p.value })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        newWorkorder.priority === p.value
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                确认创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderPage;
