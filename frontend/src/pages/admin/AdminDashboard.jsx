import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { API, formatMoney, formatEnergy, formatDateTime, getStatusText, getStatusColor, getAlarmLevelText, getAlarmLevelColor } from '../../api';
import ReactECharts from 'echarts-for-react';

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [alarms, setAlarms] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryRes, dailyRes, alarmsRes] = await Promise.all([
        API.revenue.summary(),
        API.revenue.daily({ days: 30 }),
        API.alarms.list({ limit: 10 })
      ]);
      setSummary(summaryRes.data);
      setDailyData(dailyRes.data || []);
      setAlarms(alarmsRes.data || []);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getChargingTrendOption = () => {
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dailyData.map(d => d.date?.slice(5) || '')
      },
      yAxis: { type: 'value', name: '充电量(kWh)' },
      series: [{
        name: '充电量',
        type: 'line',
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
            ]
          }
        },
        lineStyle: { color: '#1890ff', width: 2 },
        itemStyle: { color: '#1890ff' },
        data: dailyData.map(d => d.energy || 0)
      }]
    };
  };

  const getStationCompareOption = () => {
    const stationMap = {};
    dailyData.forEach(d => {
      if (d.station_name) {
        stationMap[d.station_name] = (stationMap[d.station_name] || 0) + (d.energy || 0);
      }
    });
    const sorted = Object.entries(stationMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: sorted.map(s => s[0]), axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', name: '充电量(kWh)' },
      series: [{
        name: '充电量',
        type: 'bar',
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#1890ff' },
              { offset: 1, color: '#40a9ff' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        data: sorted.map(s => s[1])
      }]
    };
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="tabs">
        <NavLink to="/admin/dashboard" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>运营概览</NavLink>
        <NavLink to="/admin/device-health" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>设备健康</NavLink>
        <NavLink to="/admin/alarm-workorders" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>告警工单</NavLink>
        <NavLink to="/admin/price-strategy" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>电价策略</NavLink>
        <NavLink to="/admin/revenue-report" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>收益报表</NavLink>
      </div>

      {summary && (
        <div className="grid grid-cols-3 mb-16">
          <div className="stat-card blue">
            <div className="label">总充电站</div>
            <div className="value">{summary.total_stations}<span className="unit">座</span></div>
            <div className="trend">总充电桩 {summary.total_chargers} 台</div>
          </div>
          <div className="stat-card green">
            <div className="label">在线率</div>
            <div className="value">{summary.online_rate}<span className="unit">%</span></div>
            <div className="trend">在线 {summary.online_chargers} / 离线 {summary.total_chargers - summary.online_chargers}</div>
          </div>
          <div className="stat-card orange">
            <div className="label">今日订单</div>
            <div className="value">{summary.today_orders}<span className="unit">单</span></div>
            <div className="trend">充电中 {summary.charging_now} 辆</div>
          </div>
          <div className="stat-card red">
            <div className="label">今日电量</div>
            <div className="value">{formatEnergy(summary.today_energy)}</div>
            <div className="trend">较昨日 {summary.today_energy > summary.yesterday_energy ? '↑' : '↓'}</div>
          </div>
          <div className="stat-card">
            <div className="label">今日收入</div>
            <div className="value">{formatMoney(summary.today_revenue)}</div>
            <div className="trend">服务费 {formatMoney(summary.today_service_fee)}</div>
          </div>
          <div className="stat-card green">
            <div className="label">待处理告警</div>
            <div className="value">{summary.active_alarms}<span className="unit">条</span></div>
            <div className="trend">需要及时处理</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h2>近30日充电量趋势</h2>
          </div>
          <ReactECharts option={getChargingTrendOption()} style={{ height: '300px' }} />
        </div>
        <div className="card">
          <div className="card-header">
            <h2>各充电站充电量对比</h2>
          </div>
          <ReactECharts option={getStationCompareOption()} style={{ height: '300px' }} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>最近告警</h2>
          <NavLink to="/admin/alarm-workorders" className="btn btn-default btn-sm">查看全部</NavLink>
        </div>
        {alarms.length === 0 ? (
          <div className="empty">暂无告警</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>工单号</th>
                <th>充电站</th>
                <th>充电桩</th>
                <th>告警类型</th>
                <th>告警级别</th>
                <th>状态</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {alarms.map(alarm => (
                <tr key={alarm.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{alarm.alarm_no}</td>
                  <td>{alarm.station_name}</td>
                  <td>{alarm.charger_code}</td>
                  <td>{alarm.alarm_type}</td>
                  <td>
                    <span className="status-badge" style={{
                      background: getAlarmLevelColor(alarm.level) + '20',
                      color: getAlarmLevelColor(alarm.level)
                    }}>
                      {getAlarmLevelText(alarm.level)}
                    </span>
                  </td>
                  <td>
                    <span className="status-badge" style={{
                      background: getStatusColor(alarm.status) + '20',
                      color: getStatusColor(alarm.status)
                    }}>
                      {getStatusText(alarm.status)}
                    </span>
                  </td>
                  <td>{formatDateTime(alarm.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
