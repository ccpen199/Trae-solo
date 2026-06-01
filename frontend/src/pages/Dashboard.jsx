import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const DEVICE_TYPE_MAP = { gate: '道闸', camera: '摄像头', sensor: '传感器', lock: '地锁', charger: '充电桩' };
const DEVICE_ICONS = { gate: '🚧', camera: '📷', sensor: '📡', lock: '🔒', charger: '⚡' };

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [stations, setStations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, stationsRes, alertsRes] = await Promise.all([
        api.getDashboardStats(),
        api.getStations(),
        api.getAlerts({ is_resolved: 0 })
      ]);
      setStats(statsRes.data.data);
      setStations(stationsRes.data.data);
      setAlerts(alertsRes.data.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: '🗺️', title: '场站地图', desc: '查看车位和充电枪状态', path: '/map' },
    { icon: '🚙', title: '车主服务', desc: '入场、充电、支付全流程', path: '/vehicle' },
    { icon: '📅', title: '车位预约', desc: '在线预约车位', path: '/reservation' },
    { icon: '📝', title: '订单管理', desc: '停车/充电订单查询', path: '/orders' },
    { icon: '🔧', title: '设备管理', desc: '监控设备在线状态', path: '/devices' },
    { icon: '📑', title: '工单系统', desc: '设备故障处理', path: '/workorders' },
    { icon: '💰', title: '计费规则', desc: '停车和充电定价', path: '/pricing' },
    { icon: '📈', title: '报表分析', desc: '运营数据和财务报表', path: '/reports' },
    { icon: '👥', title: '用户管理', desc: '会员和车主信息', path: '/users' }
  ];

  if (loading) return <div className="loading">加载中...</div>;

  const fo = stats.financialOverview || {};
  const recentOrders = stats.recentOrders || [];
  const recentPaid = stats.recentPaidOrders || [];
  const deviceStats = stats.deviceStatusByType || [];
  const deviceLogs = stats.recentDeviceLogs || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>运营总览 Dashboard</h1>
          <div className="subtitle">实时监控所有场站运营状态</div>
        </div>
        <div>
          <button className="btn btn-primary" onClick={() => navigate('/vehicle')}>快速入场</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">运营场站</div>
          <div className="value">{stats.totalStations}</div>
          <div className="trend">{stations.filter(s => s.status === 'active').length} 个在线</div>
        </div>
        <div className="stat-card">
          <div className="label">总车位</div>
          <div className="value">{stats.totalSpots}</div>
          <div className="trend up">使用率 {((stats.occupiedSpots / stats.totalSpots) * 100).toFixed(1)}%</div>
        </div>
        <div className="stat-card">
          <div className="label">充电枪</div>
          <div className="value">{stats.totalGuns}</div>
          <div className="trend up">充电中 {((stats.chargingGuns / stats.totalGuns) * 100).toFixed(1)}%</div>
        </div>
        <div className="stat-card">
          <div className="label">注册用户</div>
          <div className="value">{stats.totalUsers}</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card danger">
          <div className="label">当前占用车位</div>
          <div className="value">{stats.occupiedSpots}</div>
          <div className="trend">空闲 {stats.availableSpots || (stats.totalSpots - stats.occupiedSpots)} 个</div>
        </div>
        <div className="stat-card">
          <div className="label">正在充电</div>
          <div className="value">{stats.chargingGuns}</div>
          <div className="trend">空闲 {stats.idleGuns || (stats.totalGuns - stats.chargingGuns)} 把</div>
        </div>
        <div className="stat-card success">
          <div className="label">今日收入</div>
          <div className="value">¥{stats.todayTotalAmount.toFixed(2)}</div>
          <div className="trend">
            停车 ¥{stats.todayParkingAmount.toFixed(2)} / 充电 ¥{stats.todayChargingAmount.toFixed(2)}
          </div>
        </div>
        <div className="stat-card warning">
          <div className="label">待处理事项</div>
          <div className="value">{stats.pendingWorkOrders + stats.activeAlerts}</div>
          <div className="trend">工单 {stats.pendingWorkOrders} / 告警 {stats.activeAlerts}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title" style={{ marginBottom: 0 }}>快捷操作</div>
        </div>
        <div className="quick-actions">
          {quickActions.map((action, idx) => (
            <div key={idx} className="quick-action-btn" onClick={() => navigate(action.path)}>
              <div className="icon">{action.icon}</div>
              <div className="title">{action.title}</div>
              <div className="desc">{action.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ marginBottom: 0 }}>场站列表</div>
            <button className="btn btn-small btn-default" onClick={() => navigate('/map')}>查看全部</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>场站名称</th>
                  <th>空闲车位</th>
                  <th>空闲充电枪</th>
                  <th>普通车位价</th>
                  <th>充电车位价</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {stations.map(s => (
                  <tr key={s.id} onClick={() => navigate('/map')} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: '500' }}>{s.name}</td>
                    <td><span className="badge badge-success">{s.spotStats?.available || 0}</span> / {s.spotStats?.total || 0}</td>
                    <td><span className="badge badge-primary">{s.gunStats?.idle || 0}</span> / {s.gunStats?.total || 0}</td>
                    <td>¥5/时</td>
                    <td>¥{s.id === 1 ? '8' : '10'}/时</td>
                    <td>
                      <span className={`status-badge ${s.status === 'active' ? 'status-available' : 'status-offline'}`}>
                        {s.status === 'active' ? '运营中' : s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ marginBottom: 0 }}>设备告警</div>
            <button className="btn btn-small btn-default" onClick={() => navigate('/devices')}>查看全部</button>
          </div>
          {alerts.length === 0 ? (
            <div className="empty-state">
              <div className="icon">✅</div>
              <div className="title">暂无告警</div>
              <div className="desc">所有设备运行正常</div>
            </div>
          ) : (
            <div className="alerts-panel">
              {alerts.slice(0, 5).map(a => (
                <div key={a.id} className={`alert-item ${(a.alert_level || a.level) === 'critical' || (a.alert_level || a.level) === 'error' ? 'error' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className={`badge ${(a.alert_level || a.level) === 'critical' ? 'badge-warning' : 'badge-primary'}`}>
                        {(a.alert_level || a.level) === 'critical' ? '严重' : (a.alert_level || a.level) === 'warning' ? '警告' : '提示'}
                      </span>
                      <strong style={{ marginLeft: '8px' }}>{a.device_name || '-'}</strong>
                      <span style={{ marginLeft: '12px', color: '#666' }}>{a.message}</span>
                    </div>
                    <div className="time">{a.station_name} · {a.created_at}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {recentOrders.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ marginBottom: 0 }}>
              进行中订单 <span className="badge badge-warning" style={{ marginLeft: '8px' }}>预估金额</span>
            </div>
            <button className="btn btn-small btn-default" onClick={() => navigate('/orders')}>查看全部</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>类型</th>
                  <th>场站</th>
                  <th>车位/枪</th>
                  <th>车牌号</th>
                  <th>当前时长</th>
                  <th>预估金额</th>
                  <th>状态</th>
                  <th>开始时间</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={`${o.order_type}-${o.id}`}>
                    <td>{o.order_no}</td>
                    <td>
                      <span className={`badge ${o.order_type === 'parking' ? 'badge-primary' : 'badge-success'}`}>
                        {o.order_type === 'parking' ? '🚗 停车' : '⚡ 充电'}
                      </span>
                    </td>
                    <td>{o.station_name}</td>
                    <td>{o.spot_number || o.gun_number}</td>
                    <td>{o.plate_number || '-'}</td>
                    <td>{o.current_duration || '-'} 分钟</td>
                    <td style={{ color: '#ff4d4f', fontWeight: '600' }}>
                      ¥{o.estimated_amount || (o.amount || 0).toFixed(2)}
                      {o.estimated_energy && <span style={{ fontSize: '11px', color: '#999' }}> ({o.estimated_energy}度)</span>}
                    </td>
                    <td>
                      <span className={`status-badge status-${o.status}`}>
                        {o.status === 'parking' ? '🅿️ 停车中' :
                         o.status === 'charging' ? '⚡ 充电中' :
                         o.status === 'paid' ? '已支付' :
                         o.status === 'pending' ? '待支付' : o.status}
                      </span>
                    </td>
                    <td>{o.enter_time || o.start_time || o.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ marginBottom: 0 }}>
              💰 财务核对 - 今日收支
            </div>
          </div>
          <div className="order-section">
            <div className="order-section-title">🅿️ 停车计费</div>
            <div className="order-section-content">
              <div className="payment-row"><span>今日停车订单</span><span>{fo.todayOrders || 0} 单</span></div>
              <div className="payment-row"><span>停车费收入</span><span style={{ fontWeight: '600' }}>¥{stats.todayParkingAmount.toFixed(2)}</span></div>
            </div>
          </div>
          <div className="order-section">
            <div className="order-section-title">⚡ 充电计费</div>
            <div className="order-section-content">
              <div className="payment-row"><span>充电费收入</span><span style={{ fontWeight: '600' }}>¥{stats.todayChargingAmount.toFixed(2)}</span></div>
            </div>
          </div>
          <div className="order-section">
            <div className="order-section-title">🎁 优惠减免</div>
            <div className="order-section-content">
              <div className="payment-row discount"><span>优惠减免总额</span><span>-¥{(fo.todayDiscount || 0).toFixed(2)}</span></div>
              <div className="payment-row discount"><span>会员权益</span><span>-¥{(fo.todayMemberBenefits || 0).toFixed(2)}</span></div>
            </div>
          </div>
          <div className="order-section">
            <div className="order-section-title">⏰ 超时占位费</div>
            <div className="order-section-content">
              <div className="payment-row"><span>超时费收入</span><span style={{ color: '#faad14', fontWeight: '600' }}>+¥{(fo.todayOvertimeFees || 0).toFixed(2)}</span></div>
            </div>
          </div>
          <div className="payment-summary" style={{ marginTop: '16px' }}>
            <div className="payment-row total">
              <span>今日实收合计</span>
              <span style={{ fontSize: '22px' }}>¥{(stats.todayTotalAmount + (fo.todayOvertimeFees || 0)).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ marginBottom: 0 }}>📋 最近完成支付订单</div>
          </div>
          {recentPaid.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📝</div>
              <div className="title">暂无支付记录</div>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>订单号</th>
                    <th>车牌号</th>
                    <th>总金额</th>
                    <th>优惠</th>
                    <th>实收</th>
                    <th>权益</th>
                    <th>支付时间</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPaid.map(o => (
                    <tr key={o.id} onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>
                      <td>{o.order_no}</td>
                      <td>{o.plate_number || '-'}</td>
                      <td>¥{(o.total_amount || 0).toFixed(2)}</td>
                      <td style={{ color: '#52c41a' }}>-¥{(o.total_discount || 0).toFixed(2)}</td>
                      <td style={{ fontWeight: '600', color: '#1890ff' }}>¥{(o.actual_amount || 0).toFixed(2)}</td>
                      <td><span className="badge badge-success">{o.member_benefit || '无'}</span></td>
                      <td>{o.paid_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ marginBottom: 0 }}>🔧 设备状态看板</div>
            <button className="btn btn-small btn-default" onClick={() => navigate('/devices')}>查看详情</button>
          </div>
          <div className="stats-grid" style={{ marginBottom: '0' }}>
            {deviceStats.map(d => (
              <div key={d.device_type} className="stat-card">
                <div className="label">
                  {DEVICE_ICONS[d.device_type] || '📦'} {DEVICE_TYPE_MAP[d.device_type] || d.device_type}
                </div>
                <div className="value">{d.total}</div>
                <div className="trend">
                  <span style={{ color: '#52c41a' }}>在线 {d.online}</span>
                  {' / '}
                  <span style={{ color: '#ff4d4f' }}>异常 {d.offline + d.fault}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ marginBottom: 0 }}>📊 设备状态流转记录</div>
            <button className="btn btn-small btn-default" onClick={() => navigate('/workorders')}>生成工单</button>
          </div>
          <div className="alerts-panel">
            {deviceLogs.slice(0, 8).map(log => (
              <div key={log.id} className="alert-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="badge badge-primary">
                      {DEVICE_ICONS[log.device_type] || '📦'} {DEVICE_TYPE_MAP[log.device_type] || log.device_type}
                    </span>
                    <strong style={{ marginLeft: '8px' }}>{log.device_name}</strong>
                    <span style={{ marginLeft: '12px' }}>
                      <span className={`status-badge status-${log.old_status === 'online' ? 'available' : 'offline'}`} style={{ marginRight: '6px' }}>
                        {log.old_status}
                      </span>
                      →
                      <span className={`status-badge status-${log.new_status === 'online' ? 'available' : 'offline'}`} style={{ marginLeft: '6px' }}>
                        {log.new_status}
                      </span>
                    </span>
                  </div>
                  <div className="time">{log.created_at}</div>
                </div>
                <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>{log.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
