import { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Button, Statistic, Typography, Space, Carousel, Tag } from 'antd';
import { Link } from 'react-router-dom';
import {
  MessageOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  UsergroupAddOutlined,
  ArrowRightOutlined,
  RobotOutlined,
  SolutionOutlined,
  CrownOutlined,
  SettingOutlined,
  SearchOutlined,
  FileProtectOutlined,
  FolderOpenOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { lawyerAPI, seedAPI } from '../utils/api';

const { Title, Paragraph } = Typography;

const roleWorkbench = [
  {
    icon: <SolutionOutlined style={{ fontSize: 40, color: '#1890ff' }} />,
    title: '律师工作台',
    desc: '律师执业管理、案件处理、直播管理、收入分账',
    link: '/lawyer/dashboard',
    color: '#1890ff',
  },
  {
    icon: <CrownOutlined style={{ fontSize: 40, color: '#fa8c16' }} />,
    title: '企业VIP中心',
    desc: '法务SOP、培训课包、批量工单',
    link: '/company-vip',
    color: '#fa8c16',
  },
  {
    icon: <SettingOutlined style={{ fontSize: 40, color: '#722ed1' }} />,
    title: '管理后台',
    desc: '律师审核、会话质检、NPS分析、合规巡检、文书沙箱',
    link: '/admin/dashboard',
    color: '#722ed1',
  },
];

const quickEntries = [
  { icon: <SearchOutlined style={{ fontSize: 28, color: '#1890ff' }} />, title: '法律咨询', link: '/consultation' },
  { icon: <FileProtectOutlined style={{ fontSize: 28, color: '#52c41a' }} />, title: '合同生成', link: '/contracts/generate' },
  { icon: <FolderOpenOutlined style={{ fontSize: 28, color: '#fa8c16' }} />, title: '案件跟踪', link: '/cases' },
  { icon: <BookOutlined style={{ fontSize: 28, color: '#722ed1' }} />, title: '法律知识', link: '/content' },
];

function Home({ user: _user, role: _role }) {
  const [lawyers, setLawyers] = useState([]);

  const loadLawyers = useCallback(async () => {
    try {
      const res = await lawyerAPI.getLawyers({ limit: 6 });
      if (res.data.success) {
        setLawyers(res.data.lawyers);
      }
    } catch (err) {
      console.error('加载律师列表失败', err);
    }
  }, []);

  const initAndLoad = useCallback(async () => {
    try {
      await seedAPI.seedData();
    } catch (err) {
      console.error('初始化种子数据失败', err);
    }
    loadLawyers();
  }, [loadLawyers]);

  useEffect(() => {
    initAndLoad();
  }, [initAndLoad]);

  const features = [
    { icon: <MessageOutlined />, title: '智能法律咨询', desc: 'AI智能问答→图文咨询→语音连线→视频面谈→线下委托，分级响应您的法律需求' },
    { icon: <FileTextOutlined />, title: '合同智能起草', desc: '基于NLP训练的行业条款库，自动生成合同并高亮风险点' },
    { icon: <SafetyCertificateOutlined />, title: '多维度资质核验', desc: '执业证OCR+律协接口验证+信用报告，确保律师资质真实可靠' },
    { icon: <UsergroupAddOutlined />, title: '企业VIP服务', desc: '法务SOP配置、员工法律培训课包、批量咨询工单，全方位法务支持' },
  ];

  const stats = [
    { value: 500, suffix: '+', label: '认证律师' },
    { value: 10000, suffix: '+', label: '服务用户' },
    { value: 50000, suffix: '+', label: '咨询解答' },
    { value: 99, suffix: '%', label: '满意度' },
  ];

  return (
    <div className="home-page">
      <div className="hero-section">
        <Row gutter={48} align="middle">
          <Col span={12}>
            <Title level={1} style={{ color: '#fff', marginBottom: 24 }}>
              AI 增强型法律服务中台
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, marginBottom: 32 }}>
              整合律师执业管理、用户法律需求响应与智能工具链，
              为您提供专业、高效、可信赖的法律服务
            </Paragraph>
            <Space size="large">
              <Link to="/consultation">
                <Button type="primary" size="large" icon={<RobotOutlined />}>
                  开始法律咨询
                </Button>
              </Link>
              <Link to="/lawyers">
                <Button size="large" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}>
                  找专业律师 <ArrowRightOutlined />
                </Button>
              </Link>
            </Space>
          </Col>
          <Col span={12}>
            <Carousel autoplay className="hero-carousel">
              <div>
                <Card className="hero-card">
                  <Title level={3} style={{ color: '#1890ff' }}>⚡ 智能分级响应</Title>
                  <Paragraph>从AI初步解答到线下委托，5级服务体系满足您的所有法律需求</Paragraph>
                </Card>
              </div>
              <div>
                <Card className="hero-card">
                  <Title level={3} style={{ color: '#52c41a' }}>📋 合同智能生成</Title>
                  <Paragraph>内置行业模板库，一键生成专业合同，自动识别风险条款</Paragraph>
                </Card>
              </div>
              <div>
                <Card className="hero-card">
                  <Title level={3} style={{ color: '#fa8c16' }}>🔍 案件全程跟踪</Title>
                  <Paragraph>立案→缴费→开庭→判决→执行，案件进度实时掌握</Paragraph>
                </Card>
              </div>
            </Carousel>
          </Col>
        </Row>
      </div>

      <div className="workbench-section" style={{ padding: '48px 0' }}>
        <Title level={2} className="section-title">角色工作台</Title>
        <Row gutter={24}>
          {roleWorkbench.map((item) => (
            <Col span={8} key={item.link}>
              <Link to={item.link}>
                <Card hoverable style={{ textAlign: 'center', height: '100%' }}>
                  <div style={{ marginBottom: 16 }}>{item.icon}</div>
                  <Title level={4} style={{ color: item.color, marginBottom: 8 }}>{item.title}</Title>
                  <Paragraph type="secondary">{item.desc}</Paragraph>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </div>

      <div className="stats-section">
        <Row gutter={32}>
          {stats.map((stat, idx) => (
            <Col span={6} key={idx}>
              <Card className="stat-card">
                <Statistic
                  title={stat.label}
                  value={stat.value}
                  suffix={stat.suffix}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <div className="features-section">
        <Title level={2} className="section-title">核心功能</Title>
        <Row gutter={24}>
          {features.map((feature, idx) => (
            <Col span={6} key={idx}>
              <Card className="feature-card" hoverable>
                <div className="feature-icon" style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }}>
                  {feature.icon}
                </div>
                <Title level={4}>{feature.title}</Title>
                <Paragraph type="secondary">{feature.desc}</Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <div className="lawyers-section">
        <Title level={2} className="section-title">推荐律师</Title>
        <Row gutter={24}>
          {lawyers.map((lawyer) => (
            <Col span={8} key={lawyer.id}>
              <Card hoverable className="lawyer-card">
                <Card.Meta
                  avatar={<div style={{ width: 64, height: 64, borderRadius: '50%', background: '#1890ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>{lawyer.name[0]}</div>}
                  title={<Link to={`/lawyers/${lawyer.id}`}>{lawyer.name}</Link>}
                  description={
                    <Space direction="vertical" size="small">
                      <div>{lawyer.practice_area}</div>
                      <div>
                        <Tag color="blue">{lawyer.years_experience}年经验</Tag>
                        <Tag color="green">评分 {lawyer.rating}</Tag>
                      </div>
                    </Space>
                  }
                />
                <Paragraph style={{ marginTop: 16 }} ellipsis={{ rows: 2 }}>{lawyer.bio}</Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/lawyers">
            <Button type="primary" size="large">
              查看更多律师 <ArrowRightOutlined />
            </Button>
          </Link>
        </div>
      </div>

      <div className="quick-entry-section" style={{ padding: '48px 0' }}>
        <Title level={2} className="section-title">快捷功能入口</Title>
        <Row gutter={24}>
          {quickEntries.map((item) => (
            <Col span={6} key={item.link}>
              <Link to={item.link}>
                <Card hoverable style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: 8 }}>{item.icon}</div>
                  <Title level={5}>{item.title}</Title>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}

export default Home;
