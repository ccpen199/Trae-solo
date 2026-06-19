import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Select, Row, Col, Tag, Pagination, Spin, Empty, Rate } from 'antd';
import { EnvironmentOutlined, StarFilled } from '@ant-design/icons';
import api from '../api';

interface AggregatedTopic {
  id: string;
  title: string;
  author: string;
  communityName: string;
  category: string;
  geoLabel: string;
  likeCount: number;
  commentCount: number;
  recommendationScore: number;
  createdAt: string;
}

const categoryMap: Record<string, { label: string; color: string }> = {
  discussion: { label: '讨论', color: 'blue' },
  secondhand: { label: '二手', color: 'green' },
  activity: { label: '活动', color: 'orange' },
  complaint: { label: '投诉', color: 'red' },
};

const AggregatedTopics: React.FC = () => {
  const [topics, setTopics] = useState<AggregatedTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [community, setCommunity] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/topics/aggregated', {
        params: { community, page, pageSize: 10 },
      });
      setTopics(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setTopics([
        { id: '1', title: '全城亲子活动日报名', author: '陈先生', communityName: '锦江社区', category: 'activity', geoLabel: '社区中心', likeCount: 58, commentCount: 32, recommendationScore: 0.95, createdAt: '2026-06-19T10:00:00Z' },
        { id: '2', title: '二手书交换活动', author: '刘女士', communityName: '武侯社区', category: 'secondhand', geoLabel: '图书角', likeCount: 42, commentCount: 18, recommendationScore: 0.88, createdAt: '2026-06-19T09:00:00Z' },
        { id: '3', title: '垃圾分类倡议书', author: '孙先生', communityName: '高新社区', category: 'discussion', geoLabel: '全社区', likeCount: 35, commentCount: 25, recommendationScore: 0.82, createdAt: '2026-06-18T14:00:00Z' },
      ]);
      setTotal(3);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [community, page]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Select
          value={community}
          onChange={(v) => { setCommunity(v); setPage(1); }}
          style={{ width: 200 }}
          options={[
            { value: '', label: '全部社区' },
            { value: 'jinjiang', label: '锦江社区' },
            { value: 'wuhou', label: '武侯社区' },
            { value: 'gaoxin', label: '高新社区' },
            { value: 'qingyang', label: '青羊社区' },
          ]}
          placeholder="按社区筛选"
        />
      </Card>

      {topics.length === 0 ? (
        <Empty description="暂无跨区热议" />
      ) : (
        <Row gutter={[16, 16]}>
          {topics.map((topic) => (
            <Col span={8} key={topic.id}>
              <Card hoverable onClick={() => navigate(`/topics/${topic.id}`)} style={{ height: '100%' }}>
                <div style={{ marginBottom: 8 }}>
                  <Tag color="purple">{topic.communityName}</Tag>
                  <Tag color={categoryMap[topic.category]?.color}>
                    {categoryMap[topic.category]?.label}
                  </Tag>
                </div>
                <Card.Meta
                  title={topic.title}
                  description={
                    <div>
                      <div style={{ marginBottom: 4 }}>{topic.author} · {new Date(topic.createdAt).toLocaleDateString('zh-CN')}</div>
                      <div style={{ color: '#999' }}><EnvironmentOutlined /> {topic.geoLabel}</div>
                    </div>
                  }
                />
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#888' }}>
                    👍 {topic.likeCount} · 💬 {topic.commentCount}
                  </span>
                  <span style={{ fontSize: 12 }}>
                    <StarFilled style={{ color: '#faad14' }} /> 推荐度
                    <Rate disabled value={Math.round(topic.recommendationScore * 5)} style={{ fontSize: 12, marginLeft: 4 }} />
                  </span>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Pagination current={page} total={total} pageSize={10} onChange={setPage} />
      </div>
    </div>
  );
};

export default AggregatedTopics;
