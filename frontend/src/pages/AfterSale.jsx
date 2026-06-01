import React, { useState, useEffect } from 'react';
import { aftersaleApi } from '../api';

function AfterSale() {
  const [tickets, setTickets] = useState([]);
  const [handleModal, setHandleModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [handleForm, setHandleForm] = useState({ handled_by: '', status: 'completed', refund_amount: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await aftersaleApi.getAll();
      setTickets(res.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleProcess = async () => {
    if (!handleForm.handled_by) {
      alert('请填写处理人');
      return;
    }
    try {
      await aftersaleApi.handle(selectedTicket.id, handleForm);
      setHandleModal(false);
      loadData();
    } catch (err) {
      alert('处理失败');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-pending',
      processing: 'badge-picking',
      completed: 'badge-success',
      rejected: 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: '待处理',
      processing: '处理中',
      completed: '已完成',
      rejected: '已拒绝'
    };
    return texts[status] || status;
  };

  const getTypeText = (type) => {
    const texts = {
      refund: '退款',
      exchange: '换货',
      complaint: '投诉'
    };
    return texts[type] || type;
  };

  return (
    <div>
      <h1 className="page-title">售后处理</h1>
      
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>售后列表</h3>
        <table className="table">
          <thead>
            <tr>
              <th>售后ID</th>
              <th>订单号</th>
              <th>客户</th>
              <th>类型</th>
              <th>状态</th>
              <th>处理人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(ticket => (
              <tr key={ticket.id}>
                <td>{ticket.id}</td>
                <td>{ticket.order_no}</td>
                <td>{ticket.customer_name}</td>
                <td>{getTypeText(ticket.type)}</td>
                <td><span className={`badge ${getStatusBadge(ticket.status)}`}>{getStatusText(ticket.status)}</span></td>
                <td>{ticket.handled_by || '-'}</td>
                <td>
                  {ticket.status === 'pending' && (
                    <button className="btn btn-primary btn-sm" onClick={() => {
                      setSelectedTicket(ticket);
                      setHandleForm({
                        handled_by: '',
                        status: 'completed',
                        refund_amount: ticket.refund_amount
                      });
                      setHandleModal(true);
                    }}>处理</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {handleModal && (
        <div className="modal-overlay" onClick={() => setHandleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>处理售后</h3>
            <div className="detail-row">
              <span className="detail-label">订单号:</span>
              <span className="detail-value">{selectedTicket?.order_no}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">售后类型:</span>
              <span className="detail-value">{getTypeText(selectedTicket?.type)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">原因:</span>
              <span className="detail-value">{selectedTicket?.reason}</span>
            </div>
            <div className="form-group">
              <label>处理人</label>
              <input type="text" value={handleForm.handled_by} onChange={e => setHandleForm({...handleForm, handled_by: e.target.value})} />
            </div>
            <div className="form-group">
              <label>处理结果</label>
              <select value={handleForm.status} onChange={e => setHandleForm({...handleForm, status: e.target.value})}>
                <option value="completed">完成处理</option>
                <option value="rejected">拒绝申请</option>
              </select>
            </div>
            <div className="form-group">
              <label>实际退款金额</label>
              <input type="number" value={handleForm.refund_amount} onChange={e => setHandleForm({...handleForm, refund_amount: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setHandleModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleProcess}>确认处理</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AfterSale;
