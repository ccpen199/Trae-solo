import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Row, 
  Col, 
  Typography, 
  Card, 
  Button, 
  Space, 
  Tag,
  Breadcrumb,
  Descriptions,
  Divider,
  Image
} from 'antd';
import { 
  HomeOutlined, 
  ShopOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import { productService } from '../services/productService';

const { Title, Text, Paragraph } = Typography;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProductDetail();
  }, [id]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      const result = await productService.getProductById(id);
      setProduct(result.data);
    } catch (error) {
      console.error('获取产品详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!product && !loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Title level={3}>产品不存在</Title>
        <Button onClick={() => navigate('/products')}>返回产品列表</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 50px', minHeight: '80vh' }}>
      <Breadcrumb style={{ marginBottom: '24px' }}>
        <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <HomeOutlined /> 首页
        </Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate('/products')} style={{ cursor: 'pointer' }}>
          产品展示
        </Breadcrumb.Item>
        <Breadcrumb.Item>{product?.title}</Breadcrumb.Item>
      </Breadcrumb>

      <Card loading={loading}>
        <Row gutter={[32, 32]}>
          <Col xs={24} md={10}>
            <div style={{ 
              background: '#f0f0f0',
              minHeight: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px'
            }}>
              <ShopOutlined style={{ fontSize: '120px', color: '#ccc' }} />
            </div>
          </Col>

          <Col xs={24} md={14}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Space wrap>
                  {product?.is_recommended && <Tag color="gold">推荐产品</Tag>}
                  {product?.is_new && <Tag color="green">新品上市</Tag>}
                  {product?.is_hot && <Tag color="red">热销产品</Tag>}
                </Space>
              </div>

              <Title level={2} style={{ margin: 0 }}>
                {product?.title}
              </Title>

              {product?.code && (
                <Text type="secondary">产品编号：{product.code}</Text>
              )}

              <Paragraph type="secondary" style={{ fontSize: '16px' }}>
                {product?.summary}
              </Paragraph>

              <div style={{ 
                background: '#fff7e6', 
                padding: '16px 24px',
                borderRadius: '8px'
              }}>
                <Row align="middle" gutter={16}>
                  <Col>
                    <Text type="secondary">价格：</Text>
                  </Col>
                  <Col>
                    <Text strong style={{ color: '#f5222d', fontSize: '32px' }}>
                      ¥{product?.price?.toLocaleString()}
                    </Text>
                  </Col>
                  {product?.original_price && (
                    <Col>
                      <Text delete type="secondary">
                        ¥{product.original_price.toLocaleString()}
                      </Text>
                    </Col>
                  )}
                </Row>
              </div>

              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="库存">
                  {product?.stock || 0} {product?.unit || '件'}
                </Descriptions.Item>
                <Descriptions.Item label="浏览次数">
                  <EyeOutlined /> {product?.view_count || 0}
                </Descriptions.Item>
                {product?.category?.name && (
                  <Descriptions.Item label="产品分类" span={2}>
                    {product.category.name}
                  </Descriptions.Item>
                )}
              </Descriptions>

              {product?.keywords && (
                <div>
                  <Text type="secondary">关键词：</Text>
                  <Space wrap style={{ marginLeft: '8px' }}>
                    {product.keywords.split(',').map((keyword, index) => (
                      <Tag key={index}>{keyword.trim()}</Tag>
                    ))}
                  </Space>
                </div>
              )}

              <Space size="middle">
                <Button 
                  type="primary" 
                  size="large"
                  icon={<ShoppingCartOutlined />}
                >
                  立即咨询
                </Button>
                <Button 
                  size="large"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate('/products')}
                >
                  返回列表
                </Button>
              </Space>
            </Space>
          </Col>
        </Row>

        <Divider />

        {product?.description && (
          <div>
            <Title level={4}>产品详情</Title>
            <div style={{ lineHeight: '2', fontSize: '16px' }}>
              {product.description}
            </div>
          </div>
        )}

        {product?.specifications && Object.keys(product.specifications).length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <Title level={4}>规格参数</Title>
            <Descriptions bordered column={1} size="middle">
              {Object.entries(product.specifications).map(([key, value], index) => (
                <Descriptions.Item key={index} label={key}>
                  {value}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProductDetail;