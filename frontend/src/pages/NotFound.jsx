import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Button, Typography, Card } from 'antd';
import { HomeOutlined, SearchOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Card bordered={false} style={{ textAlign: 'center', maxWidth: 600 }}>
        <div
          style={{
            fontSize: 120,
            fontWeight: 700,
            color: '#ff4d4f',
            marginBottom: 16,
            lineHeight: 1,
          }}
        >
          404
        </div>

        <Title level={3} style={{ marginBottom: 16 }}>
          页面不存在
        </Title>

        <Paragraph type="secondary" style={{ marginBottom: 32, fontSize: 16 }}>
          抱歉，您访问的页面不存在或已被移除。
          <br />
          请检查您输入的网址是否正确，或返回首页继续浏览。
        </Paragraph>

        <Row gutter={[16, 16]} justify="center">
          <Col>
            <Button
              type="primary"
              size="large"
              icon={<HomeOutlined />}
              onClick={() => navigate('/')}
            >
              返回首页
            </Button>
          </Col>
          <Col>
            <Button
              size="large"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
            >
              返回上一页
            </Button>
          </Col>
          <Col>
            <Button
              size="large"
              icon={<SearchOutlined />}
              onClick={() => navigate('/houses')}
            >
              浏览房源
            </Button>
          </Col>
        </Row>

        <div
          style={{
            marginTop: 48,
            paddingTop: 32,
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            如果您认为这是一个错误，请联系客服人员。
          </Text>
        </div>
      </Card>
    </div>
  );
}

export default NotFound;