import React, { useState, useEffect } from 'react';
import { fees, orders } from '../api';

function Fees() {
  const [feeList, setFeeList] = useState([]);
  const [orderList, setOrderList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    order_id: '',
    fee_type: 'waiting',
    amount: '',
    description: ''
  });

  useEffect(() => {
    loadFees();
    loadOrders();
  }, []);

  const loadFees = async () => {
    try {
      const res = await fees.getAll();
      setFeeList(res.data);
    } catch (error) {
      console.error('加载费用失败:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await orders.getAll();
      setOrderList(res.data);
    } catch (error) {
      console.error('加载订单失败:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fees.create(formData);
      setShowModal(false);
      loadFees();
      setFormData({ order_id: '', fee_type: 'waiting', amount: '', description: '' });
    } catch (error) {
      alert('创建费用失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCustomerApprove = async (id) => {
    try {
      await fees.customerApprove(id);
      loadFees();
    } catch (error) {
      alert('操作失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleFinanceApprove = async (id) => {
    try {
      await fees.financeApprove(id);
      loadFees();
    } catch (error) {
      alert('操作失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleReject = async (id) => {
    try {
      await fees.reject(id);
      loadFees();
    } catch (error) {
      alert('操作失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const statusMap = {
    pending: '待审批',
    customer_approved: '客户已确认',
    finance_approved: '财务已审核',
    rejected: '已驳回'
  };

  const feeTypes = {
    waiting: '等待费',
    address_change: '改地址费',
    overnight: '压夜费',
    empty_drive: '空驶费'
  };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <h2>💰 费用管理</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 登记费用
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>客户</th>
              <th>费用类型</th>
              <th>金额</th>
              <th>说明</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {feeList.map(fee => (
              <tr key={fee.id}>
                <td><strong>{fee.order_no || '-'}</strong></td>
                <td>{fee.customer_name || '-'}</td>
                <td>{fee.fee_type}</td>
                <td style={{ color: '#ef4444', fontWeight: 600 }}>¥{fee.amount}</td>
                <td>{fee.description || '-'}</td>
                <td><span className={`badge badge-${fee.status === 'pending' ? 'warning' : fee.status === 'rejected' ? 'danger' : 'success'}`}>{statusMap[fee.status]}</span></td>
                <td>
                  {fee.status === 'pending' && (
                    <>
                      <button className="btn btn-sm btn-success" onClick={() => handleCustomerApprove(fee.id)} style={{ marginRight: '0.25rem' }}>客户确认</button>
                      <button className="btn btn-sm btn-primary" onClick={() => handleFinanceApprove(fee.id)} style={{ marginRight: '0.25rem' }}>财务审核</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleReject(fee.id)}>驳回</button>
                    </>
                  )}
                  {fee.status === 'customer_approved' && (
                    <button className="btn btn-sm btn-primary" onClick={() => handleFinanceApprove(fee.id)}>财务审核</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {feeList.length === 0 && <div className="empty-state">暂无费用记录</div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>登记费用</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>关联订单</label>
                <select value={formData.order_id} onChange={e => setFormData({...formData, order_id: e.target.value})} required>
                  <option value="">请选择订单</option>
                  {orderList.map(o => <option key={o.id} value={o.id}>{o.order_no} - {o.customer_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>费用类型</label>
                <select value={formData.fee_type} onChange={e => setFormData({...formData, fee_type: e.target.value})}>
                  <option value="waiting">等待费</option>
                  <option value="address_change">改地址费</option>
                  <option value="overnight">压夜费</option>
                  <option value="empty_drive">空驶费</option>
                </select>
              </div>
              <div className="form-group">
                <label>金额(元)</label>
                <input type="number" min="0" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>费用说明</label>
                <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="请详细说明费用产生原因..."></textarea>
              </div>
              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">登记费用</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Fees;
