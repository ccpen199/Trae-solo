import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Star } from 'lucide-react';
import { translationAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/Loading';

const FavoritesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    try {
      const response = await translationAPI.getFavorites();
      if (response.data?.data) {
        setFavorites(response.data.data.favorites || []);
      }
    } catch (err) {
      console.error('Load favorites error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7' }}>
      <div style={{
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        padding: 16,
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 100
      }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
          <ChevronLeft size={24} color="#333" />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>我的收藏</h1>
      </div>

      <div style={{ padding: 16 }}>
        {!user ? (
          <div style={{
            textAlign: 'center',
            padding: 40,
            backgroundColor: 'white',
            borderRadius: 16
          }}>
            <p style={{ color: '#666', marginBottom: 16 }}>请先登录查看收藏</p>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#007AFF',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer'
              }}
            >
              去登录
            </button>
          </div>
        ) : loading ? (
          <Loading message="加载中..." />
        ) : favorites.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 60,
            backgroundColor: 'white',
            borderRadius: 16
          }}>
            <Star size={48} color="#ddd" style={{ marginBottom: 16 }} />
            <p style={{ color: '#999' }}>暂无收藏</p>
          </div>
        ) : (
          favorites.map((item, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12
              }}
            >
              <p style={{ fontSize: 15, color: '#333', marginBottom: 8 }}>
                {item.source_text}
              </p>
              <p style={{ fontSize: 15, color: '#007AFF', marginBottom: 8 }}>
                {item.target_text}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#666'
                }}>
                  {item.source_lang}
                </span>
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: '#007AFF15',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#007AFF'
                }}>
                  {item.target_lang}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
