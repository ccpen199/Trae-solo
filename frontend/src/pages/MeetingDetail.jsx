import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import dayjs from 'dayjs';

export default function MeetingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transcript');
  const [showActionModal, setShowActionModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [actionForm, setActionForm] = useState({
    title: '',
    description: '',
    assignee_id: '',
    due_date: '',
    priority: 'medium'
  });
  const [errors, setErrors] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState([]);

  useEffect(() => {
    loadMeeting();
    loadUsers();
  }, [id]);

  const loadMeeting = async () => {
    try {
      const res = await api.get(`/meetings/${id}`);
      setMeeting(res.data);
      setTranscript(res.data.content || '');
      setExtractedItems([]);
    } catch (error) {
      console.error('加载会议详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTranscript = async () => {
    try {
      await api.put(`/meetings/${id}`, { content: transcript });
      alert('会议纪要已保存');
      loadMeeting();
    } catch (error) {
      alert('保存失败');
    }
  };

  const handleExtractActionItems = async () => {
    if (!transcript.trim()) {
      alert('请先输入会议纪要内容');
      return;
    }
    try {
      setExtracting(true);
      const res = await api.post('/meetings/extract-actions', {
        meeting_id: id,
        content: transcript
      });
      setExtractedItems(res.data.items);
    } catch (error) {
      alert('提取失败');
    } finally {
      setExtracting(false);
    }
  };

  const handleConfirmExtracted = async (item) => {
    try {
      await api.post('/action-items', {
        meeting_id: id,
        title: item.title,
        description: item.description,
        assignee_id: item.assignee_id,
        due_date: item.due_date,
        priority: item.priority
      });
      setExtractedItems(prev => prev.filter(i => i !== item));
      loadMeeting();
    } catch (error) {
      alert('创建失败');
    }
  };

  const handleConfirmAllExtracted = async () => {
    try {
      for (const item of extractedItems) {
        await api.post('/action-items', {
          meeting_id: id,
          title: item.title,
          description: item.description,
          assignee_id: item.assignee_id,
          due_date: item.due_date,
          priority: item.priority
        });
      }
      setExtractedItems([]);
      loadMeeting();
      alert('已全部添加到行动项');
    } catch (error) {
      alert('部分创建失败');
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

  const handleCreateAction = async (e) => {
    e.preventDefault();
    setErrors([]);

    try {
      await api.post('/action-items', { ...actionForm, meeting_id: id });
      setShowActionModal(false);
      setActionForm({ title: '', description: '', assignee_id: '', due_date: '', priority: 'medium' });
      loadMeeting();
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  if (loading) {
    return <div style={styles.loading}>加载中...</div>;
  }

  if (!meeting) {
    return <div style={styles.error}>会议不存在</div>;
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <button onClick={() => navigate('/meetings')} style={styles.backBtn}>
            ← 返回列表
          </button>
          <h1 style={styles.pageTitle}>{meeting.title}</h1>
        </div>
        <button onClick={() => setShowActionModal(true)} style={styles.primaryBtn}>
          + 添加行动项
        </button>
      </div>

      <div style={styles.tabs}>
        {['transcript', 'info', 'action-items', 'timeline'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tabBtn,
              ...(activeTab === tab ? styles.tabActive : {})
            }}
          >
            {tab === 'transcript' ? '📝 会议纪要' : 
             tab === 'info' ? '会议信息' : 
             tab === 'action-items' ? '行动项列表' : '变更历史'}
          </button>
        ))}
      </div>

      {activeTab === 'transcript' && (
        <div style={styles.card}>
          <div style={styles.transcriptHeader}>
            <h3 style={styles.sectionTitle}>会议纪要原文</h3>
            <div style={styles.transcriptActions}>
              <button onClick={handleSaveTranscript} style={styles.secondaryBtn}>
                💾 保存纪要
              </button>
              <button 
                onClick={handleExtractActionItems} 
                style={styles.primaryBtn}
                disabled={extracting}
              >
                {extracting ? '⏳ 提取中...' : '🤖 AI提取行动项'}
              </button>
            </div>
          </div>
          
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            style={styles.transcriptTextarea}
            placeholder="在此输入或粘贴会议纪要原文...

示例：
会议时间：2026年5月20日
参会人员：张三、李四

1. 张三负责完成Q2产品需求文档，5月30日前完成
2. 李四进行技术选型调研，输出对比报告
3. 下周五前完成架构设计评审"
            rows={15}
          />

          {extractedItems.length > 0 && (
            <div style={styles.extractedSection}>
              <div style={styles.extractedHeader}>
                <h4 style={styles.extractedTitle}>
                  ✨ AI提取到 {extractedItems.length} 个行动项
                </h4>
                <button onClick={handleConfirmAllExtracted} style={styles.primaryBtn}>
                  全部添加到行动项
                </button>
              </div>
              <div style={styles.extractedList}>
                {extractedItems.map((item, index) => (
                  <div key={index} style={styles.extractedItem}>
                    <div style={styles.extractedInfo}>
                      <div style={styles.extractedTitle}>{item.title}</div>
                      <div style={styles.extractedMeta}>
                        <span>👤 {item.assignee_name || '待分配'}</span>
                        <span>📅 {item.due_date || '待定'}</span>
                        <span>⭐ {item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}</span>
                      </div>
                      {item.description && (
                        <div style={styles.extractedDesc}>{item.description}</div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleConfirmExtracted(item)} 
                      style={styles.smallBtn}
                    >
                      ✓ 添加
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'info' && (
        <div style={styles.card}>
          <div style={styles.infoRow}>
            <span style={styles.label}>会议日期：</span>
            <span>{dayjs(meeting.meeting_date).format('YYYY-MM-DD')}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.label}>组织者：</span>
            <span>{meeting.organizer_name || '待定'}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.label}>状态：</span>
            <span style={{
              ...styles.statusTag,
              ...(meeting.status === 'active' ? styles.statusActive : styles.statusCompleted)
            }}>
              {meeting.status === 'active' ? '进行中' : '已完成'}
            </span>
          </div>
          {meeting.description && (
            <div style={styles.infoSection}>
              <div style={styles.label}>会议描述：</div>
              <div style={styles.description}>{meeting.description}</div>
            </div>
          )}
          {meeting.content && (
            <div style={styles.infoSection}>
              <div style={styles.label}>会议纪要：</div>
              <div style={styles.content}>{meeting.content}</div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'action-items' && (
        <div>
          {!meeting.action_items || meeting.action_items.length === 0 ? (
            <div style={styles.empty}>暂无行动项，点击右上角"添加行动项"开始</div>
          ) : (
            <div style={styles.actionList}>
              {meeting.action_items.map(item => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/action-items/${item.id}`)}
                  style={styles.actionItem}
                >
                  <div style={styles.actionHeader}>
                    <span style={styles.actionTitle}>{item.title}</span>
                    <span style={{
                      ...styles.statusTag,
                      ...getStatusStyle(item.status)
                    }}>
                      {getStatusText(item.status)}
                    </span>
                  </div>
                  <div style={styles.actionMeta}>
                    <span>👤 {item.assignee_name || '未分配'}</span>
                    <span>📅 截止: {item.due_date || '未设置'}</span>
                    <span>⭐ {item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div style={styles.card}>
          {!meeting.audit_logs || meeting.audit_logs.length === 0 ? (
            <div style={styles.empty}>暂无变更记录</div>
          ) : (
            <div style={styles.timeline}>
              {meeting.audit_logs.map((log, index) => (
                <div key={log.id} style={styles.timelineItem}>
                  <div style={styles.timelineDot}></div>
                  {index < meeting.audit_logs.length - 1 && <div style={styles.timelineLine}></div>}
                  <div style={styles.timelineContent}>
                    <div style={styles.timelineHeader}>
                      <span style={styles.timelineAction}>
                        {log.action_type === 'create' ? '创建' : log.action_type === 'update' ? '更新' : '删除'}
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

      {showActionModal && (
        <div style={styles.modalOverlay} onClick={() => setShowActionModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>添加行动项</h2>
              <button onClick={() => setShowActionModal(false)} style={styles.closeBtn}>×</button>
            </div>

            {errors.length > 0 && (
              <div style={styles.errorBox}>
                {errors.map((err, i) => <div key={i}>⚠️ {err}</div>)}
              </div>
            )}

            <form onSubmit={handleCreateAction} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>行动项标题 *</label>
                <input
                  type="text"
                  value={actionForm.title}
                  onChange={(e) => setActionForm({...actionForm, title: e.target.value})}
                  style={styles.input}
                  placeholder="请输入行动项标题"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>负责人</label>
                <select
                  value={actionForm.assignee_id}
                  onChange={(e) => setActionForm({...actionForm, assignee_id: e.target.value})}
                  style={styles.input}
                >
                  <option value="">请选择负责人</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.department || '-'})</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>截止日期</label>
                <input
                  type="date"
                  value={actionForm.due_date}
                  onChange={(e) => setActionForm({...actionForm, due_date: e.target.value})}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>优先级</label>
                <select
                  value={actionForm.priority}
                  onChange={(e) => setActionForm({...actionForm, priority: e.target.value})}
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
                  value={actionForm.description}
                  onChange={(e) => setActionForm({...actionForm, description: e.target.value})}
                  style={styles.textarea}
                  rows={4}
                  placeholder="详细描述行动项内容"
                />
              </div>
              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setShowActionModal(false)} style={styles.cancelBtn}>
                  取消
                </button>
                <button type="submit" style={styles.primaryBtn}>
                  创建
                </button>
              </div>
            </form>
          </div>
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

const styles = {
  loading: { textAlign: 'center', padding: 40, color: '#999' },
  error: { textAlign: 'center', padding: 40, color: '#f5222d' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  backBtn: { border: 'none', background: 'none', color: '#1890ff', cursor: 'pointer', marginBottom: 8, padding: 0 },
  pageTitle: { fontSize: 24, margin: 0, color: '#262626' },
  primaryBtn: { padding: '10px 20px', backgroundColor: '#1890ff', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 },
  secondaryBtn: { padding: '10px 20px', backgroundColor: '#fff', color: '#1890ff', border: '1px solid #d9d9d9', borderRadius: 6, cursor: 'pointer', fontSize: 14 },
  tabs: { display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e8e8e8' },
  tabBtn: { padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#666' },
  tabActive: { color: '#1890ff', borderBottom: '2px solid #1890ff' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  infoRow: { display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' },
  label: { fontSize: 14, color: '#8c8c8c', minWidth: 80 },
  statusTag: { padding: '2px 8px', borderRadius: 4, fontSize: 12 },
  statusActive: { backgroundColor: '#e6f7ff', color: '#1890ff' },
  statusCompleted: { backgroundColor: '#f6ffed', color: '#52c41a' },
  infoSection: { marginTop: 20 },
  description: { marginTop: 8, padding: 12, backgroundColor: '#fafafa', borderRadius: 6, lineHeight: 1.8 },
  content: { marginTop: 8, padding: 16, backgroundColor: '#fafafa', borderRadius: 6, lineHeight: 1.8, whiteSpace: 'pre-wrap' },
  empty: { textAlign: 'center', padding: 40, color: '#999', backgroundColor: '#fff', borderRadius: 8 },
  actionList: { display: 'flex', flexDirection: 'column', gap: 12 },
  actionItem: { backgroundColor: '#fff', borderRadius: 8, padding: 16, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  actionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  actionTitle: { fontSize: 15, fontWeight: 500, color: '#262626' },
  actionMeta: { display: 'flex', gap: 20, fontSize: 12, color: '#8c8c8c' },
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
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#fff', borderRadius: 8, width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottom: '1px solid #f0f0f0' },
  modalTitle: { margin: 0, fontSize: 18 },
  closeBtn: { border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#999' },
  errorBox: { margin: 20, padding: 12, backgroundColor: '#fff1f0', color: '#f5222d', borderRadius: 6, fontSize: 13 },
  form: { padding: 20, display: 'flex', flexDirection: 'column', gap: 16 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  input: { padding: '10px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14 },
  textarea: { padding: '10px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, resize: 'vertical' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { padding: '10px 20px', border: '1px solid #d9d9d9', borderRadius: 6, backgroundColor: '#fff', cursor: 'pointer', fontSize: 14 },
  transcriptHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { margin: 0, fontSize: 16, color: '#262626' },
  transcriptActions: { display: 'flex', gap: 12 },
  transcriptTextarea: { width: '100%', padding: 16, border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, lineHeight: 1.8, resize: 'vertical', minHeight: 300, fontFamily: 'inherit', boxSizing: 'border-box' },
  extractedSection: { marginTop: 24, paddingTop: 20, borderTop: '1px solid #e8e8e8' },
  extractedHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  extractedTitle: { margin: 0, fontSize: 15, color: '#262626' },
  extractedList: { display: 'flex', flexDirection: 'column', gap: 12 },
  extractedItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, backgroundColor: '#f6ffed', borderRadius: 6, border: '1px solid #b7eb8f' },
  extractedInfo: { flex: 1, marginRight: 16 },
  extractedMeta: { display: 'flex', gap: 16, fontSize: 12, color: '#52c41a', marginTop: 4 },
  extractedDesc: { fontSize: 13, color: '#666', marginTop: 8 },
  smallBtn: { padding: '6px 16px', backgroundColor: '#52c41a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }
};
