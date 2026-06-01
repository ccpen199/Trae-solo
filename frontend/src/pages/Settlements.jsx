import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import dayjs from 'dayjs';

export default function Settlements() {
  const [settlements, setSettlements] = useState([]);
  const [stores, setStores] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    store_id: '',
    start_date: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD')
  });

  useEffect(() => {
    loadSettlements();
    loadStores();
  }, [statusFilter]);

  const loadSettlements = async () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    const res = await api.get('/settlements', { params });
    setSettlements(res.data);
  };

  const loadStores = async () => {
    const res = await api.get('/stores');
    setStores(res.data);
    if (res.data.length > 0) {
      setCreateForm(f => ({ ...f, store_id: res.data[0].id }));
    }
  };

  const generateSettlement = async () => {
    try {
      const res = await api.post('/settlements/generate', createForm);
      setShowCreateModal(false);
      alert('结算单已生成');
      loadSettlements();
    } catch (err) {
      alert(err.response?.data?.error || '生成失败');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: ['badge-pending', '待结算'],
      settled: ['badge-settled', '已结算']
    };
    const [cls, text] = map[status] || ['badge-pending', status];
    return <span className={`badge ${cls}`}>{text}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>结算对账</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>生成结算单</button>
      </div>
      
      <div className="filter-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">全部状态</option>
          <option value="pending">待结算</option>
          <option value="settled">已结算</option>
        </select>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>结算单号</th>
            <th>门店</th>
            <th>结算周期</th>
            <th>订单金额</th>
            <th>调整金额</th>
            <th>结算金额</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {settlements.map(s => (
            <tr key={s.id}>
              <td>{s.settlement_no}</td>
              <td>{s.store_name}</td>
              <td>
                {dayjs(s.start_date).format('MM-DD')} ~ {dayjs(s.end_date).format('MM-DD')}
              </td>
              <td>¥{s.order_amount.toFixed(2)}</td>
              <td className={s.adjust_amount > 0 ? 'text-danger' : ''}>
                ¥{s.adjust_amount.toFixed(2)}
              </td>
              <td style={{ fontWeight: 'bold' }}>¥{s.final_amount.toFixed(2)}</td>
              <td>{getStatusBadge(s.status)}</td>
              <td>
                <Link to={`/settlements/${s.id}`} className="btn btn-sm btn-primary">查看</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>生成结算单</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            <div className="form-group">
              <label>门店</label>
              <select value={createForm.store_id} onChange={(e) => setCreateForm({...createForm, store_id: e.target.value})}>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>开始日期</label>
                <input type="date" value={createForm.start_date} onChange={(e) => setCreateForm({...createForm, start_date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>结束日期</label>
                <input type="date" value={createForm.end_date} onChange={(e) => setCreateForm({...createForm, end_date: e.target.value})} />
              </div>
            </div>
            <button className="btn btn-primary" onClick={generateSettlement}>生成结算单</button>
          </div>
        </div>
      )}
    </div>
  );
}
