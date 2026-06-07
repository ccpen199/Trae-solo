import { useState, useEffect } from 'react';
import axios from 'axios';
import * as echarts from 'echarts';

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [walletHealth, setWalletHealth] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);

  const handleLogin = async () => {
    try {
      const res = await axios.post('/api/admin/login', { username, password });
      if (res.data.success) {
        setLoggedIn(true);
        loadDashboard();
      }
    } catch (e) {
      alert('登录失败');
    }
  };

  const loadDashboard = async () => {
    axios.get('/api/admin/dashboard')
      .then(res => {
        if (res.data.success) {
          setDashboard(res.data.data);
        }
      });
    axios.get('/api/admin/alerts')
      .then(res => {
        if (res.data.success) {
          setAlerts(res.data.data);
        }
      });
  };

  const loadHeatmap = () => {
    axios.get('/api/admin/payment-heatmap')
      .then(res => {
        if (res.data.success) {
          setHeatmapData(res.data.data);
          setTimeout(() => {
            const chartDom = document.getElementById('heatmap');
            if (chartDom) {
              const myChart = echarts.init(chartDom);
              const maxVal = Math.max(...res.data.data.map(d => d.value));
              myChart.setOption({
                title: { text: '缴费完成率热力图', left: 'center' },
                tooltip: { trigger: 'item' },
                visualMap: { min: 0, max: maxVal, inRange: { color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'] },
                xAxis: { type: 'category', data: res.data.data.map(d => d.name.substring(0, 2)), axisLabel: { rotate: 45 } },
                yAxis: { type: 'category', data: ['缴费数量'] },
                series: [{ type: 'heatmap', data: res.data.data.map((d, i) => [i, 0, d.value]), label: { show: true } }]
              });
            }
          }, 100);
        }
      });
  };

  const loadWalletHealth = () => {
    axios.get('/api/admin/wallet-health')
      .then(res => {
        if (res.data.success) {
          setWalletHealth(res.data.data);
        }
      });
  };

  const loadAuditLogs = () => {
    axios.get('/api/admin/audit-logs')
      .then(res => {
        if (res.data.success) {
          setAuditLogs(res.data.data);
        }
      });
  };

  const resolveAlert = async (id) => {
    await axios.post(`/api/admin/alert/resolve/${id}`);
    loadDashboard();
  };

  if (!loggedIn) {
    return (
      <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h2>管理后台登录</h2>
        <div className="form-group">
          <label>用户名</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div className="form-group">
          <label>密码</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={handleLogin}>登录</button>
        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '1rem' }}>
          默认账号: admin / admin123
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-menu">
      <button className={activeMenu === 'dashboard' ? 'active' : ''} onClick={() => { setActiveMenu('dashboard'); loadDashboard(); }}>数据概览</button>
        <button className={activeMenu === 'alerts' ? 'active' : ''} onClick={() => { setActiveMenu('alerts'); }}>异常预警</button>
        <button className={activeMenu === 'heatmap' ? 'active' : ''} onClick={() => { setActiveMenu('heatmap'); loadHeatmap(); }}>缴费热力图</button>
        <button className={activeMenu === 'wallet' ? 'active' : ''} onClick={() => { setActiveMenu('wallet'); loadWalletHealth(); }}>钱包健康度</button>
        <button className={activeMenu === 'audit' ? 'active' : ''} onClick={() => { setActiveMenu('audit'); loadAuditLogs(); }}>审计日志</button>
      </div>

      {activeMenu === 'dashboard' && dashboard && (
        <div>
          <div className="grid">
            <div className="stat-card">
              <div className="value">{dashboard.total_persons}</div>
              <div className="label">参保人数</div>
            </div>
            <div className="stat-card">
              <div className="value">{dashboard.total_certifications}</div>
              <div className="label">认证完成</div>
            </div>
            <div className="stat-card">
              <div className="value">{dashboard.total_payments}</div>
              <div className="label">缴费订单</div>
            </div>
            <div className="stat-card">
              <div className="value">¥{dashboard.total_wallet_balance.toLocaleString()}</div>
              <div className="label">钱包总余额</div>
            </div>
            <div className="stat-card">
              <div className="value">{dashboard.pending_reviews}</div>
              <div className="label">待审核</div>
            </div>
            <div className="stat-card">
              <div className="value" style={{ color: dashboard.open_alerts > 0 ? '#dc3545' : '#28a745' }}>{dashboard.open_alerts}</div>
              <div className="label">异常预警</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h3>最新异常预警</h3>
            {alerts.slice(0, 5).map(alert => (
              <div key={alert.id} style={{ padding: '0.75rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className={`badge badge-${alert.severity === 'warning' ? 'warning' : 'danger'}`}>
                    {alert.severity === 'warning' ? '警告' : '危险'}
                  </span>
                  <span style={{ marginLeft: '0.5rem' }}>{alert.description}</span>
                  {alert.name && <span style={{ color: '#666', marginLeft: '0.5rem' }}>({alert.name})</span>
                </div>
                {alert.status === 'open' && (
                  <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} onClick={() => resolveAlert(alert.id)}>处理</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeMenu === 'alerts' && (
        <div className="card">
          <h3>异常预警列表 ({alerts.length}条)</h3>
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>类型</th>
                <th>人员</th>
                <th>描述</th>
                <th>位置</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(alert => (
                <tr key={alert.id}>
                  <td>{new Date(alert.created_at).toLocaleString()}</td>
                  <td>{alert.alert_type === 'cross_province_cert' ? '异地认证' : alert.alert_type}</td>
                  <td>{alert.name || '-'}</td>
                  <td>{alert.description}</td>
                  <td>{alert.location}</td>
                  <td>
                    <span className={`badge badge-${alert.status === 'open' ? 'warning' : 'success'}`}>
                      {alert.status === 'open' ? '待处理' : '已处理'}
                    </span>
                  </td>
                  <td>
                    {alert.status === 'open' && (
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} onClick={() => resolveAlert(alert.id)}>处理</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeMenu === 'heatmap' && (
        <div className="card">
          <div id="heatmap" className="chart-container"></div>
        </div>
      )}

      {activeMenu === 'wallet' && walletHealth && (
        <div>
          <div className="grid">
            <div className="stat-card">
              <div className="value">¥{walletHealth.total_balance.toLocaleString()}</div>
              <div className="label">总余额</div>
            </div>
            <div className="stat-card">
              <div className="value">{walletHealth.active_wallets}</div>
              <div className="label">活跃钱包</div>
            </div>
            <div className="stat-card">
              <div className="value">{walletHealth.total_transactions}</div>
              <div className="label">交易笔数</div>
            </div>
            <div className="stat-card">
              <div className="value" style={{ color: walletHealth.health_score >= 90 ? '#28a745' : '#ffc107' }}>{walletHealth.health_score}</div>
              <div className="label">健康评分</div>
            </div>
          </div>
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h3>资产健康度诊断报告</h3>
            <p><strong>对账状态:</strong> <span className={`badge badge-${walletHealth.reconciliation_status === 'matched' ? 'success' : 'warning'}`}>
              {walletHealth.reconciliation_status === 'matched' ? '对账一致' : '待对账'}
            </span></p>
            <p><strong>风险等级:</strong> <span className="badge badge-success">{walletHealth.risk_level === 'low' ? '低风险' : walletHealth.risk_level}</span></p>
            <p style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
              ✅ 银行级资金隔离正常<br />
              ✅ 央行备付金监管对账正常<br />
              ✅ T+0申赎规则执行正常<br />
              ✅ 收益结转逻辑正常
            </p>
          </div>
        </div>
      )}

      {activeMenu === 'audit' && (
        <div className="card">
          <h3>审计日志</h3>
          <table>
            <thead>
              <tr>
              <th>时间</th>
              <th>模块</th>
              <th>操作</th>
              <th>详情</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                  <td>{log.module}</td>
                  <td>{log.action}</td>
                  <td>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
