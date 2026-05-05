import React, { useState, useEffect, useCallback } from 'react';
import { messageCenterAPI } from '../api';

const MessageCenterPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');

  const typeLabels = {
    all: '全部消息',
    call_record: '通话记录',
    video_message: '视频留言',
    contact_change: '联系人变更',
    capacity_alert: '容量告警',
    system_notice: '系统通知'
  };

  const typeIcons = {
    call_record: '📞',
    video_message: '🎬',
    contact_change: '👤',
    capacity_alert: '⚠️',
    system_notice: '📢',
    default: '📬'
  };

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const params = activeType !== 'all' ? { messageType: activeType } : {};
      const response = await messageCenterAPI.getList(params);
      
      if (response.data?.success) {
        setMessages(response.data.data || []);
      }
    } catch (err) {
      console.error('获取消息中心失败:', err);
    } finally {
      setLoading(false);
    }
  }, [activeType]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const markAllAsRead = async () => {
    try {
      await messageCenterAPI.markAllAsRead();
      fetchMessages();
    } catch (err) {
      console.error('标记全部已读失败:', err);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await messageCenterAPI.markAsRead(messageId);
      fetchMessages();
    } catch (err) {
      console.error('标记已读失败:', err);
    }
  };

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'call_record', label: '通话' },
    { key: 'video_message', label: '留言' },
    { key: 'contact_change', label: '联系人' },
    { key: 'capacity_alert', label: '告警' }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>消息中心</h1>
          <p style={styles.subtitle}>
            {messages.filter(m => !m.is_read).length} 条未读消息
          </p>
        </div>
        <button
          style={styles.markAllBtn}
          onClick={markAllAsRead}
        >
          全部已读
        </button>
      </div>

      <div style={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            style={{ ...styles.tab, ...(activeType === tab.key ? styles.tabActive : {}) }}
            onClick={() => setActiveType(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={styles.loading}>加载中...</div>
      ) : messages.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>📬</div>
          <p style={styles.emptyText}>暂无消息</p>
        </div>
      ) : (
        <div style={styles.messageList}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{ ...styles.messageItem, ...(!message.is_read ? styles.unread : {}) }}
              onClick={() => !message.is_read && markAsRead(message.id)}
            >
              <div style={styles.icon}>
                {typeIcons[message.message_type] || typeIcons.default}
              </div>
              
              <div style={styles.content}>
                <div style={styles.itemTitle}>
                  {message.title}
                  {!message.is_read && <span style={styles.unreadDot} />}
                </div>
                <div style={styles.messageContent}>{message.content}</div>
                <div style={styles.meta}>
                  <span style={styles.typeLabel}>
                    {typeLabels[message.message_type] || '系统消息'}
                  </span>
                  <span style={styles.time}>
                    {new Date(message.created_at).toLocaleString('zh-CN')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '24px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a1a2e',
    margin: '0 0 4px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  markAllBtn: {
    padding: '10px 20px',
    background: '#f5f7fa',
    color: '#666',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    background: '#fff',
    padding: '8px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    overflowX: 'auto'
  },
  tab: {
    padding: '10px 16px',
    border: 'none',
    background: 'transparent',
    fontSize: '14px',
    color: '#666',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
  },
  tabActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#666'
  },
  empty: {
    textAlign: 'center',
    padding: '80px 20px'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333'
  },
  messageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  messageItem: {
    display: 'flex',
    gap: '16px',
    background: 'white',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  unread: {
    borderLeft: '4px solid #667eea',
    background: '#f8f9ff'
  },
  icon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: '#f5f7fa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    flexShrink: 0
  },
  content: {
    flex: 1,
    minWidth: 0
  },
  itemTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#667eea',
    flexShrink: 0
  },
  messageContent: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  meta: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  typeLabel: {
    fontSize: '12px',
    color: '#888',
    background: '#f5f7fa',
    padding: '2px 8px',
    borderRadius: '4px'
  },
  time: {
    fontSize: '12px',
    color: '#aaa'
  }
};

export default MessageCenterPage;
