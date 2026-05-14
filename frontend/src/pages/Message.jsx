import React from 'react';
import BottomNav from '../components/BottomNav';

const Message = () => {
  const messages = [
    { id: 1, name: '张三', preview: '你好，请问这个问题怎么解决？', time: '10:30', unread: true },
    { id: 2, name: '李四', preview: '感谢你的回答，对我帮助很大！', time: '昨天', unread: false },
    { id: 3, name: '王五', preview: '最近有什么新的技术分享吗？', time: '昨天', unread: false },
    { id: 4, name: '系统通知', preview: '你的回答获得了10个赞同', time: '3天前', unread: true },
  ];

  return (
    <div>
      <header className="header">
        <div className="logo">消息</div>
        <nav className="nav-tabs">
          <span className="nav-tab active">私信</span>
          <span className="nav-tab">好友动态</span>
        </nav>
      </header>

      <main style={{ paddingBottom: '80px' }}>
        {messages.map((msg) => (
          <div key={msg.id} className="message-item">
            <div className="avatar" style={{ width: 48, height: 48 }}>{msg.name[0]}</div>
            <div className="message-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: msg.unread ? 600 : 500 }}>{msg.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{msg.time}</span>
              </div>
              <div className="message-preview">{msg.preview}</div>
            </div>
          </div>
        ))}
      </main>

      <BottomNav />
    </div>
  );
};

export default Message;
