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
  const [errorMsg, setErrorMsg] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [formData, setFormData] = useState({
    latitude: 39.9087,
    longitude: 116.4123,
    batteryCapacity: 60,
    currentSoc: 30,
    targetSoc: 80,
    preferFast: true,
    preferLowPrice: true,
    maxDistance: 10
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
    setErrorMsg('');
    setHasSearched(true);
    try {
      setLoading(true);
      const res = await API.recommendation.get(formData);
      if (res.success) {
        const data = res.data || [];
        data.sort((a, b) => b.score - a.score);
        setRecommendations(data);
      } else {
        setErrorMsg(res.message || '获取推荐结果失败');
        setRecommendations([]);
      }
    } catch (err) {
      console.error('获取推荐结果失败:', err);
      setErrorMsg(err.response?.data?.message || '获取推荐结果失败，请重试');
      setRecommendations([]);
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
      const scheduledStartTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const res = await API.recommendation.reserve({
        userId: 'user_001',
        stationId: item.station.id,
        chargerId: item.charger.id,
        scheduledStartTime: scheduledStartTime,
        targetSoc: formData.targetSoc
      });
      if (res.success) {
        alert(`预约成功！预约号: ${res.data?.reservation_no || '已生成'}\n桩位已锁定，请在30分钟内到站充电`);
      } else {
        alert(res.message || '预约失败');
      }
    } catch (err) {
      console.error('预约失败:', err);
      alert(err.response?.data?.message || '预约失败，请重试');
    } finally {
      setReservingId(null);
    }
  };

  const handleNavigate = (station) => {
    const url = `https://uri.amap.com/navigation?to=${station.lng},${station.lat},${station.name}&mode=car&policy=1&src=evcharger&coordinate=gaode&callnative=1`;
    window.open(url, '_blank');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
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
              <div style={{ display: 'flex', gap: '8px' }}>
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

          {loading ? (
            <div className="empty">正在智能匹配...</div>
          ) : errorMsg ? (
            <div className="empty" style={{ color: '#ff4d4f' }}>
              ⚠️ {errorMsg}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="empty">{hasSearched ? '未找到合适的充电站' : '请填写参数后点击智能推荐'}</div>
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

                      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <div>
                          <span className="text-muted text-small">距离</span>
                          <div className="font-bold text-primary">{item.station.distance.toFixed(2)} km</div>
                        </div>
                        <div>
                          <span className="text-muted text-small">车程</span>
                          <div className="font-bold">{formatDuration(item.station.drive_time * 60)}</div>
                        </div>
                        <div>
                          <span className="text-muted text-small">充电桩类型</span>
                          <div className="font-bold" style={{ color: item.charger.type === 'fast' ? '#ff4d4f' : '#1890ff' }}>
                            {getChargerTypeText(item.charger.type)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted text-small">额定功率</span>
                          <div className="font-bold">{item.charger.power_rating} kW</div>
                        </div>
                        <div>
                          <span className="text-muted text-small">可用数量</span>
                          <div className="font-bold" style={{ color: '#52c41a' }}>{item.charger.available_count} 个</div>
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
                              background: `linear-gradient(90deg, ${getPeriodColor(item.price.current_period)}, ${getPeriodColor(item.price.current_period)}aa)`,
                              color: 'white'
                            }}
                          >
                            {getPeriodText(item.price.current_period)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <div>
                            <span className="text-muted text-small">电费</span>
                            <div>{formatMoney(item.price.electricity_price)}/kWh</div>
                          </div>
                          <div>
                            <span className="text-muted text-small">服务费</span>
                            <div>{formatMoney(item.price.service_price)}/kWh</div>
                          </div>
                          <div>
                            <span className="text-muted text-small">总价</span>
                            <div className="font-bold text-danger">
                              {formatMoney(item.price.total_price)}/kWh
                            </div>
                          </div>
                        </div>
                      </div>

                      {item.estimate && (
                        <div style={{
                          padding: '12px',
                          background: '#f6ffed',
                          borderRadius: '8px',
                          marginBottom: '12px'
                        }}>
                          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <div>
                              <span className="text-muted text-small">预估充电量</span>
                              <div className="font-bold">{formatEnergy(item.estimate.energy)}</div>
                            </div>
                            <div>
                              <span className="text-muted text-small">充电时长</span>
                              <div className="font-bold">{formatDuration(item.estimate.duration)}</div>
                            </div>
                            <div>
                              <span className="text-muted text-small">充满时间</span>
                              <div className="font-bold">{formatDateTime(item.estimate.end_time)}</div>
                            </div>
                            <div>
                              <span className="text-muted text-small">预估费用</span>
                              <div className="font-bold text-danger">{formatMoney(item.estimate.cost)}</div>
                            </div>
                          </div>
                          {item.estimate.cost_detail && (
                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #d9f7be' }}>
                              <div className="text-muted text-small">费用明细:</div>
                              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                                {item.estimate.cost_detail.peak > 0 && (
                                  <span>峰时费用: {formatMoney(item.estimate.cost_detail.peak)}</span>
                                )}
                                {item.estimate.cost_detail.flat > 0 && (
                                  <span>平时费用: {formatMoney(item.estimate.cost_detail.flat)}</span>
                                )}
                                {item.estimate.cost_detail.valley > 0 && (
                                  <span>谷时费用: {formatMoney(item.estimate.cost_detail.valley)}</span>
                                )}
                                <span>服务费: {formatMoney(item.estimate.cost_detail.service_fee)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {item.recommendation_reason && (
                        <div style={{
                          padding: '8px 12px',
                          background: '#fff7e6',
                          borderRadius: '8px',
                          marginBottom: '12px',
                          fontSize: '13px',
                          color: '#d46b08'
                        }}>
                          💡 {item.recommendation_reason}
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
