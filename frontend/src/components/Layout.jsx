import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { useToast } from '../App';

const tabs = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/posts', label: '动态', icon: '📝' },
  { path: '/rank', label: '排行', icon: '🏆' },
  { path: '/profile', label: '我的', icon: '👤' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, triggerProfileRefresh } = useStore();
  const { showToast } = useToast();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [followingIds, setFollowingIds] = useState(new Set());

  useEffect(() => {
    if (user && searchResults.length > 0) {
      loadFollowStatus();
    }
  }, [user, searchResults]);

  const loadFollowStatus = async () => {
    try {
      const { userAPI } = await import('../api');
      const statusPromises = searchResults.map(async (item) => {
        try {
          const res = await userAPI.getFollowStatus(item.id);
          return { id: item.id, isFollowing: res.data.data.isFollowing };
        } catch {
          return { id: item.id, isFollowing: false };
        }
      });
      const results = await Promise.all(statusPromises);
      const ids = new Set(results.filter(r => r.isFollowing).map(r => r.id));
      setFollowingIds(ids);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (e) => {
    const keyword = e.target.value;
    setSearchKeyword(keyword);
    
    if (!keyword.trim()) {
      setSearchResults([]);
      setFollowingIds(new Set());
      return;
    }

    setSearchLoading(true);
    try {
      const { searchAPI } = await import('../api');
      const res = await searchAPI.search(keyword);
      if (res.data.success) {
        setSearchResults(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname, needLogin: true } });
      return;
    }
    try {
      const { userAPI } = await import('../api');
      const res = await userAPI.follow(userId);
      if (res.data.success) {
        const isFollowing = res.data.data.isFollowing;
        setFollowingIds(prev => {
          const newSet = new Set(prev);
          if (isFollowing) {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });
        triggerProfileRefresh();
        showToast(isFollowing ? '关注成功' : '已取消关注', 'success');
      }
    } catch (err) {
      showToast('操作失败', 'error');
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'white',
        padding: '12px 16px',
        borderBottom: '1px solid var(--gray-100)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>🦩 千鹤</span>
        </div>
        <button
          onClick={() => setSearchOpen(true)}
          style={{
            padding: '8px 16px',
            background: 'var(--gray-100)',
            borderRadius: 20,
            color: 'var(--gray-500)',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span>🔍</span> 搜索
        </button>
      </header>

      <main style={{ flex: 1, paddingBottom: 70 }}>
        <Outlet />
      </main>

      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderTop: '1px solid var(--gray-100)',
        display: 'flex',
        padding: '8px 0',
        zIndex: 100
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '8px',
              background: 'none',
              color: location.pathname === tab.path ? 'var(--primary)' : 'var(--gray-500)'
            }}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{ fontSize: 12 }}>{tab.label}</span>
          </button>
        ))}
      </nav>

      {searchOpen && (
        <>
          <div
            onClick={() => setSearchOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 200
            }}
          />
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            maxWidth: 400,
            background: 'white',
            zIndex: 201,
            transform: searchOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s ease'
          }}>
            <div style={{
              padding: 16,
              borderBottom: '1px solid var(--gray-100)',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <button onClick={() => setSearchOpen(false)} style={{ background: 'none', fontSize: 20 }}>
                ✕
              </button>
              <input
                autoFocus
                value={searchKeyword}
                onChange={handleSearch}
                placeholder="搜索主播..."
                className="input"
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ padding: 16, overflowY: 'auto', height: 'calc(100% - 70px)' }}>
              {searchLoading ? (
                <div className="loading"><div className="spinner" /></div>
              ) : searchResults.length === 0 ? (
                searchKeyword ? (
                  <div style={{ textAlign: 'center', color: 'var(--gray-500)', padding: 40 }}>
                    未找到相关结果
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--gray-500)', padding: 40 }}>
                    输入关键词搜索
                  </div>
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        navigate(`/user/${item.id}`);
                        setSearchOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: 12,
                        borderRadius: 12,
                        cursor: 'pointer'
                      }}
                    >
                      <img
                        src={item.avatar}
                        alt={item.nickname}
                        className="avatar"
                        style={{ width: 48, height: 48 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600 }}>{item.nickname}</span>
                          {item.is_verified && <span style={{ color: 'var(--primary)' }}>✓</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                          {item.followers?.toLocaleString()} 粉丝
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollow(item.id);
                        }}
                        className="btn"
                        style={{
                          padding: '6px 12px',
                          fontSize: 12,
                          background: followingIds.has(item.id) ? 'var(--gray-100)' : 'var(--primary)',
                          color: followingIds.has(item.id) ? 'var(--gray-600)' : 'white',
                          border: 'none',
                          borderRadius: 8,
                          cursor: 'pointer'
                        }}
                      >
                        {followingIds.has(item.id) ? '已关注' : '+ 关注'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
