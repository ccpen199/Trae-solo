import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MovieCard from '../components/MovieCard.jsx';
import { movieAPI, tvAPI, peopleAPI, newsAPI, playlistAPI, reviewAPI, communityAPI, quizAPI, liveAPI, adminAPI } from '../api/index.js';
import useAuthStore from '../store/authStore.js';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('zh-CN');
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('zh-CN');
};

const newsTypeMap = {
  release: '🎬 定档',
  premiere: '🌟 首映',
  award: '🏆 获奖',
  festival: '🎪 电影节',
  interview: '🎤 访谈',
  review: '📝 评析',
  box_office: '💰 票房',
  rumor: '📢 传闻'
};

const profileCompleteness = (person) => {
  if (!person) return 0;
  const fields = ['name', 'birth_date', 'biography', 'avatar_url', 'place_of_birth', 'imdb_id', 'tmdb_id'];
  const filled = fields.filter(f => person[f] && person[f] !== 'null' && person[f] !== '').length;
  return Math.round((filled / fields.length) * 100);
};

const Home = () => {
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = user && (user.role === 'admin' || user.role === 'moderator');

  const [movies, setMovies] = useState([]);
  const [tvShows, setTvShows] = useState([]);
  const [people, setPeople] = useState([]);
  const [news, setNews] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [topics, setTopics] = useState([]);
  const [battles, setBattles] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [viewingGroups, setViewingGroups] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const apiPromises = [
          movieAPI.getMovies({ limit: 5, sort: 'rating' }),
          tvAPI.getTVShows({ limit: 4 }),
          peopleAPI.getPeople({ limit: 8 }),
          newsAPI.getNews({ limit: 5 }),
          playlistAPI.getPlaylists({ limit: 4 }),
          reviewAPI.getReviews({ limit: 4, sort: 'hot' }),
          communityAPI.getTopics({ limit: 3 }),
          communityAPI.getBattles({ limit: 2 }),
          quizAPI.getQuizzes({ limit: 3 }),
          liveAPI.getStreams({ limit: 3 }),
          communityAPI.getViewingGroups({ limit: 2 })
        ];

        if (isAdmin) {
          apiPromises.push(adminAPI.getStats());
        }

        const [
          moviesRes, tvRes, peopleRes, newsRes, playlistsRes, reviewsRes,
          topicsRes, battlesRes, quizzesRes, liveRes, groupsRes, statsRes
        ] = await Promise.all(
          apiPromises.map(p => p.catch(e => { console.error('API Error:', e); return { data: { data: [] } }; }))
        );

        setMovies(moviesRes.data?.data || []);
        setTvShows(tvRes.data?.data || []);
        setPeople(peopleRes.data?.data || []);
        setNews(newsRes.data?.data || []);
        setPlaylists(playlistsRes.data?.data || []);
        setReviews((reviewsRes.data?.data || []).map(r => ({
          ...r,
          author_username: r.username || r.author_username || '匿名用户',
          movie_title: r.content_title || r.movie_title,
          likes_count: r.likes !== undefined ? r.likes : r.likes_count || 0,
          hot_score: r.hot_score !== undefined ? r.hot_score : Math.round((r.likes * 2 + (r.comments || 0) + (r.views || 0)) / 100),
          sentiment_score: r.sentiment_score !== undefined ? r.sentiment_score : (r.sentiment_label === 'positive' ? 0.8 : r.sentiment_label === 'negative' ? 0.2 : 0.5)
        })));
        setTopics(topicsRes.data?.data || []);
        setBattles(battlesRes.data?.data || []);
        setQuizzes(quizzesRes.data?.data || []);
        setLiveSessions(liveRes.data?.data || []);
        setViewingGroups(groupsRes.data?.data || []);
        if (isAdmin && statsRes) {
          setAdminStats(statsRes.data || null);
        }
      } catch (err) {
        console.error('Failed to load home data:', err);
        setError('部分数据加载失败');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <section style={{
        position: 'relative',
        padding: '80px 0',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        marginBottom: '48px'
      }}>
        <div className="container">
          <div style={{ maxWidth: '800px' }}>
            <h1 style={{ fontSize: '56px', fontWeight: '800', marginBottom: '16px', lineHeight: '1.1' }}>
              发现好电影<br />
              <span style={{ color: 'var(--primary)' }}>分享真观点</span>
            </h1>
            <p style={{ fontSize: '20px', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.6' }}>
              专业影视文化社区 — IMDb/TMDB 结构化元数据，影人关系图谱，
              影评情感分析，观点对战，答题竞猜，全方位影视文化体验。
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/movies" className="btn btn-primary btn-lg">浏览电影</Link>
              <Link to="/community" className="btn btn-secondary btn-lg">进入社区</Link>
              <Link to="/quizzes" className="btn btn-outline btn-lg">答题赢奖</Link>
              <Link to="/admin" className="btn btn-outline btn-lg" style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}>
                ⚙️ 管理后台
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <section className="section" style={{ paddingTop: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 className="section-title" style={{ margin: 0 }}>🎬 热门电影</h2>
            <Link to="/movies" style={{ color: 'var(--primary)', fontSize: '14px' }}>查看全部 →</Link>
          </div>
          <div className="grid grid-5">
            {movies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>

        <div className="grid grid-2" style={{ gap: '48px' }}>
          <section className="section" style={{ padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="section-title" style={{ margin: 0, fontSize: '22px' }}>📺 热门剧集</h2>
              <Link to="/tv" style={{ color: 'var(--primary)', fontSize: '14px' }}>查看全部 →</Link>
            </div>
            <div className="grid grid-2">
              {tvShows.map(show => (
                <Link key={show.id} to={`/tv/${show.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={show.poster_url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tv%20show%20poster%20cinematic&image_size=portrait_4_3'}
                      alt={show.title}
                      style={{ aspectRatio: '16/9', objectFit: 'cover', width: '100%', display: 'block' }}
                    />
                    <div style={{ padding: '16px' }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: '15px' }}>{show.title}</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <span>{show.start_year || show.year || 'N/A'}</span>
                        <span className="badge badge-rating">⭐ {show.rating ? Number(show.rating).toFixed(1) : 'N/A'}</span>
                      </div>
                      {show.genres && show.genres.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          {show.genres.slice(0, 2).map((g, i) => (
                            <span key={i} className="tag" style={{ fontSize: '11px', padding: '2px 8px' }}>{g}</span>
                          ))}
                        </div>
                      )}
                      <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--primary)' }}>查看详情 →</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="section" style={{ padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="section-title" style={{ margin: 0, fontSize: '22px' }}>🌟 热门影人</h2>
              <Link to="/people" style={{ color: 'var(--primary)', fontSize: '14px' }}>查看全部 →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {people.map(person => {
                const completeness = profileCompleteness(person);
                const knownFor = Array.isArray(person.known_for) ? person.known_for.join(' / ') : (person.known_for_department || person.known_for || 'N/A');
                return (
                  <Link
                    key={person.id}
                    to={`/people/${person.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px',
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: 'var(--radius-md)',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                  >
                    <img
                      src={person.avatar_url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=portrait%20photograph%20professional%20headshot&image_size=square'}
                      alt={person.name}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--border)',
                        flexShrink: 0
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '600' }}>{person.name}</span>
                        {person.original_name && person.original_name !== person.name && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{person.original_name}</span>
                        )}
                        {person.imdb_id && <span className="badge badge-rating" style={{ fontSize: '10px', padding: '1px 5px' }}>IMDb</span>}
                        {person.tmdb_id && <span className="badge badge-positive" style={{ fontSize: '10px', padding: '1px 5px' }}>TMDB</span>}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        {knownFor} · {person.place_of_birth || 'N/A'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>🔥 {person.popularity ? Number(person.popularity).toFixed(0) : 0}</span>
                        <span style={{ color: completeness >= 80 ? 'var(--primary)' : completeness >= 50 ? 'var(--warning)' : 'var(--error)' }}>
                          📋 资料 {completeness}%
                        </span>
                        <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${completeness}%`, height: '100%', backgroundColor: completeness >= 80 ? 'var(--primary)' : completeness >= 50 ? 'var(--warning)' : 'var(--error)', borderRadius: '2px', transition: 'width 0.3s ease' }} />
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--primary)', flexShrink: 0 }}>查看详情 →</div>
                  </Link>
                );
              })}
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
              <Link to="/people" className="btn btn-outline btn-sm" style={{ flex: 1 }}>🔗 影人关系图谱</Link>
              <Link to="/admin" className="btn btn-outline btn-sm" style={{ flex: 1 }}>✏️ 协同编辑审核</Link>
            </div>
          </section>
        </div>

        <div className="grid grid-2" style={{ gap: '48px', marginTop: '48px' }}>
          <section className="section" style={{ padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="section-title" style={{ margin: 0, fontSize: '22px' }}>📰 最新资讯</h2>
              <Link to="/news" style={{ color: 'var(--primary)', fontSize: '14px' }}>查看全部 →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {news.map(item => (
                <Link
                  key={item.id}
                  to={`/news/${item.id}`}
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span className={`badge badge-${item.news_type === 'award' ? 'rating' : item.news_type === 'festival' ? 'positive' : 'secondary'}`}>
                      {newsTypeMap[item.news_type] || '📰 资讯'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {formatDate(item.publish_date || item.published_at)}
                    </span>
                    {item.source && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>来源: {item.source}</span>
                    )}
                    {item.views !== undefined && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>👁️ {item.views}</span>
                    )}
                  </div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '500' }}>{item.title}</h4>
                  {item.summary && (
                    <p style={{
                      margin: 0, fontSize: '13px', color: 'var(--text-secondary)',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.4'
                    }}>
                      {item.summary}
                    </p>
                  )}
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {(item.related_movie_title) && (
                      <span className="tag" style={{ fontSize: '11px', padding: '2px 8px' }}>🎬 {item.related_movie_title}</span>
                    )}
                    {(item.related_person_name) && (
                      <span className="tag" style={{ fontSize: '11px', padding: '2px 8px' }}>👤 {item.related_person_name}</span>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--primary)' }}>查看详情 →</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="section" style={{ padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="section-title" style={{ margin: 0, fontSize: '22px' }}>📋 精选片单</h2>
              <Link to="/playlists" style={{ color: 'var(--primary)', fontSize: '14px' }}>查看全部 →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {playlists.map(playlist => (
                <Link
                  key={playlist.id}
                  to={`/playlists/${playlist.id}`}
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '500' }}>📋 {playlist.name}</h4>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{playlist.item_count || 0} 部</span>
                  </div>
                  <p style={{
                    margin: 0, fontSize: '13px', color: 'var(--text-secondary)',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                  }}>
                    {playlist.description}
                  </p>
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {playlist.likes !== undefined && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>❤️ {playlist.likes}</span>}
                      {playlist.creator_name && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>👤 {playlist.creator_name}</span>}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--primary)' }}>协作编辑 →</span>
                  </div>
                </Link>
              ))}
            </div>
            <div style={{ marginTop: '12px' }}>
              <Link to="/playlists" className="btn btn-outline btn-sm" style={{ width: '100%' }}>➕ 创建片单 / 协作编辑</Link>
            </div>
          </section>
        </div>

        <section className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 className="section-title" style={{ margin: 0 }}>📝 热门影评</h2>
            <Link to="/reviews" style={{ color: 'var(--primary)', fontSize: '14px' }}>查看全部 →</Link>
          </div>
          {error && (
            <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '14px', color: 'var(--error)' }}>
              {error}
            </div>
          )}
          <div className="grid grid-2">
            {reviews.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <div className="empty-state-icon">📝</div>
                <p>暂无影评数据</p>
              </div>
            ) : (
              reviews.map(review => (
                <Link
                  key={review.id}
                  to={`/reviews/${review.id}`}
                  style={{
                    padding: '24px',
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
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>👤</div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{review.author_username}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(review.created_at)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span className={`badge badge-${review.sentiment_label}`}>
                        {review.sentiment_label === 'positive' ? '😊 正面' : review.sentiment_label === 'negative' ? '😞 负面' : '😐 中性'}
                      </span>
                      {review.sentiment_score !== undefined && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>情感分: {(Number(review.sentiment_score) || 0).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span className="badge badge-rating">⭐ {review.rating}/10</span>
                    <span style={{ fontSize: '12px', color: 'var(--warning)' }}>🔥 {(Number(review.hot_score) || 0).toFixed(0)}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>❤️ {review.likes_count}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>👁️ {review.views || 0}</span>
                  </div>
                  {review.movie_title && (
                    <div style={{ marginBottom: '8px' }}>
                      <span className="tag" style={{ fontSize: '11px' }}>🎬 {review.movie_title}</span>
                    </div>
                  )}
                  <h4 style={{ margin: '0 0 8px', fontSize: '16px' }}>{review.title}</h4>
                  <p style={{
                    margin: 0, fontSize: '14px', color: 'var(--text-secondary)',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical'
                  }}>
                    {review.content}
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>

        <div style={{
          marginTop: '48px',
          marginBottom: '48px',
          padding: '32px',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.08) 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(59,130,246,0.15)'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
            🎯 业务闭环入口
          </h2>
          <div className="grid grid-5" style={{ gap: '16px' }}>
            {[
              { to: '/community', icon: '💬', title: '话题讨论组', desc: '发起话题 · 参与讨论', badge: `${topics.length} 个话题` },
              { to: '/community', icon: '⚔️', title: 'Battle 观点对战', desc: '正反方投票 · 实时票数', badge: battles.length > 0 ? `${(battles[0].option_a_votes || 0) + (battles[0].option_b_votes || 0)} 票` : '0 票' },
              { to: '/quizzes', icon: '🏆', title: '答题排行榜', desc: '知识竞猜 · 积分兑换', badge: `${quizzes.length} 场活动` },
              { to: '/live', icon: '📺', title: '直播场次', desc: '正在直播 · 预约开播', badge: liveSessions.filter(s => s.status === 'live').length > 0 ? '🔴 LIVE' : '暂无直播' },
              { to: '/community', icon: '🎬', title: '观影团建', desc: '组织观影 · 报名参加', badge: `${viewingGroups.length} 个团` }
            ].map((item, i) => (
              <Link
                key={i}
                to={item.to}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '24px 16px',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  color: 'inherit',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  border: '1px solid var(--border)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>{item.icon}</div>
                <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>{item.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>{item.desc}</div>
                <span className="badge badge-positive" style={{ fontSize: '11px' }}>{item.badge}</span>
              </Link>
            ))}
          </div>
          <div className="grid grid-3" style={{ gap: '16px', marginTop: '16px' }}>
            {[
              { to: '/quizzes', icon: '🎁', title: '奖品兑换', desc: '积分兑换实物奖品' },
              { to: '/playlists', icon: '📋', title: '片单协作', desc: '创建和管理精选片单' },
              { to: '/community', icon: '👥', title: '观影团建组', desc: '组织线下/线上观影' }
            ].map((item, i) => (
              <Link
                key={i}
                to={item.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  color: 'inherit',
                  border: '1px solid var(--border)'
                }}
              >
                <span style={{ fontSize: '28px' }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div style={{
            marginTop: '48px',
            marginBottom: '48px',
            padding: '32px',
            background: 'linear-gradient(135deg, rgba(234,179,8,0.06) 0%, rgba(239,68,68,0.06) 100%)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(234,179,8,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700' }}>⚙️ 后台管理能力</h2>
              <Link to="/admin" className="btn btn-primary btn-sm">进入管理后台 →</Link>
            </div>
            <div className="grid grid-4" style={{ gap: '16px' }}>
              {[
                { to: '/admin', icon: '📊', title: '数据看板', stat: adminStats ? `${adminStats.total_movies || 0} 部 / ${adminStats.total_users || 0} 人` : '加载中...', color: 'var(--primary)' },
                { to: '/admin?tab=reviews', icon: '📝', title: '内容审核工作台', stat: adminStats ? `${adminStats.pending_reviews || 0} 条待审` : '加载中...', color: 'var(--warning)' },
                { to: '/admin?tab=copyright', icon: '🔒', title: '版权播放校验', stat: adminStats ? `${adminStats.active_sources || 0} 个正版源` : '加载中...', color: 'var(--primary)' },
                { to: '/admin?tab=live', icon: '📺', title: '直播场次管理', stat: `${liveSessions.length} 场次`, color: 'var(--error)' }
              ].map((item, i) => (
                <Link
                  key={i}
                  to={item.to}
                  style={{
                    padding: '20px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    color: 'inherit',
                    border: '1px solid var(--border)',
                    transition: 'border-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = item.color}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ fontSize: '28px', marginBottom: '12px' }}>{item.icon}</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>{item.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.stat}</div>
                  <div style={{ marginTop: '12px', fontSize: '12px', color: item.color }}>进入管理 →</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
