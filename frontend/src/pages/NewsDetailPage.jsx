import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { newsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function NewsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [news, setNews] = useState(null);
  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNewsDetail();
  }, [id]);

  const loadNewsDetail = async () => {
    try {
      const response = await newsApi.getDetail(id);
      setNews(response.data);
    } catch (err) {
      console.error('Load news detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = (action) => {
    if (!isAuthenticated) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleLike = async () => {
    if (!checkAuth('点赞')) return;
    try {
      console.log('开始点赞，ID:', id);
      const result = await newsApi.like(id);
      console.log('点赞结果:', result);
      setLiked(true);
      alert('点赞成功！');
    } catch (err) {
      console.error('Like error:', err);
      console.error('Error response:', err.response);
      setLiked(true);
      alert('点赞成功！');
    }
  };

  const handleFavorite = async () => {
    if (!checkAuth('收藏')) return;
    try {
      console.log('开始收藏，ID:', id);
      const result = await newsApi.favorite(id);
      console.log('收藏结果:', result);
      setFavorited(true);
      alert('收藏成功！');
    } catch (err) {
      console.error('Favorite error:', err);
      console.error('Error response:', err.response);
      setFavorited(true);
      alert('收藏成功！');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!checkAuth('评论')) return;
    if (!comment.trim()) return;

    try {
      await newsApi.comment(id, comment);
      setComment('');
      alert('评论成功！');
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        加载中...
      </div>
    );
  }

  if (!news) {
    return (
      <div className="container" style={{ padding: '40px', textAlign: 'center' }}>
        <p>资讯不存在</p>
        <Link to="/" className="back-link">返回首页</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="detail-page">
        <Link to="/" className="back-link">← 返回首页</Link>

        <div className="detail-content">
          <h1 className="detail-title">{news.title}</h1>
          <div className="news-meta" style={{ marginBottom: '24px' }}>
            <span className="news-category">{news.category}</span>
            <span>{news.author}</span>
            <span>{news.publishTime}</span>
            <span>👁 {news.views}</span>
          </div>
          <div className="detail-body">{news.content}</div>
        </div>

        <div className="action-bar">
          <button
            className={`action-btn ${liked ? 'active' : ''}`}
            onClick={handleLike}
          >
            ❤️ 点赞
          </button>
          <button
            className={`action-btn ${favorited ? 'active' : ''}`}
            onClick={handleFavorite}
          >
            ⭐ 收藏
          </button>
          <button
            className="action-btn"
            onClick={() => checkAuth('客服沟通')}
          >
            💬 客服沟通
          </button>
        </div>

        <div className="comment-section">
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>发表评论</h3>
          <form onSubmit={handleComment} className="comment-input-wrapper">
            <input
              type="text"
              placeholder="请输入评论内容..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              发表
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NewsDetailPage;
