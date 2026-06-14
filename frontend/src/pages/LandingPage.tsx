import { useState } from 'react';
import { Button, Card, Row, Col, Typography, Space, Tag, List, Avatar } from 'antd';
import {
  PrinterOutlined,
  SolutionOutlined,
  FileTextOutlined,
  TeamOutlined,
  CalendarOutlined,
  EditOutlined,
  MessageOutlined,
  SafetyOutlined,
  AlertOutlined,
  ArrowRightOutlined,
  UserOutlined,
  StarOutlined,
  CheckCircleOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState<string>('enterprise');

  const features = [
    {
      icon: <SolutionOutlined style={{ fontSize: '32px', color: '#1890ff' }} />,
      title: '岗位JD结构化录入',
      description: '工艺要求、设备型号、材料标准等行业特有字段，精准匹配印刷人才需求',
      role: 'enterprise',
      path: '/enterprise/jobs/new',
    },
    {
      icon: <FileTextOutlined style={{ fontSize: '32px', color: '#52c41a' }} />,
      title: 'AI简历解析',
      description: '自动提取PS版软件熟练度、凹印经验年限、ISO认证经历等关键信息',
      role: 'enterprise',
      path: '/enterprise/resumes',
    },
    {
      icon: <TeamOutlined style={{ fontSize: '32px', color: '#722ed1' }} />,
      title: '人才池智能推荐',
      description: '基于印刷技能图谱相似度排序，精准匹配最合适的候选人',
      role: 'enterprise',
      path: '/enterprise/recommend',
    },
    {
      icon: <EditOutlined style={{ fontSize: '32px', color: '#fa8c16' }} />,
      title: '移动简历编辑器',
      description: '支持上传印前、印中、印后作品集，全方位展示专业能力',
      role: 'jobseeker',
      path: '/jobseeker/resume',
    },
    {
      icon: <MessageOutlined style={{ fontSize: '32px', color: '#13c2c2' }} />,
      title: '行业社群交流',
      description: '#胶印故障 #水性油墨 #海德堡 等专业标签，与同行交流技术心得',
      role: 'jobseeker',
      path: '/jobseeker/community',
    },
    {
      icon: <CalendarOutlined style={{ fontSize: '32px', color: '#eb2f96' }} />,
      title: '面试日程同步',
      description: '一键同步到手机日历，面试安排不再错过',
      role: 'jobseeker',
      path: '/jobseeker/interviews',
    },
    {
      icon: <SafetyOutlined style={{ fontSize: '32px', color: '#f5222d' }} />,
      title: '企业信用档案',
      description: '用工合规评分、社保缴纳率、离职率分析，打造诚信招聘环境',
      role: 'admin',
      path: '/admin/enterprises',
    },
    {
      icon: <AlertOutlined style={{ fontSize: '32px', color: '#faad14' }} />,
      title: '敏感词过滤预警',
      description: '薪资承诺、加班文化等风险表述自动标红预警',
      role: 'admin',
      path: '/admin/warnings',
    },
  ];

  const enterpriseFeatures = features.filter(f => f.role === 'enterprise');
  const jobseekerFeatures = features.filter(f => f.role === 'jobseeker');
  const adminFeatures = features.filter(f => f.role === 'admin');
  const currentFeatures =
    activeRole === 'enterprise'
      ? enterpriseFeatures
      : activeRole === 'jobseeker'
      ? jobseekerFeatures
      : adminFeatures;

  const stats = [
    { value: '5,000+', label: '入驻企业' },
    { value: '50,000+', label: '专业人才' },
    { value: '20,000+', label: '成功匹配' },
    { value: '98%', label: '满意度' },
  ];

  const testimonials = [
    {
      name: '张经理',
      company: '某大型包装印刷企业',
      position: '人力资源总监',
      content: 'AI简历解析功能太实用了，能快速识别PS软件熟练度和设备操作经验，招聘效率提升了3倍！',
      avatar: 'Z',
    },
    {
      name: '李师傅',
      company: '资深印刷技师',
      position: '海德堡机长',
      content: '在这里找到了对口的工作，作品集展示功能让我能直观呈现印刷作品，非常专业的平台。',
      avatar: 'L',
    },
    {
      name: '王主管',
      company: '某出版集团',
      position: '生产总监',
      content: '企业信用档案体系很好，规范了行业招聘秩序，让优质企业更容易招到人才。',
      avatar: 'W',
    },
  ];

  const roleTabs = [
    { key: 'enterprise', label: '企业用户', icon: <TeamOutlined /> },
    { key: 'jobseeker', label: '求职用户', icon: <UserOutlined /> },
    { key: 'admin', label: '平台管理', icon: <SafetyOutlined /> },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #001529 0%, #1890ff 100%)',
          color: 'white',
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Space size="large">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '22px',
              fontWeight: 'bold',
            }}
          >
            <PrinterOutlined style={{ fontSize: '28px' }} />
            <span>印刷人才招聘平台</span>
          </div>
          <Tag color="gold" style={{ fontSize: '12px' }}>
            印刷/包装/造纸 全产业链
          </Tag>
        </Space>
        <Space size="middle">
          <Button
            type="text"
            style={{ color: 'white' }}
            onClick={() => navigate('/login?role=enterprise')}
          >
            企业登录
          </Button>
          <Button
            type="text"
            style={{ color: 'white' }}
            onClick={() => navigate('/login?role=jobseeker')}
          >
            求职者登录
          </Button>
          <Button
            type="text"
            style={{ color: 'white' }}
            onClick={() => navigate('/login?role=admin')}
          >
            管理后台
          </Button>
          <Button type="primary" size="large" onClick={() => navigate('/register?role=enterprise')}>
            免费注册
          </Button>
        </Space>
      </div>

      {/* Hero Section */}
      <div
        style={{
          background: 'linear-gradient(135deg, #001529 0%, #1890ff 100%)',
          color: 'white',
          padding: '80px 40px 120px',
          textAlign: 'center',
        }}
      >
        <Title style={{ color: 'white', fontSize: '48px', marginBottom: '16px' }}>
          专注印刷行业的专业人才招聘平台
        </Title>
        <Paragraph
          style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: '18px',
            maxWidth: '800px',
            margin: '0 auto 40px',
          }}
        >
          深耕印刷/包装/造纸全产业链，提供AI智能简历解析、技能图谱匹配、
          企业信用档案等专业服务，连接优质企业与专业人才
        </Paragraph>
        <Space size="large" wrap>
          <Button
            type="primary"
            size="large"
            style={{ height: '48px', padding: '0 32px', fontSize: '16px' }}
            onClick={() => {
              setActiveRole('enterprise');
              navigate('/register?role=enterprise');
            }}
          >
            企业免费入驻 <ArrowRightOutlined />
          </Button>
          <Button
            size="large"
            style={{
              height: '48px',
              padding: '0 32px',
              fontSize: '16px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              borderColor: 'rgba(255,255,255,0.5)',
            }}
            onClick={() => {
              setActiveRole('jobseeker');
              navigate('/register?role=jobseeker');
            }}
          >
            求职者注册
          </Button>
          <Button
            size="large"
            style={{
              height: '48px',
              padding: '0 32px',
              fontSize: '16px',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              borderColor: 'rgba(255,255,255,0.3)',
            }}
            onClick={() => {
              setActiveRole('admin');
              navigate('/login?role=admin');
            }}
          >
            平台管理
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '-60px auto 0',
          padding: '0 20px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Card style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <Row gutter={[16, 16]}>
            {stats.map((stat, index) => (
              <Col xs={12} md={6} key={index}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <Title
                    level={2}
                    style={{
                      color: '#1890ff',
                      marginBottom: '4px',
                    }}
                  >
                    {stat.value}
                  </Title>
                  <Text type="secondary">{stat.label}</Text>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      </div>

      {/* Core Features */}
      <div style={{ maxWidth: '1200px', margin: '80px auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Title level={2} style={{ marginBottom: '12px' }}>
            专业功能模块
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            针对印刷行业特点量身打造的全流程招聘解决方案
          </Text>
        </div>

        {/* Role Tabs */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Space size="middle" wrap>
            {roleTabs.map(tab => (
              <Button
                key={tab.key}
                type={activeRole === tab.key ? 'primary' : 'default'}
                size="large"
                icon={tab.icon}
                onClick={() => setActiveRole(tab.key)}
                style={{
                  height: '44px',
                  padding: '0 24px',
                  borderRadius: '22px',
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Space>
        </div>

        <Row gutter={[24, 24]}>
          {currentFeatures.map((feature, index) => (
            <Col xs={24} sm={12} lg={
              currentFeatures.length === 2 ? 12 :
              currentFeatures.length === 3 ? 8 : 6
            } key={index}>
              <Card
                hoverable
                onClick={() => {
                  const loginRole = feature.role === 'admin' ? 'admin' :
                                   feature.role === 'enterprise' ? 'enterprise' : 'jobseeker';
                  navigate(`/login?role=${loginRole}`);
                }}
                style={{
                  height: '100%',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                bodyStyle={{ padding: '32px' }}
              >
                <div style={{ marginBottom: '16px' }}>{feature.icon}</div>
                <Title level={4} style={{ marginBottom: '12px' }}>
                  {feature.title}
                </Title>
                <Text type="secondary" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  {feature.description}
                </Text>
                <div style={{ marginTop: '16px' }}>
                  <Text type="primary" style={{ fontSize: '13px' }}>
                    立即体验 <ArrowRightOutlined />
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* How it works */}
      <div
        style={{
          background: 'white',
          padding: '80px 20px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <Title level={2} style={{ marginBottom: '12px' }}>
              使用流程
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              三步完成高效招聘
            </Text>
          </div>

          <Row gutter={[32, 32]}>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: '#e6f7ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}
                >
                  <SolutionOutlined style={{ fontSize: '36px', color: '#1890ff' }} />
                </div>
                <Title level={4} style={{ marginBottom: '12px' }}>
                  第一步：注册入驻
                </Title>
                <Text type="secondary">
                  企业完善公司信息，求职者创建个人简历
                </Text>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: '#f6ffed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}
                >
                  <TeamOutlined style={{ fontSize: '36px', color: '#52c41a' }} />
                </div>
                <Title level={4} style={{ marginBottom: '12px' }}>
                  第二步：智能匹配
                </Title>
                <Text type="secondary">
                  基于技能图谱的AI推荐，精准匹配人才与岗位
                </Text>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: '#fff7e6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}
                >
                  <RiseOutlined style={{ fontSize: '36px', color: '#fa8c16' }} />
                </div>
                <Title level={4} style={{ marginBottom: '12px' }}>
                  第三步：高效入职
                </Title>
                <Text type="secondary">
                  在线面试安排、日程同步，助力快速入职
                </Text>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* Testimonials */}
      <div style={{ maxWidth: '1200px', margin: '80px auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Title level={2} style={{ marginBottom: '12px' }}>
            用户好评
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            来自印刷行业从业者的真实反馈
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          {testimonials.map((item, index) => (
            <Col xs={24} md={8} key={index}>
              <Card style={{ height: '100%' }}>
                <List.Item.Meta
                  avatar={<Avatar size={48}>{item.avatar}</Avatar>}
                  title={
                    <Space>
                      <Text strong>{item.name}</Text>
                      <Tag color="blue">{item.position}</Tag>
                    </Space>
                  }
                  description={item.company}
                />
                <Paragraph
                  style={{
                    marginTop: '16px',
                    color: 'rgba(0,0,0,0.65)',
                    lineHeight: '1.8',
                  }}
                >
                  "{item.content}"
                </Paragraph>
                <Space>
                  {[1, 2, 3, 4, 5].map(i => (
                    <StarOutlined key={i} style={{ color: '#fadb14' }} />
                  ))}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* CTA Section */}
      <div
        style={{
          background: 'linear-gradient(135deg, #001529 0%, #1890ff 100%)',
          color: 'white',
          padding: '80px 20px',
          textAlign: 'center',
        }}
      >
        <Title style={{ color: 'white', marginBottom: '16px' }}>
          立即开启专业招聘之旅
        </Title>
        <Paragraph
          style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: '16px',
            maxWidth: '600px',
            margin: '0 auto 32px',
          }}
        >
          加入印刷行业专业人才网络，找到最适合的工作机会或人才
        </Paragraph>
        <Space size="middle" wrap>
          <Button
            type="primary"
            size="large"
            style={{ height: '48px', padding: '0 28px', fontSize: '15px' }}
            onClick={() => navigate('/register?role=enterprise')}
          >
            企业入驻 <CheckCircleOutlined />
          </Button>
          <Button
            size="large"
            style={{
              height: '48px',
              padding: '0 28px',
              fontSize: '15px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              borderColor: 'rgba(255,255,255,0.5)',
            }}
            onClick={() => navigate('/register?role=jobseeker')}
          >
            求职者注册
          </Button>
          <Button
            size="large"
            style={{
              height: '48px',
              padding: '0 28px',
              fontSize: '15px',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              borderColor: 'rgba(255,255,255,0.3)',
            }}
            onClick={() => navigate('/login?role=admin')}
          >
            管理后台
          </Button>
        </Space>
      </div>

      {/* Footer */}
      <div
        style={{
          background: '#001529',
          color: 'rgba(255,255,255,0.65)',
          padding: '40px 20px',
          textAlign: 'center',
        }}
      >
        <Space size="large" wrap style={{ marginBottom: '16px' }}>
          <a style={{ color: 'rgba(255,255,255,0.65)' }}>关于我们</a>
          <a style={{ color: 'rgba(255,255,255,0.65)' }}>服务协议</a>
          <a style={{ color: 'rgba(255,255,255,0.65)' }}>隐私政策</a>
          <a style={{ color: 'rgba(255,255,255,0.65)' }}>联系我们</a>
          <a style={{ color: 'rgba(255,255,255,0.65)' }}>帮助中心</a>
        </Space>
        <Text style={{ fontSize: '12px' }}>
          © 2024 印刷人才招聘平台 · 专注印刷/包装/造纸全产业链
        </Text>
      </div>
    </div>
  );
};

export default LandingPage;
