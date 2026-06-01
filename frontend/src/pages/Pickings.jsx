import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import dayjs from 'dayjs';

export default function Pickings() {
  const [pickings, setPickings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadPickings();
  }, [statusFilter]);

  const loadPickings = async () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    const res = await api.get('/pickings', { params });
    setPickings(res.data);
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: ['badge-pending', '待拣配'],
      picking: ['badge-picking', '拣配中'],
      shipped: ['badge-shipped', '已发货']
    };
    const [cls, text] = map[status] || ['badge-pending', status];
    return <span className={`badge ${cls}`}>{text}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>拣配配送</h1>
      </div>
      
      <div className="filter-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">全部状态</option>
          <option value="pending">待拣配</option>
          <option value="picking">拣配中</option>
          <option value="shipped">已发货</option>
        </select>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>拣配单号</th>
            <th>订单号</th>
            <th>门店</th>
            <th>司机</th>
            <th>预计到达</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {pickings.map(p => (
            <tr key={p.id}>
              <td>{p.picking_no}</td>
              <td>{p.order_no}</td>
              <td>{p.store_name}</td>
              <td>{p.driver || '-'}</td>
              <td>{p.estimated_arrival ? dayjs(p.estimated_arrival).format('MM-DD HH:mm') : '-'}</td>
              <td>{getStatusBadge(p.status)}</td>
              <td>
                <Link to={`/pickings/${p.id}`} className="btn btn-sm btn-primary">处理</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
