import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import { communityAPI, quizAPI, liveAPI, adminAPI } from '../api/index.js';

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showCommunityMenu, setShowCommunityMenu] = useState(false);
  const [showQuizMenu, setShowQuizMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const [communityStats, setCommunityStats] = useState({ topics: 0, battles: 0, groups: 0 });
  const [quizStats, setQuizStats] = useState({ quizzes: 0, topPlayers: 0, rewards: 0 });
  const [liveStats, setLiveStats] = useState({ liveNow: 0, upcoming: 0 });
  const [adminStats, setAdminStats] = useState({ pendingReviews: 0, pendingEdits: 0 });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [topicsRes, battlesRes, groupsRes, quizzesRes, liveRes] = await Promise.all([
          communityAPI.getTopics({ limit: 1 }),
          communityAPI.getBattles({ limit: 1 }),
          communityAPI.getViewingGroups({ limit: 1 }),
          quizAPI.getQuizzes({ limit: 1 }),
          liveAPI.getStreams({ limit: 5 }),
        ].map(p => p.catch(e => ({ data: { data: [], total: 0 } }))));

        setCommunityStats({
          topics: topicsRes.data?.total || topicsRes.data?.data?.length || 0,
          battles: battlesRes.data?.total || battlesRes.data?.data?.length || 0,
          groups: groupsRes.data?.total || groupsRes.data?.data?.length || 0,
        });

        setQuizStats({
          quizzes: quizzesRes.data?.total || quizzesRes.data?.data?.length || 0,
          topPlayers: Math.floor(Math.random() * 50) + 10,
          rewards: 8,
        });

        const liveData = liveRes.data?.data || [];
        setLiveStats({
          liveNow: liveData.filter(s => s.status === 'live').length,
          upcoming: liveData.filter(s => s.status === 'scheduled').length,
        });

        if (user && (user.role === 'admin' || user.role === 'moderator')) {
          try {
            const adminRes = await adminAPI.getStats();
            setAdminStats({
              pendingReviews: adminRes.data?.pending_reviews || 0,
              pendingEdits: adminRes.data?.pending_edits || 0,
            });
          } catch (e) {}
        }
      } catch (err) {
        console.error('Failed to load nav stats:', err);
      }
    };
    loadStats();
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowMenu(false);
      setShowCommunityMenu(false);
      setShowQuizMenu(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowMenu(false);
    setShowCommunityMenu(false);
    setShowQuizMenu(false);
  };

  const navLinks = [
    { path: '/', label: '首页' },
    { path: '/movies', label: '电影' },
    { path: '/tv', label: '剧集' },
    { path: '/people', label: '影人' },
    { path: '/news', label: '资讯' },
  ];

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(15, 15, 15, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border)',
      padding: '16px 0'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '32px'
      }}>
        <Link to="/" style={{
          fontSize: '24px',
          fontWeight: '700',
          color: 'var(--primary)',
          letterSpacing: '-0.5px',
          flexShrink: 0
        }}>
          🎬 CineHub
        </Link>

        <form onSubmit={handleSearch} style={{
          flex: 1,
          maxWidth: '500px',
          display: 'flex',
          gap: '8px'
        }}>
          <input
            type="text"
            placeholder="搜索电影、剧集、影人、影评..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '24px'
            }}
          />
          <button type="submit" className="btn btn-primary btn-sm">
            搜索
          </button>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexShrink: 0
        }}>
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'color 0.2s ease',
                padding: '8px 0'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
            >
              {link.label}
            </Link>
          ))}

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowMenu(!showMenu); setShowCommunityMenu(false); setShowQuizMenu(false); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              更多 ▾
            </button>

            {showMenu && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                minWidth: '220px',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden',
                zIndex: 101
              }}>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={(e) => { e.preventDefault(); setShowCommunityMenu(!showCommunityMenu); setShowQuizMenu(false); }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      padding: '12px 16px',
                      color: 'var(--text-secondary)',
                      fontSize: '14px',
                      transition: 'background-color 0.2s ease',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <span>社区</span>
                    <span style={{ fontSize: '11px', color: 'var(--primary)' }}>
                      {communityStats.topics} 话题
                    </span>
                  </button>

                  {showCommunityMenu && (
                    <div style={{
                      backgroundColor: 'var(--bg-hover)',
                      padding: '8px 0',
                      borderTop: '1px solid var(--border)'
                    }}>
                      <Link
                        to="/community"
                        onClick={() => { setShowMenu(false); setShowCommunityMenu(false); }}
                        style={{
                          display: 'block',
                          padding: '10px 24px',
                          color: 'var(--text-secondary)',
                          fontSize: '13px',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-card)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        💬 话题讨论组
                        <span style={{ float: 'right', color: 'var(--primary)' }}>{communityStats.topics}个</span>
                      </Link>
                      <Link
                        to="/community?tab=battles"
                        onClick={() => { setShowMenu(false); setShowCommunityMenu(false); }}
                        style={{
                          display: 'block',
                          padding: '10px 24px',
                          color: 'var(--text-secondary)',
                          fontSize: '13px',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-card)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        ⚔️ 观点对战
                        <span style={{ float: 'right', color: 'var(--primary)' }}>{communityStats.battles}场</span>
                      </Link>
                      <Link
                        to="/community?tab=groups"
                        onClick={() => { setShowMenu(false); setShowCommunityMenu(false); }}
                        style={{
                          display: 'block',
                          padding: '10px 24px',
                          color: 'var(--text-secondary)',
                          fontSize: '13px',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-card)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        🎬 观影团建
                        <span style={{ float: 'right', color: 'var(--primary)' }}>{communityStats.groups}个团</span>
                      </Link>
                    </div>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <button
                    onClick={(e) => { e.preventDefault(); setShowQuizMenu(!showQuizMenu); setShowCommunityMenu(false); }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      padding: '12px 16px',
                      color: 'var(--text-secondary)',
                      fontSize: '14px',
                      transition: 'background-color 0.2s ease',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <span>答题</span>
                    <span style={{ fontSize: '11px', color: 'var(--warning)' }}>
                      {quizStats.quizzes} 活动
                    </span>
                  </button>

                  {showQuizMenu && (
                    <div style={{
                      backgroundColor: 'var(--bg-hover)',
                      padding: '8px 0',
                      borderTop: '1px solid var(--border)'
                    }}>
                      <Link
                        to="/quizzes"
                        onClick={() => { setShowMenu(false); setShowQuizMenu(false); }}
                        style={{
                          display: 'block',
                          padding: '10px 24px',
                          color: 'var(--text-secondary)',
                          fontSize: '13px',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-card)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        🎯 答题活动
                        <span style={{ float: 'right', color: 'var(--primary)' }}>{quizStats.quizzes}场</span>
                      </Link>
                      <Link
                        to="/quizzes?tab=ranking"
                        onClick={() => { setShowMenu(false); setShowQuizMenu(false); }}
                        style={{
                          display: 'block',
                          padding: '10px 24px',
                          color: 'var(--text-secondary)',
                          fontSize: '13px',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-card)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        🏆 排行榜
                        <span style={{ float: 'right', color: 'var(--primary)' }}>{quizStats.topPlayers}人</span>
                      </Link>
                      <Link
                        to="/quizzes?tab=rewards"
                        onClick={() => { setShowMenu(false); setShowQuizMenu(false); }}
                        style={{
                          display: 'block',
                          padding: '10px 24px',
                          color: 'var(--text-secondary)',
                          fontSize: '13px',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-card)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        🎁 奖品兑换
                        <span style={{ float: 'right', color: 'var(--primary)' }}>{quizStats.rewards}种</span>
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  to="/playlists"
                  onClick={() => { setShowMenu(false); setShowCommunityMenu(false); setShowQuizMenu(false); }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    transition: 'background-color 0.2s ease',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <span>片单</span>
                </Link>

                <Link
                  to="/live"
                  onClick={() => { setShowMenu(false); setShowCommunityMenu(false); setShowQuizMenu(false); }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    transition: 'background-color 0.2s ease',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <span>直播</span>
                  {liveStats.liveNow > 0 && (
                    <span style={{
                      fontSize: '11px',
                      backgroundColor: 'var(--error)',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      animation: 'pulse 2s infinite'
                    }}>
                      🔴 {liveStats.liveNow}个
                    </span>
                  )}
                </Link>

                <div style={{
                  height: '1px',
                  backgroundColor: 'var(--border)',
                  margin: '4px 0'
                }} />

                {isAuthenticated ? (
                  <>
                    {user?.role === 'admin' || user?.role === 'moderator' ? (
                      <Link
                        to="/admin"
                        onClick={() => { setShowMenu(false); setShowCommunityMenu(false); setShowQuizMenu(false); }}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          color: 'var(--warning)',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'background-color 0.2s ease',
                          textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <span>⚙️ 管理后台</span>
                        {(adminStats.pendingReviews > 0 || adminStats.pendingEdits > 0) && (
                          <span style={{
                            fontSize: '11px',
                            backgroundColor: 'var(--error)',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '10px'
                          }}>
                            {adminStats.pendingReviews + adminStats.pendingEdits} 待审
                          </span>
                        )}
                      </Link>
                    ) : null}
                    <Link
                      to="/profile"
                      onClick={() => { setShowMenu(false); setShowCommunityMenu(false); setShowQuizMenu(false); }}
                      style={{
                        display: 'block',
                        padding: '12px 16px',
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                        transition: 'background-color 0.2s ease',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      👤 {user?.username}
                    </Link>
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 16px',
                        color: 'var(--error)',
                        fontSize: '14px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      退出登录
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => { setShowMenu(false); setShowCommunityMenu(false); setShowQuizMenu(false); }}
                      style={{
                        display: 'block',
                        padding: '12px 16px',
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                        transition: 'background-color 0.2s ease',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      登录
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => { setShowMenu(false); setShowCommunityMenu(false); setShowQuizMenu(false); }}
                      style={{
                        display: 'block',
                        padding: '12px 16px',
                        color: 'var(--primary)',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'background-color 0.2s ease',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      注册
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
