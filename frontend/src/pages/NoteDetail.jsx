import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api.js';

function NoteDetail() {
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [comments, setComments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    api.get(`notes/${id}`).then(res => {
      setNote(res.data);
      setLoading(false);
    });
    api.get(`notes/${id}/comments`).then(res => setComments(res.data));
  }, [id]);

  useEffect(() => {
    if (note?.poi_id) {
      api.get('reviews', { params: { poi_id: note.poi_id } }).then(res => setReviews(res.data));
    }
  }, [note?.poi_id]);

  const handleLike = () => {
    api.post(`notes/${id}/like`).then(() => {
      setNote(prev => ({ ...prev, like_count: prev.like_count + 1 }));
      setLiked(true);
    });
  };

  const handleComment = () => {
    if (!newComment.trim()) return;
    api.post(`notes/${id}/comments`, { content: newComment }).then(() => {
      setNewComment('');
      api.get(`notes/${id}/comments`).then(res => setComments(res.data));
    });
  };

  if (loading) return <div className="loading">加载中...</div>;
  if (!note) return <div className="empty-state">笔记不存在</div>;

  const images = note.images ? note.images.split(',').filter(Boolean) : [];

  return (
    <div className="note-detail">
      <div className="note-detail-header">
        <h1 className="note-detail-title">{note.title}</h1>
        <div className="note-detail-meta">
          <span>👤 {note.nickname || '匿名用户'}</span>
          <span>👁 {note.view_count} 浏览</span>
          <span>❤️ {note.like_count} 点赞</span>
          <span>💬 {note.comment_count} 评论</span>
          <span>🔥 热度 {note.hot_score?.toFixed(1) || 0}</span>
        </div>
      </div>

      {images.length > 0 && (
        <div className="note-detail-images">
          {images.map((img, idx) => (
            <img key={idx} src={img} alt="" className="note-detail-image" />
          ))}
        </div>
      )}

      <div className="note-detail-content" style={{ whiteSpace: 'pre-wrap' }}>
        {note.content}
      </div>

      {note.risk_tips && (
        <div style={{
          margin: '0 2rem 2rem',
          padding: '1.5rem',
          background: '#fef2f2',
          borderRadius: '8px',
          borderLeft: '4px solid #ef4444'
        }}>
          <strong style={{ color: '#dc2626' }}>⚠️ 避坑提示</strong>
          <p style={{ marginTop: '0.5rem', color: '#666', margin: 0 }}>{note.risk_tips}</p>
        </div>
      )}

      {note.poi_name && (
        <div className="note-detail-poi">
          <h3>📍 {note.poi_name}</h3>
          {note.address && <div>🏠 {note.address}</div>}
          {note.avg_price && <div>💰 人均：¥{note.avg_price}</div>}
        </div>
      )}

      <div className="note-actions">
        <button 
          className={`btn ${liked ? 'btn-primary' : 'btn-outline'}`}
          onClick={handleLike}
          disabled={liked}
        >
          {liked ? '❤️ 已点赞' : `❤️ 点赞 (${note.like_count})`}
        </button>
      </div>

      {reviews.length > 0 && (
        <div style={{ padding: '2rem', borderTop: '1px solid #eee' }}>
          <h3 style={{ marginBottom: '1rem' }}>💬 相关评价 ({reviews.length})</h3>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {reviews.slice(0, 3).map(review => (
            <div 
              key={review.id}
              style={{
                background: '#f9f9f9',
                padding: '1rem',
                borderRadius: '8px',
                flex: 1,
                minWidth: '250px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong>{review.nickname}</strong>
                <span style={{ color: '#ffa500' }}>
                  {'⭐'.repeat(review.rating)} {review.rating}
                  </span>
              </div>
              <p style={{ margin: '0.5rem 0', color: '#666', fontSize: '0.9rem' }}>{review.content}</p>
              <div style={{ fontSize: '0.8rem', color: '#999' }}>
                可信度: {Math.round((review.credibility_score || 0) * 100)}%
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      <div className="comments-section">
        <h3 style={{ marginBottom: '1rem' }}>评论 ({comments.length})</h3>
        <div className="form-group">
          <textarea
            className="form-textarea"
            placeholder="写下你的评论..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button className="btn btn-primary" style={{ marginTop: '0.5rem' }} onClick={handleComment}>
            发表评论
          </button>
        </div>
        {comments.map(comment => (
          <div key={comment.id} className="comment">
            <div className="comment-user">{comment.nickname || '匿名用户'}</div>
            <div className="comment-content">{comment.content}</div>
            <div className="comment-time">{new Date(comment.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NoteDetail;
