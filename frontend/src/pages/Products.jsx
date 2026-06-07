import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Input, Select, Pagination, Tag, Empty, Space, Button, Divider, Badge, Statistic } from 'antd';
import { SearchOutlined, ShopOutlined, FireOutlined, GiftOutlined, StarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';

const { Option } = Select;

function Products() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchText, setSearchText] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, limited: 0, lowStock: 0 });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page, category, searchText]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('加载分类失败', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (category) params.category = category;
      if (searchText) params.search = searchText;
      
      const response = await api.get('/products', { params });
      setProducts(response.data.products);
      setTotal(response.data.total);
      
      const limitedCount = response.data.products.filter(p => p.is_limited).length;
      const lowStockCount = response.data.products.filter(p => p.stock < 100).length;
      setStats({
        total: response.data.total,
        limited: limitedCount,
        lowStock: lowStockCount
      });
    } catch (error) {
      console.error('加载商品失败', error);
    }
    setLoading(false);
  };

  const handleCategoryChange = (value) => {
    setCategory(value);
    setPage(1);
    if (value) {
      setSearchParams({ category: value });
    } else {
      setSearchParams({});
    }
  };

  const handleTagClick = (catId) => {
    handleCategoryChange(catId === category ? '' : catId);
  };

  const handleSearch = () => {
    setPage(1);
    loadProducts();
  };

  const getCategoryIcon = (catId) => {
    const icons = {
      stamp: <StarOutlined />,
      newspaper: <GiftOutlined />,
      postcard: <ShopOutlined />,
      culture: <FireOutlined />,
      magazine: <ClockCircleOutlined />
    };
    return icons[catId] || <ShopOutlined />;
  };

  const getCategoryColor = (catId) => {
    const colors = {
      stamp: '#f5222d',
      newspaper: '#1890ff',
      postcard: '#52c41a',
      culture: '#722ed1',
      magazine: '#fa8c16'
    };
    return colors[catId] || '#1890ff';
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>邮品商城</h1>
        <p style={{ color: '#666' }}>精选集邮票品、报刊杂志、定制文创等邮政特色产品</p>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
          <Col span={24}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Space size={[8, 8]} wrap>
                  <Tag.CheckableTag
                    checked={!category}
                    onChange={() => handleCategoryChange('')}
                    style={{ fontSize: 14, padding: '4px 16px', borderRadius: 16 }}
                  >
                    全部商品
                  </Tag.CheckableTag>
                  {categories.map((cat) => (
                    <Tag.CheckableTag
                      key={cat.id}
                      checked={category === cat.id}
                      onChange={() => handleTagClick(cat.id)}
                      style={{ 
                        fontSize: 14, 
                        padding: '4px 16px', 
                        borderRadius: 16,
                        color: category === cat.id ? 'white' : getCategoryColor(cat.id),
                        background: category === cat.id ? getCategoryColor(cat.id) : undefined
                      }}
                    >
                      <Space size={4}>
                        {getCategoryIcon(cat.id)}
                        {cat.name}
                      </Space>
                    </Tag.CheckableTag>
                  ))}
                </Space>
              </div>

              <Row gutter={16}>
                <Col span={16}>
                  <Input.Search
                    placeholder="搜索商品名称、描述..."
                    size="large"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onSearch={handleSearch}
                    enterButton={<Button type="primary" size="large" icon={<SearchOutlined />}>搜索</Button>}
                  />
                </Col>
                <Col span={8}>
                  <Select
                    placeholder="高级筛选"
                    style={{ width: '100%' }}
                    size="large"
                    allowClear
                  >
                    <Option value="limited">仅显示限量商品</Option>
                    <Option value="lowStock">库存紧张</Option>
                    <Option value="preorder">预售商品</Option>
                  </Select>
                </Col>
              </Row>
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0' }} />

        <Row gutter={16}>
          <Col span={8}>
            <Card size="small">
              <Statistic 
                title="当前分类商品" 
                value={stats.total} 
                suffix="件"
                prefix={<ShopOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic 
                title="限量发售" 
                value={stats.limited} 
                suffix="件"
                valueStyle={{ color: '#f5222d' }}
                prefix={<StarOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic 
                title="库存紧张" 
                value={stats.lowStock} 
                suffix="件"
                valueStyle={{ color: '#fa8c16' }}
                prefix={<FireOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {loading ? (
        <Row gutter={[16, 16]}>
          {[1,2,3,4,5,6,7,8].map(i => (
            <Col span={6} key={i}>
              <Card loading style={{ height: 320 }} />
            </Col>
          ))}
        </Row>
      ) : products.length > 0 ? (
        <>
          <Row gutter={[16, 16]}>
            {products.map((product) => (
              <Col span={6} key={product.id}>
                <Link to={`/products/${product.id}`}>
                  <Badge.Ribbon 
                    text={product.is_limited ? '限量' : ''} 
                    color="red"
                    style={{ display: product.is_limited ? 'block' : 'none' }}
                  >
                    <Card
                      hoverable
                      style={{ height: 320 }}
                      cover={
                        <div style={{ 
                          height: 160, 
                          background: product.is_limited ? 
                            'linear-gradient(135deg, #fff1f0 0%, #ffa39e 100%)' : 
                            '#f5f5f5', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          position: 'relative'
                        }}>
                          <ShopOutlined style={{ fontSize: 64, color: product.is_limited ? '#f5222d' : '#ccc' }} />
                          {product.stock < 50 && (
                            <Tag color="orange" style={{ position: 'absolute', top: 8, right: 8 }}>
                              <FireOutlined /> 即将售罄
                            </Tag>
                          )}
                        </div>
                      }
                    >
                      <Card.Meta
                        title={
                          <div style={{ fontSize: 15, fontWeight: 500, height: 42, overflow: 'hidden' }}>
                            {product.name}
                          </div>
                        }
                        description={
                          <div>
                            <div style={{ 
                              color: '#666', 
                              fontSize: 12, 
                              marginBottom: 8,
                              height: 32,
                              overflow: 'hidden'
                            }}>
                              {product.description}
                            </div>
                            <Space direction="vertical" size={4} style={{ width: '100%' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#ff4d4f', fontSize: 20, fontWeight: 'bold' }}>
                                  ¥{product.price}
                                </span>
                                <Tag color={getCategoryColor(product.category)} style={{ margin: 0 }}>
                                  {categories.find(c => c.id === product.category)?.name}
                                </Tag>
                              </div>
                              <Space size={4} wrap>
                                {product.is_limited && (
                                  <Tag color="red" icon={<StarOutlined />}>限量发售</Tag>
                                )}
                                {product.serial_number && (
                                  <Tag color="purple">编号可查</Tag>
                                )}
                                {product.stock < 100 && product.stock > 0 && (
                                  <Tag color="orange">仅剩{product.stock}件</Tag>
                                )}
                                {product.stock === 0 && (
                                  <Tag color="default">已售罄</Tag>
                                )}
                              </Space>
                            </Space>
                          </div>
                        }
                      />
                    </Card>
                  </Badge.Ribbon>
                </Link>
              </Col>
            ))}
          </Row>

          {total > 12 && (
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Pagination
                current={page}
                total={total}
                pageSize={12}
                onChange={setPage}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total) => `共 ${total} 件商品`}
              />
            </div>
          )}
        </>
      ) : (
        <Card>
          <Empty 
            description={
              <div>
                <p>暂无符合条件的商品</p>
                <Button type="link" onClick={() => { setCategory(''); setSearchText(''); setPage(1); }}>
                  查看全部商品
                </Button>
              </div>
            }
          />
        </Card>
      )}
    </div>
  );
}

export default Products;
