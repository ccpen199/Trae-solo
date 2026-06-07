import { useEffect, useState } from 'react';
import { adminAPI } from '../api.js';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [dashboard, setDashboard] = useState(null);
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [rateLimits, setRateLimits] = useState([]);

  const [userFilters, setUserFilters] = useState({
    keyword: '',
    role: '',
    status: ''
  });

  const [auditFilters, setAuditFilters] = useState({
    action: '',
    user_id: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchTabData();
  }, [activeTab]);

  const fetchTabData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'dashboard') {
        const res = await adminAPI.dashboard();
        setDashboard(res.data);
      } else if (activeTab === 'companies') {
        const res = await adminAPI.pendingCompanies();
        setPendingCompanies(res.data.companies || []);
      } else if (activeTab === 'users') {
        const res = await adminAPI.users(userFilters);
        setUsers(res.data.users || []);
      } else if (activeTab === 'audit') {
        const res = await adminAPI.auditLogs(auditFilters);
        setAuditLogs(res.data.logs || []);
      } else if (activeTab === 'rate-limits') {
        const res = await adminAPI.rateLimits();
        setRateLimits(res.data.rate_limits || []);
      }
    } catch (e) {
      setError(e.response?.data?.error || '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCompany = async (companyId, verified) => {
    if (!confirm(`确定要${verified ? '通过' : '拒绝'}该企业的认证申请吗？`)) {
      return;
    }
    try {
      await adminAPI.verifyCompany(companyId, { verified });
      setSuccess(`企业认证已${verified ? '通过' : '拒绝'}`);
      fetchTabData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.error || '操作失败');
    }
  };

  const handleUnblockIp = async (id) => {
    if (!confirm('确定要解封该IP吗？')) {
      return;
    }
    try {
      await adminAPI.unblockIp(id);
      setSuccess('IP已解封');
      fetchTabData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.error || '解封失败');
    }
  };

  const tabs = [
    { key: 'dashboard', label: '📊 数据统计' },
    { key: 'companies', label: '🏢 企业审核' },
    { key: 'users', label: '👥 用户管理' },
    { key: 'audit', label: '📋 审计日志' },
    { key: 'rate-limits', label: '🔒 IP解封' }
  ];

  const getActionText = (action) => {
    const map = {
      login: '用户登录',
      register: '用户注册',
      company_verify: '企业审核',
      referral_create: '创建内推',
      referral_status_update: '更新内推状态',
      message_send: '发送消息',
      job_create: '发布职位',
      contract_sign: '签署合同',
      training_submit: '提交培训'
    };
    return map[action] || action;
  };

  if (loading) {
    return (
      <div className="container page-content">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-content">
      <div className="page-header">
        <h1 className="page-title">⚙️ 管理后台</h1>
      </div>

      {success && (
        <div className="alert alert-success">
          <span>✅</span>
          {success}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span>❌</span>
          {error}
        </div>
      )}

      <div className="card">
        <div className="tabs">
          {tabs.map(tab => (
            <div
              key={tab.key}
              className={`tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {activeTab === 'dashboard' && dashboard && (
          <div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{dashboard.total_users || 0}</div>
                <div className="stat-label">总用户数</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{dashboard.total_companies || 0}</div>
                <div className="stat-label">企业总数</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{dashboard.pending_companies || 0}</div>
                <div className="stat-label">待审核企业</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{dashboard.total_jobs || 0}</div>
                <div className="stat-label">职位总数</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{dashboard.total_referrals || 0}</div>
                <div className="stat-label">内推总数</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{dashboard.success_referrals || 0}</div>
                <div className="stat-label">成功入职</div>
              </div>
            </div>

            <div className="card" style={{ background: '#fafafa', marginBottom: 0 }}>
              <h3 style={{ marginBottom: 16 }}>📈 今日统计</h3>
              <div className="stats-grid">
                <div className="stat-card" style={{ marginBottom: 0 }}>
                  <div className="stat-value" style={{ fontSize: 24 }}>{dashboard.today_new_users || 0}</div>
                  <div className="stat-label">新增用户</div>
                </div>
                <div className="stat-card" style={{ marginBottom: 0 }}>
                  <div className="stat-value" style={{ fontSize: 24 }}>{dashboard.today_new_companies || 0}</div>
                  <div className="stat-label">新增企业</div>
                </div>
                <div className="stat-card" style={{ marginBottom: 0 }}>
                  <div className="stat-value" style={{ fontSize: 24 }}>{dashboard.today_new_referrals || 0}</div>
                  <div className="stat-label">新增内推</div>
                </div>
                <div className="stat-card" style={{ marginBottom: 0 }}>
                  <div className="stat-value" style={{ fontSize: 24 }}>{dashboard.today_messages || 0}</div>
                  <div className="stat-label">消息发送量</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div>
            {pendingCompanies.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🏢</div>
                <div className="empty-state-text">暂无待审核的企业</div>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>企业名称</th>
                    <th>营业执照</th>
                    <th>行业</th>
                    <th>申请人</th>
                    <th>申请时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCompanies.map(company => (
                    <tr key={company.id}>
                      <td style={{ fontWeight: 500 }}>{company.name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{company.license_number}</td>
                      <td>{company.industry}</td>
                      <td>{company.owner_name}</td>
                      <td style={{ color: '#999', fontSize: 12 }}>
                        {new Date(company.created_at).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleVerifyCompany(company.id, true)}
                          >
                            ✓ 通过
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleVerifyCompany(company.id, false)}
                          >
                            ✕ 拒绝
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="filter-bar">
              <div className="form-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="搜索用户名/手机号..."
                  value={userFilters.keyword}
                  onChange={(e) => setUserFilters({ ...userFilters, keyword: e.target.value })}
                />
              </div>
              <div className="form-group">
                <select
                  className="form-select"
                  value={userFilters.role}
                  onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}
                >
                  <option value="">所有角色</option>
                  <option value="jobseeker">求职者</option>
                  <option value="employer">企业员工</option>
                  <option value="hr">HR</option>
                  <option value="owner">企业Owner</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
              <div className="form-group">
                <select
                  className="form-select"
                  value={userFilters.status}
                  onChange={(e) => setUserFilters({ ...userFilters, status: e.target.value })}
                >
                  <option value="">所有状态</option>
                  <option value="active">正常</option>
                  <option value="suspended">已封禁</option>
                </select>
              </div>
              <button className="btn btn-primary btn-sm" onClick={fetchTabData}>
                🔍 搜索
              </button>
            </div>

            {users.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <div className="empty-state-text">暂无用户数据</div>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>用户</th>
                    <th>手机号</th>
                    <th>角色</th>
                    <th>公司</th>
                    <th>微信验证</th>
                    <th>注册时间</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>
                            {u.username?.charAt(0)?.toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 500 }}>{u.username}</span>
                        </div>
                      </td>
                      <td>{u.phone || '-'}</td>
                      <td>
                        <span className="tag">
                          {u.role === 'jobseeker' ? '求职者' :
                           u.role === 'employer' ? '企业员工' :
                           u.role === 'hr' ? 'HR' :
                           u.role === 'owner' ? '企业Owner' :
                           u.role === 'admin' ? '管理员' : u.role}
                        </span>
                      </td>
                      <td>{u.company_name || '-'}</td>
                      <td>
                        {u.wechat_verified ? (
                          <span className="tag verified">✓ 已验证</span>
                        ) : (
                          <span className="tag" style={{ background: '#f5f5f5', color: '#999' }}>未验证</span>
                        )}
                      </td>
                      <td style={{ color: '#999', fontSize: 12 }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <span className={`status-badge ${u.status === 'active' ? 'status-hired' : 'status-rejected'}`}>
                          {u.status === 'active' ? '正常' : '已封禁'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div>
            <div className="filter-bar">
              <div className="form-group">
                <select
                  className="form-select"
                  value={auditFilters.action}
                  onChange={(e) => setAuditFilters({ ...auditFilters, action: e.target.value })}
                >
                  <option value="">所有操作</option>
                  <option value="login">用户登录</option>
                  <option value="register">用户注册</option>
                  <option value="company_verify">企业审核</option>
                  <option value="referral_create">创建内推</option>
                  <option value="message_send">发送消息</option>
                </select>
              </div>
              <div className="form-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="用户ID"
                  value={auditFilters.user_id}
                  onChange={(e) => setAuditFilters({ ...auditFilters, user_id: e.target.value })}
                />
              </div>
              <div className="form-group">
                <input
                  type="date"
                  className="form-input"
                  value={auditFilters.start_date}
                  onChange={(e) => setAuditFilters({ ...auditFilters, start_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <input
                  type="date"
                  className="form-input"
                  value={auditFilters.end_date}
                  onChange={(e) => setAuditFilters({ ...auditFilters, end_date: e.target.value })}
                />
              </div>
              <button className="btn btn-primary btn-sm" onClick={fetchTabData}>
                🔍 搜索
              </button>
            </div>

            {auditLogs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">暂无审计日志</div>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>用户</th>
                    <th>操作类型</th>
                    <th>IP地址</th>
                    <th>详情</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ color: '#999', fontSize: 12 }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td>{log.username || '-'}</td>
                      <td>
                        <span className="tag">{getActionText(log.action)}</span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {log.ip_address}
                      </td>
                      <td style={{ fontSize: 12, color: '#666', maxWidth: 300 }}>
                        {log.details ? JSON.stringify(log.details).substring(0, 50) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'rate-limits' && (
          <div>
            {rateLimits.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔒</div>
                <div className="empty-state-text">暂无被限制的IP</div>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>IP地址</th>
                    <th>限制原因</th>
                    <th>请求次数</th>
                    <th>首次请求</th>
                    <th>最后请求</th>
                    <th>过期时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {rateLimits.map(rl => (
                    <tr key={rl.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>
                        {rl.ip_address}
                      </td>
                      <td>
                        <span className={`tag ${rl.blocked ? 'status-rejected' : 'status-pending'}`}>
                          {rl.blocked ? '已封禁' : '频率限制'}
                        </span>
                      </td>
                      <td>{rl.request_count}</td>
                      <td style={{ color: '#999', fontSize: 12 }}>
                        {new Date(rl.first_request).toLocaleString()}
                      </td>
                      <td style={{ color: '#999', fontSize: 12 }}>
                        {new Date(rl.last_request).toLocaleString()}
                      </td>
                      <td style={{ color: '#999', fontSize: 12 }}>
                        {new Date(rl.expires_at).toLocaleString()}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleUnblockIp(rl.id)}
                        >
                          🔓 解封
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
