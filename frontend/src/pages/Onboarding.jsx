import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { onboardingAPI } from '../api.js';

export default function Onboarding() {
  const [onboardings, setOnboardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOnboardings();
  }, []);

  const fetchOnboardings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await onboardingAPI.list();
      setOnboardings(res.data.onboardings || []);
    } catch (e) {
      setError(e.response?.data?.error || '获取入职流程列表失败');
    } finally {
      setLoading(false);
    }
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

  const getStepStatus = (onboarding) => {
    const steps = ['pending', 'contract_pending', 'contract_signed', 'training_pending', 'training_completed', 'completed'];
    const currentIndex = steps.indexOf(onboarding.status);
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

  return (
    <div className="container page-content">
      <div className="page-header">
        <h1 className="page-title">📋 入职流程</h1>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>❌</span>
          {error}
        </div>
      )}

      {onboardings.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">暂无入职流程</div>
          </div>
        </div>
      ) : (
        <div className="job-list">
          {onboardings.map(o => {
            const stepStatus = getStepStatus(o);
            return (
              <div key={o.id} className="card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                      {o.job_title}
                    </h3>
                    <div style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>
                      {o.company_name}
                    </div>
                    <span className={`status-badge status-${
                      o.status === 'completed' ? 'hired' :
                      o.status === 'expired' || o.status === 'failed' ? 'rejected' :
                      o.status === 'pending' ? 'pending' : 'reviewing'
                    }`}>
                      {getStatusText(o.status)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>创建时间</div>
                    <div style={{ fontSize: 13 }}>{new Date(o.created_at).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="onboarding-steps" style={{ marginBottom: 16 }}>
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

                {(o.status === 'contract_pending' || o.status === 'training_pending') && (
                  <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                    <span>⏰</span>
                    请在3小时内完成当前步骤，否则流程将自动过期
                  </div>
                )}

                <Link to={`/onboarding/${o.id}`} className="btn btn-primary" style={{ width: '100%' }}>
                  查看详情
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
