import { useEffect, useState } from 'react';
import { Card, List, Tag, Button, Empty, Drawer, message, Badge, Typography, Space } from 'antd';
import { MessageOutlined, CheckCircleOutlined, CheckCircleTwoTone } from '@ant-design/icons';
import api from '../api';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;

const categoryMap: Record<string, { color: string; text: string }> = {
  system: { color: 'blue', text: '系统' },
  bill: { color: 'orange', text: '缴费' },
  workorder: { color: 'purple', text: '工单' },
  order: { color: 'green', text: '订单' },
  activity: { color: 'cyan', text: '活动' },
};

export default function Messages() {
  const [list, setList] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [unread, setUnread] = useState(0);

  const loadData = () => {
    api.get('/messages').then((res) => setList(res.data));
    api.get('/messages/unread-count').then((res) => setUnread(res.data.count));
  };

  useEffect(() => { loadData(); }, []);

  const markAllRead = async () => {
    await api.post('/messages/read-all');
    message.success('已全部标记为已读');
    loadData();
  };

  const openDetail = async (msg: any) => {
    if (msg.status === 'unread') {
      await api.post(`/messages/${msg.id}/read`);
    }
    setDetail(msg);
    loadData();
  };

  return (
    <div>
      <Card
        title={
          <Space>
            <Badge count={unread}><MessageOutlined /></Badge>
            消息中心
          </Space>
        }
        style={{ borderRadius: 12 }}
        extra={<Button onClick={markAllRead} icon={<CheckCircleOutlined />}>全部已读</Button>}
      >
        {list.length === 0 ? (
          <Empty description="暂无消息" />
        ) : (
          <List
            dataSource={list}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                onClick={() => openDetail(item)}
                style={{
                  cursor: 'pointer',
                  padding: 16,
                  background: item.status === 'unread' ? '#f0f7ff' : 'transparent',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <List.Item.Meta
                  avatar={item.status === 'unread' ? <Badge dot><MessageOutlined style={{ fontSize: 24, color: '#1677ff' }} /></Badge> : <CheckCircleTwoTone style={{ fontSize: 24 }} />}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: item.status === 'unread' ? 600 : 400 }}>{item.title}</span>
                      <Tag color={categoryMap[item.category]?.color} style={{ marginLeft: 8 }}>
                        {categoryMap[item.category]?.text || item.category}
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ color: '#666', marginBottom: 4 }}>{item.content.substring(0, 80)}...</div>
                      <div style={{ color: '#999', fontSize: 12 }}>{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}</div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Drawer title="消息详情" open={!!detail} onClose={() => setDetail(null)} width={560}>
        {detail && (
          <div>
            <Tag color={categoryMap[detail.category]?.color}>{categoryMap[detail.category]?.text}</Tag>
            <Title level={4} style={{ marginTop: 16 }}>{detail.title}</Title>
            <div style={{ color: '#999', marginBottom: 24 }}>{dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss')}</div>
            <Paragraph style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{detail.content}</Paragraph>
            {detail.channels && (
              <div style={{ marginTop: 24, padding: 16, background: '#fafafa', borderRadius: 8 }}>
                <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>触达渠道：</div>
                <Space>
                  {detail.channels.inbox && <Tag color="blue">站内信</Tag>}
                  {detail.channels.sms && <Tag color="orange">短信</Tag>}
                  {detail.channels.template && <Tag color="purple">小程序模板消息</Tag>}
                </Space>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
