import React, { useState, useEffect } from 'react';
import api from '../services/api';

const STATUS_MAP = {
  active: '生效中',
  expired: '已过期',
  cancelled: '已取消',
  used: '已使用'
};

function Reservation() {
  const [activeTab, setActiveTab] = useState('new');
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [form, setForm] = useState({ plate_number: '', reserve_date: '', reserve_hour: '10' });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadStations();
    loadReservations();
  }, []);

  const loadStations = async () => {
    try {
      const res = await api.getStations();
      setStations(res.data.data);
    } catch (err) {
      console.error('Failed to load stations:', err);
    }
  };

  const loadReservations = async () => {
    try {
      const res = await api.getReservations({});
      setReservations(res.data.data || []);
    } catch (err) {
      console.error('Failed to load reservations:', err);
    }
  };

  const selectStation = async (stationId) => {
    setSelectedStation(stationId);
    setSelectedSpot(null);
    try {
      const res = await api.getStationMap(stationId);
      setSpots(res.data.data.spots.filter(s => s.status === 'available'));
    } catch (err) {
      console.error('Failed to load spots:', err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStation || !selectedSpot || !form.plate_number || !form.reserve_date) {
      setMessage({ type: 'error', text: '请填写完整信息：选择场站、车位、车牌号和预约日期' });
      return;
    }
    try {
      const reserveTime = `${form.reserve_date} ${form.reserve_hour}:00:00`;
      const expireTime = `${form.reserve_date} ${parseInt(form.reserve_hour) + 2}:00:00`;
      await api.createReservation({
        user_id: 1,
        station_id: selectedStation,
        spot_id: selectedSpot.id,
        reserve_time: reserveTime,
        expire_time: expireTime
      });
      setMessage({ type: 'success', text: '预约成功！' });
      setForm({ plate_number: '', reserve_date: '', reserve_hour: '10' });
      setSelectedSpot(null);
      loadReservations();
    } catch (err) {
      setMessage({ type: 'error', text: '预约失败：' + (err.response?.data?.error || err.message) });
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.cancelReservation(id);
      setMessage({ type: 'success', text: '预约已取消' });
      loadReservations();
    } catch (err) {
      setMessage({ type: 'error', text: '取消失败：' + (err.response?.data?.error || err.message) });
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>车位预约</h1>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'new' ? 'active' : ''}`} onClick={() => setActiveTab('new')}>
          新建预约
        </div>
        <div className={`tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
          我的预约
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      {activeTab === 'new' && (
        <div className="card">
          <div className="card-title">新建车位预约</div>

          <div className="form-group">
            <label>选择场站</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {stations.map(s => (
                <button
                  key={s.id}
                  className={`btn ${selectedStation === s.id ? 'btn-primary' : ''}`}
                  onClick={() => selectStation(s.id)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {selectedStation && (
            <>
              <div className="form-group">
                <label>选择车位（{spots.length}个空闲）</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '8px' }}>
                  {spots.slice(0, 30).map(s => (
                    <button
                      key={s.id}
                      className={`btn btn-small ${selectedSpot?.id === s.id ? 'btn-primary' : ''}`}
                      onClick={() => setSelectedSpot(s)}
                      style={s.has_charging ? { border: '2px solid #722ed1' } : {}}
                    >
                      {s.spot_number}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #722ed1', marginRight: '4px', verticalAlign: 'middle' }}></span>
                  带充电枪车位
                </div>
              </div>

              {selectedSpot && (
                <div style={{ padding: '12px', background: '#f0f5ff', borderRadius: '8px', marginBottom: '16px' }}>
                  <strong>已选车位：</strong>{selectedSpot.spot_number}
                  <span style={{ marginLeft: '12px' }}>{selectedSpot.type === 'charging' ? '⚡ 充电车位' : '🅿️ 普通车位'}</span>
                  <span style={{ marginLeft: '12px' }}>¥{selectedSpot.price_per_hour}/小时</span>
                </div>
              )}

              <div className="form-group">
                <label>车牌号</label>
                <input
                  type="text"
                  value={form.plate_number}
                  onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
                  placeholder="请输入车牌号，如：京A12345"
                />
              </div>

              <div className="form-group">
                <label>预约日期</label>
                <input
                  type="date"
                  value={form.reserve_date}
                  onChange={(e) => setForm({ ...form, reserve_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>预约时段</label>
                <select value={form.reserve_hour} onChange={(e) => setForm({ ...form, reserve_hour: e.target.value })}>
                  {Array.from({ length: 14 }, (_, i) => i + 7).map(h => (
                    <option key={h} value={h}>{h}:00 - {h + 2}:00</option>
                  ))}
                </select>
              </div>

              <button className="btn btn-primary" onClick={handleSubmit}>提交预约</button>
            </>
          )}
        </div>
      )}

      {activeTab === 'list' && (
        <div className="card">
          <div className="card-title">我的预约记录</div>
          {reservations.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '48px', textAlign: 'center' }}>📅</div>
              <div style={{ textAlign: 'center', marginTop: '16px', color: '#999' }}>
                <p>暂无预约记录</p>
                <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={() => setActiveTab('new')}>
                  去新建预约
                </button>
              </div>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>预约号</th>
                    <th>场站</th>
                    <th>车位</th>
                    <th>预约时间</th>
                    <th>到期时间</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map(r => (
                    <tr key={r.id}>
                      <td>{r.reservation_no}</td>
                      <td>{r.station_name || '-'}</td>
                      <td>{r.spot_number || '-'}</td>
                      <td>{r.reserve_time}</td>
                      <td>{r.expire_time}</td>
                      <td>
                        <span className={`status-badge ${r.status === 'active' ? 'status-available' : r.status === 'expired' ? 'status-offline' : 'status-pending'}`}>
                          {STATUS_MAP[r.status] || r.status}
                        </span>
                      </td>
                      <td>
                        {r.status === 'active' && (
                          <button className="btn btn-small btn-warning" onClick={() => handleCancel(r.id)}>
                            取消预约
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Reservation;
