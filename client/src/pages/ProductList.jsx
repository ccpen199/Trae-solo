import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Row, 
  Col, 
  Typography, 
  Card, 
  Pagination, 
  Input, 
  Select, 
  Button,
  Space,
  Tag,
  Breadcrumb,
  Empty
} from 'antd';
import { 
  ShopOutlined, 
  HomeOutlined, 
  SearchOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { productService } from '../services/productService';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Meta } = Card;

const ProductList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [sort, setSort] = useState('');
  const [isRecommended, setIsRecommended] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [isHot, setIsHot] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = {
        page,
        pageSize,
      };
      
      if (keyword) {
        params.keyword = keyword;
      }
      
      if (sort) {
        params.sort = sort;
      }
      
      if (isRecommended) {
        params.isRecommended = true;
      }
      
      if (isNew) {
        params.isNew = true;
      }
      
      if (isHot) {
        params.isHot = true;
      }
      
      const result = await productService.getProducts(params);
      
      setProducts(result.data.list || []);
      setTotal(result.data.total || 0);
    } catch (error) {
      console.error('获取产品列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, sort, isRecommended, isNew, isHot]);

  useEffect(() => {
    const urlKeyword = searchParams.get('keyword');
    if (urlKeyword && urlKeyword !== keyword) {
      setKeyword(urlKeyword);
      setPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (value) => {
    setKeyword(value);
    setPage(1);
  };

  const handlePageChange = (newPage, newPageSize) => {
    setPage(newPage);
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  };

  const handleSortChange = (value) => {
    setSort(value);
    setPage(1);
  };

  const renderProductCard = (product) => (
    <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
      <Card
        hoverable
        loading={loading}
        cover={
          <div style={{ 
            height: '200px', 
            background: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShopOutlined style={{ fontSize: '64px', color: '#ccc' }} />
          </div>
        }
        actions={[
          <Button 
            type="link" 
            onClick={() => navigate(`/products/${product.id}`)}
          >
            查看详情
          </Button>
        ]}
        style={{ marginBottom: '16px' }}
      >
        <Meta
          title={
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong ellipsis style={{ fontSize: '16px', display: 'block' }}>
                {product.title}
              </Text>
              <Space>
                {product.is_recommended && <Tag color="gold">推荐</Tag>}
                {product.is_new && <Tag color="green">新品</Tag>}
                {product.is_hot && <Tag color="red">热销</Tag>}
              </Space>
            </Space>
          }
          description={
            <Space direction="vertical" size="small" style={{ width: '100%', marginTop: '12px' }}>
              <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
                {product.summary}
              </Paragraph>
              <Row justify="space-between" align="middle">
                <Text strong style={{ color: '#f5222d', fontSize: '20px' }}>
                  ¥{product.price?.toLocaleString()}
                </Text>
                <Text type="secondary">
                  <EyeOutlined /> {product.view_count}
                </Text>
              </Row>
            </Space>
          }
        />
      </Card>
    </Col>
  );

  return (
    <div style={{ padding: '24px 50px', minHeight: '80vh' }}>
      <Breadcrumb style={{ marginBottom: '24px' }}>
        <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <HomeOutlined /> 首页
        </Breadcrumb.Item>
        <Breadcrumb.Item>产品展示</Breadcrumb.Item>
      </Breadcrumb>

      <Title level={2} style={{ marginBottom: '24px' }}>
        <ShopOutlined style={{ marginRight: '12px' }} />
        产品展示
      </Title>

      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Search
              placeholder="搜索产品名称或关键词"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
              size="large"
            />
          </Col>
          
          <Col xs={24} md={6}>
            <Select
              placeholder="排序方式"
              value={sort || undefined}
              onChange={handleSortChange}
              allowClear
              style={{ width: '100%' }}
              size="large"
            >
              <Option value="">默认排序</Option>
              <Option value="newest">最新上架</Option>
              <Option value="price-asc">价格从低到高</Option>
              <Option value="price-desc">价格从高到低</Option>
              <Option value="hot">人气最高</Option>
            </Select>
          </Col>

          <Col xs={24} md={10}>
            <Space wrap>
              <Button 
                type={isRecommended ? 'primary' : 'default'}
                onClick={() => {
                  setIsRecommended(!isRecommended);
                  setPage(1);
                }}
              >
                推荐产品
              </Button>
              <Button 
                type={isNew ? 'primary' : 'default'}
                onClick={() => {
                  setIsNew(!isNew);
                  setPage(1);
                }}
              >
                新品上市
              </Button>
              <Button 
                type={isHot ? 'primary' : 'default'}
                onClick={() => {
                  setIsHot(!isHot);
                  setPage(1);
                }}
              >
                热销产品
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {products.length > 0 ? (
        <>
          <Row gutter={[16, 16]}>
            {products.map(renderProductCard)}
          </Row>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={handlePageChange}
              showSizeChanger
              pageSizeOptions={['12', '24', '48']}
              showTotal={(total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`}
            />
          </div>
        </>
      ) : (
        <Empty 
          description="暂无产品数据"
          style={{ padding: '60px 0' }}
        />
      )}
    </div>
  );
};

export default ProductList;