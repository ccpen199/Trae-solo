import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TYPE_MAP = { repair: '设备维修', maintenance: '日常维护', emergency: '紧急故障', alert: '告警工单' };
const STATUS_MAP = { pending: '待处理', processing: '处理中', completed: '已完成' };
const PRIORITY_MAP = { high: '高', medium: '中', low: '低' };

function WorkOrders() {
  const [orders, setOrders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrder, setNewOrder] = useState({ title: '', type: 'repair', station_id: '', device_id: '', priority: 'medium', description: '' });
  const [stations, setStations] = useState([]);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    loadOrders();
    loadAlerts();
    loadStations();
  }, [filter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getWorkOrders({ status: filter === 'all' ? undefined : filter });
      setOrders(res.data.data || []);
    } catch (err) {
      console.error('Failed to load work orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const res = await api.getAlerts({ is_resolved: 0 });
      setAlerts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  };

  const loadStations = async () => {
    try {
      const res = await api.getStations();
      setStations(res.data.data);
    } catch (err) {
      console.error('Failed to load stations:', err);
    }
  };

  const loadDevices = async (stationId) => {
    if (!stationId) return;
    try {
      const res = await api.getStationMap(stationId);
      setDevices(res.data.data.devices || []);
    } catch (err) {
      console.error('Failed to load devices:', err);
    }
  };

  const createOrderFromAlert = async (alert) => {
    try {
      await api.createWorkOrder({
        title: `${alert.device_name} - ${alert.alert_type}`,
        type: 'alert',
        station_id: alert.station_id,
        device_id: alert.device_id,
        priority: alert.alert_level === 'critical' ? 'high' : alert.alert_level === 'warning' ? 'medium' : 'low',
        description: alert.message
      });
      loadOrders();
      alert('工单创建成功！');
    } catch (err) {
      alert('创建失败：' + (err.response?.data?.error || err.message));
    }
  };

  const handleCreate = async () => {
    if (!newOrder.title || !newOrder.station_id) {
      alert('请填写标题和选择场站');
      return;
    }
    try {
      await api.createWorkOrder(newOrder);
      setShowCreateModal(false);
      setNewOrder({ title: '', type: 'repair', station_id: '', device_id: '', priority: 'medium', description: '' });
      loadOrders();
    } catch (err) {
      alert('创建失败：' + (err.response?.data?.error || err.message));
    }
  };

  const updateOrder = async (id, status) => {
    try {
      await api.updateWorkOrder(id, { status, assignee: '运营专员' });
      loadOrders();
    } catch (err) {
      alert('操作失败：' + err.message);
    }
  };

  const getPriorityColor = (p) => p === 'high' ? '#ff4d4f' : p === 'medium' ? '#faad14' : '#52c41a';
  const getStatusClass = (s) => s === 'pending' ? 'status-pending' : s === 'processing' ? 'status-pending' : 'status-paid';

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const processingCount = orders.filter(o => o.status === 'processing').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;

  return (
    <div>
      <div className="page-header">
        <h1>设备工单管理</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ 新建工单</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card warning">
          <div className="label">待处理工单</div>
          <div className="value">{pendingCount}</div>
        </div>
        <div className="stat-card">
          <div className="label">处理中</div>
          <div className="value">{processingCount}</div>
        </div>
        <div className="stat-card success">
          <div className="label">已完成</div>
          <div className="value">{completedCount}</div>
        </div>
        <div className="stat-card danger">
          <div className="label">未处理告警</div>
          <div className="value">{alerts.length}</div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="card">
          <div className="card-title">⚠️ 待处理设备告警（可转工单）</div>
          <div className="alerts-panel">
            {alerts.map(a => (
              <div key={a.id} className="alert-item" style={{ background: a.alert_level === 'critical' ? '#fff2f0' : undefined }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="badge badge-warning">{a.alert_level === 'critical' ? '严重' : a.alert_level === 'warning' ? '警告' : '提示'}</span>
                    <strong style={{ marginLeft: '8px' }}>{a.device_name}</strong>
                    <span style={{ marginLeft: '12px', color: '#666' }}>{a.message}</span>
                  </div>
                  <div>
                    <span className="time">{a.created_at}</span>
                    <button className="btn btn-small btn-primary" style={{ marginLeft: '12px' }} onClick={() => createOrderFromAlert(a)}>
                      生成工单
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tabs">
        <div className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>全部 ({orders.length})</div>
        <div className={`tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>待处理 ({pendingCount})</div>
        <div className={`tab ${filter === 'processing' ? 'active' : ''}`} onClick={() => setFilter('processing')}>处理中 ({processingCount})</div>
        <div className={`tab ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>已完成 ({completedCount})</div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>工单号</th>
                  <th>标题</th>
                  <th>类型</th>
                  <th>场站</th>
                  <th>关联设备</th>
                  <th>优先级</th>
                  <th>处理人</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td>WO-{String(o.id).padStart(5, '0')}</td>
                    <td>{o.title}</td>
                    <td>{TYPE_MAP[o.type] || o.type}</td>
                    <td>{o.station_name || '-'}</td>
                    <td>{o.device_name || '-'}</td>
                    <td><span style={{ color: getPriorityColor(o.priority), fontWeight: 'bold' }}>{PRIORITY_MAP[o.priority] || o.priority}</span></td>
                    <td>{o.assignee || '-'}</td>
                    <td><span className={`status-badge ${getStatusClass(o.status)}`}>{STATUS_MAP[o.status] || o.status}</span></td>
                    <td>{o.created_at}</td>
                    <td>
                      {o.status === 'pending' && (
                        <button className="btn btn-small btn-primary" onClick={() => updateOrder(o.id, 'processing')}>开始处理</button>
                      )}
                      {o.status === 'processing' && (
                        <button className="btn btn-small btn-success" onClick={() => updateOrder(o.id, 'completed')}>完成</button>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>暂无工单</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: '500px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="card-title">新建工单</div>
            <div className="form-group">
              <label>工单标题 *</label>
              <input type="text" value={newOrder.title} onChange={e => setNewOrder({ ...newOrder, title: e.target.value })} placeholder="请输入工单标题" />
            </div>
            <div className="form-group">
              <label>工单类型</label>
              <select value={newOrder.type} onChange={e => setNewOrder({ ...newOrder, type: e.target.value })}>
                <option value="repair">设备维修</option>
                <option value="maintenance">日常维护</option>
                <option value="emergency">紧急故障</option>
              </select>
            </div>
            <div className="form-group">
              <label>选择场站 *</label>
              <select value={newOrder.station_id} onChange={e => { setNewOrder({ ...newOrder, station_id: e.target.value, device_id: '' }); loadDevices(e.target.value); }}>
                <option value="">请选择场站</option>
                {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>关联设备</label>
              <select value={newOrder.device_id} onChange={e => setNewOrder({ ...newOrder, device_id: e.target.value })}>
                <option value="">不关联设备</option>
                {devices.map(d => <option key={d.id} value={d.id}>{d.device_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>优先级</label>
              <select value={newOrder.priority} onChange={e => setNewOrder({ ...newOrder, priority: e.target.value })}>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
            <div className="form-group">
              <label>问题描述</label>
              <textarea style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px', minHeight: '80px' }}
                value={newOrder.description} onChange={e => setNewOrder({ ...newOrder, description: e.target.value })} placeholder="请描述问题详情" />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowCreateModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreate}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkOrders;
