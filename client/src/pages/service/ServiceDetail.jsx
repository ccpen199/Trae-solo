import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Typography,
  Space,
  Avatar,
  Rate,
  message,
  Carousel,
  Tabs,
  List,
  Empty,
  Progress,
  Statistic,
  Descriptions,
  Divider,
  Badge,
  Affix,
  Modal
} from 'antd';
import {
  HeartOutlined,
  HeartFilled,
  ShoppingOutlined,
  StarOutlined,
  EyeOutlined,
  LikeOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  BarChartOutlined,
  MessageOutlined,
  ShopOutlined,
  CameraOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { serviceAPI, merchantAPI, reviewAPI } from '../../api/index.js';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const COMPARE_KEY = 'wedding_compare_list';

const ServiceDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const carouselRef = useRef(null);

  const [service, setService] = useState(null);
  const [merchant, setMerchant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [loading, setLoading] = useState({
    service: false,
    merchant: false,
    reviews: false
  });
  const [liked, setLiked] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [compareModalVisible, setCompareModalVisible] = useState(false);
  const [reviewPagination, setReviewPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0
  });

  useEffect(() => {
    if (id) {
      fetchServiceDetail();
      loadCompareList();
    }
  }, [id]);

  useEffect(() => {
    if (service) {
      fetchMerchantDetail(service.merchant_id);
      fetchReviews();
    }
  }, [service]);

  const loadCompareList = () => {
    try {
      const stored = localStorage.getItem(COMPARE_KEY);
      if (stored) {
        setCompareList(JSON.parse(stored));
      }
    } catch (e) {
      console.error('加载对比列表失败', e);
    }
  };

  const saveCompareList = (list) => {
    localStorage.setItem(COMPARE_KEY, JSON.stringify(list));
    setCompareList(list);
  };

  const fetchServiceDetail = async () => {
    setLoading(prev => ({ ...prev, service: true }));
    try {
      const response = await serviceAPI.detail(id);
      setService(response.data);
    } catch (error) {
      message.error('获取服务详情失败');
    } finally {
      setLoading(prev => ({ ...prev, service: false }));
    }
  };

  const fetchMerchantDetail = async (merchantId) => {
    setLoading(prev => ({ ...prev, merchant: true }));
    try {
      const response = await merchantAPI.detail(merchantId);
      setMerchant(response.data);
    } catch (error) {
      console.error('获取商家详情失败', error);
    } finally {
      setLoading(prev => ({ ...prev, merchant: false }));
    }
  };

  const fetchReviews = async () => {
    setLoading(prev => ({ ...prev, reviews: true }));
    try {
      const response = await reviewAPI.list({
        service_id: id,
        page: reviewPagination.current,
        pageSize: reviewPagination.pageSize,
        sort: 'newest'
      });
      setReviews(response.data.data || []);
      setReviewStats(response.data.stats);
      setReviewPagination(prev => ({
        ...prev,
        total: response.data.total || 0
      }));
    } catch (error) {
      console.error('获取评价失败', error);
    } finally {
      setLoading(prev => ({ ...prev, reviews: false }));
    }
  };

  const handleLikeService = async () => {
    try {
      const response = await serviceAPI.like(id);
      setLiked(response.data.liked);
      setService(prev => prev ? { ...prev, like_count: response.data.like_count } : null);
      message.success(response.data.liked ? '已收藏' : '已取消收藏');
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleAddToCompare = () => {
    if (!service) return;

    if (compareList.find(item => item.id === service.id)) {
      message.info('该服务已在对比列表中');
      return;
    }

    if (compareList.length >= 3) {
      message.warning('对比列表最多只能添加3个服务');
      return;
    }

    if (compareList.length > 0 && compareList[0].category !== service.category) {
      message.warning('只能对比同类型的服务');
      return;
    }

    const newList = [...compareList, {
      id: service.id,
      name: service.name,
      category: service.category,
      price: service.price,
      image: service.images?.[0],
      company_name: service.company_name
    }];
    saveCompareList(newList);
    message.success(`已添加到对比列表 (${newList.length}/3)`);
  };

  const handleRemoveFromCompare = (serviceId) => {
    const newList = compareList.filter(item => item.id !== serviceId);
    saveCompareList(newList);
    message.success('已从对比列表移除');
  };

  const handleGoToCompare = () => {
    if (compareList.length < 2) {
      message.warning('请至少选择2个服务进行对比');
      return;
    }
    const ids = compareList.map(item => item.id);
    navigate(`/services/compare?ids=${ids.join(',')}`);
    setCompareModalVisible(false);
  };

  const handleReviewPageChange = (page, pageSize) => {
    setReviewPagination(prev => ({ ...prev, current: page, pageSize }));
    setTimeout(fetchReviews, 0);
  };

  const handleHelpful = async (reviewId) => {
    try {
      const response = await reviewAPI.helpful(reviewId);
      setReviews(prev => prev.map(r =>
        r.id === reviewId
          ? { ...r, helpful_count: response.data.helpful_count }
          : r
      ));
      message.success('感谢您的反馈');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getCategoryColor = (categoryKey) => {
    const colors = {
      photography: '#ff4d6d',
      emcee: '#722ed1',
      hotel: '#1890ff',
      wedding_dress: '#eb2f96'
    };
    return colors[categoryKey] || '#ff4d6d';
  };

  const renderRatingDistribution = () => {
    if (!reviewStats || reviewStats.total_count === 0) return null;

    const ratings = [
      { level: 5, count: reviewStats.count_5 || 0 },
      { level: 4, count: reviewStats.count_4 || 0 },
      { level: 3, count: reviewStats.count_3 || 0 },
      { level: 2, count: reviewStats.count_2 || 0 },
      { level: 1, count: reviewStats.count_1 || 0 }
    ];

    return (
      <div style={{ padding: 16, background: '#fafafa', borderRadius: 8 }}>
        <Row gutter={24}>
          <Col span={8} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 'bold', color: '#ff4d6d' }}>
              {reviewStats.avg_rating?.toFixed(1) || '5.0'}
            </div>
            <Rate disabled value={parseFloat(reviewStats.avg_rating) || 5} style={{ fontSize: 16 }} />
            <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
              共 {reviewStats.total_count} 条评价
            </Text>
          </Col>
          <Col span={16}>
            {ratings.map(rating => (
              <div key={rating.level} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Text style={{ width: 40 }}>{rating.level}星</Text>
                <Progress
                  percent={reviewStats.total_count ? (rating.count / reviewStats.total_count) * 100 : 0}
                  showInfo={false}
                  strokeColor="#ff4d6d"
                  style={{ flex: 1 }}
                />
                <Text type="secondary" style={{ width: 40 }}>{rating.count}</Text>
              </div>
            ))}
          </Col>
        </Row>
      </div>
    );
  };

  const isInCompare = service && compareList.some(item => item.id === service.id);

  if (loading.service && !service) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Card loading={true} style={{ maxWidth: 800, margin: '0 auto' }} />
      </div>
    );
  }

  if (!service) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Empty description="服务不存在" />
        <Button onClick={() => navigate('/services')} style={{ marginTop: 16 }}>
          返回服务列表
        </Button>
      </div>
    );
  }

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <Affix offsetTop={64}>
        <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', zIndex: 50 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Button type="link" onClick={() => navigate(-1)} style={{ padding: 0 }}>
              <ArrowLeftOutlined /> 返回
            </Button>
            <Space>
              <Button
                onClick={handleAddToCompare}
                icon={isInCompare ? <CheckOutlined /> : <PlusOutlined />}
                type={isInCompare ? 'primary' : 'default'}
              >
                {isInCompare ? '已加入对比' : '加入对比'}
                {compareList.length > 0 && <Badge count={compareList.length} style={{ marginLeft: 8 }} />}
              </Button>
              {compareList.length >= 2 && (
                <Button type="primary" onClick={handleGoToCompare}>
                  开始对比 ({compareList.length}/3)
                </Button>
              )}
            </Space>
          </div>
        </div>
      </Affix>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        {/* 服务基本信息 */}
        <Card style={{ borderRadius: 12, marginBottom: 24 }} bodyStyle={{ padding: 0 }}>
          <Row gutter={0}>
            {/* 图片轮播 */}
            <Col xs={24} lg={14}>
              <div style={{ position: 'relative' }}>
                <Carousel
                  ref={carouselRef}
                  autoplay
                  effect="fade"
                  dotPosition="bottom"
                  style={{ background: '#000' }}
                >
                  {service.images && service.images.length > 0 ? (
                    service.images.map((img, index) => (
                      <div key={index}>
                        <div
                          style={{
                            height: 500,
                            backgroundImage: `url(${img})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <div>
                      <div
                        style={{
                          height: 500,
                          backgroundImage: `url(https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wedding%20${encodeURIComponent(service.category_name || 'service')}&image_size=landscape_16_9)`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                    </div>
                  )}
                </Carousel>
                {service.images && service.images.length > 1 && (
                  <div style={{ display: 'flex', gap: 8, padding: 12, overflowX: 'auto' }}>
                    {service.images.map((img, index) => (
                      <div
                        key={index}
                        onClick={() => carouselRef.current?.goTo(index)}
                        style={{
                          width: 80,
                          height: 60,
                          backgroundImage: `url(${img})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          borderRadius: 6,
                          cursor: 'pointer',
                          flexShrink: 0,
                          border: '2px solid transparent'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Col>

            {/* 服务信息 */}
            <Col xs={24} lg={10} style={{ padding: 32 }}>
              <Tag
                color={getCategoryColor(service.category)}
                style={{ fontSize: 14, padding: '4px 12px', marginBottom: 16 }}
              >
                {service.category_name}
              </Tag>

              <Title level={2} style={{ marginBottom: 16 }}>{service.name}</Title>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Rate disabled value={service.rating} />
                <Text strong style={{ fontSize: 18 }}>{service.rating}</Text>
                <Text type="secondary">|</Text>
                <Text type="secondary">{service.review_count || 0}条评价</Text>
                <Text type="secondary">|</Text>
                <Text type="secondary"><EyeOutlined /> {service.view_count || 0}</Text>
              </div>

              {service.tags && service.tags.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <Space size={[8, 8]} wrap>
                    {service.tags.map((tag, index) => (
                      <Tag key={index} color="blue" style={{ fontSize: 12, padding: '4px 10px' }}>
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}

              <div style={{ background: '#fff7f7', padding: 20, borderRadius: 8, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <Text type="danger" strong style={{ fontSize: 36 }}>
                    ¥{service.price.toLocaleString()}
                  </Text>
                  {service.original_price && service.original_price > service.price && (
                    <>
                      <Text delete type="secondary" style={{ fontSize: 16 }}>
                        ¥{service.original_price.toLocaleString()}
                      </Text>
                      <Tag color="red" style={{ fontSize: 12 }}>
                        省 ¥{(service.original_price - service.price).toLocaleString()}
                      </Tag>
                    </>
                  )}
                </div>
              </div>

              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Space size="middle" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingOutlined />}
                    style={{
                      flex: 1,
                      height: 48,
                      fontSize: 16,
                      background: 'linear-gradient(135deg, #ff4d6d, #ff7875)',
                      border: 'none'
                    }}
                  >
                    立即预订
                  </Button>
                  <Button
                    size="large"
                    icon={liked ? <HeartFilled style={{ color: '#ff4d6d' }} /> : <HeartOutlined />}
                    onClick={handleLikeService}
                    style={{
                      height: 48,
                      width: 60,
                      borderColor: liked ? '#ff4d6d' : undefined
                    }}
                  />
                  <Button
                    size="large"
                    icon={<BarChartOutlined />}
                    onClick={() => setCompareModalVisible(true)}
                    style={{ height: 48, width: 60 }}
                  >
                    {compareList.length > 0 && (
                      <Badge count={compareList.length} size="small" />
                    )}
                  </Button>
                </Space>

                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <Space size={4}>
                      <LikeOutlined style={{ color: '#52c41a' }} />
                      <Text type="secondary">收藏 {service.like_count || 0}</Text>
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Space size={4}>
                      <EnvironmentOutlined style={{ color: '#1890ff' }} />
                      <Text type="secondary">{service.city}</Text>
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Space size={4}>
                      <MessageOutlined style={{ color: '#722ed1' }} />
                      <Text type="secondary">咨询客服</Text>
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Space size={4}>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <Text type="secondary">保证金保障</Text>
                    </Space>
                  </Col>
                </Row>
              </Space>
            </Col>
          </Row>
        </Card>

        <Row gutter={24}>
          {/* 左侧详情 */}
          <Col xs={24} lg={16}>
            <Card style={{ borderRadius: 12, marginBottom: 24 }}>
              <Tabs defaultActiveKey="description" size="large">
                <TabPane tab="服务详情" key="description">
                  <Title level={4} style={{ marginBottom: 16 }}>服务介绍</Title>
                  <Paragraph style={{ fontSize: 15, lineHeight: 1.8, color: '#333' }}>
                    {service.description || '暂无详细介绍'}
                  </Paragraph>

                  {service.images && service.images.length > 0 && (
                    <>
                      <Divider />
                      <Title level={4} style={{ marginBottom: 16 }}>服务相册</Title>
                      <Row gutter={[12, 12]}>
                        {service.images.map((img, index) => (
                          <Col xs={12} sm={8} key={index}>
                            <div
                              style={{
                                paddingTop: '100%',
                                backgroundImage: `url(${img})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: 8
                              }}
                            />
                          </Col>
                        ))}
                      </Row>
                    </>
                  )}
                </TabPane>

                <TabPane tab={`用户评价 (${reviewPagination.total})`} key="reviews">
                  {renderRatingDistribution()}

                  <Divider />

                  <List
                    loading={loading.reviews}
                    dataSource={reviews}
                    locale={{ emptyText: '暂无评价' }}
                    renderItem={(review) => (
                      <List.Item key={review.id} style={{ padding: '20px 0' }}>
                        <div style={{ width: '100%' }}>
                          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                            <Avatar size={48} src={review.avatar}>
                              {review.real_name?.[0] || review.username?.[0]}
                            </Avatar>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Text strong>{review.real_name || review.username}</Text>
                                {review.verified && (
                                  <Tag color="green" size="small">
                                    <CheckCircleOutlined /> 真实消费
                                  </Tag>
                                )}
                              </div>
                              <Rate disabled value={review.rating} style={{ fontSize: 12 }} />
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <ClockCircleOutlined /> {review.created_at}
                            </Text>
                          </div>
                          <Paragraph style={{ marginBottom: 12 }}>{review.content}</Paragraph>
                          {review.images && review.images.length > 0 && (
                            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                              {review.images.slice(0, 4).map((img, index) => (
                                <div
                                  key={index}
                                  style={{
                                    width: 80,
                                    height: 80,
                                    backgroundImage: `url(${img})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    borderRadius: 6
                                  }}
                                />
                              ))}
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            {review.service_name && (
                              <Tag style={{ margin: 0 }}>{review.service_name}</Tag>
                            )}
                            <Button
                              type="text"
                              size="small"
                              icon={<LikeOutlined />}
                              onClick={() => handleHelpful(review.id)}
                            >
                              有帮助 ({review.helpful_count || 0})
                            </Button>
                          </div>
                        </div>
                      </List.Item>
                    )}
                    pagination={{
                      current: reviewPagination.current,
                      pageSize: reviewPagination.pageSize,
                      total: reviewPagination.total,
                      onChange: handleReviewPageChange,
                      showSizeChanger: false
                    }}
                  />
                </TabPane>
              </Tabs>
            </Card>
          </Col>

          {/* 右侧商家信息 */}
          <Col xs={24} lg={8}>
            <Affix offsetTop={130}>
              <Card style={{ borderRadius: 12 }} loading={loading.merchant}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <Avatar
                    size={72}
                    src={merchant?.logo || service.merchant_logo}
                    style={{ marginBottom: 12 }}
                  >
                    {merchant?.company_name?.[0] || service.company_name?.[0]}
                  </Avatar>
                  <Title level={4} style={{ marginBottom: 8 }}>
                    {merchant?.company_name || service.company_name}
                  </Title>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                    <Rate disabled value={merchant?.rating || service.merchant_rating} style={{ fontSize: 14 }} />
                    <Text strong>{merchant?.rating || service.merchant_rating}</Text>
                  </div>
                </div>

                <Divider style={{ margin: '16px 0' }} />

                <Descriptions column={1} size="small">
                  <Descriptions.Item label="服务区域">
                    <EnvironmentOutlined /> {merchant?.city || service.city}
                  </Descriptions.Item>
                  <Descriptions.Item label="联系电话">
                    <PhoneOutlined /> {merchant?.contact_phone || '咨询客服'}
                  </Descriptions.Item>
                  <Descriptions.Item label="联系人">
                    {merchant?.contact_name || '咨询客服'}
                  </Descriptions.Item>
                  <Descriptions.Item label="累计评价">
                    <StarOutlined style={{ color: '#faad14' }} /> {merchant?.review_count || 0}条
                  </Descriptions.Item>
                  <Descriptions.Item label="店铺人气">
                    <EyeOutlined style={{ color: '#1890ff' }} /> {merchant?.view_count || 0}次浏览
                  </Descriptions.Item>
                </Descriptions>

                {merchant?.description && (
                  <>
                    <Divider style={{ margin: '16px 0' }} />
                    <Title level={5} style={{ marginBottom: 12 }}>商家介绍</Title>
                    <Paragraph type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
                      {merchant.description}
                    </Paragraph>
                  </>
                )}

                <Divider style={{ margin: '16px 0' }} />

                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    block
                    size="large"
                    icon={<ShopOutlined />}
                    onClick={() => navigate(`/merchants/${service.merchant_id}`)}
                  >
                    进入店铺
                  </Button>
                  <Button block size="large" icon={<MessageOutlined />}>
                    咨询商家
                  </Button>
                </Space>
              </Card>
            </Affix>
          </Col>
        </Row>
      </div>

      {/* 对比列表弹窗 */}
      <Modal
        title="对比列表"
        open={compareModalVisible}
        onCancel={() => setCompareModalVisible(false)}
        footer={
          <Space>
            <Button onClick={() => setCompareModalVisible(false)}>取消</Button>
            <Button
              type="primary"
              onClick={handleGoToCompare}
              disabled={compareList.length < 2}
            >
              开始对比 ({compareList.length}/3)
            </Button>
          </Space>
        }
      >
        {compareList.length === 0 ? (
          <Empty description="对比列表为空" style={{ padding: '40px 0' }} />
        ) : (
          <List
            dataSource={compareList}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                actions={[
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveFromCompare(item.id)}
                  >
                    移除
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        backgroundImage: `url(${item.image || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wedding%20${encodeURIComponent(item.category || 'service')}&image_size=square`})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: 8
                      }}
                    />
                  }
                  title={item.name}
                  description={
                    <Space>
                      <Text type="danger" strong>¥{item.price?.toLocaleString()}</Text>
                      <Text type="secondary">{item.company_name}</Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Button type="dashed" block icon={<PlusOutlined />} onClick={() => navigate('/services')}>
            添加更多服务进行对比
          </Button>
          <Paragraph type="secondary" style={{ marginTop: 12, fontSize: 12 }}>
            提示：只能对比同类型的服务，最多可添加3个
          </Paragraph>
        </div>
      </Modal>
    </div>
  );
};

export default ServiceDetail;
