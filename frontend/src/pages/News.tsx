import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsApi } from '@/services/api';
import { News as NewsItem, PaginatedResponse } from '@/types';

type NewsType = 'home' | 'store' | 'announcement';

const NewsPage = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NewsType | 'all'>('all');
  const [pagination, setPagination] = useState<PaginatedResponse<NewsItem>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchNews();
  }, [filter, pagination.page]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        is_active: true
      };
      if (filter !== 'all') {
        params.type = filter;
      }

      const response = await newsApi.getNews(params);
      if (response.data.success && response.data.data) {
        setPagination(response.data.data);
        setNews(response.data.data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  const typeMap: Record<string, { label: string; color: string }> = {
    home: { label: '首页新闻', color: '#3b82f6' },
    store: { label: '书店新闻', color: '#10b981' },
    announcement: { label: '滚动公告', color: '#f59e0b' }
  };

  const getTypeInfo = (type: string) => {
    return typeMap[type] || { label: '其他', color: '#64748b' };
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1 className="section-title">新闻公告</h1>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(['all', 'home', 'store', 'announcement'] as const).map((t) => (
          <button
            key={t}
            className={filter === t ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
            onClick={() => {
              setFilter(t);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          >
            {t === 'all' ? '全部' : getTypeInfo(t).label}
          </button>
        ))}
      </div>

      {!news || news.length === 0 ? (
        <div className="card card-body">
          <div className="empty-state">
            <div className="empty-state-icon">📰</div>
            <p className="empty-state-text">暂无新闻</p>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {news.map((item) => (
              <div 
                key={item.id}
                className="card card-body"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/news/${item.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h2 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: 'bold', 
                    marginBottom: 0,
                    flex: 1
                  }}>
                    {item.title}
                  </h2>
                  <span style={{ 
                    background: getTypeInfo(item.type).color, 
                    color: 'white', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    marginLeft: '1rem',
                    whiteSpace: 'nowrap'
                  }}>
                    {getTypeInfo(item.type).label}
                  </span>
                </div>
                
                <p style={{ color: '#64748b', marginBottom: '0.75rem', lineHeight: '1.6' }}>
                  {item.content?.substring(0, 200)}...
                </p>
                
                <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                  发布时间：{new Date(item.created_at).toLocaleDateString('zh-CN')}
                </p>
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="pagination mt-8">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                上一页
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(p => Math.abs(p - pagination.page) <= 2 || p === 1 || p === pagination.totalPages)
                .map((p) => (
                  <button
                    key={p}
                    className={p === pagination.page ? 'active' : ''}
                    onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                  >
                    {p}
                  </button>
                ))}
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NewsPage;
