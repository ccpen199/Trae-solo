import React, { useEffect, useState } from 'react';
import api from '../utils/api';

function Audit() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ action: '', resource_type: '' });
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadLogs();
  }, [filters, page]);

  const loadLogs = async () => {
    try {
      const res = await api.get('/audit/logs', { params: { ...filters, page, pageSize: 50 } });
      setLogs(res.data.list);
    } catch (err) {
      console.error('加载审计日志失败', err);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">🔍 审计日志</h2>
        </div>

        <div className="filter-bar">
          <div className="filter-item">
            <label>操作类型：</label>
            <select className="form-select" value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })}>
              <option value="">全部</option>
              <option value="create">创建</option>
              <option value="update">更新</option>
              <option value="delete">删除</option>
              <option value="approve">审批</option>
              <option value="execute">执行</option>
            </select>
          </div>
          <div className="filter-item">
            <label>资源类型：</label>
            <select className="form-select" value={filters.resource_type} onChange={(e) => setFilters({ ...filters, resource_type: e.target.value })}>
              <option value="">全部</option>
              <option value="application">应用</option>
              <option value="change_order">变更单</option>
              <option value="execution_task">执行任务</option>
              <option value="environment">环境</option>
              <option value="api_key">API密钥</option>
            </select>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>操作人</th>
              <th>动作</th>
              <th>资源类型</th>
              <th>资源ID</th>
              <th>IP地址</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td>{log.created_at}</td>
                <td>{log.user_name}</td>
                <td>{log.action}</td>
                <td>{log.resource_type}</td>
                <td>{log.resource_id}</td>
                <td>{log.ip_address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Audit;
