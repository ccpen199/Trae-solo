import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu, Typography, Tag, Result, Button, Spin } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  PayCircleOutlined,
  ShopOutlined,
  FundOutlined,
  TeamOutlined,
  HeatMapOutlined,
  AlertOutlined,
  BarChartOutlined,
  FileSearchOutlined,
  ControlOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

const routeComponents = {
  '/': { name: '运营概览', key: 'dashboard', loader: () => import('../pages/Dashboard') },
  '/admin': { name: '后台管理', key: 'admin', loader: () => import('../pages/admin/AdminDashboard') },
  '/credit': { name: '农户/商户画像', key: 'credit-list', loader: () => import('../pages/credit/CreditProfiles') },
  '/credit/new': { name: '新增画像', key: 'credit-new', loader: () => import('../pages/credit/CreditProfileForm') },
  '/payment': { name: '缴费中枢', key: 'payment-hub', loader: () => import('../pages/payment/PaymentHub') },
  '/payment/orders': { name: '缴费记录', key: 'payment-orders', loader: () => import('../pages/payment/PaymentOrders') },
  '/business/merchants': { name: '商户管理', key: 'merchants', loader: () => import('../pages/business/Merchants') },
  '/business/coupons': { name: '优惠券管理', key: 'coupons', loader: () => import('../pages/business/Coupons') },
  '/business/installments': { name: '分期申请', key: 'installments', loader: () => import('../pages/business/Installments') },
  '/finance/products': { name: '金融产品', key: 'finance-products', loader: () => import('../pages/finance/FinanceProducts') },
  '/finance/loans': { name: '贷款申请', key: 'loan-apps', loader: () => import('../pages/finance/LoanApplications') },
  '/finance/livestock': { name: '活体抵押', key: 'livestock', loader: () => import('../pages/finance/LivestockMortgage') },
  '/coordinator': { name: '协理员', key: 'coordinator', loader: () => import('../pages/coordinator/CoordinatorTasks') },
  '/analytics/vitality': { name: '活力指数', key: 'vitality', loader: () => import('../pages/analytics/VitalityIndex') },
  '/analytics/heatmap': { name: '热力图', key: 'heatmap', loader: () => import('../pages/analytics/FinanceHeatmap') },
  '/analytics/npl': { name: '不良率预警', key: 'npl', loader: () => import('../pages/analytics/NplWarning') },
  '/analytics/logs': { name: '系统日志', key: 'logs', loader: () => import('../pages/analytics/SystemLogs') },
};

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '运营概览' },
  { key: '/admin', icon: <ControlOutlined />, label: '后台管理' },
  {
    key: 'credit-group',
    icon: <UserOutlined />,
    label: '信用画像',
    children: [
      { key: '/credit', label: '农户/商户画像' },
    ],
  },
  {
    key: 'payment-group',
    icon: <PayCircleOutlined />,
    label: '生活缴费',
    children: [
      { key: '/payment', label: '缴费中枢' },
      { key: '/payment/orders', label: '缴费记录' },
    ],
  },
  {
    key: 'business-group',
    icon: <ShopOutlined />,
    label: '本地商圈',
    children: [
      { key: '/business/merchants', label: '商户管理' },
      { key: '/business/coupons', label: '优惠券管理' },
      { key: '/business/installments', label: '消费分期' },
    ],
  },
  {
    key: 'finance-group',
    icon: <FundOutlined />,
    label: '金融产品',
    children: [
      { key: '/finance/products', label: '产品工厂' },
      { key: '/finance/loans', label: '贷款申请' },
      { key: '/finance/livestock', label: '活体抵押' },
    ],
  },
  {
    key: 'coordinator-group',
    icon: <TeamOutlined />,
    label: '协理员',
    children: [
      { key: '/coordinator', label: '任务管理' },
    ],
  },
  {
    key: 'analytics-group',
    icon: <BarChartOutlined />,
    label: '数据分析',
    children: [
      { key: '/analytics/vitality', icon: <HeatMapOutlined />, label: '县域活力指数' },
      { key: '/analytics/heatmap', icon: <HeatMapOutlined />, label: '普惠可得性热力图' },
      { key: '/analytics/npl', icon: <AlertOutlined />, label: '不良率预警' },
      { key: '/analytics/logs', icon: <FileSearchOutlined />, label: '系统日志' },
    ],
  },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKeys = [location.pathname];
  const openKeys = ['credit-group', 'payment-group', 'business-group', 'finance-group', 'coordinator-group', 'analytics-group'];

  const renderPageContent = () => {
    const path = location.pathname;
    const exactRoute = routeComponents[path];

    if (exactRoute) {
      const LazyPage = React.lazy(exactRoute.loader);
      return (
        <React.Suspense key={exactRoute.key} fallback={<Spin size="large" style={{ display: 'block', margin: '80px auto' }} />}>
          <div style={{ minHeight: 400 }}>
            <LazyPage />
          </div>
        </React.Suspense>
      );
    }

    if (path.startsWith('/credit/') && path !== '/credit/new') {
      const LazyDetail = React.lazy(() => import('../pages/credit/CreditProfileDetail'));
      return (
        <React.Suspense key="credit-detail" fallback={<Spin size="large" style={{ display: 'block', margin: '80px auto' }} />}>
          <div style={{ minHeight: 400 }}>
            <LazyDetail />
          </div>
        </React.Suspense>
      );
    }

    return (
      <Result
        key="welcome"
        status="info"
        title="欢迎使用山西农信普惠金融服务平台"
        subTitle="请从左侧菜单选择业务模块开始办理"
        extra={[
          <Button type="primary" key="dashboard" onClick={() => navigate('/')}>
            进入运营概览
          </Button>,
          <Button key="payment" onClick={() => navigate('/payment')}>
            生活缴费中枢
          </Button>,
          <Button key="credit" onClick={() => navigate('/credit')}>
            信用画像
          </Button>,
        ]}
      />
    );
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ width: collapsed ? 80 : 220, background: '#fff', borderRight: '1px solid #f0f0f0', flexShrink: 0 }}>
          <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0' }}>
            <Title level={5} style={{ margin: 0, color: '#1B5E20', whiteSpace: 'nowrap', fontSize: collapsed ? 12 : 15 }}>
              {collapsed ? '晋信' : '山西农信普惠金融'}
            </Title>
          </div>
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            defaultOpenKeys={openKeys}
            onClick={({ key }) => navigate(key)}
            items={menuItems}
            style={{ borderRight: 0 }}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#f5f5f5' }}>
          <div style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0', height: 56, flexShrink: 0 }}>
            <Title level={4} style={{ margin: 0, color: '#1B5E20' }}>
              山西农信区域性普惠金融服务平台
            </Title>
            <div style={{ marginLeft: 'auto', color: '#666', fontSize: 14 }}>
              <Link to="/admin" style={{ display: 'inline-block', marginRight: 8 }}>
                <Tag color="green" style={{ marginRight: 0 }}>后台管理</Tag>
              </Link>
              对接：人行征信 | 农业农村部 | 地方政务服务平台
            </div>
          </div>
          <div style={{ margin: 16, padding: 20, background: '#fff', borderRadius: 8, minHeight: 280, overflow: 'auto', flex: 1 }}>
            {renderPageContent()}
          </div>
          <div style={{ textAlign: 'center', color: '#999', padding: '12px 0', flexShrink: 0, background: '#fff' }}>
            山西农信区域性普惠金融服务平台 ©2026
          </div>
        </div>
      </div>
    </div>
  );
}
