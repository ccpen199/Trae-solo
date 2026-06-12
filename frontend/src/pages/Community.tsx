import { useState, useEffect } from 'react';
import { Card, List, Avatar, Tag, Space, Typography, Button, Input, Modal, Form, Select, Empty, App, Row, Col, Statistic, Progress } from 'antd';
import { TeamOutlined, PlusOutlined, LikeOutlined, MessageOutlined, EyeOutlined, TrophyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAppStore } from '../store';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function Community() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [list, setList] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [tag, setTag] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/community/topics', { params: { keyword, tag } }),
      api.get('/community/stats/summary'),
      api.get('/community/ranking/users')
    ]).then(([topics, statsData, rankingData]: any[]) => {
      setList(topics.topics || []);
      setStats(statsData.stats || {});
      setRanking(rankingData.ranking || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [keyword, tag]);

  const handlePublish = async (values: any) => {
    try {
      const data = await api.post('/community/topics', values) as any;
      if (data.warning) message.warning(data.warning);
      else message.success('发布成功');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (e: any) {
      message.error(e.error || '发布失败');
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <div className="flex-between">
        <Title level={4} style={{ margin: 0 }}><TeamOutlined style={{ color: '#1677ff' }} /> 职场成长社区</Title>
        <Space>
          <Input prefix={<MessageOutlined />} placeholder="搜索话题..." value={keyword} onChange={e => setKeyword(e.target.value)} style={{ width: 200 }} allowClear />
          <Select placeholder="标签筛选" value={tag} onChange={setTag} allowClear style={{ width: 140 }}>
            <Option value="求职">求职经验</Option>
            <Option value="技能">技能提升</Option>
            <Option value="职场">职场心得</Option>
            <Option value="面试">面试分享</Option>
            <Option value="行业">行业动态</Option>
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>发布话题</Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col xs={24} md={18}>
          <Card>
            <List
              loading={loading}
              locale={{ emptyText: '暂无话题，快来发布第一个吧！' }}
              dataSource={list}
              renderItem={(t: any) => (
                <List.Item
                  className="card-hover"
                  onClick={() => navigate(`/community/topics/${t.id}`)}
                  style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                  actions={[
                    <span><EyeOutlined /> {t.views}</span>,
                    <span><LikeOutlined /> {t.likes}</span>,
                    <span><MessageOutlined /> {t.comments}</span>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar src={t.avatar}>{t.user_name?.[0]}</Avatar>}
                    title={
                      <Space>
                        <Text strong style={{ fontSize: 16 }}>{t.title}</Text>
                        {t.status !== 'approved' && <Tag color="orange">待审核</Tag>}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space wrap>
                          {(t.tags || []).map((x: string) => <Tag key={x}>{x}</Tag>)}
                        </Space>
                        <div style={{ color: '#999', fontSize: 12 }}>
                          {t.user_name} · {dayjs(t.created_at).fromNow()}
                        </div>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card title={<span><TrophyOutlined style={{ color: '#faad14' }} /> 社区达人榜</span>}>
            <List
              dataSource={ranking.slice(0, 10)}
              renderItem={(u: any, i) => (
                <List.Item>
                  <Space>
                    <Tag color={i < 3 ? ['gold', 'silver', 'bronze'][i] as any : 'default'} style={{ fontSize: 14, fontWeight: 'bold' }}>#{i + 1}</Tag>
                    <Avatar size={28} src={u.avatar}>{u.name?.[0]}</Avatar>
                    <Text>{u.name}</Text>
                  </Space>
                  <Tag color="gold">{u.points} 积分</Tag>
                </List.Item>
              )}
            />
          </Card>

          <Card title="社区数据" style={{ marginTop: 16 }}>
            <Row gutter={8}>
              <Col span={12}><Statistic title="话题数" value={stats.topicCount || 0} /></Col>
              <Col span={12}><Statistic title="评论数" value={stats.commentCount || 0} /></Col>
            </Row>
            {user && (
              <div style={{ marginTop: 16 }}>
                <div className="flex-between" style={{ marginBottom: 4 }}>
                  <Text type="secondary">我的积分</Text>
                  <Text strong>{user.points || 0}</Text>
                </div>
                <Progress percent={Math.min(100, ((user.points || 0) % 1000))} />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="发布新话题"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handlePublish}>
          <Form.Item name="title" label="话题标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="一个吸引人的标题..." maxLength={100} />
          </Form.Item>
          <Form.Item name="tags" label="话题标签">
            <Select mode="tags" placeholder="选择或输入标签">
              <Option value="求职">求职经验</Option>
              <Option value="技能">技能提升</Option>
              <Option value="职场">职场心得</Option>
              <Option value="面试">面试分享</Option>
              <Option value="行业">行业动态</Option>
            </Select>
          </Form.Item>
          <Form.Item name="content" label="话题内容" rules={[{ required: true, message: '请输入内容' }]}>
            <TextArea rows={8} placeholder="分享你的经验、心得..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">发布</Button>
              <Button onClick={() => setModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
