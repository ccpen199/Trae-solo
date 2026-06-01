import React, { useState, useEffect } from 'react';
import api, { useStore } from '../store';
import { useNavigate } from 'react-router-dom';

const LEAD_STATUSES = [
  { value: 'new', label: '新线索', color: 'pending' },
  { value: 'contacted', label: '已联系', color: 'active' },
  { value: 'converted', label: '已成交', color: 'success' },
  { value: 'lost', label: '已流失', color: 'warning' },
];

function MerchantPage() {
  const { user, showToast } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState('listings');
  const [leads, setLeads] = useState([]);
  const [listings, setListings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [leadFilter, setLeadFilter] = useState('');
  const [listingStatus, setListingStatus] = useState('active');

  useEffect(() => {
    if (!user || user.user_type !== 'b') {
      showToast('需要商家权限', 'error');
      navigate('/');
      return;
    }

    api.get('/merchants/profile').then(res => {
      setProfile(res.data.merchant);
    }).catch(() => {
      showToast('请先完成商家认证', 'error');
      navigate('/profile');
    });
  }, [user]);

  useEffect(() => {
    if (tab === 'leads') {
      const params = new URLSearchParams();
      if (leadFilter) params.set('status', leadFilter);
      api.get(`/merchants/leads?${params.toString()}`).then(res => setLeads(res.data.leads));
    }
    if (tab === 'listings') {
      api.get(`/merchants/listings?status=${listingStatus}`).then(res => setListings(res.data.listings));
    }
  }, [tab, leadFilter, listingStatus]);

  const handleLeadStatus = async (leadId, status) => {
    try {
      await api.post('/merchants/leads/status', { lead_id: leadId, status });
      showToast('状态已更新');
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    } catch {
      showToast('更新失败', 'error');
    }
  };

  const handleListingStatus = async (id, status) => {
    try {
      await api.put(`/listings/${id}`, { status });
      showToast('状态已更新');
      setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    } catch {
      showToast('更新失败', 'error');
    }
  };

  if (!user || user.user_type !== 'b') return null;

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div className={`admin-menu-item ${tab === 'listings' ? 'active' : ''}`} onClick={() => setTab('listings')}>我的房源</div>
        <div className={`admin-menu-item ${tab === 'leads' ? 'active' : ''}`} onClick={() => setTab('leads')}>线索管理</div>
        <div className={`admin-menu-item ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>数据统计</div>
        <div className={`admin-menu-item ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>商家设置</div>
      </div>

      <div className="admin-content">
        {tab === 'listings' && (
          <div>
          <h2 style={{ marginBottom: 24 }}>我的房源</h2>
          <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={() => navigate('/publish')}>
              + 发布新房源
            </button>
            <select className="form-input" style={{ width: 150 }} value={listingStatus} onChange={e => setListingStatus(e.target.value)}>
              <option value="active">上架中</option>
              <option value="inactive">已下架</option>
              <option value="sold">已成交</option>
            </select>
          </div>
          {listings.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: 60 }}>暂无房源，快去发布吧</div>
          ) : (
            <div className="listing-grid">
              {listings.map(listing => (
              <div key={listing.id} className="listing-card">
                <div className="listing-image" />
                <div className="listing-content">
                  <h3 className="listing-title">{listing.title}</h3>
                  <div className="listing-price">¥{listing.price_min?.toLocaleString() || '面议'}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <span className={`badge badge-${listing.status === 'active' ? 'active' : 'pending'}`}>
                      {listing.status === 'active' ? '上架中' : listing.status === 'sold' ? '已成交' : '已下架'}
                    </span>
                    <span className="tag">浏览 {listing.view_count || 0}</span>
                  </div>
                  <div className="action-btns" style={{ marginTop: 12 }}>
                    {listing.status === 'active' ? (
                      <button className="action-btn" style={{ background: '#fff1f0', color: '#ff4d4f' }} onClick={() => handleListingStatus(listing.id, 'inactive')}>
                        下架
                      </button>
                    ) : (
                      <button className="action-btn" style={{ background: '#f6ffed', color: '#52c41a' }} onClick={() => handleListingStatus(listing.id, 'active')}>
                        上架
                      </button>
                    )}
                    <button className="action-btn" style={{ background: '#e6f7ff', color: '#1890ff' }} onClick={() => navigate(`/listing/${listing.id}`)}>
                      查看
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      )}

        {tab === 'leads' && (
          <div>
            <h2 style={{ marginBottom: 24 }}>线索管理</h2>
            <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
              <select className="form-input" style={{ width: 150 }} value={leadFilter} onChange={e => setLeadFilter(e.target.value)}>
                <option value="">全部状态</option>
                {LEAD_STATUSES.map(s => (
                  <option key={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            {leads.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: 60 }}>暂无线索</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>房源</th>
                    <th>用户</th>
                    <th>联系方式</th>
                    <th>留言</th>
                    <th>状态</th>
                    <th>时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => (
                    <tr key={lead.id}>
                      <td>{lead.id}</td>
                      <td>{lead.listing_title}</td>
                      <td>{lead.user_name}</td>
                      <td>{lead.user_phone}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.message || '-'}</td>
                      <td>
                        <span className={`badge badge-${LEAD_STATUSES.find(s => s.value === lead.status)?.color || 'pending'}`}>
                          {LEAD_STATUSES.find(s => s.value === lead.status)?.label || lead.status}
                        </span>
                      </td>
                      <td>{new Date(lead.created_at).toLocaleDateString()}</td>
                      <td>
                        <select
                          value={lead.status}
                          onChange={e => handleLeadStatus(lead.id, e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d9d9d9', fontSize: 12 }}
                        >
                          {LEAD_STATUSES.map(s => (
                            <option key={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'stats' && profile && (
          <div>
            <h2 style={{ marginBottom: 24 }}>数据统计</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{profile.total_deals || 0}</div>
                <div className="stat-label">成交单数</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{profile.rating || 5.0}</div>
                <div className="stat-label">综合评分</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{profile.response_rate || 0}%</div>
                <div className="stat-label">响应率</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{leads.length}</div>
                <div className="stat-label">总线索数</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{listings.length}</div>
                <div className="stat-label">发布房源</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{profile.level || 1}</div>
                <div className="stat-label">商家等级</div>
              </div>
            </div>
          </div>
        )}

        {tab === 'profile' && profile && (
          <div>
            <h2 style={{ marginBottom: 24 }}>商家设置</h2>
            <div style={{ maxWidth: 600 }}>
              <div className="form-group">
                <label>公司名称</label>
                <input className="form-input" value={profile.company_name} disabled />
              </div>
              <div className="form-group">
                <label>营业执照号</label>
                <input className="form-input" value={profile.business_license || '-'} disabled />
              </div>
              <div className="form-group">
                <label>认证状态</label>
                <span className={`badge badge-${profile.is_approved ? 'active' : 'pending'}`} style={{ marginLeft: 12 }}>
                  {profile.is_approved ? '已认证' : '审核中'}
                </span>
              </div>
              <div className="form-group">
                <label>入驻时间</label>
                <input className="form-input" value={profile.merchant_created_at ? new Date(profile.merchant_created_at).toLocaleDateString() : '-'} disabled />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MerchantPage;
