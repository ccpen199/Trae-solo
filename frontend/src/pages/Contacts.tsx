import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loading } from 'antd-mobile';
import { useChatStore } from '../store/useChatStore';

const ContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const { contacts, fetchContacts, setCurrentContact } = useChatStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      await fetchContacts();
      setLoading(false);
    };
    load();
  }, []);

  const handleSelectContact = (contact: any) => {
    setCurrentContact(contact);
    navigate('/');
  };

  return (
    <div className="page-container">
      <div style={{ 
        padding: '16px 20px', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff'
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>联系人</h2>
        <p style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>选择角色开始记账聊天</p>
      </div>

      <div className="contacts-list">
        {loading ? (
          <div className="empty-state">
            <Loading />
          </div>
        ) : contacts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-text">暂无联系人</div>
          </div>
        ) : (
          contacts.map(contact => (
            <div 
              key={contact.id} 
              className="contact-item"
              onClick={() => handleSelectContact(contact)}
            >
              <div className="contact-avatar">🤖</div>
              <div className="contact-info">
                <div className="contact-name">{contact.name}</div>
                <div className="contact-role">{contact.role || '虚拟助手'}</div>
              </div>
              <span style={{ color: '#ccc' }}>›</span>
            </div>
          ))
        )}
      </div>

      <div className="tab-bar">
        <div className="tab-item" onClick={() => navigate('/')}>
          <span className="tab-icon">💬</span>
          <span>聊天</span>
        </div>
        <div className="tab-item active" onClick={() => navigate('/contacts')}>
          <span className="tab-icon">👥</span>
          <span>联系人</span>
        </div>
        <div className="add-btn" onClick={() => navigate('/')}>
          +
        </div>
        <div className="tab-item" onClick={() => navigate('/profile')}>
          <span className="tab-icon">👤</span>
          <span>我的</span>
        </div>
      </div>
    </div>
  );
};

export default ContactsPage;