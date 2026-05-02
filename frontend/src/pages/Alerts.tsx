import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/app.store';
import { alertApi } from '../services/api';
import type { Alert, AlertSeverity, AlertType } from '../types';

const getSeverityLabel = (severity: AlertSeverity) => {
  switch (severity) {
    case 'EMERGENCY':
      return '紧急';
    case 'CRITICAL':
      return '严重';
    case 'WARNING':
      return '警告';
    case 'INFO':
      return '信息';
    default:
      return severity;
  }
};

export function Alerts() {
  const { alerts, setAlerts, acknowledgeAlert } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<AlertType | 'ALL'>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'ALL'>('ALL');
  const [filterAcknowledged, setFilterAcknowledged] = useState<boolean | 'ALL'>('ALL');

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await alertApi.getAll();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      const success = await alertApi.acknowledge(alertId);
      if (success) {
        acknowledgeAlert(alertId);
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filterType !== 'ALL' && alert.alert_type !== filterType) return false;
    if (filterSeverity !== 'ALL' && alert.severity !== filterSeverity) return false;
    if (filterAcknowledged !== 'ALL' && alert.is_acknowledged !== filterAcknowledged) return false;
    return true;
  });

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'EMERGENCY':
        return '#dc2626';
      case 'CRITICAL':
        return '#ef4444';
      case 'WARNING':
        return '#f59e0b';
      case 'INFO':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getTypeLabel = (type: AlertType) => {
    switch (type) {
      case 'CIRCUIT_BREAKER_TRIGGERED':
        return '熔断器触发';
      case 'RATE_LIMIT_EXCEEDED':
        return '限流超限';
      case 'SERVICE_DOWN':
        return '服务下线';
      case 'AUTH_FAILURE':
        return '鉴权失败';
      case 'CONFIG_CHANGE':
        return '配置变更';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>正在加载告警列表...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>告警中心</h1>
          <p style={styles.subtitle}>系统告警与通知管理</p>
        </div>
        <button style={styles.refreshButton} onClick={loadAlerts}>
          🔄 刷新
        </button>
      </div>

      <div style={styles.filters}>
        <select
          style={styles.filterSelect}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as AlertType | 'ALL')}
        >
          <option value="ALL">全部类型</option>
          <option value="CIRCUIT_BREAKER_TRIGGERED">熔断器触发</option>
          <option value="RATE_LIMIT_EXCEEDED">限流超限</option>
          <option value="SERVICE_DOWN">服务下线</option>
          <option value="AUTH_FAILURE">鉴权失败</option>
          <option value="CONFIG_CHANGE">配置变更</option>
        </select>

        <select
          style={styles.filterSelect}
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as AlertSeverity | 'ALL')}
        >
          <option value="ALL">全部级别</option>
          <option value="EMERGENCY">紧急</option>
          <option value="CRITICAL">严重</option>
          <option value="WARNING">警告</option>
          <option value="INFO">信息</option>
        </select>

        <select
          style={styles.filterSelect}
          value={String(filterAcknowledged)}
          onChange={(e) => {
            const val = e.target.value;
            setFilterAcknowledged(val === 'ALL' ? 'ALL' : val === 'true');
          }}
        >
          <option value="ALL">全部状态</option>
          <option value="false">未确认</option>
          <option value="true">已确认</option>
        </select>
      </div>

      {filteredAlerts.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🔔</div>
          <h3 style={styles.emptyTitle}>暂无告警</h3>
          <p style={styles.emptyText}>
            {alerts.length === 0
              ? '系统中暂无告警，一切运行正常！'
              : '没有符合筛选条件的告警。'}
          </p>
        </div>
      ) : (
        <div style={styles.alertsList}>
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                ...styles.alertCard,
                borderLeftColor: getSeverityColor(alert.severity),
                opacity: alert.is_acknowledged ? 0.6 : 1,
              }}
            >
              <div style={styles.alertHeader}>
                <div style={styles.alertLeft}>
                  <span
                    style={{
                      ...styles.severityBadge,
                      backgroundColor: getSeverityColor(alert.severity) + '20',
                      color: getSeverityColor(alert.severity),
                    }}
                  >
                    {getSeverityLabel(alert.severity)}
                  </span>
                  <span style={styles.typeBadge}>{getTypeLabel(alert.alert_type)}</span>
                  {alert.is_acknowledged && (
                    <span style={styles.acknowledgedBadge}>✓ 已确认</span>
                  )}
                </div>
                <div style={styles.alertRight}>
                  <span style={styles.timestamp}>
                    {new Date(alert.created_at * 1000).toLocaleString()}
                  </span>
                  {!alert.is_acknowledged && (
                    <button
                      style={styles.acknowledgeButton}
                      onClick={() => handleAcknowledge(alert.id)}
                    >
                      确认
                    </button>
                  )}
                </div>
              </div>

              <div style={styles.alertMessage}>
                <strong>{alert.message}</strong>
              </div>

              {alert.metadata && (
                <div style={styles.alertMetadata}>
                  <details>
                    <summary style={styles.metadataSummary}>查看详情</summary>
                    <pre style={styles.metadataContent}>
                      {typeof alert.metadata === 'string'
                        ? alert.metadata
                        : JSON.stringify(alert.metadata, null, 2)}
                    </pre>
                  </details>
                </div>
              )}

              <div style={styles.alertFooter}>
                <span style={styles.metaText}>
                  服务：{alert.service_id || '无'}
                </span>
                {alert.api_id && (
                  <span style={styles.metaText}>API：{alert.api_id}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    fontSize: '18px',
    color: '#6b7280',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
    color: '#1f2937',
  },
  subtitle: {
    margin: '8px 0 0 0',
    fontSize: '14px',
    color: '#6b7280',
  },
  refreshButton: {
    padding: '10px 20px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  filterSelect: {
    padding: '10px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: 600,
    color: '#1f2937',
  },
  emptyText: {
    margin: '0',
    fontSize: '14px',
    color: '#6b7280',
  },
  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    borderLeft: '4px solid',
  },
  alertHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  alertLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  alertRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  severityBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 700,
  },
  typeBadge: {
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
  acknowledgedBadge: {
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    backgroundColor: '#d1fae5',
    color: '#059669',
  },
  timestamp: {
    fontSize: '12px',
    color: '#6b7280',
  },
  acknowledgeButton: {
    padding: '6px 16px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  alertMessage: {
    fontSize: '14px',
    color: '#1f2937',
    marginBottom: '12px',
    lineHeight: 1.5,
  },
  alertMetadata: {
    marginBottom: '12px',
  },
  metadataSummary: {
    fontSize: '12px',
    color: '#3b82f6',
    cursor: 'pointer',
  },
  metadataContent: {
    marginTop: '8px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    fontSize: '12px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  alertFooter: {
    display: 'flex',
    gap: '24px',
    paddingTop: '12px',
    borderTop: '1px solid #f3f4f6',
  },
  metaText: {
    fontSize: '12px',
    color: '#6b7280',
    fontFamily: 'monospace',
  },
};
