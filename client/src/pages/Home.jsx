import React, { useState, useEffect } from 'react';
import { Carousel, Card, Row, Col, Button, Tag, Typography, Space, Avatar, Rate, message } from 'antd';
import {
  CameraOutlined,
  SoundOutlined,
  BankOutlined,
  HeartOutlined,
  HeartFilled,
  ArrowRightOutlined,
  ShopOutlined,
  PictureOutlined,
  GiftOutlined,
  StarOutlined,
  EyeOutlined,
  LikeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { merchantAPI, serviceAPI, caseAPI, marketingAPI } from '../api/index.js';

const { Title, Text } = Typography;
const { Meta } = Card;

const CATEGORIES = [
  { key: 'photography', name: '婚纱摄影', icon: <CameraOutlined style={{ fontSize: 32, color: '#ff4d6d' }} />, color: '#ff4d6d' },
  { key: 'emcee', name: '司仪主持', icon: <SoundOutlined style={{ fontSize: 32, color: '#722ed1' }} />, color: '#722ed1' },
  { key: 'hotel', name: '婚宴酒店', icon: <BankOutlined style={{ fontSize: 32, color: '#1890ff' }} />, color: '#1890ff' },
  { key: 'wedding_dress', name: '婚纱礼服', icon: <HeartOutlined style={{ fontSize: 32, color: '#eb2f96' }} />, color: '#eb2f96' }
];

const BANNERS = [
  {
    id: 1,
    title: '双十一狂欢季',
    subtitle: '全场8折起，再送价值2000元婚庆大礼包',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wedding%20banner%20romantic%20pink%20flowers%20couple&image_size=landscape_16_9',
    color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
  },
  {
    id: 2,
    title: '春季婚博会',
    subtitle: '百家商家齐聚，一站式搞定婚礼筹备',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wedding%20expo%20elegant%20floral%20decoration&image_size=landscape_16_9',
    color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  },
  {
    id: 3,
    title: '新人专享福利',
    subtitle: '注册即送1000元优惠券礼包',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wedding%20gift%20box%20romantic%20pink%20ribbon&image_size=landscape_16_9',
    color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  }
];

const Home = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [cases, setCases] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState({
    merchants: false,
    cases: false,
    activities: false
  });
  const [likedMerchants, setLikedMerchants] = useState({});

  useEffect(() => {
    fetchBanners();
    fetchHotMerchants();
    fetchFeaturedCases();
    fetchActivities();
  }, []);

  const fetchBanners = async () => {
    setBanners(BANNERS);
  };

  const fetchHotMerchants = async () => {
    setLoading(prev => ({ ...prev, merchants: true }));
    try {
      const response = await merchantAPI.list({ pageSize: 4, sort: 'rating' });
      setMerchants(response.data.data || []);
    } catch (error) {
      message.error('获取热门商家失败');
    } finally {
      setLoading(prev => ({ ...prev, merchants: false }));
    }
  };

  const fetchFeaturedCases = async () => {
    setLoading(prev => ({ ...prev, cases: true }));
    try {
      const response = await caseAPI.list({ pageSize: 8, sort: 'likes' });
      setCases(response.data.data || []);
    } catch (error) {
      message.error('获取精选案例失败');
    } finally {
      setLoading(prev => ({ ...prev, cases: false }));
    }
  };

  const fetchActivities = async () => {
    setLoading(prev => ({ ...prev, activities: true }));
    try {
      const response = await marketingAPI.list({ pageSize: 6 });
      setActivities(response.data.data || []);
    } catch (error) {
      message.error('获取活动推荐失败');
    } finally {
      setLoading(prev => ({ ...prev, activities: false }));
    }
  };

  const handleCategoryClick = (categoryKey) => {
    navigate(`/services?category=${categoryKey}`);
  };

  const handleLikeMerchant = async (merchantId) => {
    try {
      const response = await merchantAPI.like(merchantId);
      setLikedMerchants(prev => ({
        ...prev,
        [merchantId]: response.data.liked
      }));
      setMerchants(prev => prev.map(m =>
        m.id === merchantId
          ? { ...m, like_count: response.data.like_count }
          : m
      ));
      message.success(response.data.liked ? '已收藏' : '已取消收藏');
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const getCategoryIcon = (category) => {
    const cat = CATEGORIES.find(c => c.key === category);
    return cat ? cat.icon : <ShopOutlined />;
  };

  const getCategoryColor = (category) => {
    const cat = CATEGORIES.find(c => c.key === category);
    return cat ? cat.color : '#ff4d6d';
  };

  const getCategoryName = (category) => {
    const cat = CATEGORIES.find(c => c.key === category);
    return cat ? cat.name : category;
  };

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      {/* 轮播图 */}
      <div style={{ marginBottom: 32 }}>
        <Carousel autoplay effect="fade" dotPosition="bottom">
          {banners.map(banner => (
            <div key={banner.id}>
              <div
                style={{
                  height: 400,
                  background: banner.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url(${banner.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.3
                  }}
                />
                <div style={{ textAlign: 'center', zIndex: 1, color: '#fff' }}>
                  <Title level={1} style={{ color: '#fff', margin: 0, textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                    {banner.title}
                  </Title>
                  <Text style={{ fontSize: 20, color: '#fff', textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                    {banner.subtitle}
                  </Text>
                  <div style={{ marginTop: 24 }}>
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => navigate('/marketing')}
                      style={{
                        height: 48,
                        padding: '0 32px',
                        fontSize: 16,
                        background: '#ff4d6d',
                        border: 'none',
                        borderRadius: 24
                      }}
                    >
                      立即查看
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* 分类导航 */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, marginBottom: 32, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <Title level={3} style={{ marginBottom: 24 }}>
            <span style={{ borderLeft: '4px solid #ff4d6d', paddingLeft: 12 }}>服务分类</span>
          </Title>
          <Row gutter={[24, 24]}>
            {CATEGORIES.map(category => (
              <Col xs={12} sm={6} key={category.key}>
                <div
                  onClick={() => handleCategoryClick(category.key)}
                  style={{
                    textAlign: 'center',
                    padding: '24px 16px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    background: `${category.color}08`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ marginBottom: 12 }}>{category.icon}</div>
                  <Text strong style={{ fontSize: 16, color: '#333' }}>{category.name}</Text>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* 热门商家 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Title level={3} style={{ margin: 0 }}>
              <span style={{ borderLeft: '4px solid #ff4d6d', paddingLeft: 12 }}>热门商家</span>
            </Title>
            <Button type="link" onClick={() => navigate('/merchants')} style={{ color: '#ff4d6d' }}>
              查看更多 <ArrowRightOutlined />
            </Button>
          </div>
          <Row gutter={[24, 24]}>
            {merchants.map(merchant => (
              <Col xs={24} sm={12} lg={6} key={merchant.id}>
                <Card
                  hoverable
                  loading={loading.merchants}
                  onClick={() => navigate(`/merchants/${merchant.id}`)}
                  style={{ borderRadius: 12, overflow: 'hidden' }}
                  bodyStyle={{ padding: 20 }}
                  actions={[
                    <div
                      key="like"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikeMerchant(merchant.id);
                      }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}
                    >
                      {likedMerchants[merchant.id] ? (
                        <HeartFilled style={{ color: '#ff4d6d' }} />
                      ) : (
                        <HeartOutlined />
                      )}
                      <span>{merchant.like_count || 0}</span>
                    </div>
                  ]}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Avatar size={56} src={merchant.logo}>
                      {merchant.company_name?.[0]}
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 4 }} ellipsis>
                        {merchant.company_name}
                      </Text>
                      <Tag
                        color={getCategoryColor(merchant.category)}
                        style={{ margin: 0, fontSize: 12 }}
                      >
                        {getCategoryName(merchant.category)}
                      </Tag>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Rate disabled value={merchant.rating} style={{ fontSize: 12 }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>{merchant.rating}</Text>
                  </div>
                  <Text type="secondary" ellipsis style={{ fontSize: 13 }}>
                    {merchant.description}
                  </Text>
                  <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
                    <Space size={4}>
                      <StarOutlined style={{ color: '#faad14' }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>{merchant.review_count || 0}条评价</Text>
                    </Space>
                    <Space size={4}>
                      <EyeOutlined style={{ color: '#1890ff' }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>{merchant.view_count || 0}次浏览</Text>
                    </Space>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* 精选案例 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Title level={3} style={{ margin: 0 }}>
              <span style={{ borderLeft: '4px solid #ff4d6d', paddingLeft: 12 }}>精选案例</span>
            </Title>
            <Button type="link" onClick={() => navigate('/cases')} style={{ color: '#ff4d6d' }}>
              查看更多 <ArrowRightOutlined />
            </Button>
          </div>
          <Row gutter={[24, 24]}>
            {cases.map((caseItem, index) => (
              <Col xs={24} sm={12} lg={6} key={caseItem.id}>
                <Card
                  hoverable
                  loading={loading.cases}
                  onClick={() => navigate(`/cases/${caseItem.id}`)}
                  style={{ borderRadius: 12, overflow: 'hidden' }}
                  bodyStyle={{ padding: 0 }}
                  cover={
                    <div style={{ position: 'relative', paddingTop: '100%', overflow: 'hidden' }}>
                      <img
                        alt={caseItem.title}
                        src={caseItem.cover_image || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wedding%20${encodeURIComponent(caseItem.title || 'photo')}&image_size=square_hd`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.5s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      />
                      {index < 3 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: index === 0 ? '#ff4d6d' : index === 1 ? '#fa8c16' : '#faad14',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: 18
                          }}
                        >
                          {index + 1}
                        </div>
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: '40px 16px 16px',
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                          color: '#fff'
                        }}
                      >
                        <Text strong style={{ fontSize: 16, color: '#fff' }} ellipsis>
                          {caseItem.title}
                        </Text>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                          <Space size={8}>
                            <LikeOutlined /> {caseItem.like_count || 0}
                          </Space>
                          <Space size={8}>
                            <EyeOutlined /> {caseItem.view_count || 0}
                          </Space>
                        </div>
                      </div>
                    </div>
                  }
                >
                  <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        <PictureOutlined /> {caseItem.service_name || caseItem.company_name}
                      </Text>
                      {caseItem.budget && (
                        <Text type="danger" strong>¥{caseItem.budget.toLocaleString()}</Text>
                      )}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* 活动推荐 */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Title level={3} style={{ margin: 0 }}>
              <span style={{ borderLeft: '4px solid #ff4d6d', paddingLeft: 12 }}>活动推荐</span>
            </Title>
            <Button type="link" onClick={() => navigate('/marketing')} style={{ color: '#ff4d6d' }}>
              查看更多 <ArrowRightOutlined />
            </Button>
          </div>
          <Row gutter={[24, 24]}>
            {activities.map(activity => (
              <Col xs={24} sm={12} lg={8} key={activity.id}>
                <Card
                  hoverable
                  loading={loading.activities}
                  onClick={() => navigate('/marketing')}
                  style={{ borderRadius: 12, overflow: 'hidden' }}
                  bodyStyle={{ padding: 0 }}
                  cover={
                    <div style={{ position: 'relative', paddingTop: '56%', overflow: 'hidden' }}>
                      <img
                        alt={activity.title}
                        src={activity.cover_image || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wedding%20promotion%20${encodeURIComponent(activity.title || 'sale')}&image_size=landscape_16_9`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <Tag
                        color="red"
                        style={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          fontSize: 12,
                          padding: '4px 12px'
                        }}
                      >
                        <GiftOutlined /> {activity.activity_type === 'discount' ? `限时${(activity.discount * 10).toFixed(0)}折` : '优惠活动'}
                      </Tag>
                    </div>
                  }
                >
                  <div style={{ padding: 20 }}>
                    <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }} ellipsis>
                      {activity.title}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }} ellipsis>
                      {activity.description}
                    </Text>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space size={4}>
                        <ShopOutlined style={{ color: '#ff4d6d' }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>{activity.company_name}</Text>
                      </Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {activity.start_date} ~ {activity.end_date}
                      </Text>
                    </div>
                    {activity.gift && (
                      <div style={{ marginTop: 12, padding: 8, background: '#fff7e6', borderRadius: 6 }}>
                        <Text type="warning" style={{ fontSize: 12 }}>
                          🎁 {activity.gift}
                        </Text>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>
    </div>
  );
};

export default Home;
