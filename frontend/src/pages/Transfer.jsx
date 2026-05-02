import React, { useState } from 'react';
import { transferAPI } from '../api';
import { useAuth } from '../App';
import Layout from '../components/Layout';

const Transfer = () => {
  const [formData, setFormData] = useState({
    toAccountNumber: '',
    amount: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [result, setResult] = useState(null);
  const { user } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setResult(null);

    if (!formData.toAccountNumber || !formData.amount) {
      setError('请输入收款账户号和金额');
      return;
    }

    const amount = parseInt(formData.amount);
    if (amount <= 0) {
      setError('金额必须大于0');
      return;
    }

    try {
      setLoading(true);
      const response = await transferAPI.execute({
        fromUserId: user.userId,
        toAccountNumber: formData.toAccountNumber,
        amount,
        description: formData.description
      });

      if (response.data.success) {
        setSuccess('转账成功！电子凭证已发送');
        setResult(response.data.data);
      } else {
        setError(response.data.error || '转账失败');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || '转账失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="转账">
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <span style={{ fontSize: '48px' }}>↔️</span>
            <h2 style={{ margin: '10px 0', color: '#333', fontSize: '24px' }}>账户转账</h2>
            <p style={{ color: '#666' }}>输入收款账户和金额完成转账</p>
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
              <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>转账结果</h4>
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
                  <span style={{ color: '#666' }}>付款账户:</span>
                  <span style={{ color: '#333' }}>{result.fromAccount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>收款账户:</span>
                  <span style={{ color: '#333' }}>{result.toAccount}</span>
                </div>
                {result.voucher && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>凭证号:</span>
                    <span style={{ color: '#667eea', fontWeight: '500' }}>{result.voucher.voucherNo}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                收款账户号 <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                name="toAccountNumber"
                value={formData.toAccountNumber}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                placeholder="请输入收款账户号"
                required
              />
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
                placeholder="请输入转账金额"
                min="1"
                required
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                转账备注
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
                placeholder="请输入转账备注（选填）"
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
              {loading ? '处理中...' : '确认转账'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Transfer;
