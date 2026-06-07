import React, { useState, useEffect } from 'react';
import { Card, List, Tabs, Button, Badge, Spin, Tag, Empty, message } from 'antd';
import { BellOutlined, CheckOutlined, FileTextOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { notifications as notifApi } from '../api';
import dayjs from 'dayjs';

const typeIconMap = {
  case: <FileTextOutlined style={{ color: '#1890ff' }} />,
  certificate: <SafetyCertificateOutlined style={{ color: '#722ed1' }} />,
  system: <BellOutlined style={{ color: '#fa8c16' }} />,
};

const typeRouteMap = {
  case: '/cases',
  certificate: '/certificates',
};

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('unread');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab === 'unread') params.is_read = false;
      const res = await notifApi.getNotifications(params);
      const d = res.data?.data || res.data || {};
      const items = d.items || d.list || [];
      setData(items);
      if (activeTab === 'unread') {
        setUnreadCount(items.length);
      }
    } catch {
      message.error('获取通知列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notifApi.markRead(id);
      fetchData();
    } catch {
      message.error('操作失败');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notifApi.markAllRead();
      message.success('全部已读');
      fetchData();
    } catch {
      message.error('操作失败');
    }
  };

  const handleClick = (item) => {
    if (!item.is_read) {
      notifApi.markRead(item.id).catch(() => {});
    }
    const route = typeRouteMap[item.type];
    if (route) navigate(route);
  };

  return (
    <Card
      title="消息通知"
      extra={
        <Button onClick={handleMarkAllRead} icon={<CheckOutlined />}>
          全部已读
        </Button>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'unread',
            label: (
              <span>
                未读 <Badge count={unreadCount} size="small" />
              </span>
            ),
          },
          { key: 'all', label: '全部' },
        ]}
      />

      <Spin spinning={loading}>
        {data.length === 0 ? (
          <Empty description="暂无通知" />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={data}
            renderItem={(item) => (
              <List.Item
                style={{
                  cursor: 'pointer',
                  background: item.is_read ? 'transparent' : '#f0f5ff',
                  padding: '12px 16px',
                  borderRadius: 4,
                  marginBottom: 8,
                }}
                onClick={() => handleClick(item)}
                actions={[
                  !item.is_read && (
                    <Button type="link" size="small" key="read" onClick={(e) => { e.stopPropagation(); handleMarkRead(item.id); }}>
                      标记已读
                    </Button>
                  ),
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {typeIconMap[item.type] || <BellOutlined style={{ color: '#999' }} />}
                    </div>
                  }
                  title={
                    <span style={{ fontWeight: item.is_read ? 'normal' : 'bold' }}>
                      {item.title}
                    </span>
                  }
                  description={
                    <div>
                      <div style={{ color: '#666', marginBottom: 4 }}>{item.content}</div>
                      <div style={{ color: '#999', fontSize: 12 }}>
                        {item.created_at ? dayjs(item.created_at).format('YYYY-MM-DD HH:mm') : ''}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Spin>
    </Card>
  );
}
