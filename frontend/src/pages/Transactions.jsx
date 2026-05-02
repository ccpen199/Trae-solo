import React, { useState, useEffect } from 'react';
import { userAPI, transferAPI } from '../api';
import { useAuth } from '../App';
import Layout from '../components/Layout';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [selectedTx, setSelectedTx] = useState(null);
  const [showVoucher, setShowVoucher] = useState(false);
  const [voucher, setVoucher] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchTransactions();
  }, [filterType]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getTransactions(user.userId, 100);
      if (response.data.success) {
        let data = response.data.data;
        if (filterType !== 'all') {
          data = data.filter(tx => tx.transaction_type === filterType);
        }
        setTransactions(data);
      }
    } catch (err) {
      console.error('获取交易记录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVoucher = async (transactionId) => {
    try {
      const response = await transferAPI.getVoucher(transactionId);
      if (response.data.success) {
        setVoucher(response.data.data);
        setShowVoucher(true);
      }
    } catch (err) {
      console.error('获取电子凭证失败:', err);
    }
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      payment: '扫码支付',
      transfer: '转账',
      recharge: '充值',
      transfer_receive: '收款'
    };
    return labels[type] || type;
  };

  const getTransactionTypeIcon = (type) => {
    const icons = {
      payment: '💳',
      transfer: '↔️',
      recharge: '💰',
      transfer_receive: '📥'
    };
    return icons[type] || '📦';
  };

  const getStatusLabel = (status) => {
    const labels = {
      completed: '✓ 成功',
      pending: '⏳ 处理中',
      failed: '✗ 失败',
      frozen: '🔒 冻结',
      blocked: '🚫 拦截'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: '#4caf50',
      pending: '#ff9800',
      failed: '#ef5350',
      frozen: '#9c27b0',
      blocked: '#f44336'
    };
    return colors[status] || '#666';
  };

  const formatAmount = (tx) => {
    const isCredit = tx.transaction_type === 'recharge' || 
                     (tx.transaction_type === 'transfer' && tx.to_account_id === user.userId);
    return (
      <span style={{ color: isCredit ? '#4caf50' : '#ef5350', fontWeight: 'bold', fontSize: '16px' }}>
        {isCredit ? '+' : '-'}{'¥'}{tx.amount.toLocaleString()}
      </span>
    );
  };

  return (
    <Layout title="交易记录">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          {[
            { value: 'all', label: '全部' },
            { value: 'recharge', label: '充值' },
            { value: 'payment', label: '支付' },
            { value: 'transfer', label: '转账' }
          ].map(item => (
            <button
              key={item.value}
              onClick={() => setFilterType(item.value)}
              style={{
                padding: '8px 16px',
                background: filterType === item.value ? '#667eea' : '#fff',
                color: filterType === item.value ? 'white' : '#333',
                border: filterType === item.value ? 'none' : '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: filterType === item.value ? '500' : 'normal'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 1fr 120px 100px 100px',
            padding: '16px 20px',
            background: '#f5f7fa',
            fontWeight: '500',
            color: '#666',
            fontSize: '13px'
          }}>
            <span></span>
            <span>交易类型</span>
            <span>对方信息</span>
            <span>金额</span>
            <span>状态</span>
            <span>操作</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
              <span style={{ fontSize: '32px' }}>🔄</span>
              <p style={{ marginTop: '12px' }}>加载中...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
              <span style={{ fontSize: '48px' }}>📭</span>
              <p style={{ marginTop: '16px', fontSize: '16px' }}>暂无交易记录</p>
            </div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {transactions.map(tx => (
                <div key={tx.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 1fr 120px 100px 100px',
                  padding: '16px 20px',
                  alignItems: 'center',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <span style={{ fontSize: '24px' }}>
                    {getTransactionTypeIcon(tx.transaction_type)}
                  </span>
                  <div>
                    <p style={{ margin: '0', color: '#333', fontWeight: '500' }}>
                      {getTransactionTypeLabel(tx.transaction_type)}
                    </p>
                    <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: '12px' }}>
                      {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0', color: '#333', fontSize: '14px' }}>
                      {tx.merchant_name || tx.from_user_name || tx.to_user_name || '-'}
                    </p>
                    <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: '12px' }}>
                      交易号: {tx.transaction_no}
                    </p>
                  </div>
                  <div>
                    {formatAmount(tx)}
                  </div>
                  <div>
                    <span style={{ color: getStatusColor(tx.status), fontSize: '13px' }}>
                      {getStatusLabel(tx.status)}
                    </span>
                  </div>
                  <div>
                    {tx.transaction_type === 'transfer' && tx.status === 'completed' && (
                      <button
                        onClick={() => fetchVoucher(tx.transaction_no)}
                        style={{
                          padding: '6px 12px',
                          background: '#e3f2fd',
                          color: '#1976d2',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        查看凭证
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showVoucher && voucher && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }} onClick={() => setShowVoucher(false)}>
            <div style={{
              background: 'white',
              padding: '32px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 20px 0', color: '#333', textAlign: 'center' }}>
                📜 电子转账凭证
              </h3>
              
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px',
                borderRadius: '8px',
                color: 'white',
                marginBottom: '20px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 8px 0', opacity: 0.9 }}>转账金额</p>
                  <h2 style={{ margin: '0', fontSize: '32px' }}>¥ {voucher.amount?.toLocaleString()}</h2>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                {[
                  { label: '凭证编号', value: voucher.voucher_no },
                  { label: '交易编号', value: voucher.transaction_no },
                  { label: '付款方', value: voucher.from_user_name },
                  { label: '收款方', value: voucher.to_user_name },
                  { label: '转账时间', value: new Date(voucher.transfer_time).toLocaleString() },
                  { label: '备注', value: voucher.remark || '无' }
                ].map(item => (
                  <div key={item.label} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <span style={{ color: '#666' }}>{item.label}</span>
                    <span style={{ color: '#333', fontWeight: '500' }}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: '20px',
                padding: '12px',
                background: '#f5f7fa',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#666'
              }}>
                <p style={{ margin: '0 0 4px 0' }}><strong>哈希值 (Hash):</strong></p>
                <p style={{ margin: '0', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                  {voucher.hash}
                </p>
              </div>

              <button
                onClick={() => setShowVoucher(false)}
                style={{
                  width: '100%',
                  marginTop: '20px',
                  padding: '12px',
                  background: '#f5f7fa',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Transactions;
