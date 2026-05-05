import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Button,
  Typography,
  Space,
  Tag,
  Divider,
  Spin,
  Empty,
  Pagination,
  message,
  Popconfirm,
} from 'antd';
import {
  HomeOutlined,
  EnvironmentOutlined,
  UserOutlined,
  StarOutlined,
  HeartOutlined,
  HeartFilled,
  DeleteOutlined,
  RightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { userService } from '@/services/userService';
import { houseService } from '@/services/houseService';

const { Title, Text } = Typography;

function Favorites() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  });

  useEffect(() => {
    fetchFavorites();
  }, [pagination.current, pagination.pageSize]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
      };

      const result = await userService.getMyFavorites(params);
      setFavorites(result.houses || []);
      setPagination({
        ...pagination,
        total: result.pagination?.total || 0,
      });
    } catch (error) {
      console.error('获取收藏列表失败:', error);
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

  const handleToggleFavorite = async (e, houseId) => {
    e.stopPropagation();
    try {
      const result = await houseService.toggleFavorite(houseId);
      if (!result.isFavorite) {
        message.success('已取消收藏');
        fetchFavorites();
      }
    } catch (error) {
      console.error('取消收藏失败:', error);
    }
  };

  const renderHouseCard = (house) => (
    <Col xs={24} sm={12} md={8} lg={6} key={house.id}>
      <Card
        hoverable
        onClick={() => handleHouseClick(house.id)}
        bodyStyle={{ padding: 0 }}
        className="card-hover"
      >
        <div
          style={{
            height: 160,
            backgroundImage: `url(${house.images?.[0] || 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=400'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '8px 8px 0 0',
            position: 'relative',
          }}
        >
          <Tag
            color="red"
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              cursor: 'pointer',
            }}
            onClick={(e) => handleToggleFavorite(e, house.id)}
          >
            <HeartFilled /> 已收藏
          </Tag>
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
            style={{ marginBottom: 8, fontWeight: 500 }}
          >
            {house.title}
          </div>
          <div style={{ marginBottom: 12, fontSize: 12 }}>
            <Space size={12}>
              <span>
                <EnvironmentOutlined style={{ marginRight: 4, color: '#999' }} />
                <Text type="secondary">{house.district}</Text>
              </span>
              <span>
                <UserOutlined style={{ marginRight: 4, color: '#999' }} />
                <Text type="secondary">{house.maxGuests}人</Text>
              </span>
            </Space>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 20, fontWeight: 600, color: '#ff4d4f' }}>
                ¥{house.pricePerNight}
              </span>
              <Text type="secondary">/晚</Text>
            </div>
            {house.rating && (
              <div>
                <StarOutlined style={{ color: '#faad14', marginRight: 2 }} />
                <Text strong>{house.rating}</Text>
              </div>
            )}
          </div>
          {house.favoritedAt && (
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <Text type="secondary">
                收藏于 {dayjs(house.favoritedAt).format('YYYY-MM-DD')}
              </Text>
            </div>
          )}
        </div>
      </Card>
    </Col>
  );

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <HeartFilled style={{ marginRight: 8, color: '#ff4d4f' }} />
            我的收藏
          </Title>
        </Col>
        <Col>
          <Text type="secondary">
            共 {pagination.total} 套收藏房源
          </Text>
        </Col>
      </Row>

      <Spin spinning={loading}>
        {favorites.length === 0 ? (
          <Card bordered={false}>
            <Empty
              description={
                <div>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    暂无收藏的房源
                  </Text>
                  <Button type="primary" onClick={() => navigate('/houses')}>
                    去看看房源
                  </Button>
                </div>
              }
              style={{ padding: '60px 0' }}
            />
          </Card>
        ) : (
          <>
            <Row gutter={[24, 24]}>
              {favorites.map(renderHouseCard)}
            </Row>

            {pagination.total > pagination.pageSize && (
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
            )}
          </>
        )}
      </Spin>
    </div>
  );
}

export default Favorites;