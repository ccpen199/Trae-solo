import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Tag, Typography, Spin, message, Modal, Input, Checkbox } from 'antd';
import { HeartOutlined, HeartFilled, TeamOutlined, EyeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { companyApi, favoriteApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const CompanyList = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteStates, setFavoriteStates] = useState({});
  const [addFavoriteModal, setAddFavoriteModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [adding, setAdding] = useState(false);
  
  const { user, setShowLoginModal } = useAuth();

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (user && companies.length > 0) {
      checkFavoriteStates();
    }
  }, [user, companies]);

  const loadCompanies = async () => {
    try {
      const response = await companyApi.getAll();
      setCompanies(response.data.companies);
    } catch (error) {
      message.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStates = async () => {
    const states = {};
    for (const company of companies) {
      try {
        const response = await favoriteApi.check('company', company.id);
        states[company.id] = response.data.isFavorite;
      } catch (error) {
        states[company.id] = false;
      }
    }
    setFavoriteStates(states);
  };

  const handleFavoriteClick = (company) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (favoriteStates[company.id]) {
      message.info('Already in favorites. Go to My Favorites to manage.');
      return;
    }

    setSelectedCompany(company);
    setAddFavoriteModal(true);
  };

  const handleAddFavorite = async () => {
    if (!selectedCompany) return;

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
      await favoriteApi.add({
        object_type: 'company',
        object_id: selectedCompany.id,
        object_data: selectedCompany,
        tags: tags.length > 0 ? tags : undefined,
        source_page: window.location.pathname,
      });

      message.success('Added to favorites successfully!');
      setFavoriteStates(prev => ({ ...prev, [selectedCompany.id]: true }));
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

  return (
    <div style={{ padding: '24px 0' }}>
      <Title level={2}>Suppliers</Title>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {companies.map(company => (
          <Col xs={24} sm={12} md={8} key={company.id}>
            <Card
              hoverable
              actions={[
                <Button
                  type="text"
                  icon={favoriteStates[company.id] ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                  onClick={() => handleFavoriteClick(company)}
                  style={{ color: favoriteStates[company.id] ? '#ff4d4f' : undefined }}
                >
                  {favoriteStates[company.id] ? 'Favorited' : 'Favorite'}
                </Button>,
                <Link to={`/companies/${company.id}`}>
                  <Button type="text" icon={<EyeOutlined />}>
                    View
                  </Button>
                </Link>,
              ]}
            >
              <Card.Meta
                avatar={<TeamOutlined style={{ fontSize: 48, color: '#1890ff' }} />}
                title={
                  <div style={{ fontSize: 16, fontWeight: 600 }}>
                    {company.name}
                    <Tag 
                      color={company.online_status === 'online' ? 'green' : 'default'}
                      style={{ marginLeft: 8 }}
                    >
                      {company.online_status === 'online' ? 'Online' : 'Offline'}
                    </Tag>
                  </div>
                }
                description={
                  <div style={{ marginTop: 12 }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>Products & Services:</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {company.product_service}
                      </Text>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>Country:</Text>
                      <Tag color="blue" style={{ marginLeft: 8 }}>
                        {company.country}
                      </Tag>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>Business Type:</Text>
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        {company.business_type}
                      </Text>
                    </div>
                    <div>
                      <Text strong>Main Products:</Text>
                      <div style={{ marginTop: 4 }}>
                        {company.main_products?.map((p, i) => (
                          <Tag key={i} style={{ margin: 2 }}>{p}</Tag>
                        ))}
                      </div>
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
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
        {selectedCompany && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>{selectedCompany.name}</Text>
              <p style={{ margin: '8px 0', color: '#666' }}>
                {selectedCompany.country} - {selectedCompany.business_type}
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
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CompanyList;
