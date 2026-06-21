import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import {
  API,
  createWebSocket,
  getStatusColor,
  getStatusText,
  getChargerTypeText,
  formatMoney,
  formatEnergy,
  formatDuration,
  formatDateTime,
  getHealthLevelText,
  getHealthLevelColor,
  getPeriodText,
  getPeriodColor
} from '../api';

function ChargerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const timerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [charger, setCharger] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [charging, setCharging] = useState(false);
  const [chargingDuration, setChargingDuration] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [powerHistory, setPowerHistory] = useState([]);
  const [voltageHistory, setVoltageHistory] = useState([]);
  const [currentHistory, setCurrentHistory] = useState([]);
  const [socHistory, setSocHistory] = useState([]);
  const [tempHistory, setTempHistory] = useState([]);
  const [realtimeData, setRealtimeData] = useState({
    voltage: 0,
    current: 0,
    power: 0,
    temperature: 25,
    soc: 0
  });
  const [costBreakdown, setCostBreakdown] = useState({
    peak: { energy: 0, cost: 0, price: 1.2 },
    flat: { energy: 0, cost: 0, price: 0.8 },
    valley: { energy: 0, cost: 0, price: 0.4 },
    serviceFee: 0.6,
    totalEnergy: 0,
    totalCost: 0
  });
  const [activeChart, setActiveChart] = useState('power');

  useEffect(() => {
    loadChargerDetail();
    setupWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    if (charging) {
      timerRef.current = setInterval(() => {
        setChargingDuration(prev => prev + 1);
        updateEstimatedTime();
        if (Math.random() > 0.7) {
          generateMockRealtimeData();
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [charging, realtimeData.soc]);

  const setupWebSocket = () => {
    try {
      const ws = createWebSocket();
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'charger_status' && data.chargerId === id) {
            handleStatusUpdate(data.payload);
          } else if (data.type === 'charging_data' && data.chargerId === id) {
            handleChargingData(data.payload);
          } else if (data.type === 'order_update' && data.chargerId === id) {
            handleOrderUpdate(data.payload);
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
    } catch (err) {
      console.error('Failed to setup WebSocket:', err);
    }
  };

  const handleStatusUpdate = (payload) => {
    setCharger(prev => ({
      ...prev,
      ...payload,
      status: payload.status || prev?.status
    }));
    if (payload.voltage !== undefined || payload.current !== undefined) {
      setRealtimeData(prev => ({
        ...prev,
        voltage: payload.voltage || prev.voltage,
        current: payload.current || prev.current,
        power: payload.power || prev.power,
        temperature: payload.temperature || prev.temperature,
        soc: payload.soc !== undefined ? payload.soc : prev.soc
      }));
    }
  };

  const handleChargingData = (payload) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    if (payload.power !== undefined) {
      setPowerHistory(prev => {
        const newData = [...prev, { time: timeStr, value: payload.power }];
        return newData.slice(-60);
      });
    }
    if (payload.voltage !== undefined) {
      setVoltageHistory(prev => {
        const newData = [...prev, { time: timeStr, value: payload.voltage }];
        return newData.slice(-60);
      });
    }
    if (payload.current !== undefined) {
      setCurrentHistory(prev => {
        const newData = [...prev, { time: timeStr, value: payload.current }];
        return newData.slice(-60);
      });
    }
    if (payload.soc !== undefined) {
      setSocHistory(prev => {
        const newData = [...prev, { time: timeStr, value: payload.soc }];
        return newData.slice(-60);
      });
    }
    if (payload.temperature !== undefined) {
      setTempHistory(prev => {
        const newData = [...prev, { time: timeStr, value: payload.temperature }];
        return newData.slice(-60);
      });
    }

    setRealtimeData(prev => ({
      ...prev,
      ...payload
    }));

    if (payload.energy) {
      updateCostBreakdown(payload.energy);
    }
  };

  const handleOrderUpdate = (payload) => {
    if (payload.status === 'charging') {
      setCharging(true);
      setCurrentOrder(payload);
    } else if (payload.status === 'completed' || payload.status === 'stopped') {
      setCharging(false);
      setCurrentOrder(payload);
    }
  };

  const loadChargerDetail = async () => {
    try {
      setLoading(true);
      const res = await API.chargers.detail(id);
      const chargerData = res.data || res;
      setCharger(chargerData);
      setRealtimeData({
        voltage: chargerData.voltage || 0,
        current: chargerData.current || 0,
        power: chargerData.power || 0,
        temperature: chargerData.temperature || 25,
        soc: chargerData.soc || 0
      });

      if (chargerData.is_charging || chargerData.status === 'charging') {
        setCharging(true);
        try {
          const ordersRes = await API.orders.list({ charger_id: id, status: 'charging' });
          const ordersList = Array.isArray(ordersRes) ? ordersRes : (ordersRes.data || []);
          const activeOrder = ordersList.find(o => o.status === 'charging');
          if (activeOrder) {
            setCurrentOrder(activeOrder);
            setChargingDuration(activeOrder.duration || 0);
            loadPowerData(activeOrder.id);
            initCostBreakdown(activeOrder);
          }
        } catch (err) {
          console.error('加载订单失败:', err);
        }
      }
    } catch (err) {
      console.error('加载充电桩详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPowerData = async (orderId) => {
    try {
      const res = await API.orders.powerData(orderId);
      const dataList = res.data || res;
      if (dataList && Array.isArray(dataList)) {
        const powerData = [];
        const voltageData = [];
        const currentData = [];
        const socData = [];
        const tempData = [];

        dataList.forEach((item, idx) => {
          const time = new Date(item.timestamp || Date.now() - (dataList.length - idx) * 1000);
          const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;

          if (item.power !== undefined) powerData.push({ time: timeStr, value: item.power });
          if (item.voltage !== undefined) voltageData.push({ time: timeStr, value: item.voltage });
          if (item.current !== undefined) currentData.push({ time: timeStr, value: item.current });
          if (item.soc !== undefined) socData.push({ time: timeStr, value: item.soc });
          if (item.temperature !== undefined) tempData.push({ time: timeStr, value: item.temperature });
        });

        setPowerHistory(powerData.slice(-60));
        setVoltageHistory(voltageData.slice(-60));
        setCurrentHistory(currentData.slice(-60));
        setSocHistory(socData.slice(-60));
        setTempHistory(tempData.slice(-60));
      }
    } catch (err) {
      console.error('加载功率数据失败:', err);
    }
  };

  const generateMockRealtimeData = () => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const basePower = charger?.power_rating || 60;
    const power = Math.max(0, basePower * (0.8 + Math.random() * 0.4 - (realtimeData.soc / 100) * 0.5));
    const voltage = 380 + (Math.random() - 0.5) * 20;
    const current = (power * 1000) / voltage;
    const soc = Math.min(100, realtimeData.soc + Math.random() * 0.3);
    const temperature = 25 + Math.random() * 15 + (realtimeData.soc > 80 ? 5 : 0);

    const newRealtime = { voltage, current, power, temperature, soc };
    setRealtimeData(newRealtime);

    setPowerHistory(prev => [...prev.slice(-59), { time: timeStr, value: power }]);
    setVoltageHistory(prev => [...prev.slice(-59), { time: timeStr, value: voltage }]);
    setCurrentHistory(prev => [...prev.slice(-59), { time: timeStr, value: current }]);
    setSocHistory(prev => [...prev.slice(-59), { time: timeStr, value: soc }]);
    setTempHistory(prev => [...prev.slice(-59), { time: timeStr, value: temperature }]);

    const energyDelta = (power / 3600) * 0.5;
    updateCostBreakdown(costBreakdown.totalEnergy + energyDelta);
  };

  const initCostBreakdown = (order) => {
    const peakEnergy = order.peak_energy ?? 0;
    const flatEnergy = order.flat_energy ?? 0;
    const valleyEnergy = order.valley_energy ?? 0;
    const peakCost = order.peak_cost ?? 0;
    const flatCost = order.flat_cost ?? 0;
    const valleyCost = order.valley_cost ?? 0;
    const serviceFee = order.service_fee ?? 0;
    const totalEnergy = order.energy ?? (peakEnergy + flatEnergy + valleyEnergy);
    const totalCost = order.total_amount ?? (peakCost + flatCost + valleyCost + serviceFee);

    const peakPrice = peakEnergy > 0 ? peakCost / peakEnergy : 1.2;
    const flatPrice = flatEnergy > 0 ? flatCost / flatEnergy : 0.8;
    const valleyPrice = valleyEnergy > 0 ? valleyCost / valleyEnergy : 0.4;
    const serviceFeeRate = totalEnergy > 0 ? serviceFee / totalEnergy : 0.6;

    setCostBreakdown({
      peak: { energy: peakEnergy, cost: peakCost, price: peakPrice },
      flat: { energy: flatEnergy, cost: flatCost, price: flatPrice },
      valley: { energy: valleyEnergy, cost: valleyCost, price: valleyPrice },
      serviceFee: serviceFeeRate,
      totalEnergy: totalEnergy,
      totalCost: totalCost
    });
  };

  const updateCostBreakdown = (totalEnergy) => {
    const hour = new Date().getHours();
    let period = 'flat';
    if (hour >= 8 && hour < 12) period = 'peak';
    else if (hour >= 18 && hour < 22) period = 'peak';
    else if (hour >= 22 || hour < 6) period = 'valley';

    const prevTotal = costBreakdown.totalEnergy;
    const delta = Math.max(0, totalEnergy - prevTotal);

    setCostBreakdown(prev => {
      const newBreakdown = { ...prev };
      newBreakdown.totalEnergy = totalEnergy;
      newBreakdown[period].energy += delta;
      newBreakdown[period].cost += delta * newBreakdown[period].price;

      const electricityCost = newBreakdown.peak.cost + newBreakdown.flat.cost + newBreakdown.valley.cost;
      const serviceCost = totalEnergy * newBreakdown.serviceFee;
      newBreakdown.totalCost = electricityCost + serviceCost;

      return newBreakdown;
    });
  };

  const updateEstimatedTime = () => {
    if (realtimeData.soc >= 100) {
      setEstimatedTime(0);
      return;
    }
    if (realtimeData.power > 0) {
      const remainingSoc = 100 - realtimeData.soc;
      const batteryCapacity = 60;
      const remainingEnergy = (remainingSoc / 100) * batteryCapacity;
      const hours = remainingEnergy / realtimeData.power;
      const seconds = Math.floor(hours * 3600);
      setEstimatedTime(Math.max(0, seconds));
    }
  };

  const handleStartCharging = async () => {
    try {
      const res = await API.orders.create({
        chargerId: id,
        userId: 1,
        startSoc: charger.soc || 0
      });
      const orderData = res.data || res;
      setCurrentOrder(orderData);
      setCharging(true);
      setChargingDuration(orderData.duration || 0);
      loadPowerData(orderData.id);
      initCostBreakdown(orderData);
    } catch (err) {
      console.error('开始充电失败:', err);
      alert('开始充电失败，请重试');
    }
  };

  const handleStopCharging = async () => {
    if (!currentOrder) return;
    try {
      const res = await API.orders.stop(currentOrder.id, {
        endSoc: realtimeData.soc || 0
      });
      const orderData = res.data || res;
      setCurrentOrder(orderData);
      setCharging(false);
    } catch (err) {
      console.error('结束充电失败:', err);
      alert('结束充电失败，请重试');
    }
  };

  const getPowerChartOption = () => {
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const param = params[0];
          return `${param.name}<br/>功率: ${param.value.toFixed(2)} kW`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: powerHistory.map(item => item.time)
      },
      yAxis: {
        type: 'value',
        name: '功率(kW)',
        min: 0
      },
      series: [
        {
          name: '功率',
          type: 'line',
          smooth: true,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
                { offset: 1, color: 'rgba(82, 196, 26, 0.05)' }
              ]
            }
          },
          lineStyle: { color: '#52c41a', width: 2 },
          itemStyle: { color: '#52c41a' },
          data: powerHistory.map(item => item.value)
        }
      ]
    };
  };

  const getMultiChartOption = () => {
    return {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['电压(V)', '电流(A)', 'SOC(%)', '温度(°C)']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: voltageHistory.map(item => item.time)
      },
      yAxis: [
        {
          type: 'value',
          name: '电压(V)',
          position: 'left',
          min: 300,
          max: 450
        },
        {
          type: 'value',
          name: '电流(A)',
          position: 'right',
          min: 0
        },
        {
          type: 'value',
          name: 'SOC(%)',
          position: 'right',
          offset: 60,
          min: 0,
          max: 100
        },
        {
          type: 'value',
          name: '温度(°C)',
          position: 'right',
          offset: 120,
          min: 15,
          max: 60
        }
      ],
      series: [
        {
          name: '电压(V)',
          type: 'line',
          smooth: true,
          yAxisIndex: 0,
          lineStyle: { color: '#1890ff', width: 2 },
          itemStyle: { color: '#1890ff' },
          data: voltageHistory.map(item => item.value)
        },
        {
          name: '电流(A)',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          lineStyle: { color: '#722ed1', width: 2 },
          itemStyle: { color: '#722ed1' },
          data: currentHistory.map(item => item.value)
        },
        {
          name: 'SOC(%)',
          type: 'line',
          smooth: true,
          yAxisIndex: 2,
          lineStyle: { color: '#52c41a', width: 2 },
          itemStyle: { color: '#52c41a' },
          data: socHistory.map(item => item.value)
        },
        {
          name: '温度(°C)',
          type: 'line',
          smooth: true,
          yAxisIndex: 3,
          lineStyle: { color: '#fa8c16', width: 2 },
          itemStyle: { color: '#fa8c16' },
          data: tempHistory.map(item => item.value)
        }
      ]
    };
  };

  const getSOCProgressStyle = () => {
    const soc = realtimeData.soc || 0;
    const angle = (soc / 100) * 360;
    let color = '#52c41a';
    if (soc < 20) color = '#ff4d4f';
    else if (soc < 50) color = '#faad14';

    return {
      background: `conic-gradient(${color} ${angle}deg, #f0f0f0 ${angle}deg)`
    };
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!charger) {
    return (
      <div className="card">
        <div className="empty">未找到充电桩信息</div>
      </div>
    );
  }

  const healthScore = charger.health_score || 85;
  const getHealthLevel = (score) => {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  };
  const healthLevel = getHealthLevel(healthScore);

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn btn-default btn-sm"
              onClick={() => navigate(-1)}
            >
              ← 返回
            </button>
            <h2>充电桩详情 - {charger.charger_code}</h2>
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

      <div className="grid grid-cols-3">
        <div className="card">
          <div className="card-header">
            <h2>基本信息</h2>
          </div>
          <div className="charger-info">
            <div className="charger-info-item">
              <span className="label">充电桩编号</span>
              <span className="value charger-code">{charger.charger_code}</span>
            </div>
            <div className="charger-info-item">
              <span className="label">充电桩类型</span>
              <span className="value">
                <span className={`charger-type ${charger.type}`}>
                  {getChargerTypeText(charger.type)}
                </span>
              </span>
            </div>
            <div className="charger-info-item">
              <span className="label">额定功率</span>
              <span className="value">{charger.power_rating || 60} kW</span>
            </div>
            <div className="charger-info-item">
              <span className="label">通信协议</span>
              <span className="value">{charger.protocol || 'OCPP 1.6'}</span>
            </div>
            <div className="charger-info-item">
              <span className="label">OCPP版本</span>
              <span className="value">{charger.ocpp_version || '-'}</span>
            </div>
            <div className="charger-info-item">
              <span className="label">所属充电站</span>
              <span className="value">{charger.station_name || '-'}</span>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <div className="flex-between mb-8">
              <span className="text-muted">健康度评分</span>
              <span style={{ color: getHealthLevelColor(healthLevel), fontWeight: 600 }}>
                {healthScore}分 · {getHealthLevelText(healthLevel)}
              </span>
            </div>
            <div className={`health-bar ${healthLevel}`}>
              <div className="fill" style={{ width: `${healthScore}%` }} />
            </div>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
            <div className="text-muted mb-8" style={{ fontSize: '13px' }}>最后更新</div>
            <div>{formatDateTime(charger.last_update)}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>实时状态</h2>
            {charging && <span className="pulse text-success">● 采集中</span>}
          </div>
          <div className="charger-info">
            <div className="charger-info-item">
              <span className="label">电压</span>
              <span className="value">{realtimeData.voltage.toFixed(1)} <span className="text-muted" style={{ fontSize: '14px' }}>V</span></span>
            </div>
            <div className="charger-info-item">
              <span className="label">电流</span>
              <span className="value">{realtimeData.current.toFixed(1)} <span className="text-muted" style={{ fontSize: '14px' }}>A</span></span>
            </div>
            <div className="charger-info-item">
              <span className="label">输出功率</span>
              <span className="value">{realtimeData.power.toFixed(2)} <span className="text-muted" style={{ fontSize: '14px' }}>kW</span></span>
            </div>
            <div className="charger-info-item">
              <span className="label">设备温度</span>
              <span className="value" style={{
                color: realtimeData.temperature > 45 ? '#ff4d4f' : realtimeData.temperature > 35 ? '#faad14' : '#52c41a'
              }}>
                {realtimeData.temperature.toFixed(1)} <span className="text-muted" style={{ fontSize: '14px' }}>°C</span>
              </span>
            </div>
          </div>

          <div className="charging-progress">
            <div className="charging-circle" style={getSOCProgressStyle()}>
              <div className="center">
                <div className="soc">{Math.round(realtimeData.soc)}%</div>
                <div className="label">电池电量</div>
              </div>
            </div>
          </div>

          {charging && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <div className="grid grid-cols-2 gap-16">
                <div>
                  <div className="text-muted text-small">已充电时长</div>
                  <div className="font-xlarge font-bold text-primary">{formatDuration(chargingDuration)}</div>
                </div>
                <div>
                  <div className="text-muted text-small">预计充满时间</div>
                  <div className="font-xlarge font-bold text-success">
                    {estimatedTime !== null ? formatDuration(estimatedTime) : '--:--:--'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2>充电控制</h2>
          </div>

          {charging ? (
            <div>
              <div className="alert alert-success mb-16">
                <strong>⚡ 正在充电中</strong>
                <div style={{ marginTop: '8px', fontSize: '13px' }}>
                  订单号: <span style={{ fontFamily: 'monospace' }}>{currentOrder?.order_no || '-'}</span>
                </div>
              </div>

              <div className="charger-info mb-16">
                <div className="charger-info-item">
                  <span className="label">累计充电量</span>
                  <span className="value font-bold text-primary">{formatEnergy(currentOrder?.energy ?? costBreakdown.totalEnergy)}</span>
                </div>
                <div className="charger-info-item">
                  <span className="label">预计费用</span>
                  <span className="value font-bold text-danger">{formatMoney(currentOrder?.total_amount ?? costBreakdown.totalCost)}</span>
                </div>
              </div>

              <button
                className="btn btn-danger btn-lg btn-block"
                onClick={handleStopCharging}
              >
                ⏹ 结束充电
              </button>

              <div style={{ marginTop: '16px', padding: '12px', background: '#fffbe6', borderRadius: '6px', fontSize: '13px' }}>
                <div style={{ color: '#d46b08', marginBottom: '4px' }}>💡 温馨提示</div>
                <div style={{ color: '#8c8c8c' }}>结束充电后请及时拔下充电枪，避免产生占位费用</div>
              </div>
            </div>
          ) : (
            <div>
              {!charger.is_offline && !charger.is_charging ? (
                <div>
                  <div className="alert alert-info mb-16">
                    <strong>🔌 充电桩已就绪</strong>
                    <div style={{ marginTop: '8px', fontSize: '13px', color: '#0050b3' }}>
                      请连接车辆充电枪后点击开始充电
                    </div>
                  </div>

                  <div className="mb-16">
                    <div className="text-muted mb-8">当前时段电价</div>
                    <div className="grid grid-cols-3 gap-8 text-center">
                      <div style={{ padding: '12px', background: '#fff1f0', borderRadius: '6px' }}>
                        <div className="badge badge-peak mb-4">峰时</div>
                        <div className="font-bold">¥1.20</div>
                        <div className="text-small text-muted">8:00-12:00<br/>18:00-22:00</div>
                      </div>
                      <div style={{ padding: '12px', background: '#fffbe6', borderRadius: '6px' }}>
                        <div className="badge badge-flat mb-4">平时</div>
                        <div className="font-bold">¥0.80</div>
                        <div className="text-small text-muted">6:00-8:00<br/>12:00-18:00</div>
                      </div>
                      <div style={{ padding: '12px', background: '#f6ffed', borderRadius: '6px' }}>
                        <div className="badge badge-valley mb-4">谷时</div>
                        <div className="font-bold">¥0.40</div>
                        <div className="text-small text-muted">22:00-6:00</div>
                      </div>
                    </div>
                    <div className="text-small text-muted mt-8 text-center">
                      服务费 ¥0.60/kWh
                    </div>
                  </div>

                  <button
                    className="btn btn-success btn-lg btn-block"
                    onClick={handleStartCharging}
                  >
                    ⚡ 开始充电
                  </button>
                </div>
              ) : (
                <div className="alert alert-warning">
                  <strong>⚠️ 充电桩暂不可用</strong>
                  <div style={{ marginTop: '8px', fontSize: '13px' }}>
                    当前状态: {getStatusText(charger.status)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>充电过程监控</h2>
          <div className="tabs" style={{ border: 'none', margin: 0 }}>
            <div
              className={`tab ${activeChart === 'power' ? 'active' : ''}`}
              onClick={() => setActiveChart('power')}
            >
              功率曲线
            </div>
            <div
              className={`tab ${activeChart === 'multi' ? 'active' : ''}`}
              onClick={() => setActiveChart('multi')}
            >
              多参数监控
            </div>
          </div>
        </div>

        {activeChart === 'power' ? (
          powerHistory.length > 0 ? (
            <ReactECharts option={getPowerChartOption()} style={{ height: '350px' }} />
          ) : (
            <div className="empty" style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              暂无功率数据，开始充电后将实时显示功率曲线
            </div>
          )
        ) : (
          voltageHistory.length > 0 ? (
            <ReactECharts option={getMultiChartOption()} style={{ height: '350px' }} />
          ) : (
            <div className="empty" style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              暂无监控数据，开始充电后将实时显示电压、电流、SOC、温度曲线
            </div>
          )
        )}
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h2>费用明细</h2>
            {charging && <span className="text-muted text-small">实时更新中</span>}
          </div>

          <table>
            <thead>
              <tr>
                <th>时段</th>
                <th>充电量</th>
                <th>电费</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="period-tag peak">峰时</span>
                </td>
                <td>{formatEnergy(currentOrder?.peak_energy ?? costBreakdown.peak.energy)}</td>
                <td>{formatMoney(currentOrder?.peak_cost ?? costBreakdown.peak.cost)}</td>
              </tr>
              <tr>
                <td>
                  <span className="period-tag flat">平时</span>
                </td>
                <td>{formatEnergy(currentOrder?.flat_energy ?? costBreakdown.flat.energy)}</td>
                <td>{formatMoney(currentOrder?.flat_cost ?? costBreakdown.flat.cost)}</td>
              </tr>
              <tr>
                <td>
                  <span className="period-tag valley">谷时</span>
                </td>
                <td>{formatEnergy(currentOrder?.valley_energy ?? costBreakdown.valley.energy)}</td>
                <td>{formatMoney(currentOrder?.valley_cost ?? costBreakdown.valley.cost)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 500 }}>服务费</td>
                <td>{formatEnergy(currentOrder?.energy ?? costBreakdown.totalEnergy)}</td>
                <td>{formatMoney(currentOrder?.service_fee ?? (costBreakdown.totalEnergy * costBreakdown.serviceFee))}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: '#fafafa', fontWeight: 600 }}>
                <td>合计</td>
                <td style={{ color: '#1890ff' }}>{formatEnergy(currentOrder?.energy ?? costBreakdown.totalEnergy)}</td>
                <td style={{ color: '#ff4d4f', fontSize: '16px' }}>{formatMoney(currentOrder?.total_amount ?? costBreakdown.totalCost)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>充电订单</h2>
          </div>

          {currentOrder ? (
            <div>
              <div className="charger-info">
                <div className="charger-info-item">
                  <span className="label">订单号</span>
                  <span className="value" style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                    {currentOrder.order_no}
                  </span>
                </div>
                <div className="charger-info-item">
                  <span className="label">订单状态</span>
                  <span className="value">
                    <span
                      className="status-badge"
                      style={{
                        background: getStatusColor(currentOrder.status) + '20',
                        color: getStatusColor(currentOrder.status)
                      }}
                    >
                      {getStatusText(currentOrder.status)}
                    </span>
                  </span>
                </div>
                <div className="charger-info-item">
                  <span className="label">开始时间</span>
                  <span className="value">{formatDateTime(currentOrder.start_time)}</span>
                </div>
                <div className="charger-info-item">
                  <span className="label">结束时间</span>
                  <span className="value">{formatDateTime(currentOrder.end_time)}</span>
                </div>
                <div className="charger-info-item">
                  <span className="label">充电时长</span>
                  <span className="value">{formatDuration(currentOrder.duration || chargingDuration)}</span>
                </div>
                <div className="charger-info-item">
                  <span className="label">起始SOC</span>
                  <span className="value">{currentOrder.start_soc || 0}%</span>
                </div>
                <div className="charger-info-item">
                  <span className="label">结束SOC</span>
                  <span className="value">{currentOrder.end_soc ?? '-'}%</span>
                </div>
              </div>

              <div style={{ marginTop: '16px', padding: '16px', background: '#fafafa', borderRadius: '6px' }}>
                <div className="flex-between">
                  <span className="text-muted">本次充电量</span>
                  <span className="font-bold text-primary font-large">
                    {formatEnergy(currentOrder.energy !== undefined ? currentOrder.energy : costBreakdown.totalEnergy)}
                  </span>
                </div>
                <div className="flex-between mt-8">
                  <span className="text-muted">总费用</span>
                  <span className="font-bold text-danger font-xlarge">
                    {formatMoney(currentOrder.total_amount !== undefined ? currentOrder.total_amount : costBreakdown.totalCost)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty">
              暂无进行中的订单
              <div className="text-small text-muted mt-8">
                点击"开始充电"创建新订单
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChargerDetail;
