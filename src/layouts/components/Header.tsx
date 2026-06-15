import { Layout, Input, Dropdown, Avatar, Badge, Button, Space, Tooltip } from 'antd';
import {
  SearchOutlined,
  BellOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import RoleSwitcher from './RoleSwitcher';

const { Header: AntHeader } = Layout;

export default function Header() {
  const navigate = useNavigate();
  const { user, role, logout } = useAuthStore();

  const notificationItems = [
    {
      key: '1',
      label: (
        <div className="py-1">
          <div className="text-sm font-medium text-gray-800">新简历投递</div>
          <div className="text-xs text-gray-500 mt-0.5">您发布的岗位收到 3 份新简历</div>
          <div className="text-xs text-gray-400 mt-1">5 分钟前</div>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <div className="py-1">
          <div className="text-sm font-medium text-gray-800">面试提醒</div>
          <div className="text-xs text-gray-500 mt-0.5">明天 10:00 有 2 场面试安排</div>
          <div className="text-xs text-gray-400 mt-1">1 小时前</div>
        </div>
      ),
    },
    {
      key: '3',
      label: (
        <div className="py-1">
          <div className="text-sm font-medium text-gray-800">系统通知</div>
          <div className="text-xs text-gray-500 mt-0.5">补贴申领流程已更新</div>
          <div className="text-xs text-gray-400 mt-1">昨天</div>
        </div>
      ),
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => {
        if (role === 'jobseeker') navigate('/jobseeker/profile');
        else if (role === 'enterprise') navigate('/enterprise/settings');
        else navigate('/admin/system');
      },
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账户设置',
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: <span className="text-red-500">退出登录</span>,
      onClick: () => {
        logout();
        navigate('/jobseeker/home');
      },
    },
  ];

  return (
    <AntHeader className="!bg-white !px-4 md:!px-6 flex items-center justify-between shadow-sm z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <div className="hidden md:block w-80">
          <Input
            placeholder="搜索职位、公司、技能..."
            prefix={<SearchOutlined className="text-gray-400" />}
            allowClear
            className="!rounded-lg"
            size="middle"
          />
        </div>
      </div>

      <Space size="middle" className="!flex-nowrap">
        <RoleSwitcher />

        <Tooltip title="消息通知">
          <Dropdown
            menu={{ items: notificationItems }}
            trigger={['click']}
            placement="bottomRight"
            dropdownRender={(menu) => (
              <div className="p-2 rounded-lg shadow-xl border border-gray-100 bg-white w-80">
                <div className="px-3 py-2 border-b border-gray-100 mb-1 flex items-center justify-between">
                  <span className="font-medium text-gray-800">消息通知</span>
                  <span className="text-xs text-primary-500 cursor-pointer hover:underline">
                    全部已读
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto">{menu}</div>
                <div className="mt-2 pt-2 border-t border-gray-100 text-center">
                  <Button type="link" size="small" className="text-primary-500">
                    查看全部消息
                  </Button>
                </div>
              </div>
            )}
          >
            <Badge count={3} size="small" offset={[-2, 2]}>
              <Button
                className="!h-9 !w-9 !border-gray-200 !rounded-lg"
                icon={<BellOutlined className="text-gray-600" />}
              />
            </Badge>
          </Dropdown>
        </Tooltip>

        <Dropdown
          menu={{ items: userMenuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors">
            <Avatar
              size={32}
              src={user?.avatar}
              icon={<UserOutlined />}
              className="!bg-primary-500"
            />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-sm font-medium text-gray-800 truncate max-w-[120px]">
                {user?.name || '未登录'}
              </span>
              <span className="text-xs text-gray-400">
                {role === 'jobseeker' ? '求职者' : role === 'enterprise' ? '企业HR' : '管理员'}
              </span>
            </div>
          </div>
        </Dropdown>
      </Space>
    </AntHeader>
  );
}
