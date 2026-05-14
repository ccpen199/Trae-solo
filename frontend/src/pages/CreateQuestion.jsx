import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../App';

const CreateQuestion = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [topics, setTopics] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [titleError, setTitleError] = useState('');

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
    fetchTopics();
  }, [isLoggedIn, navigate]);

  const fetchTopics = async () => {
    try {
      const res = await api.get('/topics');
      if (res.data.success) {
        setTopics(res.data.data.list || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const validateTitle = (value) => {
    if (!value.endsWith('？') && !value.endsWith('?')) {
      setTitleError('问题标题必须以问号结尾');
      return false;
    }
    if (value.length > 50) {
      setTitleError('标题不能超过50个字');
      return false;
    }
    setTitleError('');
    return true;
  };

  const toggleTopic = (topicId) => {
    if (selectedTopics.includes(topicId)) {
      setSelectedTopics(selectedTopics.filter(id => id !== topicId));
    } else if (selectedTopics.length < 5) {
      setSelectedTopics([...selectedTopics, topicId]);
    }
  };

  const handleSubmit = async () => {
    if (!validateTitle(title)) return;
    if (selectedTopics.length === 0) {
      alert('请至少选择一个话题');
      return;
    }
    if (content.length > 3000) {
      alert('问题补充不能超过3000个字');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/questions', {
        title,
        content,
        topic_ids: selectedTopics
      });
      if (res.data.success) {
        navigate(`/question/${res.data.data.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      <header className="header">
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>←</button>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 500 }}>提问题</div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{ color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
        >
          {submitting ? '提交中...' : '发布'}
        </button>
      </header>

      <main className="content">
        <div className="form-group">
          <label className="form-label">问题标题</label>
          <input
            type="text"
            className="form-input"
            placeholder="请输入问题（以问号结尾，最多50字）"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              validateTitle(e.target.value);
            }}
          />
          {titleError && <div style={{ color: 'var(--danger-color)', fontSize: 12, marginTop: 4 }}>{titleError}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">问题补充（可选）</label>
          <textarea
            className="form-textarea"
            placeholder="详细描述你的问题（最多3000字）"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ minHeight: 150 }}
          />
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>{content.length}/3000</div>
        </div>

        <div className="form-group">
          <label className="form-label">选择话题（至少1个，最多5个）</label>
          <div className="topics-select">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className={`topic-option ${selectedTopics.includes(topic.id) ? 'selected' : ''}`}
                onClick={() => toggleTopic(topic.id)}
              >
                {topic.name}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
            已选择 {selectedTopics.length}/5 个话题
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateQuestion;
