import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Input,
  Button,
  Select,
  DatePicker,
  Typography,
  Space,
  Tag,
  Carousel,
  Divider,
  Skeleton,
  message,
} from 'antd';
import {
  SearchOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  UserOutlined,
  StarOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { houseService } from '@/services/houseService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const hotCities = [
  { name: '北京', image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400', count: 1286 },
  { name: '上海', image: 'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=400', count: 2345 },
  { name: '三亚', image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400', count: 876 },
  { name: '杭州', image: 'https://images.unsplash.com/photo-1599571234909-29ed5d132156?w=400', count: 1567 },
  { name: '广州', image: 'https://images.unsplash.com/photo-1583433484590-92a5fe6e526a?w=400', count: 987 },
  { name: '成都', image: 'https://images.unsplash.com/photo-1590417975618-ce01bfb7919d?w=400', count: 765 },
];

const recommendedTags = [
  { label: '海景房', value: 'sea-view' },
  { label: '亲子游', value: 'family' },
  { label: '民宿', value: 'homestay' },
  { label: '别墅', value: 'villa' },
  { label: 'loft', value: 'loft' },
  { label: '可做饭', value: 'kitchen' },
  { label: '近地铁', value: 'metro' },
  { label: '带泳池', value: 'pool' },
];

const bannerImages = [
  {
    image: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1600',
    title: '精选好房，为您的旅程加分',
    subtitle: '超过100万套精选房源，总有一款适合您',
  },
  {
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600',
    title: '房东招募计划',
    subtitle: '发布您的房源，轻松赚取收入',
  },
  {
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600',
    title: '智能找房，精准匹配',
    subtitle: '发布您的需求，让房东主动联系您',
  },
];

function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [featuredHouses, setFeaturedHouses] = useState([]);
  const [searchParams, setSearchParams] = useState({
    city: '',
    checkInDate: null,
    checkOutDate: null,
    guests: 2,
  });

  useEffect(() => {
    fetchFeaturedHouses();
  }, []);

  const fetchFeaturedHouses = async () => {
    try {
      setLoading(true);
      const result = await houseService.getHouses({ limit: 8 });
      setFeaturedHouses(result.houses || []);
    } catch (error) {
      console.error('获取推荐房源失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchParams.city) params.append('city', searchParams.city);
    if (searchParams.checkInDate) {
      params.append('checkInDate', searchParams.checkInDate.format('YYYY-MM-DD'));
    }
    if (searchParams.checkOutDate) {
      params.append('checkOutDate', searchParams.checkOutDate.format('YYYY-MM-DD'));
    }
    navigate(`/houses?${params.toString()}`);
  };

  const handleCityClick = (cityName) => {
    navigate(`/houses?city=${encodeURIComponent(cityName)}`);
  };

  const handleHouseClick = (houseId) => {
    navigate(`/houses/${houseId}`);
  };

  return (
    <div>
      <Carousel
        autoplay
        effect="fade"
        style={{
          margin: '-24px -48px 48px -48px',
          position: 'relative',
        }}
      >
        {bannerImages.map((banner, index) => (
          <div key={index}>
            <div
              style={{
                height: 400,
                backgroundImage: `url(${banner.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Title
                  style={{
                    color: '#fff',
                    marginBottom: 8,
                    fontSize: 36,
                  }}
                >
                  {banner.title}
                </Title>
                <Text style={{ color: '#fff', fontSize: 18, marginBottom: 32 }}>
                  {banner.subtitle}
                </Text>

                <Card
                  style={{
                    width: '80%',
                    maxWidth: 800,
                    borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  }}
                >
                  <Row gutter={16} align="middle">
                    <Col span={8}>
                      <Select
                        placeholder="选择城市或目的地"
                        style={{ width: '100%' }}
                        size="large"
                        showSearch
                        value={searchParams.city || undefined}
                        onChange={(value) =>
                          setSearchParams({ ...searchParams, city: value })
                        }
                        options={hotCities.map((c) => ({
                          label: c.name,
                          value: c.name,
                        }))}
                        allowClear
                      />
                    </Col>
                    <Col span={8}>
                      <RangePicker
                        placeholder={['入住日期', '退房日期']}
                        style={{ width: '100%' }}
                        size="large"
                        onChange={(dates) => {
                          if (dates) {
                            setSearchParams({
                              ...searchParams,
                              checkInDate: dates[0],
                              checkOutDate: dates[1],
                            });
                          } else {
                            setSearchParams({
                              ...searchParams,
                              checkInDate: null,
                              checkOutDate: null,
                            });
                          }
                        }}
                        disabledDate={(current) =>
                          current && current < dayjs().startOf('day')
                        }
                      />
                    </Col>
                    <Col span={4}>
                      <Select
                        style={{ width: '100%' }}
                        size="large"
                        value={searchParams.guests}
                        onChange={(value) =>
                          setSearchParams({ ...searchParams, guests: value })
                        }
                        options={[
                          { label: '1人', value: 1 },
                          { label: '2人', value: 2 },
                          { label: '3人', value: 3 },
                          { label: '4人', value: 4 },
                          { label: '5人及以上', value: 5 },
                        ]}
                      />
                    </Col>
                    <Col span={4}>
                      <Button
                        type="primary"
                        size="large"
                        icon={<SearchOutlined />}
                        onClick={handleSearch}
                        style={{ width: '100%', height: 40 }}
                      >
                        搜索
                      </Button>
                    </Col>
                  </Row>
                </Card>
              </div>
            </div>
          </div>
        ))}
      </Carousel>

      <div style={{ marginBottom: 48 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <EnvironmentOutlined style={{ marginRight: 8 }} />
              热门城市
            </Title>
          </Col>
          <Col>
            <Button
              type="link"
              onClick={() => navigate('/houses')}
              style={{ color: '#ff4d4f' }}
            >
              查看更多 <RightOutlined />
            </Button>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {hotCities.map((city, index) => (
            <Col xs={12} sm={8} md={4} key={index}>
              <Card
                hoverable
                onClick={() => handleCityClick(city.name)}
                style={{ cursor: 'pointer' }}
                bodyStyle={{ padding: 0 }}
              >
                <div
                  style={{
                    height: 160,
                    backgroundImage: `url(${city.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '8px 8px 0 0',
                  }}
                />
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                    {city.name}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {city.count} 套房源
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Divider />

      <div style={{ marginBottom: 48 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <StarOutlined style={{ marginRight: 8, color: '#faad14' }} />
              精选推荐
            </Title>
          </Col>
          <Col>
            <Button
              type="link"
              onClick={() => navigate('/houses')}
              style={{ color: '#ff4d4f' }}
            >
              查看更多 <RightOutlined />
            </Button>
          </Col>
        </Row>

        {loading ? (
          <Row gutter={[24, 24]}>
            {[1, 2, 3, 4].map((i) => (
              <Col xs={24} sm={12} md={6} key={i}>
                <Skeleton active paragraph={{ rows: 4 }} />
              </Col>
            ))}
          </Row>
        ) : (
          <Row gutter={[24, 24]}>
            {featuredHouses.map((house) => (
              <Col xs={24} sm={12} md={6} key={house.id}>
                <Card
                  hoverable
                  className="card-hover"
                  onClick={() => handleHouseClick(house.id)}
                  bodyStyle={{ padding: 0 }}
                >
                  <div
                    style={{
                      height: 180,
                      backgroundImage: `url(${house.images?.[0] || 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=400'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: '8px 8px 0 0',
                      position: 'relative',
                    }}
                  >
                    {house.isFavorite && (
                      <Tag
                        color="red"
                        style={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                        }}
                      >
                        <HeartOutlined /> 已收藏
                      </Tag>
                    )}
                    <Tag
                      color="blue"
                      style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                      }}
                    >
                      {house.city}
                    </Tag>
                  </div>
                  <div style={{ padding: 16 }}>
                    <div
                      className="house-card-title ellipsis"
                      style={{ marginBottom: 8 }}
                    >
                      {house.title}
                    </div>
                    <div
                      className="house-card-info"
                      style={{ marginBottom: 12, fontSize: 12 }}
                    >
                      <Space size={16}>
                        <span>
                          <EnvironmentOutlined style={{ marginRight: 4 }} />
                          {house.district}
                        </span>
                        <span>
                          <UserOutlined style={{ marginRight: 4 }} />
                          {house.maxGuests}人
                        </span>
                        <span>
                          <StarOutlined
                            style={{ marginRight: 4, color: '#faad14' }}
                          />
                          {house.rating || 5.0}
                        </span>
                      </Space>
                    </div>
                    <div className="house-card-price">
                      <span style={{ fontSize: 24 }}>¥{house.pricePerNight}</span>
                      <span>/晚</span>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>

      <Divider />

      <div style={{ marginBottom: 48 }}>
        <Title level={3} style={{ marginBottom: 24, textAlign: 'center' }}>
          热门标签
        </Title>
        <div style={{ textAlign: 'center' }}>
          {recommendedTags.map((tag) => (
            <Tag
              key={tag.value}
              style={{
                fontSize: 14,
                padding: '8px 20px',
                margin: '0 12px 16px 0',
                borderRadius: 20,
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onClick={() => navigate(`/houses`)}
            >
              {tag.label}
            </Tag>
          ))}
        </div>
      </div>

      <Divider />

      <Row gutter={[32, 32]} justify="center" style={{ padding: '32px 0' }}>
        <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 48,
              color: '#ff4d4f',
              marginBottom: 16,
            }}
          >
            <HomeOutlined />
          </div>
          <Title level={4} style={{ marginBottom: 8 }}>
            百万房源
          </Title>
          <Text type="secondary">超过100万套精选房源，覆盖全国300+城市</Text>
        </Col>
        <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 48,
              color: '#52c41a',
              marginBottom: 16,
            }}
          >
            <StarOutlined />
          </div>
          <Title level={4} style={{ marginBottom: 8 }}>
            品质保障
          </Title>
          <Text type="secondary">严选优质房东，真实图片，安心入住</Text>
        </Col>
        <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 48,
              color: '#1890ff',
              marginBottom: 16,
            }}
          >
            <UserOutlined />
          </div>
          <Title level={4} style={{ marginBottom: 8 }}>
            贴心服务
          </Title>
          <Text type="secondary">7x24小时客服支持，预订全程保障</Text>
        </Col>
      </Row>
    </div>
  );
}

export default Home;
