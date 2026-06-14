import React, { useMemo } from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  BellOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const { Sider } = Layout;

export interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  className?: string;
}

const menuConfig = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '监管大屏',
  },
  {
    key: '/places',
    icon: <ShopOutlined />,
    label: '场所备案',
    children: [
      { key: '/places', icon: null, label: '场所列表' },
    ],
  },
  {
    key: '/verification',
    icon: <CheckCircleOutlined />,
    label: '实名核验',
    children: [
      { key: '/verification', icon: null, label: '核验记录' },
    ],
  },
  {
    key: '/reservation',
    icon: <CalendarOutlined />,
    label: '预约分流',
    children: [
      { key: '/reservation', icon: null, label: '预约记录' },
      { key: '/reservation/config', icon: null, label: '预约配置' },
    ],
  },
  {
    key: '/alarms',
    icon: <BellOutlined />,
    label: 'AI告警',
    children: [
      { key: '/alarms', icon: null, label: '告警列表' },
    ],
  },
  {
    key: '/inspection',
    icon: <FileTextOutlined />,
    label: '巡检任务',
    children: [
      { key: '/inspection', icon: null, label: '任务列表' },
      { key: '/inspection/create', icon: null, label: '创建任务' },
    ],
  },
  {
    key: '/analytics',
    icon: <BarChartOutlined />,
    label: '经营数据',
    children: [
      { key: '/analytics', icon: null, label: '数据分析' },
      { key: '/analytics/reports', icon: null, label: '数据上报' },
    ],
  },
  {
    key: '/system',
    icon: <SettingOutlined />,
    label: '系统管理',
    children: [
      { key: '/system/users', icon: null, label: '用户管理' },
      { key: '/system/roles', icon: null, label: '角色权限' },
      { key: '/system/logs', icon: null, label: '日志审计' },
      { key: '/system/security', icon: null, label: '等保配置' },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse, className }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedKeys = useMemo(() => [location.pathname], [location.pathname]);

  const openKeys = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length > 1) {
      return ['/' + segments[0]];
    }
    return [];
  }, [location.pathname]);

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key !== location.pathname) {
      navigate(key);
    }
  };

  return (
    <Sider
      width={220}
      collapsedWidth={64}
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      trigger={null}
      className="bg-white border-r border-neutral-100"
      theme="light"
    >
      <div className="h-16 flex items-center justify-center border-b border-neutral-100 bg-gradient-to-r from-[#165DFF] to-[#4080FF]">
        {collapsed ? (
          <span className="text-white text-xl font-bold">鲁</span>
        ) : (
          <div className="flex items-center gap-2 px-4">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-white text-lg">🏛</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white text-sm font-bold leading-tight">文旅监管平台</span>
              <span className="text-blue-200 text-[10px] leading-tight">Smart Supervision</span>
            </div>
          </div>
        )}
      </div>

      <div className="py-2 overflow-y-auto" style={{ height: 'calc(100vh - 64px)' }}>
        <Menu
          mode="inline"
          items={menuConfig}
          selectedKeys={selectedKeys}
          defaultOpenKeys={openKeys}
          onClick={handleMenuClick}
          className="!border-r-0 !bg-transparent"
          theme="light"
        />
      </div>
    </Sider>
  );
};

export default Sidebar;
