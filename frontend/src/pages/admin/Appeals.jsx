import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';

const AdminAppeals = () => {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [handlingResult, setHandlingResult] = useState('');
  const [status, setStatus] = useState('resolved');

  useEffect(() => {
    loadAppeals();
  }, []);

  const loadAppeals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/platform/appeals');
      setAppeals(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleAppeal = async () => {
    if (!selectedAppeal) return;
    try {
      await api.post(`/platform/appeals/${selectedAppeal}/handle`, {
        status,
        handling_result: handlingResult
      });
      setMessage({ type: 'success', text: '工单处理完成' });
      setSelectedAppeal(null);
      loadAppeals();
    } catch (e) {
      setMessage({ type: 'error', text: '处理失败' });
    }
  };

  const getTypeText = (type) => {
    const types = {
      order_issue: '订单问题',
      fee_dispute: '费用纠纷',
      system_error: '系统错误',
      other: '其他'
    };
    return types[type] || type;
  };

  if (loading) return <div className="container"><div className="spinner" /> 加载中...</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '20px' }}>📝 申诉工单处理</h1>

      {message && (
        <div className={`alert alert-${message.type}`} onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>工单ID</th>
              <th>类型</th>
              <th>标题</th>
              <th>骑手</th>
              <th>关联订单</th>
              <th>提交时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {appeals.map((a) => (
              <tr key={a.id}>
                <td>#{a.id}</td>
                <td>{getTypeText(a.type)}</td>
                <td>{a.title}</td>
                <td>{a.rider_name}</td>
                <td className="mask">{a.order_no || '-'}</td>
                <td>{new Date(a.created_at * 1000).toLocaleString()}</td>
                <td>
                  <span className={`badge ${a.status === 'resolved' ? 'badge-success' : a.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>
                    {a.status === 'pending' ? '待处理' : a.status === 'resolved' ? '已解决' : '已驳回'}
                  </span>
                </td>
                <td>
                  {a.status === 'pending' && (
                    <button className="btn btn-primary" onClick={() => setSelectedAppeal(a.id)}>处理</button>
                  )}
                </td>
              </tr>
            ))}
            {appeals.length === 0 && (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>暂无申诉工单</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedAppeal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h3 className="card-title">处理申诉工单 #{selectedAppeal}</h3>
            <div className="form-group">
              <label className="form-label">处理结果</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="resolved">已解决</option>
                <option value="rejected">已驳回</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">处理说明</label>
              <textarea className="textarea" value={handlingResult} onChange={(e) => setHandlingResult(e.target.value)} placeholder="请输入处理说明" required />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-block" onClick={() => setSelectedAppeal(null)}>取消</button>
              <button className="btn btn-primary btn-block" onClick={handleAppeal}>确认处理</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppeals;
