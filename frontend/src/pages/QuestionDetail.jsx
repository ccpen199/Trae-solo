import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../App';

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [similarQuestions, setSimilarQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestion();
    fetchAnswers();
    fetchSimilar();
  }, [id]);

  const fetchQuestion = async () => {
    try {
      const res = await api.get(`/questions/${id}`);
      if (res.data.success) {
        setQuestion(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnswers = async () => {
    try {
      const res = await api.get(`/questions/${id}/answers`);
      if (res.data.success) {
        setAnswers(res.data.data.list || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilar = async () => {
    try {
      const res = await api.get(`/questions/${id}/similar`);
      if (res.data.success) {
        setSimilarQuestions(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVote = async (answerId, voteType) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    try {
      await api.post(`/questions/${id}/answers/${answerId}/vote`, { vote_type: voteType });
      fetchAnswers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async (answerId) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    try {
      await api.post(`/questions/${id}/answers/${answerId}/like`);
      fetchAnswers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (!answerText.trim()) return;

    try {
      setSubmitting(true);
      const res = await api.post(`/questions/${id}/answers`, { content: answerText });
      if (res.data.success) {
        setAnswerText('');
        fetchAnswers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!question) {
    return <div className="error">问题不存在</div>;
  }

  return (
    <div style={{ paddingBottom: '80px' }}>
      <header className="header">
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>←</button>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 500 }}>问题详情</div>
        <div style={{ width: 40 }}></div>
      </header>

      <main className="content">
        <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px' }}>{question.title}</h1>

        <div className="user-info">
          <div className="avatar">{question.nickname?.[0] || 'U'}</div>
          <div>
            <div className="user-name">{question.nickname || '匿名用户'}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {question.created_at?.split('T')[0]}
            </div>
          </div>
          <button className="follow-btn">关注</button>
        </div>

        {question.content && (
          <p style={{ lineHeight: 1.6, marginBottom: '16px', color: 'var(--text-primary)' }}>
            {question.content}
          </p>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {question.topics?.map((topic, idx) => (
            <span key={idx} className="topic-tag">{topic}</span>
          ))}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 500 }}>{answers.length} 个回答</h3>
            <button style={{ color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer' }}>
              写回答
            </button>
          </div>

          <div className="form-group">
            <textarea
              className="form-textarea"
              placeholder="写下你的回答..."
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
            />
            <button
              className="form-submit"
              onClick={handleSubmitAnswer}
              disabled={submitting || !answerText.trim()}
              style={{ marginTop: '12px' }}
            >
              {submitting ? '提交中...' : '提交回答'}
            </button>
          </div>
        </div>

        {answers.length === 0 ? (
          <div className="empty">暂无回答，快来抢沙发吧</div>
        ) : (
          answers.map((answer) => (
            <div key={answer.id} className="card" style={{ border: '1px solid var(--border-color)' }}>
              <div className="user-info">
                <div className="avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
                  {answer.nickname?.[0] || 'U'}
                </div>
                <div>
                  <div className="user-name" style={{ fontSize: 14 }}>{answer.nickname || '匿名用户'}</div>
                </div>
              </div>

              <p className="answer-content">{answer.content}</p>

              <div className="action-bar">
                <button
                  className="action-btn vote-up"
                  onClick={() => handleVote(answer.id, 1)}
                >
                  ▲ {answer.vote_up || 0}
                </button>
                <button
                  className="action-btn vote-down"
                  onClick={() => handleVote(answer.id, -1)}
                >
                  ▼ {answer.vote_down || 0}
                </button>
                <button className="action-btn like" onClick={() => handleLike(answer.id)}>
                  ♥ {answer.like_count || 0}
                </button>
                <button className="action-btn">💬 {answer.comment_count || 0}</button>
                <button className="action-btn">🔗 分享</button>
              </div>
            </div>
          ))
        )}

        {similarQuestions.length > 0 && (
          <div className="similar-questions" style={{ padding: '16px' }}>
            <h3 className="similar-title">相似问题</h3>
            {similarQuestions.map((q) => (
              <div
                key={q.id}
                className="similar-item"
                onClick={() => {
                  navigate(`/question/${q.id}`);
                  window.scrollTo(0, 0);
                }}
              >
                {q.title}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default QuestionDetail;
