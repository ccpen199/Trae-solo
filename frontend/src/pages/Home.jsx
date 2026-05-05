import React from 'react';
import { Row, Col, Card, Button, Typography, Space } from 'antd';
import { Link } from 'react-router-dom';
import { ShopOutlined, TeamOutlined, HeartOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const Home = () => {
  return (
    <div style={{ padding: '40px 0' }}>
      <Row gutter={[32, 32]} justify="center">
        <Col span={24}>
          <Card style={{ textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none' }}>
            <Title level={2} style={{ color: '#fff', marginBottom: 16 }}>
              Welcome to B2B Global Market
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, marginBottom: 24 }}>
              Discover millions of products from trusted suppliers worldwide. Save your favorites for quick access!
            </Paragraph>
            <Space size="middle">
              <Link to="/products">
                <Button type="primary" size="large" style={{ background: '#fff', color: '#667eea', borderColor: '#fff' }}>
                  Browse Products
                </Button>
              </Link>
              <Link to="/favorites">
                <Button size="large" style={{ background: 'transparent', color: '#fff', borderColor: '#fff' }}>
                  <HeartOutlined /> My Favorites
                </Button>
              </Link>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card hoverable>
            <ShopOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <Title level={4} style={{ marginTop: 16 }}>Browse Products</Title>
            <Paragraph>Explore thousands of products from electronics to apparel across different categories.</Paragraph>
            <Link to="/products">
              <Button type="link" style={{ padding: 0 }}>View Products &rarr;</Button>
            </Link>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card hoverable>
            <TeamOutlined style={{ fontSize: 48, color: '#52c41a' }} />
            <Title level={4} style={{ marginTop: 16 }}>Find Suppliers</Title>
            <Paragraph>Connect with verified suppliers and manufacturers from around the globe.</Paragraph>
            <Link to="/companies">
              <Button type="link" style={{ padding: 0 }}>Find Suppliers &rarr;</Button>
            </Link>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card hoverable>
            <HeartOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
            <Title level={4} style={{ marginTop: 16 }}>Manage Favorites</Title>
            <Paragraph>Save products and suppliers you like. Organize with tags for easy access.</Paragraph>
            <Link to="/favorites">
              <Button type="link" style={{ padding: 0 }}>Go to Favorites &rarr;</Button>
            </Link>
          </Card>
        </Col>

        <Col span={24}>
          <Card>
            <Title level={4}>Demo Account</Title>
            <Paragraph>
              You can use the following demo account to test all features:
            </Paragraph>
            <ul>
              <li><strong>Email:</strong> demo@example.com</li>
              <li><strong>Member ID:</strong> M000001</li>
              <li><strong>Password:</strong> 123456</li>
            </ul>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;
