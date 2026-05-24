import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';

function OperationLogs({ user }) {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState({ action: '', target_type: '', page: 1 });
  const [actions, setActions] = useState([]);

  useEffect(() => {
    loadActions();
    loadLogs();
  }, [filter]);

  const loadActions = async () => {
    try {
      const res = await api.get('/logs/actions');
      setActions(res.data);
    } catch (err) {
      console.error('加载操作类型失败', err);
    }
  };

  const loadLogs = async () => {
    try {
      const res = await api.get('/logs', { params: filter });
      setLogs(res.data);
    } catch (err) {
      console.error('加载操作日志失败', err);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="row">
          <div>
            <label>操作类型</label>
            <select value={filter.action} onChange={(e) => setFilter({ ...filter, action: e.target.value })}>
              <option value="">全部</option>
              {actions.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label>目标类型</label>
            <select value={filter.target_type} onChange={(e) => setFilter({ ...filter, target_type: e.target.value })}>
              <option value="">全部</option>
              <option value="game">球局</option>
              <option value="venue">场馆</option>
              <option value="user">用户</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>操作人</th>
              <th>操作</th>
              <th>目标</th>
              <th>详情</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td style={{ fontSize: '12px' }}>{log.created_at}</td>
                <td>{log.user_name || '系统'}</td>
                <td><span className="badge info">{log.action}</span></td>
                <td>{log.target_type ? `${log.target_type} #${log.target_id}` : '-'}</td>
                <td style={{ fontSize: '12px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {log.details ? log.details.substring(0, 50) + (log.details.length > 50 ? '...' : '') : '-'}
                </td>
                <td style={{ fontSize: '12px' }}>{log.ip_address || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div style={{ textAlign: 'center', color: '#718096', padding: '40px' }}>
            暂无操作日志
          </div>
        )}
      </div>
    </div>
  );
}

export default OperationLogs;
