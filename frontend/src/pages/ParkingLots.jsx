import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api.js';

export default function ParkingLots() {
  const [lots, setLots] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLot, setEditingLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({
    name: '', address: '', latitude: 39.9, longitude: 116.4,
    total_spots: 50, charging_spots: 10, price_per_hour: 10,
    business_hours: '08:00-22:00', entrance_points: '[]'
  });

  const loadLots = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getParkingLots();
      setLots(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLots(); }, [loadLots]);

  function resetForm() {
    setForm({ name: '', address: '', latitude: 39.9, longitude: 116.4, total_spots: 50, charging_spots: 10, price_per_hour: 10, business_hours: '08:00-22:00', entrance_points: '[]' });
    setEditingLot(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const lotData = {
        ...form,
        total_spots: parseInt(form.total_spots),
        charging_spots: parseInt(form.charging_spots),
        price_per_hour: parseFloat(form.price_per_hour),
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        entrance_points: JSON.parse(form.entrance_points || '[]')
      };
      
      if (editingLot) {
        await api.updateParkingLot(editingLot.id, lotData);
      } else {
        await api.createParkingLot(lotData);
      }
      resetForm();
      setShowForm(false);
      loadLots();
    } catch (e) {
      alert('操作失败: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function editLot(lot) {
    setEditingLot(lot);
    setForm({
      ...lot,
      entrance_points: lot.entrance_points || '[]'
    });
    setShowForm(true);
  }

  async function deleteLot(id) {
    try {
      await api.deleteParkingLot(id);
      loadLots();
    } catch (e) {
      alert('删除失败: ' + e.message);
    } finally {
      setDeleteConfirm(null);
    }
  }

  function parseEntrancePoints(points) {
    try {
      const arr = typeof points === 'string' ? JSON.parse(points) : points;
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  if (loading) return <div className="card"><p>加载中...</p></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>🏢 停车场档案</h2>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ 新增停车场</button>
      </div>

      {error && (
        <div className="card" style={{ background: '#fee2e2', marginBottom: '1rem' }}>
          <p style={{ color: '#991b1b' }}>错误: {error}</p>
          <button className="btn btn-sm btn-primary" onClick={loadLots}>重试</button>
        </div>
      )}

      {showForm && (
        <div className="card">
          <h3>{editingLot ? '编辑停车场' : '新增停车场'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>名称 *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>地址 *</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>纬度</label>
                <input type="number" step="0.0001" value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})} />
              </div>
              <div className="form-group">
                <label>经度</label>
                <input type="number" step="0.0001" value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>总车位</label>
                <input type="number" min="0" value={form.total_spots} onChange={e => setForm({...form, total_spots: e.target.value})} />
              </div>
              <div className="form-group">
                <label>充电车位</label>
                <input type="number" min="0" value={form.charging_spots} onChange={e => setForm({...form, charging_spots: e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>单价(元/小时)</label>
                <input type="number" step="0.5" min="0" value={form.price_per_hour} onChange={e => setForm({...form, price_per_hour: e.target.value})} />
              </div>
              <div className="form-group">
                <label>营业时间</label>
                <input value={form.business_hours} onChange={e => setForm({...form, business_hours: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>入口点 (JSON数组)</label>
              <textarea rows="2" value={form.entrance_points} onChange={e => setForm({...form, entrance_points: e.target.value})} placeholder='["东入口", "西入口"]' />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? '保存中...' : '保存'}</button>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>取消</button>
            </div>
          </form>
        </div>
      )}

      {deleteConfirm && (
        <div className="card" style={{ border: '2px solid #fee2e2' }}>
          <p>确定删除停车场「{deleteConfirm.name}」？此操作不可撤销。</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn-danger" onClick={() => deleteLot(deleteConfirm.id)}>确认删除</button>
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>取消</button>
          </div>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>名称</th>
              <th>地址</th>
              <th>位置坐标</th>
              <th>入口点</th>
              <th>总车位/充电位</th>
              <th>价格</th>
              <th>营业时间</th>
              <th>设备状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {lots.length > 0 ? lots.map(lot => (
              <tr key={lot.id}>
                <td><strong>{lot.name}</strong></td>
                <td>{lot.address}</td>
                <td>{parseFloat(lot.latitude).toFixed(4)}, {parseFloat(lot.longitude).toFixed(4)}</td>
                <td>
                  {parseEntrancePoints(lot.entrance_points).length > 0 
                    ? parseEntrancePoints(lot.entrance_points).map((p, i) => <span key={i} className="badge badge-info" style={{ marginRight: '0.25rem' }}>{typeof p === 'object' ? p.name : p}</span>)
                    : '无'}
                </td>
                <td>{lot.total_spots} / {lot.charging_spots}</td>
                <td>¥{lot.price_per_hour}/h</td>
                <td>{lot.business_hours}</td>
                <td>
                  <span className={`badge ${lot.device_status === 'online' ? 'badge-success' : lot.device_status === 'offline' ? 'badge-danger' : 'badge-secondary'}`}>
                    {lot.device_status === 'online' ? '在线' : lot.device_status === 'offline' ? '离线' : '未知'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm btn-secondary" onClick={() => editLot(lot)}>编辑</button>
                  <button className="btn btn-sm btn-danger" style={{ marginLeft: '0.5rem' }} onClick={() => setDeleteConfirm(lot)}>删除</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="9">
                  <div className="empty-state">
                    <div className="icon">🏢</div>
                    <p>暂无停车场数据</p>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>添加第一个停车场</button>
                      <button className="btn btn-secondary" onClick={loadLots}>刷新</button>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
