import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mergeRequestAPI, pipelineAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  backButton: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  mrHeader: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  mrTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  mrMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
    marginTop: '12px',
    fontSize: '14px',
    color: '#666',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statusBadge: (status) => ({
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: getStatusColor(status).bg,
    color: getStatusColor(status).text,
  }),
  section: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e5e5e5',
  },
  actionsBar: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  actionButton: {
    padding: '10px 20px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  actionButtonPrimary: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#28a745',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  actionButtonDanger: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#dc3545',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  actionButtonInfo: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#007bff',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #e5e5e5',
    marginBottom: '20px',
  },
  tab: (active) => ({
    padding: '12px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: active ? '600' : '400',
    color: active ? '#007bff' : '#666',
    borderBottom: active ? '2px solid #007bff' : '2px solid transparent',
  }),
  historyItem: {
    display: 'flex',
    gap: '16px',
    padding: '16px 0',
    borderBottom: '1px solid #e5e5e5',
  },
  historyIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e7f3ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
  },
  historyContent: {
    flex: 1,
  },
  historyAction: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  historyActor: {
    fontSize: '14px',
    color: '#007bff',
  },
  historyTime: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px',
  },
  historyComment: {
    fontSize: '13px',
    color: '#666',
    marginTop: '8px',
    padding: '8px 12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  modal: {
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
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    width: '100%',
    maxWidth: '450px',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#333',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#555',
    marginBottom: '6px',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    minHeight: '80px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'white',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  },
  cancelButton: {
    padding: '10px 20px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  commitList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  commitItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    gap: '12px',
  },
  commitHash: {
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#6f42c1',
  },
  commitMessage: {
    fontSize: '14px',
    color: '#333',
  },
  commitMeta: {
    fontSize: '12px',
    color: '#999',
    marginLeft: 'auto',
  },
  lockedWarning: {
    padding: '12px 16px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
    color: '#856404',
  },
};

const getStatusColor = (status) => {
  const colors = {
    pending_review: { bg: '#fff3cd', text: '#856404' },
    in_review: { bg: '#cce5ff', text: '#004085' },
    approved: { bg: '#d4edda', text: '#155724' },
    merged: { bg: '#d4edda', text: '#155724' },
    closed: { bg: '#e2e3e5', text: '#383d41' },
    changes_requested: { bg: '#f8d7da', text: '#721c24' },
  };
  return colors[status] || { bg: '#e2e3e5', text: '#383d41' };
};

const getStatusLabel = (status) => {
  const labels = {
    pending_review: '待审查',
    in_review: '审查中',
    approved: '已批准',
    merged: '已合并',
    closed: '已关闭',
    changes_requested: '请求修改',
  };
  return labels[status] || status;
};

const MergeRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [mr, setMr] = useState(null);
  const [activeTab, setActiveTab] = useState('history');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [comment, setComment] = useState('');
  const [newReviewerId, setNewReviewerId] = useState('');

  useEffect(() => {
    const fetchMR = async () => {
      try {
        const response = await mergeRequestAPI.getById(id);
        setMr(response.data);
      } catch (error) {
        console.error('Failed to fetch merge request:', error);
      }
    };
    fetchMR();
  }, [id]);

  const handleAction = async (action, commentText = '', newReviewer = null) => {
    try {
      await mergeRequestAPI.executeAction(id, action, commentText || comment, newReviewer);
      const response = await mergeRequestAPI.getById(id);
      setMr(response.data);
      setShowCommentModal(false);
      setShowReassignModal(false);
      setComment('');
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
    }
  };

  const isReviewer = mr && (mr.reviewer_id === user.id || hasPermission(['admin']));
  const isAuthor = mr && mr.author_id === user.id;

  if (!mr) {
    return <div>加载中...</div>;
  }

  const availableActions = mr.available_actions || [];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button
          style={styles.backButton}
          onClick={() => navigate('/merge-requests')}
        >
          ← 返回列表
        </button>
      </div>

      {mr.is_locked && mr.locked_by !== user.id && (
        <div style={styles.lockedWarning}>
          🔒 此合并请求已被 {mr.reviewer_name || '其他用户'} 锁定，正在审查中
        </div>
      )}

      <div style={styles.mrHeader}>
        <div style={styles.mrTitle}>
          <span>🔀</span>
          {mr.title}
          <span style={styles.statusBadge(mr.status)}>
            {getStatusLabel(mr.status)}
          </span>
          {mr.is_locked && <span>🔒</span>}
        </div>
        <div style={styles.mrMeta}>
          <div style={styles.metaItem}>
            <span>📋</span>
            <span>{mr.main_order_no}</span>
          </div>
          <div style={styles.metaItem}>
            <span>🏠</span>
            <span>{mr.repository_name}</span>
          </div>
          <div style={styles.metaItem}>
            <span>🌿</span>
            <span>{mr.source_branch_name} → {mr.target_branch_name}</span>
          </div>
          <div style={styles.metaItem}>
            <span>👤</span>
            <span>作者: {mr.author_name}</span>
          </div>
          {mr.reviewer_name && (
            <div style={styles.metaItem}>
              <span>👁️</span>
              <span>审查者: {mr.reviewer_name}</span>
            </div>
          )}
        </div>
        {mr.description && (
          <div style={{ marginTop: '16px', color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
            {mr.description}
          </div>
        )}
      </div>

      {availableActions.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>可用操作</h3>
          <div style={styles.actionsBar}>
            {availableActions.map((action, index) => {
              if (action.disabled) return null;
              switch (action.action) {
                case 'start_review':
                  return (
                    <button
                      key={index}
                      style={styles.actionButtonInfo}
                      onClick={() => handleAction('start_review')}
                    >
                      📝 {action.label}
                    </button>
                  );
                case 'approve':
                  return (
                    <button
                      key={index}
                      style={styles.actionButtonPrimary}
                      onClick={() => handleAction('approve')}
                    >
                      ✅ {action.label}
                    </button>
                  );
                case 'request_changes':
                  return (
                    <button
                      key={index}
                      style={{ ...styles.actionButtonDanger, backgroundColor: '#ffc107', color: '#212529' }}
                      onClick={() => setShowCommentModal(true)}
                    >
                      ⚠️ {action.label}
                    </button>
                  );
                case 'comment':
                  return (
                    <button
                      key={index}
                      style={styles.actionButton}
                      onClick={() => setShowCommentModal(true)}
                    >
                      💬 {action.label}
                    </button>
                  );
                case 'reassign':
                  return (
                    <button
                      key={index}
                      style={styles.actionButton}
                      onClick={() => setShowReassignModal(true)}
                    >
                      🔄 {action.label}
                    </button>
                  );
                case 'push_changes':
                  return (
                    <button
                      key={index}
                      style={styles.actionButtonInfo}
                      onClick={() => handleAction('push_changes')}
                    >
                      📤 {action.label}
                    </button>
                  );
                case 'close':
                  return (
                    <button
                      key={index}
                      style={styles.actionButtonDanger}
                      onClick={() => handleAction('close')}
                    >
                      ❌ {action.label}
                    </button>
                  );
                case 'merge':
                  return (
                    <button
                      key={index}
                      style={{ ...styles.actionButtonPrimary, backgroundColor: '#6f42c1' }}
                      onClick={() => handleAction('merge')}
                    >
                      🔀 {action.label}
                    </button>
                  );
                default:
                  return (
                    <button
                      key={index}
                      style={styles.actionButton}
                    >
                      {action.label}
                    </button>
                  );
              }
            })}
          </div>
        </div>
      )}

      <div style={styles.tabs}>
        <div
          style={styles.tab(activeTab === 'history')}
          onClick={() => setActiveTab('history')}
        >
          📜 时间线
        </div>
        <div
          style={styles.tab(activeTab === 'commits')}
          onClick={() => setActiveTab('commits')}
        >
          💻 提交 ({mr.commits?.length || 0})
        </div>
        <div
          style={styles.tab(activeTab === 'pipelines')}
          onClick={() => setActiveTab('pipelines')}
        >
          🚀 流水线 ({mr.pipelines?.length || 0})
        </div>
      </div>

      {activeTab === 'history' && (
        <div style={styles.section}>
          {mr.history?.map((item, index) => (
            <div key={index} style={styles.historyItem}>
              <div style={styles.historyIcon}>
                {item.action === 'CREATE' ? '➕' :
                 item.action === 'START_REVIEW' ? '📝' :
                 item.action === 'APPROVE' ? '✅' :
                 item.action === 'REQUEST_CHANGES' ? '⚠️' :
                 item.action === 'COMMENT' ? '💬' :
                 item.action === 'MERGE' ? '🔀' :
                 item.action === 'CLOSE' ? '❌' : '📝'}
              </div>
              <div style={styles.historyContent}>
                <div style={styles.historyAction}>
                  <span style={styles.historyActor}>{item.actor_name}</span>
                  {' '}执行了 {item.action}
                </div>
                <div style={styles.historyTime}>
                  {new Date(item.created_at * 1000).toLocaleString()}
                </div>
                {item.comment && (
                  <div style={styles.historyComment}>{item.comment}</div>
                )}
              </div>
            </div>
          ))}
          {(!mr.history || mr.history.length === 0) && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              暂无历史记录
            </div>
          )}
        </div>
      )}

      {activeTab === 'commits' && (
        <div style={styles.section}>
          <div style={styles.commitList}>
            {mr.commits?.map((commit, index) => (
              <div key={index} style={styles.commitItem}>
                <span style={styles.commitHash}>
                  {commit.commit_hash?.substring(0, 8)}
                </span>
                <span style={styles.commitMessage}>{commit.message}</span>
                <span style={styles.commitMeta}>
                  {commit.author_name} • {new Date(commit.created_at * 1000).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          {(!mr.commits || mr.commits.length === 0) && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              暂无提交记录
            </div>
          )}
        </div>
      )}

      {activeTab === 'pipelines' && (
        <div style={styles.section}>
          {mr.pipelines?.map((pipeline, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              marginBottom: '8px',
              gap: '12px',
            }}>
              <span style={styles.statusBadge(pipeline.status)}>
                {pipeline.status === 'success' ? '✅' :
                 pipeline.status === 'failed' ? '❌' :
                 pipeline.status === 'running' ? '⏳' : '⏸️'}
                {' '}{pipeline.status}
              </span>
              <span style={{ fontSize: '14px' }}>阶段: {pipeline.stage}</span>
              <span style={{ fontSize: '12px', color: '#666' }}>
                {new Date(pipeline.created_at * 1000).toLocaleString()}
              </span>
            </div>
          ))}
          {(!mr.pipelines || mr.pipelines.length === 0) && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              暂无流水线记录
            </div>
          )}
        </div>
      )}

      {showCommentModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>添加评论</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>评论内容 *</label>
              <textarea
                style={styles.textarea}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="请输入评论内容"
                required
              />
            </div>
            <div style={styles.modalActions}>
              <button
                style={styles.cancelButton}
                onClick={() => {
                  setShowCommentModal(false);
                  setComment('');
                }}
              >
                取消
              </button>
              <button
                style={styles.submitButton}
                onClick={() => {
                  if (mr.status === 'in_review') {
                    handleAction('request_changes', comment);
                  } else {
                    handleAction('comment', comment);
                  }
                }}
              >
                提交
              </button>
            </div>
          </div>
        </div>
      )}

      {showReassignModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>转派审查</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>新审查者</label>
              <select
                style={styles.select}
                value={newReviewerId}
                onChange={(e) => setNewReviewerId(e.target.value)}
              >
                <option value="">请选择</option>
                <option value="reviewer">reviewer</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div style={styles.modalActions}>
              <button
                style={styles.cancelButton}
                onClick={() => {
                  setShowReassignModal(false);
                  setNewReviewerId('');
                }}
              >
                取消
              </button>
              <button
                style={styles.submitButton}
                onClick={() => handleAction('reassign', '', newReviewerId)}
              >
                转派
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MergeRequestDetail;
