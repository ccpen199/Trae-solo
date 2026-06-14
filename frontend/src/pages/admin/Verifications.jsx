import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

function AdminVerifications({ showToast }) {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadVerifications();
  }, []);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/verifications');
      setVerifications(response.data.data || []);
    } catch (error) {
      showToast('加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status) => {
    if (status === 'rejected' && !rejectReason) {
      showToast('请填写驳回理由', 'error');
      return;
    }
    
    try {
      setProcessing(true);
      await api.post(`/admin/verifications/${id}/review`, {
        status,
        reason: rejectReason
      });
      showToast(status === 'verified' ? '认证通过' : '认证已驳回', 'success');
      setShowDetail(false);
      loadVerifications();
    } catch (error) {
      showToast(error.response?.data?.error || '操作失败', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const openDetail = (item) => {
    setSelectedItem(item);
    setRejectReason('');
    setShowDetail(true);
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: '待审核',
      verified: '已通过',
      rejected: '已驳回'
    };
    return labels[status] || status;
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: 'badge-warning',
      verified: 'badge-success',
      rejected: 'badge-danger'
    };
    return classes[status] || 'badge-secondary';
  };

  const getUserTypeLabel = (type) => {
    const labels = {
      student: '在校学生',
      homemaker: '居家宝妈',
      parttime: '兼职上班族'
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="empty-state">加载中...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px' }}>实名认证审核</h1>
      
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {verifications.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>用户类型</th>
                <th>真实姓名</th>
                <th>身份证号</th>
                <th>提交时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {verifications.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.username}</td>
                  <td>
                    <span className="badge badge-info">{getUserTypeLabel(item.user_type)}</span>
                  </td>
                  <td>{item.real_name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                    {item.id_card?.replace(/(.{6}).{8}(.{4})/, '$1********$2')}
                  </td>
                  <td style={{ fontSize: '13px', color: '#64748b' }}>
                    {item.submitted_at?.substring(0, 16)}
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 16px', fontSize: '13px' }}
                      onClick={() => openDetail(item)}
                    >
                      {item.status === 'pending' ? '审核' : '查看'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
            <p>暂无待审核认证</p>
          </div>
        )}
      </div>
      
      {showDetail && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">实名认证详情</h2>
            
            <div style={{ 
              padding: '20px', 
              background: '#f8fafc', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 600
                }}>
                  {selectedItem.real_name?.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>
                    {selectedItem.real_name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    {selectedItem.username}
                  </div>
                </div>
              </div>
              
              <div style={{ fontSize: '14px', lineHeight: '2.2' }}>
                <div><span style={{ color: '#64748b', display: 'inline-block', width: '100px' }}>用户类型：</span>
                  <span className="badge badge-info">{getUserTypeLabel(selectedItem.user_type)}</span>
                </div>
                <div><span style={{ color: '#64748b', display: 'inline-block', width: '100px' }}>身份证号：</span>
                  <span style={{ fontFamily: 'monospace' }}>{selectedItem.id_card}</span>
                </div>
                <div><span style={{ color: '#64748b', display: 'inline-block', width: '100px' }}>提交时间：</span>
                  {selectedItem.submitted_at?.substring(0, 16)}
                </div>
                <div><span style={{ color: '#64748b', display: 'inline-block', width: '100px' }}>当前状态：</span>
                  <span className={`badge ${getStatusBadgeClass(selectedItem.status)}`}>
                    {getStatusLabel(selectedItem.status)}
                  </span>
                </div>
              </div>
            </div>
            
            {selectedItem.status === 'pending' && (
              <>
                <div className="form-group">
                  <label className="form-label">驳回理由（驳回时必填）</label>
                  <textarea
                    className="form-textarea"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="请填写驳回理由..."
                  />
                </div>
                
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setShowDetail(false)}>
                    取消
                  </button>
                  <button className="btn btn-success" onClick={() => handleReview(selectedItem.id, 'verified')} disabled={processing}>
                    {processing ? '处理中...' : '通过'}
                  </button>
                  <button className="btn btn-danger" onClick={() => handleReview(selectedItem.id, 'rejected')} disabled={processing}>
                    {processing ? '处理中...' : '驳回'}
                  </button>
                </div>
              </>
            )}
            
            {selectedItem.status !== 'pending' && (
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

export default AdminVerifications;
