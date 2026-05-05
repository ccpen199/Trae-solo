import { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Pagination,
  Input,
  Select,
  Tag,
  Typography,
  Space,
  Empty,
  Button,
  Radio,
  Slider,
} from 'antd';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShoppingOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  FireOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { apiService } from '@/services/api';
import { useUserStore } from '@/store/userStore';
import { useCartStore } from '@/store/cartStore';
import { Product, ProductCategory, ProductStatus } from '@/types';
import { message } from 'antd';

const { Title } = Typography;
const { Search } = Input;
const { Group: RadioGroup } = Radio;

const ProductPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const { addToCart } = useCartStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '12', 10);
  const categoryCode = searchParams.get('categoryCode') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const keyword = searchParams.get('keyword') || '';
  const isNew = searchParams.get('isNew') === 'true';
  const isHot = searchParams.get('isHot') === 'true';
  const isRecommend = searchParams.get('isRecommend') === 'true';

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, limit, categoryCode, sortBy, sortOrder, keyword, isNew, isHot, isRecommend]);

  const fetchCategories = async () => {
    try {
      const response = await apiService.getProductCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('获取产品分类失败:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { page, limit, sortBy, sortOrder };
      if (categoryCode) params.categoryCode = categoryCode;
      if (keyword) params.keyword = keyword;
      if (isNew) params.isNew = true;
      if (isHot) params.isHot = true;
      if (isRecommend) params.isRecommend = true;

      const response = await apiService.getProductList(params);
      setProducts(response.data || []);
      setTotal(response.pagination?.total || 0);
    } catch (error) {
      console.error('获取产品列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchParams({
      page: '1',
      limit: String(limit),
      categoryCode,
      sortBy,
      sortOrder,
      ...(value ? { keyword: value } : {}),
      ...(isNew ? { isNew: 'true' } : {}),
      ...(isHot ? { isHot: 'true' } : {}),
      ...(isRecommend ? { isRecommend: 'true' } : {}),
    });
  };

  const handleCategoryChange = (value: string) => {
    setSearchParams({
      page: '1',
      limit: String(limit),
      sortBy,
      sortOrder,
      keyword,
      ...(value ? { categoryCode: value } : {}),
      ...(isNew ? { isNew: 'true' } : {}),
      ...(isHot ? { isHot: 'true' } : {}),
      ...(isRecommend ? { isRecommend: 'true' } : {}),
    });
  };

  const handleSortChange = (e: { target: { value: string } }) => {
    const value = e.target.value;
    let newSortBy = 'createdAt';
    let newSortOrder = 'desc';

    if (value === 'price-asc') {
      newSortBy = 'price';
      newSortOrder = 'asc';
    } else if (value === 'price-desc') {
      newSortBy = 'price';
      newSortOrder = 'desc';
    } else if (value === 'sales') {
      newSortBy = 'sales';
      newSortOrder = 'desc';
    }

    setSearchParams({
      page: '1',
      limit: String(limit),
      categoryCode,
      sortBy: newSortBy,
      sortOrder: newSortOrder,
      keyword,
      ...(isNew ? { isNew: 'true' } : {}),
      ...(isHot ? { isHot: 'true' } : {}),
      ...(isRecommend ? { isRecommend: 'true' } : {}),
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({
      page: String(newPage),
      limit: String(limit),
      categoryCode,
      sortBy,
      sortOrder,
      keyword,
      ...(isNew ? { isNew: 'true' } : {}),
      ...(isHot ? { isHot: 'true' } : {}),
      ...(isRecommend ? { isRecommend: 'true' } : {}),
    });
  };

  const handleTagClick = (type: 'isNew' | 'isHot' | 'isRecommend') => {
    const params: Record<string, string> = {
      page: '1',
      limit: String(limit),
      categoryCode,
      sortBy,
      sortOrder,
      keyword,
    };

    if (type === 'isNew' && !isNew) params.isNew = 'true';
    if (type === 'isHot' && !isHot) params.isHot = 'true';
    if (type === 'isRecommend' && !isRecommend) params.isRecommend = 'true';

    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setSearchParams({
      page: '1',
      limit: String(limit),
    });
  };

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    try {
      setAddingToCart(product.id);
      await addToCart(product.id, 1);
      message.success('已添加到购物车');
    } catch (error) {
      console.error('添加购物车失败:', error);
    } finally {
      setAddingToCart(null);
    }
  };

  const getCurrentSortValue = () => {
    if (sortBy === 'price' && sortOrder === 'asc') return 'price-asc';
    if (sortBy === 'price' && sortOrder === 'desc') return 'price-desc';
    if (sortBy === 'sales') return 'sales';
    return 'default';
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '16px' }}>
          产品中心
        </Title>

        <Card style={{ marginBottom: '16px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Select
                style={{ width: '100%' }}
                placeholder="选择分类"
                allowClear
                value={categoryCode || undefined}
                onChange={handleCategoryChange}
                options={[
                  { label: '全部分类', value: '' },
                  ...categories.map((c) => ({
                    label: c.name,
                    value: c.code,
                  })),
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Search
                placeholder="搜索产品"
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                onSearch={handleSearch}
                defaultValue={keyword}
              />
            </Col>

            <Col xs={24} sm={24} md={12}>
              <Space wrap>
                <RadioGroup value={getCurrentSortValue()} onChange={handleSortChange}>
                  <Radio.Button value="default">默认排序</Radio.Button>
                  <Radio.Button value="price-asc">价格升序</Radio.Button>
                  <Radio.Button value="price-desc">价格降序</Radio.Button>
                  <Radio.Button value="sales">销量优先</Radio.Button>
                </RadioGroup>

                <Button
                  type={isNew ? 'primary' : 'default'}
                  icon={<StarOutlined />}
                  onClick={() => handleTagClick('isNew')}
                >
                  新品
                </Button>
                <Button
                  type={isHot ? 'primary' : 'default'}
                  icon={<FireOutlined />}
                  onClick={() => handleTagClick('isHot')}
                >
                  热卖
                </Button>

                {(isNew || isHot || isRecommend || keyword || categoryCode) && (
                  <Button onClick={handleClearFilters}>清除筛选</Button>
                )}
              </Space>
            </Col>
          </Row>
        </Card>
      </div>

      {products.length === 0 && !loading ? (
        <Empty description="暂无产品" style={{ padding: '60px' }} />
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {products.map((product) => (
              <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                <Link to={`/products/${product.id}`}>
                  <Card
                    hoverable
                    loading={loading}
                    cover={
                      <div
                        style={{
                          height: '200px',
                          backgroundImage: product.coverImage
                            ? `url(${product.coverImage})`
                            : `linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {!product.coverImage && (
                          <ShoppingOutlined
                            style={{ fontSize: '48px', color: 'rgba(0,0,0,0.2)' }}
                          />
                        )}
                        <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                          {product.isNew && <Tag color="green">新品</Tag>}
                          {product.isHot && <Tag color="red">热卖</Tag>}
                          {product.isRecommend && <Tag color="orange">推荐</Tag>}
                        </div>
                      </div>
                    }
                  >
                    <Card.Meta
                      title={
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '15px',
                            fontWeight: '500',
                          }}
                        >
                          {product.name}
                        </div>
                      }
                      description={
                        <div>
                          <div
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: '#666',
                              fontSize: '13px',
                              marginBottom: '8px',
                            }}
                          >
                            {product.summary || product.category?.name}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <span
                                style={{
                                  fontSize: '18px',
                                  fontWeight: 'bold',
                                  color: '#c41e3a',
                                }}
                              >
                                ¥{product.price}
                              </span>
                              {product.originalPrice && (
                                <span
                                  style={{
                                    marginLeft: '8px',
                                    fontSize: '12px',
                                    color: '#999',
                                    textDecoration: 'line-through',
                                  }}
                                >
                                  ¥{product.originalPrice}
                                </span>
                              )}
                            </div>
                            <Button
                              type="primary"
                              size="small"
                              icon={<ShoppingCartOutlined />}
                              loading={addingToCart === product.id}
                              onClick={(e) => handleAddToCart(e, product)}
                            >
                              加购
                            </Button>
                          </div>
                          {product.sales > 0 && (
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                              已售 {product.sales} 件
                            </div>
                          )}
                        </div>
                      }
                    />
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>

          {total > 0 && (
            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <Pagination
                current={page}
                pageSize={limit}
                total={total}
                showSizeChanger
                showQuickJumper
                showTotal={(total) => `共 ${total} 件商品`}
                onChange={handlePageChange}
                onShowSizeChange={(newPage, newSize) => {
                  setSearchParams({
                    page: String(newPage),
                    limit: String(newSize),
                    categoryCode,
                    sortBy,
                    sortOrder,
                    keyword,
                    ...(isNew ? { isNew: 'true' } : {}),
                    ...(isHot ? { isHot: 'true' } : {}),
                    ...(isRecommend ? { isRecommend: 'true' } : {}),
                  });
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductPage;
