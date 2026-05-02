import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, List, Badge, Spin, Alert } from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  InboxOutlined,
  CustomerServiceOutlined,
  WarningOutlined,
  ShopOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import * as echarts from 'echarts';
import { analyticsAPI } from '../services/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await analyticsAPI.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    );
  }

  const statCards = [
    {
      title: '今日订单',
      value: dashboardData?.todayOrders || 0,
      icon: <ShoppingCartOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
      color: '#e6f7ff',
      onClick: () => navigate('/orders')
    },
    {
      title: '今日销售额',
      value: `$${(dashboardData?.todayRevenue || 0).toFixed(2)}`,
      icon: <DollarOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      color: '#f6ffed',
      suffix: dashboardData?.todayRevenue > 0 ? <RiseOutlined /> : null,
      onClick: () => navigate('/analytics')
    },
    {
      title: '待发货订单',
      value: dashboardData?.pendingShipments || 0,
      icon: <InboxOutlined style={{ fontSize: 24, color: '#faad14' }} />,
      color: '#fffbe6',
      onClick: () => navigate('/warehouse')
    },
    {
      title: '待处理售后',
      value: dashboardData?.pendingAfterSales || 0,
      icon: <CustomerServiceOutlined style={{ fontSize: 24, color: '#f5222d' }} />,
      color: '#fff1f0',
      onClick: () => navigate('/customer-service')
    }
  ];

  const alertLevelColors: Record<string, string> = {
    error: 'red',
    warning: 'orange',
    info: 'blue'
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>仪表板</h1>

      <Row gutter={[16, 16]}>
        {statCards.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              hoverable
              onClick={stat.onClick}
              style={{ borderRadius: 8 }}
              bodyStyle={{ padding: 20 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Statistic
                    title={stat.title}
                    value={stat.value}
                    suffix={stat.suffix}
                    valueStyle={{ fontSize: 24, fontWeight: 'bold' }}
                  />
                </div>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: stat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {stat.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <WarningOutlined style={{ color: '#faad14' }} />
                <span>预警信息</span>
                <Badge count={dashboardData?.recentAlerts?.length || 0} style={{ marginLeft: 8 }} />
              </div>
            }
            extra={<a onClick={() => navigate('/alerts')}>查看全部</a>}
          >
            {dashboardData?.recentAlerts?.length > 0 ? (
              <List
                size="small"
                dataSource={dashboardData.recentAlerts}
                renderItem={(item: any) => (
                  <List.Item>
                    <Badge status={alertLevelColors[item.level] as any} />
                    <span style={{ flex: 1 }}>{item.message}</span>
                    <span style={{ color: '#999', fontSize: 12 }}>
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </List.Item>
                )}
              />
            ) : (
              <Alert message="暂无预警信息" type="success" showIcon />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShopOutlined style={{ color: '#1890ff' }} />
                <span>低库存预警</span>
                <Badge count={dashboardData?.lowStockSKUs || 0} style={{ marginLeft: 8 }} />
              </div>
            }
            extra={<a onClick={() => navigate('/products')}>查看全部</a>}
          >
            {dashboardData?.lowStockItems?.length > 0 ? (
              <List
                size="small"
                dataSource={dashboardData.lowStockItems}
                renderItem={(item: any) => (
                  <List.Item>
                    <Badge status="error" />
                    <span style={{ flex: 1 }}>{item.sku_code}</span>
                    <span style={{ color: '#f5222d' }}>
                      库存: {item.stock} / 最低: {item.min_stock}
                    </span>
                  </List.Item>
                )}
              />
            ) : (
              <Alert message="库存充足" type="success" showIcon />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="快捷操作">
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Badge count={dashboardData?.totalShops || 0} style={{ backgroundColor: '#1890ff' }}>
                <a
                  onClick={() => navigate('/shops')}
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    background: '#e6f7ff',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  <ShopOutlined /> 店铺管理
                </a>
              </Badge>
              <a
                onClick={() => navigate('/products')}
                style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  background: '#f6ffed',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                <InboxOutlined /> 商品管理
              </a>
              <a
                onClick={() => navigate('/orders')}
                style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  background: '#fffbe6',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                <ShoppingCartOutlined /> 订单管理
              </a>
              <a
                onClick={() => navigate('/analytics')}
                style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  background: '#fff1f0',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                <DollarOutlined /> 利润报表
              </a>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;