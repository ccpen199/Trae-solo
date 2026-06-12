import { useState, useEffect } from 'react';
import { Card, List, Avatar, Typography, Progress, Space, Tag, Empty } from 'antd';
import { BookOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function MyLearning() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/lms/my/progress').then((d: any) => setProgress(d.progress || [])).finally(() => setLoading(false));
  }, []);

  return (
    <Card title={<Title level={5} style={{ margin: 0 }}><BookOutlined /> 我的学习</Title>}>
      <List
        loading={loading}
        locale={{ emptyText: <Empty description="还没有学习任何课程" /> }}
        dataSource={progress}
        renderItem={(p: any) => (
          <List.Item
            className="card-hover"
            onClick={() => navigate(`/courses/${p.id}`)}
            style={{ padding: '16px 0', cursor: 'pointer' }}
          >
            <List.Item.Meta
              avatar={<Avatar size={56} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} icon={<BookOutlined />} />}
              title={<Text strong style={{ fontSize: 16 }}>{p.title}</Text>}
              description={
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Progress percent={p.progress || 0} />
                  <div>
                    <Tag><ClockCircleOutlined /> {p.total_lessons || 0}课时</Tag>
                    <Tag color="green">已完成 {p.completed_lessons || 0} 课时</Tag>
                    {p.last_study_at && <Text type="secondary">上次学习：{dayjs(p.last_study_at).fromNow()}</Text>}
                  </div>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
