import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api.js';

export default function SpotStatus() {
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [spotData, setSpotData] = useState(null);
  const [loadingLots, setLoadingLots] = useState(true);
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [updatingSpotId, setUpdatingSpotId] = useState(null);
  const [error, setError] = useState(null);

  const nextStatusMap = {
    available: 'occupied',
    occupied: 'available',
    reserved: 'available',
    fault: 'available'
  };

  const statusLabels = {
    available: { label: '空闲', class: 'badge-success' },
    occupied: { label: '占用', class: 'badge-danger' },
    reserved: { label: '预留', class: 'badge-warning' },
    fault: { label: '故障', class: 'badge-secondary' }
  };

  const loadLots = useCallback(async () => {
    try {
      const data = await api.getParkingLots();
      setLots(data);
      if (data.length > 0 && !selectedLot) {
        setSelectedLot(data[0].id);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingLots(false);
    }
  }, [selectedLot]);

  const loadSpots = useCallback(async () => {
    if (!selectedLot) return;
    setLoadingSpots(true);
    try {
      const data = await api.getSpotStatus(selectedLot);
      setSpotData(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingSpots(false);
    }
  }, [selectedLot]);

  useEffect(() => { loadLots(); }, [loadLots]);
  useEffect(() => { if (selectedLot) loadSpots(); }, [selectedLot, loadSpots]);

  async function handleSpotClick(spot) {
    if (updatingSpotId) return;
    const nextStatus = nextStatusMap[spot.status] || 'available';
    setUpdatingSpotId(spot.id);
    try {
      await api.updateSpot(spot.id, { status: nextStatus, is_trusted: true });
      loadSpots();
    } catch (e) {
      setError(e.message);
    } finally {
      setUpdatingSpotId(null);
    }
  }

  if (loadingLots) return <div className="card"><p>加载中...</p></div>;

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>🅿️ 实时车位状态</h2>

      {error && (
        <div className="card" style={{ background: '#fee2e2', marginBottom: '1rem' }}>
          <p style={{ color: '#991b1b' }}>错误: {error}</p>
          <button className="btn btn-sm btn-primary" onClick={loadSpots}>重试</button>
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <select 
          className="form-group"
          style={{ width: '300px', padding: '0.625rem' }}
          value={selectedLot || ''} 
          onChange={e => setSelectedLot(parseInt(e.target.value))}
          disabled={loadingLots || lots.length === 0}
        >
          {lots.length === 0 ? (
            <option value="">暂无停车场</option>
          ) : (
            lots.map(lot => (
              <option key={lot.id} value={lot.id}>{lot.name} ({lot.total_spots}车位)</option>
            ))
          )}
        </select>
      </div>

      {loadingSpots ? (
        <div className="card"><p>加载车位数据中...</p></div>
      ) : spotData && (
        <>
          <div className="stats-grid">
            <div className="stat-card success">
              <div className="label">空闲</div>
              <div className="value">{spotData.stats.available}</div>
            </div>
            <div className="stat-card danger">
              <div className="label">占用</div>
              <div className="value">{spotData.stats.occupied}</div>
            </div>
            <div className="stat-card warning">
              <div className="label">预留</div>
              <div className="value">{spotData.stats.reserved}</div>
            </div>
            <div className="stat-card">
              <div className="label">故障</div>
              <div className="value">{spotData.stats.fault}</div>
            </div>
            <div className="stat-card">
              <div className="label">数据异常</div>
              <div className="value">{spotData.stats.untrusted}</div>
            </div>
          </div>

          <div className="card">
            <p style={{ marginBottom: '1rem', color: '#64748b' }}>
              <strong>最后更新：</strong>{spotData.stats.last_update || '-'}
              {spotData.stats.untrusted > 0 && (
                <span className="badge badge-warning" style={{ marginLeft: '1rem' }}>
                  ⚠️ {spotData.stats.untrusted} 个车位数据不可信
                </span>
              )}
            </p>
            
            <div className="spot-grid">
              {spotData.spots.length > 0 ? spotData.spots.map(spot => (
                <div 
                  key={spot.id}
                  className={`spot-item spot-${spot.status} ${!spot.is_trusted ? 'spot-untrusted' : ''} ${updatingSpotId === spot.id ? 'updating' : ''}`}
                  onClick={() => handleSpotClick(spot)}
                  style={{ opacity: updatingSpotId === spot.id ? 0.5 : 1, cursor: updatingSpotId === spot.id ? 'not-allowed' : 'pointer' }}
                  title={`${spot.spot_number} - ${statusLabels[spot.status].label}${!spot.is_trusted ? ' (数据不可信)' : ''}\n点击切换状态`}
                >
                  <div style={{ fontWeight: 'bold' }}>
                    {updatingSpotId === spot.id ? '⏳' : spot.spot_number}
                  </div>
                  <div style={{ fontSize: '0.625rem', marginTop: '0.25rem' }}>
                    {spot.spot_type === 'charging' ? '⚡ ' : ''}{statusLabels[spot.status].label}
                  </div>
                </div>
              )) : (
                <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                  <div className="icon">🅿️</div>
                  <p>暂无车位数据</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3>图例说明</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '24px', height: '24px', background: '#d1fae5', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}></div>
                <span>空闲</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '24px', height: '24px', background: '#fee2e2', borderRadius: '4px' }}></div>
                <span>占用</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '24px', height: '24px', background: '#fef3c7', borderRadius: '4px' }}></div>
                <span>预留</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '24px', height: '24px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                <span>故障</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '24px', height: '24px', background: '#d1fae5', borderRadius: '4px', border: '2px solid #f59e0b' }}></div>
                <span>数据不可信</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '16px' }}>⚡</span>
                <span>充电车位</span>
              </div>
            </div>
          </div>
        </>
      )}

      {lots.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="icon">🏢</div>
            <p>暂无停车场数据</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>请先在「管理后台」初始化演示数据</p>
          </div>
        </div>
      )}
    </div>
  );
}
