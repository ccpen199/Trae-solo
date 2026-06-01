import React, { useEffect, useState } from 'react';
import { apiGet, apiPatch } from '../api.js';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const data = await apiGet('/alerts');
    setAlerts(data);
  }

  async function handleStatus(id, status) {
    await apiPatch(`/alerts/${id}`, { status });
    loadData();
  }

  return (
    <div>
      <div className="header">
        <h1>预警管理</h1>
      </div>

      <div className="card">
        {alerts.filter(a => a.status === 'pending').length > 0 && (
          <div className="alert-box alert-danger">
            <strong>注意：</strong> 有 {alerts.filter(a => a.status === 'pending').length} 条预警待处理
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>批次</th>
              <th>类型</th>
              <th>消息</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>暂无预警</td></tr>
            ) : alerts.map(a => (
              <tr key={a.id} style={a.status === 'pending' ? { background: '#fff3cd' } : {}}>
                <td>{a.created_at}</td>
                <td>{a.batch_no}</td>
                <td><span className="badge badge-warning">{a.type === 'limit_violation' ? '超限' : a.type}</span></td>
                <td>{a.message}</td>
                <td>
                  <span className={`badge ${a.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>
                    {a.status === 'pending' ? '待处理' : '已处理'}
                  </span>
                </td>
                <td>
                  {a.status === 'pending' && (
                    <button className="btn btn-success btn-sm" onClick={() => handleStatus(a.id, 'resolved')}>
                      标记已处理
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
