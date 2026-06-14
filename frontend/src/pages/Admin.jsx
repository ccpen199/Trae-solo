import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [whitelist, setWhitelist] = useState([]);
  const [logs, setLogs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showAddWhitelist, setShowAddWhitelist] = useState(false);
  const [newWhitelist, setNewWhitelist] = useState({ phone: '', category_id: '', reason: '' });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
    loadCategories();
  }, [user, activeMenu]);

  const loadCategories = async () => {
    try {
      const res = await api.get('/listings/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('加载分类失败', err);
    }
  };

  const loadData = async () => {
    try {
      if (activeMenu === 'dashboard') {
        const res = await api.get('/admin/dashboard');
        setDashboard(res.data);
      } else if (activeMenu === 'listings') {
        const res = await api.get('/admin/listings');
        setListings(res.data.listings);
      } else if (activeMenu === 'reports') {
        const res = await api.get('/admin/reports');
        setReports(res.data.reports);
      } else if (activeMenu === 'whitelist') {
        const res = await api.get('/admin/whitelist');
        setWhitelist(res.data);
      } else if (activeMenu === 'logs') {
        const res = await api.get('/admin/logs');
        setLogs(res.data.logs);
      } else if (activeMenu === 'transactions') {
        const res = await api.get('/transactions/my');
        setTransactions(res.data);
      }
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const handleVerifyListing = async (id) => {
    try {
      await api.post(`/admin/listings/${id}/verify`);
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleOfflineListing = async (id) => {
    try {
      await api.post(`/admin/listings/${id}/offline`, { reason: '管理员下线' });
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleReport = async (id, action) => {
    try {
      await api.post(`/admin/reports/${id}/handle`, { action });
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleAddWhitelist = async () => {
    try {
      if (!newWhitelist.phone) {
        alert('请输入手机号');
        return;
      }
      await api.post('/admin/whitelist', {
        phone: newWhitelist.phone,
        user_id: 0,
        category_id: newWhitelist.category_id || 0,
        reason: newWhitelist.reason || '手动添加'
      });
      setShowAddWhitelist(false);
      setNewWhitelist({ phone: '', category_id: '', reason: '' });
      loadData();
      alert('添加成功');
    } catch (err) {
      alert('操作失败');
    }
  };

  if (!user) return null;
  if (user.role !== 'agent') {
    return (
      <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h2>无访问权限</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>此页面仅城市运营人员可访问</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">返回首页</button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="sidebar-layout">
        <div className="sidebar">
          <div className="sidebar-menu">
            <div
              className={`sidebar-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveMenu('dashboard')}
            >
              📊 数据概览
            </div>
            <div
              className={`sidebar-item ${activeMenu === 'listings' ? 'active' : ''}`}
              onClick={() => setActiveMenu('listings')}
            >
              📋 信息管理
            </div>
            <div
              className={`sidebar-item ${activeMenu === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveMenu('reports')}
            >
              🚨 举报处理
            </div>
            <div
              className={`sidebar-item ${activeMenu === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveMenu('transactions')}
            >
              💸 交易监控
            </div>
            <div
              className={`sidebar-item ${activeMenu === 'whitelist' ? 'active' : ''}`}
              onClick={() => setActiveMenu('whitelist')}
            >
              ✅ 白名单管理
            </div>
            <div
              className={`sidebar-item ${activeMenu === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveMenu('logs')}
            >
              📝 操作日志
            </div>
          </div>
        </div>
        <div className="sidebar-content">
          {activeMenu === 'dashboard' && dashboard && (
            <>
              <h2 style={{ marginBottom: '1rem' }}>数据概览</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{dashboard.userCount}</div>
                  <div className="stat-label">用户总数</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{dashboard.listingCount}</div>
                  <div className="stat-label">有效信息</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{dashboard.transactionCount}</div>
                  <div className="stat-label">交易总数</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{dashboard.reportCount}</div>
                  <div className="stat-label">待处理举报</div>
                </div>
              </div>
            </>
          )}

          {activeMenu === 'listings' && (
            <>
              <h2 style={{ marginBottom: '1rem' }}>信息管理</h2>
              <div className="card">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>标题</th>
                      <th>分类</th>
                      <th>发布者</th>
                      <th>状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.title}</td>
                        <td>{item.category_name}</td>
                        <td>{item.author_name}</td>
                        <td>
                          {item.status === 1 ? (
                            <span className="tag tag-success">正常</span>
                          ) : (
                            <span className="tag">已下线</span>
                          )}
                        </td>
                        <td>
                          {item.status === 1 && (
                            <>
                              {!item.is_verified && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  style={{ marginRight: '0.5rem' }}
                                  onClick={() => handleVerifyListing(item.id)}
                                >
                                  核验
                                </button>
                              )}
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleOfflineListing(item.id)}
                              >
                                下线
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeMenu === 'reports' && (
            <>
              <h2 style={{ marginBottom: '1rem' }}>举报处理</h2>
              <div className="card">
                {reports.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    暂无举报
                  </p>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>关联信息</th>
                        <th>举报原因</th>
                        <th>举报人</th>
                        <th>状态</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((item) => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>{item.listing_title || '-'}</td>
                          <td>{item.reason}</td>
                          <td>{item.reporter_name || '-'}</td>
                          <td>
                            {item.status === 0 ? (
                              <span className="tag tag-warning">待处理</span>
                            ) : (
                              <span className="tag tag-success">已处理</span>
                            )}
                          </td>
                          <td>
                            {item.status === 0 && (
                              <>
                                <button
                                  className="btn btn-danger btn-sm"
                                  style={{ marginRight: '0.5rem' }}
                                  onClick={() => handleReport(item.id, 'offline')}
                                >
                                  下线信息
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleReport(item.id, 'ignore')}
                                >
                                  忽略
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {activeMenu === 'whitelist' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>白名单管理</h2>
                <button className="btn btn-primary" onClick={() => setShowAddWhitelist(true)}>
                  + 添加白名单
                </button>
              </div>
              
              {showAddWhitelist && (
                <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem', background: '#f8f9fa' }}>
                  <h4 style={{ margin: '0 0 1rem 0' }}>添加城市运营白名单</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>手机号 *</label>
                      <input
                        type="text"
                        value={newWhitelist.phone}
                        onChange={(e) => setNewWhitelist({ ...newWhitelist, phone: e.target.value })}
                        placeholder="请输入手机号"
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>准入分类</label>
                      <select
                        value={newWhitelist.category_id}
                        onChange={(e) => setNewWhitelist({ ...newWhitelist, category_id: e.target.value })}
                      >
                        <option value="">全平台运营</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>准入理由</label>
                    <input
                      type="text"
                      value={newWhitelist.reason}
                      onChange={(e) => setNewWhitelist({ ...newWhitelist, reason: e.target.value })}
                      placeholder="请输入准入理由"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={handleAddWhitelist}>确认添加</button>
                    <button className="btn btn-secondary" onClick={() => setShowAddWhitelist(false)}>取消</button>
                  </div>
                </div>
              )}

              <div className="card">
                {whitelist.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    暂无白名单
                  </p>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>手机号</th>
                        <th>用户</th>
                        <th>分类</th>
                        <th>原因</th>
                        <th>添加时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {whitelist.map((item) => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td><code>{item.phone || '-'}</code></td>
                          <td>{item.user_name || '未注册'}</td>
                          <td>{item.category_name || '全平台'}</td>
                          <td>{item.reason}</td>
                          <td>{item.created_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {activeMenu === 'transactions' && (
            <>
              <h2 style={{ marginBottom: '1rem' }}>交易监控</h2>
              <div className="card">
                {transactions.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    暂无交易记录
                  </p>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>信息标题</th>
                        <th>交易金额</th>
                        <th>定金</th>
                        <th>买家</th>
                        <th>卖家</th>
                        <th>状态</th>
                        <th>创建时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((item) => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>{item.listing_title}</td>
                          <td>¥{item.amount}</td>
                          <td>¥{item.deposit_amount}</td>
                          <td>{item.buyer_name}</td>
                          <td>{item.seller_name}</td>
                          <td>
                            <span className={`tag ${item.status === 'completed' ? 'tag-success' : (item.status === 'deposit_frozen' ? '' : 'tag-warning')}`}>
                              {item.status === 'deposit_pending' ? '待付定金' :
                               item.status === 'deposit_frozen' ? '定金冻结' :
                               item.status === 'completed' ? '已完成' : item.status}
                            </span>
                          </td>
                          <td>{item.created_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {activeMenu === 'logs' && (
            <>
              <h2 style={{ marginBottom: '1rem' }}>操作日志</h2>
              <div className="card">
                <table className="table">
                  <thead>
                    <tr>
                      <th>时间</th>
                      <th>操作人</th>
                      <th>动作</th>
                      <th>目标类型</th>
                      <th>目标ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((item) => (
                      <tr key={item.id}>
                        <td>{item.created_at}</td>
                        <td>{item.operator_name || '-'}</td>
                        <td>{item.action}</td>
                        <td>{item.target_type || '-'}</td>
                        <td>{item.target_id || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;
