import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      loadFavorites();
    }
  }, [currentUser]);

  const loadFavorites = async () => {
    try {
      const response = await userAPI.getFavorites();
      setFavorites(response.data);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (id) => {
    try {
      await userAPI.removeFavorite(id);
      setFavorites(favorites.filter(f => f.id !== id));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  if (!currentUser) {
    return <div className="loading">请先登录</div>;
  }

  return (
    <div>
      <h1 className="page-title">我的收藏</h1>
      
      {loading ? (
        <div className="loading">加载中...</div>
      ) : favorites.length === 0 ? (
        <div className="empty-state">暂无收藏文章</div>
      ) : (
        favorites.map((favorite) => (
          <article key={favorite.id} className="news-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <h2 className="news-card-title">
                  <Link to={`/news/${favorite.news?.slug}`}>{favorite.news?.title}</Link>
                </h2>
                <p className="news-card-summary">{favorite.news?.summary}</p>
                <div className="news-card-meta">
                  <span>收藏时间: {format(new Date(favorite.created_at), 'yyyy-MM-dd HH:mm')}</span>
                </div>
              </div>
              <button
                className="btn btn-danger"
                style={{ marginLeft: 20 }}
                onClick={() => handleRemoveFavorite(favorite.id)}
              >
                取消收藏
              </button>
            </div>
          </article>
        ))
      )}
    </div>
  );
}

export default FavoritesPage;
