import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import dayjs from 'dayjs';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [filters, setFilters] = useState({
    entity_type: '',
    action_type: '',
    operator_id: ''
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadData();
    loadUsers();
  }, [pagination.page, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      const res = await api.get('/audit-logs', { params });
      setLogs(res.data.data);
      setPagination(p => ({ ...p, total: res.data.pagination.total }));
    } catch (error) {
      console.error('加载审计日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      console.error('加载用户失败:', error);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>审计日志</h1>
      </div>

      <div style={styles.filterBar}>
        <select
          value={filters.entity_type}
          onChange={(e) => setFilters({...filters, entity_type: e.target.value})}
          style={styles.filterSelect}
        >
          <option value="">全部对象类型</option>
          <option value="meeting">会议</option>
          <option value="action_item">行动项</option>
        </select>
        <select
          value={filters.action_type}
          onChange={(e) => setFilters({...filters, action_type: e.target.value})}
          style={styles.filterSelect}
        >
          <option value="">全部操作类型</option>
          <option value="create">创建</option>
          <option value="update">更新</option>
          <option value="delete">删除</option>
          <option value="batch_complete">批量完成</option>
          <option value="batch_cancel">批量取消</option>
          <option value="batch_reassign">批量重分配</option>
          <option value="batch_update_due">批量更新截止</option>
        </select>
        <select
          value={filters.operator_id}
          onChange={(e) => setFilters({...filters, operator_id: e.target.value})}
          style={styles.filterSelect}
        >
          <option value="">全部操作者</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={styles.loading}>加载中...</div>
      ) : logs.length === 0 ? (
        <div style={styles.empty}>暂无审计日志</div>
      ) : (
        <>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.timeCol}>时间</th>
                  <th style={styles.actionCol}>操作</th>
                  <th style={styles.entityCol}>对象</th>
                  <th style={styles.operatorCol}>操作者</th>
                  <th style={styles.reasonCol}>原因</th>
                  <th style={styles.recoveryCol}>恢复路径</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={styles.row}>
                    <td style={styles.timeCell}>
                      {dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}
                    </td>
                    <td>
                      <span style={{
                        ...styles.actionTag,
                        ...getActionStyle(log.action_type)
                      }}>
                        {getActionText(log.action_type)}
                      </span>
                    </td>
                    <td>
                      <span style={styles.entityType}>
                        {log.entity_type === 'meeting' ? '会议' : '行动项'}
                      </span>
                      <div style={styles.entityId}>{log.entity_id.slice(0, 8)}...</div>
                    </td>
                    <td>{log.operator_name}</td>
                    <td style={styles.reasonCell}>{log.reason || '-'}</td>
                    <td style={styles.recoveryCell}>
                      {log.recovery_path ? (
                        <code style={styles.code}>{log.recovery_path}</code>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.pagination}>
            <span style={styles.paginationInfo}>
              共 {pagination.total} 条记录，第 {pagination.page}/{totalPages || 1} 页
            </span>
            <div style={styles.paginationButtons}>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1}
                style={styles.pageBtn}
              >
                上一页
              </button>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= totalPages}
                style={styles.pageBtn}
              >
                下一页
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getActionStyle(actionType) {
  if (actionType === 'create') return { backgroundColor: '#f6ffed', color: '#52c41a' };
  if (actionType === 'update') return { backgroundColor: '#e6f7ff', color: '#1890ff' };
  if (actionType === 'delete') return { backgroundColor: '#fff1f0', color: '#f5222d' };
  return { backgroundColor: '#fff7e6', color: '#fa8c16' };
}

function getActionText(actionType) {
  switch (actionType) {
    case 'create': return '创建';
    case 'update': return '更新';
    case 'delete': return '删除';
    case 'batch_complete': return '批量完成';
    case 'batch_cancel': return '批量取消';
    case 'batch_reassign': return '批量重分配';
    case 'batch_update_due': return '批量更新截止';
    default: return actionType;
  }
}

const styles = {
  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 24, margin: 0, color: '#262626' },
  filterBar: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  filterSelect: { padding: '10px 16px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, minWidth: 140 },
  loading: { textAlign: 'center', padding: 40, color: '#999' },
  empty: { textAlign: 'center', padding: 60, backgroundColor: '#fff', borderRadius: 8, color: '#999' },
  tableContainer: { backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  timeCol: { width: 170 },
  actionCol: { width: 120 },
  entityCol: { width: 140 },
  operatorCol: { width: 120 },
  reasonCol: { width: 200 },
  recoveryCol: { width: 200 },
  row: { borderBottom: '1px solid #f0f0f0' },
  timeCell: { fontFamily: 'monospace', fontSize: 12 },
  actionTag: { padding: '2px 8px', borderRadius: 4, fontSize: 12 },
  entityType: { fontSize: 13, fontWeight: 500, color: '#262626' },
  entityId: { fontSize: 11, color: '#8c8c8c', fontFamily: 'monospace' },
  reasonCell: { maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  recoveryCell: { fontSize: 12 },
  code: { backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: 3 },
  pagination: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, padding: '0 10px' },
  paginationInfo: { fontSize: 14, color: '#666' },
  paginationButtons: { display: 'flex', gap: 8 },
  pageBtn: {
    padding: '8px 16px',
    border: '1px solid #d9d9d9',
    borderRadius: 4,
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: 14
  }
};
