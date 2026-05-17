import { useState, useEffect } from 'react';
import { X, Heart } from 'lucide-react';
import { commentAPI } from '../utils/api';
import useUserStore from '../store/userStore';
import useToastStore from '../store/toastStore';
import Loading from './Loading';
import EmptyState from './EmptyState';

export default function CommentModal({ visible, onClose, videoId, commentCount }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { isLoggedIn } = useUserStore();
  const { show } = useToastStore();

  useEffect(() => {
    if (visible && videoId) {
      loadComments();
    }
  }, [visible, videoId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const res = await commentAPI.getByVideo(videoId);
      if (res.success) {
        setComments(res.data.list || []);
      }
    } catch (error) {
      console.error('Load comments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      show('请先登录');
      return;
    }
    if (!content.trim()) {
      show('请输入评论内容');
      return;
    }

    setSubmitting(true);
    try {
      const res = await commentAPI.create({
        video_id: videoId,
        content: content.trim()
      });
      if (res.success) {
        setComments([res.data, ...comments]);
        setContent('');
        show('评论成功');
      }
    } catch (error) {
      show(error.message || '评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="comment-modal" onClick={onClose}>
      <div className="comment-content" onClick={e => e.stopPropagation()}>
        <div className="comment-header">
          <span className="comment-count">{commentCount || 0} 条评论</span>
          <button className="comment-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="comment-list">
          {loading ? (
            <Loading />
          ) : comments.length === 0 ? (
            <EmptyState message="快来发表第一条评论吧" />
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="comment-item">
                <img 
                  className="comment-avatar" 
                  src={comment.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`} 
                  alt="" 
                />
                <div className="comment-body">
                  <div className="comment-author">{comment.user_name || '用户'}</div>
                  <div className="comment-text">{comment.content}</div>
                  <div className="comment-footer">
                    <span>2小时前</span>
                    <button>
                      <Heart size={16} /> {comment.likes_count || 0}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="comment-input-box">
          <input
            className="comment-input"
            placeholder="写下你的评论..."
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSubmit()}
          />
          <button 
            className="comment-send-btn" 
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
