import React, { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statLabel: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'white',
  },
  filterInput: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    fontWeight: '600',
    fontSize: '13px',
    color: '#666',
    borderBottom: '1px solid #e5e5e5',
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid #e5e5e5',
    fontSize: '14px',
    color: '#333',
  },
  actionBadge: (action) => ({
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: getActionColor(action).bg,
    color: getActionColor(action).text,
  }),
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    marginTop: '20px',
  },
  pageButton: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  pageInfo: {
    fontSize: '14px',
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  detailModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  detailContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  detailTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#333',
  },
  detailRow: {
    display: 'flex',
    marginBottom: '12px',
  },
  detailLabel: {
    width: '100px',
    fontSize: '14px',
    color: '#666',
    flexShrink: 0,
  },
  detailValue: {
    flex: 1,
    fontSize: '14px',
    color: '#333',
  },
  detailJson: {
    backgroundColor: '#f8f9fa',
    padding: '12px',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '12px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  closeButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

const getActionColor = (action) => {
  const colors = {
    LOGIN: { bg: '#d4edda', text: '#155724' },
    REGISTER: { bg: '#d4edda', text: '#155724' },
    CREATE_REPOSITORY: { bg: '#cce5ff', text: '#004085' },
    APPROVE_REPOSITORY: { bg: '#d4edda', text: '#155724' },
    REJECT_REPOSITORY: { bg: '#f8d7da', text: '#721c24' },
    CREATE_MERGE_REQUEST: { bg: '#cce5ff', text: '#004085' },
    APPROVE_MR: { bg: '#d4edda', text: '#155724' },
    REJECT_MR: { bg: '#f8d7da', text: '#721c24' },
    MERGE_MR: { bg: '#d4edda', text: '#155724' },
    CREATE_PIPELINE: { bg: '#cce5ff', text: '#004085' },
    DEPLOY: { bg: '#d4edda', text: '#155724' },
    ROLLBACK: { bg: '#ffc107', text: '#856404' },
  };
  return colors[action] || { bg: '#e2e3e5', text: '#383d41' };
};

const Audit = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntityType, setFilterEntityType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const { hasPermission } = useAuth();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filterAction) {
        params.action = filterAction;
      }
      if (filterEntityType) {
        params.entity_type = filterEntityType;
      }
      const response = await auditAPI.getAll(params);
      setLogs(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await auditAPI.getStats({});
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch audit stats:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filterAction, filterEntityType, page]);

  const formatDetails = (details) => {
    if (!details) return '-';
    try {
      const parsed = typeof details === 'string' ? JSON.parse(details) : details;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return details;
    }
  };

  if (loading && logs.length === 0) {
    return <div>加载中...</div>;
  }

  return (
    <div style={styles.container}>
      {stats && (
        <div style={styles.stats}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>按操作类型</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {stats.by_action?.slice(0, 5).map((item, index) => (
                <span key={index} style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}>
                  {item.action}: {item.count}
                </span>
              ))}
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>按实体类型</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {stats.by_entity_type?.map((item, index) => (
                <span key={index} style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}>
                  {item.entity_type}: {item.count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={styles.filters}>
        <select
          style={styles.filterSelect}
          value={filterAction}
          onChange={(e) => {
            setFilterAction(e.target.value);
            setPage(1);
          }}
        >
          <option value="">全部操作</option>
          <option value="LOGIN">登录</option>
          <option value="REGISTER">注册</option>
          <option value="CREATE_REPOSITORY">创建仓库</option>
          <option value="CREATE_MERGE_REQUEST">创建MR</option>
          <option value="APPROVE_MR">批准MR</option>
          <option value="MERGE_MR">合并MR</option>
          <option value="DEPLOY">部署</option>
          <option value="ROLLBACK">回滚</option>
        </select>
        <select
          style={styles.filterSelect}
          value={filterEntityType}
          onChange={(e) => {
            setFilterEntityType(e.target.value);
            setPage(1);
          }}
        >
          <option value="">全部实体</option>
          <option value="USER">用户</option>
          <option value="REPOSITORY">仓库</option>
          <option value="MERGE_REQUEST">合并请求</option>
          <option value="PIPELINE">流水线</option>
          <option value="DEPLOYMENT">部署</option>
        </select>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>操作</th>
            <th style={styles.th}>操作者</th>
            <th style={styles.th}>实体类型</th>
            <th style={styles.th}>实体ID</th>
            <th style={styles.th}>时间</th>
            <th style={styles.th}>详情</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td style={styles.td}>
                <span style={styles.actionBadge(log.action)}>
                  {log.action}
                </span>
              </td>
              <td style={styles.td}>{log.actor_name || log.actor_id}</td>
              <td style={styles.td}>{log.entity_type}</td>
              <td style={styles.td}>
                <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                  {log.entity_id?.substring(0, 12)}...
                </span>
              </td>
              <td style={styles.td}>
                {new Date(log.created_at * 1000).toLocaleString()}
              </td>
              <td style={styles.td}>
                <button
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                  onClick={() => setSelectedLog(log)}
                >
                  查看
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {logs.length === 0 && (
        <div style={styles.empty}>
          暂无审计日志
        </div>
      )}

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={styles.pageButton}
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </button>
          <span style={styles.pageInfo}>
            第 {page} 页 / 共 {totalPages} 页
          </span>
          <button
            style={styles.pageButton}
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </button>
        </div>
      )}

      {selectedLog && (
        <div style={styles.detailModal}>
          <div style={styles.detailContent}>
            <div style={{ position: 'relative' }}>
              <button
                style={styles.closeButton}
                onClick={() => setSelectedLog(null)}
              >
                关闭
              </button>
              <h2 style={styles.detailTitle}>审计日志详情</h2>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>操作:</span>
              <span style={styles.detailValue}>
                <span style={styles.actionBadge(selectedLog.action)}>
                  {selectedLog.action}
                </span>
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>操作者:</span>
              <span style={styles.detailValue}>
                {selectedLog.actor_name || selectedLog.actor_id}
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>实体类型:</span>
              <span style={styles.detailValue}>{selectedLog.entity_type}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>实体ID:</span>
              <span style={{ ...styles.detailValue, fontFamily: 'monospace' }}>
                {selectedLog.entity_id}
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>时间:</span>
              <span style={styles.detailValue}>
                {new Date(selectedLog.created_at * 1000).toLocaleString()}
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>详情:</span>
            </div>
            <div style={styles.detailJson}>
              {formatDetails(selectedLog.details)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Audit;
