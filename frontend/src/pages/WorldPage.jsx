import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, User } from 'lucide-react';
import { worldAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';

const WorldPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await worldAPI.getPosts();
      if (response.data?.data) {
        setPosts(response.data.data.posts || []);
      }
    } catch (err) {
      console.error('Load posts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId, index) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const response = await worldAPI.toggleLike(postId);
      if (response.data?.success) {
        const newPosts = [...posts];
        newPosts[index] = {
          ...newPosts[index],
          is_liked: response.data.data.liked,
          likes_count: (newPosts[index].likes_count || 0) + (response.data.data.liked ? 1 : -1)
        };
        setPosts(newPosts);
        showSuccess(response.data.data.liked ? '已点赞' : '已取消');
      }
    } catch (err) {
      showError('操作失败');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <Loading message="加载中..." />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7' }}>
      <div style={{
        padding: 16,
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>看世界</h1>
      </div>

      <div style={{ padding: 16 }}>
        {posts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 40,
            backgroundColor: 'white',
            borderRadius: 16
          }}>
            <p style={{ color: '#666' }}>暂无内容</p>
          </div>
        ) : (
          posts.map((post, index) => (
            <div
              key={post.id}
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: '#007AFF20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  {post.user_id ? (
                    <User size={20} color="#007AFF" />
                  ) : (
                    <span style={{ color: '#007AFF', fontWeight: 600, fontSize: 16 }}>
                      {(post.nickname || '官方')[0]}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>
                    {post.nickname || '翻译君'}
                  </p>
                  <p style={{ fontSize: 12, color: '#999' }}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 8 }}>
                {post.title}
              </h3>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 12 }}>
                {post.content}
              </p>

              {post.image_url && (
                <div style={{
                  width: '100%',
                  height: 200,
                  backgroundColor: '#f0f0f0',
                  borderRadius: 12,
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: '#999', fontSize: 14 }}>图片</span>
                </div>
              )}

              {post.language && (
                <span style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  backgroundColor: '#007AFF15',
                  color: '#007AFF',
                  borderRadius: 12,
                  fontSize: 12,
                  marginBottom: 12
                }}>
                  {post.language === 'en' ? '英语' : post.language === 'ja' ? '日语' : '韩语'}
                </span>
              )}

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                paddingTop: 12,
                borderTop: '1px solid #f0f0f0'
              }}>
                <button
                  onClick={() => handleLike(post.id, index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: post.is_liked ? '#FF3B30' : '#666'
                  }}
                >
                  <Heart size={18} fill={post.is_liked ? '#FF3B30' : 'none'} />
                  <span style={{ fontSize: 14 }}>{post.likes_count || 0}</span>
                </button>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#666'
                }}>
                  <MessageCircle size={18} />
                  <span style={{ fontSize: 14 }}>0</span>
                </button>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#666'
                }}>
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorldPage;
