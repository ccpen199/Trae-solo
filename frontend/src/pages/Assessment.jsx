import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { planAPI, assessmentAPI } from '../api';

const Assessment = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [plan, setPlan] = useState(null);
  const [record, setRecord] = useState(null);
  const [consented, setConsented] = useState(false);
  const [answers, setAnswers] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const questionsPerPage = 5;

  useEffect(() => {
    loadData();
  }, [planId]);

  const loadData = async () => {
    try {
      const [planRes, consentRes] = await Promise.all([
        planAPI.getPlan(planId),
        planAPI.getConsentStatus(planId)
      ]);
      setPlan(planRes.data);
      setConsented(consentRes.data.consented);

      if (consentRes.data.consented) {
        const recordRes = await assessmentAPI.getMyRecord(planId);
        setRecord(recordRes.data);
        setAnswers(recordRes.data.answers || {});
      }
    } catch (error) {
      console.error('Load assessment error:', error);
    }
  };

  const handleConsent = async (agree) => {
    try {
      await planAPI.consent(planId, { consented: agree });
      if (agree) {
        setConsented(true);
        const recordRes = await assessmentAPI.getMyRecord(planId);
        setRecord(recordRes.data);
      } else {
        navigate('/plans');
      }
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
    }
  };

  const handleAnswer = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleSave = async () => {
    if (!record) return;
    setSaving(true);
    try {
      await assessmentAPI.saveProgress(record.id, { answers });
      alert('进度已保存');
    } catch (error) {
      alert(error.response?.data?.error || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!record) return;
    if (!confirm('确定要提交测评吗？提交后将无法修改。')) return;

    setSubmitting(true);
    try {
      const res = await assessmentAPI.submitAssessment(record.id, { answers });
      alert(`提交成功！您的风险等级：${getRiskLabel(res.data.result.riskLevel)}`);
      navigate('/results');
    } catch (error) {
      alert(error.response?.data?.error || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const getRiskLabel = (level) => {
    const labels = {
      severe: '严重风险',
      moderate: '中度风险',
      mild: '轻度风险',
      normal: '正常'
    };
    return labels[level] || level;
  };

  if (!plan) {
    return <div className="loading">加载中...</div>;
  }

  if (!hasRole('student')) {
    return <div className="card"><p>只有学生可以参与测评</p></div>;
  }

  if (!consented) {
    return (
      <div>
        <div className="page-header">
          <h1>{plan.name}</h1>
        </div>
        <div className="card">
          <div className="consent-box">
            <h3>知情同意书</h3>
            <p>{plan.consent_text}</p>
            <div className="alert alert-warning">
              <strong>请注意：</strong>
              <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                <li>您的回答将被严格保密</li>
                <li>测评结果仅供心理健康评估使用</li>
                <li>您可以随时暂停和继续测评</li>
                <li>如果感到不适，请随时联系心理老师</li>
              </ul>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn"
              onClick={() => handleConsent(true)}
            >
              我已阅读并同意，开始测评
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handleConsent(false)}
            >
              不同意，返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (record?.status === 'submitted' || record?.status === 'abnormal') {
    return (
      <div>
        <div className="page-header">
          <h1>{plan.name}</h1>
        </div>
        <div className="card">
          <div className="alert alert-success">
            <h3>测评已完成</h3>
            <p>您已完成本次测评，感谢您的参与！</p>
            {record.abnormal_reason && (
              <p style={{ marginTop: '10px', color: '#dc2626' }}>
                备注：{record.abnormal_reason}
              </p>
            )}
          </div>
          <button className="btn" onClick={() => navigate('/results')}>
            查看我的结果
          </button>
        </div>
      </div>
    );
  }

  const questions = record?.questions || plan?.questions || [];
  const scoring = record?.scoring_rules || plan?.scoring_rules || {};
  const optionLabels = scoring.optionLabels || ['完全不会', '几天', '一半以上天数', '几乎每天'];
  const optionValues = scoring.optionValues || [0, 1, 2, 3];
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const startIndex = currentPage * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const currentQuestions = questions.slice(startIndex, endIndex);
  const progress = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== null).length;
  const progressPercent = questions.length > 0 ? Math.round((progress / questions.length) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <h1>{plan.name}</h1>
      </div>

      {plan.description && (
        <div className="scale-description">
          <h4>📋 量表说明</h4>
          <p>{plan.description}</p>
        </div>
      )}

      <div className="card">
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: '#374151' }}>📊 答题进度</span>
            <span style={{ color: '#667eea', fontWeight: 600 }}>{progress} / {questions.length} ({progressPercent}%)</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        {currentQuestions.map((q, index) => (
          <div key={q.id} className="question-card">
            <div>
              <span className="question-number">第 {startIndex + index + 1} 题</span>
              {q.dimension && (
                <span className="question-dimension" style={{ marginLeft: '10px' }}>
                  {record?.dimensions?.[q.dimension] || plan?.dimensions?.[q.dimension] || q.dimension}
                </span>
              )}
            </div>
            <div className="question-text">
              {q.text}
            </div>
            <div className="options">
              {optionLabels.map((option, optIndex) => (
                <button
                  key={optIndex}
                  className={`option-btn ${answers[q.id] === optionValues[optIndex] ? 'selected' : ''}`}
                  onClick={() => handleAnswer(q.id, optionValues[optIndex])}
                >
                  <div className="option-value">{optionValues[optIndex]}</div>
                  <div className="option-label">{option}</div>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
          >
            上一页
          </button>
          <span>第 {currentPage + 1} / {totalPages} 页</span>
          {currentPage < totalPages - 1 ? (
            <button
              className="btn btn-sm"
              onClick={() => setCurrentPage(p => p + 1)}
            >
              下一页
            </button>
          ) : (
            <button
              className="btn btn-success btn-sm"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? '提交中...' : '提交测评'}
            </button>
          )}
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存进度'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Assessment;
