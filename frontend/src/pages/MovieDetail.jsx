import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { movieAPI, reviewAPI } from '../api/index.js';
import useAuthStore from '../store/authStore.js';

const MovieDetail = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const isAdmin = user && (user.role === 'admin' || user.role === 'moderator');

  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState([]);
  const [related, setRelated] = useState([]);
  const [videos, setVideos] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewSort, setReviewSort] = useState('hot');
  const [copyrightVerified, setCopyrightVerified] = useState(null);
  const [copyrightChecked, setCopyrightChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMovie = async () => {
      try {
        setLoading(true);
        const res = await movieAPI.getMovie(id);
        setMovie(res.data?.movie || res.data?.data);
        setCredits(res.data?.credits || []);
        setRelated(res.data?.related || []);
        setVideos(res.data?.videos || []);
        const reviewsRes = await reviewAPI.getReviews({ content_type: 'movie', content_id: id, limit: 6, sort: reviewSort });
        setReviews(reviewsRes.data?.data || []);
      } catch (err) {
        setError('加载电影详情失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadMovie();
  }, [id, reviewSort]);

  const handleCopyrightCheck = async () => {
    try {
      setCopyrightChecked(true);
      const res = await fetch(`http://127.0.0.1:59024/api/admin/video-sources?content_type=movie&content_id=${id}`);
      const data = await res.json();
      const hasValidSource = (data?.data || []).some(v => v.status === 'active' && v.verified);
      setCopyrightVerified(hasValidSource);
    } catch (err) {
      setCopyrightVerified(false);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error || !movie) {
    return (
      <div className="container section">
        <div className="empty-state">
          <div className="empty-state-icon">😔</div>
          <h3>{error || '电影不存在'}</h3>
          <Link to="/movies" className="btn btn-primary" style={{ marginTop: '16px' }}>
            返回电影库
          </Link>
        </div>
      </div>
    );
  }

  const director = credits.find(c => c.department === 'Directing' || c.job === 'Director' || c.role === 'Director');
  const directors = credits.filter(c => c.department === 'Directing' || c.job === 'Director');
  const writers = credits.filter(c => c.department === 'Writing' || c.job === 'Writer');
  const cast = credits.filter(c => c.role === 'Actor' || c.character !== undefined).slice(0, 8);

  const rating = movie.rating !== undefined ? movie.rating : movie.vote_average;
  const year = movie.year !== undefined ? movie.year : movie.release_year;

  return (
    <div className="container section">
      {movie.backdrop_url && (
        <div style={{
          position: 'relative',
          margin: '-48px -48px 48px',
          height: '400px',
          backgroundImage: `linear-gradient(to bottom, rgba(15,15,15,0.3), rgba(15,15,15,0.95)), url(${movie.backdrop_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            bottom: '32px',
            left: '48px',
            right: '48px'
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px' }}>
              {movie.imdb_id && (
                <span className="badge badge-rating" style={{ fontSize: '14px', padding: '6px 12px' }}>
                  ⭐ IMDb {rating ? Number(rating).toFixed(1) : 'N/A'}
                </span>
              )}
              {movie.tmdb_id && (
                <span className="badge badge-positive" style={{ fontSize: '14px', padding: '6px 12px' }}>
                  🔵 TMDB
                </span>
              )}
              {movie.content_rating && (
                <span className="badge badge-secondary" style={{ fontSize: '14px', padding: '6px 12px' }}>
                  {movie.content_rating}
                </span>
              )}
              {copyrightVerified !== null && (
                <span className={`badge ${copyrightVerified ? 'badge-positive' : 'badge-warning'}`}
                  style={{ fontSize: '14px', padding: '6px 12px' }}>
                  {copyrightVerified ? '✓ 版权合规' : '⚠️ 版权校验中'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-2" style={{ gap: '48px', marginBottom: '48px' }}>
        <div>
          <img
            src={movie.poster_url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=movie%20poster&image_size=portrait_4_3'}
            alt={movie.title}
            style={{
              width: '100%',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)'
            }}
          />

          <div style={{
            marginTop: '24px',
            padding: '20px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)'
          }}>
            <h4 style={{ fontSize: '16px', marginBottom: '12px' }}>📊 影片数据</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>IMDb ID</div>
                <div style={{ fontWeight: '500' }}>{movie.imdb_id || 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>TMDB ID</div>
                <div style={{ fontWeight: '500' }}>{movie.tmdb_id || 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>评分人数</div>
                <div style={{ fontWeight: '500' }}>{movie.vote_count ? movie.vote_count.toLocaleString() : 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)' }}>数据来源</div>
                <div style={{ fontWeight: '500' }}>{movie.source || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h1 style={{ fontSize: '40px', fontWeight: '800', marginBottom: '8px' }}>
            {movie.title}
          </h1>
          {movie.original_title && movie.original_title !== movie.title && (
            <p style={{ fontSize: '20px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {movie.original_title}
            </p>
          )}

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
            <span className="badge badge-rating" style={{ fontSize: '24px', padding: '10px 20px' }}>
              ⭐ {rating ? Number(rating).toFixed(1) : 'N/A'}
            </span>
            {movie.vote_count && (
              <div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>
                  {movie.vote_count >= 10000 ? `${(movie.vote_count / 10000).toFixed(1)}万` : movie.vote_count.toLocaleString()} 人评价
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  TOP 250 排名 #{movie.id || 'N/A'}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
            {movie.genres && movie.genres.map((g, i) => (
              <span key={i} className="tag" style={{ fontSize: '13px', padding: '6px 12px' }}>
                {g}
              </span>
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '100px 1fr',
            gap: '12px',
            marginBottom: '24px',
            fontSize: '14px',
            padding: '20px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{ color: 'var(--text-muted)' }}>📅 年份</div>
            <div style={{ fontWeight: '500' }}>{year || 'N/A'}</div>
            <div style={{ color: 'var(--text-muted)' }}>🎬 上映</div>
            <div style={{ fontWeight: '500' }}>{movie.release_date || 'N/A'}</div>
            <div style={{ color: 'var(--text-muted)' }}>⏱️ 片长</div>
            <div style={{ fontWeight: '500' }}>{movie.runtime ? `${movie.runtime} 分钟 / ${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 'N/A'}</div>
            <div style={{ color: 'var(--text-muted)' }}>🌍 地区</div>
            <div style={{ fontWeight: '500' }}>{movie.countries?.join(' / ') || 'N/A'}</div>
            <div style={{ color: 'var(--text-muted)' }}>🗣️ 语言</div>
            <div style={{ fontWeight: '500' }}>{movie.languages?.join(' / ') || 'N/A'}</div>
            {directors.length > 0 && (
              <>
                <div style={{ color: 'var(--text-muted)' }}>🎥 导演</div>
                <div style={{ fontWeight: '500' }}>
                  {directors.map((d, i) => (
                    <span key={d.id || i}>
                      {i > 0 && ' / '}
                      <Link to={`/people/${d.person_id || d.id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                        {d.name}
                      </Link>
                    </span>
                  ))}
                </div>
              </>
            )}
            {writers.length > 0 && (
              <>
                <div style={{ color: 'var(--text-muted)' }}>✍️ 编剧</div>
                <div style={{ fontWeight: '500' }}>
                  {writers.slice(0, 2).map((w, i) => (
                    <span key={w.id || i}>
                      {i > 0 && ' / '}
                      <Link to={`/people/${w.person_id || w.id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                        {w.name}
                      </Link>
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>📖 剧情简介</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.9', fontSize: '15px' }}>
              {movie.plot || movie.overview || '暂无剧情简介'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              ▶️ 播放预告片
            </button>
            <button className="btn btn-secondary">
              ➕ 加入片单
            </button>
            <button className="btn btn-outline" onClick={handleCopyrightCheck}>
              🔗 版权校验
            </button>
            {copyrightVerified !== null && (
              <span className={`badge ${copyrightVerified ? 'badge-positive' : 'badge-warning'}`}
                style={{ alignSelf: 'center', padding: '8px 16px' }}>
                {copyrightVerified ? '✓ 已验证可播放' : '⚠️ 暂无正版源'}
              </span>
            )}
          </div>
        </div>
      </div>

      {cast.length > 0 && (
        <section style={{ marginBottom: '48px' }}>
          <h2 className="section-title" style={{ fontSize: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            👥 演职人员
            <Link to={`/movies/${id}/credits`} style={{ color: 'var(--primary)', fontSize: '14px' }}>
              查看全部 →
            </Link>
          </h2>
          <div className="grid grid-8">
            {cast.map((c, i) => (
              <Link
                key={i}
                to={`/people/${c.person_id || c.id}`}
                style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center' }}
              >
                <img
                  src={c.avatar_url || c.profile_path || c.photo_url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=portrait%20headshot&image_size=square'}
                  alt={c.name}
                  style={{
                    width: '100%',
                    aspectRatio: '2/3',
                    borderRadius: 'var(--radius-sm)',
                    objectFit: 'cover',
                    marginBottom: '12px'
                  }}
                />
                <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>{c.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {c.character || c.job || '演员'}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section style={{ marginBottom: '48px' }}>
          <h2 className="section-title" style={{ fontSize: '24px' }}>🎬 相关推荐</h2>
          <div className="grid grid-6">
            {related.map((m, i) => (
              <Link
                key={i}
                to={`/movies/${m.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <img
                  src={m.poster_url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=movie%20poster&image_size=portrait_4_3'}
                  alt={m.title}
                  style={{
                    width: '100%',
                    aspectRatio: '2/3',
                    borderRadius: 'var(--radius-sm)',
                    objectFit: 'cover',
                    marginBottom: '8px'
                  }}
                />
                <div style={{ fontSize: '13px', fontWeight: '500' }}>{m.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  ⭐ {m.rating ? Number(m.rating).toFixed(1) : 'N/A'} · {m.year || 'N/A'}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title" style={{ fontSize: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            影评
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { value: 'hot', label: '🔥 最热' },
                { value: 'newest', label: '🆕 最新' },
                { value: 'rating', label: '⭐ 高分' }
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`btn btn-sm ${reviewSort === opt.value ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setReviewSort(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <Link to="/reviews" className="btn btn-primary btn-sm">
            写影评
          </Link>
        </h2>

        {reviews.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px' }}>
            <div className="empty-state-icon">📝</div>
            <p>暂无影评，来发表第一篇吧！</p>
          </div>
        ) : (
          <div className="grid grid-2" style={{ gap: '16px' }}>
            {reviews.map((r, i) => (
              <div key={i} style={{
                padding: '24px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-hover)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}>
                      👤
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>{r.username || '匿名用户'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(r.created_at).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-rating">⭐ {r.rating}/10</span>
                    <span className={`badge badge-${r.sentiment_label}`}>
                      {r.sentiment_label === 'positive' ? '😊 正面' : r.sentiment_label === 'negative' ? '😞 负面' : '😐 中性'}
                    </span>
                  </div>
                </div>
                <h4 style={{ margin: '0 0 8px', fontSize: '16px' }}>{r.title}</h4>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: '1.6'
                }}>
                  {r.content}
                </p>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>❤️ {r.likes || 0}</span>
                  <span>💬 {r.comments || 0}</span>
                  <span>👁️ {r.views || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {copyrightChecked && (
        <div style={{
          marginTop: '48px',
          padding: '24px',
          backgroundColor: copyrightVerified ? 'rgba(34,197,94,0.06)' : 'rgba(234,179,8,0.06)',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${copyrightVerified ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '15px' }}>
                {copyrightVerified ? '✅ 版权校验通过' : '⚠️ 版权校验进行中'}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                {copyrightVerified ? '已验证可播放' : '暂无正版播放源，可提交片源申请'}
              </p>
            </div>
            {isAdmin && (
              <Link to="/admin?tab=copyright" className="btn btn-outline btn-sm">
                查看版权管理 →
              </Link>
            )}
          </div>
        </div>
      )}

      {isAdmin && (
        <div style={{
          marginTop: '32px',
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(234,179,8,0.05) 0%, rgba(239,68,68,0.05) 100%)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(234,179,8,0.15)'
        }}>
          <h4 style={{ margin: '0 0 16px', fontSize: '15px', color: 'var(--warning)' }}>
            🛠️ 管理员操作入口
          </h4>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/admin?tab=reviews" className="btn btn-outline btn-sm">
              📝 查看内容审核记录
            </Link>
            <Link to="/admin?tab=copyright" className="btn btn-outline btn-sm">
              🔒 版权校验详情
            </Link>
            <Link to="/admin?tab=edits" className="btn btn-outline btn-sm">
              ✏️ 影人资料协同编辑
            </Link>
            <Link to="/admin?tab=logs" className="btn btn-outline btn-sm">
              📋 查看审核日志
            </Link>
          </div>
        </div>
      )}

      <div style={{
        marginTop: '48px',
        padding: '20px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)'
      }}>
        <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          🔄 业务流转追踪
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ padding: '6px 12px', backgroundColor: 'var(--bg-hover)', borderRadius: '20px', fontSize: '12px' }}>
            🔍 搜索发现
          </span>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span style={{ padding: '6px 12px', backgroundColor: 'var(--bg-hover)', borderRadius: '20px', fontSize: '12px' }}>
            📋 详情查看
          </span>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span style={{
            padding: '6px 12px',
            backgroundColor: copyrightChecked ? 'rgba(59,130,246,0.1)' : 'var(--bg-hover)',
            borderRadius: '20px',
            fontSize: '12px',
            color: copyrightChecked ? 'var(--primary)' : 'var(--text-primary)'
          }}>
            {copyrightChecked ? (copyrightVerified ? '✅ 版权已验证' : '⚠️ 版权校验中') : '🔒 版权校验'}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span style={{ padding: '6px 12px', backgroundColor: 'var(--bg-hover)', borderRadius: '20px', fontSize: '12px' }}>
            📝 发表影评
          </span>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span style={{
            padding: '6px 12px',
            backgroundColor: 'var(--bg-hover)',
            borderRadius: '20px',
            fontSize: '12px',
            color: reviews.length > 0 ? 'var(--success)' : 'var(--text-primary)'
          }}>
            {reviews.length > 0 ? '✅ 有情感热度' : '😊 情感分析'}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span style={{ padding: '6px 12px', backgroundColor: 'var(--bg-hover)', borderRadius: '20px', fontSize: '12px' }}>
            📊 审核入库
          </span>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
