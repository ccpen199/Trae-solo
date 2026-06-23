import { useEffect, useState } from 'react';
import { Card, List, Tag, Empty, Drawer, Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import api from '../api';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;

const categoryMap: Record<string, { color: string; text: string }> = {
  notice: { color: 'blue', text: '通知' },
  emergency: { color: 'red', text: '紧急' },
  general: { color: 'default', text: '公告' },
  activity: { color: 'green', text: '活动' },
};

export default function Announcements() {
  const [list, setList] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    api.get('/announcements').then((res) => setList(res.data));
  }, []);

  const openDetail = async (id: string) => {
    const res = await api.get(`/announcements/${id}`);
    setDetail(res.data);
  };

  return (
    <div>
      <Card title="小区公告" style={{ borderRadius: 12 }}>
        {list.length === 0 ? (
          <Empty />
        ) : (
          <List
            dataSource={list}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                onClick={() => openDetail(item.id)}
                style={{ cursor: 'pointer', padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}
              >
                <List.Item.Meta
                  avatar={<Tag color={categoryMap[item.category]?.color || 'default'}>{categoryMap[item.category]?.text || '公告'}</Tag>}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>{item.title}</span>
                      <span style={{ color: '#999', fontSize: 12 }}>{dayjs(item.createdAt).format('YYYY-MM-DD')}</span>
                    </div>
                  }
                  description={
                    <div style={{ color: '#999' }}>
                      <BellOutlined /> {item.viewCount} 次浏览
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Drawer title="公告详情" open={!!detail} onClose={() => setDetail(null)} width={640}>
        {detail && (
          <div>
            <Tag color={categoryMap[detail.category]?.color}>{categoryMap[detail.category]?.text}</Tag>
            <Title level={3} style={{ marginTop: 16 }}>{detail.title}</Title>
            <div style={{ color: '#999', marginBottom: 24 }}>
              发布于 {dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm')} · {detail.viewCount} 次浏览
            </div>
            <Paragraph style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{detail.content}</Paragraph>
          </div>
        )}
      </Drawer>
    </div>
  );
}
