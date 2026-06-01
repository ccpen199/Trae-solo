import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import dayjs from 'dayjs';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMeetings: 0,
    totalActionItems: 0,
    pendingItems: 0,
    overdueItems: 0,
    completedItems: 0
  });
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [myActionItems, setMyActionItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [meetingsRes, actionItemsRes] = await Promise.all([
        api.get('/meetings'),
        api.get('/action-items')
      ]);

      const actionItems = actionItemsRes.data;
      setStats({
        totalMeetings: meetingsRes.data.length,
        totalActionItems: actionItems.length,
        pendingItems: actionItems.filter(i => i.status === 'pending').length,
        overdueItems: actionItems.filter(i => i.display_status === 'overdue').length,
        completedItems: actionItems.filter(i => i.status === 'completed').length
      });

      setRecentMeetings(meetingsRes.data.slice(0, 5));
      setMyActionItems(actionItems.slice(0, 8));
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>加载中...</div>;
  }

  const handleResetData = async () => {
    if (!confirm('确定要重置所有示例数据吗？这将清空现有数据并重新生成。')) {
      return;
    }
    try {
      await api.post('/reset-sample-data');
      alert('数据已重置');
      loadData();
    } catch (error) {
      alert('重置数据失败');
    }
  };

  return (
    <div>
      <div style={styles.headerRow}>
        <h1 style={styles.pageTitle}>工作台概览</h1>
        <button onClick={handleResetData} style={styles.resetBtn}>
          🔄 重置示例数据
        </button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#e6f7ff' }}>📅</div>
          <div>
            <div style={styles.statValue}>{stats.totalMeetings}</div>
            <div style={styles.statLabel}>会议总数</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#fff7e6' }}>📋</div>
          <div>
            <div style={styles.statValue}>{stats.totalActionItems}</div>
            <div style={styles.statLabel}>行动项总数</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#f6ffed' }}>⏳</div>
          <div>
            <div style={styles.statValue}>{stats.pendingItems}</div>
            <div style={styles.statLabel}>待处理</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#fff1f0' }}>⚠️</div>
          <div>
            <div style={styles.statValue}>{stats.overdueItems}</div>
            <div style={styles.statLabel}>已过期</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#f9f0ff' }}>✅</div>
          <div>
            <div style={styles.statValue}>{stats.completedItems}</div>
            <div style={styles.statLabel}>已完成</div>
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>最近会议</h3>
            <Link to="/meetings" style={styles.link}>查看全部 →</Link>
          </div>
          {recentMeetings.length === 0 ? (
            <div style={styles.empty}>暂无会议记录</div>
          ) : (
            <div style={styles.list}>
              {recentMeetings.map(meeting => (
                <Link
                  key={meeting.id}
                  to={`/meetings/${meeting.id}`}
                  style={styles.listItem}
                >
                  <div>
                    <div style={styles.itemTitle}>{meeting.title}</div>
                    <div style={styles.itemMeta}>
                      {dayjs(meeting.meeting_date).format('YYYY-MM-DD')} · {meeting.organizer_name || '待定组织者'}
                    </div>
                  </div>
                  <span style={styles.badge}>{meeting.action_item_count} 项</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>行动项跟踪</h3>
            <Link to="/action-items" style={styles.link}>查看全部 →</Link>
          </div>
          {myActionItems.length === 0 ? (
            <div style={styles.empty}>暂无行动项</div>
          ) : (
            <div style={styles.list}>
              {myActionItems.map(item => (
                <div key={item.id} style={styles.listItem}>
                  <div>
                    <div style={styles.itemTitle}>{item.title}</div>
                    <div style={styles.itemMeta}>
                      {item.assignee_name || '未分配'} · 
                      截止: {item.due_date ? dayjs(item.due_date).format('YYYY-MM-DD') : '未设置'}
                    </div>
                  </div>
                  <span style={{
                    ...styles.statusTag,
                    ...getStatusStyle(item.display_status || item.status)
                  }}>
                    {getStatusText(item.display_status || item.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusStyle(status) {
  switch (status) {
    case 'completed': return { backgroundColor: '#f6ffed', color: '#52c41a' };
    case 'overdue': return { backgroundColor: '#fff1f0', color: '#f5222d' };
    case 'in_progress': return { backgroundColor: '#e6f7ff', color: '#1890ff' };
    case 'cancelled': return { backgroundColor: '#f5f5f5', color: '#8c8c8c' };
    default: return { backgroundColor: '#fff7e6', color: '#fa8c16' };
  }
}

function getStatusText(status) {
  switch (status) {
    case 'completed': return '已完成';
    case 'overdue': return '已过期';
    case 'in_progress': return '进行中';
    case 'cancelled': return '已取消';
    default: return '待处理';
  }
}

const styles = {
  loading: { textAlign: 'center', padding: 40, fontSize: 16, color: '#999' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  pageTitle: { fontSize: 24, margin: 0, color: '#262626' },
  resetBtn: {
    padding: '8px 16px',
    backgroundColor: '#fa8c16',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13
  },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24
  },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#262626' },
  statLabel: { fontSize: 13, color: '#8c8c8c', marginTop: 4 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, margin: 0, color: '#262626' },
  link: { color: '#1890ff', textDecoration: 'none', fontSize: 13 },
  empty: { textAlign: 'center', padding: 40, color: '#999' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 6,
    textDecoration: 'none',
    color: 'inherit'
  },
  itemTitle: { fontSize: 14, fontWeight: 500, color: '#262626' },
  itemMeta: { fontSize: 12, color: '#8c8c8c', marginTop: 4 },
  badge: {
    padding: '2px 8px',
    backgroundColor: '#e6f7ff',
    color: '#1890ff',
    borderRadius: 10,
    fontSize: 12
  },
  statusTag: { padding: '2px 8px', borderRadius: 4, fontSize: 12 }
};
