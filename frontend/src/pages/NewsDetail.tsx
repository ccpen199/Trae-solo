import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { newsApi } from '@/services/api';
import { News } from '@/types';

const typeMap: Record<string, { label: string; color: string }> = {
  home: { label: '首页新闻', color: '#3b82f6' },
  store: { label: '书店新闻', color: '#10b981' },
  announcement: { label: '滚动公告', color: '#f59e0b' }
};

const getTypeInfo = (type: string) => {
  return typeMap[type] || { label: '其他', color: '#64748b' };
};

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNewsDetail();
  }, [id]);

  const fetchNewsDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await newsApi.getNewsDetail(id);
      if (response.data.success && response.data.data) {
        setNews(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch news detail:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="container section">
        <div className="empty-state">
          <div className="empty-state-icon">📰</div>
          <p className="empty-state-text">新闻不存在</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/news')}
          >
            返回新闻列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <div style={{ marginBottom: '1.5rem' }}>
        <button 
          className="btn btn-outline btn-sm"
          onClick={() => navigate('/news')}
        >
          ← 返回新闻列表
        </button>
      </div>

      <div className="card card-body">
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            {news.title}
          </h1>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ 
              background: getTypeInfo(news.type).color, 
              color: 'white', 
              padding: '0.25rem 0.75rem', 
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}>
              {getTypeInfo(news.type).label}
            </span>
            <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
              发布时间：{new Date(news.created_at).toLocaleString('zh-CN')}
            </span>
            {news.author && (
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                作者：{news.author}
              </span>
            )}
          </div>
        </div>

        <div style={{ 
          borderTop: '1px solid var(--border-color)', 
          paddingTop: '1.5rem' 
        }}>
          {news.image_url && (
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '1.5rem' 
            }}>
              <img 
                src={news.image_url} 
                alt={news.title}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '400px',
                  borderRadius: '8px' 
                }}
              />
            </div>
          )}

          <div 
            style={{ 
              lineHeight: '2', 
              color: '#334155',
              fontSize: '1rem'
            }}
            dangerouslySetInnerHTML={{ __html: news.content }}
          />
        </div>

        {news.summary && (
          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            background: '#f8fafc', 
            borderRadius: '8px' 
          }}>
            <p style={{ color: '#64748b', fontStyle: 'italic' }}>
              <strong>摘要：</strong>{news.summary}
            </p>
          </div>
        )}
      </div>

      <div style={{ 
        marginTop: '2rem', 
        textAlign: 'center' 
      }}>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/news')}
        >
          查看更多新闻
        </button>
      </div>
    </div>
  );
};

export default NewsDetail;
