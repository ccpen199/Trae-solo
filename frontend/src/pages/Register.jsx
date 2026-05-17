import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import request from '../utils/request';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: '', password: '', code: '' });
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  const sendCode = async () => {
    if (!form.phone) {
      setError('请先输入手机号');
      return;
    }

    setSendingCode(true);
    try {
      const res = await request.post('/auth/send-code', { phone: form.phone });
      setForm({ ...form, code: '123456' });
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError('发送验证码失败');
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.phone || !form.password || !form.code) {
      setError('请填写完整信息');
      return;
    }

    if (form.password.length < 6) {
      setError('密码至少6位');
      return;
    }

    setLoading(true);
    try {
      await request.post('/auth/register', form);
      navigate('/login', { state: { phone: form.phone } });
    } catch (err) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📺</div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
            创建账号
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            注册B站战略版，成为正式会员
          </p>
        </div>

        <div style={{
          backgroundColor: '#e6f7ff',
          border: '1px solid #91d5ff',
          color: '#1890ff',
          padding: '12px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          💡 测试验证码：<strong>123456</strong>，点击"发送验证码"后自动填充
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fff2f0',
            border: '1px solid #ffccc7',
            color: '#ff4d4f',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary)'
            }}>
              手机号
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="请输入手机号"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary)'
            }}>
              验证码
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="请输入验证码"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
              />
              <button
                type="button"
                onClick={sendCode}
                disabled={countdown > 0 || sendingCode}
                style={{
                  padding: '0 20px',
                  backgroundColor: countdown > 0 ? 'var(--bg-secondary)' : 'var(--primary-color)',
                  color: countdown > 0 ? 'var(--text-muted)' : 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s后重发` : '发送验证码'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary)'
            }}>
              密码
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="请设置密码（至少6位）"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '注册中...' : '注 册'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--text-secondary)'
        }}>
          已有账号？
          <Link to="/login" style={{ color: 'var(--primary-color)', marginLeft: '4px' }}>
            立即登录
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
