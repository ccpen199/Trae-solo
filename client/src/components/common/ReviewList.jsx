import React, { useState, useEffect } from 'react';
import {
  List,
  Avatar,
  Rate,
  Tag,
  Button,
  Image,
  Space,
  Typography,
  Empty,
  Spin,
  Pagination,
  Checkbox,
  Select,
  Row,
  Col,
  Progress,
  message,
  Modal
} from 'antd';
import {
  CheckCircleOutlined,
  LikeOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { reviewAPI } from '../../api/index.js';

const { Text, Paragraph } = Typography;
const { Option } = Select;

const ReviewList = ({
  serviceId,
  merchantId,
  orderId,
  showStats = true,
  showFilter = true,
  defaultSort = 'newest',
  pageSize = 5,
  onReviewSubmitted,
  className,
  style
}) => {
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: pageSize,
    total: 0
  });
  const [filters, setFilters] = useState({
    sort: defaultSort,
    withImage: false,
    withVideo: false,
    verifiedOnly: false,
    rating: null
  });
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [serviceId, merchantId, orderId, filters, pagination.current, pagination.pageSize]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        sort: filters.sort,
        ...(serviceId && { service_id: serviceId }),
        ...(merchantId && { merchant_id: merchantId }),
        ...(orderId && { order_id: orderId }),
        ...(filters.withImage && { has_image: true }),
        ...(filters.withVideo && { has_video: true }),
        ...(filters.verifiedOnly && { verified: true }),
        ...(filters.rating && { rating: filters.rating })
      };
      const response = await reviewAPI.list(params);
      setReviews(response.data.data || []);
      setReviewStats(response.data.stats);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0
      }));
    } catch (error) {
      message.error('获取评价列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (onReviewSubmitted) {
      fetchReviews();
    }
  }, [onReviewSubmitted]);

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

  const handlePageChange = (page, newPageSize) => {
    setPagination(prev => ({ ...prev, current: page, pageSize: newPageSize }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handlePreviewImage = (image) => {
    setPreviewImage(image);
    setPreviewVisible(true);
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
      <div style={{ padding: 20, background: '#fafafa', borderRadius: 8, marginBottom: 16 }}>
        <Row gutter={24}>
          <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 42, fontWeight: 'bold', color: '#ff4d6d' }}>
              {reviewStats.avg_rating?.toFixed(1) || '5.0'}
            </div>
            <Rate disabled value={parseFloat(reviewStats.avg_rating) || 5} style={{ fontSize: 14 }} />
            <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
              共 {reviewStats.total_count} 条评价
            </Text>
          </Col>
          <Col xs={24} sm={16}>
            {ratings.map(rating => (
              <div key={rating.level} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Text style={{ width: 40, fontSize: 12 }}>{rating.level}星</Text>
                <Progress
                  percent={reviewStats.total_count ? (rating.count / reviewStats.total_count) * 100 : 0}
                  showInfo={false}
                  strokeColor="#ff4d6d"
                  size="small"
                  style={{ flex: 1 }}
                />
                <Text type="secondary" style={{ width: 40, fontSize: 12 }}>{rating.count}</Text>
              </div>
            ))}
          </Col>
        </Row>
      </div>
    );
  };

  const renderFilterBar = () => {
    if (!showFilter) return null;

    return (
      <div style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0', marginBottom: 16 }}>
        <Row gutter={[16, 12]} align="middle">
          <Col>
            <Space>
              <FilterOutlined style={{ color: '#999' }} />
              <Text strong>筛选：</Text>
            </Space>
          </Col>
          <Col>
            <Select
              value={filters.sort}
              onChange={(value) => handleFilterChange('sort', value)}
              style={{ width: 120 }}
              size="small"
            >
              <Option value="newest">最新</Option>
              <Option value="helpful">最有帮助</Option>
              <Option value="rating_high">评分最高</Option>
              <Option value="rating_low">评分最低</Option>
            </Select>
          </Col>
          <Col>
            <Checkbox
              checked={filters.withImage}
              onChange={(e) => handleFilterChange('withImage', e.target.checked)}
            >
              <PictureOutlined /> 有图
            </Checkbox>
          </Col>
          <Col>
            <Checkbox
              checked={filters.withVideo}
              onChange={(e) => handleFilterChange('withVideo', e.target.checked)}
            >
              <VideoCameraOutlined /> 有视频
            </Checkbox>
          </Col>
          <Col>
            <Checkbox
              checked={filters.verifiedOnly}
              onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
            >
              <CheckCircleOutlined style={{ color: '#52c41a' }} /> 真实消费
            </Checkbox>
          </Col>
          <Col>
            <Select
              value={filters.rating}
              onChange={(value) => handleFilterChange('rating', value)}
              style={{ width: 100 }}
              size="small"
              allowClear
              placeholder="评分"
            >
              <Option value={5}>5星</Option>
              <Option value={4}>4星</Option>
              <Option value={3}>3星</Option>
              <Option value={2}>2星</Option>
              <Option value={1}>1星</Option>
            </Select>
          </Col>
        </Row>
      </div>
    );
  };

  const renderReviewItem = (review) => (
    <List.Item key={review.id} style={{ padding: '20px 0', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <Avatar size={48} src={review.avatar}>
            {review.real_name?.[0] || review.username?.[0] || 'U'}
          </Avatar>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <Text strong>{review.real_name || review.username || '匿名用户'}</Text>
              {review.verified && (
                <Tag color="green" size="small" icon={<CheckCircleOutlined />}>
                  真实消费
                </Tag>
              )}
              {review.has_image && (
                <Tag color="blue" size="small" icon={<PictureOutlined />}>
                  图文
                </Tag>
              )}
              {review.has_video && (
                <Tag color="purple" size="small" icon={<VideoCameraOutlined />}>
                  视频
                </Tag>
              )}
              {review.order_no && (
                <Tag color="default" size="small">
                  订单：{review.order_no}
                </Tag>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Rate disabled value={review.rating} style={{ fontSize: 12 }} />
              {review.service_name && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {review.service_name}
                </Text>
              )}
            </div>
          </div>
          <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
            <ClockCircleOutlined /> {review.created_at}
          </Text>
        </div>

        <Paragraph style={{ marginBottom: 12, fontSize: 14, lineHeight: 1.7 }}>
          {review.content}
        </Paragraph>

        {review.images && review.images.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {review.images.map((img, index) => (
              <div
                key={index}
                onClick={() => handlePreviewImage(img)}
                style={{
                  width: 80,
                  height: 80,
                  backgroundImage: `url(${img})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 6,
                  cursor: 'pointer',
                  flexShrink: 0,
                  border: '1px solid #f0f0f0'
                }}
              />
            ))}
            {review.images.length > 9 && (
              <div
                style={{
                  width: 80,
                  height: 80,
                  background: 'rgba(0,0,0,0.6)',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                onClick={() => handlePreviewImage(review.images[0])}
              >
                +{review.images.length - 9}
              </div>
            )}
          </div>
        )}

        {review.videos && review.videos.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {review.videos.map((video, index) => (
              <div
                key={index}
                style={{
                  width: 200,
                  height: 120,
                  background: '#000',
                  borderRadius: 6,
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                  cursor: 'pointer'
                }}
                onClick={() => window.open(video, '_blank')}
              >
                <VideoCameraOutlined style={{ fontSize: 32, color: '#fff' }} />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  color: '#fff',
                  fontSize: 12,
                  padding: '8px 12px'
                }}>
                  点击播放视频
                </div>
              </div>
            ))}
          </div>
        )}

        {review.merchant_reply && (
          <div style={{
            padding: 12,
            background: '#f6ffed',
            borderRadius: 6,
            marginBottom: 12,
            border: '1px solid #b7eb8f'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text strong style={{ color: '#52c41a' }}>商家回复：</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>{review.reply_at}</Text>
            </div>
            <Text style={{ fontSize: 13 }}>{review.merchant_reply}</Text>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            type="text"
            size="small"
            icon={<LikeOutlined />}
            onClick={() => handleHelpful(review.id)}
          >
            有帮助 ({review.helpful_count || 0})
          </Button>
          {review.wedding_date && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              婚礼日期：{review.wedding_date}
            </Text>
          )}
          {review.city && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              城市：{review.city}
            </Text>
          )}
        </div>
      </div>
    </List.Item>
  );

  return (
    <div className={className} style={style}>
      {showStats && renderRatingDistribution()}

      {renderFilterBar()}

      <Spin spinning={loading}>
        {reviews.length > 0 ? (
          <>
            <List
              dataSource={reviews}
              locale={{ emptyText: '暂无评价' }}
              renderItem={renderReviewItem}
              style={{ borderBottom: 'none' }}
            />
            {pagination.total > pagination.pageSize && (
              <div style={{ textAlign: 'center', marginTop: 24, paddingBottom: 16 }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePageChange}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total) => `共 ${total} 条评价`}
                />
              </div>
            )}
          </>
        ) : (
          !loading && (
            <Empty
              description="暂无评价"
              style={{ padding: '40px 0' }}
            />
          )
        )}
      </Spin>

      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        closeIcon={<CloseOutlined />}
        width="auto"
        style={{ maxWidth: '90vw' }}
        bodyStyle={{ padding: 0 }}
      >
        <Image
          preview={false}
          src={previewImage}
          style={{ maxWidth: '100%', maxHeight: '80vh', display: 'block', margin: '0 auto' }}
        />
      </Modal>
    </div>
  );
};

export default ReviewList;
