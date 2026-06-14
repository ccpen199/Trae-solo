import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Transactions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadTransactions();
  }, [user, activeTab]);

  const loadTransactions = async () => {
    try {
      const res = await api.get('/transactions/my', {
        params: { type: activeTab === 'all' ? undefined : activeTab }
      });
      setTransactions(res.data);
    } catch (err) {
      console.error('加载交易记录失败', err);
    }
  };

  const getStatusText = (status) => {
    const map = {
      'deposit_pending': { text: '待支付定金', class: 'status-pending' },
      'deposit_frozen': { text: '定金已冻结', class: 'status-frozen' },
      'completed': { text: '已完成', class: 'status-completed' }
    };
    return map[status] || { text: status, class: '' };
  };

  const handleFreezeDeposit = async (id) => {
    try {
      await api.post(`/transactions/${id}/freeze-deposit`);
      loadTransactions();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleConfirmService = async (id) => {
    try {
      await api.post(`/transactions/${id}/confirm-service`);
      loadTransactions();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  if (!user) return null;

  return (
    <div className="container">
      <div className="card">
        <h2 className="card-title">我的交易</h2>
        <div className="tabs">
          <div
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            全部
          </div>
          <div
            className={`tab ${activeTab === 'buyer' ? 'active' : ''}`}
            onClick={() => setActiveTab('buyer')}
          >
            我是买家
          </div>
          <div
            className={`tab ${activeTab === 'seller' ? 'active' : ''}`}
            onClick={() => setActiveTab('seller')}
          >
            我是卖家
          </div>
        </div>

        {transactions.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            暂无交易记录
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>信息标题</th>
                <th>交易金额</th>
                <th>定金（20%）</th>
                <th>对方</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const isBuyer = tx.buyer_id === user.id;
                const statusInfo = getStatusText(tx.status);
                return (
                  <tr key={tx.id}>
                    <td>
                      <a href={`/listing/${tx.listing_id}`} style={{ color: '#333' }}>
                        {tx.listing_title}
                      </a>
                    </td>
                    <td>¥{tx.amount}</td>
                    <td>¥{tx.deposit_amount}</td>
                    <td>{isBuyer ? tx.seller_name : tx.buyer_name}</td>
                    <td>
                      <span className={`status-badge ${statusInfo.class}`}>
                        {statusInfo.text}
                      </span>
                    </td>
                    <td>{tx.created_at}</td>
                    <td>
                      {isBuyer && tx.status === 'deposit_pending' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleFreezeDeposit(tx.id)}
                        >
                          支付定金
                        </button>
                      )}
                      {tx.status === 'deposit_frozen' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleConfirmService(tx.id)}
                        >
                          {isBuyer ? (tx.buyer_confirmed ? '已确认' : '确认服务') : (tx.seller_confirmed ? '已确认' : '确认完成')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Transactions;
