import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import dayjs from 'dayjs';

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meeting_date: dayjs().format('YYYY-MM-DD'),
    content: ''
  });
  const [errors, setErrors] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadMeetings();
  }, [filterStatus, search]);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;
      
      const res = await api.get('/meetings', { params });
      setMeetings(res.data);
    } catch (error) {
        console.error('加载会议失败:', error);
      } finally {
        setLoading(false);
      }
    };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    try {
      await api.post('/meetings', formData);
      setShowModal(false);
      setFormData({ title: '', description: '', meeting_date: dayjs().format('YYYY-MM-DD'), content: '' });
      loadMeetings();
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>会议管理</h1>
        <button onClick={() => setShowModal(true)} style={styles.primaryBtn}>
          + 新建会议
        </button>
      </div>

      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="搜索会议标题..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">全部状态</option>
          <option value="active">进行中</option>
          <option value="completed">已完成</option>
          <option value="deleted">已删除</option>
        </select>
      </div>

      {loading ? (
        <div style={styles.loading}>加载中...</div>
      ) : meetings.length === 0 ? (
        <div style={styles.empty}>暂无会议记录，点击"新建会议"开始</div>
      ) : (
        <div style={styles.meetingGrid}>
          {meetings.map(meeting => (
            <div
              key={meeting.id}
              onClick={() => navigate(`/meetings/${meeting.id}`)}
              style={styles.meetingCard}
            >
              <div style={styles.cardTop}>
                <h3 style={styles.meetingTitle}>{meeting.title}</h3>
                <span style={{
                  ...styles.statusTag,
                  ...(meeting.status === 'active' ? styles.statusActive : styles.statusCompleted)
                }}>
                  {meeting.status === 'active' ? '进行中' : '已完成'}
                </span>
              </div>
              {meeting.description && (
                <p style={styles.description}>{meeting.description}</p>
              )}
              <div style={styles.meta}>
                <span>📅 {dayjs(meeting.meeting_date).format('YYYY-MM-DD')}</span>
                <span>👤 {meeting.organizer_name || '待定'}</span>
                <span>📋 {meeting.action_item_count || 0} 项</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>新建会议</h2>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>×</button>
            </div>

            {errors.length > 0 && (
              <div style={styles.errorBox}>
                {errors.map((err, i) => <div key={i}>⚠️ {err}</div>)}
              </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>会议标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  style={styles.input}
                  placeholder="请输入会议标题"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>会议日期 *</label>
                <input
                  type="date"
                  value={formData.meeting_date}
                  onChange={(e) => setFormData({...formData, meeting_date: e.target.value})}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>会议描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  style={styles.textarea}
                  placeholder="简要描述会议内容"
                  rows={3}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>会议纪要</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  style={styles.textarea}
                  placeholder="详细会议纪要内容"
                  rows={6}
                />
              </div>
              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>
                  取消
                </button>
                <button type="submit" style={styles.primaryBtn}>
                  创建会议
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle: { fontSize: 24, margin: 0, color: '#262626' },
  primaryBtn: {
    padding: '10px 20px',
    backgroundColor: '#1890ff',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14
  },
  filterBar: { display: 'flex', gap: 12, marginBottom: 20 },
  searchInput: {
    flex: 1,
    padding: '10px 16px',
    border: '1px solid #d9d9d9',
    borderRadius: 6,
    fontSize: 14
  },
  filterSelect: {
    padding: '10px 16px',
    border: '1px solid #d9d9d9',
    borderRadius: 6,
    fontSize: 14,
    minWidth: 140
  },
  loading: { textAlign: 'center', padding: 40, color: '#999' },
  empty: { textAlign: 'center', padding: 60, backgroundColor: '#fff', borderRadius: 8, color: '#999' },
  meetingGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 },
  meetingCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.2s'
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  meetingTitle: { fontSize: 16, margin: 0, flex: 1, color: '#262626' },
  statusTag: { padding: '2px 8px', borderRadius: 4, fontSize: 12 },
  statusActive: { backgroundColor: '#e6f7ff', color: '#1890ff' },
  statusCompleted: { backgroundColor: '#f6ffed', color: '#52c41a' },
  description: { fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.6 },
  meta: { display: 'flex', gap: 16, fontSize: 12, color: '#8c8c8c' },
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
  modal: { backgroundColor: '#fff', borderRadius: 8, width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottom: '1px solid #f0f0f0' },
  modalTitle: { margin: 0, fontSize: 18 },
  closeBtn: { border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#999' },
  errorBox: { margin: 20, padding: 12, backgroundColor: '#fff1f0', color: '#f5222d', borderRadius: 6, fontSize: 13 },
  form: { padding: 20, display: 'flex', flexDirection: 'column', gap: 16 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 14, fontWeight: 500, color: '#333' },
  input: { padding: '10px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14 },
  textarea: { padding: '10px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, resize: 'vertical' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { padding: '10px 20px', border: '1px solid #d9d9d9', borderRadius: 6, backgroundColor: '#fff', cursor: 'pointer', fontSize: 14 }
};
