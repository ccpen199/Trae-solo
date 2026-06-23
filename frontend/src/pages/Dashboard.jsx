import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, formatMoney, formatEnergy, getStatusText, getStatusColor, getChargerTypeText, formatDateTime } from '../api';
import ReactECharts from 'echarts-for-react';

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [allStations, setAllStations] = useState([]);
  const [stations, setStations] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [dailyData, setDailyData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const errors = [];
      
      const [summaryRes, stationsRes, ordersRes, dailyRes] = await Promise.allSettled([
        API.revenue.summary(),
        API.stations.list(),
        API.orders.list({ limit: 10 }),
        API.revenue.daily({ days: 7 })
      ]);

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value.data || {});
      } else {
        errors.push('统计数据');
        console.error('加载统计数据失败:', summaryRes.reason);
      }

      if (stationsRes.status === 'fulfilled') {
        const list = stationsRes.value.data || [];
        setAllStations(list);
        setStations(list.slice(0, 6));
      } else {
        errors.push('充电站列表');
        console.error('加载充电站列表失败:', stationsRes.reason);
      }

      if (ordersRes.status === 'fulfilled') {
        setRecentOrders((ordersRes.value.data || []).slice(0, 5));
      } else {
        errors.push('充电记录');
        console.error('加载充电记录失败:', ordersRes.reason);
      }

      if (dailyRes.status === 'fulfilled') {
        setDailyData(dailyRes.value.data?.chart_data || []);
      } else {
        errors.push('趋势数据');
        console.error('加载趋势数据失败:', dailyRes.reason);
      }

      if (errors.length > 0) {
        setError(`部分数据加载失败: ${errors.join('、')}`);
      }
    } catch (err) {
      console.error('加载数据失败:', err);
      setError(err.message || '加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const getChargingTrendOption = () => {
    const chartData = dailyData && dailyData.length > 0 
      ? [...dailyData]
          .sort((a, b) => new Date(a.date || a.report_date) - new Date(b.date || b.report_date))
          .slice(-7)
          .map(d => ({
            date: d.date ? d.date.slice(5) : (d.report_date ? d.report_date.slice(5) : ''),
            energy: d.total_energy || 0
          }))
      : [];

    const defaultData = [120, 150, 180, 165, 210, 280, 240];
    const defaultLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

    return {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>充电量: {c} kWh'
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
        data: chartData.length > 0 ? chartData.map(d => d.date) : defaultLabels
      },
      yAxis: {
        type: 'value',
        name: '充电量(kWh)'
      },
      series: [
        {
          name: '充电量',
          type: 'line',
          smooth: true,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
              ]
            }
          },
          lineStyle: {
            color: '#1890ff',
            width: 2
          },
          itemStyle: {
            color: '#1890ff'
          },
          data: chartData.length > 0 ? chartData.map(d => d.energy) : defaultData
        }
      ]
    };
  };

  const getStationDistributionOption = () => {
    const cityCount = {};
    allStations.forEach(s => {
      if (s.city) {
        cityCount[s.city] = (cityCount[s.city] || 0) + 1;
      }
    });

    const colors = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#13c2c2'];

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} 座 ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: '城市分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: Object.entries(cityCount).map(([name, value], idx) => ({
            value,
            name,
            itemStyle: {
              color: colors[idx % colors.length]
            }
          }))
        }
      ]
    };
  };

  const getTotalPiles = (station) => {
    return station.total_piles || station.total_chargers || 0;
  };

  const getAvailablePiles = (station) => {
    return station.available_piles || station.available_chargers || 0;
  };

  const getChargingPiles = (station) => {
    return station.charging_piles || station.charging_chargers || 0;
  };

  const getCityCount = () => {
    const cities = new Set(allStations.map(s => s.city).filter(Boolean));
    return cities.size;
  };

  const getTodayEnergy = () => {
    if (summary && summary.today && summary.today.total_energy !== undefined) {
      return summary.today.total_energy;
    }
    if (dailyData && dailyData.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const todayData = dailyData.find(d => d.date === today || d.report_date === today);
      if (todayData && todayData.total_energy !== undefined) {
        return todayData.total_energy;
      }
    }
    return 0;
  };

  const getTodayOrders = () => {
    if (summary && summary.today && summary.today.total_orders !== undefined) {
      return summary.today.total_orders;
    }
    if (dailyData && dailyData.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const todayData = dailyData.find(d => d.date === today || d.report_date === today);
      if (todayData && todayData.total_orders !== undefined) {
        return todayData.total_orders;
      }
    }
    return 0;
  };

  const getOrderEnergy = (order) => {
    return order.energy !== undefined ? order.energy : (order.total_energy || 0);
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>欢迎使用依威能源充电平台</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" onClick={() => navigate('/recommendation')}>
              🔍 智能找桩
            </button>
            <button className="btn btn-success" onClick={() => navigate('/charging')}>
              ⚡ 开始充电
            </button>
          </div>
        </div>
        <div className="alert alert-info">
          <strong>💡 提示：</strong>即插即充已启用，插入充电枪后系统将自动启动充电，无需手动操作。支持国标GB/T协议与OCPP 1.6通信协议。
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>⚠️ 错误：</strong>{error}
          <button 
            className="btn btn-default btn-sm" 
            style={{ marginLeft: '12px' }}
            onClick={loadData}
          >
            重试
          </button>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-4 mb-16">
          <div className="stat-card blue">
            <div className="label">运营充电站</div>
            <div className="value">{summary.total_stations || 0}<span className="unit">座</span></div>
            <div className="trend">覆盖 {getCityCount()} 个城市</div>
          </div>
          <div className="stat-card green">
            <div className="label">在线充电桩</div>
            <div className="value">{summary.online_chargers || 0}<span className="unit">台</span></div>
            <div className="trend">在线率 {summary.online_rate || 0}%</div>
          </div>
          <div className="stat-card orange">
            <div className="label">正在充电</div>
            <div className="value">{summary.charging_now || 0}<span className="unit">辆</span></div>
            <div className="trend">实时功率曲线监控中</div>
          </div>
          <div className="stat-card red">
            <div className="label">今日订单</div>
            <div className="value">{getTodayOrders()}<span className="unit">单</span></div>
            <div className="trend">今日充电 {formatEnergy(getTodayEnergy())}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h2>近7日充电趋势</h2>
          </div>
          <ReactECharts option={getChargingTrendOption()} style={{ height: '300px' }} />
        </div>

        <div className="card">
          <div className="card-header">
            <h2>充电站城市分布</h2>
          </div>
          <ReactECharts option={getStationDistributionOption()} style={{ height: '300px' }} />
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h2>附近充电站</h2>
            <button className="btn btn-default btn-sm" onClick={() => navigate('/stations')}>
              查看全部
            </button>
          </div>
          {stations.length === 0 ? (
            <div className="empty">暂无充电站数据</div>
          ) : (
            <div className="grid grid-cols-2">
              {stations.map(station => (
                <div
                  key={station.id}
                  className="charger-card"
                  onClick={() => navigate(`/stations/${station.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="charger-card-header">
                    <span className="font-bold">{station.name}</span>
                    <span className="text-muted text-small">{station.city || ''}</span>
                  </div>
                  <div className="text-muted text-small mb-8">{station.address || ''}</div>
                  <div className="flex-between">
                    <div>
                      <span className="status-badge" style={{ background: '#e6f7ff', color: '#1890ff' }}>
                        空闲 {getAvailablePiles(station)}
                      </span>
                      <span className="status-badge" style={{ background: '#fffbe6', color: '#faad14', marginLeft: '4px' }}>
                        充电中 {getChargingPiles(station)}
                      </span>
                    </div>
                    <div className="text-small text-muted">
                      {getTotalPiles(station)} 桩
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2>最近充电记录</h2>
            <button className="btn btn-default btn-sm">查看全部</button>
          </div>
          {recentOrders.length === 0 ? (
            <div className="empty">暂无充电记录</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>充电站</th>
                  <th>充电桩</th>
                  <th>充电量</th>
                  <th>费用</th>
                  <th>状态</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{order.order_no}</td>
                    <td>{order.station_name || '-'}</td>
                    <td>{order.charger_code || '-'}</td>
                    <td>{formatEnergy(getOrderEnergy(order))}</td>
                    <td>{formatMoney(order.total_amount)}</td>
                    <td>
                      <span className="status-badge" style={{
                        background: getStatusColor(order.status) + '20',
                        color: getStatusColor(order.status)
                      }}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="text-small text-muted">
                      {formatDateTime(order.created_at || order.start_time)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
