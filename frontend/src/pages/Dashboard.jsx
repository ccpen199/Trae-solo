import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../api';
import { useAuth } from '../App';
import Layout from '../components/Layout';

const Dashboard = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user.status !== 'active') {
      navigate('/activate');
      return;
    }
    fetchUserInfo();
    fetchTransactions();
  }, []);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getInfo(user.userId);
      if (response.data.success) {
        setUserInfo(response.data.data);
        if (response.data.data.user) {
          updateUser({ 
            realName: response.data.data.user.realName,
            status: response.data.data.user.status 
          });
        }
      }
    } catch (err) {
      console.error('获取用户信息失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await userAPI.getTransactions(user.userId, 10);
      if (response.data.success) {
        setTransactions(response.data.data);
      }
    } catch (err) {
      console.error('获取交易记录失败:', err);
    }
  };

  const handleRecharge = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const amount = parseInt(rechargeAmount);
    if (!amount || amount <= 0) {
      setError('请输入有效的充值金额');
      return;
    }

    try {
      setRechargeLoading(true);
      const response = await userAPI.recharge({
        userId: user.userId,
        amount
      });

      if (response.data.success) {
        setSuccess(`充值成功！金额: ${amount} 元`);
        setRechargeAmount('');
        fetchUserInfo();
        fetchTransactions();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.error || '充值失败');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || '充值失败');
    } finally {
      setRechargeLoading(false);
    }
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      payment: '扫码支付',
      transfer: '转账',
      recharge: '充值'
    };
    return labels[type] || type;
  };

  const getTransactionTypeColor = (type) => {
    const colors = {
      payment: '#ef5350',
      transfer: '#ff9800',
      recharge: '#4caf50'
    };
    return colors[type] || '#666';
  };

  if (loading && !userInfo) {
    return (
      <Layout title="首页">
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <span style={{ fontSize: '24px' }}>🔄</span>
          <p style={{ color: '#666', marginTop: '20px' }}>加载中...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="首页">
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '30px',
          borderRadius: '16px',
          color: 'white',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 8px 0', opacity: 0.9, fontSize: '14px' }}>账户余额</p>
              <h2 style={{ margin: '0', fontSize: '36px', fontWeight: 'bold' }}>
                ¥ {userInfo?.account?.balance?.toLocaleString() || 0}
              </h2>
              <p style={{ margin: '8px 0 0 0', opacity: 0.8, fontSize: '13px' }}>
                账户号: {userInfo?.account?.accountNumber || '---'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', opacity: 0.9 }}>
                👤 {userInfo?.user?.realName || user.username}
              </p>
              <p style={{ margin: '0', fontSize: '12px', opacity: 0.7 }}>
                状态: {userInfo?.user?.status === 'active' ? '已激活' : '待激活'}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            cursor: 'pointer',
            textAlign: 'center'
          }} onClick={() => navigate('/payment')}>
            <span style={{ fontSize: '32px' }}>💳</span>
            <p style={{ margin: '12px 0 0 0', color: '#333', fontWeight: '500' }}>扫码支付</p>
          </div>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            cursor: 'pointer',
            textAlign: 'center'
          }} onClick={() => navigate('/transfer')}>
            <span style={{ fontSize: '32px' }}>↔️</span>
            <p style={{ margin: '12px 0 0 0', color: '#333', fontWeight: '500' }}>转账</p>
          </div>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            cursor: 'pointer',
            textAlign: 'center'
          }} onClick={() => navigate('/transactions')}>
            <span style={{ fontSize: '32px' }}>📋</span>
            <p style={{ margin: '12px 0 0 0', color: '#333', fontWeight: '500' }}>交易记录</p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px'
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px' }}>💰 快速充值</h3>
            
            {error && (
              <div style={{
                background: '#ffebee',
                color: '#c62828',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '16px',
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
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                ✅ {success}
              </div>
            )}

            <form onSubmit={handleRecharge}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '14px' }}>
                  充值金额 (元)
                </label>
                <input
                  type="number"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  placeholder="请输入充值金额"
                  min="1"
                  required
                />
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {[100, 500, 1000, 5000].map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setRechargeAmount(amount.toString())}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: rechargeAmount === amount.toString() ? '#667eea' : '#f5f7fa',
                      color: rechargeAmount === amount.toString() ? 'white' : '#333',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    ¥{amount}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={rechargeLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: rechargeLoading ? 'not-allowed' : 'pointer',
                  opacity: rechargeLoading ? 0.7 : 1
                }}
              >
                {rechargeLoading ? '充值中...' : '立即充值'}
              </button>
            </form>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px' }}>📋 最近交易</h3>
            
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                <span style={{ fontSize: '40px' }}>📭</span>
                <p style={{ marginTop: '16px' }}>暂无交易记录</p>
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {transactions.map(tx => (
                  <div key={tx.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: tx.transaction_type === 'recharge' ? '#e8f5e9' : '#ffebee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}>
                        {tx.transaction_type === 'recharge' ? '💰' : tx.transaction_type === 'payment' ? '💳' : '↔️'}
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', color: '#333', fontSize: '14px', fontWeight: '500' }}>
                          {getTransactionTypeLabel(tx.transaction_type)}
                        </p>
                        <p style={{ margin: '0', color: '#999', fontSize: '12px' }}>
                          {new Date(tx.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{
                        margin: '0 0 4px 0',
                        color: tx.transaction_type === 'recharge' ? '#4caf50' : '#ef5350',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}>
                        {tx.transaction_type === 'recharge' ? '+' : '-'}{'¥'}{tx.amount.toLocaleString()}
                      </p>
                      <p style={{
                        margin: '0',
                        color: tx.status === 'completed' ? '#4caf50' : '#ff9800',
                        fontSize: '12px'
                      }}>
                        {tx.status === 'completed' ? '✓ 成功' : '⏳ 处理中'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
