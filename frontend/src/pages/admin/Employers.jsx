import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

function AdminEmployers({ showToast }) {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadEmployers();
  }, []);

  const loadEmployers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/employers');
      setEmployers(response.data.data || []);
    } catch (error) {
      showToast('加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (employerId, status) => {
    if (status === 'rejected' && !rejectReason) {
      showToast('请填写驳回理由', 'error');
      return;
    }
    
    try {
      setProcessing(true);
      await api.post(`/admin/employers/${employerId}/verify`, {
        status,
        reason: rejectReason
      });
      showToast(status === 'verified' ? '雇主认证通过' : '认证已驳回', 'success');
      setShowDetail(false);
      loadEmployers();
    } catch (error) {
      showToast(error.response?.data?.error || '操作失败', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const openDetail = (employer) => {
    setSelectedEmployer(employer);
    setRejectReason('');
    setShowDetail(true);
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: '待审核',
      verified: '已认证',
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

  if (loading) {
    return <div className="empty-state">加载中...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px' }}>雇主管理</h1>
      
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>企业名称</th>
              <th>统一社会信用代码</th>
              <th>联系人</th>
              <th>联系电话</th>
              <th>信用等级</th>
              <th>认证状态</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {employers.map(employer => (
              <tr key={employer.id}>
                <td style={{ fontWeight: 500 }}>{employer.company_name}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                  {employer.business_license || '-'}
                </td>
                <td>{employer.contact_name || '-'}</td>
                <td>{employer.contact_phone || '-'}</td>
                <td>
                  <span style={{ color: '#f59e0b', fontWeight: 500 }}>
                    {employer.credit_rating || 'C'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${getStatusBadgeClass(employer.verification_status)}`}>
                    {getStatusLabel(employer.verification_status)}
                  </span>
                </td>
                <td style={{ fontSize: '13px', color: '#64748b' }}>
                  {employer.created_at?.substring(0, 16)}
                </td>
                <td>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '6px 16px', fontSize: '13px' }}
                    onClick={() => openDetail(employer)}
                  >
                    {employer.verification_status === 'pending' ? '审核' : '查看'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showDetail && selectedEmployer && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">雇主详情</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                padding: '16px', 
                background: '#f0f4ff', 
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                  {selectedEmployer.company_name}
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span className={`badge ${getStatusBadgeClass(selectedEmployer.verification_status)}`}>
                    {getStatusLabel(selectedEmployer.verification_status)}
                  </span>
                  <span style={{ color: '#f59e0b' }}>
                    信用等级：{selectedEmployer.credit_rating || 'C'}
                  </span>
                </div>
              </div>
              
              <div style={{ fontSize: '14px', lineHeight: '2.2' }}>
                <div><span style={{ color: '#64748b', display: 'inline-block', width: '120px' }}>统一社会信用代码：</span>
                  <span style={{ fontFamily: 'monospace' }}>{selectedEmployer.business_license || '-'}</span>
                </div>
                <div><span style={{ color: '#64748b', display: 'inline-block', width: '120px' }}>企业地址：</span>
                  {selectedEmployer.company_address || '-'}
                </div>
                <div><span style={{ color: '#64748b', display: 'inline-block', width: '120px' }}>联系人：</span>
                  {selectedEmployer.contact_name || '-'}
                </div>
                <div><span style={{ color: '#64748b', display: 'inline-block', width: '120px' }}>联系电话：</span>
                  {selectedEmployer.contact_phone || '-'}
                </div>
                <div><span style={{ color: '#64748b', display: 'inline-block', width: '120px' }}>企业简介：</span>
                  {selectedEmployer.company_description || '-'}
                </div>
              </div>
            </div>
            
            {selectedEmployer.verification_status === 'pending' && (
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
                  <button className="btn btn-success" onClick={() => handleVerify(selectedEmployer.id, 'verified')} disabled={processing}>
                    {processing ? '处理中...' : '认证通过'}
                  </button>
                  <button className="btn btn-danger" onClick={() => handleVerify(selectedEmployer.id, 'rejected')} disabled={processing}>
                    {processing ? '处理中...' : '驳回'}
                  </button>
                </div>
              </>
            )}
            
            {selectedEmployer.verification_status !== 'pending' && (
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

export default AdminEmployers;
