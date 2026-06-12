import { useState, useEffect } from 'react';
import { Card, List, Typography, Tag, Space, Button, Empty, App } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import api from '../api';
import { useAppStore } from '../store';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function Notifications() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { setUnreadCount } = useAppStore();
  const { message } = App.useApp();

  const fetchData = () => {
    setLoading(true);
    api.get('/notifications').then((d: any) => setList(d.notifications || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const markAll = async () => {
    await api.post('/notifications/read-all');
    message.success('已全部标记为已读');
    setList(l => l.map(x => ({ ...x, is_read: 1 })));
    setUnreadCount(0);
  };

  const markRead = async (id: string) => {
    await api.post(`/notifications/${id}/read`);
    setList(l => l.map(x => x.id === id ? { ...x, is_read: 1 } : x));
    setUnreadCount((prev: number) => Math.max(0, prev - 1));
  };

  return (
    <Card
      title={<Title level={5} style={{ margin: 0 }}><BellOutlined /> 消息通知</Title>}
      extra={<Button icon={<CheckOutlined />} onClick={markAll}>全部已读</Button>}
    >
      <List
        loading={loading}
        locale={{ emptyText: <Empty description="暂无消息" /> }}
        dataSource={list}
        renderItem={(n: any) => (
          <List.Item
            onClick={() => !n.is_read && markRead(n.id)}
            style={{ padding: '12px 0', cursor: n.is_read ? 'default' : 'pointer', background: !n.is_read ? '#f6ffed' : 'transparent', paddingLeft: 12, paddingRight: 12, borderRadius: 4 }}
          >
            <Space style={{ width: '100%' }}>
              {!n.is_read && <Tag color="red" style={{ marginRight: 0 }}>新</Tag>}
              <div style={{ flex: 1 }}>
                <div className="flex-between">
                  <div style={{ fontWeight: !n.is_read ? 600 : 400 }}>{n.title}</div>
                  <Text color="#999" style={{ fontSize: 12 }}>{dayjs(n.created_at).fromNow()}</Text>
                </div>
                {n.content && <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>{n.content}</div>}
              </div>
              {n.type && <Tag>{n.type}</Tag>}
            </Space>
          </List.Item>
        )}
      />
    </Card>
  );
}

function Text(props: any) { return <span {...props}>{props.children}</span>; }
