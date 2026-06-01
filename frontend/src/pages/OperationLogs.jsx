import React, { useState, useEffect } from 'react';
import { apiService } from '../api.js';

function OperationLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await apiService.getOperationLogs();
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">操作日志</h1>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>操作人</th>
                <th>操作</th>
                <th>目标类型</th>
                <th>目标ID</th>
                <th>旧值</th>
                <th>新值</th>
                <th>操作时间</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{log.user_name || '-'}</td>
                  <td>{log.operation}</td>
                  <td>{log.target_type}</td>
                  <td>{log.target_id}</td>
                  <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.old_value || '-'}</td>
                  <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.new_value || '-'}</td>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan="7" className="empty-state">暂无操作日志</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default OperationLogs;
