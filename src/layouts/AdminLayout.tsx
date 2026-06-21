import { useState } from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Layout,
  Menu,
  Breadcrumb,
  Avatar,
  Dropdown,
  Badge,
  Button,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import {
  LayoutDashboard,
  ShieldAlert,
  Wallet,
  Fuel,
  Users,
  Bell,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  UserCircle,
  Settings,
  HelpCircle,
  Database,
  Activity,
  BarChart3,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { useAppStore, getRoleLabel } from "@/store/appStore";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface MenuItem {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: number;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    key: "dashboard",
    label: "驾驶舱",
    path: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "risk",
    label: "风控中心",
    path: "/admin/risk",
    icon: ShieldAlert,
    badge: 12,
    children: [
      { key: "risk-overview", label: "风险概览", path: "/admin/risk/overview", icon: Activity },
      { key: "risk-alerts", label: "预警事件", path: "/admin/risk/alerts", icon: ShieldAlert },
      { key: "risk-rules", label: "规则配置", path: "/admin/risk/rules", icon: Settings },
    ],
  },
  {
    key: "finance",
    label: "资金管理",
    path: "/admin/finance",
    icon: Wallet,
    children: [
      { key: "finance-flow", label: "资金流水", path: "/admin/finance/flow", icon: BarChart3 },
      { key: "finance-settle", label: "结算审核", path: "/admin/finance/settle", icon: Wallet },
      { key: "finance-reconcile", label: "对账中心", path: "/admin/finance/reconcile", icon: Database },
    ],
  },
  {
    key: "stations",
    label: "油站运营",
    path: "/admin/stations",
    icon: Fuel,
    children: [
      { key: "stations-list", label: "油站管理", path: "/admin/stations/list", icon: Building2 },
      { key: "stations-prices", label: "油价策略", path: "/admin/stations/prices", icon: Fuel },
    ],
  },
  {
    key: "users",
    label: "用户管理",
    path: "/admin/users",
    icon: Users,
    children: [
      { key: "users-drivers", label: "司机用户", path: "/admin/users/drivers", icon: Users },
      { key: "users-shippers", label: "货主企业", path: "/admin/users/shippers", icon: Building2 },
      { key: "users-admins", label: "运营人员", path: "/admin/users/admins", icon: UserCircle },
    ],
  },
];

