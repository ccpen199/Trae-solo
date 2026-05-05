import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Button,
  InputNumber,
  Tag,
  Typography,
  Space,
  Tabs,
  Divider,
  message,
  Spin,
  Empty,
} from 'antd';
import {
  ShoppingCartOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  FireOutlined,
  StarOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { apiService } from '@/services/api';
import { useUserStore } from '@/store/userStore';
import { useCartStore } from '@/store/cartStore';
import { Product, ProductSpec } from '@/types';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const { addToCart } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProductDetail();
    }
  }, [id]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProductDetail(id!);
      setProduct(response.data);
    } catch (error) {
      console.error('获取产品详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(id!, quantity, selectedSpec || undefined);
      message.success('已添加到购物车');
    } catch (error) {
      console.error('添加购物车失败:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    message.info('立即购买功能开发中');
  };

  const getDisplayPrice = () => {
    if (selectedSpec && product?.productSpecs) {
      const spec = product.productSpecs.find((s) => s.id === selectedSpec);
      return spec?.price || product.price;
    }
    return product?.price || 0;
  };

  const getDisplayStock = () => {
    if (selectedSpec && product?.productSpecs) {
      const spec = product.productSpecs.find((s) => s.id === selectedSpec);
      return spec?.stock || product.stock;
    }
    return product?.stock || 0;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: '100px' }}>
        <Empty description="产品不存在或已下架" />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'description',
      label: '产品详情',
      children: (
        <div style={{ padding: '16px' }}>
          {product.description ? (
            <div
              dangerouslySetInnerHTML={{ __html: product.description }}
              style={{ lineHeight: '2', fontSize: '15px' }}
            />
          ) : (
            <Empty description="暂无产品详情" />
          )}
        </div>
      ),
    },
    {
      key: 'culture',
      label: '产品文化',
      children: (
        <div style={{ padding: '16px' }}>
          {product.cultureContent ? (
            <div
              dangerouslySetInnerHTML={{ __html: product.cultureContent }}
              style={{ lineHeight: '2', fontSize: '15px' }}
            />
          ) : (
            <Empty description="暂无产品文化介绍" />
          )}
        </div>
      ),
    },
    {
      key: 'plan',
      label: '发展规划',
      children: (
        <div style={{ padding: '16px' }}>
          {product.planContent ? (
            <div
              dangerouslySetInnerHTML={{ __html: product.planContent }}
              style={{ lineHeight: '2', fontSize: '15px' }}
            />
          ) : (
            <Empty description="暂无发展规划" />
          )}
        </div>
      ),
    },
    {
      key: 'activity',
      label: '市场活动',
      children: (
        <div style={{ padding: '16px' }}>
          {product.activityContent ? (
            <div
              dangerouslySetInnerHTML={{ __html: product.activityContent }}
              style={{ lineHeight: '2', fontSize: '15px' }}
            />
          ) : (
            <Empty description="暂无市场活动" />
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/products')}
        style={{ marginBottom: '16px' }}
      >
        返回产品列表
      </Button>

      <Card>
        <Row gutter={[32, 32]}>
          <Col xs={24} md={10}>
            <div
              style={{
                width: '100%',
                paddingTop: '100%',
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundImage: product.coverImage
                  ? `url(${product.coverImage})`
                  : `linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!product.coverImage && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '80px',
                    color: 'rgba(0,0,0,0.1)',
                  }}
                >
                  产品图片
                </div>
              )}
            </div>

            {product.images && (
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                {JSON.parse(product.images).slice(0, 4).map((img: string, index: number) => (
                  <div
                    key={index}
                    style={{
                      width: '80px',
                      height: '80px',
                      backgroundImage: `url(${img})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: '4px',
                      border: '2px solid transparent',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            )}
          </Col>

          <Col xs={24} md={14}>
            <div>
              <div style={{ marginBottom: '8px' }}>
                {product.isNew && (
                  <Tag color="green" style={{ marginRight: '8px' }}>
                    <StarOutlined /> 新品
                  </Tag>
                )}
                {product.isHot && (
                  <Tag color="red" style={{ marginRight: '8px' }}>
                    <FireOutlined /> 热卖
                  </Tag>
                )}
                {product.isRecommend && (
                  <Tag color="orange" style={{ marginRight: '8px' }}>
                    推荐
                  </Tag>
                )}
                {product.category && (
                  <Tag color="blue">{product.category.name}</Tag>
                )}
              </div>

              <Title level={2} style={{ marginBottom: '12px' }}>
                {product.name}
              </Title>

              {product.summary && (
                <Paragraph type="secondary" style={{ fontSize: '14px', marginBottom: '24px' }}>
                  {product.summary}
                </Paragraph>
              )}

              <Divider />

              <div style={{ marginBottom: '24px' }}>
                <Space align="end" size="middle">
                  <Text type="secondary">价格</Text>
                  <Text strong style={{ fontSize: '28px', color: '#c41e3a' }}>
                    ¥{getDisplayPrice().toFixed(2)}
                  </Text>
                  {product.originalPrice && (
                    <Text
                      delete
                      style={{ fontSize: '14px', color: '#999' }}
                    >
                      ¥{product.originalPrice.toFixed(2)}
                    </Text>
                  )}
                </Space>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <Space size="middle">
                  <Text type="secondary">
                    <EyeOutlined style={{ marginRight: '4px' }} />
                    浏览 {product.sales + 1000}+
                  </Text>
                  <Text type="secondary">
                    销量 {product.sales}+
                  </Text>
                  <Text type="secondary">
                    库存 {getDisplayStock()} 件
                  </Text>
                </Space>
              </div>

              {product.productSpecs && product.productSpecs.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <Text type="secondary" style={{ marginBottom: '8px', display: 'block' }}>
                    规格选择
                  </Text>
                  <Space wrap size="small">
                    {product.productSpecs.map((spec: ProductSpec) => (
                      <Tag.CheckableTag
                        key={spec.id}
                        checked={selectedSpec === spec.id}
                        onChange={(checked) => setSelectedSpec(checked ? spec.id : null)}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                        }}
                      >
                        <div>{spec.name}</div>
                        <div style={{ fontSize: '12px', color: '#c41e3a', marginTop: '4px' }}>
                          ¥{spec.price.toFixed(2)}
                        </div>
                      </Tag.CheckableTag>
                    ))}
                  </Space>
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <Text type="secondary" style={{ marginRight: '16px' }}>
                  数量
                </Text>
                <InputNumber
                  min={1}
                  max={Math.min(getDisplayStock(), 99)}
                  value={quantity}
                  onChange={(value) => setQuantity(value || 1)}
                  size="large"
                />
                <Text type="secondary" style={{ marginLeft: '16px' }}>
                  库存 {getDisplayStock()} 件
                </Text>
              </div>

              <Divider />

              <Space size="middle" wrap>
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  onClick={handleAddToCart}
                  loading={addingToCart}
                  style={{ minWidth: '140px' }}
                >
                  加入购物车
                </Button>
                <Button
                  size="large"
                  onClick={handleBuyNow}
                  style={{ minWidth: '140px' }}
                >
                  立即购买
                </Button>
                <Button
                  size="large"
                  icon={<ShareAltOutlined />}
                  onClick={() => message.info('分享功能开发中')}
                >
                  分享
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginTop: '24px' }}>
        <Tabs defaultActiveKey="description" items={tabItems} />
      </Card>

      {product.videoUrl && (
        <Card title="产品视频" style={{ marginTop: '24px' }}>
          <video
            src={product.videoUrl}
            controls
            style={{ width: '100%', maxWidth: '800px', display: 'block', margin: '0 auto' }}
          />
        </Card>
      )}
    </div>
  );
};

export default ProductDetailPage;
