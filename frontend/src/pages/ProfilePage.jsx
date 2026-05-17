import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Settings, Edit3, Grid3X3, LogOut } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import useUserStore from '../store/userStore';
import { userAPI, videoAPI } from '../services/api';

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, logout } = useUserStore();
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = !id || (currentUser && currentUser.id === parseInt(id));
  const userId = id ? parseInt(id) : currentUser?.id;

  useEffect(() => {
    if (userId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // 并行加载用户信息和视频
      await Promise.all([loadProfile(), loadVideos()]);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await userAPI.getUserById(userId);
      setProfile(response.data.data);
      setIsFollowing(response.data.data.is_following || false);
    } catch (error) {
      console.error('Load profile error:', error);
      // 优先使用 store 中的用户数据
      const userData = isOwnProfile && currentUser ? currentUser : {};
      setProfile({
        id: userId,
        nickname: userData.nickname || (isOwnProfile ? '我' : '用户'),
        avatar: userData.avatar || `https://picsum.photos/100/100?random=${userId}`,
        bio: userData.bio || '这个人很懒，什么都没写',
        following_count: userData.following_count || 0,
        follower_count: userData.follower_count || 0,
        video_count: userData.video_count || 0
      });
    }
  };

  const loadVideos = async () => {
    try {
      const response = await videoAPI.getUserVideos(userId, { limit: 20 });
      setVideos(response.data.data.list || []);
    } catch (error) {
      console.error('Load user videos error:', error);
      setVideos([]);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (isFollowing) {
        await userAPI.unfollowUser(userId);
      } else {
        await userAPI.followUser(userId);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Follow error:', error);
    }
  };

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
      navigate('/');
    }
  };

  if (!isAuthenticated && isOwnProfile) {
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
        <p style={{ color: '#fff', marginBottom: '20px' }}>登录后查看个人主页</p>
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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '50px 20px 20px'
      }}>
        {!isOwnProfile ? (
          <ArrowLeft
            size={24}
            color="#fff"
            onClick={() => navigate(-1)}
            style={{ cursor: 'pointer' }}
          />
        ) : <div style={{ width: 24 }} />}
        <h1 style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
          {profile?.nickname || '用户'}
        </h1>
        {isOwnProfile ? (
          <Settings size={24} color="#fff" style={{ cursor: 'pointer' }} />
        ) : <div style={{ width: 24 }} />}
      </div>

      <div style={{ padding: '0 20px 20px', textAlign: 'center' }}>
        <img
          src={profile?.avatar || `https://picsum.photos/100/100?random=${userId}`}
          alt="avatar"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            marginBottom: '12px',
            objectFit: 'cover'
          }}
        />
        <h2 style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>
          @{profile?.nickname || '用户'}
        </h2>
        <p style={{ color: '#999', fontSize: '14px', marginBottom: '20px' }}>
          {profile?.bio || '这个人很懒，什么都没写'}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '20px' }}>
          <div>
            <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
              {profile?.following_count || 0}
            </div>
            <div style={{ color: '#999', fontSize: '12px' }}>关注</div>
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
              {profile?.follower_count || 0}
            </div>
            <div style={{ color: '#999', fontSize: '12px' }}>粉丝</div>
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
              {profile?.video_count || 0}
            </div>
            <div style={{ color: '#999', fontSize: '12px' }}>作品</div>
          </div>
        </div>

        {isOwnProfile ? (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/edit-profile')}
              style={{
                flex: 1,
                padding: '10px',
                background: '#333',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Edit3 size={16} />
              编辑资料
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 16px',
                background: '#333',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <LogOut size={16} />
              退出
            </button>
          </div>
        ) : (
          <button
            onClick={handleFollow}
            style={{
              width: '100%',
              padding: '10px',
              background: isFollowing ? '#333' : '#fe2c55',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {isFollowing ? '已关注' : '关注'}
          </button>
        )}
      </div>

      <div style={{
        display: 'flex',
        borderTop: '1px solid #333',
        borderBottom: '1px solid #333'
      }}>
        <button style={{
          flex: 1,
          padding: '12px',
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <Grid3X3 size={18} />
          作品
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '2px'
      }}>
        {videos.map((video) => (
          <div
            key={video.id}
            onClick={() => navigate(`/video/${video.id}`)}
            style={{
              position: 'relative',
              aspectRatio: '9/16',
              cursor: 'pointer'
            }}
          >
            <img
              src={video.cover_url || video.cover || `https://picsum.photos/200/350?random=${video.id}`}
              alt="video"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              color: '#fff',
              fontSize: '12px'
            }}>
              ❤️ {video.like_count}
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;
