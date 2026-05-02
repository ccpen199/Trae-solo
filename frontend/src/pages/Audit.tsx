import { useEffect, useState } from 'react';
import { auditApi } from '../services/api';
import type { AuditLog } from '../types';

const getOperationLabel = (operation: string) => {
  const lower = operation.toLowerCase();
  if (lower.includes('create') || lower.includes('add')) return '创建';
  if (lower.includes('update') || lower.includes('edit')) return '更新';
  if (lower.includes('delete') || lower.includes('remove')) return '删除';
  if (lower.includes('deploy')) return '部署';
  if (lower.includes('probe')) return '探测';
  return operation
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
};

export function Audit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterResource, setFilterResource] = useState('ALL');
  const [filterOperation, setFilterOperation] = useState('ALL');

  useEffect(() => {
    loadAuditLogs();
    const interval = setInterval(loadAuditLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAuditLogs = async () => {
    try {
      const data = await auditApi.getAll();
      setLogs(data);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const resourceTypes = ['ALL', ...Array.from(new Set(logs.map((l) => l.resource_type)))];
  const operationTypes = ['ALL', ...Array.from(new Set(logs.map((l) => l.operation_type)))];

  const filteredLogs = logs.filter((log) => {
    if (filterResource !== 'ALL' && log.resource_type !== filterResource) return false;
    if (filterOperation !== 'ALL' && log.operation_type !== filterOperation) return false;
    return true;
  });

  const getOperationIcon = (operation: string) => {
    const lower = operation.toLowerCase();
    if (lower.includes('create') || lower.includes('add')) return '➕';
    if (lower.includes('update') || lower.includes('edit')) return '✏️';
    if (lower.includes('delete') || lower.includes('remove')) return '🗑️';
    if (lower.includes('deploy')) return '🚀';
    if (lower.includes('probe')) return '🔍';
    return '📝';
  };

  const getOperationColor = (operation: string) => {
    const lower = operation.toLowerCase();
    if (lower.includes('create') || lower.includes('add')) return '#10b981';
    if (lower.includes('update') || lower.includes('edit')) return '#3b82f6';
    if (lower.includes('delete') || lower.includes('remove')) return '#ef4444';
    if (lower.includes('deploy')) return '#8b5cf6';
    if (lower.includes('probe')) return '#f59e0b';
    return '#6b7280';
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>正在加载审计日志...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>审计日志</h1>
          <p style={styles.subtitle}>所有配置变更的完整审计追踪</p>
        </div>
        <div style={styles.headerInfo}>
          <span style={styles.logCount}>
            📋 总计：{logs.length} 条记录
          </span>
        </div>
      </div>

      <div style={styles.filters}>
        <select
          style={styles.filterSelect}
          value={filterResource}
          onChange={(e) => setFilterResource(e.target.value)}
        >
          {resourceTypes.map((type) => (
            <option key={type} value={type}>
              {type === 'ALL' ? '全部资源' : type}
            </option>
          ))}
        </select>

        <select
          style={styles.filterSelect}
          value={filterOperation}
          onChange={(e) => setFilterOperation(e.target.value)}
        >
          {operationTypes.map((type) => (
            <option key={type} value={type}>
              {type === 'ALL' ? '全部操作' : getOperationLabel(type)}
            </option>
          ))}
        </select>

        <button style={styles.refreshButton} onClick={loadAuditLogs}>
          🔄 刷新
        </button>
      </div>

      {filteredLogs.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📋</div>
          <h3 style={styles.emptyTitle}>暂无审计日志</h3>
          <p style={styles.emptyText}>
            {logs.length === 0
              ? '暂无审计日志，请开始创建或修改服务。'
              : '没有符合筛选条件的日志记录。'}
          </p>
        </div>
      ) : (
        <div style={styles.timeline}>
          {filteredLogs.map((log, index) => (
            <div key={log.id} style={styles.timelineItem}>
              <div style={styles.timelineConnector}>
                <div
                  style={{
                    ...styles.timelineDot,
                    backgroundColor: getOperationColor(log.operation_type),
                  }}
                >
                  {getOperationIcon(log.operation_type)}
                </div>
                {index < filteredLogs.length - 1 && <div style={styles.timelineLine} />}
              </div>

              <div style={styles.timelineContent}>
                <div style={styles.logHeader}>
                  <div style={styles.logLeft}>
                    <span
                      style={{
                        ...styles.operationBadge,
                        backgroundColor: getOperationColor(log.operation_type) + '20',
                        color: getOperationColor(log.operation_type),
                      }}
                    >
                      {getOperationLabel(log.operation_type)}
                    </span>
                    <span style={styles.resourceType}>{log.resource_type}</span>
                  </div>
                  <span style={styles.timestamp}>
                    {new Date(log.created_at * 1000).toLocaleString()}
                  </span>
                </div>

                <div style={styles.logDetails}>
                  {log.resource_id && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>资源 ID：</span>
                      <span style={styles.detailValue}>{log.resource_id}</span>
                    </div>
                  )}
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>操作者：</span>
                    <span style={styles.detailValue}>{log.actor_id} ({log.actor_type})</span>
                  </div>
                  {log.request_ip && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>IP：</span>
                      <span style={styles.detailValue}>{log.request_ip}</span>
                    </div>
                  )}
                </div>

                {(log.old_value || log.new_value) && (
                  <div style={styles.logChanges}>
                    <details>
                      <summary style={styles.changesSummary}>查看变更</summary>
                      <div style={styles.changesGrid}>
                        {log.old_value && (
                          <div style={styles.changeBlock}>
                            <div style={styles.changeBlockHeader}>
                              <span style={styles.changeBlockLabel}>原值</span>
                              <span style={styles.changeBlockBadgeOld}>-</span>
                            </div>
                            <pre style={styles.changeContent}>
                              {log.old_value}
                            </pre>
                          </div>
                        )}
                        {log.new_value && (
                          <div style={styles.changeBlock}>
                            <div style={styles.changeBlockHeader}>
                              <span style={styles.changeBlockLabel}>新值</span>
                              <span style={styles.changeBlockBadgeNew}>+</span>
                            </div>
                            <pre style={styles.changeContent}>
                              {log.new_value}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
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
  headerInfo: {
    display: 'flex',
    gap: '16px',
  },
  logCount: {
    padding: '8px 16px',
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  filterSelect: {
    padding: '10px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  refreshButton: {
    padding: '10px 20px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
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
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  timelineItem: {
    display: 'flex',
    gap: '20px',
  },
  timelineConnector: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  timelineDot: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  timelineLine: {
    width: '2px',
    flex: 1,
    backgroundColor: '#e5e7eb',
    margin: '8px 0',
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  logLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  operationBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
  },
  resourceType: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: 500,
  },
  timestamp: {
    fontSize: '12px',
    color: '#6b7280',
  },
  logDetails: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '12px',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  detailLabel: {
    fontSize: '12px',
    color: '#6b7280',
  },
  detailValue: {
    fontSize: '12px',
    color: '#1f2937',
    fontWeight: 500,
    fontFamily: 'monospace',
  },
  logChanges: {
    paddingTop: '12px',
    borderTop: '1px solid #f3f4f6',
  },
  changesSummary: {
    fontSize: '12px',
    color: '#3b82f6',
    cursor: 'pointer',
  },
  changesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginTop: '12px',
  },
  changeBlock: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  changeBlockHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
  },
  changeBlockLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#374151',
  },
  changeBlockBadgeOld: {
    padding: '2px 8px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 700,
  },
  changeBlockBadgeNew: {
    padding: '2px 8px',
    backgroundColor: '#d1fae5',
    color: '#059669',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 700,
  },
  changeContent: {
    padding: '12px',
    margin: 0,
    fontSize: '11px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    borderTop: '1px solid #e5e7eb',
  },
};
