import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { API, formatMoney, formatEnergy, getPeriodText, getPeriodColor } from '../../api';
import ReactECharts from 'echarts-for-react';

function RevenueReport() {
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('daily');
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    station_id: ''
  });

  useEffect(() => {
    loadData();
  }, [reportType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      if (reportType === 'daily' && !filters.start_date) {
        params.days = 30;
      }
      const res = reportType === 'daily'
        ? await API.revenue.daily(params)
        : await API.revenue.monthly(params);
      setData(res.data || []);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSummary = () => {
    const summary = {
      total_orders: 0,
      total_energy: 0,
      total_revenue: 0,
      total_service_fee: 0,
      peak_energy: 0,
      flat_energy: 0,
      valley_energy: 0,
      peak_revenue: 0,
      flat_revenue: 0,
      valley_revenue: 0
    };
    data.forEach(d => {
      summary.total_orders += d.total_orders || 0;
      summary.total_energy += d.total_energy || 0;
      summary.total_revenue += d.total_revenue || 0;
      summary.total_service_fee += d.service_fee || 0;
      summary.peak_energy += d.peak_energy || 0;
      summary.flat_energy += d.flat_energy || 0;
      summary.valley_energy += d.valley_energy || 0;
      summary.peak_revenue += d.peak_revenue || 0;
      summary.flat_revenue += d.flat_revenue || 0;
      summary.valley_revenue += d.valley_revenue || 0;
    });
    return summary;
  };

  const getTrendOption = () => {
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['充电量', '电费', '服务费'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map(d => reportType === 'daily' ? d.date?.slice(5) : d.date?.slice(0, 7))
      },
      yAxis: [
        { type: 'value', name: '电量(kWh)' },
        { type: 'value', name: '金额(元)' }
      ],
      series: [
        {
          name: '充电量',
          type: 'line',
          smooth: true,
          yAxisIndex: 0,
          itemStyle: { color: '#1890ff' },
          data: data.map(d => d.total_energy || 0)
        },
        {
          name: '电费',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          itemStyle: { color: '#52c41a' },
          data: data.map(d => (d.total_revenue || 0) - (d.service_fee || 0))
        },
        {
          name: '服务费',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          itemStyle: { color: '#faad14' },
          data: data.map(d => d.service_fee || 0)
        }
      ]
    };
  };

  const getEnergyPieOption = () => {
    const s = getSummary();
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} kWh ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        name: '电量占比',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: [
          { value: s.peak_energy, name: '峰时', itemStyle: { color: '#ff4d4f' } },
          { value: s.flat_energy, name: '平时', itemStyle: { color: '#faad14' } },
          { value: s.valley_energy, name: '谷时', itemStyle: { color: '#52c41a' } }
        ]
      }]
    };
  };

  const getAmountPieOption = () => {
    const s = getSummary();
    return {
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        name: '电费占比',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: [
          { value: s.peak_revenue, name: '峰时', itemStyle: { color: '#ff4d4f' } },
          { value: s.flat_revenue, name: '平时', itemStyle: { color: '#faad14' } },
          { value: s.valley_revenue, name: '谷时', itemStyle: { color: '#52c41a' } }
        ]
      }]
    };
  };

  const getStationStats = () => {
    const stationMap = {};
    data.forEach(d => {
      if (d.station_name) {
        if (!stationMap[d.station_name]) {
          stationMap[d.station_name] = {
            station_name: d.station_name,
            orders: 0,
            energy: 0,
            total_revenue: 0,
            service_fee: 0
          };
        }
        stationMap[d.station_name].orders += d.total_orders || 0;
        stationMap[d.station_name].energy += d.total_energy || 0;
        stationMap[d.station_name].total_revenue += d.total_revenue || 0;
        stationMap[d.station_name].service_fee += d.service_fee || 0;
      }
    });
    return Object.values(stationMap).sort((a, b) => b.total_revenue - a.total_revenue);
  };

  const summary = getSummary();
  const stationStats = getStationStats();

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

      <div className="card">
        <div className="card-header">
          <h2>查询条件</h2>
          <div className="flex gap-8">
            <button className={`btn ${reportType === 'daily' ? 'btn-primary' : 'btn-default'} btn-sm`} onClick={() => setReportType('daily')}>日报表</button>
            <button className={`btn ${reportType === 'monthly' ? 'btn-primary' : 'btn-default'} btn-sm`} onClick={() => setReportType('monthly')}>月报表</button>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>开始日期</label>
            <input type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
          </div>
          <div className="form-group">
            <label>结束日期</label>
            <input type="date" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
          </div>
          <div className="form-group">
            <label>充电站</label>
            <select value={filters.station_id} onChange={(e) => setFilters({ ...filters, station_id: e.target.value })}>
              <option value="">全部充电站</option>
              <option value="1">充电站A</option>
              <option value="2">充电站B</option>
              <option value="3">充电站C</option>
            </select>
          </div>
        </div>
        <div className="text-right">
          <button className="btn btn-primary btn-sm" onClick={loadData}>查询</button>
          <button className="btn btn-default btn-sm" style={{ marginLeft: '8px' }} onClick={() => { setFilters({ start_date: '', end_date: '', station_id: '' }); loadData(); }}>重置</button>
        </div>
      </div>

      <div className="grid grid-cols-4 mb-16">
        <div className="stat-card blue">
          <div className="label">总订单</div>
          <div className="value">{summary.total_orders}<span className="unit">单</span></div>
        </div>
        <div className="stat-card green">
          <div className="label">总电量</div>
          <div className="value">{formatEnergy(summary.total_energy)}</div>
        </div>
        <div className="stat-card orange">
          <div className="label">总金额</div>
          <div className="value">{formatMoney(summary.total_revenue)}</div>
        </div>
        <div className="stat-card">
          <div className="label">服务费</div>
          <div className="value">{formatMoney(summary.total_service_fee)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h2>{reportType === 'daily' ? '日' : '月'}度趋势</h2>
          </div>
          <ReactECharts option={getTrendOption()} style={{ height: '300px' }} />
        </div>
        <div className="card">
          <div className="card-header">
            <h2>峰平谷电量占比</h2>
          </div>
          <ReactECharts option={getEnergyPieOption()} style={{ height: '300px' }} />
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h2>峰平谷电费占比</h2>
          </div>
          <ReactECharts option={getAmountPieOption()} style={{ height: '300px' }} />
        </div>
        <div className="card">
          <div className="card-header">
            <h2>峰平谷明细</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>时段</th>
                <th>电量</th>
                <th>占比</th>
                <th>电费</th>
                <th>占比</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="period-tag peak">峰时</span></td>
                <td>{formatEnergy(summary.peak_energy)}</td>
                <td>{summary.total_energy > 0 ? ((summary.peak_energy / summary.total_energy) * 100).toFixed(1) : 0}%</td>
                <td>{formatMoney(summary.peak_revenue)}</td>
                <td>{summary.total_revenue > 0 ? ((summary.peak_revenue / summary.total_revenue) * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr>
                <td><span className="period-tag flat">平时</span></td>
                <td>{formatEnergy(summary.flat_energy)}</td>
                <td>{summary.total_energy > 0 ? ((summary.flat_energy / summary.total_energy) * 100).toFixed(1) : 0}%</td>
                <td>{formatMoney(summary.flat_revenue)}</td>
                <td>{summary.total_revenue > 0 ? ((summary.flat_revenue / summary.total_revenue) * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr>
                <td><span className="period-tag valley">谷时</span></td>
                <td>{formatEnergy(summary.valley_energy)}</td>
                <td>{summary.total_energy > 0 ? ((summary.valley_energy / summary.total_energy) * 100).toFixed(1) : 0}%</td>
                <td>{formatMoney(summary.valley_revenue)}</td>
                <td>{summary.total_revenue > 0 ? ((summary.valley_revenue / summary.total_revenue) * 100).toFixed(1) : 0}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>按充电站统计</h2>
        </div>
        {stationStats.length === 0 ? (
          <div className="empty">暂无数据</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>充电站</th>
                <th>订单数</th>
                <th>充电量</th>
                <th>电费</th>
                <th>服务费</th>
                <th>总金额</th>
              </tr>
            </thead>
            <tbody>
              {stationStats.map((s, i) => (
                <tr key={i}>
                  <td className="font-bold">{s.station_name}</td>
                  <td>{s.orders}</td>
                  <td>{formatEnergy(s.energy)}</td>
                  <td>{formatMoney(s.total_revenue - s.service_fee)}</td>
                  <td>{formatMoney(s.service_fee)}</td>
                  <td className="font-bold text-danger">{formatMoney(s.total_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default RevenueReport;
