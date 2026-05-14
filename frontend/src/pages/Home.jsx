import React, { useState, useEffect } from 'react';
import { 
  Layout, Input, Button, Card, Row, Col, List, Avatar, 
  Typography, Space, Tag, Tabs, FloatButton, Modal, Form,
  message, Spin
} from 'antd';
import { 
  SearchOutlined, PlusOutlined, AppstoreOutlined, 
  UnorderedListOutlined, UserOutlined, LogoutOutlined,
  TeamOutlined, FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { planetApi, topicApi } from '../api';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import dayjs from 'dayjs';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Meta } = Card;

const Home = () => {
  const [planets, setPlanets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [joinPlanetId, setJoinPlanetId] = useState(null);
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [joinForm] = Form.useForm();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const loadPlanets = async () => {
    setLoading(true);
    try {
      const params = { keyword: searchKeyword || undefined };
      if (activeTab === 'joined') {
        params.type = 'joined';
      } else if (activeTab === 'owned') {
        params.type = 'owned';
      }
      const result = await planetApi.getPlanets(params);
      setPlanets(result.data?.list || []);
    } catch (error) {
      console.error('加载星球列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlanets();
  }, [activeTab]);

  useEffect(() => {
    if (searchKeyword) {
      handleGlobalSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchKeyword]);

  const handleGlobalSearch = async () => {
    if (!searchKeyword.trim()) return;
    setIsSearching(true);
    try {
      const result = await topicApi.searchTopics({ keyword: searchKeyword });
      setSearchResults(result.data?.list || []);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreatePlanet = async (values) => {
    try {
      const result = await planetApi.createPlanet(values);
      message.success('创建星球成功');
      setIsCreateModalVisible(false);
      form.resetFields();
      loadPlanets();
      navigate(`/planet/${result.data.id}`);
    } catch (error) {
      console.error('创建星球失败:', error);
    }
  };

  const handleJoinPlanet = async (values) => {
    try {
      await planetApi.joinPlanet(joinPlanetId, values);
      message.success('加入星球成功');
      setIsJoinModalVisible(false);
      joinForm.resetFields();
      loadPlanets();
      navigate(`/planet/${joinPlanetId}`);
    } catch (error) {
      console.error('加入星球失败:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    message.success('已退出登录');
  };

  const getRandomColor = (name) => {
    const colors = ['#f50', '#2db7f5', '#87d068', '#108ee9', '#722ed1', '#eb2f96'];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            🌍 知识星球
          </Title>
          <Input.Search
            placeholder="全局搜索内容..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            style={{ width: 400 }}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            loading={isSearching}
          />
        </div>
        <Space size="middle">
          <Avatar icon={<UserOutlined />} />
          <Text strong>{user?.nickname || user?.username}</Text>
          <Button 
            type="text" 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
          >
            退出
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: '24px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        {searchKeyword ? (
          <Card title={`搜索结果: "${searchKeyword}"`} style={{ marginBottom: 16 }}>
            {isSearching ? (
              <Loading text="搜索中..." />
            ) : searchResults.length > 0 ? (
              <List
                dataSource={searchResults}
                renderItem={(item) => (
                  <List.Item
                    actions={[<Tag key="planet">{item.planet_name}</Tag>]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<FileTextOutlined />} />}
                      title={<a onClick={() => navigate(`/topic/${item.id}`)}>{item.title}</a>}
                      description={
                        <Space>
                          <Text type="secondary">{item.user_name}</Text>
                          <Text type="secondary">{dayjs(item.created_at).format('YYYY-MM-DD')}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <EmptyState description="未找到相关内容" />
            )}
          </Card>
        ) : (
          <>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 16
            }}>
              <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <Tabs.TabPane tab="全部星球" key="all" />
                <Tabs.TabPane tab="我加入的" key="joined" />
                <Tabs.TabPane tab="我创建的" key="owned" />
              </Tabs>
              <Space>
                <Button 
                  type={viewMode === 'grid' ? 'primary' : 'default'}
                  icon={<AppstoreOutlined />}
                  onClick={() => setViewMode('grid')}
                >
                  宫格
                </Button>
                <Button 
                  type={viewMode === 'list' ? 'primary' : 'default'}
                  icon={<UnorderedListOutlined />}
                  onClick={() => setViewMode('list')}
                >
                  列表
                </Button>
                <Button 
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsCreateModalVisible(true)}
                >
                  创建星球
                </Button>
              </Space>
            </div>

            {loading ? (
              <Loading />
            ) : planets.length > 0 ? (
              viewMode === 'grid' ? (
                <Row gutter={[16, 16]}>
                  {planets.map((planet) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={planet.id}>
                      <Card
                        hoverable
                        onClick={() => planet.is_joined && navigate(`/planet/${planet.id}`)}
                        actions={planet.is_joined ? [] : [
                          <Button 
                            type="primary" 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setJoinPlanetId(planet.id);
                              setIsJoinModalVisible(true);
                            }}
                          >
                            加入星球
                          </Button>
                        ]}
                      >
                        <Meta
                          avatar={
                            <Avatar 
                              size={48} 
                              style={{ backgroundColor: getRandomColor(planet.name) }}
                            >
                              {planet.name?.charAt(0)}
                            </Avatar>
                          }
                          title={planet.name}
                          description={
                            <div>
                              <Text type="secondary" ellipsis style={{ display: 'block' }}>
                                {planet.description || '暂无描述'}
                              </Text>
                              <div style={{ marginTop: 8 }}>
                                <Space size="small">
                                  <Tag icon={<TeamOutlined />} color="blue">
                                    {planet.member_count} 成员
                                  </Tag>
                                  <Tag icon={<FileTextOutlined />} color="green">
                                    {planet.topic_count} 主题
                                  </Tag>
                                </Space>
                              </div>
                            </div>
                          }
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <List
                  dataSource={planets}
                  renderItem={(planet) => (
                    <List.Item
                      actions={planet.is_joined ? [
                        <Button type="primary" onClick={() => navigate(`/planet/${planet.id}`)}>
                          进入星球
                        </Button>
                      ] : [
                        <Button 
                          type="primary" 
                          onClick={() => {
                            setJoinPlanetId(planet.id);
                            setIsJoinModalVisible(true);
                          }}
                        >
                          加入星球
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            size={48} 
                            style={{ backgroundColor: getRandomColor(planet.name) }}
                          >
                            {planet.name?.charAt(0)}
                          </Avatar>
                        }
                        title={planet.name}
                        description={
                          <Space direction="vertical" size={4}>
                            <Text type="secondary">{planet.description}</Text>
                            <Space>
                              <Tag icon={<TeamOutlined />}>{planet.member_count} 成员</Tag>
                              <Tag icon={<FileTextOutlined />}>{planet.topic_count} 主题</Tag>
                              <Text type="secondary">创建者: {planet.owner_name}</Text>
                            </Space>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )
            ) : (
              <EmptyState 
                description="还没有星球，快来创建第一个星球吧"
                actionText="创建星球"
                onAction={() => setIsCreateModalVisible(true)}
              />
            )}
          </>
        )}
      </Content>

      <FloatButton 
        type="primary" 
        icon={<PlusOutlined />} 
        onClick={() => setIsCreateModalVisible(true)}
        tooltip="创建星球"
      />

      <Modal
        title="创建新星球"
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreatePlanet}>
          <Form.Item
            name="name"
            label="星球名称"
            rules={[{ required: true, message: '请输入星球名称' }]}
          >
            <Input placeholder="给你的星球起个名字" size="large" />
          </Form.Item>
          <Form.Item
            name="description"
            label="星球简介"
          >
            <Input.TextArea 
              placeholder="简单介绍一下这个星球" 
              rows={4}
            />
          </Form.Item>
          <Form.Item
            name="join_type"
            label="加入方式"
            initialValue="free"
          >
            <select className="ant-input" style={{ height: 40 }}>
              <option value="free">自由加入</option>
              <option value="invite">邀请制</option>
              <option value="paid">付费加入</option>
            </select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              创建星球
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="加入星球"
        open={isJoinModalVisible}
        onCancel={() => {
          setIsJoinModalVisible(false);
          joinForm.resetFields();
        }}
        footer={null}
      >
        <Form form={joinForm} layout="vertical" onFinish={handleJoinPlanet}>
          <Form.Item
            name="invite_code"
            label="邀请码（可选）"
          >
            <Input placeholder="如有邀请码请填写" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              确认加入
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Home;
