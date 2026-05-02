import React, { useState, useEffect } from 'react';
import { messageAPI } from '../services/api';
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
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
  },
  markAllReadButton: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'white',
  },
  messageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  messageCard: (isRead) => ({
    backgroundColor: isRead ? 'white' : '#f8f9ff',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
  }),
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  messageTitle: (isRead) => ({
    fontSize: '14px',
    fontWeight: isRead ? '400' : '600',
    color: '#333',
  }),
  messageType: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  messageContent: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '8px',
    lineHeight: '1.5',
  },
  messageMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    color: '#999',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    marginTop: '20px',
  },
  pageButton: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  pageInfo: {
    fontSize: '14px',
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#333',
  },
  statLabel: {
    fontSize: '13px',
    color: '#666',
    marginTop: '4px',
  },
};

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [unreadStats, setUnreadStats] = useState({ total: 0, by_type: {} });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterRead, setFilterRead] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user, refreshUser } = useAuth();

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filterType) {
        params.type = filterType;
      }
      if (filterRead !== '') {
        params.is_read = filterRead === 'true';
      }
      const response = await messageAPI.getAll(params);
      setMessages(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadStats = async () => {
    try {
      const response = await messageAPI.getUnread();
      setUnreadStats(response.data);
    } catch (error) {
      console.error('Failed to fetch unread stats:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchUnreadStats();
  }, [filterType, filterRead, page]);

  const handleMessageClick = async (message) => {
    if (!message.is_read) {
      try {
        await messageAPI.markAsRead(message.id);
        fetchMessages();
        fetchUnreadStats();
        refreshUser();
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await messageAPI.markAllAsRead(filterType || undefined);
      fetchMessages();
      fetchUnreadStats();
      refreshUser();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      todo: '待办',
      notification: '通知',
      alert: '告警',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      todo: { bg: '#e7f3ff', text: '#0066cc' },
      notification: { bg: '#e7f3ff', text: '#0066cc' },
      alert: { bg: '#fce8e8', text: '#dc3545' },
    };
    return colors[type] || { bg: '#f5f5f5', text: '#666' };
  };

  if (loading && messages.length === 0) {
    return <div>加载中...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#007bff' }}>
            {unreadStats.total}
          </div>
          <div style={styles.statLabel}>未读消息</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#ffc107' }}>
            {unreadStats.by_type?.todo || 0}
          </div>
          <div style={styles.statLabel}>待办事项</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#dc3545' }}>
            {unreadStats.by_type?.alert || 0}
          </div>
          <div style={styles.statLabel}>告警消息</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#28a745' }}>
            {unreadStats.by_type?.notification || 0}
          </div>
          <div style={styles.statLabel}>通知消息</div>
        </div>
      </div>

      <div style={styles.header}>
        <div style={styles.filters}>
          <select
            style={styles.filterSelect}
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">全部类型</option>
            <option value="todo">待办</option>
            <option value="notification">通知</option>
            <option value="alert">告警</option>
          </select>
          <select
            style={styles.filterSelect}
            value={filterRead}
            onChange={(e) => {
              setFilterRead(e.target.value);
              setPage(1);
            }}
          >
            <option value="">全部状态</option>
            <option value="false">未读</option>
            <option value="true">已读</option>
          </select>
        </div>
        <button
          style={styles.markAllReadButton}
          onClick={handleMarkAllRead}
        >
          全部标为已读
        </button>
      </div>

      <div style={styles.messageList}>
        {messages.map((message) => {
          const typeColor = getTypeColor(message.type);
          return (
            <div
              key={message.id}
              style={styles.messageCard(message.is_read)}
              onClick={() => handleMessageClick(message)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={styles.messageHeader}>
                <div style={styles.messageTitle(message.is_read)}>
                  {!message.is_read && (
                    <span style={{ 
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#007bff',
                      marginRight: '8px',
                    }} />
                  )}
                  {message.title}
                </div>
                <span style={{
                  ...styles.messageType,
                  backgroundColor: typeColor.bg,
                  color: typeColor.text,
                }}>
                  {getTypeLabel(message.type)}
                </span>
              </div>
              {message.content && (
                <div style={styles.messageContent}>{message.content}</div>
              )}
              <div style={styles.messageMeta}>
                <span>关联: {message.entity_type} - {message.entity_id?.substring(0, 8)}</span>
                <span>{new Date(message.created_at * 1000).toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {messages.length === 0 && (
        <div style={styles.empty}>
          暂无消息
        </div>
      )}

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={styles.pageButton}
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </button>
          <span style={styles.pageInfo}>
            第 {page} 页 / 共 {totalPages} 页
          </span>
          <button
            style={styles.pageButton}
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default Messages;
