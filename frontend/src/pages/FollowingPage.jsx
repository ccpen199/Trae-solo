import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import useUserStore from '../store/userStore';
import { videoAPI, userAPI } from '../services/api';

const FollowingPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      loadVideos();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await videoAPI.getFollowing({ limit: 10 });
      const videoData = response.data.data.list || [];
      setVideos(videoData);
    } catch (error) {
      console.error('Load following videos error:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId, isFollowing) => {
    try {
      if (isFollowing) {
        await userAPI.unfollowUser(userId);
      } else {
        await userAPI.followUser(userId);
      }
      loadVideos();
    } catch (error) {
      console.error('Follow error:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100%',
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <p style={{ color: '#fff', marginBottom: '20px' }}>登录后查看关注的人发布的视频</p>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '12px 32px',
            background: '#fe2c55',
            border: 'none',
            borderRadius: '24px',
            color: '#fff',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          去登录
        </button>
        <BottomNav />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100%', background: '#000', padding: '100px 20px', textAlign: 'center', color: '#fff' }}>
        加载中...
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', background: '#000', paddingBottom: '80px' }}>
      <div style={{ padding: '50px 20px 20px' }}>
        <h1 style={{ color: '#fff', fontSize: '24px', marginBottom: '20px' }}>关注</h1>
      </div>

      {videos.length === 0 ? (
        <div style={{ padding: '100px 20px', textAlign: 'center' }}>
          <p style={{ color: '#999' }}>暂无关注的人发布的视频</p>
        </div>
      ) : (
        <div style={{ padding: '0 20px' }}>
          {videos.map((video) => (
            <div key={video.id} style={{
              background: '#1a1a1a',
              borderRadius: '12px',
              marginBottom: '16px',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                gap: '12px'
              }}>
                <img
                  src={video.avatar || 'https://picsum.photos/50/50'}
                  alt="avatar"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {video.nickname}
                  </div>
                  <div style={{ color: '#999', fontSize: '12px' }}>
                    {new Date(video.created_at).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handleFollow(video.user_id, true)}
                  style={{
                    padding: '6px 16px',
                    background: '#333',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  已关注
                </button>
              </div>

              <div style={{ position: 'relative' }} onClick={() => navigate(`/video/${video.id}`)}>
                <video
                  src={video.video_url || 'https://www.w3schools.com/html/mov_bbb.mp4'}
                  style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', display: 'block' }}
                  muted
                  poster={`https://picsum.photos/400/300?random=${video.id}`}
                />
              </div>

              <div style={{ padding: '12px' }}>
                <p style={{ color: '#fff', fontSize: '14px', marginBottom: '12px' }}>
                  {video.description}
                </p>
                <div style={{ display: 'flex', gap: '24px', color: '#999', fontSize: '12px' }}>
                  <span
                    style={{ cursor: 'pointer' }}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!isAuthenticated) {
                        navigate('/login');
                        return;
                      }
                      try {
                        await videoAPI.like(video.id);
                        setVideos(prev => prev.map(v =>
                          v.id === video.id ? { ...v, like_count: v.like_count + 1 } : v
                        ));
                      } catch (error) {
                        console.error('Like error:', error);
                      }
                    }}
                  >
                    ❤️ {video.like_count}
                  </span>
                  <span
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/video/${video.id}`);
                    }}
                  >
                    💬 {video.comment_count}
                  </span>
                  <span
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (navigator.share) {
                        navigator.share({
                          title: video.title || '精彩视频',
                          text: video.description || '来看这个精彩视频！',
                          url: `${window.location.origin}/video/${video.id}`
                        }).catch(() => {});
                      } else {
                        alert('分享功能已触发');
                      }
                    }}
                  >
                    🔗 {video.share_count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default FollowingPage;
