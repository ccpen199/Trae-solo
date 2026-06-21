import { useState } from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
  NavLink,
} from "react-router-dom";
import {
  Layout,
  Menu,
  Breadcrumb,
  Avatar,
  Dropdown,
  Badge,
  Button,
} from "antd";
import type { MenuProps } from "antd";
import {
  LayoutDashboard,
  Package,
  CreditCard,
  Shield,
  Bell,
  Search,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  UserCircle,
  Settings,
  HelpCircle,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { useAppStore, getRoleLabel } from "@/store/appStore";

const { Header, Sider, Content } = Layout;

interface MenuItem {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { key: "dashboard", label: "工作台", path: "/shipper/dashboard", icon: LayoutDashboard },
  {
    key: "orders",
    label: "运单管理",
    path: "/shipper/orders",
    icon: Package,
    children: [
      { key: "orders-list", label: "运单列表", path: "/shipper/orders/list", icon: Package },
      { key: "orders-create", label: "发布货源", path: "/shipper/orders/create", icon: Truck },
      { key: "orders-tracking", label: "实时追踪", path: "/shipper/orders/tracking", icon: Package },
    ],
  },
  {
    key: "settlement",
    label: "结算中心",
    path: "/shipper/settlement",
    icon: CreditCard,
    children: [
      { key: "settlement-bills", label: "账单管理", path: "/shipper/settlement/bills", icon: CreditCard },
      { key: "settlement-invoice", label: "发票中心", path: "/shipper/settlement/invoice", icon: CreditCard },
    ],
  },
  { key: "credit", label: "信用看板", path: "/shipper/credit", icon: Shield },
];

const mapMenuToAntd = (
  items: MenuItem[],
  collapsed: boolean
): MenuProps["items"] =>
  items.map((item) => ({
    key: item.path,
    icon: (
      <span className="inline-flex items-center">
        <item.icon size={18} />
      </span>
    ),
    label: collapsed ? (
      <span title={item.label}>{item.label}</span>
    ) : (
      item.label
    ),
    children: item.children
      ? mapMenuToAntd(item.children, collapsed)
      : undefined,
  }));

const findBreadcrumb = (
  items: MenuItem[],
  pathname: string,
  trail: string[] = []
): string[] | null => {
  for (const item of items) {
    const currentTrail = [...trail, item.label];
    if (pathname === item.path || pathname.startsWith(item.path + "/")) {
      return currentTrail;
    }
    if (item.children) {
      const result = findBreadcrumb(item.children, pathname, currentTrail);
      if (result) return result;
    }
  }
  return null;
};

export default function ShipperLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAppStore();

  const breadcrumb = findBreadcrumb(menuItems, location.pathname) || ["首页"];

  const findSelectedKey = (items: MenuItem[], pathname: string): string[] => {
    for (const item of items) {
      if (pathname === item.path) return [item.path];
      if (item.children) {
        for (const child of item.children) {
          if (pathname === child.path || pathname.startsWith(child.path)) {
            return [child.path];
          }
        }
        if (pathname.startsWith(item.path + "/")) {
          return [item.children[0].path];
        }
      }
      if (pathname.startsWith(item.path + "/")) {
        return [item.path];
      }
    }
    return [];
  };

  const findOpenKey = (items: MenuItem[], pathname: string): string[] => {
    for (const item of items) {
      if (item.children) {
        for (const child of item.children) {
          if (pathname === child.path || pathname.startsWith(child.path)) {
            return [item.path];
          }
        }
      }
    }
    return [];
  };

  const selectedKeys = findSelectedKey(menuItems, location.pathname);
  const openKeys = findOpenKey(menuItems, location.pathname);

  const userDropdownMenu: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserCircle size={16} />,
      label: "个人中心",
      onClick: () => navigate("/shipper/profile"),
    },
    {
      key: "settings",
      icon: <Settings size={16} />,
      label: "账户设置",
      onClick: () => navigate("/shipper/settings"),
    },
    {
      key: "help",
      icon: <HelpCircle size={16} />,
      label: "帮助中心",
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogOut size={16} />,
      label: "退出登录",
      danger: true,
      onClick: () => {
        logout();
        navigate("/");
      },
    },
  ];

  return (
    <Layout className="!min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        theme="light"
        className="!border-r !border-gray-100 !bg-white shadow-sm"
      >
        <div className="flex h-16 items-center gap-3 px-5 border-b border-gray-100">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft-orange">
            <Truck size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 animate-fade-in">
              <div className="text-base font-bold text-deep-blue-900 truncate">
                运力金融平台
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {getRoleLabel("shipper")}
              </div>
            </div>
          )}
        </div>

        <Menu
          mode="inline"
          theme="light"
          selectedKeys={selectedKeys}
          defaultOpenKeys={openKeys}
          items={mapMenuToAntd(menuItems, collapsed)}
          onClick={({ key }) => navigate(key)}
          className="!border-r-0 !bg-transparent !mt-2"
          style={{
            color: "#374151",
          }}
        />

        {!collapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gradient-to-t from-white via-white to-transparent">
            <div
              className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-orange-50 to-blue-50 cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigate("/")}
            >
              <Avatar
                src={user?.avatar}
                size={40}
                className="!bg-gradient-primary !text-white !font-semibold"
              >
                {user?.nickname?.charAt(0) || "U"}
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-deep-blue-900 truncate">
                  {user?.nickname || "未登录"}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user?.phone || user?.email || "欢迎使用"}
                </div>
              </div>
            </div>
          </div>
        )}
      </Sider>

      <Layout className="!bg-slate-50">
        <Header className="!bg-white !px-6 !h-16 !flex !items-center !justify-between !border-b !border-gray-100 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={
                collapsed ? (
                  <PanelLeftOpen size={18} className="!text-gray-500" />
                ) : (
                  <PanelLeftClose size={18} className="!text-gray-500" />
                )
              }
              onClick={() => setCollapsed(!collapsed)}
              className="!w-10 !h-10"
            />

            <Breadcrumb
              separator={<ChevronDown size={14} className="text-gray-400" />}
              className="!hidden md:!flex"
              items={breadcrumb.map((label, idx) => ({
                title: (
                  <span
                    className={
                      idx === breadcrumb.length - 1
                        ? "font-medium text-deep-blue-900"
                        : "text-gray-500"
                    }
                  >
                    {label}
                  </span>
                ),
              }))}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden xl:flex items-center gap-2 px-3.5 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-text">
              <Search size={16} className="text-gray-400" />
              <input
                placeholder="搜索运单、司机、客户..."
                className="flex-1 w-56 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
              />
              <kbd className="hidden lg:inline-flex px-1.5 h-5 items-center text-[10px] text-gray-400 bg-white rounded border border-gray-200 font-mono">
                ⌘K
              </kbd>
            </div>

            <Badge count={6} size="small" offset={[-2, 2]}>
              <Button
                type="text"
                icon={<Bell size={18} className="!text-gray-600" />}
                className="!w-10 !h-10 relative"
              />
            </Badge>

            <Dropdown
              menu={{ items: userDropdownMenu }}
              placement="bottomRight"
              trigger={["click"]}
              arrow
            >
              <div className="flex items-center gap-3 px-2 py-1.5 -mr-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                <Avatar
                  src={user?.avatar}
                  size={36}
                  className="!bg-gradient-primary !text-white !font-semibold !shadow-sm"
                >
                  {user?.nickname?.charAt(0) || "U"}
                </Avatar>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-semibold text-deep-blue-900 leading-tight">
                    {user?.nickname || "未登录"}
                  </div>
                  <div className="text-xs text-gray-400 leading-tight mt-0.5">
                    {user?.phone || "货主账户"}
                  </div>
                </div>
                <ChevronDown size={16} className="hidden sm:block text-gray-400" />
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="!p-6 overflow-auto">
          <div className="animate-fade-in-up">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
