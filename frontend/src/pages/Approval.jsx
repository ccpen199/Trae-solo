import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import dayjs from 'dayjs';

function Approval({ currentUser }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await api.getOrders({ status: 'pending_approval' });
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('加载审批订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (orderId) => {
    if (window.confirm('确定要审批通过该订单吗？')) {
      try {
        const response = await api.approve(orderId, { comment: '审批通过' }, currentUser);
        if (response.success) {
          loadPendingApprovals();
        } else {
          alert(response.message || '操作失败');
        }
      } catch (error) {
        console.error('审批失败:', error);
        alert('操作失败');
      }
    }
  };

  const handleReject = async (orderId) => {
    const reason = prompt('请输入驳回原因:');
    if (reason) {
      try {
        const response = await api.reject(orderId, { reason, comment: '' }, currentUser);
        if (response.success) {
          loadPendingApprovals();
        } else {
          alert(response.message || '操作失败');
        }
      } catch (error) {
        console.error('驳回失败:', error);
        alert('操作失败');
      }
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>审批中心</h2>

      <div className="alert alert-info">
        待审批订单列表，您可以选择通过或驳回。
      </div>

      {orders.length > 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>消费者</th>
                <th>金额</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 500, cursor: 'pointer' }} onClick={() => navigate(`/orders/${order.id}`)}>
                    {order.order_no}
                  </td>
                  <td>{order.consumer_name || '-'}</td>
                  <td style={{ fontWeight: 500, color: '#ff4d4f' }}>
                    {order.total_amount > 0 ? `¥${order.total_amount}` : '-'}
                  </td>
                  <td style={{ fontSize: 13, color: '#999' }}>
                    {dayjs(order.created_at).format('YYYY-MM-DD HH:mm')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-success"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={() => handleApprove(order.id)}
                      >
                        通过
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={() => handleReject(order.id)}
                      >
                        驳回
                      </button>
                      <button
                        className="btn btn-default"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        详情
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card empty">
          暂无待审批订单
        </div>
      )}
    </div>
  );
}

export default Approval;
