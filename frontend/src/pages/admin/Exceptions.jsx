import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';

const exceptionTypes = {
  insufficient_players: '人数不足',
  temporary_leave: '临时退场',
  court_conflict: '场地冲突',
  deposit_refund: '订金退款',
  malicious_booking: '恶意占位',
  level_mismatch: '等级不匹配',
  other: '其他异常'
};

const getStatusBadge = (status) => {
  return status === 'pending'
    ? <span className="badge danger">待处理</span>
    : <span className="badge success">已处理</span>;
};

function Exceptions({ user }) {
  const [exceptions, setExceptions] = useState([]);
  const [filter, setFilter] = useState({ status: '', type: '' });
  const [showHandle, setShowHandle] = useState(null);
  const [handleForm, setHandleForm] = useState({ notes: '', action: '' });

  useEffect(() => {
    loadExceptions();
  }, [filter]);

  const loadExceptions = async () => {
    try {
      const res = await api.get('/exceptions', { params: filter });
      setExceptions(res.data);
    } catch (err) {
      console.error('加载异常列表失败', err);
    }
  };

  const handleException = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/exceptions/${showHandle}/handle`, handleForm);
      alert('处理成功');
      setShowHandle(null);
      setHandleForm({ notes: '', action: '' });
      loadExceptions();
    } catch (err) {
      alert(err.response?.data?.error || '处理失败');
    }
  };

  return (
    <div>
      <div className="card">
        <div className="row">
          <div>
            <label>状态</label>
            <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
              <option value="">全部</option>
              <option value="pending">待处理</option>
              <option value="handled">已处理</option>
            </select>
          </div>
          <div>
            <label>类型</label>
            <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}>
              <option value="">全部</option>
              {Object.entries(exceptionTypes).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {exceptions.map(ex => (
        <div key={ex.id} className={`exception-item ${ex.status}`}>
          <div style={{ flex: 1 }}>
            <div>
              <strong>{exceptionTypes[ex.type] || ex.type}</strong>
              {getStatusBadge(ex.status)}
              <span className="badge info" style={{ marginLeft: '8px' }}>
                {ex.created_at}
              </span>
            </div>
            <p style={{ marginTop: '8px', color: '#4a5568' }}>{ex.description}</p>
            {ex.game_title && <p className="game-meta">关联球局：{ex.game_title}</p>}
            {ex.user_name && <p className="game-meta">涉及用户：{ex.user_name}</p>}
            {ex.status === 'handled' && (
              <p className="game-meta" style={{ color: '#48bb78' }}>
                处理人：{ex.handler_name} | 处理时间：{ex.handled_at} | 备注：{ex.notes}
              </p>
            )}
          </div>
          {ex.status === 'pending' && (
            <button className="btn btn-primary" onClick={() => setShowHandle(ex.id)}>处理</button>
          )}
        </div>
      ))}

      {exceptions.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: '#718096' }}>
          暂无异常记录
        </div>
      )}

      {showHandle && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>处理异常</h3>
              <button className="close-btn" onClick={() => setShowHandle(null)}>&times;</button>
            </div>
            <form onSubmit={handleException}>
              <div className="form-group">
                <label>处理动作</label>
                <select value={handleForm.action} onChange={(e) => setHandleForm({ ...handleForm, action: e.target.value })}>
                  <option value="">常规处理</option>
                  <option value="refund">全额退款</option>
                  <option value="partial_refund">部分退款</option>
                  <option value="no_refund">不予退款</option>
                </select>
              </div>
              <div className="form-group">
                <label>处理备注 *</label>
                <textarea value={handleForm.notes} onChange={(e) => setHandleForm({ ...handleForm, notes: e.target.value })}
                  rows="3" placeholder="请填写处理说明" required />
              </div>
              <button type="submit" className="btn btn-primary">确认处理</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Exceptions;
