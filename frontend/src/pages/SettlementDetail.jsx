import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import dayjs from 'dayjs';

export default function SettlementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [settlement, setSettlement] = useState(null);

  useEffect(() => {
    loadSettlement();
  }, [id]);

  const loadSettlement = async () => {
    const res = await api.get(`/settlements/${id}`);
    setSettlement(res.data);
  };

  const confirmSettlement = async () => {
    await api.patch(`/settlements/${id}/status`, { status: 'settled' });
    alert('结算已完成');
    loadSettlement();
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: ['badge-pending', '待结算'],
      settled: ['badge-settled', '已结算']
    };
    const [cls, text] = map[status] || ['badge-pending', status];
    return <span className={`badge ${cls}`}>{text}</span>;
  };

  if (!settlement) return <div>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>结算单详情 - {settlement.settlement_no}</h1>
        <button className="btn" onClick={() => navigate('/settlements')}>返回</button>
      </div>
      
      <div className="card">
        <div className="form-row">
          <div>
            <strong>门店：</strong>{settlement.store_name}
          </div>
          <div>
            <strong>结算周期：</strong>
            {dayjs(settlement.start_date).format('YYYY-MM-DD')} ~ {dayjs(settlement.end_date).format('YYYY-MM-DD')}
          </div>
          <div>
            <strong>状态：</strong>{getStatusBadge(settlement.status)}
          </div>
          {settlement.settled_at && (
            <div>
              <strong>结算时间：</strong>{dayjs(settlement.settled_at).format('YYYY-MM-DD HH:mm')}
            </div>
          )}
        </div>
      </div>
      
      <div className="card">
        <h3>金额汇总</h3>
        <div className="stats-grid" style={{ marginTop: '15px' }}>
          <div className="stat-card">
            <h3>订单金额</h3>
            <div className="value">¥{settlement.order_amount.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <h3>调整金额</h3>
            <div className="value text-danger">¥{settlement.adjust_amount.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <h3>结算金额</h3>
            <div className="value text-success">¥{settlement.final_amount.toFixed(2)}</div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3>订单明细</h3>
        <table style={{ marginTop: '15px' }}>
          <thead>
            <tr>
              <th>订单号</th>
              <th>下单日期</th>
              <th>订单金额</th>
              <th>收货金额</th>
              <th>差异</th>
            </tr>
          </thead>
          <tbody>
            {settlement.items.map(item => (
              <tr key={item.id}>
                <td>{item.order_no}</td>
                <td>{dayjs(item.order_date).format('YYYY-MM-DD')}</td>
                <td>¥{item.order_amount.toFixed(2)}</td>
                <td>¥{item.receipt_amount.toFixed(2)}</td>
                <td className={item.diff_amount > 0 ? 'text-danger' : ''}>
                  ¥{item.diff_amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex gap-10">
        {settlement.status === 'pending' && (
          <button className="btn btn-success" onClick={confirmSettlement}>确认结算完成</button>
        )}
      </div>
    </div>
  );
}
