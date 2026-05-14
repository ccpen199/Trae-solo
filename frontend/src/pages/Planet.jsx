import React, { useState, useEffect } from 'react';
import { 
  Layout, Button, Card, List, Avatar, Typography, 
  Space, Tag, Tabs, Input, Modal, Form, message,
  Divider
} from 'antd';
import { 
  PlusOutlined, ArrowLeftOutlined, SearchOutlined,
  MessageOutlined, EyeOutlined,
  GiftOutlined, CopyOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { planetApi, topicApi } from '../api';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;

const Planet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [planet, setPlanet] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [inviteCodes, setInviteCodes] = useState([]);
  const [form] = Form.useForm();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const loadPlanet = async () => {
    try {
      const result = await planetApi.getPlanet(id);
      setPlanet(result.data);
    } catch (error) {
      console.error('加载星球信息失败:', error);
    }
  };

  const loadTopics = async () => {
    setLoading(true);
    try {
      const params = { planet_id: id };
      if (searchKeyword) {
        params.keyword = searchKeyword;
      }
      if (activeTab === 'question') {
        params.topic_type = 'question';
      }
      const result = await topicApi.getTopics(params);
      setTopics(result.data?.list || []);
    } catch (error) {
      console.error('加载主题失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInviteCodes = async () => {
    try {
      const result = await planetApi.getInviteCodes(id);
      setInviteCodes(result.data || []);
    } catch (error) {
      console.error('加载邀请码失败:', error);
    }
  };

  useEffect(() => {
    loadPlanet();
    loadTopics();
  }, [id, activeTab]);

  useEffect(() => {
    if (searchKeyword) {
      loadTopics();
    }
  }, [searchKeyword]);

  const handleCreateTopic = async (values) => {
    try {
      await topicApi.createTopic({
        ...values,
        planet_id: id,
        is_question: values.topic_type === 'question' ? 1 : 0
      });
      message.success('发布成功');
      setIsCreateModalVisible(false);
      form.resetFields();
      loadTopics();
    } catch (error) {
      console.error('发布失败:', error);
    }
  };

  const handleCreateInviteCode = async () => {
    try {
      const result = await planetApi.createInviteCode(id, { max_count: 10 });
      message.success('生成邀请码成功');
      loadInviteCodes();
    } catch (error) {
      console.error('生成邀请码失败:', error);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    message.success('邀请码已复制');
  };

  const getRandomColor = (name) => {
    const colors = ['#f50', '#2db7f5', '#87d068', '#108ee9', '#722ed1', '#eb2f96'];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  const isOwner = planet?.owner_id === user?.id;

  if (!planet) {
    return <Loading />;
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 16
      }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
        >
          返回
        </Button>
        <Avatar 
          size={40} 
          style={{ backgroundColor: getRandomColor(planet.name) }}
        >
          {planet.name?.charAt(0)}
        </Avatar>
        <div>
          <Title level={4} style={{ margin: 0 }}>{planet.name}</Title>
          <Text type="secondary">{planet.description}</Text>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Space>
            <Input.Search
              placeholder="搜索星球内容..."
              allowClear
              size="middle"
              style={{ width: 250 }}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            {isOwner && (
              <Button 
                icon={<GiftOutlined />}
                onClick={() => {
                  setIsInviteModalVisible(true);
                  loadInviteCodes();
                }}
              >
                邀请有赏
              </Button>
            )}
          </Space>
        </div>
      </Header>

      <Layout>
        <Sider 
          width={280} 
          style={{ background: '#fff', padding: 20 }}
          theme="light"
        >
          <Card size="small" style={{ marginBottom: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Avatar 
                size={80} 
                style={{ backgroundColor: getRandomColor(planet.name) }}
              >
                {planet.name?.charAt(0)}
              </Avatar>
              <Title level={4} style={{ marginTop: 12, marginBottom: 4 }}>
                {planet.name}
              </Title>
              <Text type="secondary">{planet.description}</Text>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>{planet.member_count}</div>
                <Text type="secondary">成员</Text>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>{planet.topic_count}</div>
                <Text type="secondary">主题</Text>
              </div>
            </div>
          </Card>

          <Card size="small" title="星球主">
            <Space>
              <Avatar>{planet.owner_name?.charAt(0)}</Avatar>
              <Text strong>{planet.owner_name}</Text>
            </Space>
          </Card>
        </Sider>

        <Content style={{ padding: 20 }}>
          <Card>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 16
            }}>
              <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <Tabs.TabPane tab="全部主题" key="all" />
                <Tabs.TabPane tab="提问" key="question" />
              </Tabs>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalVisible(true)}
              >
                发表主题
              </Button>
            </div>

            {loading ? (
              <Loading />
            ) : topics.length > 0 ? (
              <List
                itemLayout="vertical"
                dataSource={topics}
                renderItem={(item) => (
                  <List.Item
                    style={{ cursor: 'pointer', padding: 16, borderBottom: '1px solid #f0f0f0' }}
                    onClick={() => navigate(`/topic/${item.id}`)}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Avatar size="small">{item.user_name?.charAt(0)}</Avatar>
                        <Text strong>{item.user_name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(item.created_at).fromNow()}
                        </Text>
                        {item.is_question && <Tag color="orange">提问</Tag>}
                      </div>
                      <Title level={4} style={{ marginBottom: 8 }}>{item.title}</Title>
                      <Paragraph ellipsis={{ rows: 3 }} type="secondary">
                        {item.content}
                      </Paragraph>
                      <div style={{ display: 'flex', gap: 16, color: '#999', fontSize: 14 }}>
                        <span><EyeOutlined /> {item.view_count || 0} 浏览</span>
                        <span><MessageOutlined /> {item.comment_count || 0} 评论</span>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <EmptyState description="暂无主题，快来发表第一个主题吧" />
            )}
          </Card>
        </Content>
      </Layout>

      <Modal
        title="发表新主题"
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTopic}>
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="输入主题标题" size="large" />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <Input.TextArea 
              placeholder="输入详细内容" 
              rows={6}
            />
          </Form.Item>
          <Form.Item
            name="topic_type"
            label="类型"
            initialValue="normal"
          >
            <select className="ant-input" style={{ height: 40 }}>
              <option value="normal">普通主题</option>
              <option value="question">提问</option>
            </select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              发表
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="邀请有赏"
        open={isInviteModalVisible}
        onCancel={() => setIsInviteModalVisible(false)}
        footer={null}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={handleCreateInviteCode} icon={<PlusOutlined />}>
            生成新邀请码
          </Button>
        </div>
        {inviteCodes.length > 0 ? (
          <List
            dataSource={inviteCodes}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button 
                    type="text" 
                    icon={<CopyOutlined />} 
                    onClick={() => handleCopyCode(item.code)}
                  >
                    复制
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={<Text code>{item.code}</Text>}
                  description={`已使用: ${item.used_count}/${item.max_count}`}
                />
              </List.Item>
            )}
          />
        ) : (
          <EmptyState description="暂无邀请码，点击上方按钮生成" />
        )}
      </Modal>
    </Layout>
  );
};

export default Planet;
