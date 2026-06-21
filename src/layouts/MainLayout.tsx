import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  Home,
  Search,
  FileText,
  CreditCard,
  Wrench,
  Tent,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Bell,
  User,
  ChevronDown,
  LogOut,
  Settings,
  UserCircle,
} from 'lucide-react';
import { Avatar, Badge, Dropdown, Breadcrumb } from 'antd';
import { cn } from '@/lib/utils';

// 菜单项配置 (与路由定义完全一致)
const menuItems = [
  { key: 'dashboard', label: '数据看板', icon: LayoutDashboard, path: '/dashboard' },
  { key: 'landlord-audit', label: '房东审核', icon: ShieldCheck, path: '/landlord/audit' },
  { key: 'property-list', label: '房源列表', icon: Home, path: '/property/list' },
  { key: 'property-search', label: '房源搜索', icon: Search, path: '/property/search' },
  { key: 'contract', label: '合同管理', icon: FileText, path: '/contract/list' },
  { key: 'credit', label: '信用管理', icon: CreditCard, path: '/credit/manage' },
  { key: 'workorder', label: '维修工单', icon: Wrench, path: '/service/workorder' },
  { key: 'emergency', label: '应急安置', icon: Tent, path: '/service/emergency' },
  { key: 'audit-log', label: '审计日志', icon: ClipboardList, path: '/audit/logs' },
];

// 用户下拉菜单
const userMenuItems = [
  { key: 'profile', label: '个人中心', icon: UserCircle },
  { key: 'settings', label: '系统设置', icon: Settings },
  { type: 'divider' as const },
  { key: 'logout', label: '退出登录', icon: LogOut, danger: true },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // 根据当前路径生成面包屑
  const currentItem = menuItems.find((item) => location.pathname.startsWith(item.path));

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ink-50">
      {/* 左侧 Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-brand-700 text-white transition-all duration-300 ease-in-out',
          collapsed ? 'w-[72px]' : 'w-[220px]'
        )}
      >
        {/* Logo 区域 */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-brand-600 transition-all duration-300',
            collapsed ? 'justify-center px-2' : 'px-5'
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500">
            <Home className="h-5 w-5" />
          </div>
          {!collapsed && (
            <span className="ml-3 whitespace-nowrap text-lg font-semibold tracking-wide">
              租房履约SaaS
            </span>
          )}
        </div>

        {/* 菜单列表 */}
        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <li key={item.key}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      collapsed ? 'justify-center' : '',
                      isActive
                        ? 'bg-brand-500/90 text-white shadow-inner'
                        : 'text-brand-100/80 hover:bg-brand-600/50 hover:text-white'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 shrink-0 transition-transform duration-200',
                        isActive ? '' : 'group-hover:scale-105'
                      )}
                    />
                    {!collapsed && (
                      <span className="ml-3 whitespace-nowrap animate-fade-in">
                        {item.label}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 折叠按钮 */}
        <div className="shrink-0 border-t border-brand-600 p-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center rounded-lg bg-brand-600/40 p-2 text-brand-100 transition-colors hover:bg-brand-600/70 hover:text-white"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>

      {/* 右侧内容区 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 顶部 Topbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-ink-200 bg-white px-6 shadow-sm">
          {/* 面包屑 */}
          <div className="flex items-center">
            <Breadcrumb
              items={[
                { title: '首页' },
                ...(currentItem ? [{ title: currentItem.label }] : []),
              ]}
              className="text-sm"
            />
          </div>

          {/* 右侧操作区 */}
          <div className="flex items-center space-x-4">
            {/* 通知铃铛 */}
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-100 hover:text-brand-600">
              <Badge count={3} size="small">
                <Bell className="h-5 w-5" />
              </Badge>
            </button>

            {/* 用户头像下拉 */}
            <Dropdown
              menu={{
                items: userMenuItems.map((item: any) => ({
                  key: item.key,
                  label: (
                    <div className="flex items-center">
                      {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                      <span>{item.label}</span>
                    </div>
                  ),
                  type: item.type,
                  danger: item.danger,
                })),
                onClick: ({ key }) => {
                  if (key === 'logout') {
                    // 退出登录逻辑
                  }
                },
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className="flex cursor-pointer items-center rounded-lg px-2 py-1.5 transition-colors hover:bg-ink-100">
                <Avatar
                  size={32}
                  className="bg-brand-500"
                  icon={<User className="h-4 w-4" />}
                />
                <span className="ml-2 hidden text-sm font-medium text-ink-700 md:block">
                  管理员
                </span>
                <ChevronDown className="ml-1 h-4 w-4 text-ink-400" />
              </div>
            </Dropdown>
          </div>
        </header>

        {/* 主内容区 */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
