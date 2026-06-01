import React, { useState, useEffect } from 'react';

function Audits() {
  const [activeTab, setActiveTab] = useState('alerts');
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(function() {
    setLoading(true);
    if (activeTab === 'alerts') {
      fetch('/api/audit/alerts')
        .then(function(res) { return res.json(); })
        .then(function(data) { setAlerts(data); setLoading(false); })
        .catch(function() { setLoading(false); });
    } else if (activeTab === 'logs') {
      fetch('/api/audit/logs')
        .then(function(res) { return res.json(); })
        .then(function(data) { setLogs(data); setLoading(false); })
        .catch(function() { setLoading(false); });
    } else if (activeTab === 'permissions') {
      fetch('/api/audit/permissions')
        .then(function(res) { return res.json(); })
        .then(function(data) { setPermissions(data); setLoading(false); })
        .catch(function() { setLoading(false); });
    }
  }, [activeTab]);

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>🔍 权限审计</h1>
        <p>告警管理、操作日志、权限配置</p>
      </div>

      <div className="tabs">
        <div className={'tab ' + (activeTab === 'alerts' ? 'active' : '')} onClick={function() { setActiveTab('alerts'); }}>
          ⚠️ 告警记录
        </div>
        <div className={'tab ' + (activeTab === 'logs' ? 'active' : '')} onClick={function() { setActiveTab('logs'); }}>
          📋 操作日志
        </div>
        <div className={'tab ' + (activeTab === 'permissions' ? 'active' : '')} onClick={function() { setActiveTab('permissions'); }}>
          🔑 权限配置
        </div>
      </div>

      <div className="card">
        {activeTab === 'alerts' && (
          <>
            <div className="card-header">
              <h3>告警列表</h3>
            </div>
            {alerts.length === 0 ? (
              <div className="empty-state">暂无告警记录</div>
            ) : (
              alerts.map(function(alert) {
                return (
                  <div key={alert.id} className={'alert-item ' + alert.level} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <strong>{alert.message}</strong>
                          <span className={'status-badge status-' + alert.level}>
                            {alert.level === 'high' ? '高危' : alert.level === 'medium' ? '中危' : '低危'}
                          </span>
                          <span className={'status-badge status-' + (alert.status === 'open' ? 'pending' : 'success')}>
                            {alert.status === 'open' ? '待处理' : '已处理'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                          {alert.app_name} | {alert.type} | {alert.created_at}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {activeTab === 'logs' && (
          <>
            <div className="card-header">
              <h3>操作日志</h3>
            </div>
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>用户</th>
                  <th>操作</th>
                  <th>资源类型</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(function(log) {
                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: '12px' }}>{log.created_at}</td>
                      <td><span className="tag">{log.user_id}</span></td>
                      <td>{log.action}</td>
                      <td>{log.resource_type}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {activeTab === 'permissions' && (
          <>
            <div className="card-header">
              <h3>权限配置</h3>
            </div>
            <table>
              <thead>
                <tr>
                  <th>用户</th>
                  <th>应用</th>
                  <th>角色</th>
                  <th>授权时间</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map(function(p) {
                  return (
                    <tr key={p.id}>
                      <td><span className="tag">{p.user_id}</span></td>
                      <td>{p.app_name || '全部应用'}</td>
                      <td>
                        <span className={'status-badge ' + (p.role === 'admin' ? 'status-high' : p.role === 'owner' ? 'status-medium' : 'status-active')}>
                          {p.role}
                        </span>
                      </td>
                      <td>{p.created_at}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

export default Audits;
