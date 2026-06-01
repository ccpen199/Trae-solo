import React, { useState, useEffect } from 'react';
import { exceptionApi } from '../services/api';
import { getExceptionLabel, getResponsiblePartyLabel } from '../constants';

const ExceptionList = () => {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedExceptionId, setSelectedExceptionId] = useState(null);
  const [resolveNote, setResolveNote] = useState('');
  const [operatorName, setOperatorName] = useState('');

  useEffect(() => {
    loadExceptions();
  }, []);

  const loadExceptions = async () => {
    try {
      setLoading(true);
      const response = await exceptionApi.getAll();
      setExceptions(response.data);
    } catch (err) {
      console.error('加载异常列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProcessing = async (id) => {
    try {
      await exceptionApi.updateStatus(id, { 
        status: 'processing',
        note: '开始处理',
        created_by: operatorName || '系统操作员'
      });
      loadExceptions();
    } catch (err) {
      console.error('更新状态失败:', err);
    }
  };

  const handleResolve = async () => {
    try {
      await exceptionApi.updateStatus(selectedExceptionId, { 
        status: 'resolved',
        note: resolveNote || '问题已解决',
        created_by: operatorName || '系统操作员'
      });
      setShowResolveModal(false);
      setSelectedExceptionId(null);
      setResolveNote('');
      loadExceptions();
    } catch (err) {
      console.error('解决异常失败:', err);
    }
  };

  const filteredExceptions = exceptions.filter(e => {
    if (filter === 'all') return true;
    return e.status === filter;
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.pageTitle}>异常管理</h2>
        <div style={styles.filters}>
          <button 
            onClick={() => setFilter('all')} 
            style={{...styles.filterButton, ...(filter === 'all' ? styles.activeFilter : {})}}
          >
            全部 ({exceptions.length})
          </button>
          <button 
            onClick={() => setFilter('open')} 
            style={{...styles.filterButton, ...(filter === 'open' ? styles.activeFilter : {})}}
          >
            待处理 ({exceptions.filter(e => e.status === 'open').length})
          </button>
          <button 
            onClick={() => setFilter('processing')} 
            style={{...styles.filterButton, ...(filter === 'processing' ? styles.activeFilter : {})}}
          >
            处理中 ({exceptions.filter(e => e.status === 'processing').length})
          </button>
          <button 
            onClick={() => setFilter('resolved')} 
            style={{...styles.filterButton, ...(filter === 'resolved' ? styles.activeFilter : {})}}
          >
            已解决 ({exceptions.filter(e => e.status === 'resolved').length})
          </button>
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>加载中...</div>
      ) : filteredExceptions.length === 0 ? (
        <div style={styles.empty}>暂无异常记录</div>
      ) : (
        <div style={styles.exceptionGrid}>
          {filteredExceptions.map((exception) => (
            <div key={exception.id} style={styles.exceptionCard}>
              <div style={styles.exceptionHeader}>
                  <span style={styles.exceptionType}>{getExceptionLabel(exception.exception_type)}</span>
                  <span style={styles.exceptionStatus(exception.status)}>
                    {{ open: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭' }[exception.status] || '待处理'}
                  </span>
                </div>
              
              <div style={styles.exceptionMeta}>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>责任方:</span>
                  <span style={styles.metaValue}>{getResponsiblePartyLabel(exception.responsible_party)}</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>箱号:</span>
                  <span style={styles.metaValue}>{exception.container_id || '-'}</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>记录时间:</span>
                  <span style={styles.metaValue}>{new Date(exception.created_at).toLocaleString()}</span>
                </div>
              </div>

              {exception.description && (
                <div style={styles.description}>
                  <span style={styles.metaLabel}>描述:</span>
                  <p style={styles.descText}>{exception.description}</p>
                </div>
              )}

              {exception.action_taken && (
                <div style={styles.action}>
                  <span style={styles.metaLabel}>处理措施:</span>
                  <p style={styles.actionText}>{exception.action_taken}</p>
                </div>
              )}

              {exception.status === 'open' && (
                <div style={styles.actionButtons}>
                  <button 
                    onClick={() => handleStartProcessing(exception.id)}
                    style={styles.processButton}
                  >
                    开始处理
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedExceptionId(exception.id);
                      setShowResolveModal(true);
                    }}
                    style={styles.resolveButton}
                  >
                    标记为已解决
                  </button>
                </div>
              )}

              {exception.status === 'processing' && (
                <div style={styles.actionButtons}>
                  <button 
                    onClick={() => {
                      setSelectedExceptionId(exception.id);
                      setShowResolveModal(true);
                    }}
                    style={styles.resolveButton}
                  >
                    标记为已解决
                  </button>
                </div>
              )}

              {exception.status === 'resolved' && exception.resolved_at && (
                <div style={styles.resolvedInfo}>
                  ✓ 已解决 · {new Date(exception.resolved_at).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 解决异常弹窗 */}
      {showResolveModal && (
        <div style={styles.modalOverlay} onClick={() => setShowResolveModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>标记异常为已解决</h3>
              <button onClick={() => setShowResolveModal(false)} style={styles.closeButton}>×</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>操作人姓名</label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  style={styles.input}
                  placeholder="请输入您的姓名"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>解决说明 *</label>
                <textarea
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  style={styles.textarea}
                  rows={4}
                  placeholder="请详细描述解决情况..."
                  required
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowResolveModal(false)} style={styles.cancelButton}>
                取消
              </button>
              <button onClick={handleResolve} style={styles.submitButton}>
                确认解决
              </button>
            </div>
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#1a365d',
    margin: 0,
  },
  filters: {
    display: 'flex',
    gap: '0.5rem',
  },
  filterButton: {
    padding: '0.5rem 1rem',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#4a5568',
  },
  activeFilter: {
    backgroundColor: '#3182ce',
    color: 'white',
    borderColor: '#3182ce',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1.25rem',
    color: '#718096',
  },
  empty: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    color: '#718096',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  exceptionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '1rem',
  },
  exceptionCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    borderLeft: '4px solid #e53e3e',
  },
  exceptionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  exceptionType: {
    fontWeight: 600,
    fontSize: '1.125rem',
    color: '#c53030',
  },
  exceptionStatus: (status) => {
    const colors = {
      open: { bg: '#fed7d7', color: '#c53030', label: '待处理' },
      processing: { bg: '#fef5e7', color: '#d69e2e', label: '处理中' },
      resolved: { bg: '#c6f6d5', color: '#2f855a', label: '已解决' },
      closed: { bg: '#e2e8f0', color: '#718096', label: '已关闭' },
    };
    const style = colors[status] || colors.open;
    return {
      backgroundColor: style.bg,
      color: style.color,
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
    };
  },
  exceptionMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  metaItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
  },
  metaLabel: {
    color: '#718096',
  },
  metaValue: {
    color: '#2d3748',
    fontWeight: 500,
  },
  description: {
    backgroundColor: '#f7fafc',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '0.75rem',
  },
  descText: {
    margin: '0.25rem 0 0 0',
    color: '#4a5568',
    fontSize: '0.875rem',
    lineHeight: 1.5,
  },
  action: {
    backgroundColor: '#f0fff4',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
  },
  actionText: {
    margin: '0.25rem 0 0 0',
    color: '#2f855a',
    fontSize: '0.875rem',
    lineHeight: 1.5,
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  resolveButton: {
    backgroundColor: '#38a169',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    cursor: 'pointer',
    fontWeight: 500,
  },
  resolvedInfo: {
    textAlign: 'right',
    fontSize: '0.75rem',
    color: '#718096',
    paddingTop: '0.5rem',
    borderTop: '1px solid #e2e8f0',
  },
  processButton: {
    backgroundColor: '#d69e2e',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    cursor: 'pointer',
    fontWeight: 500,
    marginRight: '0.5rem',
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
    maxWidth: '500px',
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
  modalTitle: {
    margin: 0,
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#2d3748',
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#718096',
    padding: 0,
  },
  modalBody: {
    padding: '1.5rem',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    padding: '1rem 1.5rem',
    borderTop: '1px solid #e2e8f0',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 500,
    color: '#2d3748',
    fontSize: '0.875rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.875rem',
    resize: 'vertical',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  submitButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#38a169',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
};

export default ExceptionList;
