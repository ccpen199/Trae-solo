import { Dropdown, Button, message } from 'antd';
import {
  UserOutlined,
  SwapOutlined,
  UserSwitchOutlined,
  ShopOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuthStore, UserRole } from '@/store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const roleOptions: Array<{
  key: UserRole;
  label: string;
  icon: React.ReactNode;
  color: string;
  redirectPath: string;
}> = [
  {
    key: 'jobseeker',
    label: '求职者端',
    icon: <UserOutlined className="text-primary-500" />,
    color: 'bg-primary-50 border-primary-200 hover:bg-primary-100',
    redirectPath: '/jobseeker/home',
  },
  {
    key: 'enterprise',
    label: '企业端',
    icon: <ShopOutlined className="text-accent-500" />,
    color: 'bg-accent-50 border-accent-200 hover:bg-accent-100',
    redirectPath: '/enterprise/dashboard',
  },
  {
    key: 'admin',
    label: '后台管理',
    icon: <SettingOutlined className="text-gray-700" />,
    color: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
    redirectPath: '/admin/summary',
  },
];

export default function RoleSwitcher() {
  const { role, switchRole } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const currentOption = roleOptions.find((o) => o.key === role) || roleOptions[0];

  const handleRoleChange = (newRole: UserRole) => {
    if (newRole === role) return;
    const option = roleOptions.find((o) => o.key === newRole);
    switchRole(newRole);
    if (option) {
      navigate(option.redirectPath);
      message.success(`已切换至${option.label}`);
    }
  };

  useEffect(() => {
    const prefixRoleMap: Record<string, UserRole> = {
      '/jobseeker': 'jobseeker',
      '/enterprise': 'enterprise',
      '/admin': 'admin',
    };

    let matchedRole: UserRole | null = null;
    for (const [prefix, r] of Object.entries(prefixRoleMap)) {
      if (location.pathname.startsWith(prefix)) {
        matchedRole = r;
        break;
      }
    }

    if (matchedRole && matchedRole !== role) {
      switchRole(matchedRole);
    }
  }, [location.pathname, role, switchRole]);

  const items = roleOptions.map((opt) => ({
    key: opt.key,
    icon: opt.icon,
    label: (
      <div className={`flex items-center py-1 ${role === opt.key ? 'font-semibold' : ''}`}>
        <span className="mr-2">{opt.label}</span>
        {role === opt.key && (
          <span className="text-xs text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">
            当前
          </span>
        )}
      </div>
    ),
    onClick: () => handleRoleChange(opt.key),
  }));

  return (
    <Dropdown
      menu={{ items }}
      trigger={['click']}
      placement="bottomRight"
      dropdownRender={(menu) => (
        <div className="p-2 rounded-lg shadow-xl border border-gray-100 bg-white min-w-[200px]">
          <div className="px-3 py-2 border-b border-gray-100 mb-1">
            <div className="text-xs text-gray-400 flex items-center">
              <SwapOutlined className="mr-1" />
              快速切换角色
            </div>
          </div>
          {menu}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="px-3 py-1 text-xs text-gray-400">
              切换后将跳转到对应首页
            </div>
          </div>
        </div>
      )}
    >
      <Button
        className="!h-9 !border-gray-200 hover:!border-primary-300 hover:!text-primary-500 transition-all"
        icon={<UserSwitchOutlined className="text-primary-500" />}
      >
        <span className="hidden sm:inline">{currentOption.label}</span>
      </Button>
    </Dropdown>
  );
}
