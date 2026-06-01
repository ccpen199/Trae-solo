import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../App';
import { visaFormsAPI, contractsAPI, approvalsAPI } from '../api';

function VisaFormDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useContext(UserContext);
  const fileInputRef = useRef(null);
  const [visa, setVisa] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [sections, setSections] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [approval, setApproval] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [visaRes, contractsRes] = await Promise.all([
        visaFormsAPI.getById(id),
        contractsAPI.getAll()
      ]);
      setVisa(visaRes.data);
      setFormData(visaRes.data);
      setContracts(contractsRes.data);

      if (visaRes.data.contract_id) {
        const sectionsRes = await contractsAPI.getSections(visaRes.data.contract_id);
        setSections(sectionsRes.data);
      }

      if (visaRes.data.status === 'pending_approval' || visaRes.data.status === 'approved' || visaRes.data.status === 'rejected') {
        const approvalsRes = await approvalsAPI.getAll('visa');
        const workflow = approvalsRes.data.find(a => a.business_id === parseInt(id));
        if (workflow) {
          const detailRes = await approvalsAPI.getById(workflow.id);
          setApproval(detailRes.data);
        }
      }
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { text: '草稿', class: 'badge-draft' },
      pending_cost_review: { text: '待造价复核', class: 'badge-pending' },
      returned: { text: '已退回', class: 'badge-rejected' },
      pending_approval: { text: '审批中', class: 'badge-pending' },
      approved: { text: '已通过', class: 'badge-approved' },
      rejected: { text: '已驳回', class: 'badge-rejected' }
    };
    const info = statusMap[status] || { text: status, class: 'badge-draft' };
    return <span className={`badge ${info.class}`}>{info.text}</span>;
  };

  const handleContractChange = async (contractId) => {
    setFormData({ ...formData, contract_id: contractId, section_id: '' });
    if (contractId) {
      try {
        const res = await contractsAPI.getSections(contractId);
        setSections(res.data);
      } catch (err) {
        console.error('加载标段失败', err);
      }
    } else {
      setSections([]);
    }
  };

  const handleSave = async () => {
    setError('');
    try {
      await visaFormsAPI.update(id, formData);
      setIsEditing(false);
      setSuccess('保存成功');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || '保存失败');
    }
  };

  const handleSubmit = async () => {
    setError('');
    const attachmentCount = visa?.attachments?.length || 0;
    if (attachmentCount === 0) {
      setError('请先上传现场照片或图纸等附件资料，缺少资料无法进行造价复核');
      setActiveTab('attachments');
      return;
    }
    try {
      await visaFormsAPI.submit(id);
      setSuccess('已提交造价复核');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || '提交失败');
    }
  };

  const handleAddAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('文件大小不能超过 10MB');
      return;
    }

    setUploading(true);
    setError('');
    try {
      await visaFormsAPI.uploadAttachment(id, file);
      setSuccess('附件上传成功');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('上传失败：' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAttachment = async (attId) => {
    if (!confirm('确定要删除这个附件吗？')) return;
    try {
      await visaFormsAPI.deleteAttachment(id, attId);
      setSuccess('附件已删除');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('删除失败');
    }
  };

  const handleApprove = async (record) => {
    setError('');
    try {
      await approvalsAPI.approve(approval.id, {
        stage: record.stage,
        opinion: '同意',
        approver_name: user.name,
        approval_amount: visa.total_amount
      });
      setSuccess('审批通过');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || '操作失败');
    }
  };

  const handleReject = async (record) => {
    setError('');
    try {
      await approvalsAPI.reject(approval.id, {
        stage: record.stage,
        opinion: '不同意',
        approver_name: user.name
      });
      setSuccess('已驳回');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || '操作失败');
    }
  };

  if (!visa) {
    return <div className="container"><div style={{ textAlign: 'center', padding: '60px' }}>加载中...</div></div>;
  }

  const canEdit = visa.status === 'draft' || visa.status === 'returned';
  const canSubmit = visa.status === 'draft' || visa.status === 'returned';
  const attachmentCount = visa.attachments?.length || 0;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 className="page-title">签证单详情</h2>
          <span style={{ fontFamily: 'monospace', color: '#64748b' }}>{visa.visa_no}</span>
          {getStatusBadge(visa.status)}
          {visa.total_amount > 100000 && <span className="badge badge-warning">金额超限（需成本部门审批）</span>}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => navigate('/visa-forms')}>
            返回列表
          </button>
          {canEdit && (user.role === 'admin' || user.role === 'construction') && (
            <button className="btn btn-secondary" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? '取消编辑' : '编辑'}
            </button>
          )}
          {canSubmit && (user.role === 'admin' || user.role === 'construction') && (
            <button className="btn btn-primary" onClick={handleSubmit}>
              提交造价复核
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {canSubmit && attachmentCount === 0 && (
        <div className="alert" style={{ background: '#fff7ed', border: '1px solid #fdba74', color: '#c2410c' }}>
          <strong>⚠️ 重要提示：</strong> 请先上传现场照片、图纸等附件资料，否则无法提交造价复核。
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>基本信息</button>
        <button className={`tab ${activeTab === 'attachments' ? 'active' : ''}`} onClick={() => setActiveTab('attachments')}>
          附件资料
          {attachmentCount > 0 && <span style={{ marginLeft: '6px', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' }}>{attachmentCount}</span>}
        </button>
        {approval && <button className={`tab ${activeTab === 'approval' ? 'active' : ''}`} onClick={() => setActiveTab('approval')}>审批记录</button>}
      </div>

      {activeTab === 'basic' && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '20px' }}>基本信息</h3>
          
          {isEditing ? (
            <div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">所属合同<span className="required">*</span></label>
                  <select
                    className="form-select"
                    value={formData.contract_id}
                    onChange={(e) => handleContractChange(e.target.value)}
                    required
                  >
                    <option value="">请选择合同</option>
                    {contracts.map((c) => (
                      <option key={c.id} value={c.id}>{c.contract_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">责任单位<span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.responsible_unit}
                    onChange={(e) => setFormData({ ...formData, responsible_unit: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">项目名称<span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">工程量<span className="required">*</span></label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">单位<span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">单价（元）<span className="required">*</span></label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">计算式<span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.calculation_formula}
                  onChange={(e) => setFormData({ ...formData, calculation_formula: e.target.value })}
                  required
                />
              </div>

              <div style={{ textAlign: 'right', marginTop: '20px' }}>
                <button className="btn btn-primary" onClick={handleSave}>保存修改</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">签证编号</span>
                  <span className="detail-value" style={{ fontFamily: 'monospace' }}>{visa.visa_no}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">关联变更</span>
                  <span className="detail-value">{visa.change_title || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">所属合同</span>
                  <span className="detail-value">{visa.contract_name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">责任单位</span>
                  <span className="detail-value">{visa.responsible_unit}</span>
                </div>
                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                  <span className="detail-label">项目名称</span>
                  <span className="detail-value">{visa.project_name}</span>
                </div>
              </div>

              <div style={{ marginTop: '24px', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                <h4 style={{ marginBottom: '16px' }}>费用明细</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">工程量</span>
                    <span className="detail-value">{visa.quantity} {visa.unit}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">单价</span>
                    <span className="detail-value amount-display">{formatAmount(visa.unit_price)}/{visa.unit}</span>
                  </div>
                  <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                    <span className="detail-label">计算式</span>
                    <span className="detail-value">{visa.calculation_formula}</span>
                  </div>
                  <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                    <span className="detail-label">总金额</span>
                    <span className="detail-value amount-display amount-large">{formatAmount(visa.total_amount)}</span>
                  </div>
                </div>
              </div>

              {visa.cost_review_status && (
                <div style={{ marginTop: '24px', padding: '20px', background: visa.cost_review_status === 'approved' ? '#f0fdf4' : '#fef2f2', borderRadius: '12px' }}>
                  <h4 style={{ marginBottom: '12px' }}>造价复核意见</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span className={`badge ${visa.cost_review_status === 'approved' ? 'badge-approved' : 'badge-rejected'}`}>
                      {visa.cost_review_status === 'approved' ? '复核通过' : '已退回'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{visa.cost_reviewed_at?.slice(0, 19)}</span>
                  </div>
                  {visa.cost_review_comment && (
                    <p style={{ marginTop: '8px' }}>{visa.cost_review_comment}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'attachments' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">附件资料</h3>
            {canEdit && (user.role === 'admin' || user.role === 'construction') && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                />
                <button 
                  className="btn btn-sm btn-primary" 
                  onClick={handleAddAttachment}
                  disabled={uploading}
                >
                  {uploading ? '上传中...' : '+ 上传附件'}
                </button>
              </>
            )}
          </div>

          <div style={{ padding: '12px 0', marginBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              📋 支持上传：现场照片、施工图纸、测量记录、材料验收单等（支持图片、PDF、Excel、Word，单文件最大 10MB）
            </p>
          </div>

          {!visa.attachments || visa.attachments.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📎</div>
              <p>暂无附件</p>
              {canEdit && (user.role === 'admin' || user.role === 'construction') && (
                <p style={{ fontSize: '14px', color: '#94a3b8' }}>请上传现场照片、图纸等资料后再提交</p>
              )}
            </div>
          ) : (
            <div className="attachment-list">
              {visa.attachments.map((att) => (
                <div key={att.id} className="attachment-item">
                  <span style={{ fontSize: '24px' }}>
                    {att.file_type?.startsWith('image/') ? '🖼️' : '📄'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>{att.file_name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {(att.file_size / 1024).toFixed(1)} KB · {att.created_at?.slice(0, 19)}
                    </div>
                  </div>
                  {canEdit && (user.role === 'admin' || user.role === 'construction') && (
                    <button 
                      className="btn btn-sm btn-outline btn-danger" 
                      onClick={() => handleDeleteAttachment(att.id)}
                    >
                      删除
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'approval' && approval && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '20px' }}>审批流程</h3>
          
          <div className="approval-flow">
            {approval.records.map((record, index) => (
              <React.Fragment key={record.id}>
                <div className={`approval-step ${
                  record.status === 'approved' ? 'completed' :
                  record.status === 'rejected' ? 'rejected' :
                  record.status === 'pending' ? 'active' : ''
                }`}>
                  {record.approver_role}
                  {record.is_escalated && <span title="金额超限升级">⚠️</span>}
                  {record.status === 'approved' && ' ✓'}
                  {record.status === 'rejected' && ' ✗'}
                </div>
                {index < approval.records.length - 1 && (
                  <span className="approval-arrow">→</span>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="timeline">
            {approval.records.map((record) => (
              <div key={record.id} className={`timeline-item ${
                record.status === 'approved' ? 'completed' :
                record.status === 'rejected' ? 'rejected' : ''
              }`}>
                <div className="timeline-role">
                  {record.approver_role}
                  {record.is_escalated && <span className="badge" style={{ marginLeft: '8px' }}>金额超限升级</span>}
                </div>
                <div className="timeline-status">
                  {record.status === 'approved' ? `已通过 - ${record.approver_name || '未填写'}` :
                   record.status === 'rejected' ? `已驳回 - ${record.approver_name || '未填写'}` :
                   '待审批'}
                </div>
                {record.opinion && (
                  <div className="timeline-opinion">{record.opinion}</div>
                )}
                {record.approved_at && (
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                    {record.approved_at.slice(0, 19)}
                  </div>
                )}
                {record.status === 'pending' && approval.overall_status === 'pending' && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <button className="btn btn-sm btn-success" onClick={() => handleApprove(record)}>通过</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleReject(record)}>驳回</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default VisaFormDetail;
