import React, { useState, useEffect } from 'react';
import api, { useStore } from '../store';
import { useNavigate } from 'react-router-dom';

const REPORT_STATUSES = [
  { value: 'pending', label: '待处理', color: 'pending' },
  { value: 'processing', label: '处理中', color: 'active' },
  { value: 'resolved', label: '已解决', color: 'success' },
  { value: 'rejected', label: '已驳回', color: 'warning' },
];

function AdminPage() {
  const { user, showToast } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [reports, setReports] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [flaggedListings, setFlaggedListings] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [handleNote, setHandleNote] = useState('');

  useEffect(() => {
    if (!user || user.user_type !== 'admin') {
      showToast('需要管理员权限', 'error');
      navigate('/');
      return;
    }

    if (tab === 'dashboard') {
      api.get('/admin/stats').then(res => setStats(res.data.stats));
    }
    if (tab === 'reports') {
      api.get('/admin/reports').then(res => setReports(res.data.reports));
    }
    if (tab === 'tickets') {
      api.get('/admin/tickets').then(res => setTickets(res.data.tickets));
    }
    if (tab === 'merchants') {
      api.get('/admin/merchants/applications').then(res => setMerchants(res.data.merchants));
    }
    if (tab === 'fraud') {
      api.get('/admin/flagged-listings').then(res => setFlaggedListings(res.data.listings));
    }
  }, [user, tab]);

  if (!user || user.user_type !== 'admin') return null;

  const handleApproveMerchant = async (id) => {
    try {
      await api.post('/admin/merchants/approve', { merchant_id: id });
      showToast('已通过审核');
      setMerchants(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      showToast('操作失败', 'error');
    }
  };

  const handleReport = async (id, status) => {
    try {
      await api.post('/admin/reports/handle', { report_id: id, status, handle_note: handleNote });
      showToast('处理完成');
      setReports(prev => prev.map(r => r.id === id ? { ...r, status, handle_note: handleNote, handled_at: new Date().toISOString() } : r));
      setSelectedReport(null);
      setHandleNote('');
    } catch (err) {
      showToast('操作失败', 'error');
    }
  };

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div className={`admin-menu-item ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>数据概览</div>
        <div className={`admin-menu-item ${tab === 'merchants' ? 'active' : ''}`} onClick={() => setTab('merchants')}>商家审核</div>
        <div className={`admin-menu-item ${tab === 'reports' ? 'active' : ''}`} onClick={() => setTab('reports')}>举报管理</div>
        <div className={`admin-menu-item ${tab === 'tickets' ? 'active' : ''}`} onClick={() => setTab('tickets')}>工单系统</div>
        <div className={`admin-menu-item ${tab === 'fraud' ? 'active' : ''}`} onClick={() => setTab('fraud')}>虚假信息识别</div>
        <div className={`admin-menu-item ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>用户管理</div>
      </div>

      <div className="admin-content">
        {tab === 'dashboard' && (
          <div>
            <h2 style={{ marginBottom: 24 }}>数据概览</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.total_users || 0}</div>
                <div className="stat-label">用户总数</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.total_listings || 0}</div>
                <div className="stat-label">有效信息</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.total_merchants || 0}</div>
                <div className="stat-label">认证商家</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.pending_reports || 0}</div>
                <div className="stat-label">待处理举报</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.pending_tickets || 0}</div>
                <div className="stat-label">待处理工单</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.pending_merchants || 0}</div>
                <div className="stat-label">待审核商家</div>
              </div>
            </div>
          </div>
        )}

        {tab === 'merchants' && (
          <div>
            <h2 style={{ marginBottom: 24 }}>商家审核</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>公司名称</th>
                  <th>申请人</th>
                  <th>手机号</th>
                  <th>营业执照</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {merchants.filter(m => !m.is_approved).map(m => (
                  <tr key={m.id}>
                    <td>{m.id}</td>
                    <td>{m.company_name}</td>
                    <td>{m.nickname}</td>
                    <td>{m.phone}</td>
                    <td>{m.business_license}</td>
                    <td><span className="badge badge-pending">待审核</span></td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn" style={{ background: '#f6ffed', color: '#52c41a' }} onClick={() => handleApproveMerchant(m.id)}>
                          通过
                        </button>
                        <button className="action-btn" style={{ background: '#fff1f0', color: '#ff4d4f' }}>
                          拒绝
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'reports' && (
          <div>
            <h2 style={{ marginBottom: 24 }}>举报管理</h2>
            {selectedReport ? (
              <div style={{ padding: 20, background: '#fff', borderRadius: 8, marginBottom: 20, border: '1px solid #e8e8e8' }}>
                <h3 style={{ marginBottom: 16 }}>处理举报 #{selectedReport.id}</h3>
                <div style={{ marginBottom: 12 }}>
                  <strong>类型：</strong>{selectedReport.report_type}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>原因：</strong>{selectedReport.reason}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>详细说明：</strong>{selectedReport.description || '无'}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>关联信息：</strong>
                  {selectedReport.listing_title ? (
                    <span style={{ color: '#1890ff', cursor: 'pointer' }} onClick={() => navigate(`/listing/${selectedReport.listing_id}`)}>
                      {selectedReport.listing_title}
                    </span>
                  ) : '无'}
                </div>
                <div className="form-group">
                  <label>处理备注</label>
                  <textarea className="form-input" value={handleNote} onChange={e => setHandleNote(e.target.value)} placeholder="请输入处理备注..." style={{ minHeight: 80 }} />
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                  <button className="btn btn-primary" onClick={() => handleReport(selectedReport.id, 'resolved')}>
                    下架并处理
                  </button>
                  <button className="btn btn-outline" onClick={() => handleReport(selectedReport.id, 'rejected')}>
                    驳回举报
                  </button>
                  <button className="btn btn-outline" onClick={() => setSelectedReport(null)}>
                    取消
                  </button>
                </div>
              </div>
            ) : null}
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>类型</th>
                  <th>原因</th>
                  <th>举报人</th>
                  <th>关联信息</th>
                  <th>状态</th>
                  <th>时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.report_type}</td>
                    <td style={{ maxWidth: 200 }}>{r.reason}</td>
                    <td>{r.reporter_name}</td>
                    <td>{r.listing_title || '-'}</td>
                    <td>
                      <span className={`badge badge-${REPORT_STATUSES.find(s => s.value === r.status)?.color || 'pending'}`}>
                        {REPORT_STATUSES.find(s => s.value === r.status)?.label || r.status}
                      </span>
                    </td>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn" style={{ background: '#e6f7ff', color: '#1890ff' }} onClick={() => setSelectedReport(r)}>
                          处理
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'tickets' && (
          <div>
            <h2 style={{ marginBottom: 24 }}>工单系统</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>标题</th>
                  <th>类型</th>
                  <th>用户</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.title}</td>
                    <td>{t.type}</td>
                    <td>{t.user_name}</td>
                    <td><span className={`badge badge-${t.status === 'open' ? 'pending' : 'active'}`}>{t.status}</span></td>
                    <td>{new Date(t.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn" style={{ background: '#e6f7ff', color: '#1890ff' }}>
                          查看
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'fraud' && (
          <div>
            <h2 style={{ marginBottom: 24 }}>虚假信息识别</h2>
            <div className="listing-grid">
              {flaggedListings.map(l => (
                <div key={l.id} className="listing-card" style={{ border: '2px solid #ff4d4f' }}>
                  <div className="listing-image" />
                  <div className="listing-content">
                    <h3 className="listing-title">{l.title}</h3>
                    <div style={{ color: '#ff4d4f', fontSize: 12, marginBottom: 8 }}>
                      风险评分: {(l.fraud_score * 100).toFixed(0)}%
                    </div>
                    <div className="action-btns">
                      <button className="action-btn" style={{ background: '#f6ffed', color: '#52c41a' }}>
                        放行
                      </button>
                      <button className="action-btn" style={{ background: '#fff1f0', color: '#ff4d4f' }}>
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div>
            <h2 style={{ marginBottom: 24 }}>用户管理</h2>
            <div style={{ textAlign: 'center', color: '#999', padding: 60 }}>用户管理功能开发中...</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPage;
