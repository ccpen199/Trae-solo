import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  API,
  createWebSocket,
  formatMoney,
  formatEnergy,
  formatDuration,
  formatDateTime,
  getChargerTypeText,
  getStatusColor,
  getStatusText
} from '../api';

function ChargingMonitor() {
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const timerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadData();
    setupWebSocket();
    setupTimer();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersRes, summaryRes] = await Promise.all([
        API.orders.list({ status: 'charging' }),
        API.revenue.summary()
      ]);
      const ordersList = Array.isArray(ordersRes) ? ordersRes : (ordersRes.data || []);
      const summaryData = summaryRes.data || summaryRes;

      const ordersWithChargerData = await Promise.all(
        ordersList.map(async (order) => {
          try {
            const chargerRes = await API.chargers.detail(order.charger_id);
            const chargerData = chargerRes.data || chargerRes;
            return {
              ...order,
              voltage: chargerData.voltage,
              current: chargerData.current,
              power: chargerData.power,
              temperature: chargerData.temperature,
              current_soc: chargerData.soc,
              charger_type: chargerData.type
            };
          } catch (err) {
            console.error('获取充电桩数据失败:', err);
            return {
              ...order,
              voltage: 0,
              current: 0,
              power: 0,
              temperature: 25,
              current_soc: order.start_soc || 0,
              charger_type: 'fast'
            };
          }
        })
      );

      setOrders(ordersWithChargerData);
      setSummary(summaryData);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    try {
      const ws = createWebSocket();
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'charger_status') {
            handleChargerStatusUpdate(data.payload);
          } else if (data.type === 'charging_data') {
            handleChargingDataUpdate(data.payload);
          } else if (data.type === 'order_update') {
            handleOrderUpdate(data.payload);
          }
        } catch (err) {
          console.error('WebSocket消息解析错误:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket错误:', err);
      };
    } catch (err) {
      console.error('WebSocket连接失败:', err);
    }
  };

  const setupTimer = () => {
    timerRef.current = setInterval(() => {
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.status === 'charging') {
            const updatedDuration = (order.duration_seconds || 0) + 1;
            const updatedEnergy = (order.total_energy || 0) + ((order.power || 0) / 3600);
            const estimatedTime = calculateEstimatedTime(order);
            
            return {
              ...order,
              duration_seconds: updatedDuration,
              total_energy: updatedEnergy,
              estimated_time: estimatedTime,
              total_amount: calculateCost(order, updatedEnergy)
            };
          }
          return order;
        })
      );
    }, 1000);
  };

  const handleChargerStatusUpdate = (payload) => {
    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.charger_id === payload.chargerId || order.charger_code === payload.chargerCode) {
          return {
            ...order,
            voltage: payload.voltage !== undefined ? payload.voltage : order.voltage,
            current: payload.current !== undefined ? payload.current : order.current,
            power: payload.power !== undefined ? payload.power : order.power,
            temperature: payload.temperature !== undefined ? payload.temperature : order.temperature
          };
        }
        return order;
      })
    );
  };

  const handleChargingDataUpdate = (payload) => {
    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.charger_id === payload.chargerId || order.id === payload.orderId) {
          const updatedOrder = { ...order };
          
          if (payload.voltage !== undefined) updatedOrder.voltage = payload.voltage;
          if (payload.current !== undefined) updatedOrder.current = payload.current;
          if (payload.power !== undefined) updatedOrder.power = payload.power;
          if (payload.temperature !== undefined) updatedOrder.temperature = payload.temperature;
          if (payload.soc !== undefined) updatedOrder.current_soc = payload.soc;
          if (payload.energy !== undefined) updatedOrder.energy = payload.energy;
          
          if (payload.soc !== undefined || payload.power !== undefined) {
            updatedOrder.estimated_time = calculateEstimatedTime(updatedOrder);
          }
          
          if (payload.energy !== undefined) {
            updatedOrder.total_amount = calculateCost(updatedOrder, payload.energy);
          }
          
          return updatedOrder;
        }
        return order;
      })
    );
  };

  const handleOrderUpdate = (payload) => {
    if (payload.status === 'charging') {
      setOrders(prevOrders => {
        const exists = prevOrders.some(o => o.id === payload.id);
        if (exists) {
          return prevOrders.map(o => o.id === payload.id ? { ...o, ...payload } : o);
        } else {
          return [...prevOrders, payload];
        }
      });
    } else if (payload.status === 'completed' || payload.status === 'stopped') {
      setOrders(prevOrders => prevOrders.filter(o => o.id !== payload.id));
    }
  };

  const calculateEstimatedTime = (order) => {
    const currentSoc = order.current_soc || 0;
    const targetSoc = 100;
    const power = order.power || 0;
    const batteryCapacity = 60;
    
    if (currentSoc >= targetSoc || power <= 0) {
      return 0;
    }
    
    const remainingSoc = targetSoc - currentSoc;
    const remainingEnergy = (remainingSoc / 100) * batteryCapacity;
    const hours = remainingEnergy / power;
    return Math.floor(hours * 3600);
  };

  const calculateCost = (order, energy) => {
    const electricityPrice = 0.8;
    const serviceFee = 0.6;
    const totalPrice = electricityPrice + serviceFee;
    return energy * totalPrice;
  };

  const getAveragePower = () => {
    if (orders.length === 0) return 0;
    const totalPower = orders.reduce((sum, order) => sum + (order.power || 0), 0);
    return totalPower / orders.length;
  };

  const getEstimatedFullTime = (estimatedSeconds) => {
    if (estimatedSeconds <= 0) return '即将充满';
    const now = new Date();
    now.setSeconds(now.getSeconds() + estimatedSeconds);
    return now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const getSOCProgressStyle = (startSoc, currentSoc) => {
    const progress = Math.max(0, Math.min(100, currentSoc - startSoc));
    const maxProgress = 100 - startSoc;
    const percentage = maxProgress > 0 ? (progress / maxProgress) * 100 : 0;
    
    let color = '#52c41a';
    if (percentage < 30) color = '#faad14';
    else if (percentage > 80) color = '#1890ff';
    
    return {
      width: `${percentage}%`,
      background: `linear-gradient(90deg, ${color} 0%, ${color}dd 100%)`
    };
  };

  const getTemperatureColor = (temp) => {
    if (temp > 45) return '#ff4d4f';
    if (temp > 35) return '#faad14';
    return '#52c41a';
  };

  const handleOrderClick = (order) => {
    if (order.charger_id) {
      navigate(`/chargers/${order.charger_id}`);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2>⚡ 充电监测中心</h2>
            <span className="pulse text-success">● 实时监控中</span>
          </div>
          <button className="btn btn-default btn-sm" onClick={loadData}>
            🔄 刷新
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-4 mb-16">
          <div className="stat-card green">
            <div className="label">当前充电中</div>
            <div className="value">
              {orders.length}
              <span className="unit">辆</span>
            </div>
            <div className="trend">
              总功率 {orders.reduce((s, o) => s + (o.power || 0), 0).toFixed(1)} kW
            </div>
          </div>
          <div className="stat-card blue">
            <div className="label">今日充电总量</div>
            <div className="value">
              {formatEnergy(summary.today_energy || 0).replace(' kWh', '')}
              <span className="unit">kWh</span>
            </div>
            <div className="trend">
              较昨日 {summary.yoy_energy ? `+${summary.yoy_energy.toFixed(1)}%` : '-'}
            </div>
          </div>
          <div className="stat-card orange">
            <div className="label">今日充电总额</div>
            <div className="value">
              {formatMoney(summary.today_revenue || 0).replace('¥', '')}
              <span className="unit">元</span>
            </div>
            <div className="trend">
              订单数 {summary.today_orders || 0} 笔
            </div>
          </div>
          <div className="stat-card purple">
            <div className="label">平均充电功率</div>
            <div className="value">
              {getAveragePower().toFixed(1)}
              <span className="unit">kW</span>
            </div>
            <div className="trend">
              峰值功率 {Math.max(...orders.map(o => o.power || 0), 0).toFixed(1)} kW
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>充电订单列表</h2>
          <span className="text-muted text-small">共 {orders.length} 个充电订单</span>
        </div>

        {orders.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔌</div>
            <div>暂无进行中的充电订单</div>
            <div className="text-small text-muted mt-8">
              车辆接入后将自动开始充电并显示在此处
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-16">
            {orders.map(order => (
              <div
                key={order.id}
                className="charging-order-card"
                onClick={() => handleOrderClick(order)}
              >
                <div className="charging-order-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="charging-avatar">
                      <span>⚡</span>
                    </div>
                    <div>
                      <div className="font-bold">订单 {order.order_no || order.id}</div>
                      <div className="text-muted text-small">
                        {formatDateTime(order.start_time)}
                      </div>
                    </div>
                  </div>
                  <span
                    className="status-badge"
                    style={{
                      background: getStatusColor('charging') + '20',
                      color: getStatusColor('charging')
                    }}
                  >
                    {getStatusText('charging')}
                  </span>
                </div>

                <div className="charging-order-info">
                  <div className="info-item">
                    <span className="label">充电站</span>
                    <span className="value">{order.station_name || '-'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">充电桩</span>
                    <span className="value">
                      {order.charger_code || '-'}
                      <span className="text-muted text-small ml-4">
                        ({getChargerTypeText(order.charger_type || 'fast')})
                      </span>
                    </span>
                  </div>
                </div>

                <div className="charging-realtime">
                  <div className="realtime-item">
                    <div className="realtime-label">功率</div>
                    <div className="realtime-value text-primary">
                      {(order.power || 0).toFixed(2)}
                      <span className="unit">kW</span>
                    </div>
                  </div>
                  <div className="realtime-item">
                    <div className="realtime-label">电压</div>
                    <div className="realtime-value">
                      {(order.voltage || 0).toFixed(1)}
                      <span className="unit">V</span>
                    </div>
                  </div>
                  <div className="realtime-item">
                    <div className="realtime-label">电流</div>
                    <div className="realtime-value">
                      {(order.current || 0).toFixed(1)}
                      <span className="unit">A</span>
                    </div>
                  </div>
                  <div className="realtime-item">
                    <div className="realtime-label">温度</div>
                    <div className="realtime-value" style={{ color: getTemperatureColor(order.temperature || 25) }}>
                      {(order.temperature || 25).toFixed(1)}
                      <span className="unit">°C</span>
                    </div>
                  </div>
                </div>

                <div className="charging-progress-section">
                  <div className="progress-header">
                    <span className="text-muted text-small">充电进度</span>
                    <span className="font-bold">
                      {Math.round(order.start_soc || 0)}% → {Math.round(order.current_soc || 0)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={getSOCProgressStyle(order.start_soc || 0, order.current_soc || 0)}
                    />
                  </div>
                  <div className="progress-labels">
                    <span className="text-small text-muted">开始</span>
                    <span className="text-small text-muted">
                      目标 100%
                    </span>
                  </div>
                </div>

                <div className="charging-stats">
                  <div className="stat-item">
                    <div className="stat-label">已充电量</div>
                    <div className="stat-value text-primary">
                      {formatEnergy(order.total_energy || 0)}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">已充时长</div>
                    <div className="stat-value">
                      {formatDuration(order.duration_seconds || 0)}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">预计剩余</div>
                    <div className="stat-value text-success">
                      {order.estimated_time > 0 ? formatDuration(order.estimated_time) : '即将充满'}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">预计充满</div>
                    <div className="stat-value">
                      {getEstimatedFullTime(order.estimated_time || 0)}
                    </div>
                  </div>
                </div>

                <div className="charging-cost">
                  <div className="cost-item">
                    <span className="cost-label">当前费用</span>
                    <span className="cost-value text-danger font-bold">
                      {formatMoney(order.total_amount || 0)}
                    </span>
                  </div>
                  <div className="cost-item">
                    <span className="cost-label text-small text-muted">
                      电价 {formatMoney(0.8)}/kWh + 服务费 {formatMoney(0.6)}/kWh
                    </span>
                  </div>
                </div>

                <div className="charging-order-footer">
                  <span className="text-muted text-small">
                    开始时间: {formatDateTime(order.start_time)}
                  </span>
                  <span className="text-primary text-small cursor-pointer">
                    查看详情 →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .charging-order-card {
          background: #fff;
          border: 1px solid #e8e8e8;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .charging-order-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #52c41a 0%, #95de64 50%, #52c41a 100%);
          animation: pulse-border 2s ease-in-out infinite;
        }

        @keyframes pulse-border {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .charging-order-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
          border-color: #52c41a;
        }

        .charging-order-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .charging-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          overflow: hidden;
        }

        .charging-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .charging-order-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding: 12px;
          background: #fafafa;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-item .label {
          font-size: 12px;
          color: #8c8c8c;
        }

        .info-item .value {
          font-size: 14px;
          font-weight: 500;
          color: #262626;
        }

        .charging-realtime {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }

        .realtime-item {
          text-align: center;
          padding: 12px 8px;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .realtime-label {
          font-size: 12px;
          color: #8c8c8c;
          margin-bottom: 4px;
        }

        .realtime-value {
          font-size: 18px;
          font-weight: 600;
          color: #262626;
        }

        .realtime-value .unit {
          font-size: 12px;
          font-weight: 400;
          color: #8c8c8c;
          margin-left: 2px;
        }

        .charging-progress-section {
          margin-bottom: 16px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .progress-bar {
          height: 12px;
          background: #f0f0f0;
          border-radius: 6px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 0.5s ease;
        }

        .progress-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 4px;
        }

        .charging-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 16px;
          padding-top: 16px;
          border-top: 1px dashed #e8e8e8;
        }

        .stat-item {
          text-align: center;
        }

        .stat-label {
          font-size: 12px;
          color: #8c8c8c;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 14px;
          font-weight: 500;
          color: #262626;
        }

        .charging-cost {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: linear-gradient(135deg, #fff7e6 0%, #fff1f0 100%);
          border-radius: 8px;
          margin-bottom: 12px;
        }

        .cost-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .cost-label {
          font-size: 12px;
          color: #8c8c8c;
        }

        .cost-value {
          font-size: 20px;
        }

        .charging-order-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
        }

        .stat-card.purple {
          background: linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%);
          border-left: 4px solid #722ed1;
        }

        .stat-card.purple .value {
          color: #722ed1;
        }

        .ml-4 {
          margin-left: 4px;
        }

        .mt-8 {
          margin-top: 8px;
        }

        .mb-8 {
          margin-bottom: 8px;
        }

        .mb-16 {
          margin-bottom: 16px;
        }

        .text-primary {
          color: #1890ff;
        }

        .text-success {
          color: #52c41a;
        }

        .text-danger {
          color: #ff4d4f;
        }

        .text-muted {
          color: #8c8c8c;
        }

        .text-small {
          font-size: 12px;
        }

        .font-bold {
          font-weight: 600;
        }

        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

export default ChargingMonitor;
