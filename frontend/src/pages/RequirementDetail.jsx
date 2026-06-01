import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { requirementsAPI, nameApprovalsAPI, materialsAPI, progressAPI, acceptanceAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const RequirementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, canAccess } = useAuth();
  const [requirement, setRequirement] = useState(null);
  const [nameApproval, setNameApproval] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [progressSteps, setProgressSteps] = useState([]);
  const [acceptanceChecks, setAcceptanceChecks] = useState([]);
  const [activeTab, setActiveTab] = useState('info');
  const [showNameApprovalModal, setShowNameApprovalModal] = useState(false);
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(null);
  const [reviewForm, setReviewForm] = useState({ status: 'confirmed', comment: '' });
  const [resultForm, setResultForm] = useState({ result: 'approved', approvedName: '', rejectionReason: '' });
  const [noteForm, setNoteForm] = useState({ notes: '' });
  const [nameApprovalForm, setNameApprovalForm] = useState({
    alternative_names: [''],
    assigned_officer: ''
  });
  const [acceptanceForm, setAcceptanceForm] = useState({
    check_type: 'name_rejection',
    issue_description: '',
    responsible_person: '',
    due_date: ''
  });

  useEffect(() => {
    loadRequirement();
    loadNameApproval();
    loadMaterials();
    loadProgress();
    loadAcceptanceChecks();
  }, [id]);

  const loadRequirement = async () => {
    try {
      const response = await requirementsAPI.get(id);
      setRequirement(response.data);
    } catch (error) {
      console.error('加载需求详情失败:', error);
    }
  };

  const loadNameApproval = async () => {
    try {
      const response = await nameApprovalsAPI.getByRequirement(id);
      setNameApproval(response.data);
    } catch (error) {
      console.error('加载名称核准失败:', error);
    }
  };

  const loadMaterials = async () => {
    try {
      const response = await materialsAPI.getByRequirement(id);
      setMaterials(response.data);
    } catch (error) {
      console.error('加载材料失败:', error);
    }
  };

  const loadProgress = async () => {
    try {
      const response = await progressAPI.getByRequirement(id);
      setProgressSteps(response.data);
    } catch (error) {
      console.error('加载进度失败:', error);
    }
  };

  const loadAcceptanceChecks = async () => {
    try {
      const response = await acceptanceAPI.getByRequirement(id);
      setAcceptanceChecks(response.data);
    } catch (error) {
      console.error('加载验收检查失败:', error);
    }
  };

  const handleNameApprovalSubmit = async (e) => {
    e.preventDefault();
    try {
      await nameApprovalsAPI.create({
        requirement_id: id,
        alternative_names: nameApprovalForm.alternative_names.filter(n => n),
        assigned_officer: nameApprovalForm.assigned_officer
      });
      setShowNameApprovalModal(false);
      setNameApprovalForm({ alternative_names: [''], assigned_officer: '' });
      loadNameApproval();
    } catch (error) {
      console.error('创建名称核准失败:', error);
      alert('创建名称核准失败，请重试');
    }
  };

  const handleNameApprovalResult = async () => {
    try {
      await nameApprovalsAPI.updateResult(nameApproval.id, {
        approval_result: resultForm.result,
        approved_name: resultForm.approvedName || null,
        rejection_reason: resultForm.rejectionReason || null
      });
      setShowResultModal(false);
      loadNameApproval();
    } catch (error) {
      console.error('更新名称核准结果失败:', error);
      alert('更新失败，请重试');
    }
  };

  const handleMaterialUpload = async (materialId, file) => {
    try {
      await materialsAPI.upload(materialId, file);
      loadMaterials();
    } catch (error) {
      console.error('上传材料失败:', error);
      alert('上传失败，请重试');
    }
  };

  const handleMaterialReview = async () => {
    try {
      await materialsAPI.review(currentMaterial.id, {
        status: reviewForm.status,
        review_comment: reviewForm.comment,
        reviewed_by: currentUser.name
      });
      setShowReviewModal(false);
      setCurrentMaterial(null);
      setReviewForm({ status: 'confirmed', comment: '' });
      loadMaterials();
    } catch (error) {
      console.error('审核材料失败:', error);
      alert('审核失败，请重试');
    }
  };

  const handleStartProgress = async (stepId) => {
    try {
      await progressAPI.start(stepId, { assigned_to: currentUser.name });
      loadProgress();
    } catch (error) {
      console.error('开始进度失败:', error);
    }
  };

  const handleCompleteProgress = async () => {
    try {
      await progressAPI.complete(currentProgress.id, {
        notes: noteForm.notes,
        customer_notification: '已完成，请等待下一步'
      });
      setShowNoteModal(false);
      setCurrentProgress(null);
      setNoteForm({ notes: '' });
      loadProgress();
    } catch (error) {
      console.error('完成进度失败:', error);
      alert('操作失败，请重试');
    }
  };

  const handleAcceptanceSubmit = async (e) => {
    e.preventDefault();
    try {
      await acceptanceAPI.create({
        requirement_id: id,
        ...acceptanceForm
      });
      setShowAcceptanceModal(false);
      setAcceptanceForm({
        check_type: 'name_rejection',
        issue_description: '',
        responsible_person: '',
        due_date: ''
      });
      loadAcceptanceChecks();
    } catch (error) {
      console.error('创建验收检查失败:', error);
      alert('创建失败，请重试');
    }
  };

  const handleResolveAcceptance = async (checkId) => {
    try {
      await acceptanceAPI.resolve(checkId, {
        resolution_notes: '已解决',
        resolved_by: currentUser.name
      });
      loadAcceptanceChecks();
    } catch (error) {
      console.error('解决验收检查失败:', error);
      alert('操作失败，请重试');
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': '待处理',
      'pending_upload': '待上传',
      'pending_review': '待审核',
      'confirmed': '已确认',
      'in_progress': '进行中',
      'completed': '已完成',
      'approved': '已通过',
      'rejected': '已驳回',
      'resolved': '已解决'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': '#f39c12',
      'pending_upload': '#95a5a6',
      'pending_review': '#e67e22',
      'confirmed': '#27ae60',
      'in_progress': '#3498db',
      'completed': '#27ae60',
      'approved': '#27ae60',
      'rejected': '#e74c3c',
      'resolved': '#27ae60'
    };
    return colorMap[status] || '#95a5a6';
  };

  const getCheckTypeText = (type) => {
    const typeMap = {
      'name_rejection': '名称驳回',
      'shareholder_missing': '股东材料缺失',
      'signature_expired': '签字文件过期',
      'processing_returned': '办理退回',
      'document_archiving': '证照归档'
    };
    return typeMap[type] || type;
  };

  const getCompanyTypeText = (type) => {
    const typeMap = {
      'limited': '有限责任公司',
      'sole': '一人有限公司',
      'partnership': '合伙企业',
      'individual': '个体工商户'
    };
    return typeMap[type] || type;
  };

  if (!requirement) {
    return <div style={styles.loading}>加载中...</div>;
  }

  return (
    <div>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>← 返回</button>
        <h1 style={styles.pageTitle}>注册需求详情</h1>
      </div>

      <div style={styles.tabNav}>
        {[
          { key: 'info', label: '基本信息' },
          { key: 'nameApproval', label: '名称核准' },
          { key: 'materials', label: '材料中心' },
          { key: 'progress', label: '办理进度' },
          { key: 'acceptance', label: '验收检查' }
        ].map(tab => (
          <button
            key={tab.key}
            style={{
              ...styles.tabButton,
              ...(activeTab === tab.key ? styles.tabButtonActive : {})
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        {activeTab === 'info' && (
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>客户名称:</span>
              <span style={styles.infoValue}>{requirement.client_name}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>注册地区:</span>
              <span style={styles.infoValue}>{requirement.registration_region}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>公司类型:</span>
              <span style={styles.infoValue}>{getCompanyTypeText(requirement.company_type)}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>注册资本:</span>
              <span style={styles.infoValue}>{requirement.registered_capital} 万元</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>加急办理:</span>
              <span style={styles.infoValue}>{requirement.urgent_requirement ? '是' : '否'}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>状态:</span>
              <span style={{
                ...styles.statusTag,
                backgroundColor: getStatusColor(requirement.status)
              }}>
                {getStatusText(requirement.status)}
              </span>
            </div>
            {requirement.business_scope && (
              <div style={{...styles.infoItem, gridColumn: '1 / -1'}}>
                <span style={styles.infoLabel}>经营范围:</span>
                <span style={styles.infoValue}>{requirement.business_scope}</span>
              </div>
            )}
            {requirement.material_list && requirement.material_list.length > 0 && (
              <div style={{...styles.infoItem, gridColumn: '1 / -1'}}>
                <span style={styles.infoLabel}>材料清单:</span>
                <div style={styles.materialList}>
                  {requirement.material_list.map((m, i) => (
                    <span key={i} style={styles.materialTag}>{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'nameApproval' && (
          <div>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>名称核准</h3>
              {!nameApproval && canAccess(['admin', 'sales', 'officer']) && (
                <button style={styles.addButton} onClick={() => setShowNameApprovalModal(true)}>
                  + 提交名称核准
                </button>
              )}
            </div>
            {nameApproval ? (
              <div>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>状态:</span>
                    <span style={{
                      ...styles.statusTag,
                      backgroundColor: getStatusColor(nameApproval.status)
                    }}>
                      {getStatusText(nameApproval.status)}
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>提交次数:</span>
                    <span style={styles.infoValue}>{nameApproval.submission_count}</span>
                  </div>
                  <div style={{...styles.infoItem, gridColumn: '1 / -1'}}>
                    <span style={styles.infoLabel}>备选名称:</span>
                    <div style={styles.materialList}>
                      {(nameApproval.alternative_names || []).map((name, i) => (
                        <span key={i} style={styles.materialTag}>{name}</span>
                      ))}
                    </div>
                  </div>
                  {nameApproval.approved_name && (
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>核准名称:</span>
                      <span style={{...styles.infoValue, color: '#27ae60', fontWeight: 600}}>
                        {nameApproval.approved_name}
                      </span>
                    </div>
                  )}
                  {nameApproval.rejection_reason && (
                    <div style={{...styles.infoItem, gridColumn: '1 / -1'}}>
                      <span style={styles.infoLabel}>驳回原因:</span>
                      <span style={{...styles.infoValue, color: '#e74c3c'}}>
                        {nameApproval.rejection_reason}
                      </span>
                    </div>
                  )}
                </div>

                {canAccess(['admin', 'officer']) && nameApproval.status === 'pending' && (
                  <div style={styles.actionGroup}>
                    <button style={{...styles.actionButton, backgroundColor: '#27ae60'}} 
                      onClick={() => {
                        setResultForm({ result: 'approved', approvedName: nameApproval.alternative_names[0], rejectionReason: '' });
                        setShowResultModal(true);
                      }}>
                      ✓ 核准通过
                    </button>
                    <button style={{...styles.actionButton, backgroundColor: '#e74c3c'}}
                      onClick={() => {
                        setResultForm({ result: 'rejected', approvedName: '', rejectionReason: '' });
                        setShowResultModal(true);
                      }}>
                      ✗ 驳回
                    </button>
                  </div>
                )}

                {canAccess(['admin', 'officer']) && nameApproval.status === 'rejected' && (
                  <div style={styles.actionGroup}>
                    <button style={{...styles.actionButton, backgroundColor: '#f39c12'}}
                      onClick={() => setShowNameApprovalModal(true)}>
                      ↻ 重新提交申请
                    </button>
                  </div>
                )}

                {nameApproval.history && nameApproval.history.length > 0 && (
                  <div style={styles.historySection}>
                    <h4 style={styles.historyTitle}>提交历史</h4>
                    {nameApproval.history.map((h, i) => (
                      <div key={i} style={styles.historyItem}>
                        <span style={styles.historyText}>
                          第 {h.submission_number} 次提交: {h.submitted_names.join(', ')}
                        </span>
                        {h.result && (
                          <span style={{
                            ...styles.statusTag,
                            fontSize: '11px',
                            backgroundColor: getStatusColor(h.result)
                          }}>
                            {h.result === 'approved' ? '通过' : '驳回'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p style={styles.emptyText}>暂无名称核准记录，点击按钮提交名称核准申请</p>
            )}
          </div>
        )}

        {activeTab === 'materials' && (
          <div>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>材料中心</h3>
            </div>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.tableCell}>材料名称</th>
                  <th style={styles.tableCell}>状态</th>
                  <th style={styles.tableCell}>版本</th>
                  <th style={styles.tableCell}>操作</th>
                </tr>
              </thead>
              <tbody>
                {materials.map(material => (
                  <tr key={material.id} style={styles.tableRow}>
                    <td style={styles.tableCell}>{material.name}</td>
                    <td style={styles.tableCell}>
                      <span style={{
                        ...styles.statusTag,
                        backgroundColor: getStatusColor(material.status)
                      }}>
                        {getStatusText(material.status)}
                      </span>
                    </td>
                    <td style={styles.tableCell}>v{material.version}</td>
                    <td style={styles.tableCell}>
                      {canAccess(['admin', 'sales']) && material.status === 'pending_upload' && (
                        <label style={styles.uploadLabel}>
                          <input
                            type="file"
                            style={styles.fileInput}
                            onChange={(e) => e.target.files[0] && handleMaterialUpload(material.id, e.target.files[0])}
                          />
                          <span style={styles.uploadButton}>📤 上传材料</span>
                        </label>
                      )}
                      {canAccess(['admin', 'material']) && material.status === 'pending_review' && (
                        <div style={styles.actionGroupSmall}>
                          <button style={{...styles.smallButton, backgroundColor: '#27ae60'}} 
                            onClick={() => {
                              setCurrentMaterial(material);
                              setReviewForm({ status: 'confirmed', comment: '' });
                              setShowReviewModal(true);
                            }}>
                            ✓ 通过
                          </button>
                          <button style={{...styles.smallButton, backgroundColor: '#e74c3c'}}
                            onClick={() => {
                              setCurrentMaterial(material);
                              setReviewForm({ status: 'pending_upload', comment: '' });
                              setShowReviewModal(true);
                            }}>
                            ✗ 退回
                          </button>
                        </div>
                      )}
                      {material.status === 'confirmed' && (
                        <span style={styles.doneText}>✓ 已确认</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'progress' && (
          <div>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>办理进度</h3>
            </div>
            <div style={styles.progressTimeline}>
              {progressSteps.map((step, index) => (
                <div key={step.id} style={styles.progressItem}>
                  <div style={{
                    ...styles.progressDot,
                    backgroundColor: getStatusColor(step.status)
                  }} />
                  <div style={styles.progressContent}>
                    <div style={styles.progressHeader}>
                      <span style={styles.progressStepName}>{step.step_name}</span>
                      <span style={{
                        ...styles.statusTag,
                        backgroundColor: getStatusColor(step.status)
                      }}>
                        {getStatusText(step.status)}
                      </span>
                    </div>
                    {step.assigned_to && (
                      <p style={styles.progressMeta}>办理人: {step.assigned_to}</p>
                    )}
                    {step.notes && (
                      <p style={styles.progressMeta}>备注: {step.notes}</p>
                    )}
                    {canAccess(['admin', 'officer']) && step.status === 'pending' && (
                      <button style={styles.smallButton} onClick={() => handleStartProgress(step.id)}>
                        ▶ 开始办理
                      </button>
                    )}
                    {canAccess(['admin', 'officer']) && step.status === 'in_progress' && (
                      <button style={{...styles.smallButton, backgroundColor: '#27ae60'}} 
                        onClick={() => {
                          setCurrentProgress(step);
                          setNoteForm({ notes: '' });
                          setShowNoteModal(true);
                        }}>
                        ✓ 完成办理
                      </button>
                    )}
                    {step.completed_at && (
                      <p style={styles.progressDate}>完成时间: {new Date(step.completed_at).toLocaleString('zh-CN')}</p>
                    )}
                  </div>
                  {index < progressSteps.length - 1 && <div style={styles.progressLine} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'acceptance' && (
          <div>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>验收检查</h3>
              {canAccess(['admin', 'material']) && (
                <button style={styles.addButton} onClick={() => setShowAcceptanceModal(true)}>
                  + 添加检查项
                </button>
              )}
            </div>
            {acceptanceChecks.length > 0 ? (
              <div style={styles.checkList}>
                {acceptanceChecks.map(check => (
                  <div key={check.id} style={styles.checkItem}>
                    <div style={styles.checkHeader}>
                      <span style={{
                        ...styles.statusTag,
                        backgroundColor: getStatusColor(check.status)
                      }}>
                        {getStatusText(check.status)}
                      </span>
                      <span style={styles.checkType}>{getCheckTypeText(check.check_type)}</span>
                    </div>
                    {check.issue_description && (
                      <p style={styles.checkDescription}>问题描述: {check.issue_description}</p>
                    )}
                    {check.responsible_person && (
                      <p style={styles.checkMeta}>责任人: {check.responsible_person}</p>
                    )}
                    {canAccess(['admin', 'material']) && check.status !== 'resolved' && (
                      <button style={{...styles.smallButton, backgroundColor: '#27ae60'}} 
                        onClick={() => handleResolveAcceptance(check.id)}>
                        ✓ 标记已解决
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.emptyText}>暂无验收检查项</p>
            )}
          </div>
        )}
      </div>

      {/* 名称核准弹窗 */}
      {showNameApprovalModal && (
        <div style={styles.modalOverlay} onClick={() => setShowNameApprovalModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>提交名称核准</h2>
            <form onSubmit={handleNameApprovalSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>备选名称 *</label>
                {nameApprovalForm.alternative_names.map((name, i) => (
                  <input
                    key={i}
                    type="text"
                    style={{...styles.input, marginBottom: '8px'}}
                    value={name}
                    onChange={(e) => {
                      const newNames = [...nameApprovalForm.alternative_names];
                      newNames[i] = e.target.value;
                      setNameApprovalForm({...nameApprovalForm, alternative_names: newNames});
                    }}
                    placeholder={`备选名称 ${i + 1}`}
                  />
                ))}
                <button
                  type="button"
                  style={{...styles.smallButton, backgroundColor: '#3498db'}}
                  onClick={() => setNameApprovalForm({
                    ...nameApprovalForm,
                    alternative_names: [...nameApprovalForm.alternative_names, '']
                  })}
                >
                  + 添加备选名称
                </button>
              </div>
              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowNameApprovalModal(false)}>
                  取消
                </button>
                <button type="submit" style={styles.submitButton}>
                  提交核准
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 审核材料弹窗 */}
      {showReviewModal && currentMaterial && (
        <div style={styles.modalOverlay} onClick={() => setShowReviewModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>审核材料: {currentMaterial.name}</h2>
            <form onSubmit={handleMaterialReview}>
              <div style={styles.formGroup}>
                <label style={styles.label}>审核结果</label>
                <select
                  style={styles.select}
                  value={reviewForm.status}
                  onChange={(e) => setReviewForm({...reviewForm, status: e.target.value})}
                >
                  <option value="confirmed">审核通过</option>
                  <option value="pending_upload">退回修改</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>审核意见</label>
                <textarea
                  style={styles.textarea}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                  rows={3}
                  placeholder="请输入审核意见..."
                />
              </div>
              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowReviewModal(false)}>
                  取消
                </button>
                <button type="submit" style={styles.submitButton}>
                  确认
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 名称核准结果弹窗 */}
      {showResultModal && (
        <div style={styles.modalOverlay} onClick={() => setShowResultModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>名称核准结果</h2>
            <form onSubmit={handleNameApprovalResult}>
              <div style={styles.formGroup}>
                <label style={styles.label}>核准结果</label>
                <select
                  style={styles.select}
                  value={resultForm.result}
                  onChange={(e) => setResultForm({...resultForm, result: e.target.value})}
                >
                  <option value="approved">核准通过</option>
                  <option value="rejected">驳回</option>
                </select>
              </div>
              {resultForm.result === 'approved' ? (
                <div style={styles.formGroup}>
                  <label style={styles.label}>核准名称 *</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={resultForm.approvedName}
                    onChange={(e) => setResultForm({...resultForm, approvedName: e.target.value})}
                    placeholder="请输入核准通过的名称"
                    required
                  />
                </div>
              ) : (
                <div style={styles.formGroup}>
                  <label style={styles.label}>驳回原因 *</label>
                  <textarea
                    style={styles.textarea}
                    value={resultForm.rejectionReason}
                    onChange={(e) => setResultForm({...resultForm, rejectionReason: e.target.value})}
                    rows={3}
                    placeholder="请输入驳回原因..."
                    required
                  />
                </div>
              )}
              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowResultModal(false)}>
                  取消
                </button>
                <button type="submit" style={styles.submitButton}>
                  确认
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 完成办理弹窗 */}
      {showNoteModal && currentProgress && (
        <div style={styles.modalOverlay} onClick={() => setShowNoteModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>完成办理: {currentProgress.step_name}</h2>
            <form onSubmit={handleCompleteProgress}>
              <div style={styles.formGroup}>
                <label style={styles.label}>办理备注</label>
                <textarea
                  style={styles.textarea}
                  value={noteForm.notes}
                  onChange={(e) => setNoteForm({...noteForm, notes: e.target.value})}
                  rows={3}
                  placeholder="请输入办理备注..."
                />
              </div>
              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowNoteModal(false)}>
                  取消
                </button>
                <button type="submit" style={styles.submitButton}>
                  确认完成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 验收检查弹窗 */}
      {showAcceptanceModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAcceptanceModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>添加验收检查项</h2>
            <form onSubmit={handleAcceptanceSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>检查类型 *</label>
                <select
                  style={styles.select}
                  value={acceptanceForm.check_type}
                  onChange={(e) => setAcceptanceForm({...acceptanceForm, check_type: e.target.value})}
                >
                  <option value="name_rejection">名称驳回</option>
                  <option value="shareholder_missing">股东材料缺失</option>
                  <option value="signature_expired">签字文件过期</option>
                  <option value="processing_returned">办理退回</option>
                  <option value="document_archiving">证照归档</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>问题描述</label>
                <textarea
                  style={styles.textarea}
                  value={acceptanceForm.issue_description}
                  onChange={(e) => setAcceptanceForm({...acceptanceForm, issue_description: e.target.value})}
                  rows={3}
                  placeholder="请输入问题描述..."
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>责任人</label>
                <input
                  type="text"
                  style={styles.input}
                  value={acceptanceForm.responsible_person}
                  onChange={(e) => setAcceptanceForm({...acceptanceForm, responsible_person: e.target.value})}
                  placeholder="请输入责任人姓名"
                />
              </div>
              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowAcceptanceModal(false)}>
                  取消
                </button>
                <button type="submit" style={styles.submitButton}>
                  添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#7f8c8d'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px'
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#ecf0f1',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#34495e'
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#2c3e50',
    margin: 0
  },
  tabNav: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px'
  },
  tabButton: {
    padding: '10px 20px',
    backgroundColor: '#ecf0f1',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#34495e'
  },
  tabButtonActive: {
    backgroundColor: '#3498db',
    color: 'white'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    padding: '24px'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px'
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  infoLabel: {
    fontSize: '13px',
    color: '#7f8c8d'
  },
  infoValue: {
    fontSize: '15px',
    color: '#2c3e50',
    fontWeight: 500
  },
  materialList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  materialTag: {
    padding: '4px 12px',
    backgroundColor: '#ecf0f1',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#34495e'
  },
  statusTag: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    display: 'inline-block',
    width: 'fit-content'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#2c3e50',
    margin: 0
  },
  addButton: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  emptyText: {
    textAlign: 'center',
    color: '#95a5a6',
    padding: '40px',
    fontSize: '14px'
  },
  actionGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #ecf0f1'
  },
  actionButton: {
    padding: '10px 20px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  historySection: {
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #ecf0f1'
  },
  historyTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2c3e50',
    marginBottom: '12px'
  },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    marginBottom: '8px'
  },
  historyText: {
    fontSize: '13px',
    color: '#34495e'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    backgroundColor: '#f8f9fa'
  },
  tableCell: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '1px solid #e9ecef',
    fontSize: '14px'
  },
  tableRow: {
    '&:hover': {
      backgroundColor: '#f8f9fa'
    }
  },
  uploadLabel: {
    cursor: 'pointer'
  },
  fileInput: {
    display: 'none'
  },
  uploadButton: {
    padding: '6px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    borderRadius: '4px',
    fontSize: '12px',
    display: 'inline-block'
  },
  doneText: {
    fontSize: '12px',
    color: '#27ae60',
    fontWeight: 500
  },
  actionGroupSmall: {
    display: 'flex',
    gap: '8px'
  },
  smallButton: {
    padding: '6px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  progressTimeline: {
    position: 'relative',
    paddingLeft: '30px'
  },
  progressItem: {
    position: 'relative',
    paddingBottom: '30px'
  },
  progressDot: {
    position: 'absolute',
    left: '-30px',
    top: '0',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    zIndex: 1
  },
  progressLine: {
    position: 'absolute',
    left: '-23px',
    top: '16px',
    width: '2px',
    height: 'calc(100% + 14px)',
    backgroundColor: '#e9ecef'
  },
  progressContent: {
    paddingLeft: '10px'
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  progressStepName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#2c3e50'
  },
  progressMeta: {
    fontSize: '12px',
    color: '#7f8c8d',
    marginBottom: '6px'
  },
  progressDate: {
    fontSize: '12px',
    color: '#7f8c8d',
    marginTop: '6px'
  },
  checkList: {
    display: 'grid',
    gap: '16px'
  },
  checkItem: {
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px'
  },
  checkHeader: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '10px'
  },
  checkType: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#2c3e50'
  },
  checkDescription: {
    fontSize: '13px',
    color: '#34495e',
    marginBottom: '8px'
  },
  checkMeta: {
    fontSize: '12px',
    color: '#7f8c8d',
    marginBottom: '12px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    width: '450px',
    maxWidth: '90%',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '20px',
    color: '#2c3e50'
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    color: '#34495e'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'white',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px'
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  }
};

export default RequirementDetail;
