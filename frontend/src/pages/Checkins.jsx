import { useState, useEffect } from 'react';
import axios from 'axios';

function Checkins({ user }) {
  const [camps, setCamps] = useState([]);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentCheckin, setCurrentCheckin] = useState(null);
  const [reviewForm, setReviewForm] = useState({ coach_comment: '', coach_rating: 5, status: 'approved' });

  useEffect(() => {
    loadCamps();
  }, []);

  useEffect(() => {
    if (selectedCamp) {
      loadCheckins();
    }
  }, [selectedCamp, statusFilter]);

  const loadCamps = async () => {
    const res = await axios.get('/api/camps');
    setCamps(res.data);
    if (res.data.length > 0) setSelectedCamp(res.data[0]);
  };

  const loadCheckins = async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    const res = await axios.get(`/api/camps/${selectedCamp.id}/checkins?${params.toString()}`);
    setCheckins(res.data);
  };

  const openReview = (checkin) => {
    setCurrentCheckin(checkin);
    setReviewForm({ coach_comment: checkin.coach_comment || '', coach_rating: checkin.coach_rating || 5, status: checkin.status === 'pending' ? 'approved' : checkin.status });
    setShowReviewModal(true);
  };

  const handleReview = async () => {
    await axios.put(`/api/checkins/${currentCheckin.id}/review`, { ...reviewForm, coach_id: user.id });
    setShowReviewModal(false);
    loadCheckins();
  };

  const statusMap = {
    pending: { label: '待审核', class: 'badge-warning' },
    approved: { label: '已通过', class: 'badge-info' },
    excellent: { label: '优秀', class: 'badge-success' },
    rejected: { label: '已驳回', class: 'badge-danger' }
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <h2 style={{ margin: 0 }}>打卡审核</h2>
        <div className="flex gap-2">
          {camps.map(camp => (
            <button key={camp.id} className={`btn ${selectedCamp?.id === camp.id ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSelectedCamp(camp)}>
              {camp.name}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex gap-2 mb-4">
          <button className={`btn ${statusFilter === '' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setStatusFilter('')}>全部</button>
          <button className={`btn ${statusFilter === 'pending' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setStatusFilter('pending')}>待审核</button>
          <button className={`btn ${statusFilter === 'approved' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setStatusFilter('approved')}>已通过</button>
          <button className={`btn ${statusFilter === 'excellent' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setStatusFilter('excellent')}>优秀</button>
          <button className={`btn ${statusFilter === 'rejected' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setStatusFilter('rejected')}>已驳回</button>
        </div>

        {checkins.length === 0 ? (
          <p className="text-center text-gray" style={{ padding: 40 }}>暂无打卡记录</p>
        ) : (
          checkins.map(checkin => (
            <div key={checkin.id} className="checkin-card">
              <div className="flex-between">
                <div>
                  <strong>{checkin.user_name}</strong>
                  <span className="text-sm text-gray" style={{ marginLeft: 12 }}>第 {checkin.day_number} 天 · {checkin.task_title}</span>
                </div>
                <div className="flex gap-2">
                  <span className={`badge ${statusMap[checkin.status].class}`}>{statusMap[checkin.status].label}</span>
                  {checkin.is_makeup && <span className="badge badge-warning">补卡</span>}
                  {(user.role === 'coach' || user.role === 'admin') && (
                    <button className="btn btn-primary btn-sm" onClick={() => openReview(checkin)}>
                      {checkin.status === 'pending' ? '审核' : '编辑'}
                    </button>
                  )}
                </div>
              </div>
              <p style={{ marginTop: 12, color: '#666' }}>{checkin.content}</p>
              {checkin.images && JSON.parse(checkin.images).length > 0 && (
                <div className="image-preview">
                  {JSON.parse(checkin.images).map((img, i) => <img key={i} src={img} alt="" />)}
                </div>
              )}
              {checkin.coach_comment && (
                <div style={{ marginTop: 16, padding: 12, background: '#f0fdf4', borderRadius: 8 }}>
                  <span style={{ color: '#065f46', fontWeight: 500 }}>{checkin.coach_name} 点评：</span>
                  {checkin.coach_comment}
                  {checkin.coach_rating && <span style={{ marginLeft: 8 }}>⭐ {checkin.coach_rating}分</span>}
                </div>
              )}
              <div className="text-sm text-gray" style={{ marginTop: 12 }}>
                提交时间: {new Date(checkin.created_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      {showReviewModal && currentCheckin && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><h2>审核打卡</h2><button className="modal-close" onClick={() => setShowReviewModal(false)}>×</button></div>
            <div className="mb-4" style={{ padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
              <p><strong>{currentCheckin.user_name}</strong> · 第 {currentCheckin.day_number} 天</p>
              <p style={{ marginTop: 8, color: '#666' }}>{currentCheckin.content}</p>
            </div>
            <div className="form-group">
              <label>审核结果</label>
              <select value={reviewForm.status} onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}>
                <option value="approved">通过</option>
                <option value="excellent">优秀（+20积分）</option>
                <option value="rejected">驳回</option>
              </select>
            </div>
            <div className="form-group">
              <label>评分</label>
              <select value={reviewForm.coach_rating} onChange={(e) => setReviewForm({ ...reviewForm, coach_rating: parseInt(e.target.value) })}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} 分</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>点评内容</label>
              <textarea rows={4} value={reviewForm.coach_comment} onChange={(e) => setReviewForm({ ...reviewForm, coach_comment: e.target.value })} placeholder="请输入点评内容..." />
            </div>
            <div className="flex gap-2"><button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowReviewModal(false)}>取消</button><button className="btn btn-primary" style={{ flex: 1 }} onClick={handleReview}>提交</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkins;
