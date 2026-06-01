import React, { useState, useEffect } from 'react';
import { orderApi } from '../services/api';

const Orders = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState({ status: '', type: '' });
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (user.role === 'parent' && user.children?.length > 0) {
      setSelectedStudent(user.children[0].id);
    } else if (user.role === 'student') {
      setSelectedStudent(user.id);
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const params = { ...filter };
      if (selectedStudent && ['parent', 'student'].includes(user.role)) {
        params.student_id = selectedStudent;
      }
      const response = await orderApi.getAll(params);
      setOrders(response.data);
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const handlePay = async (orderId) => {
    try {
      await orderApi.pay(orderId, 'online');
      alert('支付成功！');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '支付失败');
    }
  };

  const handleAudit = async (orderId, action) => {
    const notes = action === 'reject' ? prompt('请输入拒绝原因：') : '';
    if (action === 'reject' && notes === null) return;
    
    try {
      await orderApi.audit(orderId, action, notes);
      alert('审核成功！');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '审核失败');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-warning', text: '待处理' },
      paid: { class: 'badge-success', text: '已支付' },
      failed: { class: 'badge-danger', text: '失败' },
      refunded: { class: 'badge-primary', text: '已退款' },
      cancelled: { class: '', text: '已取消' }
    };
    const badge = badges[status] || { class: '', text: status };
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  const getTypeBadge = (type) => {
    const badges = {
      enrollment: { class: 'badge-primary', text: '报名' },
      refund: { class: 'badge-warning', text: '退款' },
      transfer: { class: 'badge-success', text: '调课' }
    };
    const badge = badges[type] || { class: '', text: type };
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>订单管理</h2>

      <div className="card">
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          {user.role === 'parent' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'inline', marginRight: 10 }}>选择学生：</label>
              <select value={selectedStudent || ''} onChange={(e) => setSelectedStudent(Number(e.target.value))}>
                <option value="">全部</option>
                {user.children?.map(child => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'inline', marginRight: 10 }}>类型：</label>
            <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}>
              <option value="">全部</option>
              <option value="enrollment">报名</option>
              <option value="refund">退款</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'inline', marginRight: 10 }}>状态：</label>
            <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
              <option value="">全部</option>
              <option value="pending">待处理</option>
              <option value="paid">已支付</option>
              <option value="refunded">已退款</option>
              <option value="failed">失败</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={loadData}>查询</button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>订单号</th>
            <th>类型</th>
            <th>课程</th>
            <th>学生</th>
            <th>金额</th>
            <th>状态</th>
            <th>审核状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.order_no}</td>
              <td>{getTypeBadge(order.type)}</td>
              <td>{order.course_name || '-'}</td>
              <td>{order.student_name}</td>
              <td>¥{order.amount}</td>
              <td>{getStatusBadge(order.status)}</td>
              <td>
                {order.type === 'refund' && (
                  <span className={`badge ${order.audit_status === 'approved' ? 'badge-success' : order.audit_status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                    {order.audit_status === 'pending' ? '待审核' : order.audit_status === 'approved' ? '已通过' : '已拒绝'}
                  </span>
                )}
                {order.type !== 'refund' && '-'}
              </td>
              <td>{order.created_at}</td>
              <td>
                {order.status === 'pending' && order.type === 'enrollment' && ['parent', 'student'].includes(user.role) && (
                  <button className="btn btn-success" onClick={() => handlePay(order.id)}>支付</button>
                )}
                {order.type === 'refund' && order.audit_status === 'pending' && user.role === 'admin' && (
                  <>
                    <button className="btn btn-success" onClick={() => handleAudit(order.id, 'approve')} style={{ marginRight: 5 }}>通过</button>
                    <button className="btn btn-danger" onClick={() => handleAudit(order.id, 'reject')}>拒绝</button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan="9" style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                暂无订单记录
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Orders;
