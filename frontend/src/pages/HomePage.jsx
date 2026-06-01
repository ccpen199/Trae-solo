import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { newsAPI, categoriesAPI } from '../services/api';

function HomePage() {
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadData();
  }, [currentPage]);

  const loadData = async () => {
    try {
      const [newsRes, categoriesRes] = await Promise.all([
        newsAPI.getAll({ page: currentPage, size: 10 }),
        categoriesAPI.getAll(),
      ]);
      setNews(newsRes.data.items);
      setTotalPages(Math.ceil(newsRes.data.total / 10));
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <h1 className="page-title">最新资讯</h1>
      
      <div className="news-grid">
        <div className="news-list">
          {news.length === 0 ? (
            <div className="empty-state">暂无新闻</div>
          ) : (
            news.map((item) => (
              <article key={item.id} className="news-card">
                <h2 className="news-card-title">
                  <Link to={`/news/${item.slug}`}>{item.title}</Link>
                </h2>
                <p className="news-card-summary">{item.summary}</p>
                <div className="news-card-meta">
                  <span>浏览: {item.views}</span>
                  <span>发布: {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')}</span>
                  {item.category && (
                    <Link to={`/category/${item.category.slug}`}>
                      {item.category.name}
                    </Link>
                  )}
                </div>
              </article>
            ))
          )}
          
          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={currentPage === page ? 'active' : ''}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </div>
        
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>新闻分类</h3>
            <ul className="category-list">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link to={`/category/${cat.slug}`}>{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="sidebar-section">
            <h3>热门排行</h3>
            <ul className="category-list">
              {[...news]
                .sort((a, b) => b.views - a.views)
                .slice(0, 5)
                .map((item) => (
                  <li key={item.id}>
                    <Link to={`/news/${item.slug}`}>{item.title}</Link>
                  </li>
                ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default HomePage;
