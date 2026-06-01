import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import dayjs from 'dayjs';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');

  useEffect(() => {
    loadOrders();
    loadStores();
  }, [statusFilter, storeFilter]);

  const loadOrders = async () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (storeFilter) params.storeId = storeFilter;
    const res = await api.get('/orders', { params });
    setOrders(res.data);
  };

  const loadStores = async () => {
    const res = await api.get('/stores');
    setStores(res.data);
  };

  const getStatusBadge = (status) => {
    const map = {
      draft: ['badge-draft', '草稿'],
      confirmed: ['badge-pending', '已确认'],
      picking: ['badge-picking', '拣配中'],
      shipped: ['badge-shipped', '已发货'],
      received: ['badge-received', '已收货']
    };
    const [cls, text] = map[status] || ['badge-draft', status];
    return <span className={`badge ${cls}`}>{text}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>订单管理</h1>
        <Link to="/orders/create" className="btn btn-primary">创建订单</Link>
      </div>
      
      <div className="filter-bar">
        <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
          <option value="">全部门店</option>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="confirmed">已确认</option>
          <option value="picking">拣配中</option>
          <option value="shipped">已发货</option>
          <option value="received">已收货</option>
        </select>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>订单号</th>
            <th>门店</th>
            <th>下单日期</th>
            <th>配送日期</th>
            <th>商品数</th>
            <th>金额</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id}>
              <td>{o.order_no}</td>
              <td>{o.store_name}</td>
              <td>{dayjs(o.order_date).format('YYYY-MM-DD')}</td>
              <td>{dayjs(o.delivery_date).format('YYYY-MM-DD')}</td>
              <td>{o.item_count}</td>
              <td>¥{o.total_amount.toFixed(2)}</td>
              <td>{getStatusBadge(o.status)}</td>
              <td>
                <Link to={`/orders/${o.id}`} className="btn btn-sm btn-primary">查看</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
