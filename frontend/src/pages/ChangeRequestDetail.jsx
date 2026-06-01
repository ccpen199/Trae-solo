import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../App';
import { changeRequestsAPI, contractsAPI, approvalsAPI } from '../api';

function ChangeRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useContext(UserContext);
  const [change, setChange] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [sections, setSections] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [approval, setApproval] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [changeRes, contractsRes] = await Promise.all([
        changeRequestsAPI.getById(id),
        contractsAPI.getAll()
      ]);
      setChange(changeRes.data);
      setFormData(changeRes.data);
      setContracts(contractsRes.data);

      if (changeRes.data.contract_id) {
        const sectionsRes = await contractsAPI.getSections(changeRes.data.contract_id);
        setSections(sectionsRes.data);
      }

      if (changeRes.data.status !== 'draft') {
        const approvalsRes = await approvalsAPI.getAll('change');
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
      await changeRequestsAPI.update(id, formData);
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
    try {
      await changeRequestsAPI.submit(id);
      setSuccess('已提交审批');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || '提交失败');
    }
  };

  const handleAddAttachment = async (type) => {
    const fileName = type === 'photo' ? '现场照片.jpg' : '图纸说明.pdf';
    try {
      await changeRequestsAPI.addAttachment(id, {
        file_name: fileName,
        file_path: '/uploads/demo.jpg',
        file_type: type === 'photo' ? 'image/jpeg' : 'application/pdf',
        file_size: 102400,
        attachment_type: type
      });
      setSuccess('附件添加成功（演示）');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('添加附件失败');
    }
  };

  const handleRemoveAttachment = async (attachmentId) => {
    try {
      await changeRequestsAPI.removeAttachment(id, attachmentId);
      loadData();
    } catch (err) {
      setError('删除附件失败');
    }
  };

  if (!change) {
    return <div className="card">加载中...</div>;
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { text: '草稿', class: 'badge-draft' },
      pending_approval: { text: '审批中', class: 'badge-pending' },
      approved: { text: '已通过', class: 'badge-approved' },
      rejected: { text: '已驳回', class: 'badge-rejected' }
    };
    const info = statusMap[status] || { text: status, class: 'badge-draft' };
    return <span className={`badge ${info.class}`}>{info.text}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">变更申请详情</h2>
          <div style={{ marginTop: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontFamily: 'monospace', color: '#64748b' }}>{change.change_no}</span>
            {getStatusBadge(change.status)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => navigate('/change-requests')}>
            返回列表
          </button>
          {change.status === 'draft' && (user.role === 'admin' || user.role === 'construction') && (
            <>
              <button className="btn btn-secondary" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? '取消编辑' : '编辑'}
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                提交审批
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="tabs">
        <button className={`tab ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>基本信息</button>
        <button className={`tab ${activeTab === 'attachments' ? 'active' : ''}`} onClick={() => setActiveTab('attachments')}>附件资料</button>
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
                  <label className="form-label">所属标段</label>
                  <select
                    className="form-select"
                    value={formData.section_id || ''}
                    onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                  >
                    <option value="">请选择标段</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>{s.section_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">变更标题<span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">变更原因<span className="required">*</span></label>
                <textarea
                  className="form-textarea"
                  value={formData.change_reason}
                  onChange={(e) => setFormData({ ...formData, change_reason: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">影响范围<span className="required">*</span></label>
                <textarea
                  className="form-textarea"
                  value={formData.impact_scope}
                  onChange={(e) => setFormData({ ...formData, impact_scope: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">图纸依据</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.drawing_reference || ''}
                    onChange={(e) => setFormData({ ...formData, drawing_reference: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">预计费用（元）<span className="required">*</span></label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.estimated_amount}
                    onChange={(e) => setFormData({ ...formData, estimated_amount: e.target.value })}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div style={{ textAlign: 'right', marginTop: '20px' }}>
                <button className="btn btn-primary" onClick={handleSave}>保存修改</button>
              </div>
            </div>
          ) : (
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">变更编号</span>
                <span className="detail-value" style={{ fontFamily: 'monospace' }}>{change.change_no}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">所属合同</span>
                <span className="detail-value">{change.contract_name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">所属标段</span>
                <span className="detail-value">{change.section_name || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">预计费用</span>
                <span className="detail-value amount-display">{formatAmount(change.estimated_amount)}</span>
              </div>
              <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                <span className="detail-label">变更标题</span>
                <span className="detail-value">{change.title}</span>
              </div>
              <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                <span className="detail-label">变更原因</span>
                <span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{change.change_reason}</span>
              </div>
              <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                <span className="detail-label">影响范围</span>
                <span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{change.impact_scope}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">图纸依据</span>
                <span className="detail-value">{change.drawing_reference || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">创建时间</span>
                <span className="detail-value">{change.created_at?.slice(0, 19)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'attachments' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">附件资料</h3>
            {change.status === 'draft' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-sm btn-primary" onClick={() => handleAddAttachment('photo')}>+ 上传现场照片</button>
                <button className="btn btn-sm btn-secondary" onClick={() => handleAddAttachment('drawing')}>+ 上传图纸</button>
              </div>
            )}
          </div>

          {change.status === 'draft' && (
            <div className="alert alert-warning">
              提示：提交审批前必须上传现场照片
            </div>
          )}

          {!change.attachments || change.attachments.length === 0 ? (
            <div className="empty-state">暂无附件</div>
          ) : (
            <div className="attachment-list">
              {change.attachments.map((att) => (
                <div key={att.id} className="attachment-item">
                  <span>{att.attachment_type === 'photo' ? '📷' : '📄'}</span>
                  <span>{att.file_name}</span>
                  <span className="badge" style={{ marginLeft: '8px' }}>
                    {att.attachment_type === 'photo' ? '现场照片' : '图纸'}
                  </span>
                  {change.status === 'draft' && (
                    <button className="remove-btn" onClick={() => handleRemoveAttachment(att.id)}>×</button>
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
                <div className="timeline-role">{record.approver_role}</div>
                <div className="timeline-status">
                  {record.status === 'approved' ? `已通过 - ${record.approver_name || '未填写'}` :
                   record.status === 'rejected' ? `已驳回 - ${record.approver_name || '未填写'}` :
                   '待审批'}
                  {record.is_escalated && <span className="badge" style={{ marginLeft: '8px' }}>金额超限升级</span>}
                </div>
                {record.opinion && (
                  <div className="timeline-opinion">{record.opinion}</div>
                )}
                {record.approved_at && (
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                    {record.approved_at.slice(0, 19)}
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

export default ChangeRequestDetail;
