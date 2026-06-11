import React, { useState, useEffect } from 'react';
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
  Input,
  Select,
  Slider,
  Radio,
  Pagination,
  Drawer,
  Checkbox,
  Empty
} from 'antd';
import {
  CameraOutlined,
  SoundOutlined,
  BankOutlined,
  HeartOutlined,
  HeartFilled,
  FilterOutlined,
  SearchOutlined,
  ShopOutlined,
  EyeOutlined,
  LikeOutlined,
  CheckOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { serviceAPI, reviewAPI } from '../../api/index.js';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { Group: RadioGroup, Button: RadioButton } = Radio;

const CATEGORIES = [
  { key: 'photography', name: '婚纱摄影', icon: <CameraOutlined /> },
  { key: 'emcee', name: '司仪主持', icon: <SoundOutlined /> },
  { key: 'hotel', name: '婚宴酒店', icon: <BankOutlined /> },
  { key: 'wedding_dress', name: '婚纱礼服', icon: <HeartOutlined /> }
];

const CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '西安', '重庆'];

const SORT_OPTIONS = [
  { value: 'rating', label: '评分最高', icon: <CheckOutlined /> },
  { value: 'reviews', label: '评价最多', icon: <EyeOutlined /> },
  { value: 'likes', label: '收藏最多', icon: <HeartOutlined /> },
  { value: 'newest', label: '最新发布', icon: <SwapOutlined /> },
  { value: 'price_asc', label: '价格从低到高', icon: <ArrowUpOutlined /> },
  { value: 'price_desc', label: '价格从高到低', icon: <ArrowDownOutlined /> }
];

const PRICE_RANGES = [
  { label: '不限', min: null, max: null },
  { label: '5000以下', min: null, max: 5000 },
  { label: '5000-10000', min: 5000, max: 10000 },
  { label: '10000-20000', min: 10000, max: 20000 },
  { label: '20000-50000', min: 20000, max: 50000 },
  { label: '50000以上', min: 50000, max: null }
];

