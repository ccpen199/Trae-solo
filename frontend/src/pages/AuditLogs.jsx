import React, { useState, useEffect } from 'react';
import { auditAPI, userAPI } from '../utils/api';

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ user_id: '', resource_type: '', action: '' });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const [logRes, userRes] = await Promise.all([
        auditAPI.list(filters),
        userAPI.list().catch(() => ({ data: [] }))
      ]);
      setLogs(logRes.data);
      setUsers(userRes.data || []);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div>
      <div className="filter-bar">
        <select value={filters.user_id} onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}>
          <option value="">全部用户</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={filters.resource_type} onChange={(e) => setFilters({ ...filters, resource_type: e.target.value })}>
          <option value="">全部资源类型</option>
          <option value="application">应用</option>
          <option value="config_version">配置版本</option>
          <option value="task">执行任务</option>
          <option value="change_order">变更单</option>
          <option value="alert">告警</option>
          <option value="user">用户</option>
        </select>
        <select value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })}>
          <option value="">全部动作</option>
          <option value="create">创建</option>
          <option value="update">更新</option>
          <option value="delete">删除</option>
          <option value="approve">审批</option>
          <option value="execute">执行</option>
        </select>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>时间</th>
              <th>用户</th>
              <th>动作</th>
              <th>资源类型</th>
              <th>详情</th>
              <th>IP地址</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state">暂无审计日志</div></td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: '12px' }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td>{log.user_name}</td>
                  <td><ActionBadge action={log.action} /></td>
                  <td><ResourceBadge type={log.resource_type} /></td>
                  <td style={{ fontSize: '12px', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tryParseDetails(log.details)}
                  </td>
                  <td style={{ fontSize: '12px' }}>{log.ip_address || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const tryParseDetails = (details) => {
  try {
    const parsed = JSON.parse(details);
    return typeof parsed === 'object' ? JSON.stringify(parsed) : details;
  } catch {
    return details;
  }
};

const ActionBadge = ({ action }) => {
  let color = 'badge-default';
  if (action.includes('create')) color = 'badge-success';
  else if (action.includes('update')) color = 'badge-info';
  else if (action.includes('delete')) color = 'badge-error';
  else if (action.includes('approve')) color = 'badge-success';
  else if (action.includes('execute')) color = 'badge-warning';
  
  return <span className={`badge ${color}`}>{action}</span>;
};

const ResourceBadge = ({ type }) => {
  const map = {
    application: '应用',
    config_version: '配置版本',
    task: '任务',
    change_order: '变更单',
    alert: '告警',
    user: '用户',
    auth: '认证',
    permission: '权限'
  };
  return <span className="badge badge-default">{map[type] || type}</span>;
};

export default AuditLogs;
