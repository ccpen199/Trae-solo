import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, formatMoney, formatEnergy, getStatusText, getStatusColor, getChargerTypeText } from '../api';
import ReactECharts from 'echarts-for-react';

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [stations, setStations] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryRes, stationsRes, ordersRes] = await Promise.all([
        API.revenue.summary(),
        API.stations.list(),
        API.orders.list({ user_id: 1 })
      ]);

      setSummary(summaryRes.data);
      setStations(stationsRes.data.slice(0, 6));
      setRecentOrders(ordersRes.data.slice(0, 5));
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getChargingTrendOption = () => {
    return {
      tooltip: {
        trigger: 'axis'
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
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
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
          data: [120, 150, 180, 165, 210, 280, 240]
        }
      ]
    };
  };

  const getStationDistributionOption = () => {
    const cityCount = {};
    stations.forEach(s => {
      cityCount[s.city] = (cityCount[s.city] || 0) + 1;
    });

    return {
      tooltip: {
        trigger: 'item'
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
              color: ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#13c2c2'][idx]
            }
          }))
        }
      ]
    };
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

      {summary && (
        <div className="grid grid-cols-4 mb-16">
          <div className="stat-card blue">
            <div className="label">运营充电站</div>
            <div className="value">{summary.total_stations}<span className="unit">座</span></div>
            <div className="trend">覆盖 {stations.filter((v, i, a) => a.findIndex(t => t.city === v.city) === i).length} 个城市</div>
          </div>
          <div className="stat-card green">
            <div className="label">在线充电桩</div>
            <div className="value">{summary.online_chargers}<span className="unit">台</span></div>
            <div className="trend">在线率 {summary.online_rate}%</div>
          </div>
          <div className="stat-card orange">
            <div className="label">正在充电</div>
            <div className="value">{summary.charging_now}<span className="unit">辆</span></div>
            <div className="trend">实时功率曲线监控中</div>
          </div>
          <div className="stat-card red">
            <div className="label">待处理告警</div>
            <div className="value">{summary.active_alarms}<span className="unit">条</span></div>
            <div className="trend">需要及时处理</div>
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
          <div className="grid grid-cols-2">
            {stations.map(station => (
              <div
                key={station.id}
                className="charger-card"
                onClick={() => navigate(`/stations/${station.id}`)}
              >
                <div className="charger-card-header">
                  <span className="font-bold">{station.name}</span>
                  <span className="text-muted text-small">{station.city}</span>
                </div>
                <div className="text-muted text-small mb-8">{station.address}</div>
                <div className="flex-between">
                  <div>
                    <span className="status-badge" style={{ background: '#e6f7ff', color: '#1890ff' }}>
                      空闲 {station.available_piles}
                    </span>
                    <span className="status-badge" style={{ background: '#fffbe6', color: '#faad14', marginLeft: '4px' }}>
                      充电中 {station.charging_piles}
                    </span>
                  </div>
                  <div className="text-small text-muted">
                    {station.total_piles} 桩
                  </div>
                </div>
              </div>
            ))}
          </div>
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
                  <th>充电量</th>
                  <th>金额</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{order.order_no}</td>
                    <td>{order.station_name}</td>
                    <td>{formatEnergy(order.energy)}</td>
                    <td>{formatMoney(order.total_amount)}</td>
                    <td>
                      <span className="status-badge" style={{
                        background: getStatusColor(order.status) + '20',
                        color: getStatusColor(order.status)
                      }}>
                        {getStatusText(order.status)}
                      </span>
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
