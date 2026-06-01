import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import api from '../services/api';

function Reports() {
  const [activeTab, setActiveTab] = useState('utilization');
  const [parkingData, setParkingData] = useState([]);
  const [chargingData, setChargingData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [peakData, setPeakData] = useState([]);
  const [overtimeData, setOvertimeData] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'utilization') {
        const [pRes, cRes] = await Promise.all([
          api.getParkingUtilization(7),
          api.getChargingUtilization(7)
        ]);
        setParkingData(pRes.data.data);
        setChargingData(cRes.data.data);
      } else if (activeTab === 'revenue') {
        const res = await api.getRevenueAnalysis(30);
        setRevenueData(res.data.data);
      } else if (activeTab === 'peak') {
        const res = await api.getPeakLoad();
        setPeakData(res.data.data);
      } else if (activeTab === 'overtime') {
        const res = await api.getOvertimeAnalysis();
        setOvertimeData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    }
  };

  const utilizationChart = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['车位利用率', '充电利用率'] },
    xAxis: { type: 'category', data: parkingData.map(d => d.date) },
    yAxis: { type: 'value', max: 100 },
    series: [
      { name: '车位利用率', type: 'line', data: parkingData.map(d => d.utilizationRate), smooth: true },
      { name: '充电利用率', type: 'line', data: chargingData.map(d => d.utilizationRate), smooth: true }
    ]
  };

  const revenueChart = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['停车收入', '充电收入', '总收入'] },
    xAxis: { type: 'category', data: revenueData.slice(-14).map(d => d.date) },
    yAxis: { type: 'value' },
    series: [
      { name: '停车收入', type: 'bar', stack: 'total', data: revenueData.slice(-14).map(d => d.parkingAmount) },
      { name: '充电收入', type: 'bar', stack: 'total', data: revenueData.slice(-14).map(d => d.chargingAmount) },
      { name: '总收入', type: 'line', data: revenueData.slice(-14).map(d => d.totalAmount) }
    ]
  };

  const peakChart = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['停车数量', '充电数量', '总负载'] },
    xAxis: { type: 'category', data: peakData.map(d => d.hour) },
    yAxis: { type: 'value' },
    series: [
      { name: '停车数量', type: 'line', data: peakData.map(d => d.parkingCount), areaStyle: {} },
      { name: '充电数量', type: 'line', data: peakData.map(d => d.chargingCount), areaStyle: {} },
      { name: '总负载', type: 'line', data: peakData.map(d => d.totalCount) }
    ]
  };

  return (
    <div>
      <div className="page-header">
        <h1>报表分析</h1>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'utilization' ? 'active' : ''}`} onClick={() => setActiveTab('utilization')}>利用率分析</div>
        <div className={`tab ${activeTab === 'revenue' ? 'active' : ''}`} onClick={() => setActiveTab('revenue')}>收入分析</div>
        <div className={`tab ${activeTab === 'peak' ? 'active' : ''}`} onClick={() => setActiveTab('peak')}>高峰负载</div>
        <div className={`tab ${activeTab === 'overtime' ? 'active' : ''}`} onClick={() => setActiveTab('overtime')}>超时占位</div>
      </div>

      {activeTab === 'utilization' && (
        <div className="card">
          <div className="card-title">近7天利用率趋势</div>
          <div className="chart-container">
            <ReactECharts option={utilizationChart} style={{ height: '300px' }} />
          </div>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="card">
          <div className="card-title">近14天收入趋势</div>
          <div className="chart-container">
            <ReactECharts option={revenueChart} style={{ height: '300px' }} />
          </div>
        </div>
      )}

      {activeTab === 'peak' && (
        <div className="card">
          <div className="card-title">24小时负载分布</div>
          <div className="chart-container">
            <ReactECharts option={peakChart} style={{ height: '300px' }} />
          </div>
        </div>
      )}

      {activeTab === 'overtime' && overtimeData && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="label">超时订单数</div>
              <div className="value">{overtimeData.stats.totalOvertimeOrders}</div>
            </div>
            <div className="stat-card">
              <div className="label">平均超时时长</div>
              <div className="value">{overtimeData.stats.avgOvertimeMinutes}分钟</div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">超时占位订单列表</div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>订单号</th>
                    <th>场站</th>
                    <th>车位</th>
                    <th>总时长</th>
                    <th>超时时间</th>
                    <th>创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {overtimeData.orders.map(o => (
                    <tr key={o.id}>
                      <td>{o.order_no}</td>
                      <td>{o.station_name}</td>
                      <td>{o.spot_number}</td>
                      <td>{o.duration}分钟</td>
                      <td style={{ color: '#ff4d4f' }}>{o.overtime_minutes}分钟</td>
                      <td>{o.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Reports;