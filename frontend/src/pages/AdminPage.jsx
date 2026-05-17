import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Video, MessageCircle, Heart, Trash2, BarChart2 } from 'lucide-react';
import useUserStore from '../store/userStore';
import api from '../services/api';

const AdminPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [activeTab, isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'stats') {
        const response = await api.get('/api/admin/stats');
        setStats(response.data.data);
      } else if (activeTab === 'users') {
        const response = await api.get('/api/admin/users');
        setUsers(response.data.data.list);
      } else if (activeTab === 'videos') {
        const response = await api.get('/api/admin/videos');
        setVideos(response.data.data.list);
      }
    } catch (error) {
      console.error('Load admin data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!confirm('确定要删除这个视频吗？')) return;

    try {
      await api.delete(`/api/admin/videos/${videoId}`);
      alert('删除成功');
      loadData();
    } catch (error) {
      alert('删除失败');
    }
  };

  const tabs = [
    { id: 'stats', label: '数据统计', icon: BarChart2 },
    { id: 'users', label: '用户管理', icon: Users },
    { id: 'videos', label: '视频管理', icon: Video }
  ];

  if (!isAuthenticated) return null;

  return (
    <div style={{ minHeight: '100%', background: '#000' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '50px 20px 20px',
        borderBottom: '1px solid #333'
      }}>
        <ArrowLeft
          size={24} color="#fff" style={{ cursor: 'pointer' }} onClick={() => navigate('/')} />
        <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
          管理后台
        </h1>
      </div>

      <div style={{
        display: 'flex',
        borderBottom: '1px solid #333'
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '14px 16px',
                background: 'none',
                border: 'none',
                color: activeTab === tab.id ? '#fe2c55' : '#999',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderBottom: activeTab === tab.id ? '2px solid #fe2c55' : '2px solid transparent'
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#fff' }}>
            加载中...
          </div>
        ) : (
          <>
            {activeTab === 'stats' && stats && (
              <div>
                <h2 style={{ color: '#fff', fontSize: '18px', marginBottom: '20px' }}>
                  数据统计
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px'
                }}>
                  <div style={{
                    background: '#1a1a1a',
                    padding: '20px',
                    borderRadius: '12px',
                    textAlign: 'center'
                  }}>
                    <Users size={32} color="#fe2c55" style={{ marginBottom: '8px' }} />
                    <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>
                      {stats.user_count}
                    </div>
                    <div style={{ color: '#999', fontSize: '12px' }}>用户总数</div>
                  </div>
                  <div style={{
                    background: '#1a1a1a',
                    padding: '20px',
                    borderRadius: '12px',
                    textAlign: 'center'
                  }}>
                    <Video size={32} color="#25f4ee" style={{ marginBottom: '8px' }} />
                    <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>
                      {stats.video_count}
                    </div>
                    <div style={{ color: '#999', fontSize: '12px' }}>视频总数</div>
                  </div>
                  <div style={{
                    background: '#1a1a1a',
                    padding: '20px',
                    borderRadius: '12px',
                    textAlign: 'center'
                  }}>
                    <MessageCircle size={32} color="#ffd700" style={{ marginBottom: '8px' }} />
                    <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>
                      {stats.comment_count}
                    </div>
                    <div style={{ color: '#999', fontSize: '12px' }}>评论总数</div>
                  </div>
                  <div style={{
                    background: '#1a1a1a',
                    padding: '20px',
                    borderRadius: '12px',
                    textAlign: 'center'
                  }}>
                    <Heart size={32} color="#ff6b6b" style={{ marginBottom: '8px' }} />
                    <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>
                      {stats.like_count}
                    </div>
                    <div style={{ color: '#999', fontSize: '12px' }}>点赞总数</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <h2 style={{ color: '#fff', fontSize: '18px', marginBottom: '20px' }}>
                  用户列表
                </h2>
                {users.length === 0 ? (
                  <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
                    暂无用户
                  </p>
                ) : (
                  <div style={{ gap: '12px', display: 'flex', flexDirection: 'column' }}>
                    {users.map((user) => (
                    <div key={user.id} style={{
                      background: '#1a1a1a',
                      padding: '16px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <img
                        src={user.avatar || `https://picsum.photos/50/50?random=${user.id}`}
                        alt="avatar"
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
                          @{user.nickname || '用户'}
                        </div>
                        <div style={{ color: '#999', fontSize: '12px' }}>
                          {user.phone}
                        </div>
                        <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                          {user.city || '未填写'}
                        </div>
                      </div>
                      <div style={{ color: '#666', fontSize: '12px' }}>
                          {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'videos' && (
              <div>
                <h2 style={{ color: '#fff', fontSize: '18px', marginBottom: '20px' }}>
                  视频列表
                </h2>
                {videos.length === 0 ? (
                  <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
                    暂无视频
                  </p>
                ) : (
                  <div style={{ gap: '12px', display: 'flex', flexDirection: 'column' }}>
                    {videos.map((video) => (
                    <div key={video.id} style={{
                      background: '#1a1a1a',
                      padding: '16px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        <video
                          src={video.video_url}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                          {video.title || '无标题'}
                        </div>
                        <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>
                          作者: {video.nickname || '用户'}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', color: '#666', fontSize: '12px' }}>
                          <span>❤️ {video.like_count || 0}</span>
                          <span>💬 {video.comment_count || 0}</span>
                          <span>👁️ {video.view_count || 0}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteVideo(video.id)}
                        style={{
                          padding: '8px 12px',
                          background: '#333',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#fe2c55',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px'
                        }}
                      >
                        <Trash2 size={14} />
                        删除
                      </button>
                    </div>
                  ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
