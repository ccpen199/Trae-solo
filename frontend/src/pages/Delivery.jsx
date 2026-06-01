import React, { useState, useEffect } from 'react';
import { deliveryApi, orderApi } from '../api';

function Delivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [riders, setRiders] = useState([]);
  const [reviewedOrders, setReviewedOrders] = useState([]);
  const [assignModal, setAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ order_ids: [], rider_id: '' });
  const [failModal, setFailModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [failReason, setFailReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [deliveriesRes, ridersRes, ordersRes] = await Promise.all([
        deliveryApi.getAll(),
        deliveryApi.getRiders(),
        orderApi.getAll({ status: 'reviewed' })
      ]);
      setDeliveries(deliveriesRes.data);
      setRiders(ridersRes.data);
      setReviewedOrders(ordersRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleAssign = async () => {
    if (assignForm.order_ids.length === 0 || !assignForm.rider_id) {
      alert('请选择订单和骑手');
      return;
    }
    try {
      await deliveryApi.assign(assignForm);
      setAssignModal(false);
      setAssignForm({ order_ids: [], rider_id: '' });
      loadData();
    } catch (err) {
      alert('分配失败');
    }
  };

  const toggleOrderSelection = (orderId) => {
    const orderIds = assignForm.order_ids.includes(orderId)
      ? assignForm.order_ids.filter(id => id !== orderId)
      : [...assignForm.order_ids, orderId];
    setAssignForm({ ...assignForm, order_ids: orderIds });
  };

  const handleAccept = async (id) => {
    try {
      await deliveryApi.accept(id);
      loadData();
    } catch (err) {
      alert('接单失败');
    }
  };

  const handleArrive = async (id) => {
    try {
      await deliveryApi.arrive(id);
      loadData();
    } catch (err) {
      alert('确认到达失败');
    }
  };

  const handleSign = async (id) => {
    try {
      await deliveryApi.sign(id);
      loadData();
    } catch (err) {
      alert('签收失败');
    }
  };

  const handleFail = async () => {
    if (!failReason) {
      alert('请填写失败原因');
      return;
    }
    try {
      await deliveryApi.fail(selectedDelivery.id, { failure_reason: failReason });
      setFailModal(false);
      setFailReason('');
      loadData();
    } catch (err) {
      alert('登记失败失败');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-pending',
      assigned: 'badge-pending',
      accepted: 'badge-picking',
      arrived: 'badge-picking',
      signed: 'badge-success',
      failed: 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: '待分配',
      assigned: '已分配',
      accepted: '骑手接单',
      arrived: '已到达',
      signed: '已签收',
      failed: '配送失败'
    };
    return texts[status] || status;
  };

  return (
    <div>
      <h1 className="page-title">配送管理</h1>
      
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>配送列表</h3>
          <button className="btn btn-primary" onClick={() => setAssignModal(true)}>分配配送任务</button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>配送ID</th>
              <th>订单号</th>
              <th>客户</th>
              <th>骑手</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map(delivery => (
              <tr key={delivery.id}>
                <td>{delivery.id}</td>
                <td>{delivery.order_no}</td>
                <td>{delivery.customer_name}</td>
                <td>{delivery.rider_name || '-'}</td>
                <td><span className={`badge ${getStatusBadge(delivery.status)}`}>{getStatusText(delivery.status)}</span></td>
                <td>
                  {delivery.status === 'assigned' && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleAccept(delivery.id)}>骑手接单</button>
                  )}
                  {delivery.status === 'accepted' && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleArrive(delivery.id)}>确认到达</button>
                  )}
                  {delivery.status === 'arrived' && (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => handleSign(delivery.id)}>签收</button>
                      <button className="btn btn-danger btn-sm" onClick={() => {
                        setSelectedDelivery(delivery);
                        setFailModal(true);
                      }}>配送失败</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <h3>分配配送任务</h3>
            <div className="form-group">
              <label>选择骑手</label>
              <select value={assignForm.rider_id} onChange={e => setAssignForm({...assignForm, rider_id: e.target.value})}>
                <option value="">请选择骑手</option>
                {riders.map(rider => (
                  <option key={rider.id} value={rider.id}>{rider.name} ({rider.employee_no}) - {rider.phone}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>选择订单</label>
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ddd', borderRadius: 4 }}>
                {reviewedOrders.map(order => (
                  <div key={order.id} style={{ padding: 8, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' }}>
                    <input type="checkbox" checked={assignForm.order_ids.includes(order.id)} onChange={() => toggleOrderSelection(order.id)} style={{ marginRight: 8 }} />
                    <span>{order.order_no} - {order.customer_name} - {order.address}</span>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 8, fontSize: 12, color: '#666' }}>已选择 {assignForm.order_ids.length} 个订单</p>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setAssignModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAssign}>确认分配</button>
            </div>
          </div>
        </div>
      )}

      {failModal && (
        <div className="modal-overlay" onClick={() => setFailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>配送失败登记</h3>
            <p>订单: {selectedDelivery?.order_no}</p>
            <div className="form-group">
              <label>失败原因</label>
              <textarea value={failReason} onChange={e => setFailReason(e.target.value)} placeholder="请填写失败原因" />
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setFailModal(false)}>取消</button>
              <button className="btn btn-danger" onClick={handleFail}>确认登记</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Delivery;
