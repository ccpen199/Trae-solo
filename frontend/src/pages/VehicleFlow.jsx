import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const STATUS_MAP = {
  available: '空闲',
  occupied: '已占用',
  charging: '充电中',
  idle: '空闲',
  offline: '离线'
};

function VehicleFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [stations, setStations] = useState([]);
  const [stationStats, setStationStats] = useState({});
  const [selectedStation, setSelectedStation] = useState(null);
  const [spots, setSpots] = useState([]);
  const [guns, setGuns] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [selectedGun, setSelectedGun] = useState(null);
  const [plateNumber, setPlateNumber] = useState('');
  const [parkingOrder, setParkingOrder] = useState(null);
  const [chargingOrder, setChargingOrder] = useState(null);
  const [combinedPayment, setCombinedPayment] = useState(null);
  const [message, setMessage] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadStations();
    loadAlerts();
  }, []);

  const loadStations = async () => {
    try {
      const res = await api.getStations();
      setStations(res.data.data);
      const stats = {};
      res.data.data.forEach(s => {
        stats[s.id] = {
          availableSpots: s.spotStats?.available || 0,
          totalSpots: s.spotStats?.total || 0,
          idleGuns: s.gunStats?.idle || 0,
          totalGuns: s.gunStats?.total || 0,
          activeAlerts: s.activeAlerts || 0,
          status: s.status
        };
      });
      setStationStats(stats);
    } catch (err) {
      console.error('Failed to load stations:', err);
    }
  };

  const loadAlerts = async () => {
    try {
      const res = await api.getAlerts({ is_resolved: 0 });
      setAlerts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  };

  const selectStation = async (stationId) => {
    setSelectedStation(stationId);
    setSelectedSpot(null);
    setSelectedGun(null);
    try {
      const res = await api.getStationMap(stationId);
      setSpots(res.data.data.spots);
      setGuns(res.data.data.guns || []);
    } catch (err) {
      console.error('Failed to load station map:', err);
    }
  };

  const handleEnter = async () => {
    if (!selectedStation || !selectedSpot || !plateNumber) {
      setMessage({ type: 'error', text: '请选择场站、车位并输入车牌号' });
      return;
    }
    try {
      const res = await api.createParkingOrder({
        station_id: selectedStation,
        spot_id: selectedSpot.id,
        plate_number: plateNumber
      });
      setParkingOrder(res.data.data);
      setStep(2);
      setMessage({ type: 'success', text: '车辆入场成功！道闸已抬起' });
    } catch (err) {
      setMessage({ type: 'error', text: '入场失败：' + (err.response?.data?.error || err.message) });
    }
  };

  const handleStartCharging = async () => {
    if (!selectedGun) {
      setMessage({ type: 'error', text: '请选择充电枪' });
      return;
    }
    try {
      const res = await api.createChargingOrder({
        station_id: selectedStation,
        gun_id: selectedGun.id,
        start_soc: 20
      });
      setChargingOrder(res.data.data);
      setStep(3);
      setMessage({ type: 'success', text: '充电已启动！' });
    } catch (err) {
      setMessage({ type: 'error', text: '启动充电失败：' + (err.response?.data?.error || err.message) });
    }
  };

  const handleStopCharging = async () => {
    try {
      const res = await api.stopCharging(chargingOrder.id, { end_soc: 85 });
      setChargingOrder(res.data.data);
      setStep(4);
      setMessage({ type: 'success', text: '充电已停止，正在结算充电费用' });
    } catch (err) {
      setMessage({ type: 'error', text: '停止充电失败：' + (err.response?.data?.error || err.message) });
    }
  };

  const handleExit = async () => {
    try {
      const res = await api.exitParking(parkingOrder.id);
      setParkingOrder(res.data.data);
      setStep(5);
    } catch (err) {
      setMessage({ type: 'error', text: '出场失败：' + (err.response?.data?.error || err.message) });
    }
  };

  const handlePay = async () => {
    try {
      const res = await api.createPayment({
        parking_order_id: parkingOrder?.id,
        charging_order_id: chargingOrder?.id,
        payment_method: 'wechat'
      });
      setCombinedPayment(res.data.data);
      setMessage({ type: 'success', text: '支付成功！欢迎下次光临' });
      setStep(6);
    } catch (err) {
      setMessage({ type: 'error', text: '支付失败：' + (err.response?.data?.error || err.message) });
    }
  };

  const resetFlow = () => {
    setStep(1);
    setSelectedStation(null);
    setSelectedSpot(null);
    setSelectedGun(null);
    setPlateNumber('');
    setParkingOrder(null);
    setChargingOrder(null);
    setCombinedPayment(null);
    setMessage(null);
  };

  const getStepColor = (idx) => {
    if (step > idx + 1) return '#52c41a';
    if (step === idx + 1) return '#1890ff';
    return '#d9d9d9';
  };

  return (
    <div>
      <div className="page-header">
        <h1>车主服务流程</h1>
        <div>
          <button className="btn btn-default" onClick={() => navigate('/reservation')}>
            📅 先预约车位
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">业务流程闭环</div>
        <div className="workflow-steps">
          {['车位预约', '入场识别', '启动充电', '停止充电', '出场结算', '一笔支付'].map((s, i) => (
            <div key={i} className="workflow-step">
              <div className="workflow-step-number" style={{ background: getStepColor(i) }}>
                {i + 1}
              </div>
              <div className="workflow-step-text" style={{ color: step >= i + 1 ? '#1890ff' : '#999' }}>
                {s}
              </div>
              {i < 5 && <div className="workflow-step-line" style={{ background: step > i + 1 ? '#52c41a' : '#e8e8e8' }}></div>}
            </div>
          ))}
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      {alerts.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
          ⚠️ 当前有 {alerts.length} 个设备告警，请留意设备状态
        </div>
      )}

      {step === 1 && (
        <>
          <div className="card">
            <div className="card-title">第一步：选择场站</div>
            <div className="station-list">
              {stations.map(s => (
                <div
                  key={s.id}
                  className={`station-card ${selectedStation === s.id ? 'selected' : ''}`}
                  onClick={() => selectStation(s.id)}
                >
                  <div className="station-card-header">
                    <div className="station-card-name">{s.name}</div>
                    <span className={`status-badge status-${s.status === 'active' ? 'available' : 'offline'}`}>
                      {s.status === 'active' ? '运营中' : s.status}
                    </span>
                  </div>
                  <div className="station-card-address">{s.address}</div>
                  <div className="station-card-stats">
                    <div className="stat-item">
                      <span className="label">空闲车位</span>
                      <span className="value success">{stationStats[s.id]?.availableSpots || 0}</span>
                      <span className="total">/{stationStats[s.id]?.totalSpots || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">空闲充电枪</span>
                      <span className="value primary">{stationStats[s.id]?.idleGuns || 0}</span>
                      <span className="total">/{stationStats[s.id]?.totalGuns || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">普通车位</span>
                      <span className="value">¥5/时</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">充电车位</span>
                      <span className="value">¥8-10/时</span>
                    </div>
                    {stationStats[s.id]?.activeAlerts > 0 && (
                      <div className="stat-item warning">
                        <span className="label">设备告警</span>
                        <span className="value warning">{stationStats[s.id]?.activeAlerts}</span>
                        <span>个</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedStation && (
            <div className="card">
              <div className="card-title">第二步：选择车位</div>
              <div className="form-group">
                <label>车牌号</label>
                <input
                  type="text"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="请输入车牌号，如：京A12345"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>图例说明</label>
                <div className="spot-legend">
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: '#52c41a' }}></div>
                    <span>普通车位（空闲）</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: '#52c41a', border: '3px solid #722ed1' }}></div>
                    <span>充电车位（空闲）</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: '#ff4d4f' }}></div>
                    <span>已占用</span>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>车位选择</label>
                <div className="parking-map">
                  {spots.map(s => (
                    <div
                      key={s.id}
                      className={`parking-spot ${selectedSpot?.id === s.id ? 'selected' : ''}`}
                      onClick={() => s.status === 'available' && setSelectedSpot(s)}
                      title={`${s.spot_number} - ${s.type === 'charging' ? '充电车位' : '普通车位'} - ¥${s.price_per_hour}/时`}
                    >
                      <div>{s.spot_number}</div>
                      {s.has_charging && <div className="charging-icon">⚡</div>}
                    </div>
                  ))}
                </div>
              </div>
              {selectedSpot && (
                <div className="info-panel">
                  <div className="info-item">
                    <strong>已选车位：</strong>{selectedSpot.spot_number}
                  </div>
                  <div className="info-item">
                    <strong>车位类型：</strong>{selectedSpot.type === 'charging' ? '⚡ 充电车位' : '🅿️ 普通车位'}
                  </div>
                  <div className="info-item">
                    <strong>停车单价：</strong>¥{selectedSpot.price_per_hour}/小时
                  </div>
                  {selectedSpot.has_charging && (
                    <div className="info-item">
                      <strong>充电单价：</strong>¥1.5-1.8/度
                    </div>
                  )}
                </div>
              )}
              <button
                className="btn btn-primary btn-large"
                onClick={handleEnter}
                disabled={!selectedSpot || !plateNumber}
              >
                🚗 确认入场
              </button>
            </div>
          )}
        </>
      )}

      {step === 2 && (
        <div className="card">
          <div className="card-title">第三步：开始充电</div>
          <div className="info-panel">
            <div className="info-item"><strong>车牌号：</strong>{plateNumber}</div>
            <div className="info-item"><strong>车位：</strong>{selectedSpot?.spot_number}</div>
            <div className="info-item"><strong>入场时间：</strong>{parkingOrder?.enter_time}</div>
          </div>
          {selectedSpot?.has_charging ? (
            <>
              <div className="form-group">
                <label>选择充电枪</label>
                <div className="gun-grid">
                  {guns.filter(g => g.status === 'idle').slice(0, 10).map(g => (
                    <div
                      key={g.id}
                      className={`gun-card ${selectedGun?.id === g.id ? 'selected' : ''}`}
                      onClick={() => setSelectedGun(g)}
                    >
                      <div className="gun-number">{g.gun_number}</div>
                      <div className="gun-info">功率: {g.power}kW</div>
                      <div className="gun-info">¥{g.price_per_kwh}/度</div>
                      <div className="gun-info">{g.connector_type}</div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleStartCharging} disabled={!selectedGun}>
                ⚡ 启动充电
              </button>
              <button className="btn" style={{ marginLeft: '10px' }} onClick={() => setStep(4)}>
                跳过充电，直接出场
              </button>
            </>
          ) : (
            <div className="alert alert-info">
              当前车位为普通车位，如需充电请选择充电车位
              <button className="btn" style={{ marginLeft: '10px' }} onClick={() => setStep(4)}>
                直接出场
              </button>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <div className="card-title">第四步：充电中</div>
          <div className="charging-panel">
            <div className="charging-animation">
              <div className="charging-icon-large">⚡</div>
            </div>
            <div className="charging-info">
              <p><strong>充电枪：</strong>{selectedGun?.gun_number}</p>
              <p><strong>开始时间：</strong>{chargingOrder?.start_time}</p>
              <p><strong>功率：</strong>{selectedGun?.power}kW</p>
              <p><strong>单价：</strong>¥{selectedGun?.price_per_kwh}/度</p>
            </div>
          </div>
          <button className="btn btn-warning btn-large" onClick={handleStopCharging}>
            ⏹️ 停止充电
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="card">
          <div className="card-title">第五步：出场结算</div>
          {chargingOrder && (
            <div className="order-section">
              <div className="order-section-title">⚡ 充电订单</div>
              <div className="order-section-content">
                <p>充电时长：{chargingOrder.duration} 分钟</p>
                <p>充电量：{chargingOrder.energy} 度</p>
                <p>充电费用：<span className="price-tag">¥{chargingOrder.amount}</span></p>
              </div>
            </div>
          )}
          <div className="order-section">
            <div className="order-section-title">🅿️ 停车订单</div>
            <div className="order-section-content">
              <p>停车时长：{parkingOrder?.duration || '计算中...'} 分钟</p>
              <p>停车费用：<span className="price-tag">¥{parkingOrder?.amount || '0.00'}</span></p>
            </div>
          </div>
          <button className="btn btn-primary btn-large" onClick={handleExit}>
            ✅ 确认出场
          </button>
        </div>
      )}

      {step === 5 && (
        <div className="card">
          <div className="card-title">第六步：统一支付</div>
          <div className="payment-summary">
            <h4>费用明细</h4>
            <div className="payment-row">
              <span>停车费（{parkingOrder?.duration}分钟）</span>
              <span>¥{(parkingOrder?.amount || 0).toFixed(2)}</span>
            </div>
            {chargingOrder && (
              <div className="payment-row">
                <span>充电费（{chargingOrder.energy}度）</span>
                <span>¥{(chargingOrder?.amount || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="payment-row discount">
              <span>充电免停优惠</span>
              <span>-¥0.00</span>
            </div>
            <div className="payment-row total">
              <span>合计应付</span>
              <span>¥{((parkingOrder?.amount || 0) + (chargingOrder?.amount || 0)).toFixed(2)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button className="btn btn-success btn-large" onClick={handlePay}>
              💳 立即支付
            </button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="card">
          <div className="success-panel">
            <div className="success-icon">✅</div>
            <h2 style={{ color: '#52c41a', marginTop: '20px' }}>支付成功！</h2>
            <p style={{ marginTop: '10px', color: '#666' }}>
              感谢您的使用，道闸已抬起，欢迎下次光临
            </p>
            {combinedPayment && (
              <div className="success-details">
                <p><strong>订单号：</strong>{combinedPayment.order_no}</p>
                <p><strong>支付方式：</strong>微信支付</p>
                <p><strong>支付时间：</strong>{combinedPayment.paid_at || new Date().toLocaleString()}</p>
                <p><strong>实付金额：</strong><span style={{ color: '#ff4d4f', fontSize: '20px' }}>¥{combinedPayment.actual_amount || ((parkingOrder?.amount || 0) + (chargingOrder?.amount || 0)).toFixed(2)}</span></p>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={resetFlow}>🔄 重新开始</button>
            <button className="btn" onClick={() => navigate('/orders')}>📋 查看订单</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleFlow;