const mapMenuToAntd = (
  items: MenuItem[],
  collapsed: boolean
): MenuProps["items"] =>
  items.map((item) => ({
    key: item.path,
    icon: (
      <span className="inline-flex items-center relative">
        <item.icon size={18} />
        {item.badge && (
          <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-danger rounded-full">
            {item.badge}
          </span>
        )}
      </span>
    ),
    label: collapsed ? (
      <span title={item.label}>{item.label}</span>
    ) : (
      <span className="flex items-center gap-2">
        {item.label}
        {item.badge && !item.children && (
          <Badge
            count={item.badge}
            size="small"
            className="ml-auto"
            color="#ef4444"
          />
        )}
      </span>
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

export default function AdminLayout() {
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
      onClick: () => navigate("/admin/profile"),
    },
    {
      key: "settings",
      icon: <Settings size={16} />,
      label: "系统设置",
    },
    {
      key: "help",
      icon: <HelpCircle size={16} />,
      label: "运维手册",
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
    <div className="dashboard-screen">
      <Layout className="!bg-transparent !min-h-screen">
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={248}
          theme="dark"
          className="!bg-deep-blue-900/90 !backdrop-blur-xl !border-r !border-white/5 relative"
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background:
                "radial-gradient(ellipse at top, rgba(255,107,26,0.15) 0%, transparent 60%)",
            }}
          />

          <div className="relative h-16 flex items-center gap-3 px-5 border-b border-white/5">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-orange-500/20">
              <LayoutDashboard size={20} className="text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 animate-fade-in">
                <div className="text-base font-bold text-white truncate tracking-wide">
                  运营指挥中心
                </div>
                <div className="text-[11px] text-primary-orange mt-0.5 font-medium">
                  {getRoleLabel("admin")} · v1.0
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <Menu
              mode="inline"
              theme="dark"
              selectedKeys={selectedKeys}
              defaultOpenKeys={openKeys}
              items={mapMenuToAntd(menuItems, collapsed)}
              onClick={({ key }) => navigate(key)}
              className="!border-r-0 !bg-transparent !mt-3 !px-2"
              style={{
                color: "rgba(255,255,255,0.7)",
              }}
            />
          </div>

          {!collapsed && (
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary-orange/10 via-deep-blue-700/50 to-deep-blue-900/80 backdrop-blur border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-white/50 font-medium">
                    系统状态
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[11px] text-success">正常运行</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-white font-jetbrains-mono">
                      99.9%
                    </div>
                    <div className="text-[10px] text-white/40">可用率</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-primary-orange font-jetbrains-mono">
                      12.4K
                    </div>
                    <div className="text-[10px] text-white/40">今日订单</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-info font-jetbrains-mono">
                      3.2M
                    </div>
                    <div className="text-[10px] text-white/40">GMV(元)</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Sider>

        <Layout className="!bg-transparent">
          <Header
            className="!h-16 !flex !items-center !justify-between !px-6 !bg-deep-blue-900/70 !backdrop-blur-xl !border-b !border-white/5 sticky top-0 z-40"
            style={{ background: "transparent" }}
          >
            <div className="flex items-center gap-4">
              <Button
                type="text"
                icon={
                  collapsed ? (
                    <PanelLeftOpen size={18} className="!text-white/70" />
                  ) : (
                    <PanelLeftClose size={18} className="!text-white/70" />
                  )
                }
                onClick={() => setCollapsed(!collapsed)}
                className="!w-10 !h-10 hover:!bg-white/5"
              />

              <div className="h-6 w-px bg-white/10" />

              <div className="flex items-center gap-2">
                {breadcrumb.map((label, idx) => (
                  <span key={idx} className="flex items-center gap-2">
                    {idx > 0 && (
                      <span className="text-white/20 text-xs">/</span>
                    )}
                    <span
                      className={`text-sm ${
                        idx === breadcrumb.length - 1
                          ? "text-white font-medium"
                          : "text-white/50"
                      }`}
                    >
                      {label}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur">
                <Activity size={16} className="text-success animate-pulse" />
                <div className="flex items-baseline gap-1.5">
                  <Text className="!text-white/90 !text-xs !m-0">实时TPS:</Text>
                  <span className="text-success font-bold font-jetbrains-mono text-sm">
                    1,238
                  </span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-baseline gap-1.5">
                  <Text className="!text-white/90 !text-xs !m-0">在线司机:</Text>
                  <span className="text-primary-orange font-bold font-jetbrains-mono text-sm">
                    3,852
                  </span>
                </div>
              </div>

              <Badge count={23} size="small" offset={[-2, 2]} color="#ef4444">
                <Button
                  type="text"
                  icon={<Bell size={18} className="!text-white/80" />}
                  className="!w-10 !h-10 hover:!bg-white/5"
                />
              </Badge>

              <Dropdown
                menu={{ items: userDropdownMenu }}
                placement="bottomRight"
                trigger={["click"]}
                arrow
              >
                <div className="flex items-center gap-3 px-2 py-1.5 -mr-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
                  <Avatar
                    src={user?.avatar}
                    size={36}
                    className="!bg-gradient-primary !text-white !font-semibold !border-2 !border-white/20"
                  >
                    {user?.nickname?.charAt(0) || "A"}
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-semibold text-white leading-tight">
                      {user?.nickname || "管理员"}
                    </div>
                    <div className="text-[11px] text-primary-orange leading-tight mt-0.5">
                      超级管理员
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    className="hidden sm:block text-white/40"
                  />
                </div>
              </Dropdown>
            </div>
          </Header>

          <Content className="!p-6 overflow-auto relative">
            <div
              className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary-orange/5 blur-3xl pointer-events-none"
              aria-hidden
            />
            <div
              className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-info/5 blur-3xl pointer-events-none"
              aria-hidden
            />

            <div className="relative animate-fade-in-up">
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </div>
  );
}
