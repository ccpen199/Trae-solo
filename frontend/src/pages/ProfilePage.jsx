import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { useStore } from '../store';

function ProfilePage() {
  const { user, showToast } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState('info');
  const [myListings, setMyListings] = useState([]);
  const [history, setHistory] = useState([]);
  const [myReports, setMyReports] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth', { state: { from: { pathname: '/profile' } } });
      return;
    }
    if (tab === 'my') {
      api.get('/listings/my').then(res => {
        setMyListings(res.data.listings);
      });
    }
    if (tab === 'history') {
      api.get('/listings/history').then(res => {
        setHistory(res.data.listings || []);
      }).catch(() => setHistory([]));
    }
    if (tab === 'reports') {
      api.get('/reports/my').then(res => {
        setMyReports(res.data.reports || []);
      }).catch(() => setMyReports([]));
    }
  }, [user, tab]);

  if (!user) return null;

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 60 }}>
      <div style={{ display: 'flex', gap: 30 }}>
        <div style={{ width: 200, background: '#fff', borderRadius: 12, padding: 20, height: 'fit-content' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 12px' }}>
              {user.nickname?.[0] || '👤'}
            </div>
            <div style={{ fontWeight: 600 }}>{user.nickname}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              {user.user_type === 'admin' ? '管理员' : user.user_type === 'b' ? '商家' : '普通用户'}
            </div>
          </div>
          
          <div className={`admin-menu-item ${tab === 'info' ? 'active' : ''}`} style={{ borderRadius: 8 }} onClick={() => setTab('info')}>个人信息</div>
          <div className={`admin-menu-item ${tab === 'my' ? 'active' : ''}`} style={{ borderRadius: 8 }} onClick={() => setTab('my')}>我的发布</div>
          <div className={`admin-menu-item ${tab === 'history' ? 'active' : ''}`} style={{ borderRadius: 8 }} onClick={() => setTab('history')}>浏览足迹</div>
          <div className={`admin-menu-item ${tab === 'reports' ? 'active' : ''}`} style={{ borderRadius: 8 }} onClick={() => setTab('reports')}>我的举报</div>
          {user.user_type === 'c' && (
            <div className={`admin-menu-item ${tab === 'merchant_apply' ? 'active' : ''}`} style={{ borderRadius: 8 }} onClick={() => setTab('merchant_apply')}>申请商家</div>
          )}
        </div>

        <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: 30 }}>
          {tab === 'info' && (
            <div>
              <h2 style={{ marginBottom: 30 }}>个人信息</h2>
              <div className="form-group">
                <label className="form-label">手机号</label>
                <div className="form-input" style={{ background: '#f5f5f5' }}>{user.phone}</div>
              </div>
              <div className="form-group">
                <label className="form-label">用户类型</label>
                <div className="form-input" style={{ background: '#f5f5f5' }}>
                  {user.user_type === 'admin' ? '管理员' : user.user_type === 'b' ? '商家' : '普通用户'}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">认证状态</label>
                <div className="form-input" style={{ background: '#f5f5f5' }}>
                  {user.is_verified ? <span style={{ color: '#52c41a' }}>已认证</span> : '未认证'}
                </div>
              </div>
            </div>
          )}

          {tab === 'my' && (
            <div>
              <h2 style={{ marginBottom: 30 }}>我的发布</h2>
              {myListings.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: 60 }}>
                  暂无发布信息
                  <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/publish')}>
                    去发布
                  </button>
                </div>
              ) : (
                <div className="listing-grid">
                  {myListings.map(listing => (
                    <div
                      key={listing.id}
                      className="listing-card"
                      onClick={() => navigate(`/listing/${listing.id}`)}
                    >
                      {listing.images?.[0] ? (
                        <img src={listing.images[0]} alt="" className="listing-image" />
                      ) : (
                        <div className="listing-image" />
                      )}
                      <div className="listing-content">
                        <h3 className="listing-title">{listing.title}</h3>
                        <div className="listing-price">
                          {listing.price_min ? `¥${listing.price_min}` : '面议'}
                        </div>
                        <div className="listing-meta">
                          <span className={`badge badge-${listing.status}`}>
                            {listing.status === 'active' ? '上架中' : listing.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div>
              <h2 style={{ marginBottom: 30 }}>浏览足迹</h2>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: 60 }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🕐</div>
                  暂无浏览记录
                  <div style={{ marginTop: 12 }}>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>去浏览</button>
                  </div>
                </div>
              ) : (
                <div className="listing-grid">
                  {history.map(listing => (
                    <div key={listing.id} className="listing-card" onClick={() => navigate(`/listing/${listing.id}`)}>
                      <div className="listing-content">
                        <h3 className="listing-title">{listing.title}</h3>
                        <div className="listing-price">{listing.price_min ? `¥${listing.price_min.toLocaleString()}` : '面议'}</div>
                        <div className="listing-meta">
                          <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'reports' && (
            <div>
              <h2 style={{ marginBottom: 30 }}>我的举报</h2>
              {myReports.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: 60 }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🚩</div>
                  暂无举报记录
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>类型</th>
                      <th>关联信息</th>
                      <th>原因</th>
                      <th>状态</th>
                      <th>处理时间</th>
                      <th>创建时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myReports.map(r => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.report_type}</td>
                        <td>{r.listing_title || '-'}</td>
                        <td style={{ maxWidth: 200 }}>{r.reason}</td>
                        <td>
                          <span className={`badge badge-${r.status === 'pending' ? 'pending' : r.status === 'resolved' ? 'success' : r.status === 'rejected' ? 'warning' : 'active'}`}>
                            {r.status === 'pending' ? '待处理' : r.status === 'processing' ? '处理中' : r.status === 'resolved' ? '已解决' : '已驳回'}
                          </span>
                        </td>
                        <td>{r.handled_at ? new Date(r.handled_at).toLocaleDateString() : '-'}</td>
                        <td>{new Date(r.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'merchant_apply' && <MerchantApplyForm />}
        </div>
      </div>
    </div>
  );
}

function MerchantApplyForm() {
  const [formData, setFormData] = useState({
    company_name: '',
    business_license: ''
  });
  const { showToast } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/merchants/apply', formData);
      showToast('申请已提交，请等待审核');
      navigate('/');
    } catch (err) {
      showToast(err.response?.data?.error || '申请失败', 'error');
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 30 }}>申请成为商家</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
        <div className="form-group">
          <label className="form-label">公司名称</label>
          <input
            type="text"
            className="form-input"
            value={formData.company_name}
            onChange={e => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
            placeholder="请输入公司名称"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">营业执照号</label>
          <input
            type="text"
            className="form-input"
            value={formData.business_license}
            onChange={e => setFormData(prev => ({ ...prev, business_license: e.target.value }))}
            placeholder="请输入营业执照号"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: 16 }}>
          提交申请
        </button>
      </form>
    </div>
  );
}

export default ProfilePage;
