import React, { useEffect, useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Typography,
  Divider,
  Breadcrumb,
  Tabs,
  List,
  Empty,
  Tag,
  Spin
} from 'antd';
import { 
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  BuildingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { commonApi } from '../../api';

const { Title, Text, Paragraph } = Typography;

function CompanyPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [certifications, setCertifications] = useState([]);
  const [orgStructure, setOrgStructure] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [companyRes, certsRes, orgRes] = await Promise.all([
        commonApi.getCompanyInfo(),
        commonApi.getCertifications(),
        commonApi.getOrgStructure()
      ]);
      setCompanyInfo(companyRes.data);
      setCertifications(certsRes.data || []);
      setOrgStructure(orgRes.data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
      setCompanyInfo({
        name: '某某科技有限公司',
        logo: null,
        introduction: '某某科技有限公司是一家专注于高新技术研发的现代化企业，致力于为客户提供优质的产品和服务。公司成立于2010年，拥有专业的研发团队和完善的售后服务体系。多年来，公司始终坚持"科技创新、品质第一"的经营理念，不断推出符合市场需求的产品，赢得了广大客户的信赖和好评。',
        history: '2010年：公司成立，专注于智能硬件研发；\n2012年：首款智能产品上市，获得市场好评；\n2015年：公司规模扩大，建立研发中心；\n2018年：产品远销海外，市场份额持续增长；\n2020年：推出新一代智能产品系列；\n2024年：成为行业领先的智能解决方案提供商。',
        culture: '企业愿景：成为全球领先的智能解决方案提供商\n企业使命：用科技创新改变生活\n核心价值观：创新、品质、服务、共赢\n经营理念：科技创新，品质第一\n团队精神：协作、进取、奉献、创新',
        vision: '某某科技致力于成为全球领先的智能解决方案提供商，通过持续的技术创新和产品优化，为客户创造更大价值，为社会发展贡献力量。',
        address: '北京市海淀区中关村科技园',
        phone: '400-888-8888',
        fax: '010-88888888',
        email: 'contact@example.com',
        qq: '12345678',
        wechat: 'example_tech',
        work_time: '周一至周五 9:00-18:00'
      });
      setCertifications([
        { id: 1, title: 'ISO 9001质量管理体系认证', cert_number: 'ISO-2024-001', issue_date: '2024-01-01', expiry_date: '2027-01-01' },
        { id: 2, title: '高新技术企业证书', cert_number: 'GR20240001', issue_date: '2024-06-01', expiry_date: '2027-06-01' },
        { id: 3, title: '软件企业认定证书', cert_number: 'R-2024-0001', issue_date: '2024-03-01', expiry_date: '2027-03-01' }
      ]);
      setOrgStructure([
        { id: 1, name: '总经理办公室', parent_id: 0, manager: '张总', phone: '010-88888001', description: '公司战略规划与决策' },
        { id: 2, name: '技术部', parent_id: 1, manager: '李经理', phone: '010-88888002', description: '产品研发与技术支持' },
        { id: 3, name: '产品部', parent_id: 1, manager: '王经理', phone: '010-88888003', description: '产品规划与管理' },
        { id: 4, name: '销售部', parent_id: 1, manager: '赵经理', phone: '010-88888004', description: '市场销售与客户服务' },
        { id: 5, name: '行政人事部', parent_id: 1, manager: '刘经理', phone: '010-88888005', description: '行政管理与人力资源' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => (
      <Paragraph key={index} style={{ marginBottom: 8, lineHeight: 1.8 }}>
        {line}
      </Paragraph>
    ));
  };

  const tabItems = [
    {
      key: 'intro',
      label: '公司简介',
      icon: <BuildingOutlined />,
      children: (
        <div>
          <div style={{
            height: 300,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            marginBottom: 24
          }}>
            <div style={{ textAlign: 'center', color: '#fff' }}>
              <Title level={2} style={{ color: '#fff' }}>{companyInfo?.name}</Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>创新科技，引领未来</Text>
            </div>
          </div>
          
          {companyInfo?.introduction && (
            <div>
              <Title level={4} style={{ color: '#1890ff', marginBottom: 16 }}>企业简介</Title>
              <Paragraph style={{ fontSize: 16, lineHeight: 2 }}>{companyInfo.introduction}</Paragraph>
            </div>
          )}

          <Divider />

          {companyInfo?.vision && (
            <div>
              <Title level={4} style={{ color: '#1890ff', marginBottom: 16 }}>企业愿景</Title>
              <Paragraph style={{ fontSize: 16, lineHeight: 2 }}>{companyInfo.vision}</Paragraph>
            </div>
          )}

          <Divider />

          <Row gutter={[32, 32]} style={{ marginTop: 24 }}>
            <Col xs={24} sm={8}>
              <Card hoverable>
                <div style={{ textAlign: 'center' }}>
                  <PhoneOutlined style={{ fontSize: 40, color: '#1890ff' }} />
                  <div style={{ marginTop: 12 }}>
                    <Text strong>联系电话</Text>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">{companyInfo?.phone}</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card hoverable>
                <div style={{ textAlign: 'center' }}>
                  <MailOutlined style={{ fontSize: 40, color: '#52c41a' }} />
                  <div style={{ marginTop: 12 }}>
                    <Text strong>电子邮箱</Text>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">{companyInfo?.email}</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card hoverable>
                <div style={{ textAlign: 'center' }}>
                  <ClockCircleOutlined style={{ fontSize: 40, color: '#722ed1' }} />
                  <div style={{ marginTop: 12 }}>
                    <Text strong>工作时间</Text>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">{companyInfo?.work_time}</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: 'history',
      label: '发展历程',
      icon: <ClockCircleOutlined />,
      children: (
        <div>
          <Title level={4} style={{ color: '#1890ff', marginBottom: 24 }}>企业发展历程</Title>
          {formatText(companyInfo?.history)}
        </div>
      )
    },
    {
      key: 'culture',
      label: '企业文化',
      icon: <TeamOutlined />,
      children: (
        <div>
          <Title level={4} style={{ color: '#1890ff', marginBottom: 24 }}>企业文化</Title>
          {formatText(companyInfo?.culture)}
        </div>
      )
    },
    {
      key: 'org',
      label: '组织结构',
      icon: <TeamOutlined />,
      children: (
        <div>
          <Title level={4} style={{ color: '#1890ff', marginBottom: 24 }}>组织结构</Title>
          {orgStructure.length > 0 ? (
            <Row gutter={[16, 16]}>
              {orgStructure.map((item) => (
                <Col xs={24} sm={12} key={item.id}>
                  <Card hoverable>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text strong style={{ fontSize: 16 }}>{item.name}</Text>
                      {item.parent_id === 0 && <Tag color="blue">总部</Tag>}
                    </div>
                    {item.manager && (
                      <div style={{ marginBottom: 8 }}>
                        <Text type="secondary">负责人：</Text>
                        <Text>{item.manager}</Text>
                      </div>
                    )}
                    {item.phone && (
                      <div style={{ marginBottom: 8 }}>
                        <Text type="secondary">联系电话：</Text>
                        <Text>{item.phone}</Text>
                      </div>
                    )}
                    {item.description && (
                      <div>
                        <Text type="secondary">职责：</Text>
                        <Text>{item.description}</Text>
                      </div>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Empty description="暂无组织结构信息" />
          )}
        </div>
      )
    },
    {
      key: 'certs',
      label: '信誉认证',
      icon: <SafetyCertificateOutlined />,
      children: (
        <div>
          <Title level={4} style={{ color: '#1890ff', marginBottom: 24 }}>企业资质与认证</Title>
          {certifications.length > 0 ? (
            <Row gutter={[24, 24]}>
              {certifications.map((cert) => (
                <Col xs={24} sm={12} md={8} key={cert.id}>
                  <Card hoverable>
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <SafetyCertificateOutlined style={{ fontSize: 60, color: '#faad14' }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
                        {cert.title}
                      </Text>
                      {cert.cert_number && (
                        <div style={{ marginBottom: 4 }}>
                          <Text type="secondary">证书编号：</Text>
                          <Text>{cert.cert_number}</Text>
                        </div>
                      )}
                      {cert.issue_date && (
                        <div style={{ marginBottom: 4 }}>
                          <Text type="secondary">发证日期：</Text>
                          <Text>{cert.issue_date}</Text>
                        </div>
                      )}
                      {cert.expiry_date && (
                        <div>
                          <Text type="secondary">有效期至：</Text>
                          <Text>{cert.expiry_date}</Text>
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Empty description="暂无资质认证信息" />
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: '40px 0', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <Breadcrumb style={{ marginBottom: 24 }}>
          <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>首页</Breadcrumb.Item>
          <Breadcrumb.Item>企业介绍</Breadcrumb.Item>
        </Breadcrumb>

        <Spin spinning={loading}>
          <Card>
            <Tabs items={tabItems} defaultActiveKey="intro" />
          </Card>
        </Spin>
      </div>
    </div>
  );
}

export default CompanyPage;
