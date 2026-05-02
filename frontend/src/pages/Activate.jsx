import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../api';
import { useAuth } from '../App';
import Layout from '../components/Layout';

const Activate = () => {
  const [formData, setFormData] = useState({
    realName: '',
    idCard: '',
    bankCardNumber: '',
    bankName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.realName.length < 2) {
      setError('请输入真实姓名');
      return;
    }

    if (formData.idCard.length < 15) {
      setError('请输入正确的身份证号');
      return;
    }

    if (formData.bankCardNumber.length < 16) {
      setError('请输入正确的银行卡号');
      return;
    }

    setLoading(true);

    try {
      const response = await userAPI.activate({
        userId: user.userId,
        realName: formData.realName,
        idCard: formData.idCard,
        bankCardNumber: formData.bankCardNumber,
        bankName: formData.bankName || '默认银行'
      });

      if (response.data.success) {
        setSuccess('实名激活成功！虚拟账户已下发');
        updateUser({ 
          status: 'active', 
          realName: formData.realName 
        });
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(response.data.error || '激活失败');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || '激活失败，请检查网络');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="实名激活">
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              background: '#fff3e0',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#e65100', fontSize: '16px' }}>需要完成实名激活</h3>
                <p style={{ margin: 0, color: '#ff9800', fontSize: '14px' }}>
                  当前用户状态：待激活。请完成实名认证以使用所有功能。
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <span style={{ fontSize: '48px' }}>🔐</span>
              <h2 style={{ margin: '10px 0', color: '#333', fontSize: '20px' }}>实名认证</h2>
              <p style={{ color: '#666', fontSize: '14px' }}>完成实名认证，获取虚拟账户</p>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#ffebee',
              color: '#c62828',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={{
              background: '#e8f5e9',
              color: '#2e7d32',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                真实姓名 <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                name="realName"
                value={formData.realName}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                placeholder="请输入真实姓名"
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                身份证号 <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                name="idCard"
                value={formData.idCard}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                placeholder="请输入身份证号"
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                银行卡号 <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                name="bankCardNumber"
                value={formData.bankCardNumber}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                placeholder="请输入银行卡号"
                required
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                开户银行
              </label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                placeholder="请输入开户银行（选填）"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '激活中...' : '完成实名认证'}
            </button>
          </form>

          <div style={{ marginTop: '24px', padding: '16px', background: '#f5f7fa', borderRadius: '8px', fontSize: '13px', color: '#666' }}>
            <p style={{ margin: '0 0 8px 0' }}><strong>🔒 隐私保护声明</strong></p>
            <p style={{ margin: '4px 0' }}>您的个人信息将受到严格保护，仅用于身份验证和账户安全。</p>
            <p style={{ margin: '4px 0' }}>系统将为您下发专属虚拟账户，所有交易均可追溯。</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Activate;
