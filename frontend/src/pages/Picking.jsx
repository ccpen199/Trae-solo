import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pickingApi, orderApi } from '../api';

function Picking() {
  const [tasks, setTasks] = useState([]);
  const [pickers, setPickers] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [assignModal, setAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ order_ids: [], picker_id: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, pickersRes, ordersRes] = await Promise.all([
        pickingApi.getAll(),
        pickingApi.getPickers(),
        orderApi.getAll({ status: 'pending' })
      ]);
      setTasks(tasksRes.data);
      setPickers(pickersRes.data);
      setPendingOrders(ordersRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleAssign = async () => {
    if (assignForm.order_ids.length === 0 || !assignForm.picker_id) {
      alert('请选择订单和拣货员');
      return;
    }
    try {
      await pickingApi.assign(assignForm);
      setAssignModal(false);
      setAssignForm({ order_ids: [], picker_id: '' });
      loadData();
    } catch (err) {
      alert('分配失败');
    }
  };

  const toggleOrderSelection = (orderId) => {
    const orderIds = assignForm.order_ids.includes(orderId)
      ? assignForm.order_ids.filter(id => id !== orderId)
      : [...assignForm.order_ids, orderId];
    setAssignForm({ ...assignForm, order_ids: orderIds });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-pending',
      assigned: 'badge-pending',
      in_progress: 'badge-picking',
      completed: 'badge-success'
    };
    return badges[status] || 'badge-info';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: '待分配',
      assigned: '已分配',
      in_progress: '拣货中',
      completed: '已完成'
    };
    return texts[status] || status;
  };

  return (
    <div>
      <h1 className="page-title">拣货任务</h1>
      
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>任务列表</h3>
          <button className="btn btn-primary" onClick={() => setAssignModal(true)}>分配拣货任务</button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>任务ID</th>
              <th>订单号</th>
              <th>客户</th>
              <th>拣货员</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id}>
                <td>{task.id}</td>
                <td>{task.order_no}</td>
                <td>{task.customer_name}</td>
                <td>{task.picker_name || '-'}</td>
                <td><span className={`badge ${getStatusBadge(task.status)}`}>{getStatusText(task.status)}</span></td>
                <td>{new Date(task.created_at).toLocaleString('zh-CN')}</td>
                <td>
                  <Link to={`/picking/${task.id}`} className="btn btn-primary">详情</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <h3>分配拣货任务</h3>
            <div className="form-group">
              <label>选择拣货员</label>
              <select value={assignForm.picker_id} onChange={e => setAssignForm({...assignForm, picker_id: e.target.value})}>
                <option value="">请选择拣货员</option>
                {pickers.map(picker => (
                  <option key={picker.id} value={picker.id}>{picker.name} ({picker.employee_no})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>选择订单</label>
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ddd', borderRadius: 4 }}>
                {pendingOrders.map(order => (
                  <div key={order.id} style={{ padding: 8, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' }}>
                    <input type="checkbox" checked={assignForm.order_ids.includes(order.id)} onChange={() => toggleOrderSelection(order.id)} style={{ marginRight: 8 }} />
                    <span>{order.order_no} - {order.customer_name} - ¥{order.total_amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 8, fontSize: 12, color: '#666' }}>已选择 {assignForm.order_ids.length} 个订单</p>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setAssignModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAssign}>确认分配</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Picking;
