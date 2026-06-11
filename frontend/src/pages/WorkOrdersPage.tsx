import { useState, useEffect } from 'react';
import { workOrderApi } from '../api';
import { WorkOrder } from '../types';

const WorkOrdersPage = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const tabs = [
    { key: 'all', label: '全部工单' },
    { key: 'pending', label: '待分配' },
    { key: 'assigned', label: '已分配' },
    { key: 'in_progress', label: '处理中' },
    { key: 'completed', label: '已完成' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadData = async () => {
    try {
      const statsData = await workOrderApi.getStats();
      setStats(statsData || []);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      let data;
      if (activeTab === 'all') {
        data = await workOrderApi.getAllOrders();
      } else {
        data = await workOrderApi.getAllOrders({ status: activeTab });
      }
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (orderId: string) => {
    const assignee = prompt('请输入处理人姓名：');
    if (!assignee) return;

    try {
      await workOrderApi.assignOrder(orderId, assignee);
      loadOrders();
    } catch (err) {
      console.error('Failed to assign order:', err);
    }
  };

  const handleStart = async (orderId: string) => {
    try {
      await workOrderApi.startOrder(orderId);
      loadOrders();
    } catch (err) {
      console.error('Failed to start order:', err);
    }
  };

  const handleComplete = async (orderId: string) => {
    try {
      await workOrderApi.completeOrder(orderId);
      loadOrders();
    } catch (err) {
      console.error('Failed to complete order:', err);
    }
  };

  const handleAutoDispatch = async () => {
    try {
      const result = await workOrderApi.autoDispatch();
      alert(`自动派发了 ${result.created} 个故障工单`);
      loadOrders();
      loadData();
    } catch (err) {
      console.error('Failed to auto dispatch:', err);
    }
  };

  const getPriorityClass = (priority: string) => {
    return `priority-tag priority-${priority}`;
  };

  const getStatusClass = (status: string) => {
    return `status-badge status-${status}`;
  };

  const getPriorityLabel = (priority: string) => {
    const map: Record<string, string> = {
      urgent: '紧急',
      high: '高',
      medium: '中',
      low: '低',
    };
    return map[priority] || priority;
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: '待分配',
      assigned: '已分配',
      in_progress: '处理中',
      completed: '已完成',
      cancelled: '已取消',
    };
    return map[status] || status;
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      fault: '故障维修',
      maintenance: '例行巡检',
      cleaning: '场站清洁',
      upgrade: '固件升级',
    };
    return map[type] || type;
  };

  const getStatsCount = (status: string) => {
    const item = stats.find((s: any) => s.status === status);
    return item?.count || 0;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="page-title" style={{ margin: 0 }}>电站巡检工单调度</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={handleAutoDispatch}>
            🔧 自动派发故障工单
          </button>
          <button className="btn btn-outline">
            + 新建工单
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {tabs.slice(1).map(tab => (
          <div key={tab.key} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab(tab.key)}>
            <div className="stat-card-title">{tab.label}</div>
            <div className="stat-card-value">{getStatsCount(tab.key)}</div>
            <div className="stat-card-trend">
              {tab.key === 'pending' && '待处理'}
              {tab.key === 'in_progress' && '进行中'}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="tabs">
          {tabs.map(tab => (
            <div
              key={tab.key}
              className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {tab.key !== 'all' && (
                <span style={{ marginLeft: 6, color: '#999' }}>({getStatsCount(tab.key)})</span>
              )}
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>加载中...</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>工单号</th>
                  <th>类型</th>
                  <th>标题</th>
                  <th>优先级</th>
                  <th>状态</th>
                  <th>处理人</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                      暂无工单
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontSize: 12, color: '#999' }}>
                        {order.id.slice(0, 8)}...
                      </td>
                      <td>{getTypeLabel(order.type)}</td>
                      <td style={{ maxWidth: 200 }}>{order.title}</td>
                      <td>
                        <span className={getPriorityClass(order.priority)}>
                          {getPriorityLabel(order.priority)}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusClass(order.status)}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td>{order.assignee || '-'}</td>
                      <td style={{ fontSize: 12, color: '#666' }}>
                        {order.created_at?.slice(0, 16)}
                      </td>
                      <td>
                        {order.status === 'pending' && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: '4px 12px', fontSize: 12 }}
                            onClick={() => handleAssign(order.id)}
                          >
                            派发
                          </button>
                        )}
                        {order.status === 'assigned' && (
                          <button
                            className="btn btn-success"
                            style={{ padding: '4px 12px', fontSize: 12 }}
                            onClick={() => handleStart(order.id)}
                          >
                            开始处理
                          </button>
                        )}
                        {order.status === 'in_progress' && (
                          <button
                            className="btn btn-warning"
                            style={{ padding: '4px 12px', fontSize: 12 }}
                            onClick={() => handleComplete(order.id)}
                          >
                            完成
                          </button>
                        )}
                        {order.status === 'completed' && (
                          <span style={{ color: '#999', fontSize: 12 }}>已完成</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkOrdersPage;
