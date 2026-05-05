import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Empty,
  Spin,
  Pagination,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  UserOutlined,
  StarOutlined,
  HeartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { houseService } from '@/services/houseService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const houseTypes = [
  { label: '全部户型', value: '' },
  { label: '公寓', value: 'apartment' },
  { label: '住宅', value: 'house' },
  { label: '别墅', value: 'villa' },
  { label: 'LOFT', value: 'loft' },
  { label: '单间', value: 'studio' },
];

const sortOptions = [
  { label: '综合排序', value: '' },
  { label: '价格由低到高', value: 'price_asc' },
  { label: '价格由高到低', value: 'price_desc' },
  { label: '评分最高', value: 'rating' },
  { label: '评价最多', value: 'reviews' },
];

const cities = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '三亚', '南京',
  '武汉', '西安', '重庆', '厦门', '苏州', '青岛', '大连', '天津'
];

function HouseList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [houses, setHouses] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    checkInDate: searchParams.get('checkInDate') || null,
    checkOutDate: searchParams.get('checkOutDate') || null,
    minPrice: '',
    maxPrice: '',
    houseType: '',
    maxGuests: '',
    sortBy: '',
  });

  useEffect(() => {
    fetchHouses();
  }, [filters]);

  const fetchHouses = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.current,
        limit: pagination.pageSize,
      };
      
      const result = await houseService.getHouses(params);
      setHouses(result.houses || []);
      setPagination({
        ...pagination,
        total: result.pagination?.total || 0,
      });
    } catch (error) {
      console.error('获取房源列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page, pageSize) => {
    setPagination({
      ...pagination,
      current: page,
      pageSize: pageSize || pagination.pageSize,
    });
  };

  const handleHouseClick = (houseId) => {
    navigate(`/houses/${houseId}`);
  };

  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value,
    });
    setPagination({
      ...pagination,
      current: 1,
    });
  };

  const handleSearch = () => {
    setPagination({
      ...pagination,
      current: 1,
    });
    fetchHouses();
  };

  const handleDateChange = (dates) => {
    if (dates) {
      setFilters({
        ...filters,
        checkInDate: dates[0]?.format('YYYY-MM-DD') || null,
        checkOutDate: dates[1]?.format('YYYY-MM-DD') || null,
      });
    } else {
      setFilters({
        ...filters,
        checkInDate: null,
        checkOutDate: null,
      });
    }
  };

  return (
    <div>
      <div className="page-header">
        <Row gutter={16} align="middle">
          <Col flex="1">
            <Input
              placeholder="搜索目的地、景点、商圈"
              prefix={<SearchOutlined />}
              size="large"
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              style={{ maxWidth: 300 }}
            />
          </Col>
          <Col>
            <RangePicker
              placeholder={['入住日期', '退房日期']}
              size="large"
              onChange={handleDateChange}
              defaultValue={
                filters.checkInDate && filters.checkOutDate
                  ? [dayjs(filters.checkInDate), dayjs(filters.checkOutDate)]
                  : null
              }
              disabledDate={(current) =>
                current && current < dayjs().startOf('day')
              }
            />
          </Col>
          <Col>
            <Select
              placeholder="选择城市"
              size="large"
              style={{ width: 120 }}
              value={filters.city || undefined}
              onChange={(value) => handleFilterChange('city', value)}
              options={cities.map((c) => ({ label: c, value: c }))}
              allowClear
              showSearch
            />
          </Col>
          <Col>
            <Select
              placeholder="价格区间"
              size="large"
              style={{ width: 150 }}
              allowClear
              options={[
                { label: '不限', value: '' },
                { label: '¥200以下', value: 'lt200' },
                { label: '¥200-500', value: '200-500' },
                { label: '¥500-1000', value: '500-1000' },
                { label: '¥1000以上', value: 'gt1000' },
              ]}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              size="large"
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              搜索
            </Button>
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0' }} />

        <Row gutter={16} align="middle">
          <Col>
            <Text type="secondary" style={{ marginRight: 8 }}>
              户型：
            </Text>
            <Select
              value={filters.houseType || undefined}
              onChange={(value) => handleFilterChange('houseType', value)}
              options={houseTypes}
              style={{ width: 120 }}
              allowClear
            />
          </Col>
          <Col>
            <Text type="secondary" style={{ marginRight: 8 }}>
              人数：
            </Text>
            <Select
              placeholder="不限人数"
              style={{ width: 120 }}
              value={filters.maxGuests || undefined}
              onChange={(value) => handleFilterChange('maxGuests', value)}
              options={[
                { label: '不限', value: '' },
                { label: '1人', value: 1 },
                { label: '2人', value: 2 },
                { label: '3-4人', value: 4 },
                { label: '5人以上', value: 5 },
              ]}
              allowClear
            />
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ marginRight: 8 }}>
              排序：
            </Text>
            <Select
              value={filters.sortBy || undefined}
              onChange={(value) => handleFilterChange('sortBy', value)}
              options={sortOptions}
              style={{ width: 150 }}
            />
          </Col>
        </Row>
      </div>

      <Spin spinning={loading}>
        {houses.length === 0 ? (
          <Empty
            description="暂无符合条件的房源"
            style={{ padding: '100px 0' }}
          />
        ) : (
          <>
            <Row gutter={[24, 24]}>
              {houses.map((house) => (
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
                        className="house-card-title multi-ellipsis-2"
                        style={{ marginBottom: 8, minHeight: 44 }}
                      >
                        {house.title}
                      </div>
                      <div
                        className="house-card-info"
                        style={{ marginBottom: 12, fontSize: 12 }}
                      >
                        <Space size={8}>
                          <span>
                            <EnvironmentOutlined style={{ marginRight: 4 }} />
                            {house.district}
                          </span>
                          <span>
                            <UserOutlined style={{ marginRight: 4 }} />
                            {house.maxGuests}人
                          </span>
                        </Space>
                      </div>
                      <div className="house-card-price">
                        <span style={{ fontSize: 20 }}>¥{house.pricePerNight}</span>
                        <span>/晚</span>
                        {house.rating && (
                          <span
                            style={{
                              float: 'right',
                              fontSize: 12,
                              color: '#faad14',
                              marginTop: 8,
                            }}
                          >
                            <StarOutlined style={{ marginRight: 2 }} />
                            {house.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={handlePageChange}
                showSizeChanger
                showQuickJumper
                showTotal={(total) => `共 ${total} 套房源`}
              />
            </div>
          </>
        )}
      </Spin>
    </div>
  );
}

export default HouseList;
