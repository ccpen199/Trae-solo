import { useEffect, useState } from 'react';
import api from '../utils/api';
import { WorkbenchAlert } from '../types';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const [alerts, setAlerts] = useState<WorkbenchAlert[]>([]);
  const [stats, setStats] = useState({
    totalEmails: 0,
    sentToday: 0,
    pendingApproval: 0,
    totalCustomers: 0,
  });
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [alertsRes, emailsRes, customersRes] = await Promise.all([
        api.get('/alerts'),
        api.get('/email-generations?pageSize=100'),
        api.get('/customers?pageSize=100'),
      ]);

      setAlerts(alertsRes.data);
      
      const emails = emailsRes.data.data || [];
      const customers = customersRes.data.data || [];
      
      const today = new Date().toDateString();
      const sentToday = emails.filter(
        (e: any) => e.status === 'sent' && new Date(e.created_at).toDateString() === today
      ).length;
      const pendingApproval = emails.filter(
        (e: any) => e.status === 'validated' || e.status === 'draft'
      ).length;

      setStats({
        totalEmails: emails.length,
        sentToday,
        pendingApproval,
        totalCustomers: customers.length,
      });
    } catch (error) {
      console.error('Load dashboard error:', error);
    }
  };

  const handleCloseAlert = async (alertId: number) => {
    try {
      await api.post(`/alerts/${alertId}/close`, { reason: '已处理' });
      loadData();
    } catch (error) {
      console.error('Close alert error:', error);
    }
  };

  const severityLabels: Record<string, string> = {
    critical: '严重',
    warning: '警告',
    info: '提示',
  };

  return (
    <div>
      <h1 className="page-title">工作台</h1>
      
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="card stat-card">
          <div className="stat-value">{stats.totalCustomers}</div>
          <div className="stat-label">客户总数</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{stats.totalEmails}</div>
          <div className="stat-label">邮件总数</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: stats.sentToday > 0 ? 'var(--success-color)' : undefined }}>
            {stats.sentToday}
          </div>
          <div className="stat-label">今日发送</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 16, fontSize: 16 }}>待处理告警</h2>
        {alerts.length === 0 ? (
          <div className="loading">暂无待处理告警</div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className={`alert-card alert-${alert.severity}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span className={`status-badge status-${alert.severity}`}>
                      {severityLabels[alert.severity]}
                    </span>
                    <strong>{alert.title}</strong>
                  </div>
                  <p style={{ color: '#666', marginBottom: 8 }}>{alert.description}</p>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    <span style={{ marginRight: 16 }}>责任人: {alert.responsible_role === user?.roleName ? '你' : alert.responsible_role}</span>
                    <span>建议: {alert.suggested_action}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                    关闭依据: {alert.closing_criteria}
                  </div>
                </div>
                <button
                  className="btn btn-default btn-sm"
                  onClick={() => handleCloseAlert(alert.id)}
                >
                  关闭
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
