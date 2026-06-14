import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

function AdminAppeals({ showToast }) {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    loadAppeals();
  }, []);

  const loadAppeals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/appeals');
      setAppeals(response.data.data || []);
    } catch (error) {
      showToast('加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id, status) => {
    if (!resolution) {
      showToast('请填写处理结果', 'error');
      return;
    }
    
    try {
      setProcessing(true);
      await api.post(`/admin/appeals/${id}/resolve`, {
        status,
        resolution
      });
      showToast(status === 'upheld' ? '已支持申诉' : '已驳回申诉', 'success');
      setShowDetail(false);
      loadAppeals();
    } catch (error) {
      showToast(error.response?.data?.error || '操作失败', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const openDetail = (appeal) => {
    setSelectedAppeal(appeal);
    setResolution('');
    setShowDetail(true);
  };

  const getTypeLabel = (type) => {
    const labels = {
      payment: '结算问题',
      quality: '质量争议',
      communication: '沟通问题',
      other: '其他问题'
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: '待处理',
      upheld: '已支持',
      rejected: '已驳回'
    };
    return labels[status] || status;
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: 'badge-warning',
      upheld: 'badge-success',
      rejected: 'badge-danger'
    };
    return classes[status] || 'badge-secondary';
  };

  if (loading) {
    return <div className="empty-state">加载中...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px' }}>申诉处理</h1>
      
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {appeals.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>申诉类型</th>
                <th>相关任务</th>
                <th>申诉人</th>
                <th>被申诉人</th>
                <th>提交时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {appeals.map(appeal => (
                <tr key={appeal.id}>
                  <td>
                    <span className="badge badge-info">{getTypeLabel(appeal.type)}</span>
                  </td>
                  <td style={{ fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {appeal.task_title || '-'}
                  </td>
                  <td>{appeal.applicant_name || '-'}</td>
                  <td>{appeal.respondent_name || '-'}</td>
                  <td style={{ fontSize: '13px', color: '#64748b' }}>
                    {appeal.created_at?.substring(0, 16)}
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(appeal.status)}`}>
                      {getStatusLabel(appeal.status)}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 16px', fontSize: '13px' }}
                      onClick={() => openDetail(appeal)}
                    >
                      {appeal.status === 'pending' ? '处理' : '查看'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
            <p>暂无待处理申诉</p>
          </div>
        )}
      </div>
      
      {showDetail && selectedAppeal && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">申诉详情</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                padding: '16px', 
                background: '#fef3c7', 
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-warning">{getTypeLabel(selectedAppeal.type)}</span>
                  <span className={`badge ${getStatusBadgeClass(selectedAppeal.status)}`}>
                    {getStatusLabel(selectedAppeal.status)}
                  </span>
                </div>
              </div>
              
              <div style={{ fontSize: '14px', lineHeight: '2.2' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'inline-block', width: '100px' }}>相关任务：</span>
                  <strong>{selectedAppeal.task_title || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'inline-block', width: '100px' }}>申诉人：</span>
                  {selectedAppeal.applicant_name || '-'}
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'inline-block', width: '100px' }}>被申诉人：</span>
                  {selectedAppeal.respondent_name || '-'}
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'inline-block', width: '100px' }}>提交时间：</span>
                  {selectedAppeal.created_at?.substring(0, 16)}
                </div>
              </div>
              
              <div style={{ 
                marginTop: '16px', 
                padding: '16px', 
                background: '#f8fafc', 
                borderRadius: '8px' 
              }}>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>申诉理由</div>
                <div style={{ lineHeight: '1.6' }}>{selectedAppeal.reason}</div>
              </div>
              
              {selectedAppeal.resolution && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '16px', 
                  background: selectedAppeal.status === 'upheld' ? '#f0fdf4' : '#fef2f2', 
                  borderRadius: '8px' 
                }}>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>处理结果</div>
                  <div style={{ lineHeight: '1.6' }}>{selectedAppeal.resolution}</div>
                </div>
              )}
            </div>
            
            {selectedAppeal.status === 'pending' && (
              <>
                <div className="form-group">
                  <label className="form-label">处理结果 *</label>
                  <textarea
                    className="form-textarea"
                    value={resolution}
                    onChange={e => setResolution(e.target.value)}
                    placeholder="请填写处理结果..."
                  />
                </div>
                
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setShowDetail(false)}>
                    取消
                  </button>
                  <button className="btn btn-success" onClick={() => handleResolve(selectedAppeal.id, 'upheld')} disabled={processing}>
                    {processing ? '处理中...' : '支持申诉'}
                  </button>
                  <button className="btn btn-danger" onClick={() => handleResolve(selectedAppeal.id, 'rejected')} disabled={processing}>
                    {processing ? '处理中...' : '驳回申诉'}
                  </button>
                </div>
              </>
            )}
            
            {selectedAppeal.status !== 'pending' && (
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowDetail(false)}>
                  关闭
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAppeals;
