import React, { useState, useEffect } from 'react';
import { violationsAPI, vehiclesAPI, ordersAPI } from '../api.js';

function Violations() {
  const [violations, setViolations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    order_id: '', vehicle_id: '', type: '', description: '', occur_date: '', fine_amount: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [vioRes, vehRes, ordRes] = await Promise.all([
      violationsAPI.getAll(),
      vehiclesAPI.getAll(),
      ordersAPI.getAll()
    ]);
    setViolations(vioRes.data);
    setVehicles(vehRes.data);
    setOrders(ordRes.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRecord) {
        await violationsAPI.update(editingRecord.id, formData);
      } else {
        await violationsAPI.create(formData);
      }
      setShowModal(false);
      setEditingRecord(null);
      resetForm();
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleProcess = async (id) => {
    try {
      await violationsAPI.process(id, { status: 'processed' });
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      order_id: record.order_id || '',
      vehicle_id: record.vehicle_id,
      type: record.type,
      description: record.description,
      occur_date: record.occur_date,
      fine_amount: record.fine_amount
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('确定要删除这条记录吗？')) {
      try {
        await violationsAPI.delete(id);
        loadData();
      } catch (err) {
        alert('删除失败');
      }
    }
  };

  const resetForm = () => setFormData({
    order_id: '', vehicle_id: '', type: '', description: '', occur_date: '', fine_amount: 0
  });

  const getStatusLabel = (status) => {
    const labels = { pending: '待处理', processed: '已处理' };
    return labels[status] || status;
  };

  return (
    <div>
      <div className="page-header">
        <h1>违章管理</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setEditingRecord(null); setShowModal(true); }}>
          + 新增违章
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>订单</th>
                <th>车辆</th>
                <th>违章类型</th>
                <th>描述</th>
                <th>发生日期</th>
                <th>罚款金额</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {violations.map(v => (
                <tr key={v.id}>
                  <td>{v.order_no || '-'}</td>
                  <td>{v.brand} {v.model} ({v.plate_number})</td>
                  <td>{v.type}</td>
                  <td>{v.description}</td>
                  <td>{v.occur_date}</td>
                  <td>¥{v.fine_amount}</td>
                  <td><span className={`status-badge status-${v.status}`}>{getStatusLabel(v.status)}</span></td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-sm btn-primary" onClick={() => handleEdit(v)}>编辑</button>
                      {v.status === 'pending' && (
                        <button className="btn btn-sm btn-success" onClick={() => handleProcess(v.id)}>处理</button>
                      )}
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(v.id)}>删除</button>
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
              <h2>{editingRecord ? '编辑违章' : '新增违章'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>车辆 *</label>
                    <select required value={formData.vehicle_id}
                      onChange={e => setFormData({...formData, vehicle_id: e.target.value})}>
                      <option value="">请选择</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate_number})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>关联订单</label>
                    <select value={formData.order_id}
                      onChange={e => setFormData({...formData, order_id: e.target.value})}>
                      <option value="">无</option>
                      {orders.map(o => <option key={o.id} value={o.id}>{o.order_no}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>违章类型 *</label>
                  <input type="text" required value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>描述</label>
                  <textarea rows="3" value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>发生日期</label>
                    <input type="date" value={formData.occur_date}
                      onChange={e => setFormData({...formData, occur_date: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>罚款金额 (¥)</label>
                    <input type="number" value={formData.fine_amount}
                      onChange={e => setFormData({...formData, fine_amount: parseFloat(e.target.value) || 0})} />
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
    </div>
  );
}

export default Violations;
