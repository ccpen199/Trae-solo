import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function ProfilePage() {
  const { user, refreshAuth, hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loginLogs, setLoginLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    fetchLoginLogs();
  }, [pagination.page, pagination.pageSize]);

  const fetchLoginLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('pageSize', pagination.pageSize);

      const response = await api.get(`/audit/login-logs?${params.toString()}`);
      if (response.data.success) {
        const allLogs = response.data.data.logs || [];
        const myLogs = allLogs.filter(log => log.user_id === user?.id);
        setLoginLogs(myLogs);
        setPagination(prev => ({
          ...prev,
          total: myLogs.length
        }));
      }
    } catch (error) {
      console.error('Fetch login logs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLoginResultClass = (result) => {
    return result === 'success' ? 'status-badge success' : 'status-badge failed';
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleString('zh-CN');
  };

  const getUserRoleDisplay = () => {
    if (!user?.roles || user.roles.length === 0) return '-';
    const roleMap = {
      'organization_admin': '组织管理员',
      'employee': '普通员工',
      'security_auditor': '安全审计员',
      'external_app_manager': '应用管理员'
    };
    return user.roles.map(r => roleMap[r.name] || r.name).join(', ');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return 'status-badge success';
      case 'pending_activation':
        return 'status-badge medium';
      default:
        return 'status-badge failed';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return '已入驻';
      case 'pending_activation':
        return '待激活';
      case 'inactive':
        return '已禁用';
      default:
        return status;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>个人中心</h1>
        <p>查看个人信息和登录历史</p>
      </div>
      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          <div className="section">
            <h3 className="section-title">个人信息</h3>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                backgroundColor: '#2563eb', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white',
                fontSize: '32px',
                fontWeight: 'bold'
              }}>
                {user?.realName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ margin: '0 0 8px 0' }}>{user?.realName || user?.username}</h3>
                  <span className={getStatusBadge(user?.status)}>
                    {getStatusText(user?.status)}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>用户名</div>
                    <div style={{ fontWeight: '500' }}>{user?.username || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>邮箱</div>
                    <div style={{ fontWeight: '500' }}>{user?.email || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>工号</div>
                    <div style={{ fontWeight: '500' }}>{user?.employee_number || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>角色</div>
                    <div style={{ fontWeight: '500' }}>{getUserRoleDisplay()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>组织</div>
                    <div style={{ fontWeight: '500' }}>{user?.organization_name || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>最后登录</div>
                    <div style={{ fontWeight: '500' }}>{formatTime(user?.last_login_at)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="section">
            <h3 className="section-title">权限信息</h3>
            {user?.roles && user.roles.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>所属角色：</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {user.roles.map((role, index) => (
                    <span key={index} className="status-badge" style={{ backgroundColor: '#dbeafe', color: '#2563eb' }}>
                      {role.display_name || role.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {user?.permissions && user.permissions.length > 0 && (
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>拥有权限：</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {user.permissions.map((perm, index) => (
                    <span 
                      key={index} 
                      className="status-badge low"
                      style={{ fontSize: '12px' }}
                    >
                      {perm.code}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="section">
          <h3 className="section-title">我的登录日志</h3>
          {loading ? (
            <div className="empty-state">
              <div className="loading-spinner-large"></div>
              <p style={{ marginTop: '16px' }}>加载中...</p>
            </div>
          ) : loginLogs.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>登录时间</th>
                    <th>登录结果</th>
                    <th>IP地址</th>
                    <th>设备信息</th>
                    <th>MFA验证</th>
                  </tr>
                </thead>
                <tbody>
                  {loginLogs.slice(0, 20).map((log, index) => (
                    <tr key={log.id || index}>
                      <td>{formatTime(log.created_at)}</td>
                      <td>
                        <span className={getLoginResultClass(log.login_result)}>
                          {log.login_result === 'success' ? '成功' : '失败'}
                        </span>
                      </td>
                      <td>{log.ip_address || '-'}</td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <p>暂无登录记录</p>
            </div>
          )}
        </div>

        <div className="alert alert-info">
          <strong>安全提示</strong>
          <p style={{ marginTop: '8px', fontSize: '13px' }}>
            为保障您的账户安全，请注意以下事项：
          </p>
          <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '13px' }}>
            <li>定期检查登录日志，如发现异常登录请立即联系管理员</li>
            <li>请使用强度较高的密码，并定期更换</li>
            <li>建议开启多因素认证 (MFA) 以增强账户安全性</li>
            <li>请勿在公共设备上保存登录状态</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
