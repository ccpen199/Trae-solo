import React, { useState, useEffect } from 'react';
import { drivers } from '../api';

function Drivers() {
  const [driverList, setDriverList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    license_number: '',
    qualifications: ''
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const res = await drivers.getAll();
      setDriverList(res.data);
    } catch (error) {
      console.error('加载司机失败:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await drivers.create(formData);
      setShowModal(false);
      loadDrivers();
      setFormData({ name: '', phone: '', license_number: '', qualifications: '' });
    } catch (error) {
      alert('创建司机失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const statusMap = {
    available: '空闲',
    busy: '忙碌'
  };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <h2>👤 司机管理</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 添加司机
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>电话</th>
              <th>驾驶证号</th>
              <th>资质</th>
              <th>绑定车牌</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {driverList.map(driver => (
              <tr key={driver.id}>
                <td><strong>{driver.name}</strong></td>
                <td>{driver.phone || '-'}</td>
                <td>{driver.license_number || '-'}</td>
                <td>{driver.qualifications || '-'}</td>
                <td>{driver.plate_number || '-'}</td>
                <td><span className={`badge badge-${driver.status}`}>{statusMap[driver.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {driverList.length === 0 && <div className="empty-state">暂无司机数据</div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>添加司机</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>姓名</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>电话</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>驾驶证号</label>
                <input type="text" value={formData.license_number} onChange={e => setFormData({...formData, license_number: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>资质说明</label>
                <input type="text" value={formData.qualifications} onChange={e => setFormData({...formData, qualifications: e.target.value})} placeholder="如：危化品运输证、普通货运证等" />
              </div>
              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">添加司机</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Drivers;
