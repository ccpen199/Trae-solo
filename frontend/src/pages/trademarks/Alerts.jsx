import React, { useState, useEffect } from 'react';
import api from '../../api';

export default function TrademarkAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/trademarks/alerts/list');
      setAlerts(response.data.data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    return level === 'high' ? '#f5222d' : level === 'medium' ? '#faad14' : '#52c41a';
  };

  const highRisk = alerts.filter(a => a.risk_level === 'high');
  const mediumRisk = alerts.filter(a => a.risk_level === 'medium');

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>加载中...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.statsRow}>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #f5222d' }}>
          <div style={styles.statValue}>{highRisk.length}</div>
          <div style={styles.statLabel}>🔴 高风险商标</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #faad14' }}>
          <div style={styles.statValue}>{mediumRisk.length}</div>
          <div style={styles.statLabel}>🟡 中风险商标</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #52c41a' }}>
          <div style={styles.statValue}>{alerts.length - highRisk.length - mediumRisk.length}</div>
          <div style={styles.statLabel}>🟢 低风险商标</div>
        </div>
      </div>

      <div style={styles.alertCard}>
        <h3 style={styles.cardTitle}>⚠️ 风险预警列表</h3>
        <p style={styles.cardDesc}>系统实时监控商标状态，发现近似申请或状态异常将及时预警</p>

        <div style={styles.alertList}>
          {alerts.map((alert) => (
            <div key={alert.id} style={styles.alertItem}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: getRiskColor(alert.risk_level) + '15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0
              }}>
                {alert.risk_level === 'high' ? '🔴' : alert.risk_level === 'medium' ? '🟡' : '🟢'}
              </div>
              <div style={{ flex: 1, marginLeft: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '600' }}>{alert.trademark_name}</span>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    background: getRiskColor(alert.risk_level) + '20',
                    color: getRiskColor(alert.risk_level)
                  }}>
                    风险评分 {alert.risk_score}
                  </span>
                  <span style={{ fontSize: '12px', color: '#8c8c8c' }}>{alert.category}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#595959', marginBottom: '6px' }}>
                  {alert.registration_number || alert.application_number || '未申请'} · {alert.risk_desc}
                </div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  申请人：{alert.owner || '-'} · 代理人：{alert.attorney || '-'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: '#f0f0f0',
                  fontSize: '12px',
                  color: '#595959'
                }}>
                  {alert.status === 'registered' ? '已注册' : alert.status === 'examination' ? '审查中' : alert.status === 'pending' ? '待提交' : '已驳回'}
                </div>
                <div style={{ fontSize: '11px', color: '#bfbfbf', marginTop: '8px' }}>
                  {alert.application_date || '-'}
                </div>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
              🎉 暂无风险预警
            </div>
          )}
        </div>
      </div>

      <div style={styles.tipsCard}>
        <h4 style={{ margin: '0 0 12px 0' }}>💡 风险应对建议</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#595959', fontSize: '14px', lineHeight: '2' }}>
          <li><strong>高风险商标：</strong>建议修改商标名称或设计，避免注册失败</li>
          <li><strong>中风险商标：</strong>可考虑购买在先商标或调整类别策略</li>
          <li><strong>近似检测：</strong>系统每日自动检索，发现新近似商标及时通知</li>
          <li><strong>状态监控：</strong>实时监控申请进度，异常状态第一时间预警</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  statCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#262626'
  },
  statLabel: {
    fontSize: '13px',
    color: '#8c8c8c',
    marginTop: '4px'
  },
  alertCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  cardTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '600'
  },
  cardDesc: {
    margin: '0 0 20px 0',
    fontSize: '13px',
    color: '#8c8c8c'
  },
  alertList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  alertItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    background: '#fafafa',
    borderRadius: '10px'
  },
  tipsCard: {
    background: '#e6f7ff',
    borderRadius: '12px',
    padding: '20px 24px',
    border: '1px solid #91d5ff'
  }
};
