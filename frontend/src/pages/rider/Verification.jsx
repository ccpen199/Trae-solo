import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';

const RiderVerification = () => {
  const [data, setData] = useState(null);
  const [idCardNumber, setIdCardNumber] = useState('');
  const [idCardFront, setIdCardFront] = useState('');
  const [idCardBack, setIdCardBack] = useState('');
  const [facePhoto, setFacePhoto] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/rider/profile');
      setData(res.data);
      if (res.data.verification) {
        setIdCardNumber('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idCardNumber || !idCardFront || !idCardBack || !facePhoto) {
      alert('请填写完整信息并上传所有照片');
      return;
    }
    if (!/^\d{17}[\dXx]$/.test(idCardNumber)) {
      alert('请输入有效的18位身份证号');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/rider/verification', {
        id_card_number: idCardNumber,
        id_card_front: idCardFront,
        id_card_back: idCardBack,
        face_photo: facePhoto
      });
      setMessage({ type: 'success', text: '认证资料已提交，等待审核' });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || '提交失败' });
    } finally {
      setSubmitting(false);
    }
  };

  const simulateUpload = (type) => {
    const mockUrl = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...mock-${type}-${Date.now()}`;
    if (type === 'front') setIdCardFront(mockUrl);
    if (type === 'back') setIdCardBack(mockUrl);
    if (type === 'face') setFacePhoto(mockUrl);
  };

  if (loading) return <div className="container"><div className="spinner" /> 加载中...</div>;

  const status = data?.verification?.verification_status || 'none';

  return (
    <div className="container">
      <h1 style={{ marginBottom: '20px' }}>📋 实人认证</h1>

      {message && (
        <div className={`alert alert-${message.type}`} onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 className="card-title">当前认证状态</h3>
        <div style={{ marginBottom: '8px' }}>
          状态：
          <span className={`badge ${status === 'verified' ? 'badge-success' : status === 'pending' ? 'badge-warning' : status === 'rejected' ? 'badge-error' : 'badge-default'}`}>
            {status === 'verified' ? '已认证' : status === 'pending' ? '审核中' : status === 'rejected' ? '已拒绝' : '未认证'}
          </span>
        </div>
        {data?.verification?.rejection_reason && (
          <div className="alert alert-error">拒绝原因：{data.verification.rejection_reason}</div>
        )}
        {data?.verification?.id_card_number && (
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            身份证号：<span className="mask">{data.verification.id_card_number}</span>
          </div>
        )}
      </div>

      {status !== 'verified' && status !== 'pending' && (
        <div className="card">
          <h3 className="card-title">提交认证资料</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">身份证号（将加密存储，脱敏展示）</label>
              <input
                type="text"
                className="form-input mask"
                placeholder="请输入18位身份证号"
                value={idCardNumber}
                onChange={(e) => setIdCardNumber(e.target.value)}
                maxLength={18}
              />
            </div>

            <div className="grid grid-3" style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">身份证人像面</label>
                <div
                  style={{
                    height: '120px',
                    border: '2px dashed var(--border)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: idCardFront ? '#e6f4ff' : '#fafafa'
                  }}
                  onClick={() => simulateUpload('front')}
                >
                  {idCardFront ? '✓ 已上传' : '点击上传'}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">身份证国徽面</label>
                <div
                  style={{
                    height: '120px',
                    border: '2px dashed var(--border)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: idCardBack ? '#e6f4ff' : '#fafafa'
                  }}
                  onClick={() => simulateUpload('back')}
                >
                  {idCardBack ? '✓ 已上传' : '点击上传'}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">人脸照片</label>
                <div
                  style={{
                    height: '120px',
                    border: '2px dashed var(--border)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: facePhoto ? '#e6f4ff' : '#fafafa'
                  }}
                  onClick={() => simulateUpload('face')}
                >
                  {facePhoto ? '✓ 已上传' : '点击上传'}
                </div>
              </div>
            </div>

            <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
              <strong>隐私声明：</strong>您的身份信息将使用 AES-256 加密存储，仅用于身份核验，不会泄露给第三方。展示时自动脱敏处理。
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? <span className="spinner" /> : '提交认证'}
            </button>
          </form>
        </div>
      )}

      {status === 'pending' && (
        <div className="alert alert-warning">
          您的认证资料正在审核中，通常1-2个工作日完成，请耐心等待。
        </div>
      )}
    </div>
  );
};

export default RiderVerification;
