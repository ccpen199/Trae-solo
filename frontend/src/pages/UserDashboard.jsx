import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [myTransactions, setMyTransactions] = useState([]);
  const [myFavorites, setMyFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      setMyTransactions(res.data.transactions || []);
    } catch (err) {
      console.error('加载交易失败', err);
    }
  };

  const getStatusText = (status) => {
    const map = {
      pending: '待确认',
      deposit_pending: '定金待支付',
      deposit_frozen: '定金已冻结',
      service_confirmed: '服务已确认',
      completed: '已完成',
      cancelled: '已取消'
    };
    return map[status] || status;
  };

  const getStatusColor = (status) => {
    const map = {
      pending: '#f39c12',
      deposit_pending: '#e74c3c',
      deposit_frozen: '#3498db',
      service_confirmed: '#9b59b6',
      completed: '#27ae60',
      cancelled: '#95a5a6'
    };
    return map[status] || '#666';
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>请先登录</p>
        <Link to="/login" className="btn btn-primary">去登录</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <div style={{ width: '240px', flexShrink: 0 }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #3498db, #2980b9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem', fontWeight: 'bold', margin: '0 auto 1rem' }}>
                {user.nickname?.charAt(0) || '用'}
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>{user.nickname}</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                {user.is_verified ? <span style={{ color: '#27ae60' }}>✓ 已实名认证</span> : <span style={{ color: '#e74c3c' }}>未实名认证</span>}
              </p>
            </div>
            <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>信用分：<strong>{user.credit_score || 100}</strong></p>
              <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>手机号：{user.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</p>
            </div>
          </div>

          <div className="card" style={{ marginTop: '1rem', padding: '0' }}>
            <div
              onClick={() => setActiveTab('overview')}
              style={{ padding: '1rem', cursor: 'pointer', background: activeTab === 'overview' ? '#f8f9fa' : 'transparent', borderLeft: activeTab === 'overview' ? '3px solid #3498db' : '3px solid transparent' }}
            >
              📊 概览
            </div>
            <div
              onClick={() => setActiveTab('transactions')}
              style={{ padding: '1rem', cursor: 'pointer', background: activeTab === 'transactions' ? '#f8f9fa' : 'transparent', borderLeft: activeTab === 'transactions' ? '3px solid #3498db' : '3px solid transparent' }}
            >
              💰 我的交易
            </div>
            <div
              onClick={() => setActiveTab('favorites')}
              style={{ padding: '1rem', cursor: 'pointer', background: activeTab === 'favorites' ? '#f8f9fa' : 'transparent', borderLeft: activeTab === 'favorites' ? '3px solid #3498db' : '3px solid transparent' }}
            >
              ⭐ 我的收藏
            </div>
            <div
              onClick={() => navigate('/profile')}
              style={{ padding: '1rem', cursor: 'pointer', borderLeft: '3px solid transparent' }}
            >
              ⚙️ 账号设置
            </div>
            <div
              onClick={() => { logout(); navigate('/'); }}
              style={{ padding: '1rem', cursor: 'pointer', color: '#e74c3c', borderTop: '1px solid #eee' }}
            >
              🚪 退出登录
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {activeTab === 'overview' && (
            <div>
              <h2 style={{ marginBottom: '1.5rem' }}>👋 欢迎回来，{user.nickname}</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3498db' }}>{myTransactions.filter(t => t.buyer_id === user.id).length}</div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>进行中交易</div>
                </div>
                <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⭐</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f39c12' }}>0</div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>我的收藏</div>
                </div>
                <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#27ae60' }}>{user.is_verified ? '已完成' : '未完成'}</div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>实名认证</div>
                </div>
              </div>

              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>快捷操作</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  <Link to="/category/all" className="card" style={{ padding: '1rem', textAlign: 'center', textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔍</div>
                    <div style={{ fontSize: '0.9rem' }}>浏览信息</div>
                  </Link>
                  <Link to="/create" className="card" style={{ padding: '1rem', textAlign: 'center', textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📝</div>
                    <div style={{ fontSize: '0.9rem' }}>发布信息</div>
                  </Link>
                  <Link to="/transactions" className="card" style={{ padding: '1rem', textAlign: 'center', textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💼</div>
                    <div style={{ fontSize: '0.9rem' }}>担保交易</div>
                  </Link>
                  {!user.is_verified && (
                    <Link to="/profile" className="card" style={{ padding: '1rem', textAlign: 'center', textDecoration: 'none', color: 'inherit', borderColor: '#e74c3c' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📋</div>
                      <div style={{ fontSize: '0.9rem', color: '#e74c3c' }}>去实名认证</div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h2 style={{ marginBottom: '1.5rem' }}>💰 我的交易</h2>
              {myTransactions.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                  <p style={{ color: '#666' }}>暂无交易记录</p>
                  <Link to="/category/all" className="btn btn-primary" style={{ marginTop: '1rem' }}>去浏览信息</Link>
                </div>
              ) : (
                myTransactions.map(t => (
                  <div key={t.id} className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>{t.listing_title || '交易信息'}</h4>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                          交易金额：¥{t.amount} · 创建时间：{new Date(t.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', color: 'white', background: getStatusColor(t.status) }}>
                        {getStatusText(t.status)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div>
              <h2 style={{ marginBottom: '1.5rem' }}>⭐ 我的收藏</h2>
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
                <p style={{ color: '#666' }}>收藏功能开发中...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
