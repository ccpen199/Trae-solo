import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Menu } from 'antd';
import { 
  UserOutlined, 
  ShoppingOutlined, 
  ShoppingCartOutlined, 
  AuditOutlined,
  FileTextOutlined,
  BarChartOutlined,
  EnvironmentOutlined,
  SoundOutlined
} from '@ant-design/icons';
import { Link, Outlet, useLocation } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import api from '../../utils/api';

function AdminDashboard() {
  const location = useLocation();
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [salesByCategory, setSalesByCategory] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data.stats);
      setRecentOrders(response.data.recentOrders);
      setSalesByCategory(response.data.salesByCategory);
    } catch (error) {
      console.error('加载仪表盘失败', error);
    }
  };

  const menuItems = [
    { key: '/admin/dashboard', label: <Link to="/admin/dashboard">数据概览</Link>, icon: <BarChartOutlined /> },
    { key: '/admin/content', label: <Link to="/admin/content">内容审核</Link>, icon: <AuditOutlined /> },
    { key: '/admin/subscription-health', label: <Link to="/admin/subscription-health">订阅健康度</Link>, icon: <FileTextOutlined /> },
    { key: '/admin/address-changes', label: <Link to="/admin/address-changes">地址变更审批</Link>, icon: <EnvironmentOutlined /> },
    { key: '/admin/outlets', label: <Link to="/admin/outlets">网点管理</Link>, icon: <EnvironmentOutlined /> },
    { key: '/admin/tickets', label: <Link to="/admin/tickets">工单管理</Link>, icon: <FileTextOutlined /> },
    { key: '/admin/ads', label: <Link to="/admin/ads">广告管理</Link>, icon: <SoundOutlined /> },
    { key: '/admin/digital', label: <Link to="/admin/digital">数字藏品</Link>, icon: <FileTextOutlined /> },
  ];

  const columns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no' },
    { title: '用户', dataIndex: 'username', key: 'username' },
    { title: '金额', dataIndex: 'total_amount', key: 'total_amount', render: (val) => `¥${val}` },
    { title: '状态', dataIndex: 'status', key: 'status' },
    { title: '时间', dataIndex: 'created_at', key: 'created_at' },
  ];

  const chartOption = {
    title: { text: '销售分类统计' },
    tooltip: {},
    xAxis: { data: salesByCategory.map(item => item.category) },
    yAxis: {},
    series: [{
      name: '销售额',
      type: 'bar',
      data: salesByCategory.map(item => item.total_sales || 0)
    }]
  };

  const isOverview = location.pathname === '/admin' || location.pathname === '/admin/dashboard';

  if (!isOverview) {
    return (
      <div style={{ display: 'flex' }}>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ width: 200, height: '100%', borderRight: 0 }}
        />
        <div style={{ flex: 1, paddingLeft: 24 }}>
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex' }}>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        style={{ width: 200, height: '100%', borderRight: 0 }}
      />
      <div style={{ flex: 1, paddingLeft: 24 }}>
        <h1 style={{ marginBottom: 24 }}>管理后台</h1>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="注册用户"
                value={stats.userCount}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="在售商品"
                value={stats.productCount}
                prefix={<ShoppingOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="订单总数"
                value={stats.orderCount}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="待处理工单"
                value={stats.pendingTickets}
                valueStyle={{ color: '#cf1322' }}
                prefix={<AuditOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Card title="销售统计">
              <ReactECharts option={chartOption} style={{ height: 300 }} />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="最近订单">
              <Table
                columns={columns}
                dataSource={recentOrders}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default AdminDashboard;
