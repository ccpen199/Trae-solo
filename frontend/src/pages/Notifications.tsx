import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Empty, message } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import api from '../api';
import type { Notification } from '../types';

function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data: any = await api.get('/notifications', { params: { limit: 50 } });
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: 1 } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: 1 })));
      setUnreadCount(0);
      message.success('已全部标记为已读');
    } catch (error) {
      console.error('Failed to mark all read:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    return <BellOutlined />;
  };

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      order_created: 'blue',
      order_accepted: 'green',
      order_taken: 'green',
      new_bid: 'magenta',
      bid_accepted: 'green',
      system: 'default',
    };
    return colorMap[type] || 'default';
  };

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <Card 
        title={
          <span>
            消息通知 
            {unreadCount > 0 && <Tag color="red" style={{ marginLeft: 8 }}>{unreadCount} 条未读</Tag>}
          </span>
        }
        extra={
          unreadCount > 0 ? (
            <Button type="text" icon={<CheckOutlined />} onClick={handleMarkAllRead}>
              全部已读
            </Button>
          ) : null
        }
      >
        <List
          loading={loading}
          dataSource={notifications}
          locale={{ emptyText: <Empty description="暂无消息" /> }}
          renderItem={(item) => (
            <List.Item
              style={{ 
                background: item.read ? '#fff' : '#f0f7ff',
                marginBottom: 8,
                borderRadius: 8,
                padding: '12px 16px',
                cursor: 'pointer',
              }}
              onClick={() => handleMarkRead(item.id)}
            >
              <List.Item.Meta
                avatar={
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    background: '#e6f7ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    color: '#1890ff',
                  }}>
                    {getTypeIcon(item.type)}
                  </div>
                }
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: item.read ? 400 : 600 }}>{item.title}</span>
                    {!item.read && <Tag color={getTypeColor(item.type)}>新消息</Tag>}
                  </div>
                }
                description={
                  <div>
                    <div style={{ color: '#595959' }}>{item.content}</div>
                    <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
                      {item.created_at}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

export default Notifications;
