import React, { useState, useEffect } from 'react';
import { List, Card, Tag, Button, Empty, Spin, message, Space } from 'antd';
import { BellOutlined, CheckOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { notificationApi } from '../services/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationApi.getAll();
      setNotifications(response.data.data.notifications || []);
    } catch (error) {
      message.error('获取通知列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeTag = (type) => {
    const colors = {
      invoice: 'blue',
      payment: 'green',
      subscription: 'purple',
      alert: 'orange',
      warning: 'red',
      info: 'default',
      entitlement: 'cyan',
    };
    const names = {
      invoice: '账单',
      payment: '支付',
      subscription: '订阅',
      alert: '提醒',
      warning: '警告',
      info: '系统',
      entitlement: '权益',
    };
    return <Tag color={colors[type] || 'default'}>{names[type] || type}</Tag>;
  };

  const getChannelTag = (channel) => {
    const names = {
      email: '邮件',
      in_app: '站内信',
      sms: '短信',
      webhook: 'Webhook',
    };
    return names[channel] || channel;
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
      );
      message.success('已标记为已读');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      message.success('全部标记为已读');
    } catch (error) {
      message.error('操作失败');
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>通知中心</h2>
        {notifications.some(n => !n.is_read) && (
          <Button onClick={handleMarkAllRead}>
            全部标为已读
          </Button>
        )}
      </div>

      <Card className="dashboard-card">
        {notifications.length === 0 ? (
          <Empty 
            description="暂无通知"
            icon={<BellOutlined style={{ fontSize: 48, color: '#ccc' }} />}
            style={{ padding: 40 }}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                className={`notification-item ${!item.is_read ? 'unread' : ''}`}
                actions={[
                  !item.is_read && (
                    <Button 
                      type="link" 
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => handleMarkAsRead(item.id)}
                    >
                      标为已读
                    </Button>
                  ),
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: 20, 
                      background: item.is_read ? '#f0f0f0' : '#e6f7ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <BellOutlined style={{ 
                        fontSize: 18, 
                        color: item.is_read ? '#999' : '#1890ff' 
                      }} />
                    </div>
                  }
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {!item.is_read && <span className="notification-unread-dot" />}
                      <span style={{ fontWeight: item.is_read ? 400 : 600 }}>
                        {item.title}
                      </span>
                      {getTypeTag(item.type)}
                    </div>
                  }
                  description={
                    <div>
                      <p style={{ margin: '4px 0', color: '#666' }}>
                        {item.message}
                      </p>
                      <Space size={12}>
                        <span style={{ fontSize: 12, color: '#999' }}>
                          渠道: {getChannelTag(item.channel)}
                        </span>
                        <span style={{ fontSize: 12, color: '#999' }}>
                          {dayjs(item.sent_at || item.created_at).format('YYYY-MM-DD HH:mm')}
                        </span>
                      </Space>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default Notifications;
