import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import request from '../utils/request';
import useStore from '../store/useStore';

const VerifyQuestions = () => {
  const navigate = useNavigate();
  const { updateUser } = useStore(state => ({ updateUser: state.updateUser }));
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await request.get('/auth/questions');
      setQuestions(res.data || []);
    } catch (error) {
      setQuestions([
        { id: 1, question: '在B站可以随意发布广告吗？', options: ['可以', '不可以'] },
        { id: 2, question: '看到违规内容应该怎么做？', options: ['举报', '无视', '跟着学'] },
        { id: 3, question: '投币对UP主有什么影响？', options: ['没有影响', '帮助UP主获得收益和曝光'] },
        { id: 4, question: '弹幕礼仪不包括？', options: ['不刷屏', '不剧透', '可以随意辱骂'] },
        { id: 5, question: '成为正式会员后可以？', options: ['发布视频', '发布违规内容', '随意盗传'] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert('请回答所有问题');
      return;
    }

    setSubmitting(true);
    try {
      const answerList = Object.entries(answers).map(([questionId, answerIndex]) => ({
        questionId: parseInt(questionId),
        answer: answerIndex
      }));

      const res = await request.post('/auth/verify-questions', { answers: answerList });
      setResult(res.data);

      if (res.data?.passed) {
        updateUser({ level: 1, is_verified: true });
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (error) {
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
        <p>加载题目中...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 0', maxWidth: '800px' }}>
      <div className="card" style={{ padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
          <h1 style={{ fontSize: '24px', fontWeight: 600 }}>会员转正答题</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            完成以下题目，答对60%即可成为正式会员
          </p>
        </div>

        {result && (
          <div style={{
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: result.passed ? '#f6ffed' : '#fff2f0',
            border: `1px solid ${result.passed ? '#b7eb8f' : '#ffccc7'}`,
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>
              {result.passed ? '🎉' : '😢'}
            </div>
            <h3 style={{ color: result.passed ? '#52c41a' : '#ff4d4f' }}>
              {result.passed ? '恭喜！答题通过！' : '很遗憾，答题未通过'}
            </h3>
            <p style={{ marginTop: '8px' }}>
              答对 {result.correctCount} / {result.total} 题
            </p>
            {result.passed && (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
                即将跳转到首页...
              </p>
            )}
          </div>
        )}

        {!result && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {questions.map((q, index) => (
                <div key={q.id} style={{
                  padding: '20px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <p style={{ fontWeight: 500, marginBottom: '16px' }}>
                    {index + 1}. {q.question}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {q.options.map((option, optIndex) => (
                      <label
                        key={optIndex}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px 16px',
                          backgroundColor: answers[q.id] === optIndex ? 'var(--primary-color)' : 'white',
                          color: answers[q.id] === optIndex ? 'white' : 'var(--text-primary)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          checked={answers[q.id] === optIndex}
                          onChange={() => setAnswers(prev => ({ ...prev, [q.id]: optIndex }))}
                          style={{ display: 'none' }}
                        />
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: '2px solid currentColor',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px'
                        }}>
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn btn-primary"
                style={{ padding: '12px 48px', fontSize: '16px' }}
              >
                {submitting ? '提交中...' : '提交答案'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyQuestions;
