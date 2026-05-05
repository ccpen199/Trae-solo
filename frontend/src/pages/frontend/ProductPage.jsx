import React, { useEffect, useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Input, 
  Select, 
  Pagination, 
  Tag, 
  Typography,
  Button,
  Empty,
  Spin,
  Breadcrumb
} from 'antd';
import { SearchOutlined, FilterOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productsApi } from '../../api';

const { Title, Text } = Typography;
const { Search } = Input;

function ProductPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 12,
    total: 0
  });
  
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    series_id: searchParams.get('series_id') || '',
    category_id: searchParams.get('category_id') || ''
  });

  useEffect(() => {
    loadSeries();
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [filters, pagination.page]);

  const loadSeries = async () => {
    try {
      const res = await productsApi.getSeries();
      setSeries(res.data || []);
    } catch (error) {
      console.error('加载产品系列失败:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await productsApi.getCategories({ parent_id: 0 });
      setCategories(res.data || []);
    } catch (error) {
      console.error('加载产品分类失败:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        page_size: pagination.page_size,
        ...filters
      };
      const res = await productsApi.getList(params);
      setProducts(res.data?.list || []);
      setPagination(prev => ({
        ...prev,
        total: res.data?.pagination?.total || 0
      }));
    } catch (error) {
      console.error('加载产品列表失败:', error);
      setProducts([
        { id: 1, title: '智能产品A1', subtitle: '高端智能产品，品质之选', is_recommended: true },
        { id: 2, title: '智能产品B2', subtitle: '中端智能产品，性价比高', is_recommended: true },
        { id: 3, title: '智能产品C3', subtitle: '入门级智能产品，易用之选', is_recommended: false },
        { id: 4, title: '智能产品D4', subtitle: '专业级智能产品，性能卓越', is_recommended: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, keyword: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
    setSearchParams({ keyword: value });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value || '' }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  return (
    <div style={{ padding: '40px 0', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <Breadcrumb style={{ marginBottom: 24 }}>
          <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>首页</Breadcrumb.Item>
          <Breadcrumb.Item>产品中心</Breadcrumb.Item>
        </Breadcrumb>

        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8}>
              <Text strong>搜索产品：</Text>
              <Search
                placeholder="输入关键词搜索"
                allowClear
                enterButton={<><SearchOutlined /> 搜索</>}
                style={{ width: '100%', marginTop: 8 }}
                value={filters.keyword}
                onSearch={handleSearch}
                onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value })}
              />
            </Col>
            <Col xs={12} sm={5}>
              <Text strong>产品系列：</Text>
              <Select
                placeholder="选择系列"
                allowClear
                style={{ width: '100%', marginTop: 8 }}
                value={filters.series_id || undefined}
                onChange={(value) => handleFilterChange('series_id', value)}
              >
                {series.map(item => (
                  <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={5}>
              <Text strong>产品分类：</Text>
              <Select
                placeholder="选择分类"
                allowClear
                style={{ width: '100%', marginTop: 8 }}
                value={filters.category_id || undefined}
                onChange={(value) => handleFilterChange('category_id', value)}
              >
                {categories.map(item => (
                  <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={6}>
              <div style={{ marginTop: 32 }}>
                <Button 
                  type="primary" 
                  icon={<FilterOutlined />}
                  onClick={() => {
                    setFilters({ keyword: '', series_id: '', category_id: '' });
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                >
                  重置筛选
                </Button>
              </div>
            </Col>
          </Row>
        </Card>

        <Spin spinning={loading}>
          {products.length > 0 ? (
            <>
              <Row gutter={[24, 24]}>
                {products.map((product) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                    <Card
                      hoverable
                      style={{ cursor: 'pointer' }}
                      cover={
                        <div style={{
                          height: 200,
                          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{ fontSize: 48, color: '#1890ff' }}>
                            {product.is_recommended ? '★' : '📦'}
                          </div>
                        </div>
                      }
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      <Card.Meta
                        title={<div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>{product.title}</div>}
                        description={<Text type="secondary" ellipsis={{ rows: 2 }}>{product.subtitle}</Text>}
                      />
                      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {product.is_recommended && <Tag color="gold">推荐</Tag>}
                        {product.view_count && <Text type="secondary" style={{ fontSize: 12 }}>浏览: {product.view_count}</Text>}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>

              {pagination.total > 0 && (
                <div style={{ marginTop: 40, textAlign: 'center' }}>
                  <Pagination
                    current={pagination.page}
                    pageSize={pagination.page_size}
                    total={pagination.total}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    showQuickJumper
                    showTotal={(total) => `共 ${total} 件产品`}
                  />
                </div>
              )}
            </>
          ) : (
            <Card>
              <Empty description="暂无产品数据" />
            </Card>
          )}
        </Spin>
      </div>
    </div>
  );
}

export default ProductPage;
