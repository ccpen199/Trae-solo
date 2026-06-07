import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
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
  List,
  Select,
  Descriptions,
} from 'antd';
import {
  PhoneOutlined,
  MessageOutlined,
  EnvironmentOutlined,
  SafetyOutlined,
  HeartOutlined,
  HeartFilled,
  CalendarOutlined,
  ArrowLeftOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  HomeOutlined,
  UserOutlined,
  StarOutlined,
  RiseOutlined,
  DesktopOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import dayjs, { Dayjs } from 'dayjs';
import { brokerApi, propertyApi } from '../api';
import type { Broker, Property } from '../types';

const { TextArea } = Input;
const { TabPane } = Tabs;

const BrokerDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const brokerId = Number(id);

  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeTab, setActiveTab] = useState('properties');

  const { data: brokerData, loading: brokerLoading } = useRequest(
    () => brokerApi.getById(brokerId),
    { ready: !!brokerId }
  );

  const { data: freeSlotsData, loading: slotsLoading, refresh: refreshSlots } = useRequest(
    () => {
      const date = selectedDate ? selectedDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
      return brokerApi.getFreeSlots(brokerId, date);
    },
    { ready: !!brokerId, refreshDeps: [selectedDate] }
  );

  const { data: propertiesData, loading: propertiesLoading } = useRequest(
    () => propertyApi.getList({ broker_id: brokerId, status: 'available' }),
    { ready: !!brokerId }
  );

  const broker = brokerData?.data;
  const properties = propertiesData?.data || [];
  const freeSlots = freeSlotsData?.data || [];

  const formatPrice = (price: number, type: string) => {
    if (type === 'rent') return `¥${price.toLocaleString()}/月`;
    return `¥${(price / 10000).toFixed(0)}万`;
  };

  const formatUnitPrice = (price: number) => `¥${price.toLocaleString()}/㎡`;

  const getPropertyImages = (images: string | string[]): string[] => {
    if (!images) return [];
    if (typeof images === 'string') {
      try {
        return JSON.parse(images);
      } catch {
        return [];
      }
    }
    return images;
  };

  const getPropertyTags = (tags: string | string[]): string[] => {
    if (!tags) return [];
    if (typeof tags === 'string') {
      try {
        return JSON.parse(tags);
      } catch {
        return [];
      }
    }
    return tags;
  };

  const handleNavigate = () => {
    if (broker?.store_lat && broker?.store_lng) {
      const url = `https://uri.amap.com/marker?position=${broker.store_lng},${broker.store_lat}&name=${encodeURIComponent(broker.store_name || '门店')}`;
      window.open(url, '_blank');
    } else {
      message.warning('暂无门店位置信息');
    }
  };

  const handleAppointmentClick = (time?: string) => {
    setAppointmentModalVisible(true);
    setSelectedProperty(null);
    setSelectedDate(dayjs());
    setSelectedTime(time || '');
    setAppointmentNotes('');
    if (time) {
      refreshSlots();
    }
  };

  const handleAppointmentSubmit = async () => {
    if (!selectedProperty) {
      message.warning('请选择房源');
      return;
    }
    if (!selectedDate || !selectedTime) {
      message.warning('请选择日期和时间段');
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      await brokerApi.createAppointment({
        user_id: userId ? Number(userId) : 1,
        broker_id: brokerId,
        property_id: selectedProperty,
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

  const handlePhoneCall = () => {
    if (broker?.phone) {
      window.location.href = `tel:${broker.phone}`;
    } else {
      message.warning('暂无联系电话');
    }
  };

  const handleOnlineChat = () => {
    message.info('在线咨询功能开发中...');
  };

  const handleWorkbench = () => {
    navigate(`/brokers/${brokerId}/workbench`);
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    message.success(isFavorited ? '已取消收藏' : '已收藏经纪人');
  };

  const handlePropertyClick = (propertyId: number) => {
    navigate(`/properties/${propertyId}`);
  };

  const mockViewingRecords = [
    {
      id: 1,
      property_title: '万科城市花园 3室2厅',
      viewing_date: '2024-01-15',
      viewing_time: '14:00-15:00',
      status: 'completed',
      feedback: '经纪人很专业，讲解详细',
      rating: 5,
    },
    {
      id: 2,
      property_title: '保利中央公园 2室1厅',
      viewing_date: '2024-01-10',
      viewing_time: '10:00-11:00',
      status: 'completed',
      feedback: '房源信息真实，服务态度好',
      rating: 4,
    },
    {
      id: 3,
      property_title: '碧桂园凤凰城 4室2厅',
      viewing_date: '2024-01-05',
      viewing_time: '15:30-16:30',
      status: 'completed',
      feedback: '非常满意的一次看房体验',
      rating: 5,
    },
  ];

  const mockReviews = [
    {
      id: 1,
      user_name: '张先生',
      user_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      rating: 5,
      content: '李经纪人非常专业，对周边楼盘了如指掌，给了我们很多实用的建议。整个看房过程非常愉快，最终也买到了心仪的房子。',
      created_at: '2024-01-12',
      property_title: '万科城市花园',
    },
    {
      id: 2,
      user_name: '王女士',
      user_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      rating: 5,
      content: '服务态度特别好，很有耐心。我们看了很多套房子，经纪人一直很热情地陪同讲解。后续的过户手续也办理得很顺利。',
      created_at: '2024-01-08',
      property_title: '保利中央公园',
    },
    {
      id: 3,
      user_name: '刘先生',
      user_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      rating: 4,
      content: '整体服务不错，房源信息真实。唯一的小建议是希望能更多地了解我们的需求，推荐更精准的房源。',
      created_at: '2024-01-03',
      property_title: '碧桂园凤凰城',
    },
  ];

  if (brokerLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!broker) {
    return (
      <div style={{ padding: 50, textAlign: 'center' }}>
        <Empty description="经纪人不存在" />
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
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
              <Avatar
                size={100}
                src={broker.avatar}
                icon={<UserOutlined />}
                style={{ border: '4px solid #f0f0f0' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0, fontSize: 24 }}>{broker.name}</h1>
                  {broker.certified === 1 && (
                    <Tag color="green" icon={<SafetyOutlined />}>
                      认证经纪人
                    </Tag>
                  )}
                </div>
                {broker.certification_no && (
                  <div style={{ color: '#999', fontSize: 13, marginBottom: 8 }}>
                    证书编号: {broker.certification_no}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Rate disabled value={broker.rating || 0} style={{ fontSize: 16 }} />
                    <span style={{ color: '#faad14', fontWeight: 600, fontSize: 16 }}>
                      {broker.rating || 0}
                    </span>
                    <span style={{ color: '#999', fontSize: 12 }}>分</span>
                  </div>
                  <Tag color="blue" icon={<RiseOutlined />}>
                    成交量 {broker.deal_count || 0}
                  </Tag>
                  <Tag color="orange" icon={<ClockCircleOutlined />}>
                    从业 {broker.experience_years || 0} 年
                  </Tag>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button
                    type="primary"
                    icon={<PhoneOutlined />}
                    onClick={handlePhoneCall}
                  >
                    电话咨询
                  </Button>
                  <Button
                    icon={<MessageOutlined />}
                    onClick={handleOnlineChat}
                  >
                    在线咨询
                  </Button>
                  <Button
                    icon={<DesktopOutlined />}
                    onClick={handleWorkbench}
                  >
                    进入工作台
                  </Button>
                  <Button
                    icon={isFavorited ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                    onClick={handleFavorite}
                  >
                    {isFavorited ? '已收藏' : '收藏经纪人'}
                  </Button>
                </div>
              </div>
            </div>

            {broker.description && (
              <>
                <Divider style={{ margin: '20px 0' }} />
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>个人简介</div>
                  <p style={{ color: '#666', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {broker.description}
                  </p>
                </div>
              </>
            )}
          </Card>

          <Card style={{ marginBottom: 16 }} title={<><ShopOutlined /> 门店信息</>}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="门店名称">
                    {broker.store_name || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="门店地址">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <EnvironmentOutlined style={{ color: '#1677ff' }} />
                      <span>{broker.store_address || '-'}</span>
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label="营业时间">
                    {broker.business_hours || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="联系电话">
                    {broker.store_phone || broker.phone || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col xs={24} md={12}>
                <div
                  style={{
                    height: 180,
                    background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
                    borderRadius: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: 48,
                    }}
                  >
                    📍
                  </div>
                  <div style={{ zIndex: 1, textAlign: 'center', marginTop: 60 }}>
                    <Button
                      type="primary"
                      icon={<CarOutlined />}
                      onClick={handleNavigate}
                      disabled={!broker.store_lat || !broker.store_lng}
                    >
                      导航到门店
                    </Button>
                  </div>
                  {(broker.store_lat || broker.store_lng) && (
                    <div style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 10, color: '#999' }}>
                      {broker.store_lat?.toFixed(4)}, {broker.store_lng?.toFixed(4)}
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </Card>

          <Card
            style={{ marginBottom: 16 }}
            title={<><CalendarOutlined /> 今日空闲时段</>}
            extra={
              <Button type="link" onClick={() => handleAppointmentClick()}>
                立即预约
              </Button>
            }
          >
            <Spin spinning={slotsLoading}>
              {freeSlots.length > 0 ? (
                <Row gutter={[8, 8]}>
                  {freeSlots.map((slot: string) => (
                    <Col xs={8} sm={6} md={4} key={slot}>
                      <Button
                        block
                        style={{ borderRadius: 16 }}
                        onClick={() => handleAppointmentClick(slot)}
                      >
                        {slot}
                      </Button>
                    </Col>
                  ))}
                </Row>
              ) : (
                <Empty description="今日暂无空闲时段" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Spin>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab={<><HomeOutlined /> 在售房源 ({properties.length})</>} key="properties">
                <Spin spinning={propertiesLoading}>
                  {properties.length > 0 ? (
                    <List
                      grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }}
                      dataSource={properties}
                      renderItem={(property: Property) => {
                        const images = getPropertyImages(property.images);
                        const tags = getPropertyTags(property.tags);
                        return (
                          <List.Item>
                            <Card
                              hoverable
                              cover={
                                <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                                  <img
                                    alt={property.title}
                                    src={images[0]}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                    }}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400';
                                    }}
                                  />
                                  <Tag
                                    color={property.type === 'rent' ? 'orange' : 'red'}
                                    style={{ position: 'absolute', top: 8, left: 8 }}
                                  >
                                    {property.type === 'new'
                                      ? '新房'
                                      : property.type === 'secondhand'
                                      ? '二手房'
                                      : '租房'}
                                  </Tag>
                                </div>
                              }
                              onClick={() => handlePropertyClick(property.id)}
                              bodyStyle={{ padding: 12 }}
                            >
                              <div
                                style={{
                                  fontSize: 14,
                                  fontWeight: 500,
                                  marginBottom: 6,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {property.title}
                              </div>
                              <div style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 600, marginBottom: 6 }}>
                                {formatPrice(property.price, property.type)}
                                <span style={{ color: '#999', fontSize: 12, fontWeight: 400, marginLeft: 4 }}>
                                  {formatUnitPrice(property.unit_price)}
                                </span>
                              </div>
                              <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
                                {property.bedrooms}室{property.livingrooms}厅 · {property.area}㎡ · {property.orientation}
                              </div>
                              {tags.length > 0 && (
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                  {tags.slice(0, 3).map((tag: string) => (
                                    <Tag key={tag} color="blue" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                                      {tag}
                                    </Tag>
                                  ))}
                                </div>
                              )}
                            </Card>
                          </List.Item>
                        );
                      }}
                    />
                  ) : (
                    <Empty description="暂无在售房源" />
                  )}
                </Spin>
              </TabPane>

              <TabPane tab={<><CalendarOutlined /> 带看记录 ({mockViewingRecords.length})</>} key="viewings">
                <List
                  dataSource={mockViewingRecords}
                  renderItem={(record) => (
                    <List.Item key={record.id}>
                      <Card style={{ width: '100%' }} size="small">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 500, marginBottom: 4 }}>{record.property_title}</div>
                            <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>
                              <CalendarOutlined style={{ marginRight: 4 }} />
                              {record.viewing_date} {record.viewing_time}
                            </div>
                            {record.feedback && (
                              <div style={{ color: '#888', fontSize: 12 }}>
                                评价: {record.feedback}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <Tag color={record.status === 'completed' ? 'green' : 'blue'}>
                              {record.status === 'completed' ? '已完成' : '待带看'}
                            </Tag>
                            <div style={{ marginTop: 4 }}>
                              <Rate disabled value={record.rating} style={{ fontSize: 12 }} />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </List.Item>
                  )}
                />
              </TabPane>

              <TabPane tab={<><StarOutlined /> 客户评价 ({mockReviews.length})</>} key="reviews">
                <List
                  dataSource={mockReviews}
                  renderItem={(review) => (
                    <List.Item key={review.id}>
                      <Card style={{ width: '100%' }} size="small">
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <Avatar
                            size={48}
                            src={review.user_avatar}
                            icon={<UserOutlined />}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <div style={{ fontWeight: 500 }}>{review.user_name}</div>
                              <div style={{ color: '#999', fontSize: 12 }}>{review.created_at}</div>
                            </div>
                            <div style={{ marginBottom: 8 }}>
                              <Rate disabled value={review.rating} style={{ fontSize: 12 }} />
                              <Tag color="blue" style={{ marginLeft: 8, fontSize: 10 }}>
                                {review.property_title}
                              </Tag>
                            </div>
                            <p style={{ color: '#666', lineHeight: 1.6, margin: 0 }}>
                              {review.content}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </List.Item>
                  )}
                />
              </TabPane>
            </Tabs>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <div style={{ position: 'sticky', top: 80 }}>
            <Card
              style={{ marginBottom: 16 }}
              title={<><CalendarOutlined /> 预约看房</>}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<CalendarOutlined />}
                  onClick={() => handleAppointmentClick()}
                >
                  立即预约
                </Button>
                <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, fontSize: 12, color: '#666' }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>服务承诺</div>
                  <div>• 30分钟内响应预约</div>
                  <div>• 全程专业陪同带看</div>
                  <div>• 真实房源，假一赔百</div>
                </div>
              </Space>
            </Card>

            <Card
              style={{ marginBottom: 16 }}
              title={<><StarOutlined /> 服务数据</>}
            >
              <Row gutter={[8, 16]} style={{ textAlign: 'center' }}>
                <Col span={8}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#1677ff' }}>
                    {broker.deal_count || 0}
                  </div>
                  <div style={{ color: '#999', fontSize: 12 }}>成交量</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>
                    {broker.experience_years || 0}
                  </div>
                  <div style={{ color: '#999', fontSize: 12 }}>从业年限</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#faad14' }}>
                    {broker.rating || 0}
                  </div>
                  <div style={{ color: '#999', fontSize: 12 }}>评分</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#722ed1' }}>
                    {properties.length}
                  </div>
                  <div style={{ color: '#999', fontSize: 12 }}>在卖房源</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#eb2f96' }}>
                    {mockViewingRecords.length}
                  </div>
                  <div style={{ color: '#999', fontSize: 12 }}>带看次数</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#13c2c2' }}>
                    {mockReviews.length}
                  </div>
                  <div style={{ color: '#999', fontSize: 12 }}>客户评价</div>
                </Col>
              </Row>
            </Card>

            <Card
              style={{ marginBottom: 16 }}
              title={<><PhoneOutlined /> 联系方式</>}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  block
                  icon={<PhoneOutlined />}
                  onClick={handlePhoneCall}
                >
                  {broker.phone || '暂无电话'}
                </Button>
                <Button
                  block
                  icon={<MessageOutlined />}
                  onClick={handleOnlineChat}
                >
                  在线咨询
                </Button>
                <Button
                  block
                  icon={isFavorited ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                  onClick={handleFavorite}
                >
                  {isFavorited ? '已收藏' : '收藏经纪人'}
                </Button>
              </Space>
            </Card>
          </div>
        </Col>
      </Row>

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
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              选择房源 <span style={{ color: '#ff4d4f' }}>*</span>
            </div>
            <Select
              style={{ width: '100%' }}
              placeholder="请选择要预约的房源"
              value={selectedProperty}
              onChange={(value) => setSelectedProperty(value)}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={properties.map((p: Property) => ({
                value: p.id,
                label: `${p.title} - ${formatPrice(p.price, p.type)}`,
              }))}
            />
          </div>

          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              选择日期 <span style={{ color: '#ff4d4f' }}>*</span>
            </div>
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
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              选择时间段 <span style={{ color: '#ff4d4f' }}>*</span>
            </div>
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
    </div>
  );
};

export default BrokerDetailPage;
