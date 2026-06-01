import React, { useState, useEffect } from 'react';
import { maintenancesAPI, vehiclesAPI } from '../api.js';

function Maintenances() {
  const [maintenances, setMaintenances] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({
    vehicle_id: '', type: 'maintenance', description: '', mileage: 0, cost: 0, scheduled_date: ''
  });
  const [completeForm, setCompleteForm] = useState({ cost: 0, description: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [mainRes, vehRes] = await Promise.all([
      maintenancesAPI.getAll(),
      vehiclesAPI.getAll()
    ]);
    setMaintenances(mainRes.data);
    setVehicles(vehRes.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await maintenancesAPI.create(formData);
      setShowModal(false);
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleStart = async (id) => {
    try {
      await maintenancesAPI.start(id);
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    try {
      await maintenancesAPI.complete(selectedRecord.id, completeForm);
      setShowModal(false);
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  };

  const openCompleteModal = (record) => {
    setSelectedRecord(record);
    setCompleteForm({ cost: record.cost, description: record.description });
    setModalType('complete');
    setShowModal(true);
  };

  const getTypeLabel = (type) => {
    const labels = { maintenance: '常规保养', repair: '维修' };
    return labels[type] || type;
  };

  const getStatusLabel = (status) => {
    const labels = { pending: '待处理', in_progress: '进行中', completed: '已完成' };
    return labels[status] || status;
  };

  return (
    <div>
      <div className="page-header">
        <h1>保养维修</h1>
        <button className="btn btn-primary" onClick={() => { setModalType('create'); setShowModal(true); }}>
          + 新建记录
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>车辆</th>
                <th>类型</th>
                <th>描述</th>
                <th>费用</th>
                <th>预约日期</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {maintenances.map(m => (
                <tr key={m.id}>
                  <td>{m.brand} {m.model} ({m.plate_number})</td>
                  <td>{getTypeLabel(m.type)}</td>
                  <td>{m.description}</td>
                  <td>¥{m.cost}</td>
                  <td>{m.scheduled_date}</td>
                  <td><span className={`status-badge status-${m.status}`}>{getStatusLabel(m.status)}</span></td>
                  <td>
                    <div className="action-buttons">
                      {m.status === 'pending' && (
                        <button className="btn btn-sm btn-primary" onClick={() => handleStart(m.id)}>开始</button>
                      )}
                      {m.status === 'in_progress' && (
                        <button className="btn btn-sm btn-success" onClick={() => openCompleteModal(m)}>完成</button>
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
              <h2>{modalType === 'create' ? '新建保养/维修' : '完成保养/维修'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {modalType === 'create' && (
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>车辆 *</label>
                    <select required value={formData.vehicle_id}
                      onChange={e => setFormData({...formData, vehicle_id: e.target.value})}>
                      <option value="">请选择</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate_number})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>类型</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                      <option value="maintenance">常规保养</option>
                      <option value="repair">维修</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>描述</label>
                    <textarea rows="3" value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>当前里程 (km)</label>
                      <input type="number" value={formData.mileage}
                        onChange={e => setFormData({...formData, mileage: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="form-group">
                      <label>预约日期</label>
                      <input type="date" value={formData.scheduled_date}
                        onChange={e => setFormData({...formData, scheduled_date: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                    <button type="submit" className="btn btn-primary">创建</button>
                  </div>
                </form>
              )}

              {modalType === 'complete' && (
                <form onSubmit={handleComplete}>
                  <p>车辆: {selectedRecord?.brand} {selectedRecord?.model}</p>
                  <div className="form-group">
                    <label>实际费用 (¥)</label>
                    <input type="number" value={completeForm.cost}
                      onChange={e => setCompleteForm({...completeForm, cost: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="form-group">
                    <label>完成说明</label>
                    <textarea rows="3" value={completeForm.description}
                      onChange={e => setCompleteForm({...completeForm, description: e.target.value})} />
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

export default Maintenances;
