import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { getDashboardStats, getOverdueTrend, getAlerts, resolveAlert } from '../api.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [trendData, setTrendData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAlertDetail, setShowAlertDetail] = useState(null);
  const [alertDetail, setAlertDetail] = useState(null);
  const [resolveForm, setResolveForm] = useState({
    handled_by: '',
    handle_result: '',
    handle_notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, trendRes, alertsRes] = await Promise.all([
        getDashboardStats(),
        getOverdueTrend(),
        getAlerts()
      ]);
      console.log('Dashboard API返回 - stats:', statsRes.data);
      console.log('Dashboard API返回 - trend:', trendRes.data);
      console.log('Dashboard API返回 - alerts:', alertsRes.data);
      setStats(statsRes.data || {});
      setTrendData(Array.isArray(trendRes.data) ? trendRes.data : []);
      setAlerts((Array.isArray(alertsRes.data) ? alertsRes.data : []).filter(a => a.status === 'active'));
    } catch (error) {
      console.error('加载数据失败:', error);
      setStats({});
      setTrendData([]);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAlertDetail = (alert) => {
    setAlertDetail(alert);
    setShowAlertDetail(true);
    setResolveForm({ handled_by: '', handle_result: '', handle_notes: '' });
  };

  const handleResolveAlert = async () => {
    try {
      await resolveAlert(alertDetail.id, resolveForm);
      setAlerts(alerts.filter(a => a.id !== alertDetail.id));
      setShowAlertDetail(false);
    } catch (error) {
      console.error('处理告警失败:', error);
    }
  };

  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['逾期笔数', '逾期金额'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: trendData.map(d => d.month)
    },
    yAxis: [
      { type: 'value', name: '笔数' },
      { type: 'value', name: '金额(万)', axisLabel: { formatter: '{value}' } }
    ],
    series: [
      {
        name: '逾期笔数',
        type: 'bar',
        data: trendData.map(d => d.count),
        itemStyle: { color: '#f59e0b' }
      },
      {
        name: '逾期金额',
        type: 'line',
        yAxisIndex: 1,
        data: trendData.map(d => Math.round(d.amount / 10000)),
        itemStyle: { color: '#dc3545' },
        smooth: true
      }
    ]
  };

  if (loading) {
    return <div className="page-header"><h1>加载中...</h1></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>风控看板</h1>
        <p>实时监控租赁业务风险指标</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card clickable" onClick={() => navigate('/customers')}>
          <div className="label">客户总数</div>
          <div className="value">{stats.totalCustomers || 0}</div>
          <div className="link-hint">点击查看 →</div>
        </div>
        <div className="stat-card clickable" onClick={() => navigate('/contracts')}>
          <div className="label">活跃合同</div>
          <div className="value">{stats.activeContracts || 0}</div>
          <div className="link-hint">点击查看 →</div>
        </div>
        <div className="stat-card clickable" onClick={() => navigate('/devices')}>
          <div className="label">设备总数</div>
          <div className="value">{stats.totalDevices || 0}</div>
          <div className="link-hint">点击查看 →</div>
        </div>
        <div className="stat-card clickable" onClick={() => navigate('/bills')}>
          <div className="label">待收金额</div>
          <div className="value currency">{(stats.unpaidAmount || 0).toLocaleString()}</div>
          <div className="link-hint">点击查看 →</div>
        </div>
        <div className="stat-card clickable" onClick={() => navigate('/bills?filter=unpaid')}>
          <div className="label">逾期账单</div>
          <div className="value text-danger">{stats.overdueBills || 0}</div>
          <div className="link-hint">点击查看 →</div>
        </div>
        <div className="stat-card clickable" onClick={() => navigate('/customers?risk=high')}>
          <div className="label">高风险客户</div>
          <div className="value text-warning">{stats.highRiskCustomers || 0}</div>
          <div className="link-hint">点击查看 →</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>逾期趋势</h3>
          <div className="chart-container">
            <ReactECharts option={trendOption} style={{ height: '100%' }} />
          </div>
        </div>

        <div className="card">
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <h3 style={{ marginBottom: 0 }}>设备告警</h3>
            <span className="badge danger">{alerts.length} 条待处理</span>
          </div>
          {alerts.length === 0 ? (
            <div className="empty-state">暂无告警</div>
          ) : (
            alerts.slice(0, 5).map(alert => (
              <div key={alert.id} className={`alert-item ${alert.alert_level} clickable`} onClick={() => handleViewAlertDetail(alert)}>
                <div className="flex-between">
                  <div style={{ flex: 1 }}>
                    <div className="flex-between">
                      <strong>{alert.serial_no} - {alert.device_name}</strong>
                      <span className="text-muted" style={{ fontSize: '12px' }}>{alert.created_at}</span>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <span className={`badge ${alert.alert_level === 'danger' ? 'danger' : 'warning'}`}>
                        {alert.alert_type === 'abnormal_movement' ? '异常移动' : alert.alert_type === 'maintenance_due' ? '保养提醒' : alert.alert_type}
                      </span>
                      <span className="text-muted" style={{ fontSize: '12px', marginLeft: '8px' }}>
                        {alert.description}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAlertDetail && alertDetail && (
        <div className="modal-overlay" onClick={() => setShowAlertDetail(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>告警详情</h2>
              <button className="close-btn" onClick={() => setShowAlertDetail(false)}>&times;</button>
            </div>
            <div className="grid-2 mb-2">
              <div>
                <strong>设备序列号:</strong>
                <div className="text-muted">{alertDetail.serial_no || '-'}</div>
              </div>
              <div>
                <strong>设备名称:</strong>
                <div className="text-muted">{alertDetail.device_name || '-'}</div>
              </div>
              <div>
                <strong>告警类型:</strong>
                <div className="text-muted">{alertDetail.alert_type === 'abnormal_movement' ? '异常移动' : alertDetail.alert_type === 'maintenance_due' ? '保养提醒' : (alertDetail.alert_type || '-')}</div>
              </div>
              <div>
                <strong>告警级别:</strong>
                <div>
                  <span className={`badge ${alertDetail.alert_level === 'danger' ? 'danger' : 'warning'}`}>
                    {alertDetail.alert_level === 'danger' ? '高' : '中'}
                  </span>
                </div>
              </div>
              <div>
                <strong>触发时间:</strong>
                <div className="text-muted">{alertDetail.created_at || '-'}</div>
              </div>
              <div>
                <strong>状态:</strong>
                <div className="text-muted">{alertDetail.status === 'active' ? '待处理' : '已处理'}</div>
              </div>
            </div>
            <div className="mb-2">
              <strong>告警描述:</strong>
              <div className="text-muted">{alertDetail.description || '-'}</div>
            </div>
            {alertDetail.status === 'active' && (
              <div className="mb-2">
                <h4 style={{ marginBottom: '12px' }}>告警处理</h4>
                <div className="form-group">
                  <label>处理人 *</label>
                  <input type="text" required value={resolveForm.handled_by}
                    onChange={e => setResolveForm({ ...resolveForm, handled_by: e.target.value })}
                    placeholder="请输入处理人姓名" />
                </div>
                <div className="form-group">
                  <label>处理结果 *</label>
                  <select required value={resolveForm.handle_result}
                    onChange={e => setResolveForm({ ...resolveForm, handle_result: e.target.value })}>
                    <option value="">请选择处理结果</option>
                    <option value="resolved">已解决</option>
                    <option value="false_alarm">误报</option>
                    <option value="escalated">已升级</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>处理备注</label>
                  <textarea value={resolveForm.handle_notes}
                    onChange={e => setResolveForm({ ...resolveForm, handle_notes: e.target.value })}
                    placeholder="请输入处理备注" rows="3" />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAlertDetail(false)}>取消</button>
                  <button type="button" className="btn btn-primary" onClick={handleResolveAlert}
                    disabled={!resolveForm.handled_by || !resolveForm.handle_result}>
                    确认处理
                  </button>
                </div>
              </div>
            )}
            {alertDetail.status === 'resolved' && (
              <div className="mb-2">
                <h4 style={{ marginBottom: '12px' }}>处理记录</h4>
                <div className="grid-2">
                  <div>
                    <strong>处理人:</strong>
                    <div className="text-muted">{alertDetail.handled_by || '-'}</div>
                  </div>
                  <div>
                    <strong>处理时间:</strong>
                    <div className="text-muted">{alertDetail.handled_at || '-'}</div>
                  </div>
                  <div>
                    <strong>处理结果:</strong>
                    <div className="text-muted">{alertDetail.handle_result || '-'}</div>
                  </div>
                  <div>
                    <strong>复查人:</strong>
                    <div className="text-muted">{alertDetail.reviewed_by || '-'}</div>
                  </div>
                </div>
                {alertDetail.handle_notes && (
                  <div className="mt-2">
                    <strong>处理备注:</strong>
                    <div className="text-muted">{alertDetail.handle_notes}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
