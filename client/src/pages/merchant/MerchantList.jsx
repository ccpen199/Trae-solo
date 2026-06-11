import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Select, Button, Pagination, message, Tag, 
  Typography, Space, Empty, Spin, Rate, Avatar
} from 'antd';
import { 
  HeartOutlined, HeartFilled, EyeOutlined, EnvironmentOutlined,
  ShopOutlined, PhoneOutlined, UserOutlined, CommentOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { merchantAPI } from '../../api/index.js';
import { isAuthenticated } from '../../utils/auth.js';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const CITIES = ['全部', '上海', '北京', '广州', '深圳', '杭州', '成都', '武汉', '南京', '苏州'];
const CATEGORIES = [
  { value: '', label: '全部' },
  { value: 'photography', label: '婚纱摄影' },
  { value: 'emcee', label: '司仪主持' },
  { value: 'hotel', label: '婚宴酒店' },
  { value: 'wedding_dress', label: '婚纱礼服' }
];

const CATEGORY_MAP = {
  photography: '婚纱摄影',
  emcee: '司仪主持',
  hotel: '婚宴酒店',
  wedding_dress: '婚纱礼服'
};

const MerchantList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [merchants, setMerchants] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    city: '',
    category: '',
    sort: 'rating'
  });

  const fetchMerchants = async (page = 1, city = '', category = '', sort = 'rating') => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize: pagination.pageSize,
        sort,
        ...(city && city !== '全部' ? { city } : {}),
        ...(category ? { category } : {})
      };
      const response = await merchantAPI.list(params);
      setMerchants(response.data.data);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: response.data.total
      }));
    } catch (error) {
      message.error('获取商家列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants(1, filters.city, filters.category, filters.sort);
  }, []);

  const handleCityChange = (city) => {
    setFilters(prev => ({ ...prev, city }));
    fetchMerchants(1, city, filters.category, filters.sort);
  };

  const handleCategoryChange = (category) => {
    setFilters(prev => ({ ...prev, category }));
    fetchMerchants(1, filters.city, category, filters.sort);
  };

  const handleSortChange = (sort) => {
    setFilters(prev => ({ ...prev, sort }));
    fetchMerchants(1, filters.city, filters.category, sort);
  };

  const handlePageChange = (page) => {
    fetchMerchants(page, filters.city, filters.category, filters.sort);
  };

  const handleLike = async (id, e) => {
    e.stopPropagation();
    if (!isAuthenticated()) {
      message.warning('请先登录');
      return;
    }
    try {
      const response = await merchantAPI.like(id);
      setMerchants(prev => prev.map(m => 
        m.id === id ? { ...m, like_count: response.data.like_count } : m
      ));
      message.success(response.data.liked ? '关注成功' : '已取消关注');
    } catch (error) {
      message.error('操作失败');
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 8, color: '#ff4d6d' }}>
          优质商家
        </Title>
        <Text type="secondary">
          精选本地优质婚庆商家，平台认证，交易有保障
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
            <Text strong>类别：</Text>
            <Select
              value={filters.category || ''}
              style={{ width: 140 }}
              onChange={handleCategoryChange}
            >
              {CATEGORIES.map(cat => (
                <Option key={cat.value} value={cat.value}>{cat.label}</Option>
              ))}
            </Select>
          </Space>
          <Space>
            <Text strong>排序：</Text>
            <Select
              value={filters.sort}
              style={{ width: 140 }}
              onChange={handleSortChange}
            >
              <Option value="rating">评分最高</Option>
              <Option value="reviews">评价最多</Option>
              <Option value="likes">关注最多</Option>
              <Option value="newest">最新入驻</Option>
            </Select>
          </Space>
        </Space>
      </Card>

      <Spin spinning={loading}>
        {merchants.length > 0 ? (
          <>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {merchants.map(merchant => (
                <Card
                  key={merchant.id}
                  hoverable
                  style={{ borderRadius: 12 }}
                  bodyStyle={{ padding: 20 }}
                  onClick={() => navigate(`/merchants/${merchant.id}`)}
                  actions={[
                    <div 
                      key="like"
                      onClick={(e) => handleLike(merchant.id, e)}
                      style={{ cursor: 'pointer' }}
                    >
                      <HeartFilled style={{ color: merchant.liked ? '#ff4d6d' : '#ccc' }} />
                      <span style={{ marginLeft: 4 }}>{merchant.like_count}</span>
                    </div>,
                    <div key="views">
                      <EyeOutlined /> {merchant.view_count}
                    </div>,
                    <div key="reviews">
                      <CommentOutlined /> {merchant.review_count}
                    </div>
                  ]}
                >
                  <Row gutter={20} align="middle">
                    <Col xs={24} sm={4} style={{ textAlign: 'center' }}>
                      <Avatar 
                        size={80} 
                        src={merchant.logo}
                        icon={<ShopOutlined />}
                        style={{ 
                          border: '3px solid #f0f0f0',
                          background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
                        }}
                      />
                    </Col>
                    <Col xs={24} sm={14}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <span style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>
                          {merchant.company_name}
                        </span>
                        {merchant.deposit_status === 1 && (
                          <Tag 
                            icon={<SafetyCertificateOutlined />} 
                            color="gold"
                            style={{ margin: 0 }}
                          >
                            已缴纳保证金
                          </Tag>
                        )}
                        <Tag color="blue">
                          {CATEGORY_MAP[merchant.category] || merchant.category}
                        </Tag>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <Rate disabled value={merchant.rating} style={{ fontSize: 14 }} />
                        <span style={{ color: '#fa8c16', fontWeight: 600, fontSize: 16 }}>
                          {merchant.rating}
                        </span>
                        <Text type="secondary">
                          ({merchant.review_count} 条评价)
                        </Text>
                      </div>
                      <Paragraph style={{ marginBottom: 12, color: '#666', fontSize: 14 }}>
                        {merchant.description || '暂无商家介绍'}
                      </Paragraph>
                      <Space wrap size={[16, 8]} style={{ color: '#999', fontSize: 13 }}>
                        <span><EnvironmentOutlined /> {merchant.city}</span>
                        {merchant.address && (
                          <span><UserOutlined /> {merchant.address}</span>
                        )}
                        {merchant.contact_name && (
                          <span><UserOutlined /> 联系人：{merchant.contact_name}</span>
                        )}
                        {merchant.contact_phone && (
                          <span><PhoneOutlined /> {merchant.contact_phone}</span>
                        )}
                      </Space>
                    </Col>
                    <Col xs={24} sm={6} style={{ textAlign: 'center' }}>
                      <Button 
                        type="primary" 
                        size="large"
                        block
                        style={{
                          height: 48,
                          fontSize: 16,
                          background: 'linear-gradient(135deg, #ff4d6d 0%, #ff7875 100%)',
                          border: 'none',
                          borderRadius: 8
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/merchants/${merchant.id}`);
                        }}
                      >
                        进入店铺
                      </Button>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={handlePageChange}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total) => `共 ${total} 个商家`}
              />
            </div>
          </>
        ) : (
          <Empty description="暂无商家数据" />
        )}
      </Spin>
    </div>
  );
};

export default MerchantList;
