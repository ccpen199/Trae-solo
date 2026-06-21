import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, getStatusColor, getStatusText, getChargerTypeText, formatMoney, formatEnergy } from '../api';

function StationList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      setLoading(true);
      const res = await API.stations.list();
      const data = res.data || [];
      setStations(data);
      
      const uniqueCities = [...new Set(data.map(s => s.city).filter(Boolean))];
      setCities(uniqueCities);
    } catch (err) {
      console.error('加载充电站列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStations = stations.filter(station => {
    const matchCity = selectedCity === 'all' || station.city === selectedCity;
    const matchKeyword = !searchKeyword || 
      station.name.includes(searchKeyword) || 
      station.address.includes(searchKeyword);
    return matchCity && matchKeyword;
  });

  const getOfflinePiles = (station) => {
    return station.total_piles - (station.available_piles || 0) - (station.charging_piles || 0);
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>充电站列表</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-default btn-sm" onClick={loadStations}>
              🔄 刷新
            </button>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>城市筛选</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              <option value="all">全部城市</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>搜索</label>
            <input
              type="text"
              placeholder="输入充电站名称或地址..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginTop: '16px', color: '#8c8c8c' }}>
          共找到 <span style={{ color: '#1890ff', fontWeight: 600 }}>{filteredStations.length}</span> 个充电站
        </div>
      </div>

      {filteredStations.length === 0 ? (
        <div className="card">
          <div className="empty">暂无符合条件的充电站</div>
        </div>
      ) : (
        <div className="grid grid-cols-3">
          {filteredStations.map(station => (
            <div
              key={station.id}
              className="charger-card"
              onClick={() => navigate(`/stations/${station.id}`)}
            >
              <div className="charger-card-header">
                <span className="font-bold font-large">{station.name}</span>
                <span className="badge badge-flat">{station.city}</span>
              </div>

              <div className="text-muted text-small mb-16" style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                <span>📍</span>
                <span>{station.address}</span>
              </div>

              <div className="mb-16">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="text-muted">总桩数</span>
                  <span className="font-bold" style={{ fontSize: '18px' }}>{station.total_piles} 桩</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress" 
                    style={{ 
                      width: `${((station.available_piles || 0) / station.total_piles) * 100}%`,
                      background: '#1890ff'
                    }}
                  ></div>
                </div>
              </div>

              <div className="charger-info">
                <div className="charger-info-item">
                  <span className="label">空闲桩数</span>
                  <span className="status-badge" style={{ 
                    background: '#e6f7ff', 
                    color: '#1890ff',
                    marginTop: '4px'
                  }}>
                    {station.available_piles || 0} 个
                  </span>
                </div>
                <div className="charger-info-item">
                  <span className="label">充电中</span>
                  <span className="status-badge" style={{ 
                    background: '#f6ffed', 
                    color: '#52c41a',
                    marginTop: '4px'
                  }}>
                    {station.charging_piles || 0} 个
                  </span>
                </div>
                <div className="charger-info-item">
                  <span className="label">离线桩数</span>
                  <span className="status-badge" style={{ 
                    background: '#fff1f0', 
                    color: '#ff4d4f',
                    marginTop: '4px'
                  }}>
                    {getOfflinePiles(station)} 个
                  </span>
                </div>
                <div className="charger-info-item">
                  <span className="label">充电桩类型</span>
                  <span className="text-primary" style={{ 
                    fontWeight: 600,
                    marginTop: '4px'
                  }}>
                    {station.charger_type ? getChargerTypeText(station.charger_type) : '-'}
                  </span>
                </div>
              </div>

              <div style={{ 
                marginTop: '16px', 
                paddingTop: '12px', 
                borderTop: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  {station.price_per_kwh !== undefined && (
                    <span className="text-muted text-small">
                      电价: <span className="text-danger font-bold">{formatMoney(station.price_per_kwh)}/kWh</span>
                    </span>
                  )}
                </div>
                <span className="text-primary text-small">
                  查看详情 →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StationList;
