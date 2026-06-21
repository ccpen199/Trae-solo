import React, { useState } from 'react';
import {
  API,
  formatMoney,
  formatEnergy,
  formatDuration,
  formatDateTime,
  getChargerTypeText,
  getPeriodText,
  getPeriodColor
} from '../api';

function Recommendation() {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [reservingId, setReservingId] = useState(null);
  const [formData, setFormData] = useState({
    latitude: 39.9087,
    longitude: 116.4123,
    batteryCapacity: 60,
    currentSoc: 30,
    range: 400,
    targetSoc: 80,
    preferFast: true,
    preferLowPrice: false,
    maxDistance: 5,
    destination: ''
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await API.recommendation.get(formData);
      const data = res.data || [];
      data.sort((a, b) => b.score - a.score);
      setRecommendations(data);
    } catch (err) {
      console.error('获取推荐结果失败:', err);
      alert('获取推荐结果失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (item) => {
    if (!confirm(`确定要预约 ${item.station.name} 的充电桩吗？`)) {
      return;
    }
    try {
      setReservingId(item.station.id);
      const res = await API.recommendation.reserve({
        stationId: item.station.id,
        chargerId: item.charger.id,
        userId: 'user_001'
      });
      if (res.success) {
        alert(`预约成功！预约号: ${res.data?.reservationCode || '已生成'}`);
      } else {
        alert(res.message || '预约失败');
      }
    } catch (err) {
      console.error('预约失败:', err);
      alert('预约失败，请重试');
    } finally {
      setReservingId(null);
    }
  };

  const handleNavigate = (station) => {
    const url = `https://uri.amap.com/navigation?to=${station.longitude},${station.latitude},${station.name}&mode=car&policy=1&src=evcharger&coordinate=gaode&callnative=1`;
    window.open(url, '_blank');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getFullChargeTime = (item) => {
    if (!item.estimation) return '-';
    const now = new Date();
    now.setSeconds(now.getSeconds() + item.estimation.chargeDuration);
    return formatDateTime(now.toISOString());
  };

  return (
    <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 120px)' }}>
      <div style={{ width: '360px', flexShrink: 0, overflowY: 'auto' }}>
        <form onSubmit={handleSubmit}>
          <div className="card">
            <div className="card-header">
              <h2>智能推荐</h2>
            </div>

            <div className="form-group">
              <label>当前位置</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  step="0.0001"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="纬度"
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  step="0.0001"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="经度"
                  style={{ flex: 1 }}
                />
              </div>
              <div className="text-muted text-small mt-4">默认: 北京国贸 (39.9087, 116.4123)</div>
            </div>

            <div className="form-group">
              <label>车辆信息</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    name="batteryCapacity"
                    value={formData.batteryCapacity}
                    onChange={handleInputChange}
                    placeholder="电池容量"
                  />
                  <div className="text-muted text-small mt-4">电池容量 (kWh)</div>
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    name="currentSoc"
                    min="0"
                    max="100"
                    value={formData.currentSoc}
                    onChange={handleInputChange}
                    placeholder="当前SOC"
                  />
                  <div className="text-muted text-small mt-4">当前SOC (%)</div>
                </div>
              </div>
              <input
                type="number"
                name="range"
                value={formData.range}
                onChange={handleInputChange}
                placeholder="续航里程"
              />
              <div className="text-muted text-small mt-4">续航里程 (km)</div>
            </div>

            <div className="form-group">
              <label>目标SOC</label>
              <input
                type="number"
                name="targetSoc"
                min="0"
                max="100"
                value={formData.targetSoc}
                onChange={handleInputChange}
              />
              <div className="text-muted text-small mt-4">目标充电量 (%)</div>
            </div>

            <div className="form-group">
              <label>偏好设置</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="preferFast"
                    checked={formData.preferFast}
                    onChange={handleInputChange}
                  />
                  <span>优先快充</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="preferLowPrice"
                    checked={formData.preferLowPrice}
                    onChange={handleInputChange}
                  />
                  <span>优先低价</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>最大搜索距离</label>
              <input
                type="number"
                name="maxDistance"
                min="1"
                max="50"
                value={formData.maxDistance}
                onChange={handleInputChange}
              />
              <div className="text-muted text-small mt-4">搜索半径 (km)</div>
            </div>

            <div className="form-group">
              <label>目的地 (可选)</label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                placeholder="输入目的地地址..."
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? '推荐中...' : '🔍 智能推荐'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div className="card">
          <div className="card-header">
            <h2>推荐结果</h2>
            {recommendations.length > 0 && (
              <span className="text-muted text-small">
                共找到 <span style={{ color: '#1890ff', fontWeight: 600 }}>{recommendations.length}</span> 个推荐充电站
              </span>
            )}
          </div>

          {recommendations.length === 0 ? (
            <div className="empty">
              {loading ? '正在为您智能匹配最优充电站...' : '请填写参数后点击智能推荐'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recommendations.map((item, index) => (
                <div key={item.station.id} className="charger-card">
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: `conic-gradient(${getScoreColor(item.score)} ${item.score * 3.6}deg, #f0f0f0 0deg)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        position: 'relative'
                      }}
                    >
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column'
                        }}
                      >
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: getScoreColor(item.score) }}>
                          {item.score}
                        </span>
                        <span style={{ fontSize: '10px', color: '#8c8c8c' }}>综合评分</span>
                      </div>
                      {index === 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#faad14',
                            color: 'white',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold'
                          }}
                        >
                          1
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div className="charger-card-header">
                        <span className="font-bold font-large">{item.station.name}</span>
                        <span className="badge badge-flat">{item.station.city}</span>
                      </div>

                      <div className="text-muted text-small mb-12" style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                        <span>📍</span>
                        <span>{item.station.address}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                        <div>
                          <span className="text-muted text-small">距离</span>
                          <div className="font-bold text-primary">{item.distance.toFixed(2)} km</div>
                        </div>
                        <div>
                          <span className="text-muted text-small">车程</span>
                          <div className="font-bold">{formatDuration(item.driveTime * 60)}</div>
                        </div>
                        <div>
                          <span className="text-muted text-small">充电桩类型</span>
                          <div className="font-bold" style={{ color: item.charger.type === 'fast' ? '#ff4d4f' : '#1890ff' }}>
                            {getChargerTypeText(item.charger.type)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted text-small">额定功率</span>
                          <div className="font-bold">{item.charger.ratedPower} kW</div>
                        </div>
                        <div>
                          <span className="text-muted text-small">可用数量</span>
                          <div className="font-bold" style={{ color: '#52c41a' }}>{item.charger.available} 个</div>
                        </div>
                      </div>

                      <div style={{
                        padding: '12px',
                        background: '#fafafa',
                        borderRadius: '8px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span className="text-muted text-small">当前电价</span>
                          <span
                            className="period-tag"
                            style={{
                              background: `linear-gradient(90deg, ${getPeriodColor(item.pricing.period)}, ${getPeriodColor(item.pricing.period)}aa)`,
                              color: 'white'
                            }}
                          >
                            {getPeriodText(item.pricing.period)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <div>
                            <span className="text-muted text-small">电费</span>
                            <div>{formatMoney(item.pricing.electricityPrice)}/kWh</div>
                          </div>
                          <div>
                            <span className="text-muted text-small">服务费</span>
                            <div>{formatMoney(item.pricing.serviceFee)}/kWh</div>
                          </div>
                          <div>
                            <span className="text-muted text-small">总价</span>
                            <div className="font-bold text-danger">
                              {formatMoney(item.pricing.electricityPrice + item.pricing.serviceFee)}/kWh
                            </div>
                          </div>
                        </div>
                      </div>

                      {item.estimation && (
                        <div style={{
                          padding: '12px',
                          background: '#f6ffed',
                          borderRadius: '8px',
                          marginBottom: '12px'
                        }}>
                          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <div>
                              <span className="text-muted text-small">预估充电量</span>
                              <div className="font-bold">{formatEnergy(item.estimation.chargeAmount)}</div>
                            </div>
                            <div>
                              <span className="text-muted text-small">充电时长</span>
                              <div className="font-bold">{formatDuration(item.estimation.chargeDuration)}</div>
                            </div>
                            <div>
                              <span className="text-muted text-small">充满时间</span>
                              <div className="font-bold">{getFullChargeTime(item)}</div>
                            </div>
                            <div>
                              <span className="text-muted text-small">预估费用</span>
                              <div className="font-bold text-danger">{formatMoney(item.estimation.totalCost)}</div>
                            </div>
                          </div>
                          {item.estimation.costDetail && (
                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #d9f7be' }}>
                              <div className="text-muted text-small">费用明细:</div>
                              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', marginTop: '4px' }}>
                                <span>电费: {formatMoney(item.estimation.costDetail.electricityCost)}</span>
                                <span>服务费: {formatMoney(item.estimation.costDetail.serviceCost)}</span>
                                {item.estimation.costDetail.discount && (
                                  <span style={{ color: '#52c41a' }}>优惠: -{formatMoney(item.estimation.costDetail.discount)}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {item.reason && (
                        <div style={{
                          padding: '8px 12px',
                          background: '#fff7e6',
                          borderRadius: '8px',
                          marginBottom: '12px',
                          fontSize: '13px',
                          color: '#d46b08'
                        }}>
                          💡 {item.reason}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleNavigate(item.station)}
                        >
                          🧭 一键导航
                        </button>
                        <button
                          className="btn btn-success"
                          onClick={() => handleReserve(item)}
                          disabled={reservingId === item.station.id}
                        >
                          {reservingId === item.station.id ? '预约中...' : '📅 预约锁桩'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Recommendation;
