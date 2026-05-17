import React, { useState, useEffect } from 'react';
import { videoAPI } from '../api';
import { useToastStore } from '../store';
import { useAuthStore } from '../store';

const CommentsPanel = ({ videoId, onClose }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const showToast = useToastStore((state) => state.showToast);
  const isLogin = useAuthStore((state) => state.isLogin);

  useEffect(() => {
    loadComments();
  }, [videoId]);

  const loadComments = async () => {
    try {
      const res = await videoAPI.getComments(videoId, { page: 1, limit: 20 });
      setComments(res.data.data?.comments || []);
    } catch (error) {
      console.error('Load comments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    
    if (!isLogin) {
      showToast('请先登录');
      return;
    }

    try {
      const res = await videoAPI.addComment(videoId, newComment);
      setComments([res.data.data, ...comments]);
      setNewComment('');
      showToast('评论成功');
    } catch (error) {
      showToast('评论失败，请重试');
    }
  };

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="comments-panel">
        <div className="comments-header">
          <span className="comments-title">{comments.length} 条评论</span>
          <span className="comments-close" onClick={onClose}>✕</span>
        </div>
        <div className="comments-list">
          {loading ? (
            <div className="loading">加载中...</div>
          ) : comments.length === 0 ? (
            <div className="empty-state">暂无评论，快来抢沙发吧</div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-avatar">
                  <img src={comment.avatar || 'https://picsum.photos/100/100'} alt="" />
                </div>
                <div className="comment-content">
                  <div className="comment-author">{comment.nickname || '用户'}</div>
                  <div className="comment-text">{comment.content}</div>
                  <div className="comment-time">{comment.created_at}</div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="comment-input-area">
          <input
            className="comment-input"
            placeholder="说点什么..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
          />
          <span className="comment-send" onClick={handleSendComment}>发送</span>
        </div>
      </div>
    </>
  );
};

export default CommentsPanel;
