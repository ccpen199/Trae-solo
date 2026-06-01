import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const statusMap = {
    ordered: { label: '已下单', badge: 'badge-warning' },
    lens_arrived: { label: '镜片到货', badge: 'badge-info' },
    processing: { label: '加工中', badge: 'badge-primary' },
    quality_check: { label: '质检中', badge: 'badge-info' },
    ready: { label: '待取镜', badge: 'badge-success' },
    completed: { label: '已完成', badge: 'badge-success' },
    cancelled: { label: '已取消', badge: 'badge-error' },
  };

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter]);

  const loadOrders = async () => {
    const params = { page };
    if (statusFilter) params.status = statusFilter;
    const res = await api.get('/orders', { params });
    setOrders(res.data.data);
    setTotal(res.data.total);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>配镜订单</h2>
        <Link to="/orders/new" className="btn btn-primary">+ 创建订单</Link>
      </div>

      <div className="card">
        <div className="search-bar">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>状态筛选</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">全部</option>
              {Object.entries(statusMap).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>订单号</th>
              <th>客户</th>
              <th>金额</th>
              <th>已付</th>
              <th>状态</th>
              <th>交付日期</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td>{o.order_no}</td>
                <td>
                  <a href="#" onClick={e => { e.preventDefault(); navigate(`/customers/${o.customer_id}`); }} style={{ color: '#1890ff' }}>
                    {o.customer_name}
                  </a>
                </td>
                <td>¥{o.total_amount}</td>
                <td>¥{o.paid_amount || 0}</td>
                <td>
                  <span className={`badge ${statusMap[o.status]?.badge || 'badge-info'}`}>
                    {statusMap[o.status]?.label || o.status}
                  </span>
                </td>
                <td>{o.delivery_date?.split('T')[0] || '-'}</td>
                <td>{o.created_at?.split('T')[0]}</td>
                <td>
                  <Link to={`/orders/${o.id}`} className="btn btn-sm btn-default">查看</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <span>共 {total} 条</span>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>上一页</button>
          <span>第 {page} 页</span>
          <button onClick={() => setPage(p => p + 1)} disabled={orders.length < 20}>下一页</button>
        </div>
      </div>
    </div>
  );
}

export default Orders;
