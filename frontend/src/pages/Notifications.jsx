import React from 'react';
import { Card, List, Tag, Button, Space, Empty, Spin, Badge } from 'antd';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../api';
import { NOTIFICATION_TYPE_NAMES } from '../utils/constants';
import dayjs from 'dayjs';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await notificationApi.getList({ limit: 100 });
      setNotifications(res.data || []);
    } catch (error) {
      console.error('获取通知列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: 1 } : item))
      );
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: 1 })));
    } catch (error) {
      console.error('全部标记已读失败:', error);
    }
  };

  const handleClickNotification = (item) => {
    if (!item.is_read) {
      handleMarkAsRead(item.id);
    }
    if (item.related_type === 'main_order' && item.related_id) {
      navigate(`/orders/${item.related_id}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>
          通知中心
          {unreadCount > 0 && (
            <Tag color="red" style={{ marginLeft: 8 }}>
              {unreadCount} 条未读
            </Tag>
          )}
        </div>
        {unreadCount > 0 && (
          <Button type="link" onClick={handleMarkAllAsRead}>
            全部已读
          </Button>
        )}
      </div>

      <Card className="page-card">
        <List
          loading={loading}
          dataSource={notifications}
          locale={{
            emptyText: (
              <div className="empty-state">
                <div className="empty-state-icon">🔔</div>
                <div>暂无通知</div>
              </div>
            ),
          }}
          renderItem={(item) => (
            <List.Item
              style={{
                cursor: item.related_type === 'main_order' ? 'pointer' : 'default',
                background: item.is_read ? 'transparent' : '#f6ffed',
                padding: '12px 16px',
                margin: '0 -16px',
              }}
              onClick={() => handleClickNotification(item)}
            >
              <List.Item.Meta
                avatar={
                  <Badge dot={!item.is_read}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: item.type === 'todo' ? '#1890ff' : '#52c41a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    >
                      {item.type === 'todo' ? '待' : '通'}
                    </div>
                  </Badge>
                }
                title={
                  <Space>
                    <span>{item.title}</span>
                    <Tag size="small">{NOTIFICATION_TYPE_NAMES[item.type] || item.type}</Tag>
                  </Space>
                }
                description={
                  <div>
                    <div>{item.content || '-'}</div>
                    <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                      {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                    </div>
                  </div>
                }
              />
              {!item.is_read && (
                <Button type="link" size="small" onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsRead(item.id);
                }}>
                  标记已读
                </Button>
              )}
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default Notifications;
