import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Avatar,
  Statistic,
  List,
  Tag,
  Button,
  Space,
  Grid,
  Typography,
  Badge,
} from 'antd';
import {
  UserOutlined,
  InsuranceOutlined,
  SolutionOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  BellOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
  HomeOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import useAuth from '../hooks/useAuth';
import { formatMoney } from '../utils/format';

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

const quickServices = {
  personal: [
    { icon: <InsuranceOutlined />, title: '社保查询', path: '/insurance', color: '#1E6FDB' },
    { icon: <SolutionOutlined />, title: '岗位推荐', path: '/employment', color: '#52C41A' },
    { icon: <FileTextOutlined />, title: '考试报名', path: '/exam', color: '#FAAD14' },
    { icon: <QuestionCircleOutlined />, title: '政策咨询', path: '/policy', color: '#722ED1' },
    { icon: <BarChartOutlined />, title: '缴费记录', path: '/insurance/records', color: '#13C2C2' },
    { icon: <BellOutlined />, title: '消息通知', path: '/notifications', color: '#F5222D' },
    { icon: <UserOutlined />, title: '个人信息', path: '/user/profile', color: '#EB2F96' },
    { icon: <HomeOutlined />, title: '服务指南', path: '/guide', color: '#FA8C16' },
    { icon: <ExclamationCircleOutlined />, title: '投诉建议', path: '/feedback', color: '#A0D911' },
  ],
  enterprise: [
    { icon: <InsuranceOutlined />, title: '基数申报', path: '/insurance/base-declare', color: '#1E6FDB' },
    { icon: <SolutionOutlined />, title: '岗位发布', path: '/employment/job-publish', color: '#52C41A' },
    { icon: <FileTextOutlined />, title: '考试管理', path: '/exam', color: '#FAAD14' },
    { icon: <QuestionCircleOutlined />, title: '政策咨询', path: '/policy', color: '#722ED1' },
    { icon: <BarChartOutlined />, title: '员工社保', path: '/insurance/employees', color: '#13C2C2' },
    { icon: <BellOutlined />, title: '审核通知', path: '/notifications', color: '#F5222D' },
    { icon: <UserOutlined />, title: '企业信息', path: '/user/profile', color: '#EB2F96' },
    { icon: <HomeOutlined />, title: '服务指南', path: '/guide', color: '#FA8C16' },
    { icon: <ExclamationCircleOutlined />, title: '投诉建议', path: '/feedback', color: '#A0D911' },
  ],
  staff: [
    { icon: <InsuranceOutlined />, title: '社保经办', path: '/insurance', color: '#1E6FDB' },
    { icon: <SolutionOutlined />, title: '就业服务', path: '/employment', color: '#52C41A' },
    { icon: <FileTextOutlined />, title: '考试管理', path: '/exam', color: '#FAAD14' },
    { icon: <QuestionCircleOutlined />, title: '政策咨询', path: '/policy', color: '#722ED1' },
    { icon: <BarChartOutlined />, title: '运营分析', path: '/analytics', color: '#13C2C2' },
    { icon: <BellOutlined />, title: '审核任务', path: '/notifications', color: '#F5222D' },
    { icon: <UserOutlined />, title: '用户管理', path: '/users', color: '#EB2F96' },
    { icon: <HomeOutlined />, title: '系统设置', path: '/settings', color: '#FA8C16' },
    { icon: <ExclamationCircleOutlined />, title: '投诉处理', path: '/feedback', color: '#A0D911' },
  ],
};

const todoList = [
  { id: 1, title: '社保缴费待审核', type: 'pending', time: '2024-01-15 10:30' },
  { id: 2, title: '实名认证待完成', type: 'processing', time: '2024-01-14 15:20' },
  { id: 3, title: '岗位投递待确认', type: 'pending', time: '2024-01-13 09:45' },
  { id: 4, title: '考试报名待支付', type: 'processing', time: '2024-01-12 14:10' },
  { id: 5, title: '政策咨询待回复', type: 'pending', time: '2024-01-11 16:30' },
];

const noticeList = [
  { id: 1, title: '关于2024年度社保缴费基数调整的通知', date: '2024-01-15', type: 'important' },
  { id: 2, title: '事业单位招聘考试报名时间延长公告', date: '2024-01-14', type: 'normal' },
  { id: 3, title: '就业创业补贴政策解读会即将举办', date: '2024-01-13', type: 'normal' },
  { id: 4, title: '系统升级维护通知', date: '2024-01-12', type: 'warning' },
];

const insuranceTrendData = [
  { month: '1月', amount: 1250 },
  { month: '2月', amount: 1250 },
  { month: '3月', amount: 1380 },
  { month: '4月', amount: 1380 },
  { month: '5月', amount: 1450 },
  { month: '6月', amount: 1450 },
  { month: '7月', amount: 1580 },
  { month: '8月', amount: 1580 },
  { month: '9月', amount: 1650 },
  { month: '10月', amount: 1650 },
  { month: '11月', amount: 1780 },
  { month: '12月', amount: 1780 },
];

const statData = [
  { title: '社保缴费月数', value: 36, suffix: '个月', color: '#1E6FDB', icon: <InsuranceOutlined /> },
  { title: '岗位投递数', value: 12, suffix: '次', color: '#52C41A', icon: <SolutionOutlined /> },
  { title: '培训课程数', value: 8, suffix: '门', color: '#FAAD14', icon: <FileTextOutlined /> },
  { title: '考试报名数', value: 5, suffix: '次', color: '#722ED1', icon: <BarChartOutlined /> },
];

const getTagColor = (type) => {
  const colorMap = {
    pending: 'orange',
    processing: 'blue',
    completed: 'green',
  };
  return colorMap[type] || 'default';
};

const getTagIcon = (type) => {
  const iconMap = {
    pending: <ClockCircleOutlined />,
    processing: <ExclamationCircleOutlined />,
    completed: <CheckCircleOutlined />,
  };
  return iconMap[type] || null;
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  useBreakpoint();

  const role = user?.role || user?.roles?.[0] || 'personal';
  const services = quickServices[role] || quickServices.personal;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '上午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const getRoleName = () => {
    const roleMap = {
      personal: '个人用户',
      enterprise: '企业HR',
      staff: '基层经办',
    };
    return roleMap[role] || '个人用户';
  };

  return (
    <div>
      <Card
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #1E6FDB 0%, #0F4C9E 100%)',
          borderRadius: 12,
          border: 'none',
        }}
        bodyStyle={{ padding: 32 }}
      >
        <Row align="middle" gutter={24}>
          <Col flex="none">
            <Avatar size={72} icon={<UserOutlined />} src={user?.avatar} style={{ border: '3px solid rgba(255,255,255,0.3)' }} />
          </Col>
          <Col flex="auto">
            <Title level={3} style={{ color: '#fff', margin: 0, marginBottom: 8 }}>
              {getGreeting()}，{user?.name || user?.username || '用户'}
            </Title>
            <Space>
              <Tag color="white" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}>
                {getRoleName()}
              </Tag>
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                欢迎回到政务服务平台
              </Text>
            </Space>
          </Col>
          <Col flex="none">
            <Button type="primary" size="large" style={{ background: '#fff', color: '#1E6FDB', border: 'none' }}>
              开始办事 <ArrowRightOutlined />
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statData.map((item, index) => (
          <Col xs={12} sm={12} md={6} key={index}>
            <Card bodyStyle={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Statistic
                  title={<span style={{ color: '#666', fontSize: 13 }}>{item.title}</span>}
                  value={item.value}
                  suffix={item.suffix}
                  valueStyle={{ color: item.color, fontSize: 28 }}
                />
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: `${item.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    color: item.color,
                  }}
                >
                  {item.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title="快捷服务"
            extra={<Button type="link" onClick={() => navigate('/services')}>更多服务 <ArrowRightOutlined /></Button>}
            bodyStyle={{ padding: 16 }}
          >
            <Row gutter={[8, 8]}>
              {services.map((service, index) => (
                <Col xs={8} sm={8} md={8} lg={8} key={index}>
                  <div
                    onClick={() => navigate(service.path)}
                    style={{
                      padding: 16,
                      textAlign: 'center',
                      cursor: 'pointer',
                      borderRadius: 8,
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${service.color}10`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: `${service.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        color: service.color,
                        margin: '0 auto 12px',
                      }}
                    >
                      {service.icon}
                    </div>
                    <div style={{ fontSize: 13, color: '#333' }}>{service.title}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <BellOutlined style={{ color: '#1E6FDB' }} />
                待办事项
                <Badge count={todoList.filter(t => t.type === 'pending').length} />
              </Space>
            }
            bodyStyle={{ padding: 0 }}
          >
            <List
              dataSource={todoList}
              renderItem={(item) => (
                <List.Item
                  style={{ padding: '12px 16px', cursor: 'pointer' }}
                  onClick={() => navigate('/todos')}
                >
                  <List.Item.Meta
                    avatar={<Tag color={getTagColor(item.type)} icon={getTagIcon(item.type)} style={{ margin: 0 }} />}
                    title={<div style={{ fontSize: 14 }}>{item.title}</div>}
                    description={<span style={{ fontSize: 12, color: '#999' }}>{item.time}</span>}
                  />
                  <ArrowRightOutlined style={{ color: '#ccc', fontSize: 12 }} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <BarChartOutlined style={{ color: '#1E6FDB' }} />
                社保缴费趋势
              </Space>
            }
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={insuranceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatMoney(value)} />
                  <Tooltip
                    formatter={(value) => [formatMoney(value), '缴费金额']}
                    labelFormatter={(label) => `${label}份`}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#1E6FDB"
                    strokeWidth={3}
                    dot={{ fill: '#1E6FDB', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <BellOutlined style={{ color: '#1E6FDB' }} />
                通知公告
              </Space>
            }
            extra={<Button type="link" onClick={() => navigate('/notices')}>更多</Button>}
            bodyStyle={{ padding: 0 }}
          >
            <List
              dataSource={noticeList}
              renderItem={(item) => (
                <List.Item
                  style={{ padding: '12px 16px', cursor: 'pointer' }}
                  onClick={() => navigate(`/notices/${item.id}`)}
                >
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {item.type === 'important' && <Tag color="red">重要</Tag>}
                        {item.type === 'warning' && <Tag color="orange">提醒</Tag>}
                        <span style={{ fontSize: 14, flex: 1 }}>{item.title}</span>
                      </div>
                    }
                    description={<span style={{ fontSize: 12, color: '#999' }}>{item.date}</span>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
