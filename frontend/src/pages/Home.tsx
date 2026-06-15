import React from 'react';
import { Card, Row, Col, Statistic, Button, Space, Tag } from 'antd';
import { 
  ShopOutlined, 
  CarOutlined, 
  CarryOutOutlined, 
  SafetyOutlined,
  ClockCircleOutlined,
  StarOutlined,
  ArrowRightOutlined,
  SearchOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const services = [
    {
      icon: <ShopOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      title: '用工服务',
      desc: '按小时或任务计价，支持拆单分派与组合用工',
      path: '/labor',
      color: '#1890ff',
    },
    {
      icon: <CarOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
      title: '找车服务',
      desc: '车型智能匹配，运费竞价，电子运单生成',
      path: '/delivery',
      color: '#52c41a',
    },
    {
      icon: <CarryOutOutlined style={{ fontSize: 48, color: '#fa8c16' }} />,
      title: '搬家服务',
      desc: '打包清单导入，楼层电梯识别，服务包定制',
      path: '/moving',
      color: '#fa8c16',
    },
  ];

  const features = [
    { icon: <SafetyOutlined />, title: '安全保障', desc: '实名认证+保险直连，服务更安心' },
    { icon: <ClockCircleOutlined />, title: '即时响应', desc: '海量服务者，快速接单响应' },
    { icon: <StarOutlined />, title: '品质保证', desc: '信用评分体系，优质服务推荐' },
  ];

  return (
    <div>
      <div className="hero-section">
        <h1 className="hero-title">同城用工与物流协同平台</h1>
        <p className="hero-subtitle">B2B+C2C混合模式 · 用工·找车·搬家一站式服务</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Button type="primary" size="large" onClick={() => navigate('/labor')}>
            发布用工需求
          </Button>
          <Button size="large" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }} onClick={() => navigate('/delivery')}>
            找车运货
          </Button>
          <Button size="large" icon={<SearchOutlined />} onClick={() => navigate('/labor')}>
            搜索筛选
          </Button>
          <Button size="large" icon={<DashboardOutlined />} onClick={() => navigate('/admin')}>
            管理后台
          </Button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <div className="service-cards" style={{ marginTop: -80, marginBottom: 60 }}>
          {services.map((service, index) => (
            <div 
              key={index}
              className="service-card"
              onClick={() => navigate(service.path)}
            >
              <div className="service-icon" style={{ color: service.color }}>
                {service.icon}
              </div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-desc">{service.desc}</p>
              <Button type="link" style={{ color: service.color, marginTop: 8 }}>
                立即体验 <ArrowRightOutlined />
              </Button>
            </div>
          ))}
        </div>

        <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 32 }}>平台特色</h2>
        <Row gutter={24} style={{ marginBottom: 60 }}>
          {features.map((feature, index) => (
            <Col span={8} key={index}>
              <Card style={{ textAlign: 'center', height: '100%' }}>
                <div style={{ fontSize: 36, color: '#1890ff', marginBottom: 16 }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{feature.title}</h3>
                <p style={{ color: '#8c8c8c' }}>{feature.desc}</p>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={16} style={{ marginBottom: 40 }}>
          <Col span={12}>
            <Card
              title="搜索筛选中心"
              extra={<Button type="link" onClick={() => navigate('/labor')}>进入筛选</Button>}
            >
              <p style={{ color: '#595959', marginBottom: 12 }}>
                支持按工种分类、订单状态、关键词搜索筛选同城用工需求，也可切换到找车服务和搬家服务列表继续筛选。
              </p>
              <Space wrap>
                <Tag color="blue">关键词搜索</Tag>
                <Tag color="green">工种分类</Tag>
                <Tag color="orange">订单状态筛选</Tag>
                <Tag>分页查询</Tag>
              </Space>
            </Card>
          </Col>
          <Col span={12}>
            <Card
              title="后台管理入口"
              extra={<Button type="link" onClick={() => navigate('/admin')}>进入后台</Button>}
            >
              <p style={{ color: '#595959', marginBottom: 12 }}>
                管理后台覆盖数据概览、运力热力、价格监控、纠纷仲裁、订单管理、用户管理和质检规则配置。
              </p>
              <Space wrap>
                <Tag color="purple">管理后台</Tag>
                <Tag color="red">价格预警</Tag>
                <Tag color="cyan">订单管理</Tag>
                <Tag>用户管理</Tag>
              </Space>
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 40 }}>
          <Col span={6}>
            <Card>
              <Statistic title="注册用户" value={10000} suffix="+" />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="服务订单" value={50000} suffix="+" />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="好评率" value={98.5} suffix="%" />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="覆盖城市" value={50} suffix="+" />
            </Card>
          </Col>
        </Row>

        {!user && (
          <Card style={{ textAlign: 'center', background: '#f0f7ff', border: 'none' }}>
            <h2 style={{ marginBottom: 8 }}>立即加入我们</h2>
            <p style={{ color: '#8c8c8c', marginBottom: 16 }}>
              注册成为雇主发布需求，或注册成为工人/司机接单赚钱
            </p>
            <Button type="primary" size="large" onClick={() => navigate('/register')}>
              免费注册
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}

export default Home;
