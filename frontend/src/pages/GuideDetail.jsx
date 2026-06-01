import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { guideAPI, userAPI } from '../api';
import { useAuth } from '../context/AuthContext';

function GuideDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [guide, setGuide] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadGuide();
    loadComments();
  }, [id]);

  const loadGuide = async () => {
    try {
      const res = await guideAPI.getGuide(id);
      setGuide(res.data);
    } catch (err) {
      console.error('加载攻略失败', err);
    }
  };

  const loadComments = async () => {
    try {
      const res = await guideAPI.getComments(id);
      setComments(res.data || []);
    } catch (err) {
      console.error('加载评论失败', err);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await userAPI.toggleFavorite({ target_type: 'guide', target_id: id });
      loadGuide();
    } catch (err) {
      console.error('操作失败', err);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await guideAPI.likeGuide(id);
      loadGuide();
    } catch (err) {
      console.error('点赞失败', err);
    }
  };

  const handleComment = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!newComment.trim()) return;
    try {
      await guideAPI.addComment(id, { content: newComment });
      setNewComment('');
      loadComments();
    } catch (err) {
      console.error('评论失败', err);
    }
  };

  if (!guide) {
    return <div className="container" style={{ padding: '40px 0' }}>加载中...</div>;
  }

  return (
    <div className="detail-page">
      <div className="container">
        <div className="detail-container">
          <div className="detail-header">
            <h1 className="detail-title">{guide.title}</h1>
            <div className="detail-author">
              <img src={`https://picsum.photos/100/100?random=${guide.user_id}`} alt="" />
              <div>
                <div style={{ fontWeight: 600 }}>{guide.nickname || '旅行者'}</div>
                <div style={{ color: '#666', fontSize: '14px' }}>
                  {guide.destination} · {guide.days || 3}天 · {guide.budget || 2000}元
                </div>
              </div>
            </div>
            <div className="detail-actions">
              <button className={`action-btn ${guide.is_favorited ? 'active' : ''}`} onClick={handleFavorite}>
                ❤️ 收藏
              </button>
              <button className="action-btn" onClick={handleLike}>
                👍 点赞 ({guide.likes || 0})
              </button>
              <button className="action-btn">
                💬 评论 ({comments.length})
              </button>
              <button className="action-btn">
                🔗 分享
              </button>
            </div>
          </div>

          <div className="detail-content" dangerouslySetInnerHTML={{ __html: guide.content.replace(/\n/g, '<br/>') }} />

          <div className="comments-section">
            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>评论</h3>
            <div className="comment-form">
              <textarea
                placeholder={user ? '写下你的评论...' : '请先登录后评论'}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={!user}
              />
              <button className="btn btn-primary" onClick={handleComment} disabled={!user}>
                发表评论
              </button>
            </div>
            <div className="comment-list">
              {comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <img src={`https://picsum.photos/100/100?random=${comment.user_id + 50}`} alt="" />
                  <div className="comment-content">
                    <div className="comment-author">{comment.nickname || '旅行者'}</div>
                    <div className="comment-text">{comment.content}</div>
                    <div className="comment-time">{comment.created_at}</div>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  暂无评论，来抢沙发吧~
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuideDetail;
