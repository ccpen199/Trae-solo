import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useStore from '../store.js';
import { referralAPI } from '../api.js';

export default function ReferralDetail() {
  const { id } = useParams();
  const { user } = useStore();
  const [referral, setReferral] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReferral();
  }, [id]);

  const fetchReferral = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await referralAPI.detail(id);
      setReferral(res.data.referral);
    } catch (e) {
      setError(e.response?.data?.error || '获取内推详情失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    const map = {
      pending: '待处理',
      reviewing: '审核中',
      interviewing: '面试中',
      offer: '已发Offer',
      hired: '已入职',
      rejected: '已拒绝',
      cancelled: '已取消'
    };
    return map[status] || status;
  };

  const getAvailableStatuses = () => {
    if (!referral || !user) return [];

    const isReferrer = referral.referrer_id === user.id;
    const isHrOrOwner = (user.role === 'hr' || user.role === 'owner') &&
      user.current_company_id === referral.company_id;
    const isCandidate = referral.candidate_id === user.id;

    if (isCandidate) {
      if (referral.status === 'offer') {
        return [
          { value: 'hired', label: '接受Offer' },
          { value: 'rejected', label: '拒绝Offer' }
        ];
      }
      if (referral.status === 'pending') {
        return [{ value: 'cancelled', label: '取消申请' }];
      }
      return [];
    }

    if (isReferrer || isHrOrOwner) {
      const statusFlow = {
        pending: ['reviewing', 'rejected', 'cancelled'],
        reviewing: ['interviewing', 'rejected'],
        interviewing: ['offer', 'rejected'],
        offer: ['hired', 'rejected'],
        hired: [],
        rejected: [],
        cancelled: []
      };
      return statusFlow[referral.status]?.map(s => ({
        value: s,
        label: getStatusText(s)
      })) || [];
    }

    return [];
  };

  const canUpdateStatus = getAvailableStatuses().length > 0;

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      alert('请选择新状态');
      return;
    }
    setSubmitting(true);
    try {
      await referralAPI.updateStatus(id, {
        status: newStatus,
        note: statusNote
      });
      setSuccess('状态更新成功！');
      setShowStatusModal(false);
      setNewStatus('');
      setStatusNote('');
      fetchReferral();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.error || '更新状态失败');
    } finally {
      setSubmitting(false);
    }
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

  if (error && !referral) {
    return (
      <div className="container page-content">
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">❌</div>
            <div className="empty-state-text">{error}</div>
            <Link to="/referrals" className="btn btn-primary" style={{ marginTop: 16 }}>
              返回列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!referral) {
    return (
      <div className="container page-content">
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">❓</div>
            <div className="empty-state-text">内推记录不存在</div>
            <Link to="/referrals" className="btn btn-primary" style={{ marginTop: 16 }}>
              返回列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="page-title">📋 内推详情</h1>
            <div style={{ color: '#666', marginTop: 8 }}>
              职位: <Link to={`/jobs/${referral.job_id}`} style={{ color: '#667eea' }}>
                {referral.job_title}
              </Link>
            </div>
          </div>
          {canUpdateStatus && (
            <button className="btn btn-primary" onClick={() => setShowStatusModal(true)}>
              🔄 更新状态
            </button>
          )}
        </div>

        <div className="form-row" style={{ marginBottom: 24 }}>
          <div className="card" style={{ flex: 1, marginBottom: 0 }}>
            <div style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>公司</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>
              <Link to={`/companies/${referral.company_id}`} style={{ color: '#333' }}>
                {referral.company_name}
              </Link>
            </div>
          </div>
          <div className="card" style={{ flex: 1, marginBottom: 0 }}>
            <div style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>候选人</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{referral.candidate_name}</div>
            {referral.candidate_phone && (
              <div style={{ color: '#999', fontSize: 13, marginTop: 4 }}>
                {referral.candidate_phone}
              </div>
            )}
          </div>
          <div className="card" style={{ flex: 1, marginBottom: 0 }}>
            <div style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>推荐人</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{referral.referrer_name}</div>
          </div>
        </div>

        <div className="card" style={{ background: '#fafafa', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#666', fontSize: 14, marginBottom: 4 }}>当前状态</div>
              <span className={`status-badge status-${referral.status}`} style={{ fontSize: 16, padding: '6px 16px' }}>
                {getStatusText(referral.status)}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#666', fontSize: 14, marginBottom: 4 }}>创建时间</div>
              <div style={{ color: '#333' }}>
                {new Date(referral.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {referral.message && (
          <div className="card" style={{ background: '#f0f7ff', marginBottom: 24 }}>
            <div style={{ color: '#1890ff', fontSize: 14, marginBottom: 8 }}>💬 推荐留言</div>
            <div style={{ color: '#333', lineHeight: 1.8 }}>{referral.message}</div>
          </div>
        )}

        <div>
          <h3 style={{ marginBottom: 16, color: '#333' }}>📊 状态时间线</h3>
          <div className="timeline">
            {referral.status_history?.map((item, index) => (
              <div key={index} className="timeline-item">
                <div className={`timeline-dot ${
                  item.status === 'hired' || item.status === 'offer' ? 'success' :
                  item.status === 'rejected' || item.status === 'cancelled' ? 'rejected' :
                  item.status === 'pending' ? 'pending' : ''
                }`}></div>
                <div className="timeline-content">
                  <div className="timeline-status">
                    {getStatusText(item.status)}
                    <span className={`status-badge status-${item.status}`} style={{ marginLeft: 8 }}>
                      {getStatusText(item.status)}
                    </span>
                  </div>
                  <div className="timeline-time">
                    {new Date(item.created_at).toLocaleString()}
                    {item.operator_name && ` · ${item.operator_name}`}
                  </div>
                  {item.note && (
                    <div className="timeline-note">{item.note}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🔄 更新内推状态</h3>
              <button className="modal-close" onClick={() => setShowStatusModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">当前状态</label>
                <div>
                  <span className={`status-badge status-${referral.status}`} style={{ fontSize: 14 }}>
                    {getStatusText(referral.status)}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">新状态</label>
                <select
                  className="form-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="">请选择新状态</option>
                  {getAvailableStatuses().map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">备注说明（可选）</label>
                <textarea
                  className="form-textarea"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="填写状态变更的原因或说明..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpdateStatus}
                disabled={submitting || !newStatus}
              >
                {submitting ? '提交中...' : '确认更新'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