const ServiceList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0
  });
  const [likedServices, setLikedServices] = useState({});

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || null,
    city: null,
    minPrice: null,
    maxPrice: null,
    keyword: '',
    sort: 'rating'
  });

  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [tempFilters, setTempFilters] = useState({ ...filters });

  useEffect(() => {
    fetchServices();
  }, [filters, pagination.current, pagination.pageSize]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        sort: filters.sort
      };

      if (filters.category) params.category = filters.category;
      if (filters.city) params.city = filters.city;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.keyword) params.keyword = filters.keyword;

      const response = await serviceAPI.list(params);
      setServices(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0
      }));
    } catch (error) {
      message.error('获取服务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryKey) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category === categoryKey ? null : categoryKey
    }));
    setPagination(prev => ({ ...prev, current: 1 }));
    if (categoryKey) {
      searchParams.set('category', categoryKey);
    } else {
      searchParams.delete('category');
    }
    setSearchParams(searchParams);
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, keyword: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleSortChange = (e) => {
    setFilters(prev => ({ ...prev, sort: e.target.value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handlePriceRangeClick = (range) => {
    setFilters(prev => ({
      ...prev,
      minPrice: range.min,
      maxPrice: range.max
    }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleSliderChange = (value) => {
    setTempFilters(prev => ({
      ...prev,
      minPrice: value[0] > 0 ? value[0] : null,
      maxPrice: value[1] < 100000 ? value[1] : null
    }));
  };

  const handleCityChange = (value) => {
    setTempFilters(prev => ({ ...prev, city: value }));
  };

  const handleFilterConfirm = () => {
    setFilters(tempFilters);
    setPagination(prev => ({ ...prev, current: 1 }));
    setFilterDrawerVisible(false);
  };

  const handleFilterReset = () => {
    const resetFilters = {
      category: null,
      city: null,
      minPrice: null,
      maxPrice: null,
      keyword: filters.keyword,
      sort: filters.sort
    };
    setTempFilters(resetFilters);
    setFilters(resetFilters);
    setPagination(prev => ({ ...prev, current: 1 }));
    searchParams.delete('category');
    setSearchParams(searchParams);
  };

  const handleLikeService = async (serviceId, e) => {
    e.stopPropagation();
    try {
      const response = await serviceAPI.like(serviceId);
      setLikedServices(prev => ({
        ...prev,
        [serviceId]: response.data.liked
      }));
      setServices(prev => prev.map(s =>
        s.id === serviceId
          ? { ...s, like_count: response.data.like_count }
          : s
      ));
      message.success(response.data.liked ? '已收藏' : '已取消收藏');
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({ ...prev, current: page, pageSize }));
  };

  const getCategoryInfo = (categoryKey) => {
    return CATEGORIES.find(c => c.key === categoryKey) || { name: categoryKey, icon: <ShopOutlined /> };
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

  const renderFilterTag = () => {
    const tags = [];
    if (filters.category) {
      const cat = getCategoryInfo(filters.category);
      tags.push(
        <Tag
          key="category"
          color="blue"
          closable
          onClose={() => handleCategoryClick(filters.category)}
        >
          {cat.icon} {cat.name}
        </Tag>
      );
    }
    if (filters.city) {
      tags.push(
        <Tag
          key="city"
          color="green"
          closable
          onClose={() => setFilters(prev => ({ ...prev, city: null }))}
        >
          {filters.city}
        </Tag>
      );
    }
    if (filters.minPrice || filters.maxPrice) {
      const priceText = filters.minPrice && filters.maxPrice
        ? `¥${filters.minPrice.toLocaleString()} - ¥${filters.maxPrice.toLocaleString()}`
        : filters.minPrice
        ? `¥${filters.minPrice.toLocaleString()}以上`
        : `¥${filters.maxPrice.toLocaleString()}以下`;
      tags.push(
        <Tag
          key="price"
          color="orange"
          closable
          onClose={() => setFilters(prev => ({ ...prev, minPrice: null, maxPrice: null }))}
        >
          {priceText}
        </Tag>
      );
    }
    return tags;
  };

  const activeFiltersCount = [filters.category, filters.city, filters.minPrice, filters.maxPrice].filter(Boolean).length;

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      {/* 顶部搜索和筛选 */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
          <Title level={3} style={{ marginBottom: 20 }}>
            <span style={{ borderLeft: '4px solid #ff4d6d', paddingLeft: 12 }}>服务市场</span>
          </Title>

          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={12}>
              <Search
                placeholder="搜索服务名称、商家..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
              />
            </Col>
            <Col xs={24} md={12} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <RadioGroup value={filters.sort} onChange={handleSortChange} size="large">
                {SORT_OPTIONS.slice(0, 4).map(option => (
                  <RadioButton key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </RadioButton>
                ))}
              </RadioGroup>
              <Button
                size="large"
                onClick={() => {
                  setTempFilters({ ...filters });
                  setFilterDrawerVisible(true);
                }}
                style={{ marginLeft: 8 }}
              >
                <FilterOutlined /> 筛选
                {activeFiltersCount > 0 && (
                  <Tag color="red" style={{ marginLeft: 4 }}>{activeFiltersCount}</Tag>
                )}
              </Button>
            </Col>
          </Row>

          {/* 品类筛选 */}
          <div style={{ marginBottom: 16 }}>
            <Space size={[8, 8]} wrap>
              <Button
                type={!filters.category ? 'primary' : 'default'}
                size="large"
                onClick={() => handleCategoryClick(null)}
                style={{ borderRadius: 20 }}
              >
                全部
              </Button>
              {CATEGORIES.map(category => (
                <Button
                  key={category.key}
                  type={filters.category === category.key ? 'primary' : 'default'}
                  size="large"
                  onClick={() => handleCategoryClick(category.key)}
                  style={{
                    borderRadius: 20,
                    borderColor: filters.category === category.key ? getCategoryColor(category.key) : undefined,
                    color: filters.category === category.key ? '#fff' : getCategoryColor(category.key),
                    background: filters.category === category.key ? getCategoryColor(category.key) : undefined
                  }}
                >
                  {category.icon} {category.name}
                </Button>
              ))}
            </Space>
          </div>

          {/* 快速价格区间 */}
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ marginRight: 12 }}>价格：</Text>
            <Space size={[8, 8]} wrap>
              {PRICE_RANGES.map((range, index) => {
                const isActive = filters.minPrice === range.min && filters.maxPrice === range.max;
                return (
                  <Button
                    key={index}
                    type={isActive ? 'primary' : 'default'}
                    size="small"
                    onClick={() => handlePriceRangeClick(range)}
                    style={{ borderRadius: 16 }}
                  >
                    {range.label}
                  </Button>
                );
              })}
            </Space>
          </div>

          {/* 已选筛选标签 */}
          {activeFiltersCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text type="secondary">已选：</Text>
              <Space size={[8, 8]} wrap>
                {renderFilterTag()}
              </Space>
              <Button type="link" size="small" onClick={handleFilterReset}>清空</Button>
            </div>
          )}
        </div>
      </div>

      {/* 服务列表 */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        {!loading && services.length === 0 ? (
          <div style={{ padding: '80px 0', background: '#fff', borderRadius: 12 }}>
            <Empty description="没有找到相关服务" />
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button onClick={handleFilterReset}>重置筛选条件</Button>
            </div>
          </div>
        ) : (
          <>
            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
              {services.map(service => {
                const categoryInfo = getCategoryInfo(service.category);
                return (
                  <Col xs={24} sm={12} lg={8} key={service.id}>
                    <Card
                      hoverable
                      loading={loading}
                      onClick={() => navigate(`/services/${service.id}`)}
                      style={{ borderRadius: 12, overflow: 'hidden' }}
                      bodyStyle={{ padding: 0 }}
                      cover={
                        <div style={{ position: 'relative', paddingTop: '60%', overflow: 'hidden' }}>
                          <img
                            alt={service.name}
                            src={
                              service.images?.[0] ||
                              `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wedding%20${encodeURIComponent(service.category_name || 'service')}&image_size=landscape_16_9`
                            }
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
                            color={getCategoryColor(service.category)}
                            style={{
                              position: 'absolute',
                              top: 12,
                              left: 12,
                              fontSize: 12
                            }}
                          >
                            {categoryInfo.icon} {service.category_name}
                          </Tag>
                          <div
                            onClick={(e) => handleLikeService(service.id, e)}
                            style={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: 'rgba(255,255,255,0.9)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            {likedServices[service.id] ? (
                              <HeartFilled style={{ color: '#ff4d6d', fontSize: 18 }} />
                            ) : (
                              <HeartOutlined style={{ fontSize: 18 }} />
                            )}
                          </div>
                          {service.original_price && service.original_price > service.price && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 12,
                                left: 12,
                                background: 'linear-gradient(90deg, #ff4d6d, #ff7875)',
                                color: '#fff',
                                padding: '4px 12px',
                                borderRadius: 12,
                                fontSize: 12,
                                fontWeight: 'bold'
                              }}
                            >
                              省 ¥{(service.original_price - service.price).toLocaleString()}
                            </div>
                          )}
                        </div>
                      }
                    >
                      <div style={{ padding: 20 }}>
                        <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }} ellipsis>
                          {service.name}
                        </Text>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <Rate disabled value={service.rating} style={{ fontSize: 12 }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>{service.rating}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>|</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>{service.review_count || 0}条评价</Text>
                        </div>

                        {service.tags && service.tags.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <Space size={[4, 4]} wrap>
                              {service.tags.slice(0, 3).map((tag, index) => (
                                <Tag key={index} style={{ margin: 0, fontSize: 11 }}>{tag}</Tag>
                              ))}
                            </Space>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                          <div>
                            <Text type="danger" strong style={{ fontSize: 20 }}>
                              ¥{service.price.toLocaleString()}
                            </Text>
                            {service.original_price && (
                              <Text delete type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                ¥{service.original_price.toLocaleString()}
                              </Text>
                            )}
                          </div>
                          <Space size={4}>
                            <LikeOutlined style={{ color: '#ff4d6d' }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>{service.like_count || 0}</Text>
                          </Space>
                        </div>

                        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar size={28} src={service.merchant_logo}>
                            {service.company_name?.[0]}
                          </Avatar>
                          <Text type="secondary" style={{ fontSize: 13 }} ellipsis>
                            {service.company_name}
                          </Text>
                          <Tag color="blue" style={{ marginLeft: 'auto', fontSize: 11 }}>{service.city}</Tag>
                        </div>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                showSizeChanger
                showQuickJumper
                showTotal={(total) => `共 ${total} 条服务`}
                onChange={handlePageChange}
                onShowSizeChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>

      {/* 筛选抽屉 */}
      <Drawer
        title="高级筛选"
        placement="right"
        width={360}
        open={filterDrawerVisible}
        onClose={() => setFilterDrawerVisible(false)}
        extra={
          <Space>
            <Button onClick={handleFilterReset}>重置</Button>
            <Button type="primary" onClick={handleFilterConfirm}>确定</Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ display: 'block', marginBottom: 12 }}>城市</Text>
          <Select
            placeholder="选择城市"
            style={{ width: '100%' }}
            allowClear
            value={tempFilters.city}
            onChange={handleCityChange}
          >
            {CITIES.map(city => (
              <Option key={city} value={city}>{city}</Option>
            ))}
          </Select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ display: 'block', marginBottom: 12 }}>
            价格区间
            {tempFilters.minPrice || tempFilters.maxPrice ? (
              <span style={{ color: '#ff4d6d', marginLeft: 8 }}>
                {tempFilters.minPrice || 0} - {tempFilters.maxPrice || '不限'}
              </span>
            ) : null}
          </Text>
          <Slider
            range
            min={0}
            max={100000}
            step={1000}
            value={[tempFilters.minPrice || 0, tempFilters.maxPrice || 100000]}
            onChange={handleSliderChange}
            tooltip={{
              formatter: (value) => `¥${value?.toLocaleString()}`
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>¥0</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>¥100000+</Text>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ display: 'block', marginBottom: 12 }}>服务类型</Text>
          <Checkbox.Group
            value={tempFilters.category ? [tempFilters.category] : []}
            onChange={(checkedValues) => {
              setTempFilters(prev => ({
                ...prev,
                category: checkedValues[checkedValues.length - 1] || null
              }));
            }}
          >
            <Space direction="vertical">
              {CATEGORIES.map(category => (
                <Checkbox key={category.key} value={category.key}>
                  {category.icon} {category.name}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </div>

        <div>
          <Text strong style={{ display: 'block', marginBottom: 12 }}>排序方式</Text>
          <RadioGroup value={tempFilters.sort} onChange={(e) => setTempFilters(prev => ({ ...prev, sort: e.target.value }))}>
            <Space direction="vertical">
              {SORT_OPTIONS.map(option => (
                <Radio key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </Radio>
              ))}
            </Space>
          </RadioGroup>
        </div>
      </Drawer>
    </div>
  );
};

export default ServiceList;
