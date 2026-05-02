import React, { useState, useEffect } from 'react';
import { statsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#333',
  },
  statIcon: {
    float: 'right',
    fontSize: '40px',
    opacity: 0.3,
  },
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
  todoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  todoItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    gap: '12px',
  },
  todoIcon: {
    fontSize: '20px',
  },
  todoContent: {
    flex: 1,
  },
  todoTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  todoMeta: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
  },
  statusBadge: (status) => ({
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: getStatusColor(status).bg,
    color: getStatusColor(status).text,
  }),
};

const getStatusColor = (status) => {
  const colors = {
    pending_create: { bg: '#fff3cd', text: '#856404' },
    active: { bg: '#d4edda', text: '#155724' },
    archived: { bg: '#e2e3e5', text: '#383d41' },
    rejected: { bg: '#f8d7da', text: '#721c24' },
    pending_review: { bg: '#fff3cd', text: '#856404' },
    in_review: { bg: '#cce5ff', text: '#004085' },
    approved: { bg: '#d4edda', text: '#155724' },
    merged: { bg: '#d4edda', text: '#155724' },
    closed: { bg: '#e2e3e5', text: '#383d41' },
    changes_requested: { bg: '#f8d7da', text: '#721c24' },
    pending: { bg: '#fff3cd', text: '#856404' },
    running: { bg: '#cce5ff', text: '#004085' },
    success: { bg: '#d4edda', text: '#155724' },
    failed: { bg: '#f8d7da', text: '#721c24' },
  };
  return colors[status] || { bg: '#e2e3e5', text: '#383d41' };
};

const getStatusLabel = (status) => {
  const labels = {
    pending_create: '待创建',
    active: '活跃',
    archived: '已归档',
    rejected: '已拒绝',
    pending_review: '待审查',
    in_review: '审查中',
    approved: '已批准',
    merged: '已合并',
    closed: '已关闭',
    changes_requested: '请求修改',
    pending: '待执行',
    running: '执行中',
    success: '成功',
    failed: '失败',
  };
  return labels[status] || status;
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await statsAPI.getDashboard();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>📁</span>
          <div style={styles.statLabel}>我的待办</div>
          <div style={styles.statValue}>{stats?.my_todos || 0}</div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>🏠</span>
          <div style={styles.statLabel}>活跃仓库</div>
          <div style={styles.statValue}>{stats?.repositories?.active || 0}</div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>🔀</span>
          <div style={styles.statLabel}>待审查MR</div>
          <div style={styles.statValue}>
            {(stats?.merge_requests?.pending_review || 0) + (stats?.merge_requests?.in_review || 0)}
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>🚀</span>
          <div style={styles.statLabel}>构建中</div>
          <div style={styles.statValue}>{stats?.pipelines?.running || 0}</div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>统计概览</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>仓库状态分布</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(stats?.repositories || {}).map(([status, count]) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={styles.statusBadge(status)}>{getStatusLabel(status)}</span>
                  <span style={{ fontSize: '14px', color: '#666' }}>{count} 个</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>MR状态分布</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(stats?.merge_requests || {}).map(([status, count]) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={styles.statusBadge(status)}>{getStatusLabel(status)}</span>
                  <span style={{ fontSize: '14px', color: '#666' }}>{count} 个</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>用户角色分布</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(stats?.users || {}).map(([role, count]) => (
                <div key={role} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ 
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: '#e7f3ff',
                    color: '#0066cc',
                  }}>
                    {role === 'admin' ? '管理员' : role === 'developer' ? '开发者' : role === 'reviewer' ? '审查者' : role === 'devops' ? '运维' : role}
                  </span>
                  <span style={{ fontSize: '14px', color: '#666' }}>{count} 人</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>快捷操作</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }} onClick={() => window.location.href = '/repositories'}>
            📁 查看仓库列表
          </button>
          <button style={{
            padding: '12px 24px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }} onClick={() => window.location.href = '/merge-requests'}>
            🔀 查看合并请求
          </button>
          <button style={{
            padding: '12px 24px',
            backgroundColor: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }} onClick={() => window.location.href = '/messages'}>
            💬 查看消息中心
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
