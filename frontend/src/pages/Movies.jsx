import React, { useState, useEffect } from 'react';
import MovieCard from '../components/MovieCard.jsx';
import { movieAPI } from '../api/index.js';

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    genre: '',
    year: '',
    sort: 'popular',
    page: 1,
    limit: 20
  });
  const [total, setTotal] = useState(0);

  const genres = ['科幻', '剧情', '动作', '悬疑', '爱情', '喜剧', '动画', '纪录片', '恐怖', '犯罪'];
  const years = Array.from({ length: 50 }, (_, i) => 2024 - i);
  const sortOptions = [
    { value: 'popular', label: '最受欢迎' },
    { value: 'rating', label: '评分最高' },
    { value: 'year', label: '最新上映' }
  ];

  useEffect(() => {
    const loadMovies = async () => {
      setLoading(true);
      try {
        const res = await movieAPI.getMovies(filters);
        setMovies(res.data?.data || []);
        setTotal(res.data?.total || 0);
      } catch (err) {
        console.error('Failed to load movies:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMovies();
  }, [filters]);

  const totalPages = Math.ceil(total / filters.limit);

  return (
    <div className="container section">
      <h1 className="section-title">电影库</h1>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '32px',
        padding: '20px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)'
      }}>
        <div>
          <label className="form-label">类型</label>
          <select
            value={filters.genre}
            onChange={(e) => setFilters({ ...filters, genre: e.target.value, page: 1 })}
            style={{ minWidth: '120px' }}
          >
            <option value="">全部类型</option>
            {genres.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">年份</label>
          <select
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value, page: 1 })}
            style={{ minWidth: '120px' }}
          >
            <option value="">全部年份</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">排序</label>
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            style={{ minWidth: '140px' }}
          >
            {sortOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div style={{ alignSelf: 'flex-end' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            共 {total} 部电影
          </span>
        </div>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : movies.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎬</div>
          <p>暂无符合条件的电影</p>
        </div>
      ) : (
        <>
          <div className="grid grid-5">
            {movies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={filters.page === 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              >
                上一页
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (filters.page > 3) {
                    pageNum = filters.page - 2 + i;
                  }
                  if (filters.page > totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  }
                }
                return (
                  <button
                    key={pageNum}
                    className={`page-btn ${filters.page === pageNum ? 'active' : ''}`}
                    onClick={() => setFilters({ ...filters, page: pageNum })}
                    disabled={pageNum > totalPages}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                className="page-btn"
                disabled={filters.page === totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
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

export default Movies;
