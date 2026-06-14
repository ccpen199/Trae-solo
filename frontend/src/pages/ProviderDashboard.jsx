import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function ProviderDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [myListings, setMyListings] = useState([]);
  const [myTransactions, setMyTransactions] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadMyListings();
    loadTransactions();
    loadCertificates();
  }, []);

  const loadMyListings = async () => {
    try {
      const res = await api.get('/listings/mine');
      setMyListings(res.data.listings || []);
    } catch (err) {
      console.error('加载我的信息失败', err);
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      setMyTransactions(res.data.transactions || []);
    } catch (err) {
      console.error('加载交易失败', err);
    }
  };

  const loadCertificates = async () => {
    try {
      const res = await api.get('/auth/profile');
      setCertificates(res.data.certificates || []);
    } catch (err) {
      console.error('加载证书失败', err);
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

  const getListingStatusText = (status) => {
    const map = { 1: '已上线', 2: '已下线', 0: '待审核' };
    return map[status] || status;
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>请先登录</p>
        <Link to="/login" className="btn btn-primary">去登录</Link>
      </div>
    );
  }

  const sellerTransactions = myTransactions.filter(t => t.seller_id === user.id);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <div style={{ width: '240px', flexShrink: 0 }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #27ae60, #2ecc71)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem', fontWeight: 'bold', margin: '0 auto 1rem' }}>
                {user.nickname?.charAt(0) || '服'}
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>{user.nickname}</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                🔧 服务提供者
              </p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>
                {user.is_verified ? <span style={{ color: '#27ae60' }}>✓ 已实名认证</span> : <span style={{ color: '#e74c3c' }}>未实名认证</span>}
              </p>
            </div>
            <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>信用分：<strong>{user.credit_score || 100}</strong></p>
              <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>已发布：<strong>{myListings.length}</strong> 条</p>
              <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>资质证书：<strong>{certificates.length}</strong> 个</p>
            </div>
          </div>

          <div className="card" style={{ marginTop: '1rem', padding: '0' }}>
            <div
              onClick={() => setActiveTab('overview')}
              style={{ padding: '1rem', cursor: 'pointer', background: activeTab === 'overview' ? '#f8f9fa' : 'transparent', borderLeft: activeTab === 'overview' ? '3px solid #27ae60' : '3px solid transparent' }}
            >
              📊 工作台概览
            </div>
            <div
              onClick={() => setActiveTab('listings')}
              style={{ padding: '1rem', cursor: 'pointer', background: activeTab === 'listings' ? '#f8f9fa' : 'transparent', borderLeft: activeTab === 'listings' ? '3px solid #27ae60' : '3px solid transparent' }}
            >
              📋 我的发布
            </div>
            <div
              onClick={() => setActiveTab('orders')}
              style={{ padding: '1rem', cursor: 'pointer', background: activeTab === 'orders' ? '#f8f9fa' : 'transparent', borderLeft: activeTab === 'orders' ? '3px solid #27ae60' : '3px solid transparent' }}
            >
              📦 服务订单
            </div>
            <div
              onClick={() => setActiveTab('certificates')}
              style={{ padding: '1rem', cursor: 'pointer', background: activeTab === 'certificates' ? '#f8f9fa' : 'transparent', borderLeft: activeTab === 'certificates' ? '3px solid #27ae60' : '3px solid transparent' }}
            >
              📜 资质管理
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
              <h2 style={{ marginBottom: '1.5rem' }}>👋 服务者工作台，{user.nickname}</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3498db' }}>{myListings.length}</div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>已发布信息</div>
                </div>
                <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f39c12' }}>{sellerTransactions.length}</div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>服务订单</div>
                </div>
                <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📜</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#9b59b6' }}>{certificates.length}</div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>资质证书</div>
                </div>
                <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⭐</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#27ae60' }}>{user.credit_score || 100}</div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>信用评分</div>
                </div>
              </div>

              {!user.is_verified && (
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: '#fff3cd', border: '1px solid #ffeaa7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>⚠️ 未完成实名认证</strong>
                      <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>完成实名认证后，您发布的信息将获得「已认证」标识，提高可信度和接单率</p>
                    </div>
                    <Link to="/profile" className="btn btn-primary">立即认证</Link>
                  </div>
                </div>
              )}

              {certificates.length === 0 && (
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: '#e8f4fd', border: '1px solid #74b9ff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>💼 暂无资质证书</strong>
                      <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>上传资质证书并通过核验后，您将获得「资质认证」标识，提升专业形象</p>
                    </div>
                    <Link to="/profile" className="btn btn-secondary">上传证书</Link>
                  </div>
                </div>
              )}

              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>快捷操作</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  <Link to="/create" className="card" style={{ padding: '1rem', textAlign: 'center', textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>➕</div>
                    <div style={{ fontSize: '0.9rem' }}>发布新服务</div>
                  </Link>
                  <Link to="/category/all" className="card" style={{ padding: '1rem', textAlign: 'center', textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔍</div>
                    <div style={{ fontSize: '0.9rem' }}>浏览市场</div>
                  </Link>
                  <div className="card" style={{ padding: '1rem', textAlign: 'center', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setActiveTab('orders')}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📦</div>
                    <div style={{ fontSize: '0.9rem' }}>处理订单</div>
                  </div>
                  <Link to="/profile" className="card" style={{ padding: '1rem', textAlign: 'center', textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📜</div>
                    <div style={{ fontSize: '0.9rem' }}>管理资质</div>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'listings' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>📋 我的发布</h2>
                <Link to="/create" className="btn btn-primary">+ 发布新信息</Link>
              </div>
              {myListings.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                  <p style={{ color: '#666' }}>暂无发布的信息</p>
                  <Link to="/create" className="btn btn-primary" style={{ marginTop: '1rem' }}>立即发布</Link>
                </div>
              ) : (
                myListings.map(l => (
                  <div key={l.id} className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>{l.title}</h4>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                          价格：¥{l.price} · 浏览：{l.view_count || 0}次 · {new Date(l.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', color: 'white', background: l.status === 1 ? '#27ae60' : '#95a5a6' }}>
                          {getListingStatusText(l.status)}
                        </span>
                        {l.is_verified && <span style={{ padding: '4px 8px', background: '#3498db', color: 'white', borderRadius: '12px', fontSize: '0.75rem' }}>已核验</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h2 style={{ marginBottom: '1.5rem' }}>📦 服务订单</h2>
              {sellerTransactions.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                  <p style={{ color: '#666' }}>暂无服务订单</p>
                  <Link to="/create" className="btn btn-primary" style={{ marginTop: '1rem' }}>发布服务吸引客户</Link>
                </div>
              ) : (
                sellerTransactions.map(t => (
                  <div key={t.id} className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>{t.listing_title || '服务订单'}</h4>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                          订单金额：¥{t.amount} · 定金：¥{t.deposit_amount || 0} · 创建时间：{new Date(t.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', color: 'white', background: getStatusColor(t.status) }}>
                          {getStatusText(t.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'certificates' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>📜 资质证书管理</h2>
                <Link to="/profile" className="btn btn-primary">+ 上传新证书</Link>
              </div>
              {certificates.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📜</div>
                  <p style={{ color: '#666' }}>暂无资质证书</p>
                  <p style={{ color: '#999', fontSize: '0.9rem', marginTop: '0.5rem' }}>上传技能证书、职业资格证等，通过OCR核验后展示在您的服务页面</p>
                </div>
              ) : (
                certificates.map(c => (
                  <div key={c.id} className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>{c.cert_name || c.cert_type}</h4>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                          发证机构：{c.issuer || '待填写'} · 证书编号：{c.cert_number || '待填写'}
                        </p>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', color: 'white', background: c.verified_status === 1 ? '#27ae60' : '#f39c12' }}>
                        {c.verified_status === 1 ? '已核验' : '待核验'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProviderDashboard;
