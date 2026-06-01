import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import { planetAPI } from '../utils/api';
import { Transaction } from '../types';

const Wallet: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');
  const [loading, setLoading] = useState(true);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAddress, setTransferAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadWallet();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated]);

  const loadWallet = async () => {
    try {
      const res = await planetAPI.getWallet();
      setWallet(res.data);
      setTransactions(res.data.transactions || []);
    } catch (error) {
      console.error('Load wallet error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferAddress || !transferAmount) {
      alert('请填写转账地址和金额');
      return;
    }
    try {
      await planetAPI.transfer({
        toAddress: transferAddress,
        amount: parseFloat(transferAmount)
      });
      setShowTransfer(false);
      setTransferAddress('');
      setTransferAmount('');
      loadWallet();
    } catch (error: any) {
      alert(error.response?.data?.error || '转账失败');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      <div className="header">
        <h1>💰 我的钱包</h1>
        <p>区块链资产管理</p>
      </div>

      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          钱包信息
        </div>
        <div 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          交易记录
        </div>
      </div>

      {activeTab === 'info' ? (
        <div className="card">
          {loading ? (
            <div className="loading">加载中...</div>
          ) : (
            <>
              <div className="balance-card" style={{ marginBottom: 20 }}>
                <div className="balance-label">黑钻余额</div>
                <div className="balance-value">{wallet?.balance?.toFixed(2) || '0.00'}</div>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label className="label">区块链地址</label>
                <div className="input" style={{ background: '#f5f5f5', wordBreak: 'break-all' }}>
                  {wallet?.address}
                </div>
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <label className="label">私钥（请妥善保管）</label>
                <div className="input" style={{ background: '#f5f5f5', wordBreak: 'break-all' }}>
                  {wallet?.privateKey}
                </div>
              </div>

              {!showTransfer ? (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowTransfer(true)}
                >
                  转账
                </button>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label className="label">目标地址</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="请输入目标区块链地址"
                      value={transferAddress}
                      onChange={e => setTransferAddress(e.target.value)}
                    />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label className="label">转账金额</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      placeholder="请输入转账金额"
                      value={transferAmount}
                      onChange={e => setTransferAmount(e.target.value)}
                    />
                  </div>
                  <button 
                    className="btn btn-primary"
                    onClick={handleTransfer}
                    style={{ marginBottom: 8 }}
                  >
                    确认转账
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowTransfer(false);
                      setTransferAddress('');
                      setTransferAmount('');
                    }}
                  >
                    取消
                  </button>
                </>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="card">
          {loading ? (
            <div className="loading">加载中...</div>
          ) : transactions.length === 0 ? (
            <div className="empty">暂无交易记录</div>
          ) : (
            transactions.map((tx, index) => (
              <div key={index} className="transaction-item">
                <div className="transaction-info">
                  <div className="transaction-type">
                    {tx.tx_type === 'transfer' ? (tx.amount >= 0 ? '转入' : '转出') : '其他'}
                  </div>
                  <div className="transaction-time">
                    {new Date(tx.created_at || '').toLocaleString()}
                  </div>
                  {tx.tx_hash && (
                    <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
                      Tx: {tx.tx_hash.substring(0, 20)}...
                    </div>
                  )}
                </div>
                <div className={`transaction-amount ${tx.amount >= 0 ? 'positive' : 'negative'}`}>
                  {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <button 
        className="btn btn-secondary"
        style={{ marginTop: 16 }}
        onClick={() => navigate('/profile')}
      >
        返回
      </button>
    </div>
  );
};

export default Wallet;
