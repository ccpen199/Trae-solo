import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Tag, Progress, List } from 'antd';
import {
  UserOutlined,
  ShopOutlined,
  ProjectOutlined,
  AppstoreOutlined,
  FileSearchOutlined,
  AlertOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getDashboardStats, getMaterialPrices, getComplaints } from '../api';

const { Title, Text } = Typography;

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [materialPrices, setMaterialPrices] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [statsRes, pricesRes, complaintsRes] = await Promise.all([
      getDashboardStats(),
      getMaterialPrices({ pageSize: 10 }),
      getComplaints({ pageSize: 5 })
    ]);
    if (statsRes.code === 200) setStats(statsRes.data);
    if (pricesRes.code === 200) setMaterialPrices(pricesRes.data.list);
    if (complaintsRes.code === 200) setRecentComplaints(complaintsRes.data.list);
    setLoading(false);
  };

  const projectStatusChart = stats?.projectsByStatus ? {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false, position: 'center' },
      emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } },
      data: stats.projectsByStatus.map(s => ({
        name: { pending: '待启动', in_progress: '进行中', completed: '已完成', paused: '已暂停' }[s.status] || s.status,
        value: s.count
      }))
    }]
  } : {};

  const complaintTypeChart = stats?.complaintsByType ? {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: stats.complaintsByType.map(c => c.type) },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: stats.complaintsByType.map(c => c.count),
      itemStyle: { color: '#1890ff' },
      barWidth: '40%'
    }]
  } : {};

  const priceTrendChart = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['水泥', '钢筋', '木材', '瓷砖'] },
    xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
    yAxis: { type: 'value' },
    series: [
      { name: '水泥', type: 'line', data: [420, 430, 450, 445, 460, 470], smooth: true },
      { name: '钢筋', type: 'line', data: [5200, 5350, 5100, 5400, 5500, 5600], smooth: true },
      { name: '木材', type: 'line', data: [1800, 1850, 1900, 1950, 2000, 2100], smooth: true },
      { name: '瓷砖', type: 'line', data: [128, 130, 128, 132, 135, 138], smooth: true }
    ]
  };

  if (!stats) return <div>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>数据看板</Title>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>注册用户</span>}
              value={stats.overview.totalUsers}
              prefix={<UserOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>装修公司</span>}
              value={stats.overview.totalCompanies}
              prefix={<ShopOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>在建项目</span>}
              value={stats.overview.totalProjects}
              prefix={<ProjectOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>案例总数</span>}
              value={stats.overview.totalCases}
              prefix={<AppstoreOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card size="small" title="待处理事项">
            <List
              size="small"
              dataSource={[
                { icon: <FileSearchOutlined />, label: '待审核公司', count: stats.overview.pendingAudits, color: 'orange' },
                { icon: <AlertOutlined />, label: '待处理投诉', count: stats.overview.pendingComplaints, color: 'red' },
                { icon: <ProjectOutlined />, label: '进行中项目', count: stats.overview.inProgressProjects, color: 'blue' }
              ]}
              renderItem={item => (
                <List.Item>
                  <span style={{ color: item.color }}>{item.icon}</span>
                  <span style={{ marginLeft: 8 }}>{item.label}</span>
                  <Tag color={item.color} style={{ marginLeft: 'auto' }}>{item.count}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} sm={16}>
          <Card size="small" title="建材价格走势">
            <ReactECharts option={priceTrendChart} style={{ height: 200 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card size="small" title="项目状态分布">
            <ReactECharts option={projectStatusChart} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="投诉类型分布">
            <ReactECharts option={complaintTypeChart} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card size="small" title="最近投诉">
            <List
              size="small"
              dataSource={recentComplaints}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={item.title}
                    description={
                      <div>
                        <Text type="secondary">{item.type} · </Text>
                        <Text type="secondary">{item.complainant_name}</Text>
                      </div>
                    }
                  />
                  <Tag color={item.status === 'pending' ? 'orange' : 'green'}>
                    {item.status === 'pending' ? '待处理' : '已处理'}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="建材价格异动">
            <List
              size="small"
              dataSource={materialPrices.slice(0, 6)}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={item.material_name}
                    description={
                      <span>
                        {item.specification} · {item.brand} · ¥{item.price}/{item.unit}
                      </span>
                    }
                  />
                  {item.change_rate > 0 ? (
                    <span style={{ color: '#f5222d' }}><RiseOutlined /> {item.change_rate}%</span>
                  ) : item.change_rate < 0 ? (
                    <span style={{ color: '#52c41a' }}><FallOutlined /> {Math.abs(item.change_rate)}%</span>
                  ) : (
                    <span style={{ color: '#888' }}>-</span>
                  )}
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
