import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Image, Tag, Button, Empty, Pagination, message, Popconfirm,
  Space
} from 'antd';
import { HeartFilled, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import AppLayout from '../components/Layout';
import { favoriteApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Meta } = Card;

const Favorites = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    fetchFavorites();
  }, [pagination.current, pagination.pageSize, isAuthenticated]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const data = await favoriteApi.getList({
        page: pagination.current,
        limit: pagination.pageSize
      });
      setFavorites(data.favorites || []);
      setPagination(prev => ({ ...prev, total: data.total || 0 }));
    } catch (error) {
      console.error('获取收藏列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=placeholder%20product%20image&image_size=square';
  };

  const getConditionLabel = (condition) => {
    const map = {
      'new': '全新',
      'like_new': '几乎全新',
      'good': '良好',
      'fair': '一般',
      'poor': '较旧'
    };
    return map[condition] || condition;
  };

  const handleRemoveFavorite = async (productId) => {
    try {
      await favoriteApi.toggle(productId);
      message.success('已取消收藏');
      fetchFavorites();
    } catch (error) {
      console.error('取消收藏失败:', error);
    }
  };

  return (
    <AppLayout showSidebar>
      <Card title="我的收藏">
        {favorites.length === 0 && !loading ? (
          <Empty description="暂无收藏商品" style={{ margin: '40px 0' }} />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {favorites.map(item => (
                <Col xs={24} sm={12} md={8} lg={6} key={item.favorite_id}>
                  <Card
                    hoverable
                    cover={
                      <div 
                        onClick={() => navigate(`/products/${item.id}`)}
                        style={{ height: 180, overflow: 'hidden', cursor: 'pointer' }}
                      >
                        <Image
                          width="100%"
                          height={180}
                          src={getProductImage(item)}
                          alt={item.title}
                          style={{ objectFit: 'cover' }}
                          preview={false}
                        />
                      </div>
                    }
                    actions={[
                      <span key="view"><EyeOutlined /> {item.view_count || 0}</span>,
                      <Popconfirm
                        key="unfavorite"
                        title="确定取消收藏吗？"
                        onConfirm={() => handleRemoveFavorite(item.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <span style={{ color: '#ff4d4f', cursor: 'pointer' }}>
                          <HeartFilled /> 取消收藏
                        </span>
                      </Popconfirm>
                    ]}
                  >
                    <Meta
                      title={
                        <div 
                          onClick={() => navigate(`/products/${item.id}`)}
                          style={{ cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {item.title}
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 'bold' }}>
                            ¥{item.price}
                            {item.original_price && (
                              <span style={{ fontSize: 12, color: '#999', textDecoration: 'line-through', marginLeft: 8 }}>
                                ¥{item.original_price}
                              </span>
                            )}
                          </div>
                          <div style={{ marginTop: 8 }}>
                            {item.condition && (
                              <Tag color="blue">{getConditionLabel(item.condition)}</Tag>
                            )}
                            {item.category_name && (
                              <Tag>{item.category_name}</Tag>
                            )}
                          </div>
                          <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                            卖家: {item.seller_nickname || item.seller_name}
                          </div>
                          <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                            收藏时间: {dayjs(item.favorite_at).format('YYYY-MM-DD HH:mm')}
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>

            {pagination.total > 0 && (
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={(page, pageSize) => {
                    setPagination(prev => ({ ...prev, current: page, pageSize }));
                  }}
                  showSizeChanger
                  showTotal={(total) => `共 ${total} 件收藏商品`}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </AppLayout>
  );
};

export default Favorites;
