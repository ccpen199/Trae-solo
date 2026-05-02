import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentAPI } from '../api';
import { useAuth } from '../App';
import Layout from '../components/Layout';

const Payment = () => {
  const [formData, setFormData] = useState({
    merchantNo: 'M2026000001',
    amount: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [result, setResult] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setResult(null);

    if (!formData.merchantNo || !formData.amount) {
      setError('请输入商户号和金额');
      return;
    }

    const amount = parseInt(formData.amount);
    if (amount <= 0) {
      setError('金额必须大于0');
      return;
    }

    try {
      setLoading(true);
      const response = await paymentAPI.scanPay({
        userId: user.userId,
        merchantNo: formData.merchantNo,
        amount,
        description: formData.description
      });

      if (response.data.success) {
        setSuccess('支付成功！');
        setResult(response.data.data);
      } else {
        setError(response.data.error || '支付失败');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || '支付失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="扫码支付">
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <span style={{ fontSize: '48px' }}>💳</span>
            <h2 style={{ margin: '10px 0', color: '#333', fontSize: '24px' }}>扫码支付</h2>
            <p style={{ color: '#666' }}>输入商户号和金额完成支付</p>
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

          {result && (
            <div style={{
              background: '#f5f7fa',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>支付结果</h4>
              <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>交易号:</span>
                  <span style={{ color: '#333', fontWeight: '500' }}>{result.transactionNo}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>金额:</span>
                  <span style={{ color: '#ef5350', fontWeight: 'bold', fontSize: '18px' }}>¥{result.amount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>商户:</span>
                  <span style={{ color: '#333' }}>{result.merchantName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>风险评分:</span>
                  <span style={{ color: result.riskLevel === 'low' ? '#4caf50' : result.riskLevel === 'medium' ? '#ff9800' : '#f44336' }}>
                    {result.riskScore} ({result.riskLevel})
                  </span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                商户号 <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                name="merchantNo"
                value={formData.merchantNo}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                placeholder="请输入商户号"
                required
              />
              <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#999' }}>
                测试商户号: M2026000001
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                金额 (元) <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                placeholder="请输入支付金额"
                min="1"
                required
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                备注
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                placeholder="请输入备注（选填）"
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
              {loading ? '处理中...' : '确认支付'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Payment;
