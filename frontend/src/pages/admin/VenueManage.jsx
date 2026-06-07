import React, { useState, useEffect } from 'react';
import { venueAPI } from '../../api/client';

function VenueManage() {
  const [venues, setVenues] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    address: '',
    capacity: 0,
  });

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    try {
      const result = await venueAPI.list({ limit: 50 });
      setVenues(result.data || []);
    } catch (e) {
      console.error('Load venues failed:', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await venueAPI.create(formData);
      setShowForm(false);
      setFormData({ name: '', city: '', address: '', capacity: 0 });
      loadVenues();
    } catch (e) {
      alert('创建失败');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>场馆管理</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + 新增场馆
        </button>
      </div>

      {showForm && (
        <div className="chart-container">
          <h3 style={{ marginBottom: '1rem' }}>新增场馆</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>场馆名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>城市</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  required
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>地址</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>容量</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">
                保存
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="chart-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>场馆名称</th>
              <th>城市</th>
              <th>地址</th>
              <th>容量</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {venues.map((venue) => (
              <tr key={venue.id}>
                <td>{venue.name}</td>
                <td>{venue.city}</td>
                <td>{venue.address}</td>
                <td>{venue.capacity}</td>
                <td>{venue.created_at?.split('T')[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VenueManage;
