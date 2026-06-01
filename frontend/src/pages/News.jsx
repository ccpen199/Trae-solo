import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { newsAPI } from '../api/client';
import useAuthStore from '../store/authStore';

function News() {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const [news, setNews] = useState([]);
  const [hotNews, setHotNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('type') || 'all');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    title: '',
    content: '',
    location: '',
    contact_phone: '',
  });
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    page: parseInt(searchParams.get('page')) || 1,
    pageSize: 10,
  });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadNews();
    loadHotNews();
  }, [filters, activeTab]);

  const loadNews = async () => {
    try {
      setLoading(true);
      const params = { page: filters.page, pageSize: filters.pageSize };
      if (filters.keyword) params.keyword = filters.keyword;
      if (activeTab === 'hot') {
        params.is_hot = 1;
      } else if (activeTab === 'ugc') {
        params.source = 'ugc';
      } else if (activeTab !== 'all') {
        params.type = activeTab;
      }
      const res = await newsAPI.getNews(params);
      setNews(res.data.news || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('加载失败', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHotNews = async () => {
    try {
      const res = await newsAPI.getHotNews({ pageSize: 5 });
      setHotNews(res.data.hotNews || []);
    } catch (err) {
      console.error('加载热点失败', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    syncParams({ ...filters, page: 1 });
  };

  const syncParams = (f) => {
    const params = {};
    Object.keys(f).forEach(k => {
      if (f[k]) params[k] = f[k];
    });
    if (activeTab !== 'all') params.type = activeTab;
    setSearchParams(params);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilters({ ...filters, page: 1 });
  };

  const handlePageChange = (p) => {
    setFilters({ ...filters, page: p });
    syncParams({ ...filters, page: p });
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('请先登录');
      return;
    }
    try {
      await newsAPI.report(reportForm);
      alert('爆料提交成功！请等待社区审核员审核');
      setShowReportModal(false);
      setReportForm({ title: '', content: '', location: '', contact_phone: '' });
    } catch (err) {
      alert(err.response?.data?.message || '提交失败');
    }
  };

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'hot', label: '本地热点' },
    { key: 'government', label: '政务通知' },
    { key: 'ugc', label: '居民爆料' },
    { key: 'life', label: '便民资讯' },
    { key: 'event', label: '活动预告' },
  ];

  const totalPages = Math.ceil(total / filters.pageSize);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">本地资讯</h1>
        {user && (
          <button className="btn btn-primary" onClick={() => setShowReportModal(true)}>
            📢 我要爆料
          </button>
        )}
      </div>

      <div className="news-layout">
        <div className="news-main">
          <div className="filter-card card">
            <form onSubmit={handleSearch} className="filter-form">
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <input
                    type="text"
                    placeholder="搜索关键词..."
                    value={filters.keyword}
                    onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-primary">搜索</button>
              </div>
            </form>
          </div>

          <div className="tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading">加载中...</div>
          ) : news.length === 0 ? (
            <div className="empty">暂无资讯</div>
          ) : (
            <>
              <div className="news-list">
                {news.map((item) => (
                  <Link key={item.id} to={`/news/${item.id}`} className="news-item card">
                    <div className="news-item-header">
                      <h3>{item.title}</h3>
                      <div className="news-badges">
                        <span className={`badge badge-${item.type === 'government' ? 'warning' : item.type === 'hot' ? 'danger' : item.source === 'ugc' ? 'success' : 'info'}`}>
                          {item.source === 'ugc' ? '居民爆料' : item.type === 'government' ? '政务' : item.type === 'hot' ? '热点' : item.type === 'life' ? '便民' : item.type === 'event' ? '活动' : '资讯'}
                        </span>
                        {item.review_status === '社区审核员已通过' && <span className="badge badge-success">🟢已审</span>}
                        {item.review_status === '待审核' && <span className="badge badge-warning">🟡待审</span>}
                        {item.review_status === '审核拒绝' && <span className="badge badge-danger">🔴已拒</span>}
                        {item.review_status === '管理员已发布' && <span className="badge badge-info">📢已发布</span>}
                      </div>
                    </div>
                    <p className="news-summary">{item.summary || item.content.substring(0, 100)}...</p>
                    <div className="news-meta">
                      <span>📍 {item.region_name}</span>
                      <span>👁 {item.views || 0}</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      {item.publisher_name && <span>发布者：{item.publisher_name}</span>}
                      {item.push_region_name && <span>📌 推送至：{item.push_region_name}辖区</span>}
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn btn-secondary"
                    disabled={filters.page <= 1}
                    onClick={() => handlePageChange(filters.page - 1)}
                  >上一页</button>
                  <span className="page-info">第 {filters.page} / {totalPages} 页，共 {total} 条</span>
                  <button
                    className="btn btn-secondary"
                    disabled={filters.page >= totalPages}
                    onClick={() => handlePageChange(filters.page + 1)}
                  >下一页</button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="news-sidebar">
          <div className="card">
            <h3>🔥 本地热点</h3>
            {hotNews.length > 0 ? (
              <div className="hot-list">
                {hotNews.map((item, idx) => (
                  <Link key={item.id} to={`/news/${item.id}`} className="hot-item">
                    <span className={`hot-rank ${idx < 3 ? 'top' : ''}`}>{idx + 1}</span>
                    <span className="hot-title">{item.title}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty">暂无热点</div>
            )}
          </div>

          <div className="card">
            <h3>💡 爆料须知</h3>
            <ul className="tips-list">
              <li>爆料内容需真实客观，禁止造谣传谣</li>
              <li>涉及个人隐私需打码处理</li>
              <li>社区审核员将在24小时内审核</li>
              <li>优质爆料将获得积分奖励</li>
              <li>政务通知由区县管理员定向推送</li>
            </ul>
          </div>
        </div>
      </div>

      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>居民爆料</h3>
            <form onSubmit={handleReport}>
              <div className="form-group">
                <label>标题 *</label>
                <input
                  type="text"
                  value={reportForm.title}
                  onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                  placeholder="请简要描述事件"
                  required
                />
              </div>
              <div className="form-group">
                <label>详细内容 *</label>
                <textarea
                  value={reportForm.content}
                  onChange={(e) => setReportForm({ ...reportForm, content: e.target.value })}
                  placeholder="请详细描述事件经过、时间、地点等信息"
                  rows="5"
                  required
                />
              </div>
              <div className="form-group">
                <label>发生地点</label>
                <input
                  type="text"
                  value={reportForm.location}
                  onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                  placeholder="如：XX街道XX小区"
                />
              </div>
              <div className="form-group">
                <label>联系电话</label>
                <input
                  type="tel"
                  value={reportForm.contact_phone}
                  onChange={(e) => setReportForm({ ...reportForm, contact_phone: e.target.value })}
                  placeholder="便于核实情况（不公开）"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReportModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">提交爆料</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default News;
