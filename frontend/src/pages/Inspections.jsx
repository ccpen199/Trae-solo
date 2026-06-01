import React, { useState, useEffect } from 'react';
import { inspectionsAPI, ordersAPI } from '../api.js';

function Inspections() {
  const [inspections, setInspections] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    check_duplicate_dispatch: false,
    check_cross_city_return: false,
    check_violations: false,
    check_damage_fee: false,
    check_maintenance_overdue: false,
    vehicle_status_match: false,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [insRes, ordRes] = await Promise.all([
      inspectionsAPI.getAll(),
      ordersAPI.getAll({ status: 'returned' })
    ]);
    setInspections(insRes.data);
    setOrders(ordRes.data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await inspectionsAPI.create({ order_id: selectedOrder.id });
      setShowModal(false);
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    try {
      await inspectionsAPI.complete(selectedInspection.id, formData);
      setShowModal(false);
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  };

  const openCreateModal = () => {
    setSelectedOrder(null);
    setModalType('create');
    setShowModal(true);
  };

  const openCompleteModal = (inspection) => {
    setSelectedInspection(inspection);
    setFormData({
      check_duplicate_dispatch: !!inspection.check_duplicate_dispatch,
      check_cross_city_return: !!inspection.check_cross_city_return,
      check_violations: !!inspection.check_violations,
      check_damage_fee: !!inspection.check_damage_fee,
      check_maintenance_overdue: !!inspection.check_maintenance_overdue,
      vehicle_status_match: !!inspection.vehicle_status_match,
      notes: inspection.notes || ''
    });
    setModalType('complete');
    setShowModal(true);
  };

  const getStatusLabel = (status) => {
    const labels = { pending: '待验收', completed: '已完成' };
    return labels[status] || status;
  };

  return (
    <div>
      <div className="page-header">
        <h1>验收管理</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + 新建验收
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>订单号</th>
                <th>车辆</th>
                <th>重复派车</th>
                <th>异地还车</th>
                <th>违章检查</th>
                <th>车损费用</th>
                <th>保养逾期</th>
                <th>状态匹配</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map(i => (
                <tr key={i.id}>
                  <td>{i.order_no}</td>
                  <td>{i.brand} {i.model}</td>
                  <td>{i.check_duplicate_dispatch ? '✓' : '-'}</td>
                  <td>{i.check_cross_city_return ? '✓' : '-'}</td>
                  <td>{i.check_violations ? '✓' : '-'}</td>
                  <td>{i.check_damage_fee ? '✓' : '-'}</td>
                  <td>{i.check_maintenance_overdue ? '✓' : '-'}</td>
                  <td>{i.vehicle_status_match ? '✓' : '-'}</td>
                  <td><span className={`status-badge status-${i.status}`}>{getStatusLabel(i.status)}</span></td>
                  <td>
                    <div className="action-buttons">
                      {i.status === 'pending' && (
                        <button className="btn btn-sm btn-success" onClick={() => openCompleteModal(i)}>完成</button>
                      )}
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
              <h2>{modalType === 'create' ? '新建验收' : '完成验收'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {modalType === 'create' && (
                <form onSubmit={handleCreate}>
                  <div className="form-group">
                    <label>选择订单 *</label>
                    <select required value={selectedOrder?.id || ''}
                      onChange={e => setSelectedOrder(orders.find(o => o.id == e.target.value))}>
                      <option value="">请选择已还车订单</option>
                      {orders.map(o => (
                        <option key={o.id} value={o.id}>{o.order_no} - {o.customer_name}</option>
                      ))}
                    </select>
                  </div>
                  {selectedOrder && (
                    <div className="alert alert-warning">
                      系统将自动检查该订单的相关信息
                    </div>
                  )}
                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                    <button type="submit" className="btn btn-primary">创建</button>
                  </div>
                </form>
              )}

              {modalType === 'complete' && (
                <form onSubmit={handleComplete}>
                  <p>订单: {selectedInspection?.order_no}</p>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" checked={formData.check_duplicate_dispatch}
                        onChange={e => setFormData({...formData, check_duplicate_dispatch: e.target.checked})} />
                      重复派车检查
                    </label>
                  </div>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" checked={formData.check_cross_city_return}
                        onChange={e => setFormData({...formData, check_cross_city_return: e.target.checked})} />
                      异地还车检查
                    </label>
                  </div>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" checked={formData.check_violations}
                        onChange={e => setFormData({...formData, check_violations: e.target.checked})} />
                      违章检查
                    </label>
                  </div>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" checked={formData.check_damage_fee}
                        onChange={e => setFormData({...formData, check_damage_fee: e.target.checked})} />
                      车损费用确认
                    </label>
                  </div>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" checked={formData.check_maintenance_overdue}
                        onChange={e => setFormData({...formData, check_maintenance_overdue: e.target.checked})} />
                      保养逾期检查
                    </label>
                  </div>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" checked={formData.vehicle_status_match}
                        onChange={e => setFormData({...formData, vehicle_status_match: e.target.checked})} />
                      车辆状态确认一致
                    </label>
                  </div>
                  <div className="form-group">
                    <label>备注</label>
                    <textarea rows="3" value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})} />
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                    <button type="submit" className="btn btn-primary">确认完成</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inspections;
