import React, { useState, useEffect } from 'react';
import { reviewApi } from '../api';

function ReviewAudit() {
  const [reviews, setReviews] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [auditForm, setAuditForm] = useState({ audit_notes: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await reviewApi.getAuditList();
      setReviews(res.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleApprove = async () => {
    try {
      await reviewApi.approve(selectedReview.id, {
        audit_notes: auditForm.audit_notes
      });
      setShowDetailModal(false);
      setSelectedReview(null);
      setAuditForm({ audit_notes: '' });
      loadData();
    } catch (err) {
      alert('审核通过失败');
    }
  };

  const handleReject = async () => {
    if (!auditForm.audit_notes) {
      alert('请填写驳回原因');
      return;
    }
    try {
      await reviewApi.reject(selectedReview.id, {
        audit_notes: auditForm.audit_notes
      });
      setShowDetailModal(false);
      setSelectedReview(null);
      setAuditForm({ audit_notes: '' });
      loadData();
    } catch (err) {
      alert('审核驳回失败');
    }
  };

  const getAuditStatusText = (status) => {
    const texts = {
      'pending_audit': '待审核',
      'approved': '已通过',
      'rejected': '已驳回'
    };
    return texts[status] || status;
  };

  const getAuditStatusBadge = (status) => {
    const badges = {
      'pending_audit': 'badge-pending',
      'approved': 'badge-success',
      'rejected': 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  return (
    <div>
      <h1 className="page-title">复核审核</h1>
      
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>审核列表</h3>
        <table className="table">
          <thead>
            <tr>
              <th>复核ID</th>
              <th>订单号</th>
              <th>客户</th>
              <th>复核员</th>
              <th>称重差异</th>
              <th>审核状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(review => (
              <tr key={review.id}>
                <td>{review.id}</td>
                <td>{review.order_no}</td>
                <td>{review.customer_name}</td>
                <td>{review.reviewer_name || '-'}</td>
                <td>{review.weight_difference || 0} kg</td>
                <td><span className={`badge ${getAuditStatusBadge(review.audit_status)}`}>{getAuditStatusText(review.audit_status)}</span></td>
                <td>
                  {review.audit_status === 'pending_audit' && (
                    <button className="btn btn-primary btn-sm" onClick={() => {
                      setSelectedReview(review);
                      setAuditForm({ audit_notes: '' });
                      setShowDetailModal(true);
                    }}>审核</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDetailModal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>复核审核</h3>
            <div className="detail-row">
              <span className="detail-label">订单号:</span>
              <span className="detail-value">{selectedReview?.order_no}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">客户:</span>
              <span className="detail-value">{selectedReview?.customer_name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">复核员:</span>
              <span className="detail-value">{selectedReview?.reviewer_name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">称重差异:</span>
              <span className="detail-value">{selectedReview?.weight_difference || 0} kg</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">复核备注:</span>
              <span className="detail-value">{selectedReview?.notes || '-'}</span>
            </div>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label>审核意见</label>
              <textarea value={auditForm.audit_notes} onChange={e => setAuditForm({...auditForm, audit_notes: e.target.value})} placeholder="请填写审核意见（驳回时必填）" />
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowDetailModal(false)}>取消</button>
              <button className="btn btn-danger" onClick={handleReject}>驳回</button>
              <button className="btn btn-success" onClick={handleApprove}>通过</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewAudit;
