import React from 'react';
import { Layout, Row, Col, Typography, Space, Divider } from 'antd';
import { 
  PhoneOutlined, 
  MailOutlined, 
  EnvironmentOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Footer: AntFooter } = Layout;
const { Title, Text, Link } = Typography;

const Footer = () => {
  const navigate = useNavigate();

  const quickLinks = [
    { label: '企业介绍', path: '/about' },
    { label: '产品展示', path: '/products' },
    { label: '新闻中心', path: '/news' },
    { label: '下载中心', path: '/downloads' },
  ];

  const serviceLinks = [
    { label: '客户服务', path: '/service' },
    { label: '人力资源', path: '/jobs' },
    { label: '合作链接', path: '/links' },
    { label: '联系方式', path: '/contact' },
  ];

  return (
    <AntFooter 
      style={{ 
        background: '#001529', 
        color: 'rgba(255,255,255,0.85)',
        padding: '40px 50px 20px'
      }}
    >
      <Row gutter={[48, 24]}>
        <Col xs={24} sm={12} md={6}>
          <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>关于我们</Title>
          <Space direction="vertical" size="small">
            <Text style={{ color: 'rgba(255,255,255,0.65)', display: 'block' }}>
              我们是一家专业的企业服务提供商，致力于为客户提供高质量的产品和服务。
            </Text>
          </Space>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>快速链接</Title>
          <Space direction="vertical" size="small">
            {quickLinks.map((item, index) => (
              <Link 
                key={index}
                style={{ color: 'rgba(255,255,255,0.65)' }}
                onClick={() => navigate(item.path)}
              >
                <LinkOutlined style={{ marginRight: '8px' }} />
                {item.label}
              </Link>
            ))}
          </Space>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>服务支持</Title>
          <Space direction="vertical" size="small">
            {serviceLinks.map((item, index) => (
              <Link 
                key={index}
                style={{ color: 'rgba(255,255,255,0.65)' }}
                onClick={() => navigate(item.path)}
              >
                <LinkOutlined style={{ marginRight: '8px' }} />
                {item.label}
              </Link>
            ))}
          </Space>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>联系方式</Title>
          <Space direction="vertical" size="small">
            <Text style={{ color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center' }}>
              <PhoneOutlined style={{ marginRight: '8px' }} />
              400-888-8888
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center' }}>
              <MailOutlined style={{ marginRight: '8px' }} />
              service@company.com
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center' }}>
              <EnvironmentOutlined style={{ marginRight: '8px' }} />
              北京市朝阳区xxx路xxx号
            </Text>
          </Space>
        </Col>
      </Row>
      
      <Divider style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '24px 0' }} />
      
      <Row justify="center">
        <Text style={{ color: 'rgba(255,255,255,0.45)' }}>
          © 2024 企业网站 版权所有 | 京ICP备12345678号
        </Text>
      </Row>
    </AntFooter>
  );
};

export default Footer;