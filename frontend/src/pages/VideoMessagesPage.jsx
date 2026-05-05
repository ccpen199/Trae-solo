import React, { useState, useEffect, useCallback } from 'react';
import { messageAPI, contactAPI } from '../api';

const VideoMessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');
  const [showCompose, setShowCompose] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [textContent, setTextContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await messageAPI.getList(activeType);
      
      if (response.data?.success) {
        setMessages(response.data.data || []);
      }
    } catch (err) {
      console.error('获取视频留言失败:', err);
    } finally {
      setLoading(false);
    }
  }, [activeType]);

  const fetchContacts = async () => {
    try {
      const response = await contactAPI.getList();
      if (response.data?.success) {
        setContacts(response.data.data.contacts || []);
      }
    } catch (err) {
      console.error('获取联系人失败:', err);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (showCompose) {
      fetchContacts();
    }
  }, [showCompose]);

  const toggleContactSelection = (contactId) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };

  const handleSend = async () => {
    if (selectedContacts.length === 0) {
      setError('请至少选择一个联系人');
      return;
    }

    setSending(true);
    setError('');

    try {
      const response = await messageAPI.send({
        receiverIds: selectedContacts,
        textContent,
        videoUrl: '',
        duration: 0
      });

      if (response.data?.success) {
        setShowCompose(false);
        setSelectedContacts([]);
        setTextContent('');
        fetchMessages();
      } else {
        setError(response.data?.message || '发送失败');
      }
    } catch (err) {
      setError(err.response?.data?.message || '发送失败');
    } finally {
      setSending(false);
    }
  };

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'received', label: '收到' },
    { key: 'sent', label: '已发送' }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>视频留言</h1>
          <p style={styles.subtitle}>
            发送和接收视频留言，与熟人保持联系
          </p>
        </div>
        <button
          style={styles.composeBtn}
          onClick={() => setShowCompose(true)}
        >
          + 发送留言
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
          <div style={styles.emptyIcon}>🎬</div>
          <p style={styles.emptyText}>暂无视频留言</p>
          <p style={styles.emptyHint}>点击上方按钮发送第一条留言</p>
        </div>
      ) : (
        <div style={styles.messageList}>
          {messages.map((message) => (
            <div key={message.id} style={styles.messageItem}>
              <div style={styles.thumb}>
                <div style={styles.playIcon}>▶</div>
                {message.duration > 0 && (
                  <span style={styles.duration}>
                    {Math.floor(message.duration / 60)}:{(message.duration % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
              
              <div style={styles.content}>
                <div style={styles.messageHeader}>
                  <span style={styles.senderName}>
                    {message.is_sent ? '我' : (message.sender_name || message.sender_cid)}
                  </span>
                  {message.is_group && (
                    <span style={styles.groupBadge}>群发</span>
                  )}
                  {!message.is_sent && !message.is_read && (
                    <span style={styles.unreadBadge}>未读</span>
                  )}
                </div>
                {message.textContent && (
                  <p style={styles.textContent}>{message.textContent}</p>
                )}
                <div style={styles.meta}>
                  <span style={styles.time}>
                    {new Date(message.created_at).toLocaleString('zh-CN')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCompose && (
        <div style={styles.modalOverlay} onClick={() => setShowCompose(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>发送视频留言</h2>
              <button
                style={styles.modalClose}
                onClick={() => {
                  setShowCompose(false);
                  setSelectedContacts([]);
                  setTextContent('');
                  setError('');
                }}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>选择联系人</label>
                <div style={styles.contactSelector}>
                  {contacts.length === 0 ? (
                    <p style={styles.emptyHint}>暂无联系人</p>
                  ) : (
                    contacts.map((contact) => (
                      <div
                        key={contact.id}
                        style={{
                          ...styles.contactItem,
                          ...(selectedContacts.includes(contact.contact_id) ? styles.contactSelected : {})
                        }}
                        onClick={() => toggleContactSelection(contact.contact_id)}
                      >
                        <div style={styles.contactAvatar}>
                          {contact.username?.[0] || contact.cid?.[0] || 'U'}
                        </div>
                        <div style={styles.contactInfo}>
                          <div style={styles.contactName}>
                            {contact.username || contact.cid}
                          </div>
                          <div style={styles.contactCid}>{contact.cid}</div>
                        </div>
                        {selectedContacts.includes(contact.contact_id) && (
                          <span style={styles.checkMark}>✓</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <p style={styles.hint}>
                  已选择 {selectedContacts.length} 人 (最多10人)
                </p>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>文字留言 (可选)</label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="添加文字描述..."
                  style={styles.textarea}
                  rows={3}
                />
              </div>

              {error && <div style={styles.error}>{error}</div>}
            </div>

            <div style={styles.modalFooter}>
              <button
                style={styles.cancelBtn}
                onClick={() => {
                  setShowCompose(false);
                  setSelectedContacts([]);
                  setTextContent('');
                  setError('');
                }}
              >
                取消
              </button>
              <button
                style={styles.sendBtn}
                onClick={handleSend}
                disabled={sending || selectedContacts.length === 0}
              >
                {sending ? '发送中...' : '发送留言'}
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
  composeBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    background: '#fff',
    padding: '8px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  tab: {
    padding: '10px 20px',
    border: 'none',
    background: 'transparent',
    fontSize: '14px',
    color: '#666',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
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
    color: '#333',
    marginBottom: '8px'
  },
  emptyHint: {
    fontSize: '14px',
    color: '#888'
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
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  thumb: {
    width: '120px',
    height: '80px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
    cursor: 'pointer'
  },
  playIcon: {
    color: 'white',
    fontSize: '24px',
    opacity: 0.9
  },
  duration: {
    position: 'absolute',
    bottom: '6px',
    right: '8px',
    background: 'rgba(0,0,0,0.6)',
    color: 'white',
    fontSize: '12px',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  content: {
    flex: 1,
    minWidth: 0
  },
  messageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  senderName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a1a2e'
  },
  groupBadge: {
    background: '#fef3c7',
    color: '#d97706',
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: '500'
  },
  unreadBadge: {
    background: '#667eea',
    color: 'white',
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: '500'
  },
  textContent: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
    lineHeight: '1.5'
  },
  meta: {
    display: 'flex',
    gap: '12px'
  },
  time: {
    fontSize: '12px',
    color: '#aaa'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '90vh',
    margin: '20px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #eee'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#888',
    padding: '4px'
  },
  modalBody: {
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1
  },
  modalFooter: {
    display: 'flex',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #eee',
    justifyContent: 'flex-end'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '8px',
    display: 'block'
  },
  contactSelector: {
    border: '2px solid #eee',
    borderRadius: '10px',
    padding: '8px',
    maxHeight: '200px',
    overflowY: 'auto'
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  contactSelected: {
    background: '#f0f4ff',
    border: '1px solid #667eea'
  },
  contactAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  contactInfo: {
    flex: 1
  },
  contactName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '2px'
  },
  contactCid: {
    fontSize: '12px',
    color: '#888'
  },
  checkMark: {
    color: '#667eea',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  hint: {
    fontSize: '12px',
    color: '#888',
    marginTop: '8px'
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #eee',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px'
  },
  cancelBtn: {
    padding: '12px 24px',
    background: '#f5f7fa',
    color: '#666',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  sendBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  }
};

export default VideoMessagesPage;
