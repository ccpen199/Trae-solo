import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import MovieCard from '../components/MovieCard.jsx';
import { movieAPI, tvAPI, peopleAPI, reviewAPI } from '../api/index.js';
import useAuthStore from '../store/authStore.js';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { user } = useAuthStore();

  const [movies, setMovies] = useState([]);
  const [tvShows, setTvShows] = useState([]);
  const [people, setPeople] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [filterRating, setFilterRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setMovies([]);
      setTvShows([]);
      setPeople([]);
      setReviews([]);
      setSearched(false);
      return;
    }

    const doSearch = async () => {
      setLoading(true);
      setError(null);
      setSearched(true);

      try {
        const [moviesRes, tvRes, peopleRes, reviewsRes] = await Promise.all([
          movieAPI.getMovies({ keyword: query, limit: 20, sort: sortBy === 'rating' ? 'rating' : undefined }),
          tvAPI.getTVShows({ keyword: query, limit: 10 }),
          peopleAPI.getPeople({ keyword: query, limit: 10 }),
          reviewAPI.getReviews({ keyword: query, limit: 10, sort: 'hot' })
        ]);

        let moviesData = moviesRes.data?.data || [];
        let tvData = tvRes.data?.data || [];

        if (filterRating > 0) {
          moviesData = moviesData.filter(m => (m.rating || m.vote_average || 0) >= filterRating);
          tvData = tvData.filter(t => (t.rating || t.vote_average || 0) >= filterRating);
        }

        setMovies(moviesData);
        setTvShows(tvData);
        setPeople(peopleRes.data?.data || []);
        setReviews(reviewsRes.data?.data || []);
      } catch (err) {
        setError('搜索失败，请稍后重试');
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(doSearch, 300);
    return () => clearTimeout(timeout);
  }, [query, sortBy, filterRating]);

  const totalResults = movies.length + tvShows.length + people.length + reviews.length;

  const tabs = [
    { key: 'all', label: '全部', count: totalResults },
    { key: 'movies', label: '电影', count: movies.length },
    { key: 'tv', label: '剧集', count: tvShows.length },
    { key: 'people', label: '影人', count: people.length },
    { key: 'reviews', label: '影评', count: reviews.length }
  ];

  const sortOptions = [
    { value: 'relevance', label: '相关性' },
    { value: 'rating', label: '评分最高' },
    { value: 'date', label: '最新发布' }
  ];

  const ratingFilters = [
    { value: 0, label: '全部评分' },
    { value: 7, label: '7分以上' },
    { value: 8, label: '8分以上' },
    { value: 9, label: '9分以上' }
  ];

  if (!query.trim()) {
    return (
      <div className="container section">
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h2 style={{ marginBottom: '12px' }}>开始搜索</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            在上方搜索框输入电影、剧集或影人名称
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="section-title" style={{ margin: 0 }}>
          搜索: <span style={{ color: 'var(--primary)' }}>"{query}"</span>
        </h1>
        {searched && totalResults > 0 && (
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            共找到 <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{totalResults}</span> 条结果
          </span>
        )}
      </div>

      {loading ? (
        <div className="loading">搜索中...</div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>{error}</h3>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
            style={{ marginTop: '16px' }}
          >
            重试
          </button>
        </div>
      ) : searched && totalResults === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>未找到相关结果</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            试试其他关键词，或浏览我们的推荐内容
          </p>
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/movies" className="btn btn-primary">浏览电影</Link>
            <Link to="/tv" className="btn btn-secondary">浏览剧集</Link>
          </div>
        </div>
      ) : (
        <>
          {searched && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '24px',
              marginBottom: '24px',
              padding: '16px 20px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div className="tabs" style={{ borderBottom: 'none', margin: 0 }}>
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    {tab.label} <span style={{ opacity: 0.6 }}>({tab.count})</span>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-hover)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(Number(e.target.value))}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-hover)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {ratingFilters.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'movies') && movies.length > 0 && (
            <section style={{ marginBottom: '48px' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                🎬 电影
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                  找到 {movies.length} 部
                </span>
              </h3>
              <div className="grid grid-5">
                {movies.map(movie => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </section>
          )}

          {(activeTab === 'all' || activeTab === 'tv') && tvShows.length > 0 && (
            <section style={{ marginBottom: '48px' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                📺 剧集
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                  找到 {tvShows.length} 部
                </span>
              </h3>
              <div className="grid grid-4">
                {tvShows.map(show => (
                  <Link
                    key={show.id}
                    to={`/tv/${show.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="card">
                      <img
                        src={show.poster_url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tv%20show%20poster&image_size=square'}
                        alt={show.title}
                        className="card-img"
                      />
                      <div style={{ padding: '12px 16px 16px' }}>
                        <h4 style={{
                          fontSize: '15px',
                          fontWeight: '600',
                          margin: '0 0 8px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {show.title}
                        </h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {show.start_year || 'N/A'}
                          </span>
                          <span className="badge badge-rating">
                            ⭐ {show.rating ? show.rating.toFixed(1) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {(activeTab === 'all' || activeTab === 'people') && people.length > 0 && (
            <section style={{ marginBottom: '48px' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                👤 影人
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                  找到 {people.length} 位
                </span>
              </h3>
              <div className="grid grid-6">
                {people.map(person => (
                  <Link
                    key={person.id}
                    to={`/people/${person.id}`}
                    style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center' }}
                  >
                    <img
                      src={person.avatar_url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=portrait%20headshot&image_size=square'}
                      alt={person.name}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        marginBottom: '12px',
                        border: '2px solid var(--border)'
                      }}
                    />
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{person.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {Array.isArray(person.known_for) ? person.known_for.join(' / ') : (person.known_for || 'N/A')}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {(activeTab === 'all' || activeTab === 'reviews') && reviews.length > 0 && (
            <section>
              <h3 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                📝 影评
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                  找到 {reviews.length} 条
                </span>
              </h3>
              <div className="grid grid-2">
                {reviews.map(review => (
                  <Link
                    key={review.id}
                    to={`/reviews/${review.id}`}
                    style={{
                      padding: '20px',
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: 'var(--radius-md)',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          backgroundColor: 'var(--bg-hover)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                        }}>
                          👤
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>{review.username || review.author_username || '匿名用户'}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {new Date(review.created_at).toLocaleDateString('zh-CN')}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span className="badge badge-rating">⭐ {review.rating}/10</span>
                        <span className={`badge badge-${review.sentiment_label}`}>
                          {review.sentiment_label === 'positive' ? '😊' : review.sentiment_label === 'negative' ? '😞' : '😐'}
                        </span>
                      </div>
                    </div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: '600' }}>{review.title}</h4>
                    <p style={{
                      margin: 0, fontSize: '13px', color: 'var(--text-secondary)',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                    }}>
                      {review.content}
                    </p>
                    {review.content_title && (
                      <div style={{ marginTop: '10px' }}>
                        <span className="tag" style={{ fontSize: '11px' }}>🎬 {review.content_title}</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {searched && user && (user.role === 'admin' || user.role === 'moderator') && (
            <div style={{ marginTop: '48px', padding: '20px', backgroundColor: 'rgba(234,179,8,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(234,179,8,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '15px' }}>🔍 审核追踪</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                    当前搜索结果包含审核状态：已通过审核
                  </p>
                </div>
                <Link to="/admin" className="btn btn-outline btn-sm">查看审核记录 →</Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Search;
