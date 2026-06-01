import React, { useState } from 'react';
import { authAPI } from '../api.js';

export default function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: ''
  });

  const doLogin = async (username, password) => {
    setLoading(true);
    setError('');
    setFormData(f => ({ ...f, username, password }));
    setIsLogin(true);

    try {
      const response = await authAPI.login({ username, password });
      onLogin(response.data.user, response.data.token);
    } catch (err) {
      const errMsg = err.response?.data?.error;
      console.log('Login error:', errMsg);
      if (errMsg) {
        if (errMsg.toLowerCase().includes('invalid') || errMsg.toLowerCase().includes('password') || errMsg.toLowerCase().includes('username')) {
          setError('用户名或密码错误，请检查后重试');
        } else if (errMsg.toLowerCase().includes('exists')) {
          setError('该用户名已被注册');
        } else {
          setError(errMsg);
        }
      } else if (err.message === 'Network Error') {
        setError('网络连接失败，请检查后端服务是否启动');
      } else {
        setError('登录失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!formData.password.trim()) {
      setError('请输入密码');
      return;
    }
    if (!isLogin) {
      if (!formData.name.trim()) {
        setError('请输入姓名');
        return;
      }
      if (!formData.email.trim()) {
        setError('请输入邮箱');
        return;
      }
    }

    if (isLogin) {
      await doLogin(formData.username, formData.password);
    } else {
      setLoading(true);
      try {
        const response = await authAPI.register(formData);
        onLogin(response.data.user, response.data.token);
      } catch (err) {
        const errMsg = err.response?.data?.error;
        if (errMsg && errMsg.toLowerCase().includes('exists')) {
          setError('该用户名已被注册');
        } else {
          setError(errMsg || '注册失败，请稍后重试');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const quickLogin = (username, password) => {
    doLogin(username, password);
  };

  const roleDescriptions = [
    {
      role: 'admin',
      name: '系统管理员',
      icon: '👑',
      color: '#4f46e5',
      features: [
        '管理所有共读计划和用户',
        '查看全平台数据报表',
        '管理主理人权限分配',
        '导出所有运营数据',
        '系统配置与数据备份'
      ],
      todo: '待办：审核计划、处理用户反馈、系统巡检'
    },
    {
      role: 'host',
      name: '共读主理人',
      icon: '🎯',
      color: '#10b981',
      features: [
        '创建和管理共读计划',
        '维护章节安排与阅读目标',
        '组织线上分享和嘉宾直播',
        '查看成员参与报表',
        '管理讨论区置顶和加精'
      ],
      todo: '待办：批阅作业、发起讨论、查看缺席提醒、沉淀精华观点'
    },
    {
      role: 'member',
      name: '共读成员',
      icon: '📚',
      color: '#f59e0b',
      features: [
        '加入共读计划',
        '记录阅读进度和打卡',
        '撰写读书笔记（公开/私密',
        '参与讨论和投票',
        '报名活动和提交作业'
      ],
      todo: '待办：今日阅读打卡、提交读书笔记、参与讨论话题'
    },
    {
      role: 'guest',
      name: '特邀嘉宾',
      icon: '⭐',
      color: '#ef4444',
      features: [
        '参与嘉宾直播分享',
        '解答成员疑问',
        '提供专业解读',
        '分享行业观点沉淀'
      ],
      todo: '待办：准备分享资料、回复提问区答疑'
    }
  ];

  return (
    <div className="login-page" style={{ minHeight: '100vh', display: 'flex', padding: '2rem', gap: '3rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 320, maxWidth: 500, color: 'white' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚 读书会共读系统</h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9, lineHeight: 1.6 }}>
            多人共读与讨论管理平台，服务主理人、成员、嘉宾和社群运营，
            支持书目管理、进度追踪、笔记沉淀、讨论互动和活动管理全流程闭环。
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
          {roleDescriptions.map((item) => (
            <div
              key={item.role}
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 12,
                padding: '1rem',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                <strong style={{ color: item.color }}>{item.name}</strong>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', opacity: 0.9 }}>
                {item.features.slice(0, 3).map((f, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>{f}</li>
                ))}
              </ul>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: item.color, fontWeight: 600 }}>
                → {item.todo}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 420 }}>
        <div className="login-card">
          <h1 className="login-title">欢迎登录</h1>
          
          <div className="tabs" style={{ marginBottom: '1.5rem' }}>
            <div
              className={`tab ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              登录
            </div>
            <div
              className={`tab ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              注册
            </div>
          </div>

          {error && (
            <div style={{ 
              background: '#fef2f2', 
              border: '1px solid #fca5a5', 
              color: '#dc2626', 
              padding: '0.75rem', 
              borderRadius: 8, 
              marginBottom: '1rem', 
              textAlign: 'center',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="form-group">
                  <label className="form-label">姓名</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">邮箱</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">用户名</label>
              <input
                type="text"
                className="form-input"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">密码</label>
              <input
                type="password"
                className="form-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
            </button>
          </form>

          <div style={{ background: '#f8fafc', borderRadius: 8, padding: '1rem', marginTop: '1.5rem' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--gray-700)' }}>🎯 快速登录体验</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.75rem' }}>点击下方按钮直接以对应角色登录</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: '#4f46e5', color: 'white', border: 'none', fontSize: '0.75rem' }}
                onClick={() => quickLogin('admin', 'admin123')}
                disabled={loading}
              >
                👑 管理员登录
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: '#10b981', color: 'white', border: 'none', fontSize: '0.75rem' }}
                onClick={() => quickLogin('host1', 'admin123')}
                disabled={loading}
              >
                🎯 主理人登录
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: '#f59e0b', color: 'white', border: 'none', fontSize: '0.75rem' }}
                onClick={() => quickLogin('member1', 'member123')}
                disabled={loading}
              >
                📚 成员登录
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: '#ef4444', color: 'white', border: 'none', fontSize: '0.75rem' }}
                onClick={() => quickLogin('guest1', 'member123')}
                disabled={loading}
              >
                ⭐ 嘉宾登录
              </button>
            </div>
          </div>

          <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--gray-500)', textAlign: 'center' }}>
            登录后将根据您的角色自动进入对应工作台
          </div>
        </div>
      </div>
    </div>
  );
}
