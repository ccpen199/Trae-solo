import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import BottomNav from '../components/BottomNav';

const Home = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/questions');
      if (res.data.success) {
        setQuestions(res.data.data.list || []);
        setError(null);
      }
    } catch (err) {
      console.error('加载失败，使用演示数据', err);
      setQuestions([
        { id: 1, title: '如何学习人工智能？', topics: ['人工智能'], answer_count: 3, view_count: 128 },
        { id: 2, title: '前端开发应该先学什么框架？', topics: ['编程'], answer_count: 5, view_count: 256 },
        { id: 3, title: '怎样提升产品设计能力？', topics: ['产品设计'], answer_count: 2, view_count: 89 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (type) => {
    setShowCreateModal(false);
    if (type === 'question') {
      navigate('/create/question');
    }
  };

  if (loading) {
    return (
      <div>
        <div className="header">
          <div className="logo">知识社区</div>
        </div>
        <div className="loading">加载中...</div>
        <BottomNav />
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div>
        <div className="header">
          <div className="logo">知识社区</div>
        </div>
        <div className="error">
          {error}
          <button onClick={fetchQuestions} style={{ marginTop: '12px', padding: '8px 16px', border: 'none', borderRadius: '4px', background: 'var(--primary-color)', color: 'white' }}>
            重试
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div>
      <header className="header">
        <div className="logo">知识社区</div>
        <nav className="nav-tabs">
          <span className="nav-tab active">推荐</span>
          <span className="nav-tab">关注</span>
          <span className="nav-tab">热榜</span>
        </nav>
        <button className="create-btn" onClick={() => setShowCreateModal(true)}>
          + 创作
        </button>
      </header>

      <main className="content" style={{ paddingBottom: '80px' }}>
        {questions.length === 0 ? (
          <div className="empty">暂无内容</div>
        ) : (
          questions.map((q) => (
            <div key={q.id} className="question-item">
              <Link to={`/question/${q.id}`} className="question-title">
                {q.title}
              </Link>
              <div className="question-meta">
                <span className="topic-tag">{q.topics?.[0] || '话题'}</span>
                <span>{q.answer_count || 0} 个回答</span>
                <span>{q.view_count || 0} 次浏览</span>
              </div>
            </div>
          ))
        )}
      </main>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>选择创作类型</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="guest-options" style={{ gridTemplateColumns: '1fr' }}>
              <div className="guest-option" onClick={() => handleCreate('question')}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>提问题</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>有疑惑？提出你的问题</div>
              </div>
              <div className="guest-option" onClick={() => handleCreate('article')}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>写文章</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>分享你的知识和见解</div>
              </div>
              <div className="guest-option" onClick={() => handleCreate('video')}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>发视频</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>创作视频内容</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Home;
