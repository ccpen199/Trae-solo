import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { newsAPI, categoriesAPI } from '../services/api';

function CategoryPage() {
  const { slug } = useParams();
  const [news, setNews] = useState([]);
  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadData();
  }, [slug, currentPage]);

  const loadData = async () => {
    try {
      const [categoryRes, categoriesRes] = await Promise.all([
        categoriesAPI.getBySlug(slug),
        categoriesAPI.getAll(),
      ]);
      setCategory(categoryRes.data);
      setCategories(categoriesRes.data);

      const newsRes = await newsAPI.getAll({
        page: currentPage,
        size: 10,
        category_id: categoryRes.data.id,
      });
      setNews(newsRes.data.items);
      setTotalPages(Math.ceil(newsRes.data.total / 10));
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
      <h1 className="page-title">{category?.name || '分类新闻'}</h1>
      
      <div className="news-grid">
        <div className="news-list">
          {news.length === 0 ? (
            <div className="empty-state">该分类下暂无新闻</div>
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
            <h3>所有分类</h3>
            <ul className="category-list">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/category/${cat.slug}`}
                    style={{
                      fontWeight: cat.slug === slug ? 'bold' : 'normal',
                      color: cat.slug === slug ? '#3b82f6' : undefined,
                    }}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default CategoryPage;
