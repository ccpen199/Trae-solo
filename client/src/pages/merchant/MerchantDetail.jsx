import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Button, Tag, Typography, Space, Image, 
  Tabs, message, Spin, Divider, Avatar, Rate, Breadcrumb,
  List, Pagination, Empty
} from 'antd';
import { 
  HeartOutlined, HeartFilled, EyeOutlined, EnvironmentOutlined,
  ShopOutlined, PhoneOutlined, UserOutlined, CommentOutlined,
  SafetyCertificateOutlined, LeftOutlined, PictureOutlined,
  CameraOutlined, StarOutlined, LikeOutlined, MessageOutlined
} from '@ant-design/icons';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  merchantAPI, serviceAPI, caseAPI, reviewAPI 
} from '../../api/index.js';
import { isAuthenticated } from '../../utils/auth.js';

const { Title, Text, Paragraph } = Typography;

const CATEGORY_MAP = {
  photography: '婚纱摄影',
  emcee: '司仪主持',
  hotel: '婚宴酒店',
  wedding_dress: '婚纱礼服'
};

const ACTIVITY_TYPE_MAP = {
  discount: '折扣优惠',
  gift: '赠品活动',
  package: '套餐优惠',
  limited: '限时特惠'
};

const MerchantDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [merchant, setMerchant] = useState(null);
  const [services, setServices] = useState([]);
  const [cases, setCases] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [reviewPagination, setReviewPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0
  });

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [merchantRes, servicesRes, casesRes, reviewsRes] = await Promise.all([
        merchantAPI.detail(id),
        serviceAPI.list({ merchant_id: id, pageSize: 100 }),
        caseAPI.list({ merchant_id: id, pageSize: 100 }),
        reviewAPI.list({ merchant_id: id, page: 1, pageSize: 5 })
      ]);
      setMerchant(merchantRes.data);
      setServices(servicesRes.data.data || []);
      setCases(casesRes.data.data || []);
      setReviews(reviewsRes.data.data || []);
      setReviewStats(reviewsRes.data.stats || null);
      setReviewPagination(prev => ({
        ...prev,
        total: reviewsRes.data.total || 0
      }));
    } catch (error) {
      message.error('获取商家详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (page = 1) => {
    try {
      const response = await reviewAPI.list({ 
        merchant_id: id, 
        page, 
        pageSize: reviewPagination.pageSize 
      });
      setReviews(response.data.data || []);
      setReviewPagination(prev => ({
        ...prev,
        current: page,
        total: response.data.total || 0
      }));
    } catch (error) {
      message.error('获取评价失败');
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [id]);

  const handleLike = async () => {
    if (!isAuthenticated()) {
      message.warning('请先登录');
      return;
    }
    try {
      const response = await merchantAPI.like(id);
      setMerchant(prev => ({
        ...prev,
        like_count: response.data.like_count,
        liked: response.data.liked
      }));
      message.success(response.data.liked ? '关注成功' : '已取消关注');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleServiceLike = async (serviceId, e) => {
    e.stopPropagation();
    if (!isAuthenticated()) {
      message.warning('请先登录');
      return;
    }
    try {
      const response = await serviceAPI.like(serviceId);
      setServices(prev => prev.map(s => 
        s.id === serviceId ? { ...s, like_count: response.data.like_count } : s
      ));
      message.success(response.data.liked ? '收藏成功' : '已取消收藏');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleCaseLike = async (caseId, e) => {
    e.stopPropagation();
    if (!isAuthenticated()) {
      message.warning('请先登录');
      return;
    }
    try {
      const response = await caseAPI.like(caseId);
      setCases(prev => prev.map(c => 
        c.id === caseId ? { ...c, like_count: response.data.like_count } : c
      ));
      message.success(response.data.liked ? '点赞成功' : '已取消点赞');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleReviewHelpful = async (reviewId) => {
    if (!isAuthenticated()) {
      message.warning('请先登录');
      return;
    }
    try {
      const response = await reviewAPI.helpful(reviewId);
      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { ...r, helpful_count: response.data.helpful_count } : r
      ));
      message.success('感谢您的反馈');
    } catch (error) {
      message.error('操作失败');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Text type="secondary">商家不存在或已关闭</Text>
        <div style={{ marginTop: 16 }}>
          <Button onClick={() => navigate('/merchants')}>返回列表</Button>
        </div>
      </div>
    );
  }

  const tabItems = [
    {
      key: 'services',
      label: (
        <span>
          <CameraOutlined />
          服务列表 ({services.length})
        </span>
      ),
      children: (
        <div>
          {services.length > 0 ? (
            <Row gutter={[16, 16]}>
              {services.map(service => (
                <Col xs={24} sm={12} md={8} key={service.id}>
                  <Card
                    hoverable
                    style={{ borderRadius: 12 }}
                    bodyStyle={{ padding: 0 }}
                    onClick={() => navigate(`/services/${service.id}`)}
                    cover={
                      <div style={{ height: 180, overflow: 'hidden' }}>
                        <img
                          src={service.images?.[0] || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wedding%20service&image_size=square_hd'}
                          alt={service.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    }
                    actions={[
                      <div 
                        key="like"
                        onClick={(e) => handleServiceLike(service.id, e)}
                        style={{ cursor: 'pointer' }}
                      >
                        <HeartFilled style={{ color: service.liked ? '#ff4d6d' : '#ccc' }} />
                        <span style={{ marginLeft: 4 }}>{service.like_count}</span>
                      </div>,
                      <div key="views">
                        <EyeOutlined /> {service.view_count}
                      </div>
                    ]}
                  >
                    <div style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Tag color="blue" style={{ margin: 0 }}>
                          {service.category_name || CATEGORY_MAP[service.category]}
                        </Tag>
                        {service.tags?.slice(0, 2).map((tag, idx) => (
                          <Tag key={idx} size="small">{tag}</Tag>
                        ))}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: '#333' }}>
                        {service.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ color: '#ff4d6d', fontSize: 20, fontWeight: 700 }}>
                          ¥{service.price?.toLocaleString()}
                        </span>
                        {service.original_price && (
                          <span style={{ color: '#999', textDecoration: 'line-through', fontSize: 13 }}>
                            ¥{service.original_price?.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Rate disabled value={service.rating} style={{ fontSize: 12 }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {service.rating} ({service.review_count}条评价)
                        </Text>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Empty description="暂无服务" />
          )}
        </div>
      )
    },
    {
      key: 'cases',
      label: (
        <span>
          <PictureOutlined />
          案例展示 ({cases.length})
        </span>
      ),
      children: (
        <div>
          {cases.length > 0 ? (
            <Row gutter={[16, 16]}>
              {cases.map(caseItem => (
                <Col xs={24} sm={12} md={8} key={caseItem.id}>
                  <Card
                    hoverable
                    style={{ borderRadius: 12 }}
                    bodyStyle={{ padding: 0 }}
                    onClick={() => navigate(`/cases/${caseItem.id}`)}
                    cover={
                      <div style={{ height: 180, overflow: 'hidden' }}>
                        <img
                          src={caseItem.cover_image || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wedding%20case&image_size=square_hd'}
                          alt={caseItem.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    }
                    actions={[
                      <div 
                        key="like"
                        onClick={(e) => handleCaseLike(caseItem.id, e)}
                        style={{ cursor: 'pointer' }}
                      >
                        <HeartFilled style={{ color: caseItem.liked ? '#ff4d6d' : '#ccc' }} />
                        <span style={{ marginLeft: 4 }}>{caseItem.like_count}</span>
                      </div>,
                      <div key="views">
                        <EyeOutlined /> {caseItem.view_count}
                      </div>
                    ]}
                  >
                    <div style={{ padding: 16 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: '#333' }}>
                        {caseItem.title}
                      </div>
                      {caseItem.service_name && (
                        <Tag color="geekblue" size="small" style={{ marginBottom: 8 }}>
                          {caseItem.service_name}
                        </Tag>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#999', fontSize: 13 }}>
                        <span><EnvironmentOutlined /> {caseItem.city}</span>
                        {caseItem.budget && (
                          <span style={{ color: '#ff4d6d' }}>¥{caseItem.budget?.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Empty description="暂无案例" />
          )}
        </div>
      )
    },
    {
      key: 'reviews',
      label: (
        <span>
          <MessageOutlined />
          用户评价 ({reviewPagination.total})
        </span>
      ),
      children: (
        <div>
          {reviewStats && (
            <Card style={{ marginBottom: 24, borderRadius: 12 }}>
              <Row gutter={24} align="middle">
                <Col span={6} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 48, fontWeight: 'bold', color: '#fa8c16' }}>
                    {reviewStats.avg_rating?.toFixed(1) || '5.0'}
                  </div>
                  <Rate disabled value={parseFloat(reviewStats.avg_rating) || 5} style={{ fontSize: 14 }} />
                  <div style={{ color: '#999', marginTop: 4 }}>
                    共 {reviewStats.total_count || 0} 条评价
                  </div>
                </Col>
                <Col span={18}>
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = reviewStats[`count_${star}`] || 0;
                    const total = reviewStats.total_count || 1;
                    const percent = (count / total) * 100;
                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span style={{ width: 60 }}>{star} 星</span>
                        <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{
                            width: `${percent}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #ff4d6d, #faad14)',
                            borderRadius: 4
                          }} />
                        </div>
                        <span style={{ width: 50, textAlign: 'right', color: '#999' }}>{count}</span>
                      </div>
                    );
                  })}
                </Col>
              </Row>
            </Card>
          )}
          {reviews.length > 0 ? (
            <>
              <List
                dataSource={reviews}
                renderItem={review => (
                  <List.Item
                    key={review.id}
                    style={{ padding: '20px 0', borderBottom: '1px solid #f0f0f0' }}
                  >
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                        <Avatar 
                          size={48} 
                          src={review.avatar}
                          icon={<UserOutlined />}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                            <span style={{ fontWeight: 500 }}>
                              {review.real_name || review.username || '匿名用户'}
                            </span>
                            {review.verified === 1 && (
                              <Tag color="green" size="small">
                                已消费
                              </Tag>
                            )}
                            {review.service_name && (
                              <Tag color="blue" size="small">
                                {review.service_name}
                              </Tag>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Rate disabled value={review.rating} style={{ fontSize: 14 }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {new Date(review.created_at).toLocaleDateString()}
                            </Text>
                          </div>
                        </div>
                      </div>
                      <Paragraph style={{ marginBottom: 12, fontSize: 14, lineHeight: 1.7 }}>
                        {review.content}
                      </Paragraph>
                      {review.images?.length > 0 && (
                        <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                          {review.images.slice(0, 6).map((img, idx) => (
                            <Col xs={8} sm={4} key={idx}>
                              <Image
                                width="100%"
                                height={80}
                                src={img}
                                style={{ borderRadius: 8, objectFit: 'cover' }}
                              />
                            </Col>
                          ))}
                        </Row>
                      )}
                      <div style={{ textAlign: 'right' }}>
                        <Button 
                          type="text" 
                          size="small"
                          icon={<LikeOutlined />}
                          onClick={() => handleReviewHelpful(review.id)}
                        >
                          有帮助 ({review.helpful_count || 0})
                        </Button>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
              {reviewPagination.total > reviewPagination.pageSize && (
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <Pagination
                    current={reviewPagination.current}
                    pageSize={reviewPagination.pageSize}
                    total={reviewPagination.total}
                    onChange={fetchReviews}
                    showSizeChanger={false}
                  />
                </div>
              )}
            </>
          ) : (
            <Empty description="暂无评价" />
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>
          <Link to="/">首页</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Link to="/merchants">商家入驻</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{merchant.company_name}</Breadcrumb.Item>
      </Breadcrumb>

      <Button 
        icon={<LeftOutlined />} 
        onClick={() => navigate(-1)} 
        style={{ marginBottom: 24 }}
      >
        返回
      </Button>

      <Card 
        style={{ marginBottom: 24, borderRadius: 12 }}
        bodyStyle={{ padding: 32 }}
      >
        <Row gutter={32} align="top">
          <Col xs={24} sm={6} style={{ textAlign: 'center' }}>
            <Avatar 
              size={120} 
              src={merchant.logo}
              icon={<ShopOutlined style={{ fontSize: 48 }} />}
              style={{ 
                border: '4px solid #f0f0f0',
                background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                marginBottom: 16
              }}
            />
            <Space wrap direction="vertical" size={8} style={{ width: '100%' }}>
              <Space size={8} wrap>
                <Tag color="blue">
                  {CATEGORY_MAP[merchant.category] || merchant.category}
                </Tag>
                {merchant.deposit_status === 1 && (
                  <Tag icon={<SafetyCertificateOutlined />} color="gold">
                    保证金保障
                  </Tag>
                )}
              </Space>
              <Button 
                icon={merchant.liked ? <HeartFilled /> : <HeartOutlined />}
                onClick={handleLike}
                block
                style={{
                  color: merchant.liked ? '#ff4d6d' : undefined,
                  borderColor: merchant.liked ? '#ff4d6d' : undefined
                }}
              >
                {merchant.liked ? '已关注' : '关注商家'} ({merchant.like_count})
              </Button>
            </Space>
          </Col>
          <Col xs={24} sm={18}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              <Title level={2} style={{ margin: 0 }}>
                {merchant.company_name}
              </Title>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Rate disabled value={merchant.rating} style={{ fontSize: 16 }} />
                <span style={{ color: '#fa8c16', fontWeight: 600, fontSize: 20 }}>
                  {merchant.rating}
                </span>
                <Text type="secondary">
                  ({merchant.review_count} 条评价)
                </Text>
              </div>
            </div>

            <Space wrap size={[24, 12]} style={{ marginBottom: 20, color: '#666' }}>
              <span><EyeOutlined /> {merchant.view_count} 次浏览</span>
              <span><CommentOutlined /> {merchant.review_count} 条评价</span>
              <span><HeartOutlined /> {merchant.like_count} 人关注</span>
            </Space>

            <Paragraph style={{ fontSize: 15, lineHeight: 1.8, color: '#666', marginBottom: 20 }}>
              {merchant.description || '暂无商家介绍'}
            </Paragraph>

            <Divider style={{ margin: '16px 0' }} />

            <Row gutter={[24, 16]}>
              <Col xs={24} sm={12}>
                <Space size={8} align="start">
                  <EnvironmentOutlined style={{ color: '#ff4d6d', marginTop: 4 }} />
                  <div>
                    <div style={{ color: '#999', fontSize: 13, marginBottom: 2 }}>所在地区</div>
                    <div>{merchant.city}</div>
                    {merchant.address && (
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {merchant.address}
                      </Text>
                    )}
                  </div>
                </Space>
              </Col>
              <Col xs={24} sm={12}>
                <Space size={8} align="start">
                  <PhoneOutlined style={{ color: '#ff4d6d', marginTop: 4 }} />
                  <div>
                    <div style={{ color: '#999', fontSize: 13, marginBottom: 2 }}>联系方式</div>
                    {merchant.contact_name && (
                      <div>联系人：{merchant.contact_name}</div>
                    )}
                    {merchant.contact_phone && (
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {merchant.contact_phone}
                      </Text>
                    )}
                  </div>
                </Space>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Card 
        style={{ borderRadius: 12 }}
        bodyStyle={{ padding: '24px 0' }}
      >
        <Tabs 
          defaultActiveKey="services" 
          items={tabItems}
          size="large"
          style={{ padding: '0 24px' }}
        />
      </Card>
    </div>
  );
};

export default MerchantDetail;
