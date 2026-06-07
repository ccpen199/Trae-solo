import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';

const AdminRiders = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [selectedRider, setSelectedRider] = useState(null);
  const [verifyType, setVerifyType] = useState('identity');
  const [verifyStatus, setVerifyStatus] = useState('verified');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadRiders();
  }, []);

  const loadRiders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/platform/riders');
      setRiders(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedRider) return;
    try {
      await api.put(`/platform/riders/${selectedRider}/verify`, {
        verification_type: verifyType,
        status: verifyStatus,
        rejection_reason: verifyStatus === 'rejected' ? rejectionReason : ''
      });
      setMessage({ type: 'success', text: '审核已完成' });
      setSelectedRider(null);
      loadRiders();
    } catch (e) {
      setMessage({ type: 'error', text: '审核失败' });
    }
  };

  if (loading) return <div className="container"><div className="spinner" /> 加载中...</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '20px' }}>👥 骑手管理</h1>

      {message && (
        <div className={`alert alert-${message.type}`} onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>姓名</th>
              <th>手机号</th>
              <th>实人认证</th>
              <th>车辆绑定</th>
              <th>等级</th>
              <th>履约率</th>
              <th>完成订单</th>
              <th>总收入</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {riders.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.real_name}</td>
                <td className="mask">{r.phone}</td>
                <td>
                  <span className={`badge ${r.verification_status === 'verified' ? 'badge-success' : r.verification_status === 'pending' ? 'badge-warning' : 'badge-default'}`}>
                    {r.verification_status === 'verified' ? '已认证' : r.verification_status === 'pending' ? '审核中' : '未认证'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${r.binding_status === 'bound' ? 'badge-success' : r.binding_status === 'pending' ? 'badge-warning' : 'badge-default'}`}>
                    {r.binding_status === 'bound' ? '已绑定' : r.binding_status === 'pending' ? '审核中' : '未绑定'}
                  </span>
                </td>
                <td>Lv.{r.level || 1}</td>
                <td>{r.fulfillment_rate?.toFixed(1) || 0}%</td>
                <td>{r.completed_orders || 0}</td>
                <td>¥{r.total_income?.toFixed(2) || '0.00'}</td>
                <td>
                  <button className="btn" onClick={() => setSelectedRider(r.id)}>审核</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRider && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h3 className="card-title">资质审核</h3>
            <div className="form-group">
              <label className="form-label">审核类型</label>
              <select className="form-select" value={verifyType} onChange={(e) => setVerifyType(e.target.value)}>
                <option value="identity">实人认证</option>
                <option value="vehicle">车辆绑定</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">审核结果</label>
              <select className="form-select" value={verifyStatus} onChange={(e) => setVerifyStatus(e.target.value)}>
                <option value="verified">通过</option>
                <option value="rejected">拒绝</option>
              </select>
            </div>
            {verifyStatus === 'rejected' && (
              <div className="form-group">
                <label className="form-label">拒绝原因</label>
                <textarea className="textarea" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="请输入拒绝原因" />
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-block" onClick={() => setSelectedRider(null)}>取消</button>
              <button className="btn btn-primary btn-block" onClick={handleVerify}>确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRiders;
