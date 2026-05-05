import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Typography, 
  Card, 
  Carousel, 
  Button, 
  Space, 
  Tag,
  Divider,
  List,
  Avatar,
  Input,
  message,
  Statistic
} from 'antd';
import { 
  ShopOutlined, 
  FileTextOutlined, 
  DownloadOutlined, 
  TeamOutlined,
  PhoneOutlined,
  MailOutlined,
  EyeOutlined,
  ArrowRightOutlined,
  FireOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { newsService } from '../services/newsService';

const { Title, Text, Paragraph } = Typography;
const { Meta } = Card;
const { TextArea } = Input;

const Home = () => {
  const navigate = useNavigate();
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [recommendedNews, setRecommendedNews] = useState([]);
  const [latestNews, setLatestNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [productsRes, newsRes, latestRes] = await Promise.all([
        productService.getRecommendedProducts(8),
        newsService.getRecommendedNews(6),
        newsService.getLatestNews({ limit: 10 })
      ]);
      
      setRecommendedProducts(productsRes.data || []);
      setRecommendedNews(newsRes.data || []);
      setLatestNews(latestRes.data || []);
    } catch (error) {
      console.error('获取首页数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const carouselContent = [
    {
      key: 1,
      title: '欢迎来到企业网站',
      subtitle: '专业的企业服务提供商',
      description: '我们致力于为客户提供高质量的产品和服务',
      bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      key: 2,
      title: '产品展示',
      subtitle: '丰富的产品系列',
      description: '满足您多样化的业务需求',
      bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      key: 3,
      title: '新闻中心',
      subtitle: '最新动态',
      description: '了解公司最新资讯和行业动态',
      bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ];

  const serviceFeatures = [
    { icon: <ShopOutlined style={{ fontSize: '36px' }} />, title: '产品展示', description: '丰富的产品系列，满足各类需求' },
    { icon: <FileTextOutlined style={{ fontSize: '36px' }} />, title: '新闻中心', description: '实时更新公司动态和行业资讯' },
    { icon: <DownloadOutlined style={{ fontSize: '36px' }} />, title: '下载中心', description: '便捷的资料下载服务' },
    { icon: <TeamOutlined style={{ fontSize: '36px' }} />, title: '人力资源', description: '优秀的团队，共创美好未来' },
  ];

  const handleSubmitMessage = () => {
    message.success('留言提交成功，我们会尽快与您联系！');
  };

  return (
    <div>
      <Carousel 
        autoplay 
        effect="fade"
        style={{ marginBottom: '48px' }}
      >
        {carouselContent.map((item) => (
          <div 
            key={item.key}
            style={{ 
              background: item.bgColor,
              color: '#fff',
              padding: '100px 50px',
              textAlign: 'center',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <Title level={1} style={{ color: '#fff', marginBottom: '16px' }}>
              {item.title}
            </Title>
            <Title level={3} style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '24px' }}>
              {item.subtitle}
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.8)', fontSize: '18px', marginBottom: '32px' }}>
              {item.description}
            </Paragraph>
            <Space>
              <Button type="primary" size="large" onClick={() => navigate('/products')}>
                了解产品
              </Button>
              <Button size="large" style={{ background: 'transparent', color: '#fff', borderColor: '#fff' }} onClick={() => navigate('/news')}>
                查看新闻
              </Button>
            </Space>
          </div>
        ))}
      </Carousel>

      <div style={{ padding: '0 50px', marginBottom: '48px' }}>
        <Row gutter={[32, 32]}>
          {serviceFeatures.map((feature, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card 
                hoverable 
                style={{ textAlign: 'center' }}
                onClick={() => navigate(index === 0 ? '/products' : index === 1 ? '/news' : index === 2 ? '/downloads' : '/jobs')}
              >
                <div style={{ color: '#1890ff', marginBottom: '16px' }}>
                  {feature.icon}
                </div>
                <Title level={4}>{feature.title}</Title>
                <Text type="secondary">{feature.description}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Divider />

      <div style={{ padding: '0 50px', marginBottom: '48px' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <StarOutlined style={{ color: '#1890ff', marginRight: '12px' }} />
              推荐产品
            </Title>
          </Col>
          <Col>
            <Button type="link" onClick={() => navigate('/products')}>
              查看更多 <ArrowRightOutlined />
            </Button>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          {recommendedProducts.slice(0, 4).map((product) => (
            <Col xs={24} sm={12} md={6} key={product.id}>
              <Card
                hoverable
                cover={
                  <div style={{ 
                    height: '200px', 
                    background: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ShopOutlined style={{ fontSize: '64px', color: '#ccc' }} />
                  </div>
                }
                actions={[
                  <Button type="link" onClick={() => navigate(`/products/${product.id}`)}>
                    查看详情
                  </Button>
                ]}
              >
                <Meta
                  title={
                    <Space direction="vertical" size="small">
                      <Text strong style={{ fontSize: '16px' }}>{product.title}</Text>
                      <Space>
                        {product.is_recommended && <Tag color="gold">推荐</Tag>}
                        {product.is_new && <Tag color="green">新品</Tag>}
                        {product.is_hot && <Tag color="red">热销</Tag>}
                      </Space>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Text type="secondary" ellipsis={{ rows: 2 }}>
                        {product.summary}
                      </Text>
                      <Row justify="space-between">
                        <Text strong style={{ color: '#f5222d', fontSize: '18px' }}>
                          ¥{product.price?.toLocaleString()}
                        </Text>
                        <Text type="secondary">
                          <EyeOutlined /> {product.view_count}
                        </Text>
                      </Row>
                    </Space>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Divider />

      <div style={{ padding: '0 50px', marginBottom: '48px' }}>
        <Row gutter={[32, 0]}>
          <Col xs={24} md={16}>
            <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
              <Col>
                <Title level={3} style={{ margin: 0 }}>
                  <FileTextOutlined style={{ color: '#1890ff', marginRight: '12px' }} />
                  最新新闻
                </Title>
              </Col>
              <Col>
                <Button type="link" onClick={() => navigate('/news')}>
                  更多新闻 <ArrowRightOutlined />
                </Button>
              </Col>
            </Row>

            <List
              dataSource={latestNews.slice(0, 8)}
              renderItem={(news) => (
                <List.Item
                  style={{ borderBottom: '1px dashed #f0f0f0' }}
                  actions={[
                    <Text type="secondary" key="date">
                      {new Date(news.publish_at || news.created_at).toLocaleDateString()}
                    </Text>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      news.is_top ? (
                        <Tag color="red">置顶</Tag>
                      ) : null
                    }
                    title={
                      <a onClick={() => navigate(`/news/${news.id}`)} style={{ cursor: 'pointer' }}>
                        {news.title}
                      </a>
                    }
                    description={
                      <Text type="secondary" ellipsis>
                        {news.summary}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Col>

          <Col xs={24} md={8}>
            <Title level={3} style={{ marginBottom: '24px' }}>
              <FireOutlined style={{ color: '#1890ff', marginRight: '12px' }} />
              客户留言
            </Title>
            <Card>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Input placeholder="您的姓名" />
                <Input placeholder="联系电话" />
                <Input placeholder="电子邮箱" />
                <TextArea 
                  rows={4} 
                  placeholder="请输入您的留言内容..."
                  showCount
                  maxLength={500}
                />
                <Button type="primary" block onClick={handleSubmitMessage}>
                  提交留言
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>

      <Divider />

      <div style={{ padding: '40px 50px', background: '#f5f5f5' }}>
        <Row gutter={[32, 32]} justify="center">
          <Col xs={12} sm={6}>
            <Statistic
              title="产品数量"
              value={100}
              suffix="+"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="新闻资讯"
              value={500}
              suffix="+"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="注册用户"
              value={1000}
              suffix="+"
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="合作伙伴"
              value={50}
              suffix="+"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Home;