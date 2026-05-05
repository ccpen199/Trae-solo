import { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Carousel, Typography, Tag, Space } from 'antd';
import {
  FileTextOutlined,
  ShoppingOutlined,
  UserOutlined,
  ShopOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { apiService } from '@/services/api';
import { News, Product } from '@/types';

const { Title, Paragraph } = Typography;

const HomePage = () => {
  const [news, setNews] = useState<News[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [newsResponse, productsResponse] = await Promise.all([
          apiService.getNewsList({ limit: 6 }),
          apiService.getProductList({ limit: 8, isRecommend: true }),
        ]);
        setNews(newsResponse.data || []);
        setProducts(productsResponse.data || []);
      } catch (error) {
        console.error('获取首页数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const carouselImages = [
    {
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese+baijiu+wine+brand+promotional+banner+red+gold+elegant+traditional+Chinese+style&image_size=landscape_16_9',
      title: '金种子酒业',
      description: '传承千年酿酒工艺，品味东方神韵',
    },
    {
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=premium+Chinese+white+spirits+products+showcase+luxury+packaging&image_size=landscape_16_9',
      title: '产品中心',
      description: '精选好酒，品味生活',
    },
    {
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=business+meeting+dealer+network+cooperation+professional&image_size=landscape_16_9',
      title: '经销商门户',
      description: '携手共创，共赢未来',
    },
  ];

  const features = [
    {
      icon: <FileTextOutlined style={{ fontSize: '36px', color: '#c41e3a' }} />,
      title: '新闻中心',
      description: '企业要闻、活动专区、媒体聚焦、视频中心，全方位了解企业动态',
      link: '/news',
    },
    {
      icon: <ShoppingOutlined style={{ fontSize: '36px', color: '#c41e3a' }} />,
      title: '产品中心',
      description: '产品文化、产品视频、发展规划、市场活动，品味金种子佳酿',
      link: '/products',
    },
    {
      icon: <UserOutlined style={{ fontSize: '36px', color: '#c41e3a' }} />,
      title: '会员系统',
      description: '专属会员权益，积分兑换，优惠活动，尊享VIP服务',
      link: '/login',
    },
    {
      icon: <ShopOutlined style={{ fontSize: '36px', color: '#c41e3a' }} />,
      title: '经销商门户',
      description: '规章制度、管理培训、业务技巧、内部论坛，赋能经销商发展',
      link: '/login',
    },
  ];

  return (
    <div>
      <Carousel autoplay effect="fade" style={{ marginBottom: '40px' }}>
        {carouselImages.map((item, index) => (
          <div key={index}>
            <div
              style={{
                height: '400px',
                backgroundImage: `url(${item.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  padding: '40px 60px',
                  color: 'white',
                }}
              >
                <Title level={2} style={{ color: 'white', marginBottom: '8px' }}>
                  {item.title}
                </Title>
                <Paragraph style={{ color: 'white', fontSize: '16px', margin: 0 }}>
                  {item.description}
                </Paragraph>
              </div>
            </div>
          </div>
        ))}
      </Carousel>

      <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
        {features.map((feature, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Card
              hoverable
              style={{ textAlign: 'center', height: '100%' }}
              onClick={() => (window.location.href = feature.link)}
            >
              <div style={{ marginBottom: '16px' }}>{feature.icon}</div>
              <Title level={4} style={{ marginBottom: '12px' }}>
                {feature.title}
              </Title>
              <Paragraph type="secondary" style={{ fontSize: '14px' }}>
                {feature.description}
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={3} style={{ margin: 0 }}>
            热门新闻
          </Title>
          <Link to="/news">
            查看更多 <RightOutlined />
          </Link>
        </div>
        <Row gutter={[24, 24]}>
          {news.slice(0, 4).map((item) => (
            <Col xs={24} sm={12} md={6} key={item.id}>
              <Link to={`/news/${item.id}`}>
                <Card
                  hoverable
                  cover={
                    <div
                      style={{
                        height: '160px',
                        backgroundImage: item.coverImage
                          ? `url(${item.coverImage})`
                          : `linear-gradient(135deg, #c41e3a 0%, #8b0000 100%)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {!item.coverImage && (
                        <FileTextOutlined style={{ fontSize: '48px', color: 'rgba(255,255,255,0.5)' }} />
                      )}
                    </div>
                  }
                >
                  <Card.Meta
                    title={
                      <div
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '14px',
                        }}
                      >
                        {item.title}
                      </div>
                    }
                    description={
                      <Space>
                        <Tag color="blue">{item.category?.name}</Tag>
                        <span style={{ color: '#999', fontSize: '12px' }}>
                          浏览 {item.views}
                        </span>
                      </Space>
                    }
                  />
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={3} style={{ margin: 0 }}>
            推荐产品
          </Title>
          <Link to="/products">
            查看更多 <RightOutlined />
          </Link>
        </div>
        <Row gutter={[24, 24]}>
          {products.slice(0, 8).map((product) => (
            <Col xs={24} sm={12} md={6} key={product.id}>
              <Link to={`/products/${product.id}`}>
                <Card
                  hoverable
                  cover={
                    <div
                      style={{
                        height: '180px',
                        backgroundImage: product.coverImage
                          ? `url(${product.coverImage})`
                          : `linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {!product.coverImage && (
                        <ShoppingOutlined style={{ fontSize: '48px', color: 'rgba(0,0,0,0.2)' }} />
                      )}
                    </div>
                  }
                >
                  <Card.Meta
                    title={
                      <div
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '14px',
                          marginBottom: '8px',
                        }}
                      >
                        {product.name}
                      </div>
                    }
                  />
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#c41e3a' }}>
                      ¥{product.price}
                    </span>
                    {product.originalPrice && (
                      <span
                        style={{
                          marginLeft: '8px',
                          fontSize: '12px',
                          color: '#999',
                          textDecoration: 'line-through',
                        }}
                      >
                        ¥{product.originalPrice}
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    {product.isNew && <Tag color="green">新品</Tag>}
                    {product.isHot && <Tag color="red">热卖</Tag>}
                    {product.isRecommend && <Tag color="orange">推荐</Tag>}
                  </div>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default HomePage;
