import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Tag } from 'antd';
import ReactECharts from 'echarts-for-react';
import { MessageOutlined, ShoppingCartOutlined, WarningOutlined, GiftOutlined } from '@ant-design/icons';
import api from '../../api';

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const activityLineOption = {
    title: { text: '发帖活跃度（近30天）' },
    tooltip: { trigger: 'axis' as const },
    xAxis: {
      type: 'category' as const,
      data: Array.from({ length: 30 }, (_, i) => `6/${i + 1}`),
    },
    yAxis: { type: 'value' as const },
    series: [{
      data: [12, 18, 15, 22, 28, 35, 30, 25, 20, 32, 38, 42, 36, 28, 22, 30, 35, 40, 38, 45, 50, 42, 36, 30, 25, 38, 44, 48, 52, 46],
      type: 'line' as const,
      smooth: true,
      areaStyle: { opacity: 0.3 },
    }],
  };

  const funnelOption = {
    title: { text: '交易转化率' },
    tooltip: { trigger: 'item' as const },
    series: [{
      type: 'funnel' as const,
      left: '10%',
      top: 60,
      bottom: 60,
      width: '80%',
      data: [
        { value: 100, name: '浏览' },
        { value: 60, name: '加购' },
        { value: 35, name: '下单' },
        { value: 25, name: '确认收货' },
      ],
    }],
  };

  const responseBarOption = {
    title: { text: '投诉响应时长（小时）' },
    tooltip: { trigger: 'axis' as const },
    xAxis: {
      type: 'category' as const,
      data: ['设施', '环境', '安全', '服务', '其他'],
    },
    yAxis: { type: 'value' as const },
    series: [{
      data: [4.2, 6.5, 2.1, 3.8, 5.0],
      type: 'bar' as const,
      itemStyle: {
        color: (params: { dataIndex: number }) => {
          const colors = ['#1890ff', '#52c41a', '#f5222d', '#faad14', '#722ed1'];
          return colors[params.dataIndex];
        },
      },
    }],
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="今日发帖" value={46} prefix={<MessageOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="今日订单" value={128} prefix={<ShoppingCartOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="未处理投诉" value={7} prefix={<WarningOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="红包池余额" value={12580} prefix={<GiftOutlined />} suffix="元" valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card>
            <ReactECharts option={activityLineOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <ReactECharts option={funnelOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card>
            <ReactECharts option={responseBarOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="红包池状态">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="池总额" value={50000} prefix="¥" />
              </Col>
              <Col span={12}>
                <Statistic title="已发放" value={37420} prefix="¥" valueStyle={{ color: '#f50' }} />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Statistic title="待领取" value={8580} prefix="¥" valueStyle={{ color: '#faad14' }} />
              </Col>
              <Col span={12}>
                <Statistic title="已过期" value={4000} prefix="¥" valueStyle={{ color: '#999' }} />
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <Tag color="green">状态正常</Tag>
              <Tag>自动充值: 每日 ¥2000</Tag>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
