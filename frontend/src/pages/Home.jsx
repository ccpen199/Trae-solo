import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Row, Col, Card, Input, Select, Pagination, Tag, Image, Empty, Button,
  Carousel, message
} from 'antd';
import { SearchOutlined, EyeOutlined, HeartOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import AppLayout from '../components/Layout';
import { productApi, categoryApi, announcementApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Meta } = Card;
const { Option } = Select;

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 16,
    total: 0
  });
  const [filters, setFilters] = useState({
    keyword: '',
    category_id: '',
    sort: 'created_at'
  });
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchCategories = async () => {
    try {
      const data = await categoryApi.getList();
      setCategories(data);
    } catch (error) {
      console.error('获取分类失败:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const data = await announcementApi.getList({ page: 1, limit: 5 });
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error('获取公告失败:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };
      if (!params.category_id) delete params.category_id;
      if (!params.keyword) delete params.keyword;

      const data = await productApi.getList(params);
      setProducts(data.products || []);
      setPagination(prev => ({ ...prev, total: data.total || 0 }));
    } catch (error) {
      console.error('获取商品列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, keyword: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleCategoryChange = (value) => {
    setFilters(prev => ({ ...prev, category_id: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleSortChange = (value) => {
    setFilters(prev => ({ ...prev, sort: value }));
  };

  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({ ...prev, current: page, pageSize }));
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

  return (
    <AppLayout>
      <div style={{ marginBottom: 24 }}>
        {announcements.length > 0 && (
          <Card style={{ marginBottom: 24 }}>
            <Carousel autoplay dotPosition="top">
              {announcements.map(ann => (
                <div key={ann.id} style={{ cursor: 'pointer', padding: '0 20px' }}>
                  <h3 
                    onClick={() => navigate(`/announcements/${ann.id}`)}
                    style={{ margin: 0, color: '#1890ff' }}
                  >
                    {ann.is_top && <Tag color="red">置顶</Tag>}
                    {ann.title}
                  </h3>
                </div>
              ))}
            </Carousel>
          </Card>
        )}

        <Card>
          <Row gutter={16} align="middle">
            <Col span={6}>
              <Input.Search
                placeholder="搜索商品..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                value={filters.keyword}
                onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="选择分类"
                allowClear
                style={{ width: '100%' }}
                size="large"
                value={filters.category_id || undefined}
                onChange={handleCategoryChange}
              >
                {categories.map(cat => (
                  <Option key={cat.id} value={cat.id}>{cat.name} ({cat.product_count || 0})</Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="排序方式"
                style={{ width: '100%' }}
                size="large"
                value={filters.sort}
                onChange={handleSortChange}
              >
                <Option value="created_at">最新发布</Option>
                <Option value="price_asc">价格从低到高</Option>
                <Option value="price_desc">价格从高到低</Option>
                <Option value="view_count">最多浏览</Option>
                <Option value="favorite_count">最多收藏</Option>
              </Select>
            </Col>
            <Col span={10} style={{ textAlign: 'right' }}>
              {filters.keyword && (
                <Tag color="blue">关键词: {filters.keyword}</Tag>
              )}
              {filters.category_id && (
                <Tag color="green">
                  分类: {categories.find(c => c.id == filters.category_id)?.name}
                </Tag>
              )}
            </Col>
          </Row>
        </Card>
      </div>

      <Card title={`商品列表 (共 ${pagination.total} 件)`}>
        {products.length === 0 ? (
          <Empty description="暂无商品" />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {products.map(product => (
                <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                  <Card
                    hoverable
                    cover={
                      <div 
                        onClick={() => navigate(`/products/${product.id}`)}
                        style={{ height: 200, overflow: 'hidden', cursor: 'pointer' }}
                      >
                        <Image
                          width="100%"
                          height={200}
                          src={getProductImage(product)}
                          alt={product.title}
                          style={{ objectFit: 'cover' }}
                          preview={false}
                        />
                      </div>
                    }
                    actions={[
                      <span key="view"><EyeOutlined /> {product.view_count || 0}</span>,
                      <span key="favorite"><HeartOutlined /> {product.favorite_count || 0}</span>
                    ]}
                  >
                    <Meta
                      title={
                        <div 
                          onClick={() => navigate(`/products/${product.id}`)}
                          style={{ cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {product.title}
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 'bold' }}>
                            ¥{product.price}
                            {product.original_price && (
                              <span style={{ fontSize: 12, color: '#999', textDecoration: 'line-through', marginLeft: 8 }}>
                                ¥{product.original_price}
                              </span>
                            )}
                          </div>
                          <div style={{ marginTop: 8 }}>
                            {product.condition && (
                              <Tag color="blue">{getConditionLabel(product.condition)}</Tag>
                            )}
                            {product.category_name && (
                              <Tag>{product.category_name}</Tag>
                            )}
                          </div>
                          <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                            {dayjs(product.created_at).format('YYYY-MM-DD HH:mm')}
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
                  onChange={handlePageChange}
                  showSizeChanger
                  showTotal={(total) => `共 ${total} 条`}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </AppLayout>
  );
};

export default Home;
