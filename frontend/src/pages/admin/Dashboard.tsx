import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Button } from 'antd';
import { 
  UserOutlined, 
  ShoppingOutlined, 
  DollarOutlined, 
  WarningOutlined,
  RiseOutlined,
  TeamOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import api from '../../api';

function AdminDashboard() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.get('/admin/stats/overview');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const orderChartOption = {
    title: { text: '近7日订单趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '用工订单',
        type: 'line',
        data: [12, 19, 15, 22, 28, 35, 30],
        smooth: true,
        itemStyle: { color: '#1890ff' },
      },
      {
        name: '找车订单',
        type: 'line',
        data: [8, 12, 10, 15, 20, 25, 22],
        smooth: true,
        itemStyle: { color: '#52c41a' },
      },
      {
        name: '搬家订单',
        type: 'line',
        data: [5, 8, 6, 10, 12, 18, 15],
        smooth: true,
        itemStyle: { color: '#fa8c16' },
      },
    ],
    legend: { bottom: 0 },
  };

  const revenueChartOption = {
    title: { text: '收入趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '收入(元)',
        type: 'bar',
        data: [12000, 19000, 15000, 22000, 28000, 35000],
        itemStyle: { color: '#1890ff' },
      },
    ],
  };

  const quickActions = [
    { icon: <CarOutlined />, title: '运力热力图', desc: '查看城市运力分布', path: '/admin/capacity', color: '#1890ff' },
    { icon: <RiseOutlined />, title: '价格监控', desc: '价格波动预警', path: '/admin/prices', color: '#52c41a' },
    { icon: <WarningOutlined />, title: '纠纷仲裁', desc: '处理纠纷申请', path: '/admin/disputes', color: '#fa8c16' },
    { icon: <TeamOutlined />, title: '用户管理', desc: '用户列表管理', path: '/admin/users', color: '#722ed1' },
    { icon: <ShoppingOutlined />, title: '订单管理', desc: '全平台订单', path: '/admin/orders', color: '#13c2c2' },
    { icon: <DollarOutlined />, title: '质检规则', desc: '质检引擎配置', path: '/admin/quality-rules', color: '#eb2f96' },
  ];

  return (
    <div className="page-container">
      <h2 style={{ marginBottom: 16 }}>📊 数据概览</h2>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="总用户数"
              value={stats.total_users || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="总订单数"
              value={stats.total_orders || 0}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="总交易额"
              value={stats.total_revenue || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="今日订单"
              value={stats.today_orders || 0}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card loading={loading}>
            <Statistic
              title="工人数"
              value={stats.workers || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card loading={loading}>
            <Statistic
              title="司机数"
              value={stats.drivers || 0}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card loading={loading}>
            <Statistic
              title="待处理纠纷"
              value={stats.pending_disputes || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <ReactECharts option={orderChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <ReactECharts option={revenueChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <h3 style={{ marginBottom: 16 }}>快捷操作</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {quickActions.map((action, index) => (
          <Card
            key={index}
            hoverable
            onClick={() => navigate(action.path)}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ 
                fontSize: 32, 
                color: action.color,
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: `${action.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {action.icon}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>{action.title}</div>
                <div style={{ color: '#8c8c8c', fontSize: 13 }}>{action.desc}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;
