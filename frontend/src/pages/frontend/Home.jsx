import React, { useEffect, useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Carousel, 
  Button, 
  Tag, 
  Input, 
  Select, 
  List, 
  Avatar,
  Typography,
  Divider,
  Statistic,
  Empty
} from 'antd';
import { 
  SearchOutlined, 
  RightOutlined, 
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  FireOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { productsApi, newsApi, commonApi } from '../../api';

const { Title, Text } = Typography;
const { Search } = Input;

const bannerImages = [
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20corporate%20banner%20with%20technology%20theme%20blue%20gradient&image_size=landscape_16_9',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=business%20technology%20innovation%20banner%20professional&image_size=landscape_16_9',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=corporate%20products%20showcase%20banner%20modern%20design&image_size=landscape_16_9'
];

function Home() {
  const navigate = useNavigate();
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [latestNews, setLatestNews] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, newsRes, companyRes] = await Promise.all([
        productsApi.getList({ is_recommended: 'true', page_size: 8 }),
        newsApi.getList({ page_size: 6 }),
        commonApi.getCompanyInfo()
      ]);
      setRecommendedProducts(productsRes.data.list || []);
      setLatestNews(newsRes.data.list || []);
      setCompanyInfo(companyRes.data);
    } catch (error) {
      console.error('加载数据失败:', error);
      setRecommendedProducts([
        { id: 1, title: '智能产品A1', subtitle: '高端智能产品，品质之选', thumbnail: null, is_recommended: true },
        { id: 2, title: '智能产品B2', subtitle: '中端智能产品，性价比高', thumbnail: null, is_recommended: true },
        { id: 3, title: '智能产品C3', subtitle: '入门级智能产品，易用之选', thumbnail: null, is_recommended: true },
        { id: 4, title: '智能产品D4', subtitle: '专业级智能产品，性能卓越', thumbnail: null, is_recommended: true },
      ]);
      setLatestNews([
        { id: 1, title: '公司新产品发布会成功举办', summary: '最新智能产品系列正式亮相...', publish_date: '2024-01-15' },
        { id: 2, title: '2024年度年会精彩回顾', summary: '全体员工齐聚一堂，共贺新年...', publish_date: '2024-01-12' },
        { id: 3, title: '行业动态：新技术发展趋势', summary: '行业专家解读最新技术发展方向...', publish_date: '2024-01-10' },
      ]);
      setCompanyInfo({
        name: '某某科技有限公司',
        introduction: '某某科技有限公司是一家专注于高新技术研发的现代化企业，致力于为客户提供优质的产品和服务。公司成立于2010年，拥有专业的研发团队和完善的售后服务体系。',
        phone: '400-888-8888',
        email: 'contact@example.com',
        address: '北京市海淀区中关村科技园',
        work_time: '周一至周五 9:00-18:00'
      });
    }
  };

  const handleSearch = (value) => {
    if (value.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(value)}`);
    }
  };

  const carouselContent = bannerImages.map((img, index) => (
    <div key={index}>
      <div style={{
        height: 400,
        background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <div style={{ textAlign: 'center', color: '#fff', zIndex: 1 }}>
          <Title level={1} style={{ color: '#fff', marginBottom: 16 }}>
            某某科技
          </Title>
          <Title level={3} style={{ color: '#fff', marginBottom: 24, fontWeight: 'normal' }}>
            创新科技，引领未来
          </Title>
          <Search
            placeholder="搜索产品、新闻..."
            allowClear
            enterButton="搜索"
            size="large"
            style={{ width: 500 }}
            onSearch={handleSearch}
          />
        </div>
      </div>
    </div>
  ));

  return (
    <div>
      <Carousel autoplay effect="fade" dotPosition="bottom">
        {carouselContent}
      </Carousel>

      <div style={{ background: '#fff', padding: '60px 0' }}>
        <Row justify="center" style={{ marginBottom: 40 }}>
          <Col>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>
              推荐产品
            </Title>
            <div style={{ 
              width: 60, 
              height: 3, 
              background: '#1890ff', 
              margin: '0 auto' 
            }} />
          </Col>
        </Row>

        <Row gutter={[24, 24]} justify="center" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          {recommendedProducts.length > 0 ? recommendedProducts.map((product) => (
            <Col xs={24} sm={12} md={6} key={product.id}>
              <Card
                hoverable
                style={{ cursor: 'pointer' }}
                cover={
                  <div style={{
                    height: 180,
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <StarOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                  </div>
                }
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <Card.Meta
                  title={<div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>{product.title}</div>}
                  description={<Text type="secondary" ellipsis>{product.subtitle}</Text>}
                />
                {product.is_recommended && (
                  <Tag color="gold" style={{ marginTop: 8 }}>推荐</Tag>
                )}
              </Card>
            </Col>
          )) : (
            <Col span={24}>
              <Empty description="暂无产品" />
            </Col>
          )}
        </Row>

        <Row justify="center" style={{ marginTop: 40 }}>
          <Button 
            type="primary" 
            size="large" 
            icon={<ArrowRightOutlined />}
            onClick={() => navigate('/products')}
          >
            查看更多产品
          </Button>
        </Row>
      </div>

      <div style={{ background: '#f5f5f5', padding: '60px 0' }}>
        <Row justify="center" style={{ marginBottom: 40 }}>
          <Col>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>
              最新新闻
            </Title>
            <div style={{ 
              width: 60, 
              height: 3, 
              background: '#52c41a', 
              margin: '0 auto' 
            }} />
          </Col>
        </Row>

        <Row justify="center" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <Col xs={24} sm={24} md={16}>
            <List
              dataSource={latestNews}
              itemLayout="vertical"
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/news/${item.id}`)}
                >
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FireOutlined style={{ color: '#fa8c16' }} />
                        <Text strong style={{ fontSize: 16 }}>{item.title}</Text>
                      </div>
                    }
                    description={
                      <div>
                        <Text type="secondary">{item.summary}</Text>
                        <div style={{ marginTop: 8 }}>
                          <Tag color="blue">{item.publish_date}</Tag>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Col>
        </Row>

        <Row justify="center" style={{ marginTop: 24 }}>
          <Button 
            size="large" 
            icon={<ArrowRightOutlined />}
            onClick={() => navigate('/news')}
          >
            查看更多新闻
          </Button>
        </Row>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '60px 0' }}>
        <Row justify="center" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <Col span={6}>
            <Statistic
              title={<span style={{ color: '#fff' }}>产品总数</span>}
              value={recommendedProducts.length * 3}
              suffix="款"
              valueStyle={{ color: '#fff' }}
              prefix={<StarOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={<span style={{ color: '#fff' }}>服务客户</span>}
              value={500}
              suffix="+"
              valueStyle={{ color: '#fff' }}
              prefix={<EnvironmentOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={<span style={{ color: '#fff' }}>专业团队</span>}
              value={50}
              suffix="人"
              valueStyle={{ color: '#fff' }}
              prefix={<PhoneOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={<span style={{ color: '#fff' }}>行业经验</span>}
              value={14}
              suffix="年"
              valueStyle={{ color: '#fff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
        </Row>
      </div>

      <div style={{ background: '#fff', padding: '60px 0' }}>
        <Row justify="center" style={{ marginBottom: 40 }}>
          <Col>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>
              联系我们
            </Title>
            <div style={{ 
              width: 60, 
              height: 3, 
              background: '#faad14', 
              margin: '0 auto' 
            }} />
          </Col>
        </Row>

        <Row justify="center" gutter={[32, 32]} style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <Col xs={24} sm={8}>
            <Card hoverable>
              <div style={{ textAlign: 'center' }}>
                <PhoneOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                <Title level={4} style={{ marginTop: 16 }}>电话咨询</Title>
                <Text type="secondary">{companyInfo?.phone || '400-888-8888'}</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card hoverable>
              <div style={{ textAlign: 'center' }}>
                <MailOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                <Title level={4} style={{ marginTop: 16 }}>邮件联系</Title>
                <Text type="secondary">{companyInfo?.email || 'contact@example.com'}</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card hoverable>
              <div style={{ textAlign: 'center' }}>
                <EnvironmentOutlined style={{ fontSize: 48, color: '#722ed1' }} />
                <Title level={4} style={{ marginTop: 16 }}>公司地址</Title>
                <Text type="secondary">{companyInfo?.address || '北京市海淀区中关村科技园'}</Text>
              </div>
            </Card>
          </Col>
        </Row>

        <Row justify="center" style={{ marginTop: 40 }}>
          <Button 
            type="primary" 
            size="large" 
            onClick={() => navigate('/contact')}
          >
            在线留言
          </Button>
        </Row>
      </div>
    </div>
  );
}

export default Home;
