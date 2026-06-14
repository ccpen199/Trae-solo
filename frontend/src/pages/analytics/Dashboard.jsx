import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Tag,
  message,
  Skeleton,
  Empty,
  Typography,
  List,
  Result,
  Avatar,
  Badge,
  Rate,
} from 'antd';
import {
  EyeOutlined,
  FileTextOutlined,
  UserOutlined,
  TeamOutlined,
  PieChartOutlined,
  LineChartOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  StarOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import useRequest from '../../hooks/useRequest';
import useAuth from '../../hooks/useAuth';
import { getDashboard } from '../../api/analytics';

const { Title, Text } = Typography;

const COLORS = ['#1E6FDB', '#52C41A', '#FAAD14', '#F5222D', '#722ED1', '#13C2C2'];

const mockData = {
  overview: {
    todayVisits: 12580,
    todayOrders: 856,
    totalUsers: 125680,
    totalOrders: 358960,
  },
  businessPie: [
    { name: '社保办理', value: 35 },
    { name: '就业服务', value: 28 },
    { name: '人事考试', value: 18 },
    { name: '政策咨询', value: 12 },
    { name: '培训申请', value: 7 },
  ],
  weeklyTrend: [
    { day: '周一', 办件量: 520, 访问量: 8500 },
    { day: '周二', 办件量: 480, 访问量: 7800 },
    { day: '周三', 办件量: 620, 访问量: 9200 },
    { day: '周四', 办件量: 580, 访问量: 8900 },
    { day: '周五', 办件量: 720, 访问量: 10500 },
    { day: '周六', 办件量: 350, 访问量: 5200 },
    { day: '周日', 办件量: 280, 访问量: 4500 },
  ],
  regionRanking: [
    { name: '朝阳区', count: 28560 },
    { name: '海淀区', count: 25680 },
    { name: '西城区', count: 18920 },
    { name: '东城区', count: 16580 },
    { name: '丰台区', count: 14260 },
    { name: '通州区', count: 12850 },
    { name: '顺义区', count: 10580 },
    { name: '昌平区', count: 9860 },
    { name: '大兴区', count: 8520 },
    { name: '石景山区', count: 7250 },
  ],
  recentActivities: [
    {
      id: 1,
      type: 'order',
      title: '社保账户查询',
      user: '张三',
      time: '2分钟前',
      status: 'completed',
    },
    {
      id: 2,
      type: 'review',
      title: '服务评价',
      user: '李四',
      time: '5分钟前',
      status: 'completed',
      rating: 5,
    },
    {
      id: 3,
      type: 'consult',
      title: '政策咨询',
      user: '王五',
      time: '8分钟前',
      status: 'processing',
    },
    {
      id: 4,
      type: 'order',
      title: '就业补贴申请',
      user: '赵六',
      time: '12分钟前',
      status: 'completed',
    },
    {
      id: 5,
      type: 'order',
      title: '考试报名',
      user: '钱七',
      time: '15分钟前',
      status: 'pending',
    },
    {
      id: 6,
      type: 'review',
      title: '服务评价',
      user: '孙八',
      time: '18分钟前',
      status: 'completed',
      rating: 4,
    },
    {
      id: 7,
      type: 'consult',
      title: '社保转移咨询',
      user: '周九',
      time: '22分钟前',
      status: 'completed',
    },
    {
      id: 8,
      type: 'order',
      title: '培训报名',
      user: '吴十',
      time: '25分钟前',
      status: 'completed',
    },
  ],
};

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return percent > 0.05 ? (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

const AnalyticsDashboard = () => {
  const { user, roles, loading: authLoading } = useAuth();
  const [activityKey, setActivityKey] = useState('all');

  const { loading, data: dashboardData, refresh } = useRequest(getDashboard, {
    onError: () => {
      message.error('获取运营数据失败');
    },
  });

  const displayData = dashboardData || mockData;

  const userRole = user?.role || user?.roles?.[0] || 'personal';
  const hasPermission = userRole === 'agency_admin' || roles?.includes('agency_admin');

  useEffect(() => {
    if (!authLoading && !hasPermission) {
      message.warning('您没有权限访问运营总览页面');
    }
  }, [authLoading, hasPermission]);

  const getActivityIcon = (type) => {
    const iconMap = {
      order: <FileTextOutlined style={{ color: '#1E6FDB' }} />,
      review: <StarOutlined style={{ color: '#FAAD14' }} />,
      consult: <QuestionCircleOutlined style={{ color: '#52C41A' }} />,
    };
    return iconMap[type] || <MessageOutlined />;
  };

  const getStatusTag = (status) => {
    const statusMap = {
      completed: { color: 'success', text: '已完成' },
      processing: { color: 'processing', text: '处理中' },
      pending: { color: 'warning', text: '待处理' },
    };
    const info = statusMap[status] || statusMap.pending;
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const overviewCards = [
    {
      title: '今日访问量',
      value: displayData.overview.todayVisits,
      suffix: '次',
      icon: <EyeOutlined />,
      color: '#1E6FDB',
      trend: '+12.5%',
      trendColor: '#52C41A',
    },
    {
      title: '今日办件量',
      value: displayData.overview.todayOrders,
      suffix: '件',
      icon: <FileTextOutlined />,
      color: '#52C41A',
      trend: '+8.3%',
      trendColor: '#52C41A',
    },
    {
      title: '累计用户数',
      value: displayData.overview.totalUsers,
      suffix: '人',
      icon: <UserOutlined />,
      color: '#FAAD14',
      trend: '+5.2%',
      trendColor: '#52C41A',
    },
    {
      title: '累计办件量',
      value: displayData.overview.totalOrders,
      suffix: '件',
      icon: <TeamOutlined />,
      color: '#722ED1',
      trend: '+15.8%',
      trendColor: '#52C41A',
    },
  ];

  const activityTabs = [
    { key: 'all', label: '全部' },
    { key: 'order', label: '最新办件' },
    { key: 'review', label: '最新评价' },
    { key: 'consult', label: '最新咨询' },
  ];

  const filteredActivities = displayData.recentActivities.filter(
    (item) => activityKey === 'all' || item.type === activityKey
  );

  if (authLoading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有权限访问该页面，运营总览仅对经办机构管理员开放"
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            返回上一页
          </Button>
        }
      />
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 15 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>运营总览</Title>
        <Button icon={<ReloadOutlined />} onClick={refresh}>
          刷新数据
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {overviewCards.map((card, index) => (
          <Col xs={12} sm={12} md={6} key={index}>
            <Card bodyStyle={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Statistic
                    title={<span style={{ color: '#666', fontSize: 13 }}>{card.title}</span>}
                    value={card.value}
                    suffix={card.suffix}
                    valueStyle={{ color: card.color, fontSize: 28 }}
                  />
                  {card.trend && (
                    <Text style={{ color: card.trendColor, fontSize: 12 }}>
                      {card.trend} 较昨日
                    </Text>
                  )}
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: `${card.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    color: card.color,
                  }}
                >
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <PieChartOutlined style={{ color: '#722ED1' }} />
                业务模块占比
              </Space>
            }
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayData.businessPie}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {displayData.businessPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value) => [`${value}%`, '占比']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <LineChartOutlined style={{ color: '#1E6FDB' }} />
                近7天办件趋势
              </Space>
            }
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayData.weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="办件量"
                    stroke="#1E6FDB"
                    strokeWidth={3}
                    dot={{ fill: '#1E6FDB', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="访问量"
                    stroke="#52C41A"
                    strokeWidth={2}
                    dot={{ fill: '#52C41A', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BarChartOutlined style={{ color: '#52C41A' }} />
                各区域办件量排行
              </Space>
            }
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayData.regionRanking} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
                  <RechartsTooltip
                    formatter={(value) => [`${value}件`, '办件量']}
                  />
                  <Bar
                    dataKey="count"
                    name="办件量"
                    fill="#1E6FDB"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#FAAD14' }} />
                实时动态
                <Badge status="processing" />
              </Space>
            }
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ padding: '16px 16px 0' }}>
              <Space size={[8, 8]} wrap>
                {activityTabs.map((tab) => (
                  <Button
                    key={tab.key}
                    type={activityKey === tab.key ? 'primary' : 'default'}
                    size="small"
                    onClick={() => setActivityKey(tab.key)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </Space>
            </div>
            <List
              dataSource={filteredActivities}
              renderItem={(item) => (
                <List.Item
                  style={{ padding: '12px 16px', cursor: 'pointer' }}
                  onClick={() => message.info(`查看${item.title}详情`)}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        size={36}
                        style={{
                          background: `${
                            item.type === 'order'
                              ? '#1E6FDB'
                              : item.type === 'review'
                              ? '#FAAD14'
                              : '#52C41A'
                          }15`,
                          color:
                            item.type === 'order'
                              ? '#1E6FDB'
                              : item.type === 'review'
                              ? '#FAAD14'
                              : '#52C41A',
                        }}
                        icon={getActivityIcon(item.type)}
                      />
                    }
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text strong>{item.title}</Text>
                        {item.rating && <Rate disabled value={item.rating} allowHalf style={{ fontSize: 12 }} />}
                        {getStatusTag(item.status)}
                      </div>
                    }
                    description={
                      <Space size="large">
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <UserOutlined style={{ marginRight: 4 }} />
                          {item.user}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {item.time}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: <Empty description="暂无动态" /> }}
              style={{ maxHeight: 330, overflow: 'auto' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsDashboard;
