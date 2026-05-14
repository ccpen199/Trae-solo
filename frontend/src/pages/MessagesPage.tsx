
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function MessagesPage() {
  const navigate = useNavigate();

  const messages = [
    { id: 1, title: '订单消息', content: '您的订单已完成，感谢您的使用', time: '10:30' },
    { id: 2, title: '优惠活动', content: '新用户专享，首单立减10元', time: '昨天' },
    { id: 3, title: '系统通知', content: '您的账户安全等级已提升', time: '3天前' }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/')}>←</button>
        <span style={styles.title}>消息</span>
        <div></div>
      </div>

      <div style={styles.list}>
        {messages.map((msg) => (
          <div key={msg.id} style={styles.item}>
            <div style={styles.itemIcon}>📢</div>
            <div style={styles.itemContent}>
              <div style={styles.itemTitle}>{msg.title}</div>
              <div style={styles.itemText}>{msg.content}</div>
            </div>
            <div style={styles.itemTime}>{msg.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  backBtn: {
    background: 'none',
    fontSize: '24px',
    padding: '0'
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold' as const
  },
  list: {
    padding: '12px'
  },
  item: {
    background: '#fff',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  itemIcon: {
    fontSize: '32px'
  },
  itemContent: {
    flex: 1
  },
  itemTitle: {
    fontSize: '16px',
    color: '#333',
    marginBottom: '4px'
  },
  itemText: {
    fontSize: '14px',
    color: '#999'
  },
  itemTime: {
    fontSize: '12px',
    color: '#ccc'
  }
};
