import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { containerApi, exceptionApi } from '../services/api';
import { getExceptionLabel, getResponsiblePartyLabel } from '../constants';

const STEP_TYPE_LABELS = {
  discovery: '发现问题',
  contact: '联系相关方',
  verify: '核实确认',
  notify: '通知客户',
  process: '处理中',
  close: '结案',
  other: '其他'
};

const FEEDBACK_TYPE_LABELS = {
  customer_confirm: '客户确认',
  customer_complaint: '客户投诉',
  customer_query: '客户询问',
  internal_note: '内部备注',
  other: '其他'
};

const ContainerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [container, setContainer] = useState(null);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedException, setExpandedException] = useState(null);
  const [exceptionDetails, setExceptionDetails] = useState({});
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [showAddFeedbackModal, setShowAddFeedbackModal] = useState(false);
  const [currentExceptionId, setCurrentExceptionId] = useState(null);
  const [stepForm, setStepForm] = useState({ step_type: 'other', title: '', description: '', operator: '' });
  const [feedbackForm, setFeedbackForm] = useState({ feedback_type: 'customer_confirm', content: '', contact_person: '', contact_phone: '', created_by: '' });

  useEffect(() => {
    loadContainerDetail();
  }, [id]);

  const loadContainerDetail = async () => {
    try {
      setLoading(true);
      const response = await containerApi.getById(id);
      setContainer(response.data.container);
      setExceptions(response.data.exceptions || []);
    } catch (err) {
      console.error('加载详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadExceptionDetails = async (exceptionId) => {
    try {
      const response = await exceptionApi.getFull(exceptionId);
      setExceptionDetails(prev => ({ ...prev, [exceptionId]: response.data }));
    } catch (err) {
      console.error('加载异常详情失败:', err);
    }
  };

  const toggleExceptionExpand = async (exceptionId) => {
    if (expandedException === exceptionId) {
      setExpandedException(null);
    } else {
      setExpandedException(exceptionId);
      if (!exceptionDetails[exceptionId]) {
        await loadExceptionDetails(exceptionId);
      }
    }
  };

  const handleAddStep = async (e) => {
    e.preventDefault();
    try {
      await exceptionApi.addStep(currentExceptionId, stepForm);
      setShowAddStepModal(false);
      setStepForm({ step_type: 'other', title: '', description: '', operator: '' });
      await loadExceptionDetails(currentExceptionId);
      loadContainerDetail();
    } catch (err) {
      console.error('添加处理步骤失败:', err);
    }
  };

  const handleAddFeedback = async (e) => {
    e.preventDefault();
    try {
      await exceptionApi.addFeedback(currentExceptionId, feedbackForm);
      setShowAddFeedbackModal(false);
      setFeedbackForm({ feedback_type: 'customer_confirm', content: '', contact_person: '', contact_phone: '', created_by: '' });
      await loadExceptionDetails(currentExceptionId);
      loadContainerDetail();
    } catch (err) {
      console.error('添加客户反馈失败:', err);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getStatusBadgeStyle = (status) => {
    const styles = {
      open: { backgroundColor: '#fed7d7', color: '#c53030' },
      processing: { backgroundColor: '#fef5e7', color: '#d69e2e' },
      resolved: { backgroundColor: '#c6f6d5', color: '#2f855a' },
      closed: { backgroundColor: '#e2e8f0', color: '#718096' }
    };
    return styles[status] || styles.open;
  };

  const getStatusLabel = (status) => {
    const labels = {
      open: '待处理',
      processing: '处理中',
      resolved: '已解决',
      closed: '已关闭'
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div style={styles.loading}>加载中...</div>;
  }

  if (!container) {
    return <div style={styles.loading}>未找到箱号信息</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/')} style={styles.backButton}>← 返回</button>
        <div style={styles.titleContainer}>
          <h2 style={styles.pageTitle}>箱号详情: {container.container_number}</h2>
          {container.open_exceptions_count > 0 && (
            <span style={styles.exceptionBadge}>
              {container.open_exceptions_count} 个待处理异常
            </span>
          )}
        </div>
      </div>

      <div style={styles.infoCard}>
        <h3 style={styles.sectionTitle}>基本信息</h3>
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>箱号</span>
            <span style={styles.infoValue}>{container.container_number}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>订舱号</span>
            <span style={styles.infoValue}>{container.booking_number || '-'}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>提单号</span>
            <span style={styles.infoValue}>{container.bill_of_lading || '-'}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>箱型</span>
            <span style={styles.infoValue}>{container.container_type}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>货主</span>
            <span style={styles.infoValue}>{container.shipper || '-'}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>起运港</span>
            <span style={styles.infoValue}>{container.origin_port || '-'}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>目的港</span>
            <span style={styles.infoValue}>{container.destination_port || '-'}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>状态</span>
            <span style={styles.infoValue}>{container.status}</span>
          </div>
        </div>
      </div>

      <div style={styles.sectionCard}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>异常记录 ({exceptions.length})</h3>
        </div>
        
        {exceptions.length === 0 ? (
          <div style={styles.empty}>暂无异常记录</div>
        ) : (
          <div style={styles.exceptionList}>
            {exceptions.map((exception) => (
              <div key={exception.id} style={styles.exceptionCard}>
                <div style={styles.exceptionHeader} onClick={() => toggleExceptionExpand(exception.id)}>
                  <div style={styles.exceptionTitleRow}>
                    <span style={styles.exceptionType}>{getExceptionLabel(exception.exception_type)}</span>
                    <span style={{ ...styles.exceptionStatus, ...getStatusBadgeStyle(exception.status) }}>
                      {getStatusLabel(exception.status)}
                    </span>
                  </div>
                  <div style={styles.exceptionMetaRow}>
                    <span>责任方: {getResponsiblePartyLabel(exception.responsible_party)}</span>
                    <span>记录时间: {new Date(exception.created_at).toLocaleString()}</span>
                    <span style={styles.expandIcon}>
                      {expandedException === exception.id ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {exception.description && (
                  <div style={styles.exceptionDesc}>
                    <strong>描述:</strong> {exception.description}
                  </div>
                )}

                {exception.action_taken && (
                  <div style={styles.exceptionAction}>
                    <strong>已采取措施:</strong> {exception.action_taken}
                  </div>
                )}

                {expandedException === exception.id && exceptionDetails[exception.id] && (
                  <div style={styles.exceptionDetailContent}>
                    {/* 处理时间线 */}
                    <div style={styles.subSection}>
                      <div style={styles.subSectionHeader}>
                        <h4 style={styles.subSectionTitle}>📋 处理时间线 ({exceptionDetails[exception.id].steps.length})</h4>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentExceptionId(exception.id);
                            setShowAddStepModal(true);
                          }} 
                          style={styles.smallAddButton}
                        >
                          + 添加步骤
                        </button>
                      </div>
                      <div style={styles.timeline}>
                        {exceptionDetails[exception.id].steps.map((step, index) => (
                          <div key={step.id} style={styles.timelineItem}>
                            <div style={styles.timelineDot}></div>
                            <div style={styles.timelineContent}>
                              <div style={styles.timelineHeader}>
                                <span style={styles.stepType}>{STEP_TYPE_LABELS[step.step_type] || step.step_type}: {step.title}</span>
                                <span style={styles.timelineTime}>{new Date(step.created_at).toLocaleString()}</span>
                              </div>
                              <div style={styles.stepOperator}>操作人: {step.operator}</div>
                              {step.description && (
                                <div style={styles.stepDescription}>{step.description}</div>
                              )}
                              {step.attachments && step.attachments.length > 0 && (
                                <div style={styles.attachmentsList}>
                                  {step.attachments.map(att => (
                                    <div key={att.id} style={styles.attachmentItem}>
                                      <span style={styles.attachmentIcon}>📎</span>
                                      <span style={styles.attachmentName}>{att.file_name}</span>
                                      <span style={styles.attachmentSize}>{formatFileSize(att.file_size)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 客户反馈 */}
                    <div style={styles.subSection}>
                      <div style={styles.subSectionHeader}>
                        <h4 style={styles.subSectionTitle}>💬 客户反馈 ({exceptionDetails[exception.id].feedback.length})</h4>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentExceptionId(exception.id);
                            setShowAddFeedbackModal(true);
                          }} 
                          style={styles.smallAddButton}
                        >
                          + 添加反馈
                        </button>
                      </div>
                      {exceptionDetails[exception.id].feedback.length === 0 ? (
                        <div style={styles.emptySmall}>暂无客户反馈</div>
                      ) : (
                        <div style={styles.feedbackList}>
                          {exceptionDetails[exception.id].feedback.map((fb) => (
                            <div key={fb.id} style={styles.feedbackItem}>
                              <div style={styles.feedbackHeader}>
                                <span style={styles.feedbackType}>{FEEDBACK_TYPE_LABELS[fb.feedback_type] || fb.feedback_type}</span>
                                <span style={styles.feedbackTime}>{new Date(fb.created_at).toLocaleString()}</span>
                              </div>
                              <div style={styles.feedbackContent}>{fb.content}</div>
                              <div style={styles.feedbackContact}>
                                {fb.contact_person && <span>联系人: {fb.contact_person}</span>}
                                {fb.contact_phone && <span>电话: {fb.contact_phone}</span>}
                                <span>记录人: {fb.created_by}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 所有附件 */}
                    {exceptionDetails[exception.id].attachments.length > 0 && (
                      <div style={styles.subSection}>
                        <h4 style={styles.subSectionTitle}>📎 相关文件 ({exceptionDetails[exception.id].attachments.length})</h4>
                        <div style={styles.allAttachmentsList}>
                          {exceptionDetails[exception.id].attachments.map((att) => (
                            <div key={att.id} style={styles.attachmentCard}>
                              <div style={styles.attachmentCardIcon}>
                                {att.file_type?.startsWith('image/') ? '🖼️' : '📄'}
                              </div>
                              <div style={styles.attachmentCardInfo}>
                                <div style={styles.attachmentCardName}>{att.file_name}</div>
                                <div style={styles.attachmentCardMeta}>
                                  <span>{formatFileSize(att.file_size)}</span>
                                  <span>上传人: {att.uploaded_by}</span>
                                  <span>{new Date(att.uploaded_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 添加处理步骤弹窗 */}
      {showAddStepModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddStepModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>添加处理步骤</h3>
              <button onClick={() => setShowAddStepModal(false)} style={styles.closeButton}>×</button>
            </div>
            <form onSubmit={handleAddStep} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>步骤类型 *</label>
                  <select
                    value={stepForm.step_type}
                    onChange={(e) => setStepForm({ ...stepForm, step_type: e.target.value })}
                    style={styles.select}
                    required
                  >
                    {Object.entries(STEP_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>操作人 *</label>
                  <input
                    type="text"
                    value={stepForm.operator}
                    onChange={(e) => setStepForm({ ...stepForm, operator: e.target.value })}
                    style={styles.input}
                    placeholder="请输入操作人姓名"
                    required
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>标题 *</label>
                <input
                  type="text"
                  value={stepForm.title}
                  onChange={(e) => setStepForm({ ...stepForm, title: e.target.value })}
                  style={styles.input}
                  placeholder="请输入步骤标题"
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>详细描述</label>
                <textarea
                  value={stepForm.description}
                  onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })}
                  style={styles.textarea}
                  rows={4}
                  placeholder="请输入详细的处理说明"
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowAddStepModal(false)} style={styles.cancelButton}>
                  取消
                </button>
                <button type="submit" style={styles.submitButton}>
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 添加客户反馈弹窗 */}
      {showAddFeedbackModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddFeedbackModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>添加客户反馈</h3>
              <button onClick={() => setShowAddFeedbackModal(false)} style={styles.closeButton}>×</button>
            </div>
            <form onSubmit={handleAddFeedback} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>反馈类型 *</label>
                  <select
                    value={feedbackForm.feedback_type}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback_type: e.target.value })}
                    style={styles.select}
                    required
                  >
                    {Object.entries(FEEDBACK_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>记录人 *</label>
                  <input
                    type="text"
                    value={feedbackForm.created_by}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, created_by: e.target.value })}
                    style={styles.input}
                    placeholder="请输入记录人姓名"
                    required
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>联系人</label>
                  <input
                    type="text"
                    value={feedbackForm.contact_person}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, contact_person: e.target.value })}
                    style={styles.input}
                    placeholder="客户联系人姓名"
                  />
                </div>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>联系电话</label>
                  <input
                    type="text"
                    value={feedbackForm.contact_phone}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, contact_phone: e.target.value })}
                    style={styles.input}
                    placeholder="客户联系电话"
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>反馈内容 *</label>
                <textarea
                  value={feedbackForm.content}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, content: e.target.value })}
                  style={styles.textarea}
                  rows={5}
                  placeholder="请输入客户反馈的详细内容"
                  required
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowAddFeedbackModal(false)} style={styles.cancelButton}>
                  取消
                </button>
                <button type="submit" style={styles.submitButton}>
                  保存
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
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1.25rem',
    color: '#718096',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  backButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#3182ce',
    fontSize: '1rem',
    cursor: 'pointer',
    padding: '0.5rem',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#1a365d',
    margin: 0,
  },
  exceptionBadge: {
    backgroundColor: '#fed7d7',
    color: '#c53030',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#2d3748',
    margin: 0,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  infoLabel: {
    fontSize: '0.875rem',
    color: '#718096',
  },
  infoValue: {
    fontSize: '1rem',
    color: '#2d3748',
    fontWeight: 500,
  },
  empty: {
    textAlign: 'center',
    padding: '2rem',
    color: '#718096',
    backgroundColor: '#f7fafc',
    borderRadius: '6px',
  },
  emptySmall: {
    textAlign: 'center',
    padding: '1rem',
    color: '#a0aec0',
    fontSize: '0.875rem',
  },
  exceptionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  exceptionCard: {
    backgroundColor: '#fff5f5',
    borderRadius: '6px',
    padding: '1rem',
    borderLeft: '4px solid #e53e3e',
  },
  exceptionHeader: {
    cursor: 'pointer',
  },
  exceptionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.5rem',
  },
  exceptionType: {
    fontWeight: 600,
    color: '#c53030',
    fontSize: '1.05rem',
  },
  exceptionStatus: {
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  exceptionMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.875rem',
    color: '#718096',
  },
  expandIcon: {
    fontSize: '0.75rem',
  },
  exceptionDesc: {
    fontSize: '0.875rem',
    color: '#4a5568',
    backgroundColor: 'white',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '0.5rem',
    marginTop: '0.75rem',
  },
  exceptionAction: {
    fontSize: '0.875rem',
    color: '#2f855a',
    backgroundColor: '#f0fff4',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '0.75rem',
  },
  exceptionDetailContent: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px dashed #fed7d7',
  },
  subSection: {
    marginBottom: '1.5rem',
    '&:last-child': {
      marginBottom: 0,
    },
  },
  subSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  subSectionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#4a5568',
    margin: 0,
  },
  smallAddButton: {
    backgroundColor: '#3182ce',
    color: 'white',
    border: 'none',
    padding: '0.3rem 0.7rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  timeline: {
    position: 'relative',
    paddingLeft: '1.5rem',
  },
  timelineItem: {
    position: 'relative',
    paddingBottom: '1rem',
    '&:last-child': {
      paddingBottom: 0,
    },
  },
  timelineDot: {
    position: 'absolute',
    left: '-1.5rem',
    top: '0.25rem',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#4299e1',
    border: '2px solid white',
    boxShadow: '0 0 0 2px #4299e1',
  },
  timelineContent: {
    backgroundColor: '#f7fafc',
    borderRadius: '6px',
    padding: '0.75rem 1rem',
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.25rem',
  },
  stepType: {
    fontWeight: 600,
    color: '#2b6cb0',
    fontSize: '0.95rem',
  },
  timelineTime: {
    fontSize: '0.8rem',
    color: '#a0aec0',
  },
  stepOperator: {
    fontSize: '0.85rem',
    color: '#718096',
    marginBottom: '0.25rem',
  },
  stepDescription: {
    fontSize: '0.875rem',
    color: '#4a5568',
    lineHeight: 1.5,
  },
  attachmentsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '0.5rem',
    paddingTop: '0.5rem',
    borderTop: '1px dashed #e2e8f0',
  },
  attachmentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    backgroundColor: 'white',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
  },
  attachmentIcon: {
    fontSize: '0.9rem',
  },
  attachmentName: {
    color: '#4a5568',
  },
  attachmentSize: {
    color: '#a0aec0',
  },
  feedbackList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  feedbackItem: {
    backgroundColor: '#ebf8ff',
    borderRadius: '6px',
    padding: '0.75rem 1rem',
    borderLeft: '3px solid #4299e1',
  },
  feedbackHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  feedbackType: {
    fontWeight: 600,
    color: '#2b6cb0',
    fontSize: '0.9rem',
  },
  feedbackTime: {
    fontSize: '0.8rem',
    color: '#a0aec0',
  },
  feedbackContent: {
    fontSize: '0.875rem',
    color: '#4a5568',
    lineHeight: 1.5,
    marginBottom: '0.5rem',
  },
  feedbackContact: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.8rem',
    color: '#718096',
  },
  allAttachmentsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '0.75rem',
  },
  attachmentCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: '#f7fafc',
    borderRadius: '6px',
    padding: '0.75rem',
  },
  attachmentCardIcon: {
    fontSize: '1.5rem',
  },
  attachmentCardInfo: {
    flex: 1,
  },
  attachmentCardName: {
    fontSize: '0.875rem',
    color: '#2d3748',
    fontWeight: 500,
    marginBottom: '0.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  attachmentCardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
    fontSize: '0.75rem',
    color: '#a0aec0',
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
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '550px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #e2e8f0',
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#718096',
  },
  form: {
    padding: '1.5rem',
  },
  formRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  formGroupHalf: {
    flex: 1,
    marginBottom: 0,
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 500,
    color: '#2d3748',
    fontSize: '0.9rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.95rem',
    backgroundColor: 'white',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.95rem',
    resize: 'vertical',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  submitButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3182ce',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
};

export default ContainerDetail;
