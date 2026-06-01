import React, { useState, useEffect } from 'react';

function Applications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/applications')
      .then(res => res.json())
      .then(data => {
        setApps(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>📦 应用管理</h1>
        <p>管理接入平台的所有应用和环境</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>应用列表</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>应用名称</th>
              <th>描述</th>
              <th>负责人</th>
              <th>状态</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {apps.map(function(app) {
              return (
                <tr key={app.id}>
                  <td><strong>{app.name}</strong></td>
                  <td>{app.description || '-'}</td>
                  <td>{app.owner}</td>
                  <td><span className={'status-badge status-' + app.status}>{app.status}</span></td>
                  <td>{app.created_at}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Applications;
