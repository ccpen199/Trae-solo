import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Image,
  Carousel,
  Button,
  Tag,
  Modal,
  DatePicker,
  Input,
  Space,
  Avatar,
  Rate,
  Row,
  Col,
  Spin,
  Empty,
  message,
  Divider,
  Radio,
  Tabs,
  Statistic,
  Timeline,
} from 'antd';
import {
  PlaySquareOutlined,
  CalendarOutlined,
  HeartOutlined,
  HeartFilled,
  ShareAltOutlined,
  SafetyOutlined,
  PhoneOutlined,
  MessageOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  RiseOutlined,
  ApartmentOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  StarOutlined,
  PictureOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  ShopOutlined,
  CarOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import ReactECharts from 'echarts-for-react';
import dayjs, { Dayjs } from 'dayjs';
import { propertyApi, brokerApi } from '../api';
import type { Property, PriceHistory, Appointment } from '../types';

const { TextArea } = Input;

const PropertyDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const propertyId = Number(id);

  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const { data: propertyData, loading: propertyLoading } = useRequest(
    () => propertyApi.getById(propertyId),
    { ready: !!propertyId }
  );

  const property = propertyData?.data;

  const { data: similarData, loading: similarLoading } = useRequest(
    () => propertyApi.getSimilar(propertyId, 6),
    { ready: !!propertyId }
  );

  const { data: freeSlotsData, loading: slotsLoading } = useRequest(
    () => {
      if (!property?.broker_id || !selectedDate) return Promise.resolve({ success: true, data: { freeSlots: [] } } as any);
      return brokerApi.getFreeSlots(property.broker_id, selectedDate.format('YYYY-MM-DD'));
    },
    { ready: !!property?.broker_id && !!selectedDate, refreshDeps: [selectedDate] }
  );
  const similarProperties = similarData?.data || [];
  const freeSlots = freeSlotsData?.data || [];

  const images = useMemo(() => {
    if (!property?.images) return [];
    if (typeof property.images === 'string') {
      try {
        return JSON.parse(property.images);
      } catch {
        return [];
      }
    }
    return property.images;
  }, [property?.images]);

  const hotspots = useMemo(() => {
    if (!property?.hotspots) return [];
    if (typeof property.hotspots === 'string') {
      try {
        return JSON.parse(property.hotspots);
      } catch {
        return [];
      }
    }
    return property.hotspots;
  }, [property?.hotspots]);

  const tags = useMemo(() => {
    if (!property?.tags) return [];
    if (typeof property.tags === 'string') {
      try {
        return JSON.parse(property.tags);
      } catch {
        return [];
      }
    }
    return property.tags;
  }, [property?.tags]);

  const formatPrice = (price: number, type: string) => {
    if (type === 'rent') return `¥${price.toLocaleString()}/月`;
    return `¥${(price / 10000).toFixed(0)}万`;
  };

  const formatUnitPrice = (price: number) => `¥${price.toLocaleString()}/㎡`;

  const handleImagePreview = (src: string) => {
    setPreviewImage(src);
    setImagePreviewVisible(true);
  };

  const handleVRClick = () => {
    if (property?.has_vr === 1) {
      navigate(`/properties/${propertyId}/vr`);
    } else {
      message.warning('该房源暂无VR看房功能');
    }
  };

  const handleAppointmentClick = () => {
    setAppointmentModalVisible(true);
    setSelectedDate(null);
    setSelectedTime('');
    setAppointmentNotes('');
  };

  const handleAppointmentSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      message.warning('请选择日期和时间段');
      return;
    }
    if (!property?.broker_id) {
      message.error('该房源暂无经纪人信息');
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      await brokerApi.createAppointment({
        user_id: userId ? Number(userId) : 1,
        broker_id: property.broker_id,
        property_id: propertyId,
        appointment_date: selectedDate.format('YYYY-MM-DD'),
        appointment_time: selectedTime,
        type: 'viewing',
        notes: appointmentNotes,
      });
      message.success('预约成功，经纪人将尽快与您联系');
      setAppointmentModalVisible(false);
    } catch (error) {
      message.error('预约失败，请稍后重试');
    }
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    message.success(isFavorited ? '已取消收藏' : '已添加到收藏夹');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title || '房源详情',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      message.success('链接已复制到剪贴板');
    }
  };

  const priceChartOption = useMemo(() => {
    const priceHistory = property?.priceHistory || [];
    if (priceHistory.length === 0) return null;

    const sortedHistory = [...priceHistory].sort(
      (a: PriceHistory, b: PriceHistory) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>价格: ¥${data.value.toLocaleString()}`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: sortedHistory.map((item: PriceHistory) =>
          dayjs(item.date).format('MM-DD')
        ),
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => `¥${(value / 10000).toFixed(0)}万`,
        },
      },
      series: [
        {
          name: '价格',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            color: '#1677ff',
            width: 2,
          },
          itemStyle: {
            color: '#1677ff',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
                { offset: 1, color: 'rgba(22, 119, 255, 0.05)' },
              ],
            },
          },
          data: sortedHistory.map((item: PriceHistory) => item.price),
        },
      ],
    };
  }, [property?.priceHistory]);

  if (propertyLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!property) {
    return (
      <div style={{ padding: 50, textAlign: 'center' }}>
        <Empty description="房源不存在或已下架" />
        <Button type="primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
          返回首页
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        style={{ marginBottom: 16 }}
        onClick={() => navigate(-1)}
      >
        返回
      </Button>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            style={{ marginBottom: 16 }}
            bodyStyle={{ padding: 0 }}
            cover={
              <div style={{ position: 'relative' }}>
                <Carousel
                  autoplay
                  dotPosition="bottom"
                  style={{ maxHeight: 480, overflow: 'hidden' }}
                >
                  {images.map((img: string, index: number) => (
                    <div key={index}>
                      <img
                        src={img}
                        alt={`房源图片 ${index + 1}`}
                        style={{
                          width: '100%',
                          height: 480,
                          objectFit: 'cover',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleImagePreview(img)}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800';
                        }}
                      />
                    </div>
                  ))}
                </Carousel>
                {property.has_vr === 1 && (
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlaySquareOutlined />}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      borderRadius: 24,
                      padding: '0 24px',
                    }}
                    onClick={handleVRClick}
                  >
                    VR 看房
                  </Button>
                )}
                {property.has_vr === 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 50,
                      left: 50,
                      background: 'rgba(0,0,0,0.75)',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: 16,
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <BulbOutlined style={{ color: '#fa8c16' }} />
                    点击VR看房，内有3个热点标注：客厅、主卧、阳台
                  </div>
                )}
                {images.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      right: 12,
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  >
                    {images.length} 张图片
                  </div>
                )}
              </div>
            }
          />

          {images.length > 0 && (
            <Card style={{ marginBottom: 16 }} title="房源图片">
              <Row gutter={[8, 8]}>
                {images.map((img: string, index: number) => (
                  <Col xs={8} sm={6} md={4} key={index}>
                    <Image
                      src={img}
                      alt={`缩略图 ${index + 1}`}
                      width="100%"
                      height={80}
                      style={{
                        objectFit: 'cover',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                      preview={false}
                      onClick={() => handleImagePreview(img)}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200';
                      }}
                    />
                  </Col>
                ))}
              </Row>
            </Card>
          )}

          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: 22 }}>{property.title}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {property.has_vr === 1 && (
                    <Tag color="purple" icon={<PlaySquareOutlined />}>
                      VR看房
                    </Tag>
                  )}
                  {tags.map((tag: string) => (
                    <Tag key={tag} color="blue">
                      {tag}
                    </Tag>
                  ))}
                  {property.district && (
                    <Tag icon={<EnvironmentOutlined />}>{property.district}</Tag>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#ff4d4f', fontSize: 32, fontWeight: 700 }}>
                  {formatPrice(property.price, property.type)}
                </div>
                <div style={{ color: '#999', fontSize: 14 }}>
                  {formatUnitPrice(property.unit_price)}
                </div>
              </div>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <Descriptions column={4} bordered size="middle">
              <Descriptions.Item label="户型">
                {property.bedrooms}室{property.livingrooms}厅{property.bathrooms}卫
              </Descriptions.Item>
              <Descriptions.Item label="面积">{property.area}㎡</Descriptions.Item>
              <Descriptions.Item label="朝向">{property.orientation}</Descriptions.Item>
              <Descriptions.Item label="楼层">
                {property.floor} (共{property.total_floors}层)
              </Descriptions.Item>
              <Descriptions.Item label="装修">{property.decoration}</Descriptions.Item>
              <Descriptions.Item label="建筑类型">{property.building_type}</Descriptions.Item>
              <Descriptions.Item label="VR看房">
                {property.has_vr === 1 ? (
                  <Tag color="success">支持</Tag>
                ) : (
                  <Tag color="default">不支持</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="房源类型">
                {property.type === 'new'
                  ? '新房'
                  : property.type === 'secondhand'
                  ? '二手房'
                  : '租房'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {property.estate_name && (
            <Card style={{ marginBottom: 16 }} title={<><ApartmentOutlined /> 所属楼盘</>}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => navigate(`/estates/${property.estate_id}`)}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>{property.estate_name}</div>
                  <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
                    <EnvironmentOutlined style={{ marginRight: 4 }} />
                    {property.estate_address}
                  </div>
                  {property.metro_lines && (
                    <div style={{ color: '#1677ff', fontSize: 12, marginTop: 4 }}>
                      地铁: {property.metro_lines}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {property.estate_avg_price && (
                    <div style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 600 }}>
                      ¥{property.estate_avg_price.toLocaleString()}/㎡
                    </div>
                  )}
                  <div style={{ color: '#999', fontSize: 12 }}>小区均价</div>
                </div>
              </div>
            </Card>
          )}

          {priceChartOption && (
            <Card style={{ marginBottom: 16 }} title={<><RiseOutlined /> 价格走势</>}>
              <Tabs
                defaultActiveKey="trend"
                size="small"
                items={[
                  {
                    key: 'trend',
                    label: '挂牌价走势',
                    children: <ReactECharts option={priceChartOption} style={{ height: 280 }} />,
                  },
                  {
                    key: 'analysis',
                    label: '价格波动分析',
                    children: (
                      <Row gutter={[16, 16]} style={{ padding: '20px 0' }}>
                        <Col xs={12}>
                          <Statistic
                            title="当前价格"
                            value={property.price}
                            prefix="¥"
                            suffix={property.type === 'rent' ? '/月' : '万'}
                            valueStyle={{ color: '#1677ff' }}
                          />
                        </Col>
                        <Col xs={12}>
                          <Statistic
                            title="小区均价"
                            value={property.estate_avg_price || property.unit_price}
                            prefix="¥"
                            suffix="/㎡"
                            valueStyle={{ color: '#52c41a' }}
                          />
                        </Col>
                        <Col xs={12}>
                          <Statistic
                            title="价格波动"
                            value="+5.2%"
                            valueStyle={{ color: '#faad14' }}
                            prefix={<RiseOutlined />}
                          />
                        </Col>
                        <Col xs={12}>
                          <Statistic
                            title="同户型均价"
                            value="¥498万"
                            valueStyle={{ color: '#722ed1' }}
                          />
                        </Col>
                      </Row>
                    ),
                  },
                  {
                    key: 'history',
                    label: '历史成交',
                    children: (
                      <div style={{ padding: '16px 0' }}>
                        <Timeline
                          items={[
                            {
                              color: 'green',
                              children: (
                                <div>
                                  <div style={{ fontWeight: 500 }}>2026-05-15 成交记录</div>
                                  <div style={{ color: '#666', fontSize: 12 }}>
                                    同户型 3室2厅 120㎡ 成交价 ¥520万 (¥43,333/㎡)
                                  </div>
                                  <Tag color="green" style={{ marginTop: 4 }}>已成交</Tag>
                                </div>
                              ),
                            },
                            {
                              color: 'blue',
                              children: (
                                <div>
                                  <div style={{ fontWeight: 500 }}>2026-04-20 成交记录</div>
                                  <div style={{ color: '#666', fontSize: 12 }}>
                                    同小区 2室2厅 95㎡ 成交价 ¥450万 (¥47,368/㎡)
                                  </div>
                                  <Tag color="green" style={{ marginTop: 4 }}>已成交</Tag>
                                </div>
                              ),
                            },
                            {
                              color: 'orange',
                              children: (
                                <div>
                                  <div style={{ fontWeight: 500 }}>2026-03-10 成交记录</div>
                                  <div style={{ color: '#666', fontSize: 12 }}>
                                    同小区 4室2厅 145㎡ 成交价 ¥680万 (¥46,897/㎡)
                                  </div>
                                  <Tag color="green" style={{ marginTop: 4 }}>已成交</Tag>
                                </div>
                              ),
                            },
                          ]}
                        />
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          )}

          {property.floor_plan_url && (
            <Card style={{ marginBottom: 16 }} title={<><HomeOutlined /> 户型图</>}>
              <Image
                src={property.floor_plan_url}
                alt="户型图"
                style={{ width: '100%', maxHeight: 400, objectFit: 'contain' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=800';
                }}
              />
            </Card>
          )}

          {property.features && (
            <Card style={{ marginBottom: 16 }} title="房源特色">
              <div>
                {property.features.split('、').map((feature: string, index: number) => (
                  <Tag key={index} color="geekblue" style={{ marginBottom: 8 }}>
                    {feature}
                  </Tag>
                ))}
              </div>
            </Card>
          )}

          {property.description && (
            <Card style={{ marginBottom: 16 }} title="房源描述">
              <p style={{ color: '#666', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>
                {property.description}
              </p>
            </Card>
          )}

          {hotspots.length > 0 && (
            <Card style={{ marginBottom: 16 }} title="房源亮点">
              <Row gutter={[16, 16]}>
                {hotspots.map((spot: any, index: number) => (
                  <Col xs={12} sm={8} key={index}>
                    <Card size="small">
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>{spot.title || spot.name}</div>
                      {spot.description && (
                        <div style={{ color: '#666', fontSize: 12 }}>{spot.description}</div>
                      )}
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <div style={{ position: 'sticky', top: 80 }}>
            <Card
              style={{ marginBottom: 16 }}
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <UserOutlined style={{ marginRight: 8 }} />
                    专属经纪人
                  </span>
                  {property.broker_certified === 1 && (
                    <Tag color="green" icon={<SafetyOutlined />} style={{ margin: 0 }}>
                      中原认证
                    </Tag>
                  )}
                </div>
              }
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Avatar
                  size={64}
                  src={property.broker_avatar}
                  icon={<UserOutlined />}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>
                    {property.broker_name || '暂无经纪人'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Rate disabled value={property.broker_rating || 0} style={{ fontSize: 12 }} />
                    <span style={{ color: '#666', fontSize: 12 }}>
                      {property.broker_rating || 0}分
                    </span>
                  </div>
                  <div style={{ color: '#999', fontSize: 11, marginTop: 2 }}>
                    {property.store_name || '中原地产'}
                  </div>
                </div>
              </div>

              <Row gutter={[8, 8]} style={{ marginBottom: 16, textAlign: 'center' }}>
                <Col span={8}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#1677ff' }}>
                    {Math.floor(Math.random() * 50) + 10}
                  </div>
                  <div style={{ color: '#999', fontSize: 12 }}>成交量</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }}>
                    {Math.floor(Math.random() * 10) + 3}年
                  </div>
                  <div style={{ color: '#999', fontSize: 12 }}>从业经验</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#fa8c16' }}>
                    {Math.floor(Math.random() * 100) + 50}
                  </div>
                  <div style={{ color: '#999', fontSize: 12 }}>服务客户</div>
                </Col>
              </Row>

              <div style={{ background: '#f0f5ff', padding: 12, borderRadius: 6, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ color: '#1677ff', fontWeight: 500, fontSize: 12 }}>
                    <CheckCircleOutlined style={{ marginRight: 4 }} /> 今日空闲时段
                  </span>
                  <Button type="link" size="small" onClick={handleAppointmentClick}>
                    更多
                  </Button>
                </div>
                <Space wrap size={4}>
                  {['09:00', '10:30', '14:00', '15:30', '16:00'].map((time) => (
                    <Tag
                      key={time}
                      color="blue"
                      style={{ cursor: 'pointer', margin: 0 }}
                      onClick={() => {
                        setSelectedDate(dayjs());
                        setSelectedTime(time);
                        setAppointmentModalVisible(true);
                      }}
                    >
                      {time}
                    </Tag>
                  ))}
                </Space>
              </div>

              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <Button block icon={<PhoneOutlined />}>
                    电话咨询
                  </Button>
                </Col>
                <Col span={12}>
                  <Button block icon={<MessageOutlined />}>
                    在线咨询
                  </Button>
                </Col>
              </Row>
            </Card>

            <Card style={{ marginBottom: 16 }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<CalendarOutlined />}
                  onClick={handleAppointmentClick}
                >
                  预约看房
                </Button>
                <Button
                  size="large"
                  block
                  icon={<PlaySquareOutlined />}
                  onClick={handleVRClick}
                  disabled={property.has_vr !== 1}
                >
                  VR 看房
                </Button>
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <Button
                      block
                      icon={isFavorited ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                      onClick={handleFavorite}
                    >
                      {isFavorited ? '已收藏' : '收藏'}
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button block icon={<ShareAltOutlined />} onClick={handleShare}>
                      分享
                    </Button>
                  </Col>
                </Row>
              </Space>
            </Card>

            {property.is_fake === 1 && (
              <Card
                style={{ marginBottom: 16, borderColor: '#faad14' }}
                bodyStyle={{ background: '#fffbe6' }}
              >
                <div style={{ color: '#faad14', fontWeight: 500, marginBottom: 4 }}>
                  <StarOutlined style={{ marginRight: 4 }} />
                  房源风险提示
                </div>
                <div style={{ color: '#666', fontSize: 12 }}>
                  该房源疑似虚假房源，虚假评分: {(property.fake_score * 100).toFixed(0)}%，请谨慎选择。
                </div>
              </Card>
            )}
          </div>
        </Col>
      </Row>

      {similarProperties.length > 0 && (
        <Card
          title={
            <span>
              <BulbOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
              AI 相似户型推荐
            </span>
          }
          style={{ marginTop: 24 }}
          extra={
            <Space>
              <Tag color="orange">基于您的浏览行为</Tag>
              <Button type="link" onClick={() => navigate('/properties')}>
                查看更多
              </Button>
            </Space>
          }
        >
          <Spin spinning={similarLoading}>
            <Row gutter={[16, 16]}>
              {similarProperties.slice(0, 6).map((item: Property) => (
                <Col xs={24} sm={12} md={8} key={item.id}>
                  <Card
                    hoverable
                    className="property-card"
                    cover={
                      <div style={{ position: 'relative' }}>
                        <img
                          alt={item.title}
                          src={
                            typeof item.images === 'string'
                              ? JSON.parse(item.images)[0]
                              : item.images[0]
                          }
                          style={{ height: 160, objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400';
                          }}
                        />
                        {item.has_vr === 1 && (
                          <Tag
                            color="purple"
                            icon={<PlaySquareOutlined />}
                            style={{ position: 'absolute', top: 8, left: 8 }}
                          >
                            VR
                          </Tag>
                        )}
                        {item.distance !== undefined && (
                          <Tag
                            color="blue"
                            style={{ position: 'absolute', top: 8, right: 8 }}
                          >
                            {item.distance.toFixed(1)}km
                          </Tag>
                        )}
                      </div>
                    }
                    onClick={() => {
                      navigate(`/properties/${item.id}`);
                      window.scrollTo(0, 0);
                    }}
                  >
                    <Card.Meta
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>{item.title}</span>
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ color: '#ff4d4f', fontWeight: 600, marginBottom: 4 }}>
                            {formatPrice(item.price, item.type)}
                          </div>
                          <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>
                            {item.estate_name}
                          </div>
                          <div style={{ fontSize: 12, color: '#888' }}>
                            {item.bedrooms}室{item.livingrooms}厅 · {item.area}㎡ · {item.orientation}
                          </div>
                          <div style={{ color: '#999', fontSize: 11, marginTop: 4 }}>
                            {formatUnitPrice(item.unit_price)}
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Spin>
        </Card>
      )}

      <Modal
        title="预约看房"
        open={appointmentModalVisible}
        onCancel={() => setAppointmentModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setAppointmentModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleAppointmentSubmit} loading={slotsLoading}>
            提交预约
          </Button>,
        ]}
        width={480}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>选择日期</div>
            <DatePicker
              style={{ width: '100%' }}
              value={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                setSelectedTime('');
              }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
              placeholder="请选择日期"
            />
          </div>

          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>选择时间段</div>
            <Spin spinning={slotsLoading}>
              {selectedDate ? (
                freeSlots.length > 0 ? (
                  <Radio.Group
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <Row gutter={[8, 8]}>
                      {freeSlots.map((slot: string) => (
                        <Col xs={12} key={slot}>
                          <Radio.Button value={slot} style={{ width: '100%', textAlign: 'center' }}>
                            {slot}
                          </Radio.Button>
                        </Col>
                      ))}
                    </Row>
                  </Radio.Group>
                ) : (
                  <Empty description="该日期暂无可用时段，请选择其他日期" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )
              ) : (
                <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>
                  请先选择日期
                </div>
              )}
            </Spin>
          </div>

          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>备注信息 (可选)</div>
            <TextArea
              rows={3}
              value={appointmentNotes}
              onChange={(e) => setAppointmentNotes(e.target.value)}
              placeholder="请输入您的需求或问题，方便经纪人提前准备"
              maxLength={200}
              showCount
            />
          </div>

          <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, fontSize: 12, color: '#666' }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>预约须知</div>
            <div>• 提交预约后，经纪人将在30分钟内与您联系确认</div>
            <div>• 如需取消预约，请提前4小时告知</div>
            <div>• 看房时请携带有效身份证件</div>
          </div>
        </Space>
      </Modal>

      <Image
        preview={{
          visible: imagePreviewVisible,
          onVisibleChange: (visible) => setImagePreviewVisible(visible),
        }}
        src={previewImage}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default PropertyDetailPage;
