import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { API, formatDateTime, getAlarmLevelText, getAlarmLevelColor } from '../../api';

const WORK_ORDER_STATUS_MAP = {
  pending: { text: '待处理', color: '#ff4d4f' },
  processing: { text: '处理中', color: '#faad14' },
  resolved: { text: '已解决', color: '#52c41a' }
};

function getWorkOrderStatusText(status) {
  return WORK_ORDER_STATUS_MAP[status]?.text || status || '-';
}

function getWorkOrderStatusColor(status) {
  return WORK_ORDER_STATUS_MAP[status]?.color || '#8c8c8c';
}

function AlarmWorkOrders() {
  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [processForm, setProcessForm] = useState({ status: '', assignee: '', resolution: '' });
  const [assignForm, setAssignForm] = useState({ assignee: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await API.alarms.list({ limit: 50 });
      setWorkOrders(res.data || []);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const stats = { pending: 0, processing: 0, resolved: 0 };
    workOrders.forEach(w => {
      if (stats[w.status] !== undefined) stats[w.status]++;
    });
    return stats;
  };

  const filteredOrders = statusFilter === 'all'
    ? workOrders
    : workOrders.filter(w => w.status === statusFilter);

  const handleStatusChange = (order) => {
    setSelectedOrder(order);
    let nextStatus = 'pending';
    if (order.status === 'pending') nextStatus = 'processing';
    else if (order.status === 'processing') nextStatus = 'resolved';
    setProcessForm({ status: nextStatus, assignee: order.assignee || '', resolution: '' });
    setShowProcessModal(true);
  };

  const handleAssign = (order) => {
    setSelectedOrder(order);
    setAssignForm({ assignee: order.assignee || '' });
    setShowAssignModal(true);
  };

  const handleSubmitStatus = async () => {
    if (!selectedOrder) return;
    try {
      await API.alarms.update(selectedOrder.id, {
        status: processForm.status,
        assignee: processForm.assignee,
        resolution: processForm.resolution
      });
      alert('状态更新成功');
      setShowProcessModal(false);
      loadData();
    } catch (err) {
      console.error('更新失败:', err);
      alert('更新失败');
    }
  };

  const handleSubmitAssign = async () => {
    if (!selectedOrder || !assignForm.assignee) {
      alert('请选择处理人');
      return;
    }
    try {
      await API.alarms.update(selectedOrder.id, {
        assignee: assignForm.assignee
      });
      alert('分配成功');
      setShowAssignModal(false);
      loadData();
    } catch (err) {
      console.error('分配失败:', err);
      alert('分配失败');
    }
  };

  const stats = getStats();

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="tabs">
        <NavLink to="/admin/dashboard" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>运营概览</NavLink>
        <NavLink to="/admin/device-health" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>设备健康</NavLink>
        <NavLink to="/admin/alarm-workorders" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>告警工单</NavLink>
        <NavLink to="/admin/price-strategy" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>电价策略</NavLink>
        <NavLink to="/admin/revenue-report" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>收益报表</NavLink>
      </div>

      <div className="grid grid-cols-3 mb-16">
        <div className="stat-card orange">
          <div className="label">待处理</div>
          <div className="value">{stats.pending}<span className="unit">单</span></div>
          <div className="trend">需要及时响应</div>
        </div>
        <div className="stat-card blue">
          <div className="label">处理中</div>
          <div className="value">{stats.processing}<span className="unit">单</span></div>
          <div className="trend">正在处理</div>
        </div>
        <div className="stat-card green">
          <div className="label">已解决</div>
          <div className="value">{stats.resolved}<span className="unit">单</span></div>
          <div className="trend">已处理完成</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>工单列表</h2>
          <div className="flex gap-8">
            <select className="btn btn-default btn-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="resolved">已解决</option>
            </select>
            <button className="btn btn-default btn-sm" onClick={loadData}>刷新</button>
          </div>
        </div>
        {filteredOrders.length === 0 ? (
          <div className="empty">暂无工单</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>工单号</th>
                <th>充电站</th>
                <th>充电桩</th>
                <th>告警类型</th>
                <th>告警级别</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>处理人</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{order.work_order_no}</td>
                  <td>{order.station_name}</td>
                  <td>{order.charger_code}</td>
                  <td>{order.alarm_type}</td>
                  <td>
                    <span className="status-badge" style={{
                      background: getAlarmLevelColor(order.alarm_level) + '20',
                      color: getAlarmLevelColor(order.alarm_level)
                    }}>
                      {getAlarmLevelText(order.alarm_level)}
                    </span>
                  </td>
                  <td>
                    <span className="status-badge" style={{
                      background: getWorkOrderStatusColor(order.status) + '20',
                      color: getWorkOrderStatusColor(order.status)
                    }}>
                      {getWorkOrderStatusText(order.status)}
                    </span>
                  </td>
                  <td>{formatDateTime(order.created_at)}</td>
                  <td>{order.assignee || '-'}</td>
                  <td>
                    {order.status !== 'resolved' && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(order)}>
                        {order.status === 'pending' ? '开始处理' : '完成处理'}
                      </button>
                    )}
                    <button className="btn btn-default btn-sm" style={{ marginLeft: '4px' }} onClick={() => handleAssign(order)}>
                      分配处理人
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showProcessModal && selectedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '500px', maxWidth: '90vw' }}>
            <div className="card-header">
              <h2>工单处理</h2>
              <button className="btn btn-default btn-sm" onClick={() => setShowProcessModal(false)}>取消</button>
            </div>
            <div className="alert alert-info">
              工单：{selectedOrder.work_order_no} - {selectedOrder.alarm_type}
            </div>
            <div className="form-group">
              <label>目标状态</label>
              <select value={processForm.status} onChange={(e) => setProcessForm({ ...processForm, status: e.target.value })}>
                <option value="processing">处理中</option>
                <option value="resolved">已解决</option>
              </select>
            </div>
            <div className="form-group">
              <label>处理人</label>
              <select value={processForm.assignee} onChange={(e) => setProcessForm({ ...processForm, assignee: e.target.value })}>
                <option value="">请选择</option>
                <option value="张三">张三</option>
                <option value="李四">李四</option>
                <option value="王五">王五</option>
                <option value="赵六">赵六</option>
              </select>
            </div>
            <div className="form-group">
              <label>处理说明/解决方案</label>
              <textarea rows="4" value={processForm.resolution} onChange={(e) => setProcessForm({ ...processForm, resolution: e.target.value })} placeholder="请填写处理说明和解决方案..."></textarea>
            </div>
            <div className="flex-between">
              <button className="btn btn-default" onClick={() => setShowProcessModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmitStatus}>确认提交</button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && selectedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px', maxWidth: '90vw' }}>
            <div className="card-header">
              <h2>分配处理人</h2>
              <button className="btn btn-default btn-sm" onClick={() => setShowAssignModal(false)}>取消</button>
            </div>
            <div className="alert alert-info">
              工单：{selectedOrder.work_order_no}
            </div>
            <div className="form-group">
              <label>处理人 <span style={{ color: '#ff4d4f' }}>*</span></label>
              <select value={assignForm.assignee} onChange={(e) => setAssignForm({ ...assignForm, assignee: e.target.value })}>
                <option value="">请选择处理人</option>
                <option value="张三">张三</option>
                <option value="李四">李四</option>
                <option value="王五">王五</option>
                <option value="赵六">赵六</option>
              </select>
            </div>
            <div className="flex-between">
              <button className="btn btn-default" onClick={() => setShowAssignModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmitAssign}>确认分配</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlarmWorkOrders;
