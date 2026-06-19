import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Select, Row, Col, Tag, Pagination, Button, Spin, Empty, FloatButton } from 'antd';
import { MessageOutlined, LikeOutlined, PlusOutlined, EnvironmentOutlined } from '@ant-design/icons';
import api from '../api';

interface Topic {
  id: string;
  title: string;
  author: string;
  category: string;
  geoLabel: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

const categoryOptions = [
  { value: '', label: '全部分类' },
  { value: 'discussion', label: '讨论' },
  { value: 'secondhand', label: '二手' },
  { value: 'activity', label: '活动' },
  { value: 'complaint', label: '投诉' },
];

const categoryMap: Record<string, { label: string; color: string }> = {
  discussion: { label: '讨论', color: 'blue' },
  secondhand: { label: '二手', color: 'green' },
  activity: { label: '活动', color: 'orange' },
  complaint: { label: '投诉', color: 'red' },
};

const Topics: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/topics', {
        params: { category, search, page, pageSize: 10 },
      });
      setTopics(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setTopics([
        { id: '1', title: '小区花园改造建议征集', author: '张先生', category: 'discussion', geoLabel: '3号楼', likeCount: 12, commentCount: 8, createdAt: '2026-06-19T10:00:00Z' },
        { id: '2', title: '二手儿童推车转让', author: '李女士', category: 'secondhand', geoLabel: '5号楼', likeCount: 5, commentCount: 3, createdAt: '2026-06-19T09:00:00Z' },
        { id: '3', title: '周末亲子活动报名', author: '王先生', category: 'activity', geoLabel: '社区中心', likeCount: 28, commentCount: 15, createdAt: '2026-06-18T14:00:00Z' },
        { id: '4', title: '楼道灯不亮已一周', author: '赵女士', category: 'complaint', geoLabel: '2号楼', likeCount: 35, commentCount: 20, createdAt: '2026-06-18T08:00:00Z' },
      ]);
      setTotal(4);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [category, page]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Select
              value={category}
              onChange={(v) => { setCategory(v); setPage(1); }}
              options={categoryOptions}
              style={{ width: 140 }}
            />
          </Col>
          <Col flex="auto">
            <Input.Search
              placeholder="搜索话题"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSearch={fetchTopics}
              allowClear
            />
          </Col>
        </Row>
      </Card>

      {topics.length === 0 ? (
        <Empty description="暂无话题" />
      ) : (
        <Row gutter={[16, 16]}>
          {topics.map((topic) => (
            <Col span={12} key={topic.id}>
              <Card
                hoverable
                onClick={() => navigate(`/topics/${topic.id}`)}
                style={{ height: '100%' }}
              >
                <Card.Meta
                  title={
                    <span>
                      <Tag color={categoryMap[topic.category]?.color}>
                        {categoryMap[topic.category]?.label}
                      </Tag>
                      {topic.title}
                    </span>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        {topic.author} · {new Date(topic.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                      <div style={{ color: '#999' }}>
                        <EnvironmentOutlined /> {topic.geoLabel}
                      </div>
                    </div>
                  }
                />
                <div style={{ marginTop: 12, color: '#888' }}>
                  <span style={{ marginRight: 16 }}><LikeOutlined /> {topic.likeCount}</span>
                  <span><MessageOutlined /> {topic.commentCount}</span>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Pagination current={page} total={total} pageSize={10} onChange={setPage} />
      </div>

      <FloatButton
        icon={<PlusOutlined />}
        type="primary"
        onClick={() => navigate('/topics/create')}
        tooltip="发话题"
        style={{ right: 32, bottom: 80 }}
      />
    </div>
  );
};

export default Topics;
