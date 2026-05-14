import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageApi } from '../api';
import { useAuthStore } from '../store';

const MessagePage = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [activeTab, setActiveTab] = useState(isLoggedIn ? 'chat' : 'announcement');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const promises = [messageApi.getAnnouncements()];
      if (isLoggedIn) {
        promises.push(messageApi.getConversations());
      }
      
      const results = await Promise.all(promises);
      
      if (isLoggedIn && results[1]?.data.success) {
        setConversations(results[1].data.data);
      }
      if (results[0]?.data.success) {
        setAnnouncements(results[0].data.data);
      }
    } catch (err) {
      console.error('加载消息失败', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loading" style={{ borderColor: '#ff6a00', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ 
        background: 'white', 
        padding: '16px', 
        paddingTop: '50px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div 
          onClick={() => navigate(-1)}
          style={{ fontSize: '20px', cursor: 'pointer' }}
        >
          ←
        </div>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: '600' }}>消息中心</div>
        <div style={{ width: '20px' }}></div>
      </div>

      <div style={{ 
        background: 'white', 
        display: 'flex',
        borderBottom: '1px solid #f0f0f0'
      }}>
        {isLoggedIn && (
          <div
            onClick={() => setActiveTab('chat')}
            style={{ 
              flex: 1, 
              textAlign: 'center', 
              padding: '12px',
              cursor: 'pointer',
              borderBottom: activeTab === 'chat' ? '2px solid #ff6a00' : 'none',
              color: activeTab === 'chat' ? '#ff6a00' : '#666',
              fontWeight: activeTab === 'chat' ? '600' : '400'
            }}
          >
            对话
          </div>
        )}
        <div
          onClick={() => setActiveTab('announcement')}
          style={{ 
            flex: isLoggedIn ? 1 : 'none', 
            textAlign: 'center', 
            padding: '12px',
            cursor: 'pointer',
            borderBottom: activeTab === 'announcement' ? '2px solid #ff6a00' : 'none',
            color: activeTab === 'announcement' ? '#ff6a00' : '#666',
            fontWeight: activeTab === 'announcement' ? '600' : '400'
          }}
        >
          公告
        </div>
        <div
          onClick={() => navigate('/announcement')}
          style={{ 
            flex: 1, 
            textAlign: 'center', 
            padding: '12px',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          福利活动
        </div>
      </div>

      {activeTab === 'chat' && (
        <div style={{ marginTop: '10px' }}>
          {conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
              <div>暂无对话</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>开始叫车后可与司机沟通</div>
            </div>
          ) : (
            <div style={{ background: 'white' }}>
              {conversations.map((conv, index) => (
                <div
                  key={conv.order_id}
                  onClick={() => navigate(`/chat/${conv.order_id}`)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '16px',
                    borderBottom: index < conversations.length - 1 ? '1px solid #f0f0f0' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ 
                    width: '44px', 
                    height: '44px', 
                    borderRadius: '50%', 
                    background: '#fff5ee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}>
                    👨‍✈️
                  </div>
                  <div style={{ flex: 1, marginLeft: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '500' }}>司机</span>
                      <span style={{ fontSize: '10px', background: '#ff6a00', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>
                        订单 {conv.order_id.slice(-6)}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>
                      {conv.last_message || '暂无消息'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {conv.unread_count > 0 && (
                      <div style={{ 
                        background: '#f5222d', 
                        color: 'white', 
                        fontSize: '10px',
                        minWidth: '18px',
                        height: '18px',
                        borderRadius: '9px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 6px',
                        marginLeft: 'auto'
                      }}>
                        {conv.unread_count}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'announcement' && (
        <div style={{ marginTop: '10px' }}>
          {announcements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📢</div>
              <div>暂无公告</div>
            </div>
          ) : (
            <div style={{ background: 'white' }}>
              {announcements.map((ann, index) => (
                <div
                  key={ann.id}
                  onClick={() => navigate(`/announcement/${ann.id}`)}
                  style={{ 
                    padding: '16px',
                    borderBottom: index < announcements.length - 1 ? '1px solid #f0f0f0' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '10px', 
                      background: ann.type === 'coupon' ? '#ff6a00' : ann.type === 'safety' ? '#07c160' : '#1890ff', 
                      color: 'white', 
                      padding: '2px 6px', 
                      borderRadius: '4px' 
                    }}>
                      {ann.type === 'coupon' ? '优惠' : ann.type === 'safety' ? '安全' : '活动'}
                    </span>
                    <span style={{ fontWeight: '500' }}>{ann.title}</span>
                  </div>
                  {ann.content && (
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
                      {ann.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessagePage;