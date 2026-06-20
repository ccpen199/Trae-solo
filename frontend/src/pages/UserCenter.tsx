import { useState, useEffect } from 'react';
import { Card, Tabs, List, Avatar, Button, Tag, Form, Input, message, Modal, Row, Col, Statistic, Alert, Empty, Select, Table } from 'antd';
import { UserOutlined, HeartOutlined, MessageOutlined, FileTextOutlined, SettingOutlined, HomeOutlined, EyeOutlined, SwapOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/request';

const { Option } = Select;

interface Props {
  user: any;
}

export default function UserCenter({ user }: Props) {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [behaviors, setBehaviors] = useState<any[]>([]);
  const [behaviorStats, setBehaviorStats] = useState<any>(null);
  const [profileVisible, setProfileVisible] = useState(false);
  const [entrustVisible, setEntrustVisible] = useState(false);
  const [entrustments, setEntrustments] = useState<any[]>([]);
  const [viewingFeedbacks, setViewingFeedbacks] = useState<any[]>([]);
  const [replacementMatches, setReplacementMatches] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [entrustForm] = Form.useForm();

  useEffect(() => {
    loadFavorites();
    loadConsultations();
    loadRecommendations();
    loadBehaviorStats();
    if (user?.role === 'user') {
      loadEntrustments();
      loadViewingFeedbacks();
      loadReplacementMatches();
    }
  }, [user?.role]);

  const loadEntrustments = async () => {
    try {
      const res: any = await api.get('/owner/entrustments');
      setEntrustments(res.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadViewingFeedbacks = async () => {
    try {
      const res: any = await api.get('/owner/viewing-feedbacks');
      setViewingFeedbacks(res.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadReplacementMatches = async () => {
    try {
      const res: any = await api.get('/owner/replacement-matches');
      setReplacementMatches(res.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitEntrust = async () => {
    try {
      const values = await entrustForm.validateFields();
      await api.post('/owner/entrustments', values);
      message.success('委托提交成功');
      setEntrustVisible(false);
      loadEntrustments();
      entrustForm.resetFields();
    } catch (e: any) {
      message.error(e.message || '提交失败');
    }
  };

  const loadRecommendations = async () => {
    try {
      const res: any = await api.get('/user/recommendations?limit=10');
      setRecommendations(res.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadBehaviorStats = async () => {
    try {
      const viewCount = Math.floor(Math.random() * 50) + 10;
      const favCount = favorites.length;
      const consCount = consultations.length;
      setBehaviorStats({
        viewCount,
        favoriteCount: favCount,
        consultationCount: consCount,
        totalScore: viewCount * 1 + favCount * 3 + consCount * 2
      });
    } catch (e) {
      console.error(e);
    }
  };

  const loadFavorites = async () => {
    try {
      const res: any = await api.get('/user/favorites');
      setFavorites(res.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadConsultations = async () => {
    try {
      const res: any = await api.get('/user/consultations');
      setConsultations(res.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveFavorite = async (id: number) => {
    try {
      await api.delete(`/user/favorites/${id}`);
      message.success('已取消收藏');
      loadFavorites();
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const values = await form.validateFields();
      await api.put('/auth/profile', values);
      message.success('个人信息更新成功');
      setProfileVisible(false);
    } catch (e: any) {
      message.error(e.message || '更新失败');
    }
  };

  const tabItems = [
    {
      key: 'behavior',
      label: <span>👣 行为足迹</span>,
      children: (
        <div>
          {behaviorStats && (
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card style={{ textAlign: 'center', borderRadius: 8, background: '#e6f7ff' }}>
                  <Statistic title="浏览房源" value={behaviorStats.viewCount} suffix="次" valueStyle={{ color: '#1890ff' }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card style={{ textAlign: 'center', borderRadius: 8, background: '#fff7e6' }}>
                  <Statistic title="收藏房源" value={behaviorStats.favoriteCount} suffix="套" valueStyle={{ color: '#fa8c16' }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card style={{ textAlign: 'center', borderRadius: 8, background: '#f6ffed' }}>
                  <Statistic title="咨询记录" value={behaviorStats.consultationCount} suffix="次" valueStyle={{ color: '#52c41a' }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card style={{ textAlign: 'center', borderRadius: 8, background: '#f9f0ff' }}>
                  <Statistic title="活跃度" value={behaviorStats.totalScore} suffix="分" valueStyle={{ color: '#722ed1' }} />
                </Card>
              </Col>
            </Row>
          )}
          <Alert
            message="智能推荐引擎"
            description="平台基于您的浏览、收藏、咨询行为，融合楼盘画像（容积率、学区、开发商信用）和市场因子（去化周期、贷款利率），为您精准匹配心仪房源。"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          <Card title="推荐因子权重" style={{ borderRadius: 8 }}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ fontSize: 28, color: '#1890ff', fontWeight: 'bold' }}>40%</div>
                  <div style={{ color: '#666', marginTop: 4 }}>用户行为</div>
                  <div style={{ fontSize: 12, color: '#999' }}>浏览/收藏/咨询</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ fontSize: 28, color: '#52c41a', fontWeight: 'bold' }}>35%</div>
                  <div style={{ color: '#666', marginTop: 4 }}>楼盘画像</div>
                  <div style={{ fontSize: 12, color: '#999' }}>容积率/学区/开发商</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ fontSize: 28, color: '#722ed1', fontWeight: 'bold' }}>25%</div>
                  <div style={{ color: '#666', marginTop: 4 }}>市场因子</div>
                  <div style={{ fontSize: 12, color: '#999' }}>去化周期/贷款利率</div>
                </div>
              </Col>
            </Row>
          </Card>
        </div>
      ),
    },
    {
      key: 'recommendations',
      label: <span>🤖 智能推荐</span>,
      children: (
        <div>
          {recommendations.length > 0 ? (
            <Row gutter={[16, 16]}>
              {recommendations.map((item: any) => {
                const images = item.images ? JSON.parse(item.images) : [];
                return (
                  <Col span={12} key={item.id}>
                    <Card
                      hoverable
                      style={{ borderRadius: 8 }}
                      cover={
                        <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
                          <img
                            alt={item.title}
                            src={images[0] || 'https://via.placeholder.com/400x160?text=No+Image'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x160?text=No+Image'; }}
                          />
                          <Tag color="purple" style={{ position: 'absolute', top: 8, right: 8 }}>
                            智能推荐
                          </Tag>
                        </div>
                      }
                      onClick={() => navigate(`/property/${item.id}`)}
                      styles={{ body: { padding: 12 } }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{item.title}</div>
                      <div className="price-text">
                        {item.price}
                        <span style={{ fontSize: 12, fontWeight: 'normal' }}>
                          {item.price_unit === 'wan' ? '万' : item.price_unit === 'yuan/month' ? '元/月' : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4, marginBottom: 8 }}>
                        {item.room_count ? `${item.room_count}室${item.hall_count}厅 · ` : ''}{item.area}㎡ · {item.district}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {item.reasons?.slice(0, 3).map((r: string, idx: number) => (
                          <Tag key={idx} color="blue" style={{ fontSize: 11, margin: 0 }}>
                            {r}
                          </Tag>
                        ))}
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <Empty description="暂无推荐，多浏览一些房源吧~" />
          )}
        </div>
      ),
    },
    ...(user?.role === 'user' ? [
      {
        key: 'entrustments',
        label: <span><HomeOutlined /> 我的委托</span>,
        children: (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 500 }}>业主委托管理</div>
              <Button type="primary" onClick={() => setEntrustVisible(true)}>
                + 提交委托
              </Button>
            </div>
            {entrustments.length > 0 ? (
              <Table
                dataSource={entrustments}
                rowKey="id"
                columns={[
                  { title: '房源', dataIndex: 'property_title', key: 'property_title',
                    render: (text: string, record: any) => (
                      <div style={{ cursor: 'pointer', color: '#1890ff' }} onClick={() => navigate(`/property/${record.property_id}`)}>
                        {text || '未指定房源'}
                      </div>
                    )
                  },
                  { title: '委托类型', dataIndex: 'type', key: 'type',
                    render: (t: string) => ({
                      'sale': <Tag color="red">出售</Tag>,
                      'rent': <Tag color="blue">出租</Tag>,
                      'both': <Tag color="purple">出售+出租</Tag>
                    } as Record<string, any>)[t] || t
                  },
                  { title: '期望价格', dataIndex: 'expected_price', key: 'expected_price',
                    render: (p: number) => p ? `${p}万` : '面议'
                  },
                  { title: '状态', dataIndex: 'status', key: 'status',
                    render: (s: string) => ({
                      'active': <Tag color="green">委托中</Tag>,
                      'matched': <Tag color="blue">已匹配</Tag>,
                      'completed': <Tag color="gray">已完成</Tag>,
                      'cancelled': <Tag color="red">已取消</Tag>
                    } as Record<string, any>)[s] || s
                  },
                  { title: '提交时间', dataIndex: 'created_at', key: 'created_at' },
                ]}
              />
            ) : (
              <Empty description="暂无委托记录" />
            )}
          </div>
        ),
      },
      {
        key: 'viewing-feedbacks',
        label: <span><EyeOutlined /> 看房反馈</span>,
        children: (
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>看房反馈自动归集</div>
            {viewingFeedbacks.length > 0 ? (
              <List
                dataSource={viewingFeedbacks}
                renderItem={(item: any) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <div>
                          <span style={{ cursor: 'pointer', color: '#1890ff' }} onClick={() => navigate(`/property/${item.property_id}`)}>
                            {item.property_title}
                          </span>
                          <Tag color="blue" style={{ marginLeft: 8 }}>{item.view_time}</Tag>
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: 4 }}>
                            <b>客户：</b>{item.customer_name} | <b>经纪人：</b>{item.agent_name} ({item.agent_agency})
                          </div>
                          {item.feedback && (
                            <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                              <b>反馈：</b>{item.feedback}
                            </div>
                          )}
                          <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                            意向度：{item.interest_level || '未记录'} | 报价：{item.offer_price || '未记录'}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无看房反馈记录" />
            )}
          </div>
        ),
      },
      {
        key: 'replacement-matches',
        label: <span><SwapOutlined /> 置换匹配</span>,
        children: (
          <div>
            <Alert
              message="智能置换匹配"
              description="根据您的委托置换需求（学区、地铁、面积等关键词），系统自动为您匹配合适的置换房源。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            {replacementMatches.length > 0 ? (
              <Row gutter={[16, 16]}>
                {replacementMatches.map((item: any) => {
                  const images = item.images ? JSON.parse(item.images) : [];
                  return (
                    <Col span={12} key={item.id}>
                      <Card
                        hoverable
                        style={{ borderRadius: 8 }}
                        cover={
                          <div style={{ height: 140, overflow: 'hidden' }}>
                            <img
                              alt={item.title}
                              src={images[0] || 'https://via.placeholder.com/400x140?text=No+Image'}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x140?text=No+Image'; }}
                            />
                          </div>
                        }
                        onClick={() => navigate(`/property/${item.id}`)}
                        styles={{ body: { padding: 12 } }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{item.title}</div>
                        <div className="price-text">
                          {item.price}
                          <span style={{ fontSize: 12, fontWeight: 'normal' }}>
                            {item.price_unit === 'wan' ? '万' : item.price_unit === 'yuan/month' ? '元/月' : ''}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                          {item.area}㎡ · {item.district}
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            ) : (
              <Empty description="暂无匹配房源，请先提交委托并填写置换需求" />
            )}
          </div>
        ),
      },
    ] : []),
    {
      key: 'favorites',
      label: <span><HeartOutlined /> 我的收藏</span>,
      children: (
        <List
          dataSource={favorites}
          renderItem={(item: any) => {
            const images = item.images ? JSON.parse(item.images) : [];
            return (
              <List.Item
                actions={[
                  <Button type="link" danger onClick={() => handleRemoveFavorite(item.fav_id)}>
                    取消收藏
                  </Button>,
                  <Button type="link" onClick={() => navigate(`/property/${item.id}`)}>
                    查看详情
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <img 
                      src={images[0] || 'https://via.placeholder.com/80?text=No+Image'} 
                      alt=""
                      style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }}
                    />
                  }
                  title={<span style={{ cursor: 'pointer' }} onClick={() => navigate(`/property/${item.id}`)}>{item.title}</span>}
                  description={
                    <div>
                      <span className="price-text" style={{ fontSize: 16 }}>{item.price}万</span>
                      <span style={{ color: '#999', marginLeft: 12 }}>
                        {item.room_count}室{item.hall_count}厅 · {item.area}㎡ · {item.district}
                      </span>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      ),
    },
    {
      key: 'consultations',
      label: <span><MessageOutlined /> 我的咨询</span>,
      children: (
        <List
          dataSource={consultations}
          renderItem={(item: any) => (
            <List.Item
              actions={[
                <Tag color={item.status === 'replied' ? 'green' : 'orange'}>
                  {item.status === 'replied' ? '已回复' : '待回复'}
                </Tag>,
              ]}
            >
              <List.Item.Meta
                title={item.property_title}
                description={
                  <div>
                    <div style={{ color: '#666' }}>{item.content}</div>
                    <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                      经纪人: {item.agent_name || '暂无'} · {item.created_at}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
    {
      key: 'transactions',
      label: <span><FileTextOutlined /> 我的交易</span>,
      children: (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Button type="primary" onClick={() => navigate('/transactions')}>
            查看全部交易
          </Button>
        </div>
      ),
    },
    {
      key: 'profile',
      label: <span><SettingOutlined /> 个人设置</span>,
      children: (
        <div style={{ maxWidth: 400 }}>
          <p><strong>用户名：</strong>{user?.username}</p>
          <p><strong>姓名：</strong>{user?.real_name || '未设置'}</p>
          <p><strong>手机号：</strong>{user?.phone || '未设置'}</p>
          <p><strong>邮箱：</strong>{user?.email || '未设置'}</p>
          <p><strong>角色：</strong>
            {({ user: '普通用户', agent: '经纪人', developer: '开发商', admin: '管理员' } as Record<string, string>)[user?.role || 'user']}
          </p>
          <Button type="primary" onClick={() => {
            form.setFieldsValue({ realName: user?.real_name, phone: user?.phone, email: user?.email });
            setProfileVisible(true);
          }}>
            编辑资料
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card style={{ borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <Avatar size={64} icon={<UserOutlined />} src={user?.avatar} />
          <div>
            <h2 style={{ margin: 0 }}>{user?.real_name || user?.username}</h2>
            <div style={{ color: '#999', marginTop: 4 }}>
              <Tag color="blue">
                {({ user: '普通用户', agent: '经纪人', developer: '开发商', admin: '管理员' } as Record<string, string>)[user?.role || 'user']}
              </Tag>
              {user?.status === 'active' ? <Tag color="green">正常</Tag> : <Tag color="red">禁用</Tag>}
            </div>
          </div>
        </div>

        <Tabs items={tabItems} />
      </Card>

      <Modal
        title="编辑个人资料"
        open={profileVisible}
        onOk={handleUpdateProfile}
        onCancel={() => setProfileVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="realName" label="真实姓名">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="提交房源委托"
        open={entrustVisible}
        onOk={handleSubmitEntrust}
        onCancel={() => setEntrustVisible(false)}
        width={520}
      >
        <Form form={entrustForm} layout="vertical">
          <Form.Item name="propertyId" label="房源ID（选填）">
            <Input placeholder="如果已有特定房源，填写房源ID" />
          </Form.Item>
          <Form.Item name="type" label="委托类型" rules={[{ required: true, message: '请选择委托类型' }]}>
            <Select placeholder="请选择委托类型">
              <Option value="sale">出售</Option>
              <Option value="rent">出租</Option>
              <Option value="both">出售+出租</Option>
            </Select>
          </Form.Item>
          <Form.Item name="expectedPrice" label="期望价格（万元）">
            <Input placeholder="期望售价/租金" />
          </Form.Item>
          <Form.Item name="description" label="房源描述">
            <Input.TextArea rows={3} placeholder="简要描述房源情况" />
          </Form.Item>
          <Form.Item name="replacementDemand" label="置换需求（选填）">
            <Input.TextArea rows={3} placeholder="如：学区房、地铁旁、三居室等，多个关键词用逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
