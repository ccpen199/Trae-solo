import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { discussionsAPI } from '../api.js';

export default function TopicDetail({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [comments, setComments] = useState([]);
  const [userVote, setUserVote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadTopic();
  }, [id]);

  const loadTopic = async () => {
    try {
      const response = await discussionsAPI.getTopic(id);
      setTopic(response.data.topic);
      setComments(response.data.comments || []);
      setUserVote(response.data.user_vote);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    try {
      await discussionsAPI.vote(id, { vote_type: 1 });
      loadTopic();
    } catch (error) {
      alert('投票失败');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      await discussionsAPI.addComment(id, { content: newComment });
      setNewComment('');
      loadTopic();
    } catch (error) {
      alert('评论失败');
    }
  };

  if (loading) {
    return <div className="text-center mt-8">加载中...</div>;
  }

  if (!topic) {
    return <div className="text-center mt-8">话题不存在</div>;
  }

  return (
    <div>
      <Header user={user} onLogout={onLogout} />
      <main className="main">
        <div className="container">
          <button className="btn btn-secondary mb-3" onClick={() => navigate('/discussions')}>
            ← 返回讨论区
          </button>

          <div className={`card ${topic.is_pinned ? 'pinned' : ''} ${topic.is_essence ? 'essence' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {topic.is_pinned && <span className="badge badge-warning">置顶</span>}
                  {topic.is_essence && <span className="badge badge-success">精华</span>}
                  <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{topic.title}</h1>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                  <span>👤 {topic.author_name}</span>
                  <span>👁 {topic.view_count} 浏览</span>
                  <span>{new Date(topic.created_at).toLocaleString()}</span>
                </div>
              </div>
              <button
                className={`btn ${userVote ? 'btn-primary' : 'btn-outline'}`}
                onClick={handleVote}
              >
                👍 {userVote ? '已点赞' : '点赞'}
              </button>
            </div>
            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--gray-700)' }}>
              {topic.content}
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">评论 ({comments.length})</h3>
            
            <form onSubmit={handleAddComment} style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <textarea
                  className="form-input form-textarea"
                  placeholder="写下你的评论..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">发表评论</button>
            </form>

            {comments.map((comment) => (
              <div key={comment.id} className={`comment ${comment.is_essence ? 'essence' : ''}`}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span className="comment-author">{comment.author_name}</span>
                  <span className="comment-time">{new Date(comment.created_at).toLocaleString()}</span>
                  {comment.is_essence && <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>精华</span>}
                </div>
                <p style={{ color: 'var(--gray-700)' }}>{comment.content}</p>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-muted text-center" style={{ padding: '2rem' }}>暂无评论</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
