import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { onboardingAPI } from '../api.js';

export default function OnboardingDetail() {
  const { id } = useParams();
  const [onboarding, setOnboarding] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [contractTemplate, setContractTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [activeTab, setActiveTab] = useState('contract');
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState('');
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [trainingScore, setTrainingScore] = useState(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    fetchData();
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    if (onboarding?.expires_at) {
      startCountdown();
    }
  }, [onboarding]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [detailRes, questionsRes, contractRes] = await Promise.all([
        onboardingAPI.detail(id),
        onboardingAPI.getQuestions(id),
        onboardingAPI.getContractTemplate(id)
      ]);
      setOnboarding(detailRes.data.onboarding);
      setQuestions(questionsRes.data.questions || []);
      setContractTemplate(contractRes.data.template || '');
      if (detailRes.data.onboarding.status === 'contract_pending') {
        setActiveTab('contract');
      } else if (detailRes.data.onboarding.status === 'training_pending') {
        setActiveTab('training');
      }
    } catch (e) {
      setError(e.response?.data?.error || '获取入职详情失败');
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    const updateCountdown = () => {
      const expireTime = new Date(onboarding.expires_at).getTime();
      const now = Date.now();
      const diff = expireTime - now;

      if (diff <= 0) {
        setCountdown({ hours: 0, minutes: 0, seconds: 0, expired: true });
        clearInterval(countdownRef.current);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ hours, minutes, seconds, expired: false });
    };

    updateCountdown();
    countdownRef.current = setInterval(updateCountdown, 1000);
  };

  const getStatusText = (status) => {
    const map = {
      pending: '待开始',
      contract_pending: '待签合同',
      contract_signed: '合同已签',
      training_pending: '待培训',
      training_completed: '培训完成',
      completed: '已完成',
      expired: '已过期',
      failed: '已失败'
    };
    return map[status] || status;
  };

  const handleSignContract = async () => {
    if (!agreed) {
      alert('请先阅读并同意合同条款');
      return;
    }
    if (!signature.trim()) {
      alert('请输入您的签名');
      return;
    }
    setSubmitting(true);
    try {
      await onboardingAPI.signContract(id, {
        signature: signature.trim(),
        agreed: true
      });
      setSuccess('合同签署成功！请继续完成岗前培训。');
      setShowContract(false);
      setActiveTab('training');
      fetchData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (e) {
      setError(e.response?.data?.error || '签署合同失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitTraining = async () => {
    const unanswered = questions.filter(q => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      alert(`请完成所有题目，还有 ${unanswered.length} 题未作答`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await onboardingAPI.submitTraining(id, { answers });
      setTrainingScore(res.data.score);
      if (res.data.passed) {
        setSuccess('恭喜！您已通过岗前培训，入职流程已完成！');
      } else {
        setError(`很遗憾，您的考试得分 ${res.data.score} 分，未通过（需60分以上）。请重新作答。`);
      }
      fetchData();
      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
    } catch (e) {
      setError(e.response?.data?.error || '提交培训考试失败');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCountdown = () => {
    if (!countdown) return '计算中...';
    if (countdown.expired) return '已过期';
    return `${String(countdown.hours).padStart(2, '0')}:${String(countdown.minutes).padStart(2, '0')}:${String(countdown.seconds).padStart(2, '0')}`;
  };

  const getStepStatus = () => {
    const steps = ['pending', 'contract_pending', 'contract_signed', 'training_pending', 'training_completed', 'completed'];
    const currentIndex = steps.indexOf(onboarding?.status);
    return {
      contract: currentIndex >= 2 ? 'completed' : currentIndex === 1 ? 'active' : '',
      training: currentIndex >= 4 ? 'completed' : currentIndex === 3 ? 'active' : '',
      done: currentIndex >= 5 ? 'completed' : ''
    };
  };

  if (loading) {
    return (
      <div className="container page-content">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!onboarding) {
    return (
      <div className="container page-content">
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">❓</div>
            <div className="empty-state-text">入职流程不存在</div>
            <Link to="/onboarding" className="btn btn-primary" style={{ marginTop: 16 }}>
              返回列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stepStatus = getStepStatus();
  const isExpired = countdown?.expired || onboarding.status === 'expired';

  return (
    <div className="container page-content">
      {success && (
        <div className="alert alert-success">
          <span>✅</span>
          {success}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span>❌</span>
          {error}
        </div>
      )}

      <div className="card">
        <div className="page-header" style={{ marginBottom: 24 }}>
          <div>
            <h1 className="page-title">📋 入职流程 - {onboarding.job_title}</h1>
            <div style={{ color: '#666', marginTop: 8 }}>
              {onboarding.company_name}
            </div>
          </div>
          <span className={`status-badge status-${
            onboarding.status === 'completed' ? 'hired' :
            onboarding.status === 'expired' || onboarding.status === 'failed' ? 'rejected' :
            onboarding.status === 'pending' ? 'pending' : 'reviewing'
          }`} style={{ fontSize: 14 }}>
            {getStatusText(onboarding.status)}
          </span>
        </div>

        {(onboarding.status === 'contract_pending' || onboarding.status === 'training_pending') && (
          <div className={`alert ${isExpired ? 'alert-error' : 'alert-warning'}`} style={{ marginBottom: 24 }}>
            <span>⏰</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>
                {isExpired ? '入职流程已过期' : '请在倒计时结束前完成入职流程'}
              </div>
              <div style={{
                fontSize: 32,
                fontWeight: 700,
                marginTop: 8,
                fontFamily: 'monospace',
                color: isExpired ? '#ff4d4f' : '#fa8c16'
              }}>
                {formatCountdown()}
              </div>
            </div>
          </div>
        )}

        <div className="onboarding-steps" style={{ marginBottom: 32 }}>
          <div className={`onboarding-step ${stepStatus.contract}`}>
            <div className="onboarding-step-num">{stepStatus.contract === 'completed' ? '✓' : '1'}</div>
            <div className="onboarding-step-label">签署合同</div>
          </div>
          <div className={`onboarding-step ${stepStatus.training}`}>
            <div className="onboarding-step-num">{stepStatus.training === 'completed' ? '✓' : '2'}</div>
            <div className="onboarding-step-label">岗前培训</div>
          </div>
          <div className={`onboarding-step ${stepStatus.done}`}>
            <div className="onboarding-step-num">{stepStatus.done === 'completed' ? '✓' : '3'}</div>
            <div className="onboarding-step-label">入职完成</div>
          </div>
        </div>

        {!isExpired && onboarding.status !== 'completed' && onboarding.status !== 'failed' && (
          <div className="tabs">
            <div
              className={`tab ${activeTab === 'contract' ? 'active' : ''}`}
              onClick={() => setActiveTab('contract')}
            >
              📄 合同签署
              {stepStatus.contract === 'completed' && <span style={{ marginLeft: 8, color: '#52c41a' }}>✓</span>}
            </div>
            <div
              className={`tab ${activeTab === 'training' ? 'active' : ''}`}
              onClick={() => {
                if (onboarding.status === 'contract_pending') {
                  alert('请先完成合同签署');
                  return;
                }
                setActiveTab('training');
              }}
            >
              📚 岗前培训
              {stepStatus.training === 'completed' && <span style={{ marginLeft: 8, color: '#52c41a' }}>✓</span>}
            </div>
          </div>
        )}

        {activeTab === 'contract' && (
          <div>
            {onboarding.status === 'contract_signed' || onboarding.status === 'training_pending' || onboarding.status === 'training_completed' || onboarding.status === 'completed' ? (
              <div className="card" style={{ background: '#f6ffed', textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#52c41a', marginBottom: 8 }}>
                  合同已签署
                </div>
                <div style={{ color: '#666' }}>
                  签署时间: {new Date(onboarding.contract_signed_at).toLocaleString()}
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ marginTop: 16 }}
                  onClick={() => setShowContract(true)}
                >
                  查看合同
                </button>
              </div>
            ) : onboarding.status === 'contract_pending' ? (
              <div>
                <div className="card" style={{ background: '#fafafa', maxHeight: 400, overflowY: 'auto', marginBottom: 24 }}>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#555' }}>
                    {contractTemplate || '合同模板加载中...'}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      style={{ marginRight: 8 }}
                    />
                    我已仔细阅读并同意以上合同条款
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-label">电子签名</label>
                  <input
                    type="text"
                    className="form-input"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="请输入您的姓名作为电子签名"
                  />
                </div>

                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleSignContract}
                  disabled={submitting || !agreed || !signature.trim()}
                  style={{ width: '100%' }}
                >
                  {submitting ? '签署中...' : '✍️ 确认签署合同'}
                </button>
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'training' && (
          <div>
            {onboarding.status === 'training_completed' || onboarding.status === 'completed' ? (
              <div className="card" style={{ background: '#f6ffed', textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#52c41a', marginBottom: 8 }}>
                  岗前培训已完成
                </div>
                <div style={{ color: '#666', marginBottom: 8 }}>
                  考试得分: <span style={{ fontWeight: 600, color: '#52c41a' }}>{onboarding.training_score} 分</span>
                </div>
                <div style={{ color: '#666' }}>
                  完成时间: {new Date(onboarding.training_completed_at).toLocaleString()}
                </div>
              </div>
            ) : onboarding.status === 'training_pending' ? (
              <div>
                {trainingScore !== null && (
                  <div className={`alert ${trainingScore >= 60 ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 24 }}>
                    <span>{trainingScore >= 60 ? '✅' : '❌'}</span>
                    您的得分: <span style={{ fontWeight: 700, fontSize: 20 }}>{trainingScore}</span> 分
                    {trainingScore >= 60 ? '，恭喜通过！' : '，未通过（需60分以上），请重新作答。'}
                  </div>
                )}

                {questions.map((q, index) => (
                  <div key={q.id} className="card" style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 12 }}>
                      <span style={{ display: 'inline-block', width: 24, height: 24, background: '#667eea', color: '#fff', borderRadius: '50%', textAlign: 'center', lineHeight: '24px', marginRight: 8, fontSize: 12 }}>
                        {index + 1}
                      </span>
                      {q.question}
                      <span style={{ color: '#999', fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
                        ({q.score}分)
                      </span>
                    </div>
                    {q.options.map((option, optIndex) => (
                      <label
                        key={optIndex}
                        style={{
                          display: 'block',
                          padding: '10px 12px',
                          marginBottom: 8,
                          border: '1px solid #e8e8e8',
                          borderRadius: 6,
                          cursor: 'pointer',
                          background: answers[q.id] === optIndex ? '#f0f2ff' : '#fff',
                          borderColor: answers[q.id] === optIndex ? '#667eea' : '#e8e8e8'
                        }}
                      >
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          checked={answers[q.id] === optIndex}
                          onChange={() => setAnswers({ ...answers, [q.id]: optIndex })}
                          style={{ marginRight: 8 }}
                        />
                        {String.fromCharCode(65 + optIndex)}. {option}
                      </label>
                    ))}
                  </div>
                ))}

                <div className="card" style={{ background: '#fafafa', marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 500 }}>已完成: </span>
                      <span style={{ color: '#667eea', fontWeight: 600 }}>
                        {Object.keys(answers).length}
                      </span>
                      <span style={{ color: '#999' }}> / {questions.length} 题</span>
                    </div>
                    <div className="progress-bar" style={{ width: 200, margin: 0 }}>
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleSubmitTraining}
                  disabled={submitting || Object.keys(answers).length !== questions.length}
                  style={{ width: '100%' }}
                >
                  {submitting ? '提交中...' : '📝 提交考试答案'}
                </button>
              </div>
            ) : onboarding.status === 'contract_pending' ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                  请先完成合同签署
                </div>
                <div style={{ color: '#666' }}>
                  完成合同签署后，即可开始岗前培训
                </div>
              </div>
            ) : null}
          </div>
        )}

        {onboarding.status === 'completed' && (
          <div className="card" style={{ background: '#f6ffed', textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a', marginBottom: 8 }}>
              恭喜！您已完成全部入职流程
            </div>
            <div style={{ color: '#666', marginBottom: 24 }}>
              欢迎加入 {onboarding.company_name}！
            </div>
            <Link to="/" className="btn btn-primary btn-lg">
              返回首页
            </Link>
          </div>
        )}

        {isExpired && onboarding.status === 'expired' && (
          <div className="card" style={{ background: '#fff1f0', textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⏰</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ff4d4f', marginBottom: 8 }}>
              入职流程已过期
            </div>
            <div style={{ color: '#666', marginBottom: 24 }}>
              您未在规定的3小时内完成入职流程，请联系HR重新发起
            </div>
            <Link to="/onboarding" className="btn btn-primary btn-lg">
              返回列表
            </Link>
          </div>
        )}
      </div>

      {showContract && (
        <div className="modal-overlay" onClick={() => setShowContract(false)}>
          <div className="modal" style={{ maxWidth: 800 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📄 劳动合同</h3>
              <button className="modal-close" onClick={() => setShowContract(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#555' }}>
                {contractTemplate || '合同模板加载中...'}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowContract(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
