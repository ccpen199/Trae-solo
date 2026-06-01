import React, { useState, useEffect } from 'react';
import { vehiclesAPI, storesAPI } from '../api.js';

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [stores, setStores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    plate_number: '', brand: '', model: '', year: '', color: '',
    mileage: 0, store_id: '', status: 'available',
    insurance_expire_date: '', inspection_expire_date: '',
    maintenance_cycle_km: 5000, daily_rate: 200
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [vehiclesRes, storesRes] = await Promise.all([
        vehiclesAPI.getAll(),
        storesAPI.getAll()
      ]);
      setVehicles(vehiclesRes.data);
      setStores(storesRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await vehiclesAPI.update(editingVehicle.id, formData);
      } else {
        await vehiclesAPI.create(formData);
      }
      setShowModal(false);
      setEditingVehicle(null);
      resetForm();
      loadData();
    } catch (err) {
      alert('操作失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      plate_number: vehicle.plate_number,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year || '',
      color: vehicle.color || '',
      mileage: vehicle.mileage,
      store_id: vehicle.store_id || '',
      status: vehicle.status,
      insurance_expire_date: vehicle.insurance_expire_date || '',
      inspection_expire_date: vehicle.inspection_expire_date || '',
      maintenance_cycle_km: vehicle.maintenance_cycle_km,
      daily_rate: vehicle.daily_rate
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('确定要删除这辆车吗？')) {
      try {
        await vehiclesAPI.delete(id);
        loadData();
      } catch (err) {
        alert('删除失败：该车辆可能有关联订单或保养记录');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      plate_number: '', brand: '', model: '', year: '', color: '',
      mileage: 0, store_id: '', status: 'available',
      insurance_expire_date: '', inspection_expire_date: '',
      maintenance_cycle_km: 5000, daily_rate: 200
    });
  };

  const getStatusLabel = (status) => {
    const labels = { available: '可租', rented: '已租', maintenance: '维修中' };
    return labels[status] || status;
  };

  return (
    <div>
      <div className="page-header">
        <h1>车辆管理</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setEditingVehicle(null); setShowModal(true); }}>
          + 添加车辆
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>车牌</th>
                <th>品牌</th>
                <th>型号</th>
                <th>年份</th>
                <th>里程</th>
                <th>日租金</th>
                <th>门店</th>
                <th>状态</th>
                <th>提醒</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id}>
                  <td>{v.plate_number}</td>
                  <td>{v.brand}</td>
                  <td>{v.model}</td>
                  <td>{v.year}</td>
                  <td>{v.mileage.toLocaleString()} km</td>
                  <td>¥{v.daily_rate}</td>
                  <td>{v.store_name}</td>
                  <td><span className={`status-badge status-${v.status}`}>{getStatusLabel(v.status)}</span></td>
                  <td>
                    {v.is_insurance_expired && <span className="status-badge expired-badge">保险过期</span>}
                    {v.is_inspection_expired && <span className="status-badge expired-badge">年检过期</span>}
                    {v.need_maintenance && <span className="status-badge status-pending">需保养</span>}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-sm btn-primary" onClick={() => handleEdit(v)}>编辑</button>
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
              <h2>{editingVehicle ? '编辑车辆' : '添加车辆'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>车牌号 *</label>
                    <input type="text" required value={formData.plate_number}
                      onChange={e => setFormData({...formData, plate_number: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>品牌 *</label>
                    <input type="text" required value={formData.brand}
                      onChange={e => setFormData({...formData, brand: e.target.value})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>型号 *</label>
                    <input type="text" required value={formData.model}
                      onChange={e => setFormData({...formData, model: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>年份</label>
                    <input type="number" value={formData.year}
                      onChange={e => setFormData({...formData, year: e.target.value})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>颜色</label>
                    <input type="text" value={formData.color}
                      onChange={e => setFormData({...formData, color: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>里程 (km)</label>
                    <input type="number" value={formData.mileage}
                      onChange={e => setFormData({...formData, mileage: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>门店</label>
                    <select value={formData.store_id} onChange={e => setFormData({...formData, store_id: e.target.value})}>
                      <option value="">请选择</option>
                      {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>日租金 (¥)</label>
                    <input type="number" value={formData.daily_rate}
                      onChange={e => setFormData({...formData, daily_rate: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>保险到期日</label>
                    <input type="date" value={formData.insurance_expire_date}
                      onChange={e => setFormData({...formData, insurance_expire_date: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>年检到期日</label>
                    <input type="date" value={formData.inspection_expire_date}
                      onChange={e => setFormData({...formData, inspection_expire_date: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>保养周期 (km)</label>
                  <input type="number" value={formData.maintenance_cycle_km}
                    onChange={e => setFormData({...formData, maintenance_cycle_km: parseInt(e.target.value) || 5000})} />
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

export default Vehicles;
