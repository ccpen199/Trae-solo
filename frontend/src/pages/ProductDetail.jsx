import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Row, Col, Card, Button, Tag, Typography, Spin, Descriptions, Modal, Checkbox, Input, message } from 'antd';
import { HeartOutlined, HeartFilled, MessageOutlined, LeftOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { productApi, favoriteApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [addFavoriteModal, setAddFavoriteModal] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [addCompanyToo, setAddCompanyToo] = useState(false);
  const [adding, setAdding] = useState(false);
  const [alreadyExistsModal, setAlreadyExistsModal] = useState(false);

  const { user, setShowLoginModal } = useAuth();

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (user && product) {
      checkFavoriteStatus();
    }
  }, [user, product]);

  const loadProduct = async () => {
    try {
      const response = await productApi.getById(id);
      setProduct(response.data.product);
    } catch (error) {
      message.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const response = await favoriteApi.check('product', product.id);
      setIsFavorite(response.data.isFavorite);
    } catch (error) {
      setIsFavorite(false);
    }
  };

  const handleFavoriteClick = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (isFavorite) {
      setAlreadyExistsModal(true);
      return;
    }

    setAddFavoriteModal(true);
  };

  const handleAddFavorite = async () => {
    if (!product) return;

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
      const response = await favoriteApi.add({
        object_type: 'product',
        object_id: product.id,
        object_data: product,
        tags: tags.length > 0 ? tags : undefined,
        source_page: window.location.pathname,
      });

      if (response.data.alreadyExists) {
        setIsFavorite(true);
        setAddFavoriteModal(false);
        setAlreadyExistsModal(true);
        return;
      }

      if (addCompanyToo && product.company_id) {
        await favoriteApi.add({
          object_type: 'company',
          object_id: product.company_id,
          object_data: {
            id: product.company_id,
            name: product.company_name,
            country: product.country,
          },
          source_page: window.location.pathname,
        });
      }

      message.success('Added to favorites successfully!');
      setIsFavorite(true);
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

  if (!product) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Title level={4}>Product not found</Title>
        <Link to="/products"><Button>Back to Products</Button></Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <Link to="/products" style={{ display: 'inline-block', marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />}>Back to Products</Button>
      </Link>

      <Row gutter={24}>
        <Col xs={24} md={10}>
          <Card>
            <img
              alt={product.title}
              src={product.image_url}
              style={{ width: '100%', maxHeight: 400, objectFit: 'contain' }}
            />
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card>
            <Title level={2}>{product.title}</Title>

            <div style={{ marginBottom: 24 }}>
              <Title level={3} style={{ color: '#ff4d4f', marginBottom: 4 }}>
                ${product.fob_price_min} - ${product.fob_price_max} / {product.moq_unit}
              </Title>
              <Text type="secondary">FOB Price</Text>
            </div>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Minimum Order">
                {product.min_order_quantity} {product.moq_unit}
              </Descriptions.Item>
              <Descriptions.Item label="Supplier">
                <Link to={`/companies/${product.company_id}`}>
                  {product.company_name}
                </Link>
              </Descriptions.Item>
              <Descriptions.Item label="Country">
                <Tag color="blue">{product.country}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Category">
                <Tag>{product.category}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Supplier Status">
                <Tag color={product.online_status === 'online' ? 'green' : 'default'}>
                  <MessageOutlined style={{ marginRight: 4 }} />
                  {product.online_status === 'online' ? 'Online - Contact Now' : 'Offline - Leave Message'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <Button
                type={isFavorite ? 'default' : 'primary'}
                icon={isFavorite ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                size="large"
                onClick={handleFavoriteClick}
                style={isFavorite ? { color: '#ff4d4f', borderColor: '#ff4d4f' } : {}}
              >
                {isFavorite ? 'Added to Favorites' : 'Add to Favorites'}
              </Button>

              <Button
                type="primary"
                size="large"
                style={{ background: product.online_status === 'online' ? '#52c41a' : undefined }}
                disabled={product.online_status !== 'online'}
              >
                <MessageOutlined /> {product.online_status === 'online' ? 'Contact Supplier' : 'Supplier Offline'}
              </Button>
            </div>
          </Card>
        </Col>
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
        <div style={{ marginBottom: 16 }}>
          <Text strong>{product.title}</Text>
          <p style={{ margin: '8px 0', color: '#666' }}>
            {product.company_name} - {product.country}
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
          Also add supplier <strong>{product.company_name}</strong> to company favorites
        </Checkbox>
      </Modal>

      <Modal
        title="Already in Favorites"
        open={alreadyExistsModal}
        onOk={() => setAlreadyExistsModal(false)}
        onCancel={() => setAlreadyExistsModal(false)}
        footer={[
          <Button key="close" onClick={() => setAlreadyExistsModal(false)}>
            Close
          </Button>,
          <Link key="favorites" to="/favorites">
            <Button type="primary" onClick={() => setAlreadyExistsModal(false)}>
              View My Favorites
            </Button>
          </Link>,
        ]}
      >
        <p>This product is already in your favorites.</p>
        <p>You can manage your favorites in the "My Favorites" page.</p>
      </Modal>
    </div>
  );
};

export default ProductDetail;
