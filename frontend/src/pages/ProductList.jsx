import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Tag, Typography, Spin, Space, message, Modal, Checkbox, Input } from 'antd';
import { HeartOutlined, HeartFilled, MessageOutlined, EyeOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { productApi, favoriteApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Search } = Input;

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteStates, setFavoriteStates] = useState({});
  const [addFavoriteModal, setAddFavoriteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [addCompanyToo, setAddCompanyToo] = useState(false);
  const [adding, setAdding] = useState(false);
  
  const { user, requireAuth, setShowLoginModal } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (user && products.length > 0) {
      checkFavoriteStates();
    }
  }, [user, products]);

  const loadProducts = async () => {
    try {
      const response = await productApi.getAll();
      setProducts(response.data.products);
    } catch (error) {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStates = async () => {
    const states = {};
    for (const product of products) {
      try {
        const response = await favoriteApi.check('product', product.id);
        states[product.id] = response.data.isFavorite;
      } catch (error) {
        states[product.id] = false;
      }
    }
    setFavoriteStates(states);
  };

  const handleFavoriteClick = (product) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (favoriteStates[product.id]) {
      message.info('Already in favorites. Go to My Favorites to manage.');
      return;
    }

    setSelectedProduct(product);
    setAddFavoriteModal(true);
  };

  const handleAddFavorite = async () => {
    if (!selectedProduct) return;

    const tags = tagInput
      .split(/[,，]/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (tags.length > 3) {
      message.error('Maximum 3 tags allowed');
      return;
    }

    setAdding(true);
    try {
      const productResponse = await favoriteApi.add({
        object_type: 'product',
        object_id: selectedProduct.id,
        object_data: selectedProduct,
        tags: tags.length > 0 ? tags : undefined,
        source_page: window.location.pathname,
      });

      if (addCompanyToo && selectedProduct.company_id) {
        await favoriteApi.add({
          object_type: 'company',
          object_id: selectedProduct.company_id,
          object_data: {
            id: selectedProduct.company_id,
            name: selectedProduct.company_name,
            country: selectedProduct.country,
          },
          source_page: window.location.pathname,
        });
      }

      message.success('Added to favorites successfully!');
      setFavoriteStates(prev => ({ ...prev, [selectedProduct.id]: true }));
      setAddFavoriteModal(false);
      setTagInput('');
      setAddCompanyToo(false);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to add favorite';
      message.error(errorMsg);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <Title level={2}>Products</Title>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {products.map(product => (
          <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
            <Card
              hoverable
              cover={
                <img
                  alt={product.title}
                  src={product.image_url}
                  style={{ height: 200, objectFit: 'cover' }}
                />
              }
              actions={[
                <Button
                  type="text"
                  icon={favoriteStates[product.id] ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                  onClick={() => handleFavoriteClick(product)}
                  style={{ color: favoriteStates[product.id] ? '#ff4d4f' : undefined }}
                >
                  {favoriteStates[product.id] ? 'Favorited' : 'Favorite'}
                </Button>,
                <Link to={`/products/${product.id}`}>
                  <Button type="text" icon={<EyeOutlined />}>
                    View
                  </Button>
                </Link>,
              ]}
            >
              <Card.Meta
                title={
                  <div style={{ fontSize: 14, fontWeight: 600, minHeight: 48, lineHeight: 1.4 }}>
                    {product.title}
                  </div>
                }
                description={
                  <div style={{ marginTop: 8 }}>
                    <div style={{ marginBottom: 4 }}>
                      <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>
                        ${product.fob_price_min} - ${product.fob_price_max}
                      </Text>
                      <Text type="secondary" style={{ marginLeft: 4 }}>/ {product.moq_unit}</Text>
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <Text type="secondary">MOQ: {product.min_order_quantity} {product.moq_unit}</Text>
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <Tag color={product.online_status === 'online' ? 'green' : 'default'}>
                        <MessageOutlined style={{ marginRight: 4 }} />
                        {product.online_status === 'online' ? 'Contact Now' : 'Leave Message'}
                      </Tag>
                    </div>
                    <div>
                      <Text type="secondary">{product.company_name}</Text>
                      <br />
                      <Tag color="blue">{product.country}</Tag>
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title="Add to Favorites"
        open={addFavoriteModal}
        onOk={handleAddFavorite}
        onCancel={() => {
          setAddFavoriteModal(false);
          setTagInput('');
          setAddCompanyToo(false);
        }}
        confirmLoading={adding}
        okText="Add"
      >
        {selectedProduct && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>{selectedProduct.title}</Text>
              <p style={{ margin: '8px 0', color: '#666' }}>
                {selectedProduct.company_name} - {selectedProduct.country}
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Tags (up to 3, separate with comma)
              </Text>
              <Input
                placeholder="e.g., electronics, cheap, sample"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
              />
              {tagInput.split(/[,，]/).filter(t => t.trim()).length > 3 && (
                <Text type="danger" style={{ fontSize: 12 }}>
                  Maximum 3 tags allowed
                </Text>
              )}
            </div>

            <Checkbox
              checked={addCompanyToo}
              onChange={(e) => setAddCompanyToo(e.target.checked)}
            >
              Also add supplier to company favorites
            </Checkbox>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductList;
