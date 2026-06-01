import React, { useState } from 'react';
import { api } from '../api.js';

export default function Guidance() {
  const [recommendations, setRecommendations] = useState([]);
  const [preferences, setPreferences] = useState({
    distance_weight: 0.3,
    spot_weight: 0.3,
    price_weight: 0.2
  });
  const [userLocation, setUserLocation] = useState({ lat: 39.9042, lng: 116.4074 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  function showMessage(text, type = 'success') {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }

  async function getRecommendations() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRecommendations({
        user_lat: parseFloat(userLocation.lat),
        user_lng: parseFloat(userLocation.lng),
        preferences
      });
      setRecommendations(data);
      if (data.length === 0) {
        showMessage('暂无可用停车场，请先初始化数据', 'warning');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleClick(lot) {
    try {
      await api.recordGuidanceClick({
        parking_lot_id: lot.id,
        user_session: 'web_user_' + Date.now()
      });
      showMessage('已记录导航点击：' + lot.name);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleArrive(lot) {
    try {
      await api.recordArrive({
        parking_lot_id: lot.id,
        user_session: 'web_user_' + Date.now()
      });
      showMessage('✓ 已记录到达：' + lot.name);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>🧭 停车诱导推荐</h2>

      {error && (
        <div className="card" style={{ background: '#fee2e2', marginBottom: '1rem' }}>
          <p style={{ color: '#991b1b', margin: 0 }}>{error}</p>
        </div>
      )}

      {message && (
        <div className="card" style={{ background: message.type === 'warning' ? '#fef3c7' : '#d1fae5', marginBottom: '1rem' }}>
          <p style={{ color: message.type === 'warning' ? '#92400e' : '#065f46', margin: 0 }}>{message.text}</p>
        </div>
      )}

      <div className="card">
        <h3>用户偏好设置</h3>
        <div className="form-row">
          <div className="form-group">
            <label>当前纬度</label>
            <input type="number" step="0.0001" value={userLocation.lat} onChange={e => setUserLocation({...userLocation, lat: e.target.value})} />
          </div>
          <div className="form-group">
            <label>当前经度</label>
            <input type="number" step="0.0001" value={userLocation.lng} onChange={e => setUserLocation({...userLocation, lng: e.target.value})} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>距离权重 (0-1)</label>
            <input type="number" step="0.1" min="0" max="1" value={preferences.distance_weight} onChange={e => setPreferences({...preferences, distance_weight: parseFloat(e.target.value)})} />
          </div>
          <div className="form-group">
            <label>车位权重 (0-1)</label>
            <input type="number" step="0.1" min="0" max="1" value={preferences.spot_weight} onChange={e => setPreferences({...preferences, spot_weight: parseFloat(e.target.value)})} />
          </div>
          <div className="form-group">
            <label>价格权重 (0-1)</label>
            <input type="number" step="0.1" min="0" max="1" value={preferences.price_weight} onChange={e => setPreferences({...preferences, price_weight: parseFloat(e.target.value)})} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={getRecommendations} disabled={loading}>
          {loading ? '加载中...' : '获取推荐'}
        </button>
      </div>

      {recommendations.length > 0 && (
        <div className="card">
          <h3>推荐停车场（按综合评分排序）</h3>
          <table className="table">
            <thead>
              <tr>
                <th>排名</th>
                <th>名称</th>
                <th>距离</th>
                <th>空闲车位</th>
                <th>价格</th>
                <th>评分</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((lot, idx) => (
                <tr key={lot.id}>
                  <td><span className="badge badge-info">#{idx + 1}</span></td>
                  <td>
                    <strong>{lot.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{lot.address}</div>
                  </td>
                  <td>{lot.distance} km</td>
                  <td>
                    <span className={`badge ${lot.available_spots > 10 ? 'badge-success' : 'badge-warning'}`}>
                      {lot.available_spots} 个
                    </span>
                  </td>
                  <td>¥{lot.price_per_hour}/h</td>
                  <td><strong>{lot.score}</strong></td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => handleClick(lot)}>导航</button>
                    <button className="btn btn-sm btn-success" style={{ marginLeft: '0.5rem' }} onClick={() => handleArrive(lot)}>到达</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {recommendations.length === 0 && !loading && !error && (
        <div className="card">
          <div className="empty-state">
            <div className="icon">🧭</div>
            <p>点击「获取推荐」查看适合您的停车场</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>如无数据，请先在「管理后台」初始化演示数据</p>
          </div>
        </div>
      )}
    </div>
  );
}
