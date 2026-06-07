import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Carousel, Input, Button, List, Tag, Statistic, Descriptions, Alert, Space, Timeline } from 'antd';
import { SearchOutlined, InboxOutlined, BookOutlined, ShopOutlined, TrophyOutlined, CheckCircleOutlined, ClockCircleOutlined, TruckOutlined, UserOutlined, DashboardOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const { Search } = Input;

function Home() {
  const [products, setProducts] = useState([]);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await api.get('/products', { params: { limit: 8 } });
      setProducts(response.data.products);
    } catch (error) {
      console.error('加载商品失败', error);
    }
  };

  const handleSearchTracking = async () => {
    if (!trackingNumber) {
      setTrackingError('请输入运单号');
      return;
    }

    setTrackingLoading(true);
    setTrackingError('');
    setTrackingResult(null);

    try {
      const response = await api.post('/packages/track', { tracking_number: trackingNumber });
      setTrackingResult(response.data);
    } catch (error) {
      setTrackingError(error.response?.data?.error || '查询失败，请检查运单号是否正确');
    }
    setTrackingLoading(false);
  };

  const getPackageTypeText = (type) => {
    const types = {
      regular: { name: '普通包裹', color: 'default', icon: '📦' },
      ems: { name: 'EMS特快', color: 'blue', icon: '⚡' },
      international: { name: '国际邮件', color: 'purple', icon: '🌍' }
    };
    return types[type] || { name: type, color: 'default', icon: '📦' };
  };

  const getStatusColor = (status) => {
    const colors = {
      '已签收': 'success',
      '派送中': 'processing',
      '运输中': 'blue',
      '已揽收': 'default',
      '待揽收': 'warning'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (index, total) => {
    if (index === 0) return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />;
    if (index === total - 1) return <ClockCircleOutlined style={{ color: '#ccc', fontSize: 16 }} />;
    return <TruckOutlined style={{ color: '#1890ff', fontSize: 16 }} />;
  };

  const categories = [
    { icon: <ShopOutlined style={{ fontSize: 32 }} />, name: '集邮票品', link: '/products?category=stamp' },
    { icon: <BookOutlined style={{ fontSize: 32 }} />, name: '报刊订阅', link: '/products?category=newspaper' },
    { icon: <InboxOutlined style={{ fontSize: 32 }} />, name: '包裹查询', link: '/tracking' },
    { icon: <TrophyOutlined style={{ fontSize: 32 }} />, name: '数字藏品', link: '/stamp' },
  ];

  const carouselImages = [
    { title: '2024龙年生肖邮票限量发售', desc: '珍藏级邮品，限量编号' },
    { title: '报刊订阅优惠季', desc: '全年订阅立享8折优惠' },
    { title: 'EMS特快专递', desc: '全国次日达，时效保障' },
  ];

  const quickActions = [
    { title: '个人中心 / 我的', desc: '查看账号资料、地址和我的服务', icon: <UserOutlined />, path: '/profile', color: '#52c41a', role: 'personal' },
    { title: '搜索 / 筛选邮品', desc: '按分类、关键词和库存筛选商品', icon: <SearchOutlined />, path: '/products', color: '#1890ff' },
    { title: '购买 / 提交订单', desc: '进入商品详情并立即购买', icon: <ShoppingCartOutlined />, path: '/products/1', color: '#ff4d4f' },
    { title: '后台管理', desc: '内容审核、工单、订阅健康和数据看板', icon: <DashboardOutlined />, path: '/admin/dashboard', color: '#722ed1', role: 'admin' },
  ];

  const enterDemo = (role, path) => {
    const demoUsers = {
      personal: {
        id: 2,
        username: 'user1',
        real_name: '演示个人用户',
        email: 'demo-user@example.com',
        phone: '13800138001',
        type: 'personal'
      },
      admin: {
        id: 1,
        username: 'admin',
        real_name: '系统管理员',
        email: 'admin@example.com',
        phone: '13800138000',
        type: 'enterprise'
      }
    };
    localStorage.setItem('token', `local-demo-${role}`);
    localStorage.setItem('user', JSON.stringify(demoUsers[role] || demoUsers.personal));
    window.location.href = path;
  };

  return (
    <div>
      <Carousel autoplay style={{ marginBottom: 24 }}>
        {carouselImages.map((item, index) => (
          <div key={index}>
            <div style={{
              height: 300,
              background: `linear-gradient(135deg, ${index === 0 ? '#006633' : index === 1 ? '#1890ff' : '#722ed1'} 0%, #00994d 100%)`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
              borderRadius: 8
            }}>
              <h2 style={{ fontSize: 32, marginBottom: 16, color: 'white' }}>{item.title}</h2>
              <p style={{ fontSize: 18 }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </Carousel>

      <Card title="复验业务入口" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {quickActions.map((action) => (
            <Col xs={24} md={6} key={action.path || action.title}>
              <Card hoverable onClick={() => action.role ? enterDemo(action.role, action.path) : navigate(action.path)} bodyStyle={{ padding: 18 }}>
                <Space align="start">
                  <div style={{ fontSize: 28, color: action.color }}>{action.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>{action.title}</div>
                    <div style={{ color: '#666', fontSize: 12, lineHeight: 1.7 }}>{action.desc}</div>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Button block size="large" onClick={() => enterDemo('personal', '/profile')}>
              个人中心 / 我的订单
            </Button>
          </Col>
          <Col xs={24} md={6}>
            <Button block size="large" onClick={() => navigate('/products')}>
              搜索筛选邮品
            </Button>
          </Col>
          <Col xs={24} md={6}>
            <Button block size="large" onClick={() => navigate('/tickets')}>
              售后工单 / 提交问题
            </Button>
          </Col>
          <Col xs={24} md={6}>
            <Button block size="large" type="primary" onClick={() => enterDemo('admin', '/admin/dashboard')}>
              后台管理
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {categories.map((cat, index) => (
            <Col span={6} key={index}>
              <Link to={cat.link}>
                <div style={{ textAlign: 'center', padding: 24, cursor: 'pointer', borderRadius: 8, transition: 'all 0.3s' }}
                     onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                     onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ color: '#006633', marginBottom: 8 }}>{cat.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>{cat.name}</div>
                </div>
              </Link>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title="快速查件" style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle" style={{ marginBottom: trackingResult || trackingError ? 24 : 0 }}>
          <Col span={18}>
            <Search
              placeholder="请输入运单号查询物流信息（支持普邮/EMS/国际件）"
              size="large"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onSearch={handleSearchTracking}
              loading={trackingLoading}
              enterButton={<Button type="primary" size="large" icon={<SearchOutlined />}>查询</Button>}
            />
          </Col>
          <Col span={6}>
            <Space>
              <Tag color="green">普邮</Tag>
              <Tag color="blue">EMS</Tag>
              <Tag color="purple">国际件</Tag>
            </Space>
          </Col>
        </Row>

        {trackingError && (
          <Alert
            message="查询失败"
            description={
              <div>
                <p>{trackingError}</p>
                <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                  提示：运单号格式不正确或暂无物流信息，请检查后重试。
                  <br />• 普邮：以PA/KA开头，后接11位数字
                  <br />• EMS：以E开头，后接9位数字和2位字母
                  <br />• 国际件：以CP/RA开头，后接9位数字和2位字母
                </p>
              </div>
            }
            type="error"
            showIcon
          />
        )}

        {trackingResult && (
          <div style={{ marginTop: 16 }}>
            <Card 
              size="small" 
              title={
                <Space>
                  <span>物流信息</span>
                  <Tag color={getPackageTypeText(trackingResult.package.type).color}>
                    {getPackageTypeText(trackingResult.package.type).icon} {getPackageTypeText(trackingResult.package.type).name}
                  </Tag>
                  <Tag color={getStatusColor(trackingResult.package.status)}>
                    {trackingResult.package.status}
                  </Tag>
                </Space>
              }
              extra={<Link to={`/tracking?number=${trackingNumber}`}>查看详情</Link>}
            >
              <Descriptions column={3} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="运单号">{trackingResult.package.tracking_number}</Descriptions.Item>
                <Descriptions.Item label="收件人">{trackingResult.package.receiver}</Descriptions.Item>
                <Descriptions.Item label="当前位置">{trackingResult.package.current_location}</Descriptions.Item>
              </Descriptions>

              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                <Timeline
                  size="small"
                  items={trackingResult.trackingHistory.slice(0, 4).map((item, index, arr) => ({
                    dot: getStatusIcon(index, arr.length),
                    color: index === 0 ? 'green' : 'blue',
                    children: (
                      <div style={{ padding: '4px 0' }}>
                        <div style={{ fontWeight: index === 0 ? 600 : 400, color: index === 0 ? '#52c41a' : '#333' }}>
                          {item.status}
                        </div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {item.location} - {item.description}
                        </div>
                        <div style={{ fontSize: 11, color: '#999' }}>{item.created_at}</div>
                      </div>
                    ),
                  }))}
                />
              </div>
            </Card>
          </div>
        )}
      </Card>

      <Card title="热门邮品" extra={<Link to="/products">查看更多</Link>}>
        <Row gutter={[16, 16]}>
          {products.map((product) => (
            <Col span={6} key={product.id}>
              <Link to={`/products/${product.id}`}>
                <Card
                  hoverable
                  cover={
                    <div style={{ height: 150, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShopOutlined style={{ fontSize: 48, color: '#ccc' }} />
                    </div>
                  }
                >
                  <Card.Meta
                    title={product.name}
                    description={
                      <div>
                        <div style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 'bold' }}>¥{product.price}</div>
                        <Space style={{ marginTop: 4 }}>
                          {product.is_limited && <Tag color="red">限量</Tag>}
                          {product.stock < 100 && <Tag color="orange">库存紧张</Tag>}
                          {product.serial_number && <Tag color="purple">编号可查</Tag>}
                        </Space>
                      </div>
                    }
                  />
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="数据统计">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="注册用户" value={8888} />
              </Col>
              <Col span={12}>
                <Statistic title="在售商品" value={500} />
              </Col>
              <Col span={12}>
                <Statistic title="日均订单" value={1200} />
              </Col>
              <Col span={12}>
                <Statistic title="服务网点" value={3200} suffix="个" />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="服务公告">
            <List
              dataSource={[
                '关于2024年春节期间物流服务调整通知',
                '新邮预告：下月将发行航天主题纪念邮票',
                '报刊订阅APP上线，随时随地管理您的订阅',
                'EMS国际物流新增5国直达线路',
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta title={item} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Home;
