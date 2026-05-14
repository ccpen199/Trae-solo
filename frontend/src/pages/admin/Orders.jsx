import React, { useEffect, useState } from 'react';
import { orderAPI } from '../../utils/api';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getList();
      setOrders(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>订单管理</h2>

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button className="btn" onClick={loadData}>重试</button>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>订单ID</th>
              <th>店铺</th>
              <th>金额</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>支付时间</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>暂无数据</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {order.id.substring(0, 8)}...
                  </td>
                  <td>{order.shop_name}</td>
                  <td>¥{order.total_amount}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: order.status === 'paid' ? '#f6ffed' :
                                 order.status === 'pending' ? '#fffbe6' : '#fff1f0',
                      color: order.status === 'paid' ? '#52c41a' :
                             order.status === 'pending' ? '#faad14' : '#ff4d4f'
                    }}>
                      {order.status === 'paid' ? '已支付' :
                       order.status === 'pending' ? '待支付' : order.status}
                    </span>
                  </td>
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                  <td>{order.paid_at ? new Date(order.paid_at).toLocaleString() : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminOrders;
