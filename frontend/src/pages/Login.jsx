import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.js';

const demoActions = [
  {
    label: '进入个人中心/我的钱包',
    username: 'rider1',
    password: 'rider123',
    target: '/rider/wallet',
    description: '查看可提现余额、流水明细、提现提交和税务凭证'
  },
  {
    label: '进入订单提交/接单流程',
    username: 'rider1',
    password: 'rider123',
    target: '/rider/orders',
    description: '查看可接订单、接单、取餐、送达和异常申诉'
  },
  {
    label: '进入管理订单',
    username: 'admin',
    password: 'admin123',
    target: '/admin/orders',
    description: '模拟下单、智能派单、订单状态管理'
  }
];

const Login = () => {
  const [username, setUsername] = useState('rider1');
  const [password, setPassword] = useState('rider123');
  const [loginResult, setLoginResult] = useState(null);
  const pendingRedirectRef = useRef(null);
  const { login, loading, error, clearError, user, accessToken } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (accessToken && user) {
      const targetPath = pendingRedirectRef.current || (user.role === 'admin' ? '/admin/dashboard' : '/rider/dashboard');
      pendingRedirectRef.current = null;
      navigate(targetPath, { replace: true });
    }
    clearError();
    setLoginResult(null);
  }, [clearError, user, accessToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    pendingRedirectRef.current = null;
    setLoginResult(null);
    const result = await login(username, password);
    setLoginResult(result);
    if (result.success) {
      const targetPath = result.user.role === 'admin' ? '/admin/dashboard' : '/rider/dashboard';
      setTimeout(() => navigate(targetPath, { replace: true }), 300);
    }
  };

  const handleDemoAction = async (action) => {
    pendingRedirectRef.current = action.target;
    setUsername(action.username);
    setPassword(action.password);
    setLoginResult(null);
    const result = await login(action.username, action.password);
    setLoginResult(result);
    if (result.success) {
      setTimeout(() => navigate(action.target, { replace: true }), 300);
    }
  };

  const getErrorIcon = (type) => {
    switch (type) {
      case 'credentials': return '🔒';
      case 'client': return '⚙️';
      case 'auth': return '🚫';
      case 'network': return '🌐';
      case 'server': return '⚠️';
      default: return '❌';
    }
  };

  const getErrorColor = (type) => {
    switch (type) {
      case 'network': return '#fa8c16';
      case 'server': return '#d4380d';
      default: return '#ff4d4f';
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">🚴 配送任务协同平台</h1>
        <p className="login-subtitle">个人中心、我的钱包、订单提交与派单管理</p>

        {error && loginResult && !loginResult.success && (
          <div className="alert alert-error" style={{ 
            borderLeft: `4px solid ${getErrorColor(loginResult.errorType)}`,
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
            animation: 'shake 0.3s ease-in-out'
          }}>
            <span style={{ fontSize: '18px' }}>{getErrorIcon(loginResult.errorType)}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                {loginResult.errorType === 'credentials' && '账号或密码错误'}
                {loginResult.errorType === 'client' && '客户端配置错误'}
                {loginResult.errorType === 'auth' && '认证失败'}
                {loginResult.errorType === 'network' && '网络连接失败'}
                {loginResult.errorType === 'server' && '服务器错误'}
                {loginResult.errorType === 'request' && '请求参数错误'}
                {loginResult.errorType === 'unknown' && '登录失败'}
              </div>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>{error}</div>
              {loginResult.errorType === 'network' && (
                <div style={{ fontSize: '12px', marginTop: '6px', color: '#fa8c16' }}>
                  💡 请检查后端服务是否已启动（端口 59061），或联系管理员
                </div>
              )}
              {loginResult.errorType === 'credentials' && (
                <div style={{ fontSize: '12px', marginTop: '6px' }}>
                  💡 点击下方测试账号可快速填充正确的用户名和密码
                </div>
              )}
            </div>
          </div>
        )}

        {loginResult?.success && (
          <div className="alert alert-success" style={{ 
            display: 'flex', 
            gap: '8px', 
            alignItems: 'center',
            animation: 'fadeIn 0.3s ease-in-out'
          }}>
            <span style={{ fontSize: '18px' }}>✅</span>
            <div>
              <div style={{ fontWeight: 600 }}>登录成功！</div>
              <div style={{ fontSize: '13px' }}>欢迎回来，{loginResult.user.real_name || loginResult.user.username}！正在跳转...</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => { setUsername(e.target.value); clearError(); setLoginResult(null); }}
              placeholder="请输入用户名"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); setLoginResult(null); }}
              placeholder="请输入密码"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                <span style={{ marginLeft: '8px' }}>登录中...</span>
              </>
            ) : '登 录'}
          </button>
        </form>

        <div style={{ marginTop: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '6px', fontSize: '13px' }}>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>测试账号（点击快速填充）：</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div 
              onClick={() => { setUsername('admin'); setPassword('admin123'); clearError(); setLoginResult(null); }} 
              style={{ cursor: 'pointer', padding: '6px 10px', borderRadius: '4px', userSelect: 'none' }} 
              onMouseEnter={(e) => e.target.style.background = '#e6f7ff'} 
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              👨‍💼 管理员：<strong>admin</strong> / <strong>admin123</strong>
            </div>
            <div 
              onClick={() => { setUsername('rider1'); setPassword('rider123'); clearError(); setLoginResult(null); }} 
              style={{ cursor: 'pointer', padding: '6px 10px', borderRadius: '4px', userSelect: 'none' }} 
              onMouseEnter={(e) => e.target.style.background = '#e6f7ff'} 
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              🚴 骑手1（已认证）：<strong>rider1</strong> / <strong>rider123</strong>
            </div>
            <div 
              onClick={() => { setUsername('rider2'); setPassword('rider123'); clearError(); setLoginResult(null); }} 
              style={{ cursor: 'pointer', padding: '6px 10px', borderRadius: '4px', userSelect: 'none' }} 
              onMouseEnter={(e) => e.target.style.background = '#e6f7ff'} 
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              🚴 骑手2（已认证）：<strong>rider2</strong> / <strong>rider123</strong>
            </div>
          </div>
        </div>

        <div className="login-demo-actions">
          {demoActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="login-demo-action"
              onClick={() => handleDemoAction(action)}
              disabled={loading}
            >
              <span>{action.label}</span>
              <small>{action.description}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
