import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import dayjs from 'dayjs';

export default function ActionItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [users, setUsers] = useState([]);
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    loadData();
    loadUsers();
  }, [id]);

  const loadData = async () => {
    try {
      const res = await api.get(`/action-items/${id}`);
      setItem(res.data);
      setEditForm({
        title: res.data.title,
        description: res.data.description,
        assignee_id: res.data.assignee_id,
        due_date: res.data.due_date,
        priority: res.data.priority,
        status: res.data.status
      });
    } catch (error) {
      console.error('加载行动项失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      console.error('加载用户失败:', error);
    }
  };

  const handleSave = async () => {
    setErrors([]);
    try {
      await api.put(`/action-items/${id}`, editForm);
      setEditMode(false);
      loadData();
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      await api.post(`/action-items/${id}/comments`, { content: comment });
      setComment('');
      loadData();
    } catch (error) {
      console.error('添加评论失败:', error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/action-items/${id}`, { status: newStatus });
      loadData();
    } catch (error) {
      console.error('更新状态失败:', error);
    }
  };

  if (loading) {
    return <div style={styles.loading}>加载中...</div>;
  }

  if (!item) {
    return <div style={styles.error}>行动项不存在</div>;
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <button onClick={() => navigate('/action-items')} style={styles.backBtn}>
            ← 返回列表
          </button>
          <h1 style={styles.pageTitle}>{item.title}</h1>
        </div>
        <div style={styles.headerActions}>
          {!editMode ? (
            <button onClick={() => setEditMode(true)} style={styles.primaryBtn}>
              编辑
            </button>
          ) : (
            <>
              <button onClick={() => setEditMode(false)} style={styles.cancelBtn}>
                取消
              </button>
              <button onClick={handleSave} style={styles.primaryBtn}>
                保存
              </button>
            </>
          )}
        </div>
      </div>

      {!editMode && (
        <div style={styles.statusBar}>
          <span style={styles.statusLabel}>状态：</span>
          {['pending', 'in_progress', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              style={{
                ...styles.statusButton,
                ...(item.status === status ? getStatusStyle(status) : {})
              }}
            >
              {getStatusText(status)}
            </button>
          ))}
        </div>
      )}

      <div style={styles.tabs}>
        {['info', 'comments', 'timeline', 'reminders'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tabBtn,
              ...(activeTab === tab ? styles.tabActive : {})
            }}
          >
            {tab === 'info' ? '基本信息' : 
             tab === 'comments' ? '评论讨论' :
             tab === 'timeline' ? '变更历史' : '提醒记录'}
          </button>
        ))}
      </div>

      {errors.length > 0 && (
        <div style={styles.errorBox}>
          {errors.map((err, i) => <div key={i}>⚠️ {err}</div>)}
        </div>
      )}

      {activeTab === 'info' && (
        <div style={styles.card}>
          {editMode ? (
            <div style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>行动项标题 *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>负责人</label>
                <select
                  value={editForm.assignee_id || ''}
                  onChange={(e) => setEditForm({...editForm, assignee_id: e.target.value})}
                  style={styles.input}
                >
                  <option value="">未分配</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>截止日期</label>
                <input
                  type="date"
                  value={editForm.due_date || ''}
                  onChange={(e) => setEditForm({...editForm, due_date: e.target.value})}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>优先级</label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                  style={styles.input}
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>描述</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  style={styles.textarea}
                  rows={6}
                />
              </div>
            </div>
          ) : (
            <>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.label}>负责人：</span>
                  <span>{item.assignee_name || '未分配'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.label}>截止日期：</span>
                  <span>{item.due_date ? dayjs(item.due_date).format('YYYY-MM-DD') : '未设置'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.label}>优先级：</span>
                  <span style={{
                    ...styles.priorityTag,
                    ...getPriorityStyle(item.priority)
                  }}>
                    {item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}
                  </span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.label}>状态：</span>
                  <span style={{
                    ...styles.statusTag,
                    ...getStatusStyle(item.status)
                  }}>
                    {getStatusText(item.status)}
                  </span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.label}>关联会议：</span>
                  <span style={{color: '#1890ff', cursor: 'pointer'}} onClick={() => navigate(`/meetings/${item.meeting_id}`)}>
                    {item.meeting_title || '-'}
                  </span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.label}>创建时间：</span>
                  <span>{dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}</span>
                </div>
              </div>
              {item.description && (
                <div style={styles.descriptionSection}>
                  <div style={styles.label}>详细描述：</div>
                  <div style={styles.description}>{item.description}</div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'comments' && (
        <div style={styles.card}>
          <div style={styles.commentInput}>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="添加评论..."
              style={styles.commentTextarea}
              rows={3}
            />
            <button onClick={handleAddComment} style={styles.commentBtn}>
              发表
            </button>
          </div>
          <div style={styles.commentList}>
            {!item.comments || item.comments.length === 0 ? (
              <div style={styles.empty}>暂无评论</div>
            ) : (
              item.comments.map(c => (
                <div key={c.id} style={styles.comment}>
                  <div style={styles.commentHeader}>
                    <span style={styles.commentUser}>{c.user_name}</span>
                    <span style={styles.commentTime}>{dayjs(c.created_at).format('YYYY-MM-DD HH:mm')}</span>
                  </div>
                  <div style={styles.commentContent}>{c.content}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div style={styles.card}>
          {!item.audit_logs || item.audit_logs.length === 0 ? (
            <div style={styles.empty}>暂无变更记录</div>
          ) : (
            <div style={styles.timeline}>
              {item.audit_logs.map((log, index) => (
                <div key={log.id} style={styles.timelineItem}>
                  <div style={styles.timelineDot}></div>
                  {index < item.audit_logs.length - 1 && <div style={styles.timelineLine}></div>}
                  <div style={styles.timelineContent}>
                    <div style={styles.timelineHeader}>
                      <span style={styles.timelineAction}>
                        {log.action_type === 'create' ? '创建' : 
                         log.action_type === 'update' ? '更新' :
                         log.action_type.startsWith('batch_') ? '批量更新' : '删除'}
                      </span>
                      <span style={styles.timelineOperator}>{log.operator_name}</span>
                      <span style={styles.timelineTime}>{dayjs(log.created_at).format('YYYY-MM-DD HH:mm')}</span>
                    </div>
                    {log.reason && <div style={styles.timelineReason}>原因：{log.reason}</div>}
                    {log.recovery_path && <div style={styles.timelineRecovery}>恢复路径：{log.recovery_path}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reminders' && (
        <div style={styles.card}>
          {!item.reminders || item.reminders.length === 0 ? (
            <div style={styles.empty}>暂无提醒记录</div>
          ) : (
            <div style={styles.reminderList}>
              {item.reminders.map(r => (
                <div key={r.id} style={styles.reminderItem}>
                  <div>
                    <div style={styles.reminderType}>
                      {r.reminder_type === 'due_soon' ? '即将到期提醒' : '逾期提醒'}
                    </div>
                    <div style={styles.reminderTime}>
                      计划：{dayjs(r.scheduled_at).format('YYYY-MM-DD HH:mm')}
                      {r.sent_at && ` · 已发送：${dayjs(r.sent_at).format('YYYY-MM-DD HH:mm')}`}
                    </div>
                  </div>
                  <span style={{
                    ...styles.statusTag,
                    ...(r.status === 'sent' ? { backgroundColor: '#f6ffed', color: '#52c41a' } : { backgroundColor: '#fff7e6', color: '#fa8c16' })
                  }}>
                    {r.status === 'sent' ? '已发送' : '待发送'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getStatusStyle(status) {
  switch (status) {
    case 'completed': return { backgroundColor: '#f6ffed', color: '#52c41a' };
    case 'in_progress': return { backgroundColor: '#e6f7ff', color: '#1890ff' };
    case 'cancelled': return { backgroundColor: '#f5f5f5', color: '#8c8c8c' };
    default: return { backgroundColor: '#fff7e6', color: '#fa8c16' };
  }
}

function getStatusText(status) {
  switch (status) {
    case 'completed': return '已完成';
    case 'in_progress': return '进行中';
    case 'cancelled': return '已取消';
    default: return '待处理';
  }
}

function getPriorityStyle(priority) {
  switch (priority) {
    case 'high': return { backgroundColor: '#fff1f0', color: '#f5222d' };
    case 'medium': return { backgroundColor: '#fff7e6', color: '#fa8c16' };
    default: return { backgroundColor: '#f6ffed', color: '#52c41a' };
  }
}

const styles = {
  loading: { textAlign: 'center', padding: 40, color: '#999' },
  error: { textAlign: 'center', padding: 40, color: '#f5222d' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  backBtn: { border: 'none', background: 'none', color: '#1890ff', cursor: 'pointer', marginBottom: 8, padding: 0 },
  pageTitle: { fontSize: 24, margin: 0, color: '#262626' },
  headerActions: { display: 'flex', gap: 12 },
  primaryBtn: { padding: '10px 20px', backgroundColor: '#1890ff', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 },
  cancelBtn: { padding: '10px 20px', border: '1px solid #d9d9d9', borderRadius: 6, backgroundColor: '#fff', cursor: 'pointer', fontSize: 14 },
  statusBar: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, padding: 16, backgroundColor: '#fff', borderRadius: 8 },
  statusLabel: { fontSize: 14, color: '#666' },
  statusButton: { padding: '6px 16px', border: '1px solid #d9d9d9', borderRadius: 4, backgroundColor: '#fff', cursor: 'pointer', fontSize: 13 },
  tabs: { display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e8e8e8' },
  tabBtn: { padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#666' },
  tabActive: { color: '#1890ff', borderBottom: '2px solid #1890ff' },
  errorBox: { marginBottom: 20, padding: 12, backgroundColor: '#fff1f0', color: '#f5222d', borderRadius: 6, fontSize: 13 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 14, color: '#8c8c8c' },
  input: { padding: '10px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14 },
  textarea: { padding: '10px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, resize: 'vertical' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 },
  infoItem: { display: 'flex', alignItems: 'center', gap: 8 },
  statusTag: { padding: '2px 8px', borderRadius: 4, fontSize: 12 },
  priorityTag: { padding: '2px 8px', borderRadius: 4, fontSize: 12 },
  descriptionSection: { marginTop: 24, paddingTop: 20, borderTop: '1px solid #f0f0f0' },
  description: { marginTop: 8, padding: 16, backgroundColor: '#fafafa', borderRadius: 6, lineHeight: 1.8 },
  commentInput: { marginBottom: 20 },
  commentTextarea: { width: '100%', padding: 12, border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, marginBottom: 12, boxSizing: 'border-box' },
  commentBtn: { padding: '8px 20px', backgroundColor: '#1890ff', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  commentList: { display: 'flex', flexDirection: 'column', gap: 16 },
  empty: { textAlign: 'center', padding: 40, color: '#999' },
  comment: { padding: 16, backgroundColor: '#fafafa', borderRadius: 6 },
  commentHeader: { display: 'flex', gap: 12, marginBottom: 8 },
  commentUser: { fontWeight: 500, color: '#262626' },
  commentTime: { color: '#8c8c8c', fontSize: 12 },
  commentContent: { fontSize: 14, color: '#333', lineHeight: 1.6 },
  timeline: { position: 'relative' },
  timelineItem: { position: 'relative', paddingLeft: 28, paddingBottom: 24 },
  timelineDot: { position: 'absolute', left: 0, top: 4, width: 12, height: 12, borderRadius: '50%', backgroundColor: '#1890ff' },
  timelineLine: { position: 'absolute', left: 5, top: 16, width: 2, height: 'calc(100% - 8px)', backgroundColor: '#e8e8e8' },
  timelineContent: { backgroundColor: '#fafafa', padding: 12, borderRadius: 6 },
  timelineHeader: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 },
  timelineAction: { fontWeight: 500, color: '#262626' },
  timelineOperator: { color: '#1890ff', fontSize: 13 },
  timelineTime: { color: '#8c8c8c', fontSize: 12 },
  timelineReason: { fontSize: 13, color: '#666', marginBottom: 4 },
  timelineRecovery: { fontSize: 12, color: '#52c41a' },
  reminderList: { display: 'flex', flexDirection: 'column', gap: 12 },
  reminderItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#fafafa', borderRadius: 6 },
  reminderType: { fontSize: 14, fontWeight: 500, color: '#262626', marginBottom: 4 },
  reminderTime: { fontSize: 12, color: '#8c8c8c' }
};
