import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useStore();
  return isLoggedIn ? children : <Navigate to="/login" />;
};

const coverGradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
];

const avatarColors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6'];

const LivePage = () => {
  const [lives, setLives] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    (async () => {
      try {
        const { liveAPI } = await import('./api');
        const res = await liveAPI.getLives();
        if (res.success) setLives(res.data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>📺 直播大厅</h1>
      {loading ? <div style={{ textAlign: 'center', padding: 100 }}>加载中...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {lives.map((live, idx) => (
            <div key={live.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ position: 'relative', aspectRatio: '16/9', background: coverGradients[idx % coverGradients.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
                📺
                <span style={{ position: 'absolute', top: 12, left: 12, background: 'linear-gradient(90deg, #ef4444, #f97316)', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>🔴 直播中</span>
                <span style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>👁️ {live.viewer_count}</span>
              </div>
              <div style={{ padding: 16 }}>
                <h3 style={{ fontSize: 16, marginBottom: 8 }}>{live.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: avatarColors[idx % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                    {live.author_name?.charAt(0) || '?'}
                  </div>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>{live.author_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TopPage = () => {
  const [creators, setCreators] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [following, setFollowing] = React.useState(new Set());
  const { isLoggedIn } = useStore();

  React.useEffect(() => {
    (async () => {
      try {
        const { topAPI } = await import('./api');
        const res = await topAPI.getTopCreators();
        if (res.success) setCreators(res.data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const handleFollow = async (creatorId) => {
    if (!isLoggedIn) {
      alert('请先登录');
      return;
    }
    try {
      const { followAPI } = await import('./api');
      const isFollowing = following.has(creatorId);
      const res = isFollowing ? await followAPI.unfollow(creatorId) : await followAPI.follow(creatorId);
      if (res.success) {
        setFollowing(prev => {
          const next = new Set(prev);
          if (isFollowing) next.delete(creatorId);
          else next.add(creatorId);
          return next;
        });
        setCreators(prev => prev.map(c => c.id === creatorId ? { ...c, followers: Math.max(0, c.followers + (isFollowing ? -1 : 1)) } : c));
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>🏆 Top 创作者</h1>
      {loading ? <div style={{ textAlign: 'center', padding: 100 }}>加载中...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {creators.map((c, i) => (
            <div key={c.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: i < 3 ? '#fbbf24' : '#6b7280', width: 32 }}>#{i + 1}</div>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: avatarColors[i % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600 }}>
                {c.nickname?.charAt(0) || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16, marginBottom: 4 }}>{c.nickname}</h3>
                <p style={{ fontSize: 12, color: '#6b7280' }}>{c.followers} 粉丝 · {c.content_count} 作品</p>
              </div>
              <button
                onClick={() => handleFollow(c.id)}
                style={{
                  padding: '6px 16px',
                  background: following.has(c.id) ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  border: 'none',
                  borderRadius: 20,
                  color: '#fff',
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                {following.has(c.id) ? '已关注' : '关注'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FollowPage = () => {
  const [contents, setContents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    (async () => {
      try {
        const { followAPI } = await import('./api');
        const res = await followAPI.getFollowContents({ limit: 20 });
        if (res.success) setContents(res.data.list || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>❤️ 关注动态</h1>
      {loading ? <div style={{ textAlign: 'center', padding: 100 }}>加载中...</div> : contents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 100, color: '#6b7280' }}>还没有关注任何人，去发现更多创作者吧～</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {contents.map((item, idx) => (
            <div key={item.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ position: 'relative', aspectRatio: '16/9', background: coverGradients[idx % coverGradients.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                🎧
              </div>
              <div style={{ padding: 16 }}>
                <h3 style={{ fontSize: 16, marginBottom: 8 }}>{item.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: avatarColors[idx % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>
                    {item.author_name?.charAt(0) || '?'}
                  </div>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>{item.author_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ContentPage = () => {
  const id = window.location.pathname.split('/')[2];
  const [content, setContent] = React.useState(null);
  const [comments, setComments] = React.useState([]);
  const [comment, setComment] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(0.8);
  const mediaRef = React.useRef(null);
  const progressInterval = React.useRef(null);

  React.useEffect(() => {
    (async () => {
      try {
        const { contentAPI } = await import('./api');
        const [res1, res2] = await Promise.all([contentAPI.getContent(id), contentAPI.getComments(id)]);
        if (res1.success) {
          setContent(res1.data);
          setDuration(res1.data.duration || 1800);
        }
        if (res2.success) setComments(res2.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [id]);

  const togglePlay = () => {
    if (isPlaying) {
      clearInterval(progressInterval.current);
    } else {
      progressInterval.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            clearInterval(progressInterval.current);
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const { contentAPI } = await import('./api');
      const res = await contentAPI.addComment(id, comment);
      if (res.success) {
        setComment('');
        const res2 = await contentAPI.getComments(id);
        if (res2.success) setComments(res2.data);
      }
    } catch (e) { console.error(e); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}>加载中...</div>;
  if (!content) return <div style={{ textAlign: 'center', padding: 100 }}>内容不存在</div>;
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{
          aspectRatio: '16/9',
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: 'pointer',
        }} onClick={togglePlay}>
          <div style={{ fontSize: 80, marginBottom: 16 }}>{isPlaying ? '⏸️' : (content.content_type === 'audio' ? '🎵' : '🎬')}</div>
          <p style={{ color: '#9ca3af', marginBottom: 20 }}>{isPlaying ? '播放中...' : '点击播放'}</p>
          
          <div style={{ width: '80%', maxWidth: 500 }}>
            <div style={{
              width: '100%',
              height: 6,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${(currentTime / duration) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #8b5cf6, #f472b6)',
                transition: 'width 0.1s linear',
              }} />
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: '#9ca3af',
              marginTop: 8,
            }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 20 }}>
            <button onClick={(e) => { e.stopPropagation(); setCurrentTime(Math.max(0, currentTime - 10)); }} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>⏮️</button>
            <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #f472b6)', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <button onClick={(e) => { e.stopPropagation(); setCurrentTime(Math.min(duration, currentTime + 10)); }} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>⏭️</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 20 }}>
              <span>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                style={{ width: 80 }}
              />
            </div>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <h1 style={{ fontSize: 24, marginBottom: 16 }}>{content.title}</h1>
          <p style={{ color: '#9ca3af', marginBottom: 16 }}>{content.description}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: avatarColors[0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600 }}>
              {content.author_name?.charAt(0) || '?'}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{content.author_name}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>👁️ {content.views} 播放 · ❤️ {content.likes} 喜欢</div>
            </div>
            <button style={{ marginLeft: 'auto', padding: '8px 24px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', border: 'none', borderRadius: 20, color: '#fff' }}>❤️ 喜欢</button>
          </div>
        </div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>💬 评论 ({comments.length})</h2>
        <form onSubmit={submitComment} style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
          <input
            type="text"
            inputMode="text"
            style={{ flex: 1, padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', outline: 'none' }}
            placeholder="发表你的评论..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button type="submit" style={{ padding: '0 24px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', border: 'none', borderRadius: 8, color: '#fff' }}>发送</button>
        </form>
        {comments.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: 40 }}>暂无评论，快来抢沙发～</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {comments.map((c, idx) => (
              <div key={c.id} style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarColors[idx % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>
                  {c.user_name?.charAt(0) || '?'}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{c.user_name}</div>
                  <p style={{ fontSize: 14, color: '#d1d5db' }}>{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const productIcons = ['🎧', '😴', '💤', '🛏️', '🕯️', '🎁'];

const SleepPage = () => {
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    (async () => {
      try {
        const { productAPI } = await import('./api');
        const res = await productAPI.getProducts({ limit: 20 });
        if (res.success) setProducts(res.data.list || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>😴 睡购商城</h1>
      {loading ? <div style={{ textAlign: 'center', padding: 100 }}>加载中...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {products.map((p, idx) => (
            <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ aspectRatio: 1, background: coverGradients[idx % coverGradients.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
                {productIcons[idx % productIcons.length]}
              </div>
              <div style={{ padding: 16 }}>
                <h3 style={{ fontSize: 15, marginBottom: 8 }}>{p.name}</h3>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>{p.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#f97316' }}>¥{p.price}</span>
                  <button style={{ padding: '6px 16px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', border: 'none', borderRadius: 20, color: '#fff', fontSize: 12 }}>购买</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProfilePage = () => {
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    (async () => {
      try {
        const { authAPI } = await import('./api');
        const res = await authAPI.getProfile();
        if (res.success) setProfile(res.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);
  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}>加载中...</div>;
  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 32, textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px', background: avatarColors[1], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700 }}>
          {profile?.nickname?.charAt(0) || '?'}
        </div>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>{profile?.nickname}</h1>
        <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>{profile?.bio || '这个人很懒，什么都没写'}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{profile?.contents || 0}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>作品</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{profile?.followers || 0}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>粉丝</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{profile?.following || 0}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>关注</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{profile?.total_views || 0}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>播放</div>
          </div>
        </div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, overflow: 'hidden' }}>
        {['我的作品', '我的收藏', '浏览历史', '设置'].map((item, i) => (
          <div key={i} style={{ padding: '16px 20px', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span>{item}</span>
            <span style={{ color: '#6b7280' }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SearchPage = () => {
  const params = new URLSearchParams(window.location.search);
  const keyword = params.get('keyword') || '';
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!keyword) return;
    (async () => {
      try {
        const { searchAPI } = await import('./api');
        const res = await searchAPI.search({ keyword, limit: 20 });
        if (res.success) setResults(res.data.list || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [keyword]);
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>🔍 搜索: {keyword}</h1>
      {loading ? <div style={{ textAlign: 'center', padding: 100 }}>搜索中...</div> : results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 100, color: '#6b7280' }}>没有找到相关内容</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {results.map((item, idx) => (
            <div key={item.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ position: 'relative', aspectRatio: '16/9', background: coverGradients[idx % coverGradients.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                🔍
              </div>
              <div style={{ padding: 16 }}>
                <h3 style={{ fontSize: 16, marginBottom: 8 }}>{item.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: avatarColors[idx % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>
                    {item.author_name?.charAt(0) || '?'}
                  </div>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>{item.author_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="live" element={<LivePage />} />
        <Route path="top" element={<TopPage />} />
        <Route path="follow" element={<ProtectedRoute><FollowPage /></ProtectedRoute>} />
        <Route path="content/:id" element={<ContentPage />} />
        <Route path="sleep" element={<SleepPage />} />
        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="search" element={<SearchPage />} />
      </Route>
    </Routes>
  );
};

export default App;
