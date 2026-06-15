import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getMenuByRole, findMenuByPath } from '../menuConfig';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';

const { Sider } = Layout;

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ collapsed: controlledCollapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuthStore();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const menus = getMenuByRole(role);

  const selectedKeys = findMenuByPath(menus, location.pathname).map((m) => m.key);
  const menuItems = menus.map((m) => ({
    key: m.key,
    icon: m.icon,
    label: m.label,
  }));

  useEffect(() => {
    if (!location.pathname.startsWith('/jobseeker') && !location.pathname.startsWith('/enterprise') && !location.pathname.startsWith('/admin')) {
      return;
    }
  }, [location.pathname]);

  const handleMenuClick = ({ key }: { key: string }) => {
    const menu = menus.find((m) => m.key === key);
    if (menu) {
      navigate(menu.path);
    }
  };

  const roleLabel: Record<string, string> = {
    jobseeker: '求职者端',
    enterprise: '企业端',
    admin: '管理后台',
  };

  const roleColor: Record<string, string> = {
    jobseeker: 'from-primary-500 to-primary-600',
    enterprise: 'from-accent-500 to-accent-600',
    admin: 'from-gray-700 to-gray-800',
  };

  const toggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalCollapsed(!collapsed);
    }
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={240}
      className="!bg-white border-r border-gray-100 shadow-sm"
      theme="light"
    >
      <div
        className={`h-16 flex items-center px-4 border-b border-gray-100 bg-gradient-to-r ${roleColor[role]} cursor-pointer transition-all duration-300`}
      >
        <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
          <span className="text-white font-bold text-lg">南</span>
        </div>
        {!collapsed && (
          <div className="ml-3 flex flex-col justify-center overflow-hidden">
            <span className="text-white font-semibold text-base truncate">华南智造招聘</span>
            <span className="text-white/80 text-xs truncate">{roleLabel[role]}</span>
          </div>
        )}
      </div>

      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        items={menuItems}
        onClick={handleMenuClick}
        className="!border-r-0 !py-3"
        style={{ height: 'calc(100vh - 64px - 48px)', overflowY: 'auto' }}
      />

      <div
        className="h-12 flex items-center justify-center border-t border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={toggle}
      >
        {collapsed ? (
          <MenuUnfoldOutlined className="text-gray-500" />
        ) : (
          <div className="flex items-center text-gray-500 text-sm">
            <MenuFoldOutlined className="mr-2" />
            <span>收起菜单</span>
          </div>
        )}
      </div>
    </Sider>
  );
}
