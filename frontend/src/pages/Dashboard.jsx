import React, { useState, useEffect } from 'react';
import { reportAPI, appointmentAPI, packageAPI } from '../api.js';

function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, aptRes, alertsRes] = await Promise.all([
        reportAPI.getStats(),
        appointmentAPI.getAll(),
        user.role !== 'customer' ? reportAPI.getAlerts() : { data: [] }
      ]);
      setStats(statsRes.data);
      setRecentAppointments(aptRes.data.slice(0, 5));
      setAlerts(alertsRes.data || []);
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  return (
    <div>
      <h2 className="page-title">首页仪表板</h2>
      
      {user.role !== 'customer' && stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.today_appointments}</div>
            <div className="stat-label">今日预约</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.pending_reports}</div>
            <div className="stat-label">待处理报告</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.abnormal_alerts}</div>
            <div className="stat-label">异常提醒</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">¥{Number(stats.revenue).toFixed(0)}</div>
            <div className="stat-label">营业收入</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <h3 className="mb-4">最近预约</h3>
          <table>
            <thead>
              <tr>
                <th>预约号</th>
                <th>客户</th>
                <th>套餐</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {recentAppointments.map(apt => (
                <tr key={apt.id}>
                  <td>{apt.appointment_no}</td>
                  <td>{apt.customer_name}</td>
                  <td>{apt.package_name}</td>
                  <td>
                    <span className={`badge status-${apt.status}`}>
                      {getStatusText(apt.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {user.role !== 'customer' && (
          <div className="card">
            <h3 className="mb-4">异常提醒</h3>
            {alerts.length === 0 ? (
              <p className="text-gray">暂无异常提醒</p>
            ) : (
              alerts.slice(0, 5).map(alert => (
                <div key={alert.id} className="check-item abnormal">
                  <div className="check-item-header">
                    <div className="check-item-name">{alert.customer_name}</div>
                    <div className="check-item-range">{alert.item_name}: {alert.message}</div>
                  </div>
                  <span className={`badge badge-${alert.alert_level === 'high' ? 'danger' : 'warning'}`}>
                    {alert.alert_level}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusText(status) {
  const texts = {
    pending: '待确认',
    confirmed: '已确认',
    checked_in: '已签到',
    completed: '已完成',
    cancelled: '已取消',
    no_show: '爽约',
    refunded: '已退款'
  };
  return texts[status] || status;
}

export default Dashboard;
