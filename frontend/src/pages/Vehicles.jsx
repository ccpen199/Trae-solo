import React, { useState, useEffect } from 'react';
import { vehicles, drivers } from '../api';

function Vehicles() {
  const [vehicleList, setVehicleList] = useState([]);
  const [driverList, setDriverList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    plate_number: '',
    vehicle_type: '拖头',
    capacity: 20,
    driver_id: ''
  });

  useEffect(() => {
    loadVehicles();
    loadDrivers();
  }, []);

  const loadVehicles = async () => {
    try {
      const res = await vehicles.getAll();
      setVehicleList(res.data);
    } catch (error) {
      console.error('加载车辆失败:', error);
    }
  };

  const loadDrivers = async () => {
    try {
      const res = await drivers.getAll();
      setDriverList(res.data.filter(d => !d.plate_number));
    } catch (error) {
      console.error('加载司机失败:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await vehicles.create(formData);
      setShowModal(false);
      loadVehicles();
      loadDrivers();
      setFormData({ plate_number: '', vehicle_type: '拖头', capacity: 20, driver_id: '' });
    } catch (error) {
      alert('创建车辆失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const statusMap = {
    available: '空闲',
    busy: '忙碌'
  };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <h2>🚗 车辆管理</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 添加车辆
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>车牌号</th>
              <th>车辆类型</th>
              <th>载重/容量</th>
              <th>绑定司机</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {vehicleList.map(vehicle => (
              <tr key={vehicle.id}>
                <td><strong>{vehicle.plate_number}</strong></td>
                <td>{vehicle.vehicle_type}</td>
                <td>{vehicle.capacity} 吨</td>
                <td>{vehicle.driver_name || '-'}</td>
                <td><span className={`badge badge-${vehicle.status}`}>{statusMap[vehicle.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {vehicleList.length === 0 && <div className="empty-state">暂无车辆数据</div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>添加车辆</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>车牌号</label>
                <input type="text" value={formData.plate_number} onChange={e => setFormData({...formData, plate_number: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>车辆类型</label>
                <select value={formData.vehicle_type} onChange={e => setFormData({...formData, vehicle_type: e.target.value})}>
                  <option value="拖头">拖头</option>
                  <option value="平板车">平板车</option>
                  <option value="厢式货车">厢式货车</option>
                </select>
              </div>
              <div className="form-group">
                <label>载重/容量(吨)</label>
                <input type="number" min="1" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} required />
              </div>
              <div className="form-group">
                <label>绑定司机</label>
                <select value={formData.driver_id} onChange={e => setFormData({...formData, driver_id: e.target.value})}>
                  <option value="">请选择司机(可选)</option>
                  {driverList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">添加车辆</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vehicles;
