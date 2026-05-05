import React, { useState, useEffect, useCallback } from 'react';
import { contactAPI, accountAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';

const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [capacity, setCapacity] = useState({ current: 0, max: 500, isFull: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchCID, setSearchCID] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');

  const { user } = useAuth();
  const { emit, on, off, isConnected } = useSocket();
  const navigate = useNavigate();

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const params = activeTab === 'favorite' ? { isFavorite: true } : activeTab === 'recent' ? { isRecent: true } : {};
      const response = await contactAPI.getList(params);
      
      if (response.data?.success) {
        setContacts(response.data.data.contacts || []);
        setCapacity(response.data.data.capacity || { current: 0, max: 500, isFull: false });
      }
    } catch (err) {
      setError(err.response?.data?.message || '获取联系人列表失败');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleSearch = async () => {
    if (!searchCID.trim()) {
      setSearchError('请输入CID账号');
      return;
    }

    setSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const response = await accountAPI.findByCID(searchCID.trim());
      
      if (response.data?.success) {
        setSearchResult(response.data.data);
      } else {
        setSearchError(response.data?.message || '未找到该用户');
      }
    } catch (err) {
      setSearchError(err.response?.data?.message || '搜索失败');
    } finally {
      setSearching(false);
    }
  };

  const handleAddContact = async (contactId) => {
    try {
      const response = await contactAPI.add({ contactId });
      
      if (response.data?.success) {
        setShowAddModal(false);
        setSearchCID('');
        setSearchResult(null);
        fetchContacts();
      } else {
        setSearchError(response.data?.message || '添加失败');
      }
    } catch (err) {
      setSearchError(err.response?.data?.message || '添加失败');
    }
  };

  const handleToggleFavorite = async (contactId, currentFavorite) => {
    try {
      await contactAPI.toggleFavorite(contactId);
      fetchContacts();
    } catch (err) {
      console.error('切换收藏失败:', err);
    }
  };

  const handleRemoveContact = async (contactId) => {
    if (!window.confirm('确定要删除该联系人吗？')) {
      return;
    }

    try {
      await contactAPI.remove(contactId);
      fetchContacts();
    } catch (err) {
      console.error('删除联系人失败:', err);
    }
  };

  const handleCall = async (contact) => {
    try {
      const response = await contactAPI.checkCanCall({
        targetId: contact.contact_id
      });

      if (response.data?.success) {
        const { canCall, reason, autoAddStrategy } = response.data.data;
        
        if (!canCall) {
          alert(reason || '无法发起通话');
          return;
        }

        if (reason) {
          alert(reason);
        }

        emit('call:initiate', {
          callerId: user.id,
          callerCID: user.cid,
          callerName: user.username,
          receiverId: contact.contact_id,
          receiverCID: contact.cid,
          receiverName: contact.username,
          autoAddStrategy
        });

        alert('已发起视频通话，请等待对方接听...');
      }
    } catch (err) {
      console.error('发起通话失败:', err);
      alert('发起通话失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSendMessage = (contact) => {
    navigate('/video-messages', { state: { selectedContactId: contact.contact_id } });
  };

  const tabs = [
    { key: 'all', label: '全部联系人' },
    { key: 'favorite', label: '常用联系人' },
    { key: 'recent', label: '最近联系人' }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>联系人</h1>
          <p style={styles.subtitle}>
            容量: {capacity.current}/{capacity.max}
            {capacity.isFull && <span style={styles.fullWarning}> (已满)</span>}
          </p>
        </div>
        <button
          style={styles.addBtn}
          onClick={() => setShowAddModal(true)}
          disabled={capacity.isFull}
        >
          + 添加联系人
        </button>
      </div>

      <div style={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            style={{ ...styles.tab, ...(activeTab === tab.key ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={styles.loading}>加载中...</div>
      ) : error ? (
        <div style={styles.error}>{error}</div>
      ) : contacts.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>👥</div>
          <p style={styles.emptyText}>暂无联系人</p>
          <p style={styles.emptyHint}>点击上方按钮添加第一个联系人</p>
        </div>
      ) : (
        <div style={styles.contactList}>
          {contacts.map((contact) => (
            <div key={contact.id} style={styles.contactItem}>
              <div style={styles.avatar}>
                {contact.avatar ? (
                  <img src={contact.avatar} alt="" style={styles.avatarImg} />
                ) : (
                  <span style={styles.avatarText}>
                    {contact.username?.[0] || contact.cid?.[0] || 'U'}
                  </span>
                )}
                <span style={{ ...styles.statusDot, ...styles[`status${contact.status || 'offline'}`] }} />
              </div>
              
              <div style={styles.contactInfo}>
                <div style={styles.contactName}>
                  {contact.username || contact.cid}
                  {contact.is_favorite && <span style={styles.favoriteIcon}>⭐</span>}
                </div>
                <div style={styles.contactCid}>{contact.cid}</div>
              </div>

              <div style={styles.actions}>
                <button
                  style={styles.actionBtn}
                  title={contact.is_favorite ? '取消收藏' : '添加收藏'}
                  onClick={() => handleToggleFavorite(contact.contact_id, contact.is_favorite)}
                >
                  {contact.is_favorite ? '⭐' : '☆'}
                </button>
                <button
                  style={styles.actionBtn}
                  title="视频通话"
                  onClick={() => handleCall(contact)}
                >
                  📹
                </button>
                <button
                  style={styles.actionBtn}
                  title="发送留言"
                  onClick={() => handleSendMessage(contact)}
                >
                  💬
                </button>
                <button
                  style={styles.actionBtnDanger}
                  title="删除联系人"
                  onClick={() => handleRemoveContact(contact.contact_id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>添加联系人</h2>
              <button
                style={styles.modalClose}
                onClick={() => {
                  setShowAddModal(false);
                  setSearchCID('');
                  setSearchResult(null);
                  setSearchError('');
                }}
              >
                ✕
              </button>
            </div>

            <div style={styles.searchSection}>
              <input
                type="text"
                value={searchCID}
                onChange={(e) => setSearchCID(e.target.value)}
                placeholder="请输入对方CID账号"
                style={styles.searchInput}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                style={styles.searchBtn}
                onClick={handleSearch}
                disabled={searching}
              >
                {searching ? '搜索中...' : '搜索'}
              </button>
            </div>

            {searchError && <div style={styles.error}>{searchError}</div>}

            {searchResult && (
              <div style={styles.searchResult}>
                <div style={styles.avatar}>
                  {searchResult.avatar ? (
                    <img src={searchResult.avatar} alt="" style={styles.avatarImg} />
                  ) : (
                    <span style={styles.avatarText}>
                      {searchResult.username?.[0] || searchResult.cid?.[0] || 'U'}
                    </span>
                  )}
                </div>
                <div style={styles.resultInfo}>
                  <div style={styles.resultName}>
                    {searchResult.username || searchResult.cid}
                  </div>
                  <div style={styles.resultCid}>{searchResult.cid}</div>
                  <div style={styles.resultStatus}>
                    状态: {searchResult.status === 'online' ? '🟢 在线' : '⚪ 离线'}
                  </div>
                </div>
                <button
                  style={styles.addContactBtn}
                  onClick={() => handleAddContact(searchResult.id)}
                >
                  添加联系人
                </button>
              </div>
            )}
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
  fullWarning: {
    color: '#ef4444',
    fontWeight: 'bold'
  },
  addBtn: {
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
  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '16px',
    borderRadius: '10px',
    marginBottom: '16px',
    fontSize: '14px'
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
  contactList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    background: 'white',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  avatar: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    background: '#667eea',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginRight: '16px'
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  avatarText: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: 'white'
  },
  statusDot: {
    position: 'absolute',
    bottom: '2px',
    right: '2px',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '2px solid white'
  },
  statusonline: {
    background: '#4ade80'
  },
  statusoffline: {
    background: '#9ca3af'
  },
  contactInfo: {
    flex: 1
  },
  contactName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  favoriteIcon: {
    fontSize: '14px'
  },
  contactCid: {
    fontSize: '13px',
    color: '#888'
  },
  actions: {
    display: 'flex',
    gap: '8px'
  },
  actionBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    border: 'none',
    background: '#f5f7fa',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s'
  },
  actionBtnDanger: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    border: 'none',
    background: '#fef2f2',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s'
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
    maxWidth: '480px',
    margin: '20px',
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
  searchSection: {
    padding: '20px 24px',
    display: 'flex',
    gap: '12px'
  },
  searchInput: {
    flex: 1,
    padding: '14px 16px',
    border: '2px solid #eee',
    borderRadius: '10px',
    fontSize: '15px',
    outline: 'none'
  },
  searchBtn: {
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  searchResult: {
    padding: '16px 24px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  resultInfo: {
    flex: 1
  },
  resultName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '4px'
  },
  resultCid: {
    fontSize: '13px',
    color: '#888',
    marginBottom: '4px'
  },
  resultStatus: {
    fontSize: '13px',
    color: '#666'
  },
  addContactBtn: {
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default ContactsPage;
