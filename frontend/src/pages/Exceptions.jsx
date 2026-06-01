import React, { useState, useEffect } from 'react';
import { reportsApi } from '../api.js';

function Exceptions() {
  const [exceptions, setExceptions] = useState([]);
  const [filters, setFilters] = useState({ is_resolved: '' });
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedException, setSelectedException] = useState(null);
  const [resolveForm, setResolveForm] = useState({ manual_note: '', compensation_action: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExceptions();
  }, [filters]);

  const loadExceptions = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v)
      );
      const res = await reportsApi.getExceptions(params);
      if (res.data.success) {
        setExceptions(res.data.data);
      }
    } catch (error) {
      console.error('加载异常列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    try {
      const res = await reportsApi.resolveException(selectedException.id, {
        user_id: 1,
        ...resolveForm
      });
      if (res.data.success) {
        setShowResolveModal(false);
        setSelectedException(null);
        setResolveForm({ manual_note: '', compensation_action: '' });
        loadExceptions();
      }
    } catch (error) {
      alert('处理失败: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>🔧 异常处理</h2>
      </div>

      <div className="filter-bar">
        <select 
          value={filters.is_resolved} 
          onChange={e => setFilters({ ...filters, is_resolved: e.target.value })}
        >
          <option value="">全部状态</option>
          <option value="false">未处理</option>
          <option value="true">已处理</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div>加载中...</div>
        ) : exceptions.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>操作类型</th>
                <th>关联审计</th>
                <th>错误信息</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map(e => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{e.operation_type}</td>
                  <td>{e.audit_id || '-'}</td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e.error_message}
                  </td>
                  <td>
                    <span className={`status-badge ${e.is_resolved ? 'status-completed' : 'status-pending'}`}>
                      {e.is_resolved ? '已处理' : '未处理'}
                    </span>
                  </td>
                  <td>{new Date(e.created_at).toLocaleString()}</td>
                  <td>
                    {!e.is_resolved && (
                      <button 
                        className="link"
                        onClick={() => { setSelectedException(e); setShowResolveModal(true); }}
                      >
                        处理
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">暂无异常记录</div>
        )}
      </div>

      {showResolveModal && selectedException && (
        <div className="modal-overlay" onClick={() => setShowResolveModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>处理异常</h3>
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              <div><strong>异常类型:</strong> {selectedException.operation_type}</div>
              <div><strong>错误信息:</strong> {selectedException.error_message}</div>
            </div>
            {selectedException.original_request && (
              <div className="form-group">
                <label>原始请求</label>
                <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '4px', fontSize: '12px', maxHeight: '100px', overflow: 'auto' }}>
                  {selectedException.original_request}
                </div>
              </div>
            )}
            <div className="form-group">
              <label>补偿动作</label>
              <input 
                type="text" 
                value={resolveForm.compensation_action}
                onChange={e => setResolveForm({ ...resolveForm, compensation_action: e.target.value })}
                placeholder="已执行的补偿动作"
              />
            </div>
            <div className="form-group">
              <label>处理备注 *</label>
              <textarea 
                value={resolveForm.manual_note}
                onChange={e => setResolveForm({ ...resolveForm, manual_note: e.target.value })}
                placeholder="请输入处理说明"
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowResolveModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleResolve}>标记已处理</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Exceptions;
