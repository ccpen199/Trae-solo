import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  API,
  getStatusColor,
  getStatusText,
  getChargerTypeText,
  getPeriodText,
  getPeriodColor,
  formatMoney,
  formatEnergy,
  formatDuration
} from '../api';

function StationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [station, setStation] = useState(null);
  const [chargers, setChargers] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [activeTab, setActiveTab] = useState('chargers');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stationRes, chargersRes, pricingRes] = await Promise.all([
        API.stations.detail(id),
        API.stations.chargers(id),
        API.stations.price(id)
      ]);
      setStation(stationRes.data);
      setChargers(chargersRes.data);
      setPricing(pricingRes.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const available = chargers.filter(c => c.status === 'available').length;
    const charging = chargers.filter(c => c.status === 'charging' || c.status === 'occupied').length;
    const offline = chargers.filter(c => c.status === 'offline').length;
    return { available, charging, offline, total: chargers.length };
  };

  const getChargerIcon = (type) => {
    return type === 'fast' ? '⚡' : '🔌';
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!station) {
    return <div className="empty">充电站不存在</div>;
  }

  const stats = getStats();

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <h2>{station.name}</h2>
            <div className="text-muted text-small mt-8">
              📍 {station.address}
            </div>
            <div className="text-muted text-small mt-8">
              🗺️ 坐标: {station.latitude}, {station.longitude}
            </div>
          </div>
          <button className="btn btn-default" onClick={() => navigate(-1)}>
            ← 返回
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 mb-16">
        <div className="stat-card blue">
          <div className="label">空闲桩</div>
          <div className="value">{stats.available}<span className="unit">台</span></div>
          <div className="trend">共 {stats.total} 台充电桩</div>
        </div>
        <div className="stat-card green">
          <div className="label">充电中</div>
          <div className="value">{stats.charging}<span className="unit">台</span></div>
          <div className="trend">实时监控中</div>
        </div>
        <div className="stat-card red">
          <div className="label">离线桩</div>
          <div className="value">{stats.offline}<span className="unit">台</span></div>
          <div className="trend">需关注</div>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          <div
            className={`tab ${activeTab === 'chargers' ? 'active' : ''}`}
            onClick={() => setActiveTab('chargers')}
          >
            🔌 充电桩列表
          </div>
          <div
            className={`tab ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            💰 电价策略
          </div>
        </div>

        {activeTab === 'chargers' && (
          <div>
            {chargers.length === 0 ? (
              <div className="empty">暂无充电桩</div>
            ) : (
              <div className="grid grid-cols-2">
                {chargers.map(charger => (
                  <div
                    key={charger.id}
                    className={`charger-card ${charger.status === 'offline' ? 'offline' : ''}`}
                    onClick={() => navigate(`/chargers/${charger.id}`)}
                  >
                    <div className="charger-card-header">
                      <div>
                        <span className="font-bold font-large">
                          {getChargerIcon(charger.type)} {charger.code}
                        </span>
                        <div className="charger-code">{charger.manufacturer} · {charger.model}</div>
                      </div>
                      <span
                        className={`charger-type ${charger.type === 'fast' ? 'fast' : 'slow'}`}
                      >
                        {getChargerTypeText(charger.type)}
                      </span>
                    </div>

                    <div className="flex-between mb-8">
                      <div>
                        <span className="text-muted text-small">额定功率</span>
                        <div className="font-bold">{charger.rated_power} kW</div>
                      </div>
                      <div>
                        <span className="text-muted text-small">状态</span>
                        <div>
                          <span
                            className="status-badge"
                            style={{
                              background: getStatusColor(charger.status) + '20',
                              color: getStatusColor(charger.status)
                            }}
                          >
                            {getStatusText(charger.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {charger.status !== 'offline' && (
                      <>
                        <div className="charger-info">
                          <div className="charger-info-item">
                            <span className="label">电压</span>
                            <span className="value">{charger.voltage || '--'} V</span>
                          </div>
                          <div className="charger-info-item">
                            <span className="label">电流</span>
                            <span className="value">{charger.current || '--'} A</span>
                          </div>
                          <div className="charger-info-item">
                            <span className="label">实时功率</span>
                            <span className="value">{formatEnergy(charger.power || 0)}/h</span>
                          </div>
                          <div className="charger-info-item">
                            <span className="label">温度</span>
                            <span className="value">{charger.temperature || '--'} °C</span>
                          </div>
                        </div>

                        {charger.soc !== null && charger.soc !== undefined && (
                          <div className="mt-16">
                            <div className="flex-between mb-8">
                              <span className="text-muted text-small">SOC</span>
                              <span className="font-bold">{charger.soc}%</span>
                            </div>
                            <div className="progress-bar">
                              <div
                                className="progress"
                                style={{
                                  width: `${charger.soc}%`,
                                  background: charger.soc > 80 ? '#52c41a' : charger.soc > 30 ? '#faad14' : '#ff4d4f'
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {charger.occupied_duration && charger.status !== 'available' && (
                          <div className="mt-16 text-right">
                            <span className="text-muted text-small">占用时长: </span>
                            <span className="font-bold text-primary">
                              {formatDuration(charger.occupied_duration)}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pricing' && (
          <div>
            {pricing.length === 0 ? (
              <div className="empty">暂无电价策略</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>时段类型</th>
                    <th>时段</th>
                    <th>电价</th>
                    <th>服务费</th>
                    <th>总电价</th>
                  </tr>
                </thead>
                <tbody>
                  {pricing.map((price, index) => (
                    <tr key={index}>
                      <td>
                        <span
                          className="period-tag"
                          style={{
                            background: `linear-gradient(90deg, ${getPeriodColor(price.period)}, ${getPeriodColor(price.period)}aa)`,
                            color: 'white'
                          }}
                        >
                          {getPeriodText(price.period)}
                        </span>
                      </td>
                      <td>{price.start_time} - {price.end_time}</td>
                      <td>{formatMoney(price.electricity_price)}/kWh</td>
                      <td>{formatMoney(price.service_fee)}/kWh</td>
                      <td className="font-bold text-danger">
                        {formatMoney(price.electricity_price + price.service_fee)}/kWh
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StationDetail;
