import React, { useState, useEffect } from 'react';
import { reviewApi, orderApi } from '../api';

function ReviewExecute() {
  const [reviews, setReviews] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [pickedOrders, setPickedOrders] = useState([]);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [startForm, setStartForm] = useState({ order_id: '', reviewer_id: '' });
  const [completeForm, setCompleteForm] = useState({ notes: '', weight_difference: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reviewsRes, reviewersRes, ordersRes] = await Promise.all([
        reviewApi.getExecuteList(),
        reviewApi.getReviewers(),
        orderApi.getAll({ status: 'picked' })
      ]);
      setReviews(reviewsRes.data);
      setReviewers(reviewersRes.data);
      setPickedOrders(ordersRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleStart = async () => {
    if (!startForm.order_id || !startForm.reviewer_id) {
      alert('请选择订单和复核员');
      return;
    }
    try {
      await reviewApi.start(startForm);
      setShowStartModal(false);
      setStartForm({ order_id: '', reviewer_id: '' });
      loadData();
    } catch (err) {
      alert('开始复核失败');
    }
  };

  const handleComplete = async () => {
    try {
      await reviewApi.complete(selectedReview.id, completeForm);
      setShowCompleteModal(false);
      setSelectedReview(null);
      setCompleteForm({ notes: '', weight_difference: 0 });
      loadData();
    } catch (err) {
      alert('完成复核失败');
    }
  };

  const getStatusText = (status) => {
    const texts = {
      'in_progress': '复核中',
      'completed': '待审核'
    };
    return texts[status] || status;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'in_progress': 'badge-picking',
      'completed': 'badge-pending'
    };
    return badges[status] || 'badge-info';
  };

  return (
    <div>
      <h1 className="page-title">复核执行</h1>
      
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>复核任务列表</h3>
          <button className="btn btn-primary" onClick={() => setShowStartModal(true)}>开始复核</button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>复核ID</th>
              <th>订单号</th>
              <th>客户</th>
              <th>复核员</th>
              <th>状态</th>
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
                <td><span className={`badge ${getStatusBadge(review.status)}`}>{getStatusText(review.status)}</span></td>
                <td>
                  {review.status === 'in_progress' && (
                    <button className="btn btn-success btn-sm" onClick={() => {
                      setSelectedReview(review);
                      setShowCompleteModal(true);
                    }}>完成复核</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showStartModal && (
        <div className="modal-overlay" onClick={() => setShowStartModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>开始复核</h3>
            <div className="form-group">
              <label>选择复核员</label>
              <select value={startForm.reviewer_id} onChange={e => setStartForm({...startForm, reviewer_id: e.target.value})}>
                <option value="">请选择复核员</option>
                {reviewers.map(reviewer => (
                  <option key={reviewer.id} value={reviewer.id}>{reviewer.name} ({reviewer.employee_no})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>选择订单</label>
              <select value={startForm.order_id} onChange={e => setStartForm({...startForm, order_id: e.target.value})}>
                <option value="">请选择订单</option>
                {pickedOrders.map(order => (
                  <option key={order.id} value={order.id}>{order.order_no} - {order.customer_name} - ¥{order.total_amount.toFixed(2)}</option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowStartModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleStart}>开始复核</button>
            </div>
          </div>
        </div>
      )}

      {showCompleteModal && (
        <div className="modal-overlay" onClick={() => setShowCompleteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>完成复核</h3>
            <p>订单: {selectedReview?.order_no} - {selectedReview?.customer_name}</p>
            <div className="form-group">
              <label>称重差异 (kg)</label>
              <input type="number" step="0.01" value={completeForm.weight_difference} onChange={e => setCompleteForm({...completeForm, weight_difference: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="form-group">
              <label>复核备注</label>
              <textarea value={completeForm.notes} onChange={e => setCompleteForm({...completeForm, notes: e.target.value})} placeholder="请输入复核备注（可选）" />
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowCompleteModal(false)}>取消</button>
              <button className="btn btn-success" onClick={handleComplete}>提交审核</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewExecute;
