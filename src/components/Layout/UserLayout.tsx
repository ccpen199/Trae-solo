import React, { useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Badge, Button } from 'antd';
import {
  HomeOutlined,
  CreditCardOutlined,
  NotificationOutlined,
  EnvironmentOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  FileTextOutlined,
  BellOutlined,
  FileSearchOutlined,
  ExportOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import type { MenuProps } from 'antd';

const { Header, Content, Footer } = Layout;

const UserLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLogin, logout } = useUserStore();

  const menuItems: MenuProps['items'] = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    {
      key: '/payment',
      icon: <CreditCardOutlined />,
      label: '缴费中心',
      children: [
        { key: '/payment/bills', icon: <CreditCardOutlined />, label: '账单查询 · 在线缴费' },
        { key: '/payment/records', icon: <FileTextOutlined />, label: '缴费记录 · 历史明细' },
        { key: '/payment/voucher', icon: <FileSearchOutlined />, label: '电子凭证 · 发票下载' },
        { key: '/payment/export', icon: <ExportOutlined />, label: '全量导出 · Excel报表' },
      ],
    },
    { key: '/announcements', icon: <NotificationOutlined />, label: '公告通知' },
    { key: '/service-map', icon: <EnvironmentOutlined />, label: '服务网点' },
  ];

  const getSelectedKeys = () => {
    if (location.pathname === '/') return ['/'];
    if (location.pathname.startsWith('/payment')) return ['/payment'];
    return [location.pathname];
  };
  const selectedKeys = getSelectedKeys();
  const openKeys = ['/payment'];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'work-orders',
      icon: <FileTextOutlined />,
      label: '我的工单',
      onClick: () => navigate('/profile/work-orders'),
    },
    {
      key: 'messages',
      icon: <BellOutlined />,
      label: '消息通知',
      onClick: () => navigate('/profile/messages'),
    },
    {
      key: 'household',
      icon: <SettingOutlined />,
      label: '户号管理',
      onClick: () => navigate('/household'),
    },
    { type: 'divider' },
    {
      key: 'payment-records',
      icon: <FileTextOutlined />,
      label: '缴费记录',
      onClick: () => navigate('/payment/records'),
    },
    {
      key: 'voucher',
      icon: <FileSearchOutlined />,
      label: '电子凭证',
      onClick: () => navigate('/payment/voucher'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  useEffect(() => {
    if (!isLogin) {
      const publicPaths = ['/', '/login', '/announcements', '/service-map', '/payment', '/payment/bills', '/payment/records', '/payment/voucher', '/payment/export', '/household', '/profile', '/admin/login'];
      const isPublicPath = publicPaths.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'));
      if (!isPublicPath) {
        navigate('/login');
      }
    }
  }, [isLogin, location.pathname, navigate]);

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Header className="bg-white shadow-sm px-6 sticky top-0 z-50 h-auto leading-normal">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-full py-3">
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <div
              className="flex items-center gap-2 cursor-pointer shrink-0"
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">爱</span>
              </div>
              <span className="text-xl font-bold text-gray-800">爱众公用事业服务</span>
            </div>

            <Menu
              mode="horizontal"
              selectedKeys={selectedKeys}
              defaultOpenKeys={openKeys}
              items={menuItems}
              onClick={({ key }) => navigate(key)}
              className="border-0 min-w-0 flex-1"
              style={{ lineHeight: '40px' }}
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Badge count={3} size="small">
              <Button
                type="text"
                icon={<BellOutlined className="text-lg" />}
                onClick={() => navigate('/profile/messages')}
              />
            </Badge>

            <Button
              type="text"
              icon={<DashboardOutlined className="text-lg" />}
              onClick={() => navigate('/admin/login')}
              title="管理后台"
            >
              <span className="hidden sm:inline text-sm">后台</span>
            </Button>

            {isLogin && user ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                  <Avatar size={36} icon={<UserOutlined />} className="bg-primary-500" />
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-800">{user.nickname}</div>
                    <div className="text-xs text-gray-500">{user.realNameStatus === 1 ? '已实名' : '未实名'}</div>
                  </div>
                </div>
              </Dropdown>
            ) : (
              <div className="flex items-center gap-2">
                <Button type="primary" onClick={() => navigate('/login')}>
                  登录
                </Button>
                <Button onClick={() => navigate('/login')}>
                  注册
                </Button>
              </div>
            )}
          </div>
        </div>
      </Header>

      <Content className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </Content>

      <Footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-3">缴费业务</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a className="hover:text-primary-500 cursor-pointer" onClick={() => navigate('/payment/bills')}>账单查询</a></li>
                <li><a className="hover:text-primary-500 cursor-pointer" onClick={() => navigate('/payment/records')}>缴费记录</a></li>
                <li><a className="hover:text-primary-500 cursor-pointer" onClick={() => navigate('/payment/voucher')}>电子凭证</a></li>
                <li><a className="hover:text-primary-500 cursor-pointer" onClick={() => navigate('/payment/export')}>全量导出</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-3">公告信息</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a className="hover:text-primary-500 cursor-pointer" onClick={() => navigate('/announcements')}>停供公告</a></li>
                <li><a className="hover:text-primary-500 cursor-pointer" onClick={() => navigate('/announcements')}>抢修公告</a></li>
                <li><a className="hover:text-primary-500 cursor-pointer" onClick={() => navigate('/announcements')}>价格调整</a></li>
                <li><a className="hover:text-primary-500 cursor-pointer" onClick={() => navigate('/announcements')}>通知公告</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-3">服务网点</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a className="hover:text-primary-500 cursor-pointer" onClick={() => navigate('/service-map')}>网点查询</a></li>
                <li><a className="hover:text-primary-500 cursor-pointer" onClick={() => navigate('/service-map')}>排队状态</a></li>
                <li><a className="hover:text-primary-500 cursor-pointer" onClick={() => navigate('/service-map')}>在线预约</a></li>
                <li><a className="hover:text-primary-500 cursor-pointer" onClick={() => navigate('/household')}>户号管理</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-3">用户中心</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a className="hover:text-primary-500 cursor-pointer" onClick={() => navigate('/profile')}>个人中心</a></li>
                <li><a className="hover:text-primary-500 cursor-pointer" onClick={() => navigate('/profile/work-orders')}>我的工单</a></li>
                <li><a className="hover:text-primary-500 cursor-pointer" onClick={() => navigate('/household')}>绑定户号</a></li>
                <li><a className="hover:text-primary-500 cursor-pointer" onClick={() => navigate('/profile')}>实名认证</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-3">帮助与支持</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a className="hover:text-primary-500 cursor-pointer">关于我们</a></li>
                <li><a className="hover:text-primary-500 cursor-pointer">服务条款</a></li>
                <li><a className="hover:text-primary-500 cursor-pointer">隐私政策</a></li>
                <li><a className="hover:text-primary-500 cursor-pointer">帮助中心</a></li>
              </ul>
            </div>
          </div>
          <Divider />
          <div className="text-center text-gray-500 text-sm">
            <div className="flex items-center justify-center gap-6 mb-2">
              <span>客服热线：<strong className="text-primary-600">962960</strong></span>
              <span>服务时间：7×24小时</span>
              <span className="hidden md:inline">监管平台：四川省能源监管平台（已接入）</span>
            </div>
            <div>© 2024 爱众公用事业有限公司 版权所有 | 蜀ICP备XXXXXXXX号</div>
            <div className="mt-1 text-xs text-gray-400">
              本系统已对接四川省能源监管平台，数据实时同步；所有交易数据已备案，可追溯可审计
            </div>
          </div>
        </div>
      </Footer>
    </Layout>
  );
};

const Divider: React.FC = () => <div className="border-t border-gray-200 my-4" />;

export default UserLayout;
