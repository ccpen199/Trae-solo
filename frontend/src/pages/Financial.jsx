import React, { useState, useEffect } from 'react';
import { financialAPI, ordersAPI } from '../api.js';

function Financial() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingRecord, setPayingRecord] = useState(null);
  const [payForm, setPayForm] = useState({ payment_method: 'cash', transaction_no: '' });
  const [formData, setFormData] = useState({
    order_id: '', type: 'rental', amount: 0, description: '', payment_method: 'cash', transaction_no: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [recRes, sumRes, ordRes] = await Promise.all([
      financialAPI.getAll(),
      financialAPI.getSummary(),
      ordersAPI.getAll()
    ]);
    setRecords(recRes.data);
    setSummary(sumRes.data);
    setOrders(ordRes.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await financialAPI.create(formData);
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('确定要删除这条记录吗？')) {
      try {
        await financialAPI.delete(id);
        loadData();
      } catch (err) {
        alert('删除失败');
      }
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    try {
      await financialAPI.pay(payingRecord.id, payForm);
      setShowPayModal(false);
      setPayingRecord(null);
      loadData();
    } catch (err) {
      alert('收款失败');
    }
  };

  const openPayModal = (record) => {
    setPayingRecord(record);
    setPayForm({ payment_method: 'cash', transaction_no: '' });
    setShowPayModal(true);
  };

  const resetForm = () => setFormData({
    order_id: '', type: 'rental', amount: 0, description: '', payment_method: 'cash', transaction_no: ''
  });

  const getTypeLabel = (type) => {
    const labels = {
      rental: '租金收入',
      deposit: '押金',
      damage: '车损收入',
      violation: '违章收入',
      maintenance: '维修支出',
      refund: '退款',
      other_income: '其他收入',
      other_expense: '其他支出'
    };
    return labels[type] || type;
  };

  const typeOptions = [
    { value: 'rental', label: '租金收入', isIncome: true },
    { value: 'deposit', label: '押金', isIncome: true },
    { value: 'damage', label: '车损收入', isIncome: true },
    { value: 'violation', label: '违章收入', isIncome: true },
    { value: 'maintenance', label: '维修支出', isIncome: false },
    { value: 'refund', label: '退款', isIncome: false },
    { value: 'other_income', label: '其他收入', isIncome: true },
    { value: 'other_expense', label: '其他支出', isIncome: false }
  ];

  return (
    <div>
      <div className="page-header">
        <h1>财务管理</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + 新增记录
        </button>
      </div>

      {summary && (
        <div className="stats-grid">
          <div className="stat-card success">
            <h3>总收入</h3>
            <div className="value">¥{summary.total_income.toLocaleString()}</div>
          </div>
          <div className="stat-card danger">
            <h3>总支出</h3>
            <div className="value">¥{summary.total_expense.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <h3>净利润</h3>
            <div className="value" style={{ color: summary.net_profit >= 0 ? '#4caf50' : '#f44336' }}>
              ¥{summary.net_profit.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>订单号</th>
                <th>类型</th>
                <th>金额</th>
                <th>描述</th>
                <th>支付方式</th>
                <th>交易号</th>
                <th>时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td>{r.order_no || '-'}</td>
                  <td>{getTypeLabel(r.type)}</td>
                  <td style={{ color: ['maintenance', 'refund', 'other_expense'].includes(r.type) ? '#f44336' : '#4caf50' }}>
                    {['maintenance', 'refund', 'other_expense'].includes(r.type) ? '-' : '+'}¥{r.amount}
                  </td>
                  <td>{r.description}</td>
                  <td>
                    {r.payment_method === 'pending' ? (
                      <span className="status-badge status-pending">待支付</span>
                    ) : r.payment_method}
                  </td>
                  <td>{r.transaction_no || '-'}</td>
                  <td>{r.created_at?.slice(0, 16)}</td>
                  <td>
                    <div className="action-buttons">
                      {r.payment_method === 'pending' && (
                        <button className="btn btn-sm btn-success" onClick={() => openPayModal(r)}>收款</button>
                      )}
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.id)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>新增财务记录</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>类型</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                      {typeOptions.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>金额 (¥) *</label>
                    <input type="number" required value={formData.amount}
                      onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>关联订单</label>
                  <select value={formData.order_id} onChange={e => setFormData({...formData, order_id: e.target.value})}>
                    <option value="">无</option>
                    {orders.map(o => <option key={o.id} value={o.id}>{o.order_no}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>描述</label>
                  <input type="text" value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>支付方式</label>
                    <select value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value})}>
                      <option value="cash">现金</option>
                      <option value="alipay">支付宝</option>
                      <option value="wechat">微信</option>
                      <option value="card">银行卡</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>交易号</label>
                    <input type="text" value={formData.transaction_no}
                      onChange={e => setFormData({...formData, transaction_no: e.target.value})} />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                  <button type="submit" className="btn btn-primary">保存</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showPayModal && payingRecord && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>确认收款</h2>
              <button className="modal-close" onClick={() => setShowPayModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-success">
                <strong>{payingRecord.description}</strong><br />
                应收金额: ¥{payingRecord.amount}
              </div>
              <form onSubmit={handlePay}>
                <div className="form-group">
                  <label>支付方式</label>
                  <select value={payForm.payment_method} onChange={e => setPayForm({...payForm, payment_method: e.target.value})}>
                    <option value="cash">现金</option>
                    <option value="alipay">支付宝</option>
                    <option value="wechat">微信</option>
                    <option value="card">银行卡</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>交易号</label>
                  <input type="text" value={payForm.transaction_no}
                    onChange={e => setPayForm({...payForm, transaction_no: e.target.value})} />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)}>取消</button>
                  <button type="submit" className="btn btn-success">确认收款</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Financial;
