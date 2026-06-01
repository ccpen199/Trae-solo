import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsApi } from '../services/api';

function HomePage() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      const response = await newsApi.getList();
      setNewsList(response.data.list || []);
    } catch (err) {
      console.error('Load news error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="news-list">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</p>
        ) : (
          newsList.map((news) => (
            <div
              key={news.id}
              className="news-card"
              onClick={() => navigate(`/news/${news.id}`)}
            >
              <h3 className="news-title">{news.title}</h3>
              <p className="news-summary">{news.summary}</p>
              <div className="news-meta">
                <span className="news-category">{news.category}</span>
                <span>{news.author}</span>
                <span>{news.publishTime}</span>
                <span>👁 {news.views}</span>
                <span>❤️ {news.likes}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default HomePage;
