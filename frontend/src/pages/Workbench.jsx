import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import dayjs from 'dayjs';

export default function Workbench() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const res = await api.get('/action-items/workbench/issues');
      setIssues(res.data);
    } catch (error) {
      console.error('加载问题失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = filterType
    ? issues.filter(i => i.issue_type === filterType)
    : issues;

  const issueTypes = [
    { value: 'wrong_assignee', label: '负责人错误', icon: '👤', color: '#fa8c16' },
    { value: 'missing_due_date', label: '截止时间缺失', icon: '📅', color: '#f5222d' },
    { value: 'duplicate', label: '任务重复', icon: '🔄', color: '#eb2f96' },
    { value: 'reminder_failed', label: '提醒失败', icon: '🔔', color: '#722ed1' }
  ];

  const handleResetData = async () => {
    if (!confirm('确定要重置所有示例数据吗？这将清空现有数据并重新生成。')) {
      return;
    }
    try {
      await api.post('/reset-sample-data');
      alert('数据已重置');
      loadIssues();
    } catch (error) {
      alert('重置数据失败');
    }
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>问题工作台</h1>
        <div style={styles.headerRight}>
          <div style={styles.stats}>
            <span style={styles.statItem}>
              <span style={styles.statNumber}>{issues.length}</span>
              <span style={styles.statLabel}>个待处理问题</span>
            </span>
          </div>
          <button onClick={handleResetData} style={styles.resetBtn}>
            🔄 重置示例数据
          </button>
        </div>
      </div>

      <div style={styles.typeFilter}>
        <button
          onClick={() => setFilterType('')}
          style={{
            ...styles.typeBtn,
            ...(!filterType ? styles.typeBtnActive : {})
          }}
        >
          全部 ({issues.length})
        </button>
        {issueTypes.map(type => (
          <button
            key={type.value}
            onClick={() => setFilterType(type.value)}
            style={{
              ...styles.typeBtn,
              ...(filterType === type.value ? styles.typeBtnActive : {}),
              borderLeftColor: type.color
            }}
          >
            {type.icon} {type.label} ({issues.filter(i => i.issue_type === type.value).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={styles.loading}>加载中...</div>
      ) : filteredIssues.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🎉</div>
          <div style={styles.emptyText}>太棒了！没有发现问题</div>
        </div>
      ) : (
        <div style={styles.issueList}>
          {filteredIssues.map(issue => (
            <div
              key={`${issue.issue_type}-${issue.id}`}
              style={styles.issueCard}
              onClick={() => navigate(`/action-items/${issue.id}`)}
            >
              <div style={styles.issueLeft}>
                <div style={{
                  ...styles.issueTypeTag,
                  backgroundColor: issueTypes.find(t => t.value === issue.issue_type)?.color + '15',
                  color: issueTypes.find(t => t.value === issue.issue_type)?.color
                }}>
                  {issueTypes.find(t => t.value === issue.issue_type)?.icon} {' '}
                  {issue.issue_type === 'wrong_assignee' ? '负责人错误' :
                   issue.issue_type === 'missing_due_date' ? '截止时间缺失' :
                   issue.issue_type === 'duplicate' ? '任务重复' : '提醒失败'}
                </div>
                <h3 style={styles.issueTitle}>{issue.title}</h3>
                <p style={styles.issueDesc}>{issue.issue_description}</p>
                
                <div style={styles.metaRow}>
                  <span>👤 负责人: {issue.assignee_name || '未分配'}</span>
                  <span>📅 截止: {issue.due_date || '未设置'}</span>
                  <span>📋 会议: {issue.meeting_title || '-'}</span>
                </div>
              </div>
              
              <div style={styles.issueRight}>
                <div style={styles.suggestionBox}>
                  <div style={styles.suggestionLabel}>💡 建议动作</div>
                  <div style={styles.suggestionText}>{issue.suggested_action}</div>
                </div>
                <div style={styles.closeBox}>
                  <div style={styles.closeLabel}>✅ 关闭依据</div>
                  <div style={styles.closeText}>{issue.close_condition}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  pageTitle: { fontSize: 24, margin: 0, color: '#262626' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 20 },
  stats: { display: 'flex', gap: 24 },
  resetBtn: {
    padding: '8px 16px',
    backgroundColor: '#fa8c16',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13
  },
  statItem: { display: 'flex', alignItems: 'baseline', gap: 8 },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#1890ff' },
  statLabel: { fontSize: 14, color: '#666' },
  typeFilter: { display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
  typeBtn: {
    padding: '10px 20px',
    border: '1px solid #d9d9d9',
    borderLeftWidth: 4,
    borderRadius: 6,
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: 14
  },
  typeBtnActive: {
    backgroundColor: '#e6f7ff',
    borderColor: '#1890ff',
    borderLeftWidth: 4,
    color: '#1890ff'
  },
  loading: { textAlign: 'center', padding: 40, color: '#999' },
  empty: { textAlign: 'center', padding: 80, backgroundColor: '#fff', borderRadius: 8 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#666' },
  issueList: { display: 'flex', flexDirection: 'column', gap: 16 },
  issueCard: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 24,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  issueLeft: { flex: 1 },
  issueTypeTag: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 4,
    fontSize: 12,
    marginBottom: 12
  },
  issueTitle: { fontSize: 16, margin: '0 0 8px 0', color: '#262626' },
  issueDesc: { fontSize: 14, color: '#666', marginBottom: 16 },
  metaRow: { display: 'flex', gap: 20, fontSize: 13, color: '#8c8c8c' },
  issueRight: { width: 240, display: 'flex', flexDirection: 'column', gap: 12 },
  suggestionBox: { padding: 12, backgroundColor: '#e6f7ff', borderRadius: 6 },
  suggestionLabel: { fontSize: 12, color: '#1890ff', marginBottom: 4 },
  suggestionText: { fontSize: 13, color: '#0050b3' },
  closeBox: { padding: 12, backgroundColor: '#f6ffed', borderRadius: 6 },
  closeLabel: { fontSize: 12, color: '#52c41a', marginBottom: 4 },
  closeText: { fontSize: 13, color: '#237804' }
};
