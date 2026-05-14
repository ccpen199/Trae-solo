import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import Empty from '../components/Empty';

const Surveys = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchSurveys = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/surveys');
      if (response.success) {
        setSurveys(response.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const handleStartSurvey = async (survey) => {
    if (!user?.gender || !user?.province || !user?.age) {
      showToast('请先完善个人信息');
      navigate('/profile');
      return;
    }

    try {
      const response = await api.post(`/surveys/${survey.id}/start`);
      if (response.success) {
        navigate(`/survey/${survey.id}`);
      }
    } catch (err) {
      showToast(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <Loading message="加载问卷列表..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: '#ff4d4f', marginBottom: '16px' }}>{error}</p>
          <button
            onClick={fetchSurveys}
            className="btn btn-primary"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 style={{ fontSize: '24px', marginBottom: '20px', fontWeight: 'bold' }}>
        📋 问卷调查
      </h1>

      {surveys.length === 0 ? (
        <Empty message="暂无可用问卷" icon="📭" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {surveys.map((survey) => (
            <div
              key={survey.id}
              style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                  {survey.title}
                </h3>
                {survey.hasReward && (
                  <span style={{
                    background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                    color: '#d63031',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    💰 最高 {(survey.question_count * survey.reward_per_question).toFixed(2)} 元
                  </span>
                )}
              </div>

              {survey.description && (
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
                  {survey.description}
                </p>
              )}

              <div style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '16px',
                flexWrap: 'wrap'
              }}>
                <span style={{ fontSize: '13px', color: '#999' }}>
                  📝 {survey.question_count} 题
                </span>
                <span style={{ fontSize: '13px', color: '#999' }}>
                  ⏱️ 约 30 分钟
                </span>
                <span style={{ fontSize: '13px', color: '#999' }}>
                  👥 {survey.completed_surveys}/{survey.total_surveys} 人已完成
                </span>
              </div>

              <button
                onClick={() => handleStartSurvey(survey)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                参与问卷
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Surveys;
