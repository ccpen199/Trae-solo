import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import request from '../utils/request';
import Loading from '../components/Loading';
import useStore from '../store/useStore';

const UserCenter = ({ isMy = false }) => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, logout } = useStore(state => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    logout: state.logout
  }));
  
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('videos');

  const targetUserId = isMy ? currentUser?.id : userId;

  useEffect(() => {
    if (targetUserId) {
      fetchUserProfile();
    }
  }, [targetUserId]);

  const fetchUserProfile = async () => {
    try {
      const res = await request.get(`/user/profile/${targetUserId}`);
      setUserProfile(res.data?.user || getMockUser());
      setIsFollowing(res.data?.isFollowing || false);
    } catch (error) {
      setUserProfile(getMockUser());
    } finally {
      setLoading(false);
    }
  };

  const getMockUser = () => ({
    id: targetUserId || 1,
    nickname: isMy && currentUser ? currentUser.nickname : 'B站用户',
    avatar: `https://i.pravatar.cc/200?img=${targetUserId || 1}`,
    signature: '这个人很懒，什么都没有写~',
    level: isMy && currentUser ? currentUser.level || 1 : 3,
    exp: 2500,
    coins: 128,
    vip_type: isMy && currentUser ? currentUser.vip_type || 0 : 0,
    follower_count: 1234,
    following_count: 567,
    video_count: 42,
    view_count: 123456,
    like_count: 98765,
    created_at: Date.now() / 1000 - 86400 * 365
  });

  const handleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await request.post(`/user/follow/${targetUserId}`);
      setIsFollowing(!isFollowing);
    } catch (error) {
      setIsFollowing(!isFollowing);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const levelInfo = [
    { level: 0, exp: 0, name: '注册会员' },
    { level: 1, exp: 0, name: '正式会员' },
    { level: 2, exp: 200, name: 'Lv2' },
    { level: 3, exp: 1500, name: 'Lv3' },
    { level: 4, exp: 4500, name: 'Lv4' },
    { level: 5, exp: 10800, name: 'Lv5' },
    { level: 6, exp: 28800, name: 'Lv6' },
  ];

  const getNextLevelExp = (level) => {
    const next = levelInfo.find(l => l.level === level + 1);
    return next ? next.exp : 999999;
  };

  const mockVideos = [
    { id: 1, title: '【Vlog】我的一天生活记录', cover: 'https://picsum.photos/320/180?random=400', view_count: 12345, created_at: Date.now() / 1000 - 86400 * 3 },
    { id: 2, title: '【教程】React入门到精通', cover: 'https://picsum.photos/320/180?random=401', view_count: 56789, created_at: Date.now() / 1000 - 86400 * 7 },
    { id: 3, title: '【美食】在家做一顿大餐', cover: 'https://picsum.photos/320/180?random=402', view_count: 34567, created_at: Date.now() / 1000 - 86400 * 14 },
  ];

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 0' }}>
        <Loading />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>😢</div>
        <p>用户不存在</p>
      </div>
    );
  }

  const nextExp = getNextLevelExp(userProfile.level);
  const currentExp = userProfile.exp;
  const prevExp = levelInfo.find(l => l.level === userProfile.level)?.exp || 0;
  const progress = ((currentExp - prevExp) / (nextExp - prevExp)) * 100;

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <img
            src={userProfile.avatar}
            alt={userProfile.nickname}
            style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 600 }}>{userProfile.nickname}</h1>
              {userProfile.vip_type > 0 && (
                <span style={{
                  background: 'linear-gradient(135deg, #fb7299, #ff9c6a)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  大会员
                </span>
              )}
              <span style={{
                backgroundColor: '#00a1d6',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                Lv{userProfile.level}
              </span>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {userProfile.signature}
            </p>

            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>经验值</span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{userProfile.exp} / {nextExp}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  还需 {nextExp - userProfile.exp} 升级到 Lv{userProfile.level + 1}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e5e9ef',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(progress, 100)}%`,
                  height: '100%',
                  backgroundColor: '#00a1d6',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '32px', marginBottom: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 600 }}>{userProfile.following_count}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>关注</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 600 }}>{userProfile.follower_count}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>粉丝</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 600 }}>{userProfile.coins}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>硬币</div>
              </div>
            </div>

            {isMy ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-outline" style={{ padding: '8px 24px' }}>
                  编辑资料
                </button>
                <button
                  onClick={handleLogout}
                  className="btn"
                  style={{ padding: '8px 24px', backgroundColor: '#ff4d4f', color: 'white' }}
                >
                  退出登录
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleFollow}
                  className="btn"
                  style={{
                    padding: '8px 24px',
                    backgroundColor: isFollowing ? 'var(--bg-secondary)' : 'var(--primary-color)',
                    color: isFollowing ? 'var(--text-primary)' : 'white',
                    border: isFollowing ? '1px solid var(--border-color)' : 'none'
                  }}
                >
                  {isFollowing ? '已关注' : '+ 关注'}
                </button>
                <button className="btn btn-outline" style={{ padding: '8px 24px' }}>
                  发消息
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ flex: 1 }}>
          <div className="card" style={{ padding: '0', marginBottom: '24px' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
              {['videos', 'favorites', 'following'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '16px 24px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-secondary)',
                    fontSize: '14px',
                    fontWeight: activeTab === tab ? 600 : 400,
                    cursor: 'pointer',
                    borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : '2px solid transparent'
                  }}
                >
                  {tab === 'videos' ? '投稿视频' : tab === 'favorites' ? '收藏夹' : '关注列表'}
                </button>
              ))}
            </div>

            <div style={{ padding: '20px' }}>
              {activeTab === 'videos' && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  {mockVideos.map(video => (
                    <div key={video.id} className="card" style={{ overflow: 'hidden' }}>
                      <div style={{ position: 'relative' }}>
                        <img
                          src={video.cover}
                          alt={video.title}
                          style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }}
                        />
                        <span style={{
                          position: 'absolute',
                          bottom: '8px',
                          right: '8px',
                          backgroundColor: 'rgba(0,0,0,0.75)',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          👁 {video.view_count}
                        </span>
                      </div>
                      <div style={{ padding: '12px' }}>
                        <h3 className="text-ellipsis-2" style={{ fontSize: '14px', fontWeight: 500 }}>
                          {video.title}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'favorites' && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
                  <p style={{ color: 'var(--text-muted)' }}>暂无收藏</p>
                </div>
              )}

              {activeTab === 'following' && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                  <p style={{ color: 'var(--text-muted)' }}>关注了 {userProfile.following_count} 个UP主</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ width: '300px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>个人信息</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>用户ID</span>
                <span>{userProfile.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>视频数</span>
                <span>{userProfile.video_count}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>总播放</span>
                <span>{userProfile.view_count}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>获赞</span>
                <span>{userProfile.like_count}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>注册时间</span>
                <span>{new Date(userProfile.created_at * 1000).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCenter;
