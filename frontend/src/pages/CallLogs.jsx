import React, { useState, useEffect } from 'react';
import { apiService } from '../api.js';

function CallLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await apiService.getCallLogs();
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
        <h1 className="page-title">调用日志</h1>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>API名称</th>
                <th>方法</th>
                <th>请求URL</th>
                <th>响应状态</th>
                <th>耗时(ms)</th>
                <th>关联任务</th>
                <th>调用人</th>
                <th>调用时间</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{log.api_name}</td>
                  <td>{log.method || '-'}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.request_url || '-'}</td>
                  <td>
                    <span className={`badge ${log.response_status && log.response_status >= 400 ? 'badge-failed' : 'badge-completed'}`}>
                      {log.response_status || '-'}
                    </span>
                  </td>
                  <td>{log.duration_ms || '-'}</td>
                  <td>{log.task_no || '-'}</td>
                  <td>{log.caller_name || '-'}</td>
                  <td>{new Date(log.called_at).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan="8" className="empty-state">暂无调用日志</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CallLogs;
