import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';

const SurveyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [lastAnswerTime, setLastAnswerTime] = useState(Date.now());

  const fetchSurvey = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/surveys/${id}`);
      if (response.success) {
        setSurvey(response.data.survey);
        setQuestions(response.data.questions || []);
        if (response.data.userSurvey) {
          setCurrentQuestion(response.data.userSurvey.current_question || 0);
          setAnswers(response.data.userSurvey.answers ? JSON.parse(response.data.userSurvey.answers) : {});
        }
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchSurvey();
  }, [fetchSurvey]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          showToast('答题超时');
          navigate('/surveys');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, showToast]);

  const handleAnswer = async (optionIndex) => {
    const now = Date.now();
    if (currentQuestion > 0 && now - lastAnswerTime < 10000) {
      showToast('请认真阅读题目后再作答');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post(`/surveys/${id}/answer`, {
        question_index: currentQuestion,
        answer: optionIndex
      });

      if (response.success) {
        setAnswers(prev => ({ ...prev, [currentQuestion]: optionIndex }));
        setLastAnswerTime(now);

        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(prev => prev + 1);
        } else {
          await handleComplete();
        }
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      const response = await api.post(`/surveys/${id}/complete`);
      if (response.success) {
        showToast(`🎉 完成！获得奖励 ${response.data.reward.toFixed(2)} 元`);
        navigate('/surveys');
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAbandon = async () => {
    if (window.confirm('确定要放弃该问卷吗？已回答的题目将不会保存。')) {
      try {
        await api.post(`/surveys/${id}/abandon`);
        showToast('已放弃问卷');
        navigate('/surveys');
      } catch (err) {
        showToast(err.message);
      }
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container">
        <Loading message="加载问卷..." />
      </div>
    );
  }

  if (!survey || questions.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ marginBottom: '16px' }}>问卷不存在</p>
        <button onClick={() => navigate('/surveys')} className="btn btn-primary">
          返回列表
        </button>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const options = question?.options ? JSON.parse(question.options) : [];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="container">
      <div style={{
        position: 'sticky',
        top: 0,
        background: '#fff',
        padding: '16px 0',
        borderBottom: '1px solid #f0f0f0',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
            {survey.title}
          </h2>
          <span style={{
            color: timeLeft < 300 ? '#ff4d4f' : '#1890ff',
            fontWeight: '500',
            fontSize: '16px'
          }}>
            ⏱️ {formatTime(timeLeft)}
          </span>
        </div>
        
        <div style={{
          height: '6px',
          background: '#f0f0f0',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            width: `${progress}%`,
            transition: 'width 0.3s'
          }} />
        </div>
        <p style={{ textAlign: 'right', fontSize: '13px', color: '#999', marginTop: '8px', marginBottom: 0 }}>
          {currentQuestion + 1} / {questions.length}
        </p>
      </div>

      <div style={{ padding: '20px 0' }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '20px', lineHeight: '1.6' }}>
            {currentQuestion + 1}. {question?.question_text}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {options.map((option, index) => (
              <div
                key={index}
                onClick={() => !submitting && handleAnswer(index)}
                style={{
                  padding: '16px 20px',
                  border: `2px solid ${answers[currentQuestion] === index ? '#667eea' : '#e0e0e0'}`,
                  borderRadius: '12px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  background: answers[currentQuestion] === index ? '#f8f9ff' : '#fff',
                  transition: 'all 0.3s',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                <span style={{
                  display: 'inline-block',
                  width: '28px',
                  height: '28px',
                  lineHeight: '28px',
                  textAlign: 'center',
                  background: answers[currentQuestion] === index ? '#667eea' : '#f0f0f0',
                  color: answers[currentQuestion] === index ? '#fff' : '#666',
                  borderRadius: '50%',
                  marginRight: '12px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{option}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleAbandon}
          style={{
            width: '100%',
            padding: '12px',
            background: 'none',
            border: '1px solid #ff4d4f',
            color: '#ff4d4f',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          放弃问卷
        </button>
      </div>
    </div>
  );
};

export default SurveyDetail;
