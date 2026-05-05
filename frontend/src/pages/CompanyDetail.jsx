import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Row, Col, Card, Button, Tag, Typography, Spin, Descriptions, Modal, Input, message, List } from 'antd';
import { HeartOutlined, HeartFilled, MessageOutlined, ArrowLeftOutlined, ShopOutlined } from '@ant-design/icons';
import { companyApi, favoriteApi, productApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const CompanyDetail = () => {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [addFavoriteModal, setAddFavoriteModal] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [alreadyExistsModal, setAlreadyExistsModal] = useState(false);

  const { user, setShowLoginModal } = useAuth();

  useEffect(() => {
    loadCompany();
  }, [id]);

  useEffect(() => {
    if (user && company) {
      checkFavoriteStatus();
    }
  }, [user, company]);

  const loadCompany = async () => {
    try {
      const [companyResponse, productsResponse] = await Promise.all([
        companyApi.getById(id),
        productApi.getAll({}),
      ]);
      setCompany(companyResponse.data.company);
      setProducts(productsResponse.data.products.filter(p => p.company_id === id));
    } catch (error) {
      message.error('Failed to load company');
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const response = await favoriteApi.check('company', company.id);
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
    if (!company) return;

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
        object_type: 'company',
        object_id: company.id,
        object_data: company,
        tags: tags.length > 0 ? tags : undefined,
        source_page: window.location.pathname,
      });

      if (response.data.alreadyExists) {
        setIsFavorite(true);
        setAddFavoriteModal(false);
        setAlreadyExistsModal(true);
        return;
      }

      message.success('Added to favorites successfully!');
      setIsFavorite(true);
      setAddFavoriteModal(false);
      setTagInput('');
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

  if (!company) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Title level={4}>Company not found</Title>
        <Link to="/companies"><Button>Back to Suppliers</Button></Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <Link to="/companies" style={{ display: 'inline-block', marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />}>Back to Suppliers</Button>
      </Link>

      <Row gutter={24}>
        <Col xs={24}>
          <Card>
            <Row gutter={16} align="middle">
              <Col style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: 80, 
                  height: 80, 
                  background: '#e6f7ff', 
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MessageOutlined style={{ fontSize: 40, color: '#1890ff' }} />
                </div>
              </Col>
              <Col flex="1">
                <Title level={2} style={{ margin: 0 }}>
                  {company.name}
                  <Tag 
                    color={company.online_status === 'online' ? 'green' : 'default'}
                    style={{ marginLeft: 12, fontSize: 14 }}
                  >
                    {company.online_status === 'online' ? 'Online' : 'Offline'}
                  </Tag>
                </Title>
                <div style={{ marginTop: 8 }}>
                  <Tag color="blue">{company.country}</Tag>
                  <Tag style={{ marginLeft: 4 }}>{company.business_type}</Tag>
                  <Tag style={{ marginLeft: 4 }}>Est. {company.established_year}</Tag>
                </div>
              </Col>
              <Col>
                <Space>
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
                    style={{ background: company.online_status === 'online' ? '#52c41a' : undefined }}
                    disabled={company.online_status !== 'online'}
                  >
                    <MessageOutlined /> {company.online_status === 'online' ? 'Contact Now' : 'Leave Message'}
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col xs={24} md={16}>
          <Card title="About This Supplier">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Products & Services">
                {company.product_service}
              </Descriptions.Item>
              <Descriptions.Item label="Business Type">
                {company.business_type}
              </Descriptions.Item>
              <Descriptions.Item label="Country">
                {company.country}
              </Descriptions.Item>
              <Descriptions.Item label="Established">
                {company.established_year}
              </Descriptions.Item>
              <Descriptions.Item label="Employee Count">
                {company.employee_count}
              </Descriptions.Item>
              <Descriptions.Item label="Annual Revenue">
                {company.annual_revenue}
              </Descriptions.Item>
              <Descriptions.Item label="Main Products">
                {company.main_products?.map((p, i) => (
                  <Tag key={i}>{p}</Tag>
                ))}
              </Descriptions.Item>
              <Descriptions.Item label="Certifications">
                {company.certification?.map((c, i) => (
                  <Tag color="purple" key={i}>{c}</Tag>
                ))}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {products.length > 0 && (
            <Card 
              title={
                <span>
                  <ShopOutlined style={{ marginRight: 8 }} />
                  Products from this Supplier ({products.length})
                </span>
              }
              style={{ marginTop: 24 }}
            >
              <List
                grid={{ gutter: 16, column: 2 }}
                dataSource={products}
                renderItem={(product) => (
                  <List.Item>
                    <Card 
                      hoverable
                      cover={
                        <img
                          alt={product.title}
                          src={product.image_url}
                          style={{ height: 150, objectFit: 'cover' }}
                        />
                      }
                    >
                      <Card.Meta
                        title={<Link to={`/products/${product.id}`}>{product.title}</Link>}
                        description={
                          <div>
                            <Text strong style={{ color: '#ff4d4f' }}>
                              ${product.fob_price_min} - ${product.fob_price_max}
                            </Text>
                            <br />
                            <Text type="secondary">MOQ: {product.min_order_quantity}</Text>
                          </div>
                        }
                      />
                    </Card>
                  </List.Item>
                )}
              />
            </Card>
          )}
        </Col>

        <Col xs={24} md={8}>
          <Card title="Quick Stats">
            <List>
              <List.Item>
                <Text type="secondary">Status</Text>
                <Tag color={company.online_status === 'online' ? 'green' : 'default'}>
                  {company.online_status === 'online' ? 'Online' : 'Offline'}
                </Tag>
              </List.Item>
              <List.Item>
                <Text type="secondary">Products Available</Text>
                <Text strong>{products.length}</Text>
              </List.Item>
              <List.Item>
                <Text type="secondary">In Favorites</Text>
                <Text strong style={{ color: isFavorite ? '#ff4d4f' : '#666' }}>
                  {isFavorite ? 'Yes' : 'No'}
                </Text>
              </List.Item>
            </List>
          </Card>
        </Col>
      </Row>

      <Modal
        title="Add Supplier to Favorites"
        open={addFavoriteModal}
        onOk={handleAddFavorite}
        onCancel={() => {
          setAddFavoriteModal(false);
          setTagInput('');
        }}
        confirmLoading={adding}
        okText="Add"
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>{company.name}</Text>
          <p style={{ margin: '8px 0', color: '#666' }}>
            {company.country} - {company.business_type}
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Tags (up to 3, separate with comma)
          </Text>
          <Input
            placeholder="e.g., reliable, electronics, china"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
          />
          {tagInput.split(/[,，]/).filter(t => t.trim()).length > 3 && (
            <Text type="danger" style={{ fontSize: 12 }}>
              Maximum 3 tags allowed
            </Text>
          )}
        </div>
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
        <p>This supplier is already in your favorites.</p>
        <p>You can manage your favorites in the "My Favorites" page.</p>
      </Modal>
    </div>
  );
};

export default CompanyDetail;
