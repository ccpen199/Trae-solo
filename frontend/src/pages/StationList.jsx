import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, formatMoney, getStatusColor, getStatusText, getChargerTypeText } from '../api';

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
    const keyword = searchKeyword.toLowerCase();
    const matchKeyword = !searchKeyword ||
      station.name?.toLowerCase().includes(keyword) ||
      station.address?.toLowerCase().includes(keyword);
    return matchCity && matchKeyword;
  });

  const getFaultPiles = (station) => {
    const total = station.total_piles || 0;
    const available = station.available_piles || 0;
    const charging = station.charging_piles || 0;
    const offline = station.offline_piles || 0;
    return Math.max(0, total - available - charging - offline);
  };

  const getCurrentPrice = (station) => {
    if (station.price_per_kwh !== undefined && station.price_per_kwh !== null) {
      return station.price_per_kwh;
    }
    return null;
  };

  const isSearching = searchKeyword.length > 0;
  const hasResults = filteredStations.length > 0;

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>充电站列表</h2>
        </div>
        <div className="loading" style={{ padding: '60px 0' }}>加载中...</div>
      </div>
    );
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

      {!hasResults ? (
        <div className="card">
          <div className="empty">
            {isSearching ? '没有找到符合搜索条件的充电站' : '暂无充电站数据'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3">
          {filteredStations.map(station => (
            <div
              key={station.id}
              className="charger-card"
              onClick={() => navigate(`/stations/${station.id}`)}
              style={{ cursor: 'pointer' }}
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
                  <span className="font-bold" style={{ fontSize: '18px' }}>{station.total_piles || 0} 桩</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress"
                    style={{
                      width: `${station.total_piles > 0 ? ((station.available_piles || 0) / station.total_piles) * 100 : 0}%`,
                      background: '#1890ff'
                    }}
                  ></div>
                </div>
              </div>

              <div className="charger-info">
                <div className="charger-info-item">
                  <span className="label">空闲</span>
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
                  <span className="label">离线</span>
                  <span className="status-badge" style={{
                    background: '#fff1f0',
                    color: '#ff4d4f',
                    marginTop: '4px'
                  }}>
                    {station.offline_piles || 0} 个
                  </span>
                </div>
                <div className="charger-info-item">
                  <span className="label">故障</span>
                  <span className="status-badge" style={{
                    background: '#fff7e6',
                    color: '#faad14',
                    marginTop: '4px'
                  }}>
                    {getFaultPiles(station)} 个
                  </span>
                </div>
              </div>

              <div className="charger-info" style={{ marginTop: '12px' }}>
                <div className="charger-info-item">
                  <span className="label">直流快充</span>
                  <span className="text-primary" style={{ fontWeight: 600, marginTop: '4px' }}>
                    {station.fast_piles || 0} 个
                  </span>
                </div>
                <div className="charger-info-item">
                  <span className="label">交流慢充</span>
                  <span className="text-primary" style={{ fontWeight: 600, marginTop: '4px' }}>
                    {station.slow_piles || 0} 个
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
                  {getCurrentPrice(station) !== null ? (
                    <span className="text-muted text-small">
                      电价: <span className="text-danger font-bold">{formatMoney(getCurrentPrice(station))}/kWh</span>
                    </span>
                  ) : (
                    <span className="text-muted text-small">
                      电价: <span style={{ color: '#8c8c8c' }}>点击查看详情</span>
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
