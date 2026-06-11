import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Select, Button, Pagination, message, Tag, 
  Typography, Space, Empty, Spin, Avatar, Badge, Divider
} from 'antd';
import { 
  GiftOutlined, EnvironmentOutlined, ShopOutlined, 
  CalendarOutlined, PercentageOutlined, TagOutlined,
  ClockCircleOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { marketingAPI } from '../../api/index.js';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const CITIES = ['全部', '上海', '北京', '广州', '深圳', '杭州', '成都', '武汉', '南京', '苏州'];
const ACTIVITY_TYPES = [
  { value: '', label: '全部类型' },
  { value: 'discount', label: '折扣优惠' },
  { value: 'gift', label: '赠品活动' },
  { value: 'package', label: '套餐优惠' },
  { value: 'limited', label: '限时特惠' }
];

const ACTIVITY_TYPE_CONFIG = {
  discount: { label: '折扣优惠', color: 'red', icon: <PercentageOutlined /> },
  gift: { label: '赠品活动', color: 'green', icon: <GiftOutlined /> },
  package: { label: '套餐优惠', color: 'blue', icon: <TagOutlined /> },
  limited: { label: '限时特惠', color: 'orange', icon: <ClockCircleOutlined /> }
};

const MarketingList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    city: '',
    activity_type: ''
  });

  const fetchActivities = async (page = 1, city = '', activityType = '') => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize: pagination.pageSize,
        ...(city && city !== '全部' ? { city } : {}),
        ...(activityType ? { activity_type: activityType } : {})
      };
      const response = await marketingAPI.list(params);
      setActivities(response.data.data);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: response.data.total
      }));
    } catch (error) {
      message.error('获取活动列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(1, filters.city, filters.activity_type);
  }, []);

  const handleCityChange = (city) => {
    setFilters(prev => ({ ...prev, city }));
    fetchActivities(1, city, filters.activity_type);
  };

  const handleTypeChange = (activityType) => {
    setFilters(prev => ({ ...prev, activity_type: activityType }));
    fetchActivities(1, filters.city, activityType);
  };

  const handlePageChange = (page) => {
    fetchActivities(page, filters.city, filters.activity_type);
  };

  const getActivityStatus = (activity) => {
    const now = dayjs();
    const startDate = dayjs(activity.start_date);
    const endDate = dayjs(activity.end_date);

    if (now.isBefore(startDate)) {
      return { text: '即将开始', color: 'default', days: startDate.diff(now, 'day') };
    } else if (now.isAfter(endDate)) {
      return { text: '已结束', color: 'default', days: 0 };
    } else {
      return { text: '进行中', color: 'success', days: endDate.diff(now, 'day') };
    }
  };

  const handleGoToMerchant = (merchantId, e) => {
    e.stopPropagation();
    navigate(`/merchants/${merchantId}`);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 8, color: '#ff4d6d' }}>
          <GiftOutlined style={{ marginRight: 12 }} />
          优惠活动
        </Title>
        <Text type="secondary">
          精选全国婚庆商家优惠活动，省钱又省心
        </Text>
      </div>

      <Card
        style={{ marginBottom: 24, borderRadius: 12 }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Space wrap size="large">
          <Space>
            <Text strong>城市：</Text>
            <Select
              value={filters.city || '全部'}
              style={{ width: 140 }}
              onChange={handleCityChange}
            >
              {CITIES.map(city => (
                <Option key={city} value={city}>{city}</Option>
              ))}
            </Select>
          </Space>
          <Space>
            <Text strong>类型：</Text>
            <Select
              value={filters.activity_type || ''}
              style={{ width: 140 }}
              onChange={handleTypeChange}
            >
              {ACTIVITY_TYPES.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Space>
        </Space>
      </Card>

      <Spin spinning={loading}>
        {activities.length > 0 ? (
          <>
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
              {activities.map(activity => {
                const status = getActivityStatus(activity);
                const typeConfig = ACTIVITY_TYPE_CONFIG[activity.activity_type] || 
                  { label: activity.activity_type, color: 'default', icon: <GiftOutlined /> };

                return (
                  <Card
                    key={activity.id}
                    hoverable
                    style={{ borderRadius: 12, overflow: 'hidden' }}
                    bodyStyle={{ padding: 0 }}
                    onClick={() => navigate(`/merchants/${activity.merchant_id}`)}
                  >
                    <Row gutter={0}>
                      <Col xs={24} md={8}>
                        <div style={{ 
                          position: 'relative', 
                          height: 240, 
                          overflow: 'hidden',
                          background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
                        }}>
                          {activity.cover_image ? (
                            <img
                              src={activity.cover_image}
                              alt={activity.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <GiftOutlined style={{ fontSize: 64, color: '#fff', opacity: 0.6 }} />
                            </div>
                          )}
                          <Badge.Ribbon 
                            text={typeConfig.label} 
                            color={typeConfig.color}
                            style={{ position: 'absolute', top: 16, right: -6 }}
                          />
                          <div style={{
                            position: 'absolute',
                            bottom: 16,
                            left: 16,
                            background: 'rgba(0,0,0,0.6)',
                            padding: '6px 12px',
                            borderRadius: 20,
                            color: '#fff',
                            fontSize: 13
                          }}>
                            {typeConfig.icon} {typeConfig.label}
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} md={16}>
                        <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                              <Title level={4} style={{ margin: 0, flex: 1, minWidth: 0 }}>
                                {activity.title}
                              </Title>
                              <Tag 
                                color={status.color}
                                style={{ margin: 0 }}
                              >
                                {status.text}
                              </Tag>
                            </div>

                            <div 
                              onClick={(e) => handleGoToMerchant(activity.merchant_id, e)}
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: 8,
                                cursor: 'pointer',
                                marginBottom: 16
                              }}
                            >
                              <Avatar 
                                size={32} 
                                src={activity.merchant_logo}
                                icon={<ShopOutlined />}
                              />
                              <Text strong style={{ color: '#1677ff' }}>
                                {activity.company_name}
                                <ArrowRightOutlined style={{ fontSize: 12, marginLeft: 4 }} />
                              </Text>
                            </div>

                            <Paragraph style={{ color: '#666', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
                              {activity.description}
                            </Paragraph>
                          </div>

                          <Row gutter={[16, 12]} style={{ marginTop: 'auto' }}>
                            {activity.discount && (
                              <Col xs={24} sm={12}>
                                <div style={{
                                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
                                  padding: '12px 16px',
                                  borderRadius: 8,
                                  color: '#fff',
                                  textAlign: 'center'
                                }}>
                                  <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>折扣优惠</div>
                                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                                    {Math.round(activity.discount * 10)} 折
                                  </div>
                                </div>
                              </Col>
                            )}
                            {activity.gift && (
                              <Col xs={24} sm={12}>
                                <div style={{
                                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                  padding: '12px 16px',
                                  borderRadius: 8,
                                  color: '#fff'
                                }}>
                                  <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>
                                    <GiftOutlined style={{ marginRight: 4 }} />
                                    赠送好礼
                                  </div>
                                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                                    {activity.gift}
                                  </div>
                                </div>
                              </Col>
                            )}
                          </Row>

                          <Divider style={{ margin: '16px 0' }} />

                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 12
                          }}>
                            <Space wrap size={[16, 8]} style={{ color: '#999', fontSize: 13 }}>
                              <span><EnvironmentOutlined /> {activity.city}</span>
                              <span>
                                <CalendarOutlined /> 
                                活动时间：{activity.start_date} 至 {activity.end_date}
                              </span>
                              {status.text === '进行中' && status.days > 0 && (
                                <span style={{ color: '#52c41a' }}>
                                  <ClockCircleOutlined /> 剩余 {status.days} 天
                                </span>
                              )}
                            </Space>
                            <Button 
                              type="primary"
                              size="large"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/merchants/${activity.merchant_id}`);
                              }}
                              style={{
                                background: 'linear-gradient(135deg, #ff4d6d 0%, #ff7875 100%)',
                                border: 'none',
                                borderRadius: 8,
                                height: 40,
                                padding: '0 24px'
                              }}
                            >
                              立即参与
                            </Button>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                );
              })}
            </Space>
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={handlePageChange}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total) => `共 ${total} 个活动`}
              />
            </div>
          </>
        ) : (
          <Empty description="暂无活动数据" />
        )}
      </Spin>
    </div>
  );
};

export default MarketingList;
