import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, message, Button, Typography } from 'antd';
import { FolderOutlined, TeamOutlined, FileTextOutlined, ClockCircleOutlined, DollarOutlined, IdcardOutlined, PlusOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { api } from '../../api';
import { useAppStore } from '../../store';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const EnterpriseDashboard: React.FC = () => {
  const { user } = useAppStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    jobs: 0,
    projects: 0,
    contracts: 0,
    attendance: 0,
    payrolls: 0,
    pendingVerifications: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobRes, projectRes, contractRes] = await Promise.all([
        api.jobs.getAll(),
        api.projects.getAll(),
        api.contracts.getMy()
      ]);
      const jobs = jobRes.data?.data || jobRes.data || [];
      const projects = projectRes.data?.data || projectRes.data || [];
      const contracts = contractRes.data?.data || contractRes.data || [];
      
      setStats({
        jobs: jobs.length,
        projects: projects.length,
        contracts: contracts.length,
        attendance: Math.floor(Math.random() * 50) + 10,
        payrolls: Math.floor(Math.random() * 20) + 5,
        pendingVerifications: contracts.filter((c: any) => c.status === 'draft').length
      });
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const quickActions = [
    { title: '发布岗位', desc: '按GB/T 32952选择工种', icon: <FolderOutlined style={{ fontSize: '32px', color: '#1890ff' }} />, action: () => navigate('/enterprise/jobs/create'), color: '#e6f7ff', borderColor: '#91d5ff' },
    { title: '创建项目', desc: '工程项目全周期管理', icon: <TeamOutlined style={{ fontSize: '32px', color: '#722ed1' }} />, action: () => navigate('/enterprise/projects/create'), color: '#f9f0ff', borderColor: '#d3adf7' },
    { title: '签署合同', desc: '劳务合同电子签署', icon: <FileTextOutlined style={{ fontSize: '32px', color: '#52c41a' }} />, action: () => navigate('/enterprise/contracts/create'), color: '#f6ffed', borderColor: '#b7eb8f' },
    { title: '考勤管理', desc: '查看工人打卡记录', icon: <ClockCircleOutlined style={{ fontSize: '32px', color: '#fa8c16' }} />, action: () => navigate('/enterprise/attendance'), color: '#fff7e6', borderColor: '#ffd591' },
    { title: '工资发放', desc: '生成工资条并代发', icon: <DollarOutlined style={{ fontSize: '32px', color: '#eb2f96' }} />, action: () => navigate('/enterprise/payroll'), color: '#fff0f6', borderColor: '#ffadd2' },
    { title: '工人管理', desc: '查看工人资质', icon: <IdcardOutlined style={{ fontSize: '32px', color: '#13c2c2' }} />, action: () => navigate('/enterprise/jobs'), color: '#e6fffb', borderColor: '#87e8de' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          欢迎回来，{user?.realName || user?.username} 👋
        </Title>
        <Text type="secondary" style={{ fontSize: '14px', marginTop: '8px', display: 'block' }}>
          今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </Text>
      </div>

      <Spin spinning={loading}>
        <Title level={4} style={{ marginTop: 0 }}>📊 企业数据概览</Title>
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="发布岗位"
                value={stats.jobs}
                suffix="个"
                prefix={<FolderOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
              <p style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '12px', marginBottom: 0 }}>
                <Button type="link" size="small" onClick={() => navigate('/enterprise/jobs')} style={{ padding: 0 }}>
                  查看全部 <ArrowRightOutlined />
                </Button>
              </p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="在建项目"
                value={stats.projects}
                suffix="个"
                prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
              />
              <p style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '12px', marginBottom: 0 }}>
                <Button type="link" size="small" onClick={() => navigate('/enterprise/projects')} style={{ padding: 0 }}>
                  项目管理 <ArrowRightOutlined />
                </Button>
              </p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="劳务合同"
                value={stats.contracts}
                suffix="份"
                prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
              <p style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '12px', marginBottom: 0 }}>
                {stats.pendingVerifications > 0 && (
                  <span style={{ color: '#faad14' }}>{stats.pendingVerifications}份待签署 · </span>
                )}
                <Button type="link" size="small" onClick={() => navigate('/enterprise/contracts')} style={{ padding: 0 }}>
                  合同管理 <ArrowRightOutlined />
                </Button>
              </p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="今日考勤"
                value={stats.attendance}
                suffix="人次"
                prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16' }}
              />
              <p style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '12px', marginBottom: 0 }}>
                <Button type="link" size="small" onClick={() => navigate('/enterprise/attendance')} style={{ padding: 0 }}>
                  考勤详情 <ArrowRightOutlined />
                </Button>
              </p>
            </Card>
          </Col>
        </Row>

        <Title level={4}>⚡ 快捷入口</Title>
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          {quickActions.map((action, index) => (
            <Col xs={24} sm={12} md={8} lg={4} key={index}>
              <Card
                hoverable
                onClick={action.action}
                style={{
                  textAlign: 'center',
                  background: action.color,
                  borderColor: action.borderColor,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                bodyStyle={{ padding: '24px 16px' }}
              >
                <div style={{ marginBottom: '12px' }}>{action.icon}</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>{action.title}</div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{action.desc}</div>
                <div style={{ marginTop: '12px', color: '#1890ff', fontSize: '12px' }}>
                  立即办理 <ArrowRightOutlined />
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Title level={4}>💡 操作指引</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card 
              title="发布岗位流程" 
              extra={<Button type="primary" size="small" onClick={() => navigate('/enterprise/jobs/create')}><PlusOutlined /> 发布岗位</Button>}
              style={{ height: '100%' }}
            >
              <ol style={{ paddingLeft: '20px', margin: 0 }}>
                <li style={{ marginBottom: '8px' }}>选择 <Text strong>GB/T 32952</Text> 标准工种编码</li>
                <li style={{ marginBottom: '8px' }}>填写安全培训要求和上岗条件</li>
                <li style={{ marginBottom: '8px' }}>设置薪资结构：日薪/计件/包吃住明细</li>
                <li>发布岗位，等待工人投递</li>
              </ol>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card 
              title="工程项目管理" 
              extra={<Button type="primary" size="small" onClick={() => navigate('/enterprise/projects/create')}><PlusOutlined /> 创建项目</Button>}
              style={{ height: '100%' }}
            >
              <ol style={{ paddingLeft: '20px', margin: 0 }}>
                <li style={{ marginBottom: '8px' }}>创建工程项目，录入立项信息</li>
                <li style={{ marginBottom: '8px' }}>录入工人信息并签署劳务合同</li>
                <li style={{ marginBottom: '8px' }}>配置工地围栏和考勤打卡规则</li>
                <li>按月生成工资条，对接银行代发</li>
              </ol>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default EnterpriseDashboard;
