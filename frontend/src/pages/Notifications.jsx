import React, { useState, useEffect } from 'react';
import { 
  List, Card, Button, Typography, Tag, Empty, message, Space, Popconfirm
} from 'antd';
import { 
  BellOutlined, CheckCircleOutlined, InfoCircleOutlined, 
  WarningOutlined, CloseCircleOutlined, CheckOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { notificationApi } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const typeIcons = {
  success: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />,
  info: <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 24 }} />,
  warning: <WarningOutlined style={{ color: '#faad14', fontSize: 24 }} />,
  error: <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />
};

const typeColors = {
  success: 'green',
  info: 'blue',
  warning: 'orange',
  error: 'red'
};

const typeNames = {
  success: '成功',
  info: '通知',
  warning: '警告',
  error: '错误'
};

const Notifications = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationApi.getAll();
      setNotifications(response.data.notifications || []);
    } catch (error) {
      message.error('获取通知列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n
        )
      );
    } catch (error) {
      message.error('标记已读失败');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
      );
      message.success('已全部标记为已读');
    } catch (error) {
      message.error('标记已读失败');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div>
      <Card 
        bordered={false}
        title={
          <Title level={4}>
            <BellOutlined style={{ marginRight: 8 }} />
            消息通知
            {unreadCount > 0 && (
              <Tag color="red" style={{ marginLeft: 8 }}>
                {unreadCount} 条未读
              </Tag>
            )}
          </Title>
        }
        extra={
          unreadCount > 0 && (
            <Popconfirm
              title="确认全部标记为已读？"
              onConfirm={handleMarkAllAsRead}
            >
              <Button type="link">全部已读</Button>
            </Popconfirm>
          )
        }
      >
        {notifications.length === 0 ? (
          <Empty description="暂无通知消息" />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            loading={loading}
            renderItem={(item) => (
              <List.Item
                style={{ 
                background: item.read ? '#fff' : '#f6ffed',
                padding: 16,
                marginBottom: 8,
                borderRadius: 8,
                border: item.read ? '1px solid #f0f0f0' : '1px solid #b7eb8f'
              }}
                actions={!item.read ? [
                  <Button 
                    type="link" 
                    icon={<CheckOutlined />} 
                    onClick={() => handleMarkAsRead(item.id)}
                  >
                    标记已读
                  </Button>
                ] : []}
              >
                <List.Item.Meta
                avatar={
                  <div style={{ 
                    width: 48, 
                    height: 48, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: '#f5f5f5',
                    borderRadius: 24
                  }}>
                    {typeIcons[item.type] || typeIcons.info}
                  </div>
                }
                title={
                  <Space>
                    <Text strong>{item.title}</Text>
                    <Tag color={typeColors[item.type] || 'blue'}>
                      {typeNames[item.type] || '通知'}
                    </Tag>
                    {!item.read && <Tag color="red">未读</Tag>}
                  </Space>
                }
                description={
                  <div>
                    <Paragraph style={{ marginBottom: 8, color: '#666' }}>
                      {item.message}
                    </Paragraph>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')}
                      {item.read_at && (
                        <Text style={{ marginLeft: 16 }}>
                          已读时间: {dayjs(item.read_at).format('YYYY-MM-DD HH:mm:ss')}
                        </Text>
                      )}
                    </Text>
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
