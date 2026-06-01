import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import dayjs from 'dayjs';

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [stores, setStores] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');

  useEffect(() => {
    loadReceipts();
    loadStores();
  }, [statusFilter, storeFilter]);

  const loadReceipts = async () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (storeFilter) params.storeId = storeFilter;
    const res = await api.get('/receipts', { params });
    setReceipts(res.data);
  };

  const loadStores = async () => {
    const res = await api.get('/stores');
    setStores(res.data);
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: ['badge-pending', '待收货'],
      completed: ['badge-received', '已收货']
    };
    const [cls, text] = map[status] || ['badge-pending', status];
    return <span className={`badge ${cls}`}>{text}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>收货管理</h1>
      </div>
      
      <div className="filter-bar">
        <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
          <option value="">全部门店</option>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">全部状态</option>
          <option value="pending">待收货</option>
          <option value="completed">已收货</option>
        </select>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>收货单号</th>
            <th>订单号</th>
            <th>门店</th>
            <th>司机</th>
            <th>收货时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {receipts.map(r => (
            <tr key={r.id}>
              <td>{r.receipt_no}</td>
              <td>{r.order_no}</td>
              <td>{r.store_name}</td>
              <td>{r.driver || '-'}</td>
              <td>{r.received_at ? dayjs(r.received_at).format('MM-DD HH:mm') : '-'}</td>
              <td>{getStatusBadge(r.status)}</td>
              <td>
                <Link to={`/receipts/${r.id}`} className="btn btn-sm btn-primary">收货</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
