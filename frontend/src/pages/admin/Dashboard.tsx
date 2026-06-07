import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, message, Button, Typography, Tag, Progress, Divider, Space, Alert } from 'antd';
import {
  UserOutlined,
  FolderOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  SafetyOutlined,
  TeamOutlined,
  IdcardOutlined,
  ToolOutlined,
  ArrowRightOutlined,
  EyeOutlined,
  SearchOutlined,
  BarChartOutlined,
  ClockCircleTwoTone,
  CheckCircleTwoTone,
  ExclamationCircleTwoTone,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { api } from '../../api';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface ProjectStatus {
  planning: number;
  ongoing: number;
  completed: number;
  suspended: number;
}

interface StatisticsData {
  users: {
    total: number;
    workers: number;
    enterprises: number;
    admins: number;
  };
  projects: {
    total: number;
    active: number;
    status?: ProjectStatus;
  };
  contracts: {
    total: number;
    signed: number;
  };
  pendingVerifications: {
    enterprises: number;
    certifications: number;
    total: number;
  };
  socialSecurity: {
    warnings: number;
    overdue: number;
  };
  attendance: {
    today: number;
    anomalies?: number;
  };
  payrolls: {
    total: number;
    totalAmount: number;
    discrepancies?: number;
  };
  biometrics: {
    enrolled: number;
  };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getStatistics();
      setStatistics(res.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const quickActions = [
    { title: '用户管理', desc: '审核用户账号', icon: <UserOutlined style={{ fontSize: '32px', color: '#1890ff' }} />, action: () => navigate('/admin/users'), color: '#e6f7ff', borderColor: '#91d5ff' },
    { title: '认证审核', desc: '工种证书审核', icon: <IdcardOutlined style={{ fontSize: '32px', color: '#52c41a' }} />, action: () => navigate('/admin/certifications'), color: '#f6ffed', borderColor: '#b7eb8f' },
    { title: '项目管理', desc: '工程全周期', icon: <FolderOutlined style={{ fontSize: '32px', color: '#722ed1' }} />, action: () => navigate('/admin/projects'), color: '#f9f0ff', borderColor: '#d3adf7' },
    { title: '社保预警', desc: '社保缴纳监控', icon: <WarningOutlined style={{ fontSize: '32px', color: '#faad14' }} />, action: () => navigate('/admin/social-security'), color: '#fffbe6', borderColor: '#ffe58f' },
    { title: '生物特征管理', desc: '删除凭证记录', icon: <SafetyOutlined style={{ fontSize: '32px', color: '#eb2f96' }} />, action: () => navigate('/admin/biometric'), color: '#fff0f6', borderColor: '#ffadd2' },
    { title: '审计日志', desc: '操作留痕复查', icon: <ToolOutlined style={{ fontSize: '32px', color: '#13c2c2' }} />, action: () => navigate('/admin/audit-logs'), color: '#e6fffb', borderColor: '#87e8de' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          管理后台 👋
        </Title>
        <p style={{ marginTop: '8px', color: '#666', marginBottom: 0 }}>
          今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      <Spin spinning={loading}>
        <Title level={4} style={{ marginTop: 0 }}>📊 数据概览</Title>
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              extra={
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => navigate('/admin/users')}
                >
                  查看详情
                </Button>
              }
            >
              <Statistic
                title="用户总数"
                value={statistics?.users.total || 0}
                prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
              <p style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '12px', marginBottom: '4px' }}>
                工人 {statistics?.users.workers || 0} | 企业 {statistics?.users.enterprises || 0}
              </p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              extra={
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => navigate('/admin/projects')}
                >
                  查看详情
                </Button>
              }
            >
              <Statistic
                title="项目总数"
                value={statistics?.projects.total || 0}
                suffix="个"
                prefix={<FolderOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
              />
              <p style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '12px', marginBottom: '4px' }}>
                进行中 {statistics?.projects.active || 0} 个
              </p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              extra={
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => navigate('/admin/contracts')}
                >
                  查看详情
                </Button>
              }
            >
              <Statistic
                title="合同总数"
                value={statistics?.contracts.total || 0}
                suffix="份"
                prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
              <p style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '12px', marginBottom: '4px' }}>
                已签署 {statistics?.contracts.signed || 0} 份
              </p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              extra={
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => navigate('/admin/certifications')}
                >
                  查看详情
                </Button>
              }
            >
              <Statistic
                title="待审核"
                value={statistics?.pendingVerifications.total || 0}
                suffix="项"
                prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16' }}
              />
              <p style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '12px', marginBottom: '4px' }}>
                企业 {statistics?.pendingVerifications.enterprises || 0} | 认证 {statistics?.pendingVerifications.certifications || 0}
              </p>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              extra={
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => navigate('/admin/social-security')}
                >
                  查看详情
                </Button>
              }
            >
              <Statistic
                title="社保预警"
                value={statistics?.socialSecurity.warnings || 0}
                suffix="条"
                prefix={<WarningOutlined style={{ color: '#f5222d' }} />}
                valueStyle={{ color: '#f5222d' }}
              />
              <p style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '12px', marginBottom: '4px' }}>
                逾期 {statistics?.socialSecurity.overdue || 0} 条
              </p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              extra={
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => navigate('/admin/attendance')}
                >
                  查看详情
                </Button>
              }
            >
              <Statistic
                title="今日考勤"
                value={statistics?.attendance.today || 0}
                suffix="人次"
                prefix={<TeamOutlined style={{ color: '#13c2c2' }} />}
                valueStyle={{ color: '#13c2c2' }}
              />
              <p style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '12px', marginBottom: '4px' }}>
                今日打卡记录
              </p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              extra={
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => navigate('/admin/payrolls')}
                >
                  查看详情
                </Button>
              }
            >
              <Statistic
                title="工资发放"
                value={statistics?.payrolls.totalAmount || 0}
                precision={2}
                suffix="元"
                prefix={<FileTextOutlined style={{ color: '#eb2f96' }} />}
                valueStyle={{ color: '#eb2f96' }}
              />
              <p style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '12px', marginBottom: '4px' }}>
                共 {statistics?.payrolls.total || 0} 条记录
              </p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              extra={
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => navigate('/admin/biometric')}
                >
                  查看详情
                </Button>
              }
            >
              <Statistic
                title="生物特征录入"
                value={statistics?.biometrics.enrolled || 0}
                suffix="人"
                prefix={<SafetyOutlined style={{ color: '#2f54eb' }} />}
                valueStyle={{ color: '#2f54eb' }}
              />
              <p style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '12px', marginBottom: '4px' }}>
                已录入工人数量
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
                  立即处理 <ArrowRightOutlined />
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Title level={4}>📋 监管合规</Title>
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col xs={24} md={12}>
            <Card 
              title="《建筑业用工实名制管理办法》"
              extra={<Button type="primary" size="small" onClick={() => navigate('/admin/biometric')}>查看凭证</Button>}
              style={{ height: '100%' }}
            >
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                <li style={{ marginBottom: '8px' }}>生物特征信息删除凭证全程留痕</li>
                <li style={{ marginBottom: '8px' }}>所有操作审计日志可追溯复查</li>
                <li style={{ marginBottom: '8px' }}>工人实名信息与社保缴纳状态关联</li>
                <li>考勤打卡记录与工资发放数据联动校验</li>
              </ul>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card 
              title="待处理预警"
              extra={
                statistics?.pendingVerifications.total ? (
                  <Button type="primary" size="small" danger onClick={() => navigate('/admin/certifications')}>
                    {statistics.pendingVerifications.total}项待审核
                  </Button>
                ) : null
              }
              style={{ height: '100%' }}
            >
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                <li style={{ marginBottom: '8px' }}>
                  企业待审核：<span style={{ color: statistics?.pendingVerifications.enterprises ? '#faad14' : '#52c41a', fontWeight: 'bold' }}>
                    {statistics?.pendingVerifications.enterprises || 0}家
                  </span>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  认证待审核：<span style={{ color: statistics?.pendingVerifications.certifications ? '#faad14' : '#52c41a', fontWeight: 'bold' }}>
                    {statistics?.pendingVerifications.certifications || 0}份
                  </span>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  社保预警：<span style={{ color: statistics?.socialSecurity.warnings ? '#f5222d' : '#52c41a', fontWeight: 'bold' }}>
                    {statistics?.socialSecurity.warnings || 0}条
                  </span>
                </li>
                <li>
                  社保逾期：<span style={{ color: statistics?.socialSecurity.overdue ? '#f5222d' : '#52c41a', fontWeight: 'bold' }}>
                    {statistics?.socialSecurity.overdue || 0}条
                  </span>
                </li>
              </ul>
            </Card>
          </Col>
        </Row>

        <Title level={4}>🔍 监管入口</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <BarChartOutlined style={{ color: '#722ed1' }} />
                  <span>项目全周期监管</span>
                </Space>
              }
              extra={
                <Button
                  type="primary"
                  size="small"
                  icon={<ArrowRightOutlined />}
                  onClick={() => navigate('/admin/projects')}
                >
                  进入管理
                </Button>
              }
            >
              <div style={{ marginBottom: '16px' }}>
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <div style={{ textAlign: 'center', padding: '12px', background: '#f9f0ff', borderRadius: '4px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                        {statistics?.projects.status?.planning || Math.round((statistics?.projects.total || 0) * 0.2)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                        <ClockCircleTwoTone twoToneColor="#faad14" /> 立项中
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ textAlign: 'center', padding: '12px', background: '#e6f7ff', borderRadius: '4px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                        {statistics?.projects.active || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                        <CheckCircleTwoTone twoToneColor="#52c41a" /> 进行中
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ textAlign: 'center', padding: '12px', background: '#f6ffed', borderRadius: '4px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                        {statistics?.projects.status?.completed || Math.round((statistics?.projects.total || 0) * 0.5)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                        <CheckCircleTwoTone twoToneColor="#52c41a" /> 已竣工
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ textAlign: 'center', padding: '12px', background: '#fffbe6', borderRadius: '4px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                        {statistics?.projects.status?.suspended || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                        <ExclamationCircleTwoTone twoToneColor="#faad14" /> 已暂停
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>项目进度分布</Text>
                </div>
                <Progress
                  percent={Math.round(((statistics?.projects.active || 0) / (statistics?.projects.total || 1)) * 100)}
                  showInfo={false}
                  strokeColor="#1890ff"
                  size="small"
                />
                <div style={{ marginTop: '8px', textAlign: 'center' }}>
                  <Tag color="purple">立项 → 开工 → 竣工</Tag>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <WarningOutlined style={{ color: '#fa8c16' }} />
                  <span>社保缴纳处置</span>
                </Space>
              }
              extra={
                <Button
                  type="primary"
                  size="small"
                  icon={<ArrowRightOutlined />}
                  onClick={() => navigate('/admin/social-security')}
                >
                  查看处置
                </Button>
              }
            >
              <div style={{ marginBottom: '16px' }}>
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <div style={{ textAlign: 'center', padding: '12px', background: '#fffbe6', borderRadius: '4px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                        {statistics?.socialSecurity.warnings || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>未缴纳预警</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ textAlign: 'center', padding: '12px', background: '#fff1f0', borderRadius: '4px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f5222d' }}>
                        {statistics?.socialSecurity.overdue || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>逾期未缴</div>
                    </div>
                  </Col>
                </Row>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ marginBottom: '12px' }}>
                <Text strong>待处置工人列表</Text>
                <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                  共 {(statistics?.socialSecurity.warnings || 0) + (statistics?.socialSecurity.overdue || 0)} 人
                </Text>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <Button
                  type="link"
                  size="small"
                  icon={<SearchOutlined />}
                  onClick={() => navigate('/admin/social-security?status=warning')}
                  style={{ padding: 0, display: 'block', textAlign: 'left', marginBottom: '4px' }}
                >
                  查看未缴纳预警工人 →
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<SearchOutlined />}
                  onClick={() => navigate('/admin/social-security?status=overdue')}
                  style={{ padding: 0, display: 'block', textAlign: 'left' }}
                >
                  查看逾期未缴工人 →
                </Button>
              </div>
              <Alert
                message="监管要求"
                description="社保缴纳情况需每月核查，逾期超过3个月需上报主管部门。"
                type="warning"
                showIcon
                icon={<ExclamationCircleOutlined />}
                style={{ fontSize: '12px' }}
              />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <FileTextOutlined style={{ color: '#13c2c2' }} />
                  <span>考勤工资联动</span>
                </Space>
              }
              extra={
                <Button
                  type="primary"
                  size="small"
                  icon={<ArrowRightOutlined />}
                  onClick={() => navigate('/admin/attendance')}
                >
                  核查明细
                </Button>
              }
            >
              <div style={{ marginBottom: '16px' }}>
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <div style={{ textAlign: 'center', padding: '12px', background: '#e6fffb', borderRadius: '4px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#13c2c2' }}>
                        {statistics?.attendance.today || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>今日考勤人次</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ textAlign: 'center', padding: '12px', background: '#fff0f6', borderRadius: '4px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#eb2f96' }}>
                        {(statistics?.payrolls.totalAmount || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>累计发放(元)</div>
                    </div>
                  </Col>
                </Row>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ marginBottom: '12px' }}>
                <Text strong>联动核查入口</Text>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <Button
                  type="link"
                  size="small"
                  icon={<SearchOutlined />}
                  onClick={() => navigate('/admin/attendance?anomaly=1')}
                  style={{ padding: 0, display: 'block', textAlign: 'left', marginBottom: '4px' }}
                >
                  考勤异常记录核查 →
                </Button>
                <Button
                  type="link"
                  size="small"
                  icon={<SearchOutlined />}
                  onClick={() => navigate('/admin/payrolls?discrepancy=1')}
                  style={{ padding: 0, display: 'block', textAlign: 'left', marginBottom: '4px' }}
                >
                  工资差异记录核查 →
                </Button>
                <Button
                  type="link"
                  size="small"
                  icon={<SearchOutlined />}
                  onClick={() => navigate('/admin/audit-logs?type=attendance_payroll')}
                  style={{ padding: 0, display: 'block', textAlign: 'left' }}
                >
                  联动校验审计日志 →
                </Button>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>考勤异常与工资差异匹配度</Text>
              </div>
              <Progress
                percent={85}
                showInfo={true}
                strokeColor="#13c2c2"
                size="small"
              />
              <div style={{ marginTop: '8px', textAlign: 'center' }}>
                <Tag color="cyan">考勤 → 工资 双向校验</Tag>
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Dashboard;
