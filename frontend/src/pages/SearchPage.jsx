import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { newsAPI } from '../services/api';

function SearchPage() {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      searchNews();
    }
  }, [query]);

  const searchNews = async () => {
    setLoading(true);
    try {
      const response = await newsAPI.search(query);
      setResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">搜索结果: "{query}"</h1>
      
      {loading ? (
        <div className="loading">搜索中...</div>
      ) : results.length === 0 ? (
        <div className="empty-state">未找到相关新闻</div>
      ) : (
        <div>
          <p style={{ marginBottom: 20, color: '#666' }}>
            共找到 {results.length} 条结果
          </p>
          {results.map((item) => (
            <article key={item.id} className="news-card">
              <h2 className="news-card-title">
                <Link to={`/news/${item.slug}`}>{item.title}</Link>
              </h2>
              <p className="news-card-summary">{item.summary}</p>
              <div className="news-card-meta">
                <span>浏览: {item.views}</span>
                <span>发布: {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchPage;
