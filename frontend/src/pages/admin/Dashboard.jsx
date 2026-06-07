import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Space, message } from 'antd';
import { CalendarOutlined, ShoppingOutlined, TeamOutlined, DollarOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { adminAPI } from '../../api';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.dashboard();
      setData(res);
    } catch (err) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getSalesChartOption = () => {
    const salesData = data?.salesData || [];
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['订单数', '销售额'] },
      xAxis: { type: 'category', data: salesData.map(d => d.date) },
      yAxis: [{ type: 'value', name: '订单数' }, { type: 'value', name: '销售额' }],
      series: [
        { name: '订单数', type: 'bar', data: salesData.map(d => d.count) },
        { name: '销售额', type: 'line', yAxisIndex: 1, data: salesData.map(d => d.amount) }
      ]
    };
  };

  const getTopEventsOption = () => {
    const events = data?.topEvents || [];
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: events.map(e => e.title || '活动').reverse() },
      series: [{ type: 'bar', data: events.map(e => e.ticket_count).reverse() }]
    };
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <h2 style={{ margin: 0 }}>数据看板</h2>
      
      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="活动总数"
              value={data?.totalEvents || 0}
              prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="订单总数"
              value={data?.totalOrders || 0}
              prefix={<ShoppingOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="用户总数"
              value={data?.totalUsers || 0}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="总销售额"
              value={data?.totalRevenue || 0}
              prefix={<DollarOutlined style={{ color: '#fa8c16' }} />}
              precision={2}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={14}>
          <Card title="销售趋势" loading={loading}>
            <ReactECharts option={getSalesChartOption()} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card title="热门活动排行" loading={loading}>
            <ReactECharts option={getTopEventsOption()} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export default Dashboard;
