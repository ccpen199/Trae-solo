import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function AuditPage() {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [positionChanges, setPositionChanges] = useState([]);
  const [activeTab, setActiveTab] = useState('audit');
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({
    action: '',
    riskLevel: '',
    startDate: '',
    endDate: ''
  });
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab, pagination.page, pagination.pageSize]);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('pageSize', pagination.pageSize);

      if (activeTab === 'audit') {
        if (filters.action) params.append('action', filters.action);
        if (filters.riskLevel) params.append('riskLevel', filters.riskLevel);
        
        const response = await api.get(`/audit/logs?${params.toString()}`);
        if (response.data.success) {
          setAuditLogs(response.data.data.list || []);
          setPagination(prev => ({
            ...prev,
            total: response.data.data.pagination?.total || 0
          }));
        }
      } else if (activeTab === 'login') {
        const response = await api.get(`/audit/login-logs?${params.toString()}`);
        if (response.data.success) {
          setLoginLogs(response.data.data.list || []);
          setPagination(prev => ({
            ...prev,
            total: response.data.data.pagination?.total || 0
          }));
        }
      } else if (activeTab === 'position') {
        const response = await api.get(`/audit/position-changes?${params.toString()}`);
        if (response.data.success) {
          setPositionChanges(response.data.data.list || []);
          setPagination(prev => ({
            ...prev,
            total: response.data.data.pagination?.total || 0
          }));
        }
      }
    } catch (error) {
      console.error('Fetch audit data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeClass = (riskLevel) => {
    switch (riskLevel) {
      case 'high':
      case 'critical':
        return 'status-badge high';
      case 'medium':
        return 'status-badge medium';
      default:
        return 'status-badge low';
    }
  };

  const getLoginResultClass = (result) => {
    return result === 'success' ? 'status-badge success' : 'status-badge failed';
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleString('zh-CN');
  };

  const handleExport = async (format) => {
    try {
      const response = await api.get(`/audit/export?format=${format}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-export-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      showAlert('success', `导出 ${format.toUpperCase()} 成功`);
    } catch (error) {
      console.error('Export error:', error);
      showAlert('error', '导出失败');
    }
  };

  const handleSearch = () => {
    setPagination(p => ({ ...p, page: 1 }));
    fetchData();
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>审计中心</h1>
        <p>查看系统操作审计记录、登录日志和岗位变动记录</p>
      </div>
      <div className="page-content">
        {alert && (
          <div className={`alert alert-${alert.type}`}>
            {alert.message}
          </div>
        )}

        <div className="tabs" style={{ marginBottom: '20px' }}>
          <button 
            className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => { setActiveTab('audit'); setPagination(p => ({ ...p, page: 1 })); }}
          >
            操作审计
          </button>
          <button 
            className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => { setActiveTab('login'); setPagination(p => ({ ...p, page: 1 })); }}
          >
            登录日志
          </button>
          <button 
            className={`tab-btn ${activeTab === 'position' ? 'active' : ''}`}
            onClick={() => { setActiveTab('position'); setPagination(p => ({ ...p, page: 1 })); }}
          >
            岗位变动
          </button>
          {hasPermission('audit:export') && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button className="filter-btn" onClick={() => handleExport('json')}>导出 JSON</button>
              <button className="filter-btn" onClick={() => handleExport('csv')}>导出 CSV</button>
            </div>
          )}
        </div>

        {activeTab === 'audit' && (
          <div className="filter-bar">
            <input
              type="text"
              className="filter-input"
              placeholder="搜索操作类型..."
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <select
              className="filter-select"
              value={filters.riskLevel}
              onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
            >
              <option value="">全部风险等级</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="critical">严重</option>
            </select>
            <button className="filter-btn" onClick={handleSearch}>搜索</button>
          </div>
        )}

        <div className="section">
          <h3 className="section-title">
            {activeTab === 'audit' && '操作审计日志'}
            {activeTab === 'login' && '登录日志'}
            {activeTab === 'position' && '岗位变动记录'}
            <span style={{ fontSize: '14px', color: '#999', marginLeft: '8px' }}>
              (共 {pagination.total} 条)
            </span>
          </h3>

          {loading ? (
            <div className="empty-state">
              <div className="loading-spinner-large"></div>
              <p style={{ marginTop: '16px' }}>加载中...</p>
            </div>
          ) : (
            <>
              {activeTab === 'audit' && (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>操作时间</th>
                        <th>操作类型</th>
                        <th>操作用户</th>
                        <th>IP地址</th>
                        <th>风险等级</th>
                        <th>指纹存证</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.length > 0 ? auditLogs.map((log, index) => (
                        <tr key={log.id || index}>
                          <td>{formatTime(log.created_at)}</td>
                          <td><strong>{log.action}</strong></td>
                          <td>{log.username || log.user_id || 'system'}</td>
                          <td>{log.ip_address || '-'}</td>
                          <td>
                            <span className={getRiskBadgeClass(log.risk_level)}>
                              {log.risk_level}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', fontFamily: 'monospace', color: '#999' }}>
                            {log.fingerprint ? `${log.fingerprint.substring(0, 16)}...` : '-'}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                            暂无审计记录
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'login' && (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>登录时间</th>
                        <th>用户</th>
                        <th>登录结果</th>
                        <th>IP地址</th>
                        <th>设备信息</th>
                        <th>MFA验证</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginLogs.length > 0 ? loginLogs.map((log, index) => (
                        <tr key={log.id || index}>
                          <td>{formatTime(log.created_at)}</td>
                          <td>{log.username || log.real_name || '-'}</td>
                          <td>
                            <span className={getLoginResultClass(log.login_result)}>
                              {log.login_result === 'success' ? '成功' : '失败'}
                            </span>
                          </td>
                          <td>{log.ip_address || '-'}</td>
                          <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {log.user_agent || '-'}
                          </td>
                          <td>
                            {log.mfa_type ? (
                              <span className="status-badge medium">
                                {log.mfa_type}
                              </span>
                            ) : (
                              <span className="status-badge low">未启用</span>
                            )}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                            暂无登录记录
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'position' && (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>变更时间</th>
                        <th>用户</th>
                        <th>原组织</th>
                        <th>新组织</th>
                        <th>操作人</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positionChanges.length > 0 ? positionChanges.map((change, index) => (
                        <tr key={change.id || index}>
                          <td>{formatTime(change.createdAt || change.created_at)}</td>
                          <td>{change.realName || change.username || change.user_id || '-'}</td>
                          <td>{change.oldOrganizationName || change.old_org_name || '-'}</td>
                          <td>{change.newOrganizationName || change.new_org_name || '-'}</td>
                          <td>{change.changedByName || change.changed_by || '-'}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                            暂无岗位变动记录
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {totalPages > 1 && (
                <div className="pagination" style={{ marginTop: '16px' }}>
                  <button
                    className="pagination-btn"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  >
                    上一页
                  </button>
                  <span className="pagination-info">
                    第 {pagination.page} / {totalPages} 页，共 {pagination.total} 条
                  </span>
                  <button
                    className="pagination-btn"
                    disabled={pagination.page >= totalPages}
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="alert alert-info">
          <strong>金融级合规审计</strong>
          <p style={{ marginTop: '8px', fontSize: '13px' }}>
            所有操作记录永久存档，每条记录包含：
          </p>
          <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '13px' }}>
            <li><strong>指纹存证</strong>：每条记录生成 SHA256 哈希指纹</li>
            <li><strong>风险分级</strong>：自动判定操作风险等级（低/中/高/严重）</li>
            <li><strong>全量追踪</strong>：记录操作人、IP地址、时间戳、详细数据</li>
            <li><strong>导出支持</strong>：支持 JSON/CSV 格式导出审计报告</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AuditPage;
