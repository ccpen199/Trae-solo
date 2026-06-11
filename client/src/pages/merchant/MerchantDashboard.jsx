import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Space,
  Spin,
  message,
  Tag,
  List,
  Avatar,
  Button
} from 'antd';
import {
  ShopOutlined,
  ShoppingOutlined,
  DollarOutlined,
  HeartOutlined,
  EyeOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  OrderOutlined,
  AppstoreOutlined,
  PictureOutlined,
  GiftOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { merchantAPI, serviceAPI, caseAPI, orderAPI, marketingAPI } from '../../api/index.js';

const { Title, Text } = Typography;

const MerchantDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    services: { total: 0, active: 0 },
    cases: { total: 0, totalLikes: 0, totalViews: 0 },
    orders: { total: 0, pending: 0, completed: 0, today: 0 },
    marketing: { active: 0 },
    revenue: { total: 0, month: 0, today: 0 }
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topServices, setTopServices] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [profileRes, servicesRes, casesRes, ordersRes, marketingRes] = await Promise.all([
        merchantAPI.detail(),
        serviceAPI.list({ pageSize: 100 }),
        caseAPI.list({ pageSize: 100 }),
        orderAPI.list({ pageSize: 5 }),
        marketingAPI.list({ pageSize: 100 })
      ]);

      setProfile(profileRes.data);

      const services = servicesRes.data.data || [];
      const cases = casesRes.data.data || [];
      const orders = ordersRes.data.data || [];
      const marketing = marketingRes.data.data || [];

      const totalRevenue = orders
        .filter(o => o.status === 3)
        .reduce((sum, o) => sum + (o.amount || 0), 0);
      
      const monthRevenue = orders
        .filter(o => o.status === 3 && dayjs(o.created_at).isSame(dayjs(), 'month'))
        .reduce((sum, o) => sum + (o.amount || 0), 0);
      
      const todayRevenue = orders
        .filter(o => o.status === 3 && dayjs(o.created_at).isSame(dayjs(), 'day'))
        .reduce((sum, o) => sum + (o.amount || 0), 0);

      const pendingOrders = orders.filter(o => o.status === 0).length;
      const completedOrders = orders.filter(o => o.status === 3).length;
      const todayOrders = orders.filter(o => dayjs(o.created_at).isSame(dayjs(), 'day')).length;

      const totalLikes = cases.reduce((sum, c) => sum + (c.like_count || 0), 0);
      const totalViews = cases.reduce((sum, c) => sum + (c.view_count || 0), 0);

      const activeMarketing = marketing.filter(m => {
        const now = dayjs();
        const start = dayjs(m.start_date);
        const end = dayjs(m.end_date);
        return now.isAfter(start) && now.isBefore(end);
      }).length;

      setStats({
        services: { total: services.length, active: services.filter(s => s.status === 1).length },
        cases: { total: cases.length, totalLikes, totalViews },
        orders: { total: orders.length, pending: pendingOrders, completed: completedOrders, today: todayOrders },
        marketing: { active: activeMarketing },
        revenue: { total: totalRevenue, month: monthRevenue, today: todayRevenue }
      });

      setRecentOrders(orders.slice(0, 5));
      setTopServices(services.slice(0, 3));
    } catch (error) {
      message.error('获取数据统计失败');
    } finally {
      setLoading(false);
    }
  };

  const getRevenueChartOption = () => {
    const days = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day');
      days.push(date.format('MM-DD'));
      const dayOrders = recentOrders.filter(o => 
        dayjs(o.created_at).isSame(date, 'day') && o.status === 3
      );
      const revenue = dayOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
      data.push(revenue);
    }

    return {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>收入: ¥{c}'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: days,
        axisLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { color: '#999' }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { color: '#999', formatter: '¥{value}' }
      },
      series: [{
        name: '收入',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          color: '#ff4d6d',
          width: 3
        },
        itemStyle: {
          color: '#ff4d6d'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 77, 109, 0.3)' },
              { offset: 1, color: 'rgba(255, 77, 109, 0.05)' }
            ]
          }
        },
        data: data
      }]
    };
  };

  const getOrderStatusChartOption = () => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center'
      },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: [
          { value: stats.orders.pending, name: '待确认', itemStyle: { color: '#faad14' } },
          { value: stats.orders.total - stats.orders.pending - stats.orders.completed, name: '履约中', itemStyle: { color: '#1890ff' } },
          { value: stats.orders.completed, name: '已完成', itemStyle: { color: '#52c41a' } }
        ]
      }]
    };
  };

  const getStatusColor = (status) => {
    const colors = {
      0: 'gold',
      1: 'blue',
      2: 'cyan',
      3: 'green',
      4: 'default'
    };
    return colors[status] || 'default';
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 8, color: '#ff4d6d' }}>
          <ShopOutlined style={{ marginRight: 12 }} />
          商家中心
        </Title>
        <Text type="secondary">
          欢迎回来，{profile?.company_name || '商家'}，查看您的经营数据
        </Text>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              bodyStyle={{ padding: 20 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>今日订单</Text>
                  <Statistic
                    value={stats.orders.today}
                    style={{ marginTop: 8 }}
                    valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                    prefix={<OrderOutlined />}
                  />
                </div>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(24, 144, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <OrderOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              bodyStyle={{ padding: 20 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>今日收入</Text>
                  <Statistic
                    value={stats.revenue.today}
                    precision={2}
                    style={{ marginTop: 8 }}
                    valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                    prefix="¥"
                    suffix={<ArrowUpOutlined style={{ fontSize: 14, color: '#52c41a' }} />}
                  />
                </div>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(82, 196, 26, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DollarOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              bodyStyle={{ padding: 20 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>本月收入</Text>
                  <Statistic
                    value={stats.revenue.month}
                    precision={2}
                    style={{ marginTop: 8 }}
                    valueStyle={{ color: '#722ed1', fontWeight: 'bold' }}
                    prefix="¥"
                  />
                </div>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(114, 46, 209, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CalendarOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              bodyStyle={{ padding: 20 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>待处理订单</Text>
                  <Statistic
                    value={stats.orders.pending}
                    style={{ marginTop: 8 }}
                    valueStyle={{ color: '#fa8c16', fontWeight: 'bold' }}
                    prefix={<ShoppingOutlined />}
                  />
                </div>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(250, 140, 22, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShoppingOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={16}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarOutlined style={{ color: '#ff4d6d' }} />
                  <span>近7天收入趋势</span>
                </div>
              }
              style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              bodyStyle={{ padding: 20 }}
            >
              <ReactECharts option={getRevenueChartOption()} style={{ height: 300 }} />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <OrderOutlined style={{ color: '#ff4d6d' }} />
                  <span>订单状态分布</span>
                </div>
              }
              style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              bodyStyle={{ padding: 20 }}
            >
              <ReactECharts option={getOrderStatusChartOption()} style={{ height: 300 }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <OrderOutlined style={{ color: '#ff4d6d' }} />
                  <span>最近订单</span>
                </div>
              }
              extra={<Button type="link" onClick={() => navigate('/merchant/orders')}>查看全部</Button>}
              style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              bodyStyle={{ padding: '12px 0' }}
            >
              {recentOrders.length > 0 ? (
                <List
                  dataSource={recentOrders}
                  renderItem={(order) => (
                    <List.Item
                      style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0' }}
                      actions={[
                        <Tag color={getStatusColor(order.status)} key="status">
                          {order.status_name}
                        </Tag>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={<OrderOutlined />} style={{ background: '#ff4d6d' }} />}
                        title={
                          <Space direction="vertical" size={0}>
                            <Text strong>{order.service_name}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>订单号: {order.order_no}</Text>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={0} style={{ width: '100%' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              客户: {order.user_name}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(order.created_at).format('YYYY-MM-DD HH:mm')}
                            </Text>
                          </Space>
                        }
                      />
                      <Text strong style={{ color: '#ff4d6d', fontSize: 16 }}>
                        ¥{order.amount?.toLocaleString()}
                      </Text>
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  暂无订单数据
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AppstoreOutlined style={{ color: '#ff4d6d' }} />
                  <span>数据概览</span>
                </div>
              }
              style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              bodyStyle={{ padding: 20 }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={12}>
                  <Card 
                    size="small" 
                    onClick={() => navigate('/merchant/services')}
                    style={{ borderRadius: 8, cursor: 'pointer', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div style={{ color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <AppstoreOutlined style={{ fontSize: 20 }} />
                        <Text style={{ color: '#fff', opacity: 0.9 }}>服务管理</Text>
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 'bold' }}>{stats.services.total}</div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>上架 {stats.services.active} 个</div>
                    </div>
                  </Card>
                </Col>
                <Col xs={12}>
                  <Card 
                    size="small" 
                    onClick={() => navigate('/merchant/cases')}
                    style={{ borderRadius: 8, cursor: 'pointer', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', border: 'none' }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div style={{ color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <PictureOutlined style={{ fontSize: 20 }} />
                        <Text style={{ color: '#fff', opacity: 0.9 }}>案例管理</Text>
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 'bold' }}>{stats.cases.total}</div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>
                        <HeartOutlined /> {stats.cases.totalLikes} 点赞
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col xs={12}>
                  <Card 
                    size="small" 
                    onClick={() => navigate('/merchant/marketing')}
                    style={{ borderRadius: 8, cursor: 'pointer', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: 'none' }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div style={{ color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <GiftOutlined style={{ fontSize: 20 }} />
                        <Text style={{ color: '#fff', opacity: 0.9 }}>营销活动</Text>
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 'bold' }}>{stats.marketing.active}</div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>进行中活动</div>
                    </div>
                  </Card>
                </Col>
                <Col xs={12}>
                  <Card 
                    size="small" 
                    style={{ borderRadius: 8, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', border: 'none' }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div style={{ color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <EyeOutlined style={{ fontSize: 20 }} />
                        <Text style={{ color: '#fff', opacity: 0.9 }}>总浏览量</Text>
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 'bold' }}>{stats.cases.totalViews.toLocaleString()}</div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>案例曝光</div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default MerchantDashboard;
