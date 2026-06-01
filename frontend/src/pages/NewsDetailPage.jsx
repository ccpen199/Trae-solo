import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { newsAPI, commentsAPI, userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function NewsDetailPage() {
  const { slug } = useParams();
  const [news, setNews] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const { currentUser, canComment } = useAuth();

  useEffect(() => {
    loadData();
  }, [slug]);

  const loadData = async () => {
    try {
      const newsRes = await newsAPI.getBySlug(slug);
      setNews(newsRes.data);
      
      const commentsRes = await commentsAPI.getByNews(newsRes.data.id);
      setComments(commentsRes.data);
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !canComment()) return;

    try {
      await commentsAPI.create({
        content: newComment,
        news_id: news.id,
      });
      setNewComment('');
      loadData();
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  const handleAddFavorite = async () => {
    try {
      await userAPI.addFavorite(news.id);
      alert('已添加到收藏夹');
    } catch (error) {
      console.error('Failed to add favorite:', error);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!news) {
    return <div className="empty-state">新闻不存在</div>;
  }

  return (
    <div>
      <article className="news-detail">
        <h1 className="news-detail-title">{news.title}</h1>
        <div className="news-detail-meta">
          <span>浏览次数: {news.views}</span>
          <span>发布时间: {format(new Date(news.created_at), 'yyyy-MM-dd HH:mm')}</span>
          {news.category && <span>分类: {news.category.name}</span>}
        </div>
        <div className="news-detail-content">{news.content}</div>
        
        {currentUser && (
          <div className="news-actions">
            <button className="btn btn-primary" onClick={handleAddFavorite}>
              收藏文章
            </button>
            <button className="btn btn-secondary">分享文章</button>
          </div>
        )}
      </article>

      <section className="comments-section">
        <h3>评论 ({comments.length})</h3>
        
        {currentUser && canComment() ? (
          <form className="comment-form" onSubmit={handleSubmitComment}>
            <textarea
              placeholder="发表你的评论..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">发表评论</button>
          </form>
        ) : currentUser ? (
          <p style={{ color: '#666', marginBottom: 20 }}>游客用户无法发表评论</p>
        ) : (
          <p style={{ color: '#666', marginBottom: 20 }}>请先登录后发表评论</p>
        )}

        {comments.length === 0 ? (
          <div className="empty-state">暂无评论</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-author">{comment.author?.username || '匿名用户'}</div>
              <div className="comment-content">{comment.content}</div>
              <div className="comment-time">
                {format(new Date(comment.created_at), 'yyyy-MM-dd HH:mm')}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default NewsDetailPage;
