import React, { useEffect, useState } from 'react';
import { fundsApi } from '../api';

const FundsPage = () => {
  const [funds, setFunds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadFunds();
  }, []);

  const loadFunds = async () => {
    try {
      setLoading(true);
      const res = await fundsApi.getFunds();
      setFunds(res.data);
    } catch (err) {
      console.error('加载资金信息失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setMessage({ type: 'error', text: '请输入有效金额' });
      return;
    }

    try {
      await fundsApi.deposit(parseFloat(depositAmount));
      setMessage({ type: 'success', text: '成功充值 ¥' + parseFloat(depositAmount).toFixed(2) });
      setDepositAmount('');
      loadFunds();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || '充值失败' });
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setMessage({ type: 'error', text: '请输入有效金额' });
      return;
    }

    if (parseFloat(withdrawAmount) > funds.available_balance) {
      setMessage({ type: 'error', text: '可用余额不足' });
      return;
    }

    try {
      await fundsApi.withdraw(parseFloat(withdrawAmount));
      setMessage({ type: 'success', text: '成功提现 ¥' + parseFloat(withdrawAmount).toFixed(2) });
      setWithdrawAmount('');
      loadFunds();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || '提现失败' });
    }
  };

  const formatPrice = (price) => (price ? price.toFixed(2) : '--');

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>加载中...</div>
    );
  }

  const accountDetails = [
    { label: '总资产', value: (funds?.total_balance || 0) + (funds?.total_market_value || 0), isNumber: true },
    { label: '可用余额', value: funds?.available_balance, isNumber: true },
    { label: '冻结资金', value: funds?.frozen_balance, isNumber: true },
    { label: '持仓市值', value: funds?.total_market_value || 0, isNumber: true },
    { label: '累计盈亏', value: funds?.total_profit_loss, isNumber: true },
    { label: '货币类型', value: funds?.currency || 'CNY', isNumber: false }
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>总资产</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            ¥{formatPrice((funds?.total_balance || 0) + (funds?.total_market_value || 0))}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>可用资金</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            ¥{formatPrice(funds?.available_balance)}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>冻结资金</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
            ¥{formatPrice(funds?.frozen_balance)}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>累计盈亏</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: (funds?.total_profit_loss || 0) >= 0 ? '#e74c3c' : '#27ae60' }}>
            {(funds?.total_profit_loss || 0) >= 0 ? '+' : ''}¥{formatPrice(funds?.total_profit_loss)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#1f2937' }}>账户详情</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {accountDetails.map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#6b7280' }}>{item.label}</span>
                  <span style={{ 
                    fontWeight: '500',
                    color: item.isNumber 
                      ? (item.value >= 0 ? '#e74c3c' : '#27ae60')
                      : '#1f2937'
                  }}>
                    {item.isNumber ? '¥' + formatPrice(item.value) : item.value}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#1f2937' }}>资金操作</h3>
          
          {message.text && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px',
              background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
              color: message.type === 'success' ? '#065f46' : '#991b1b'
            }}>
              {message.text}
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>充值</h4>
            <form onSubmit={handleDeposit} style={{ display: 'flex', gap: '12px' }}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="输入充值金额"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                充值
              </button>
            </form>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>提现</h4>
            <form onSubmit={handleWithdraw} style={{ display: 'flex', gap: '12px' }}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="输入提现金额"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                提现
              </button>
            </form>
          </div>

          <div style={{ marginTop: '20px', padding: '16px', background: '#f9fafb', borderRadius: '6px' }}>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              <div style={{ marginBottom: '8px' }}>提示：</div>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>充值和提现仅为模拟操作</li>
                <li>初始资金：¥1,000,000.00</li>
                <li>实际交易中，提现可能需要T+1到账</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const statCardStyle = {
  background: 'white',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

export default FundsPage;
