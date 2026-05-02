import React, { useState, useEffect } from 'react';
import { List, Card, Button, Tag, message, Space, Badge, Empty } from 'antd';
import { 
  CheckOutlined, 
  DeleteOutlined,
  BellOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { messageApi } from '../services/api';
import dayjs from 'dayjs';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await messageApi.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
      });

      if (response.data.success) {
        const result = response.data.data;
        setMessages(result.items || []);
        setPagination({
          current: result.page,
          pageSize: result.pageSize,
          total: result.total,
        });
      }
    } catch (error) {
      message.error('获取消息列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await messageApi.getUnreadCount();
      if (response.data.success) {
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
  }, [pagination.current, pagination.pageSize]);

  const handleMarkAsRead = async (id) => {
    try {
      const response = await messageApi.markAsRead(id);
      if (response.data.success) {
        message.success('已标记为已读');
        fetchMessages();
        fetchUnreadCount();
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await messageApi.markAllAsRead();
      if (response.data.success) {
        message.success(response.data.message || '已全部标记为已读');
        fetchMessages();
        fetchUnreadCount();
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'TODO':
        return <BellOutlined style={{ color: '#1890ff' }} />;
      case 'WARNING':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'NOTIFICATION':
        return <InfoCircleOutlined style={{ color: '#52c41a' }} />;
      default:
        return <InfoCircleOutlined />;
    }
  };

  const getMessageTypeTag = (type) => {
    switch (type) {
      case 'TODO':
        return <Tag color="blue">待办</Tag>;
      case 'WARNING':
        return <Tag color="orange">警告</Tag>;
      case 'NOTIFICATION':
        return <Tag color="green">通知</Tag>;
      default:
        return <Tag>系统</Tag>;
    }
  };

  return (
    <Card
      title={
        <Space>
          <span>消息中心</span>
          {unreadCount > 0 && (
            <Badge count={unreadCount} style={{ marginLeft: 8 }} />
          )}
        </Space>
      }
      extra={
        unreadCount > 0 ? (
          <Button type="link" onClick={handleMarkAllAsRead}>
            全部标为已读
          </Button>
        ) : null
      }
    >
      <List
        loading={loading}
        dataSource={messages}
        locale={{ emptyText: <Empty description="暂无消息" /> }}
        pagination={{
          ...pagination,
          showTotal: (total) => `共 ${total} 条消息`,
          onChange: (page, pageSize) => {
            setPagination({ ...pagination, current: page, pageSize });
          },
          onShowSizeChange: (current, size) => {
            setPagination({ current: 1, pageSize: size, total: pagination.total });
          },
        }}
        renderItem={(item) => (
          <List.Item
            actions={
              item.is_read === 0
                ? [
                    <Button
                      key="read"
                      type="link"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => handleMarkAsRead(item.id)}
                    >
                      标为已读
                    </Button>,
                  ]
                : []
            }
          >
            <List.Item.Meta
              avatar={getMessageTypeIcon(item.message_type)}
              title={
                <Space>
                  <span style={{ fontWeight: item.is_read === 0 ? 'bold' : 'normal' }}>
                    {item.content}
                  </span>
                  {item.is_read === 0 && (
                    <Badge dot />
                  )}
                  {getMessageTypeTag(item.message_type)}
                </Space>
              }
              description={
                <Space>
                  <span>订单号: {item.order_no || '-'}</span>
                  <span style={{ color: '#999' }}>
                    {dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')}
                  </span>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default Messages;
