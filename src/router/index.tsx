import {
  createBrowserRouter,
  Navigate,
  useLocation,
  type RouteObject,
} from "react-router-dom";
import { ComponentType, useEffect } from "react";
import {
  useAppStore,
  getDefaultRouteByRole,
  type UserRole,
} from "@/store/appStore";
import DriverLayout from "@/layouts/DriverLayout";
import ShipperLayout from "@/layouts/ShipperLayout";
import AdminLayout from "@/layouts/AdminLayout";
import Redirector from "@/pages/Redirector";
import ShipperDashboard from "@/pages/shipper/ShipperDashboard";
import ShipperCreateOrder from "@/pages/shipper/ShipperCreateOrder";
import ShipperOrders from "@/pages/shipper/ShipperOrders";
import ShipperOrderDetail from "@/pages/shipper/ShipperOrderDetail";
import ShipperSettlement from "@/pages/shipper/ShipperSettlement";
import ShipperCredit from "@/pages/shipper/ShipperCredit";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminRisk from "@/pages/admin/AdminRisk";
import AdminFund from "@/pages/admin/AdminFund";
import AdminStations from "@/pages/admin/AdminStations";
import AdminUsers from "@/pages/admin/AdminUsers";

interface GuardedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requireAuth?: boolean;
}

function GuardedRoute({
  children,
  requiredRole,
  requireAuth = true,
}: GuardedRouteProps) {
  const location = useLocation();
  const { user, token, isAuthenticated } = useAppStore();

  useEffect(() => {
    // 自动为演示模式下首次访问的用户切换角色
    const pathPrefix = location.pathname.split("/")[1] as
      | UserRole
      | undefined;
    if (
      ["driver", "shipper", "admin"].includes(pathPrefix as string) &&
      (!token || !user)
    ) {
      const { switchRole } = useAppStore.getState();
      switchRole(pathPrefix as UserRole);
    }
  }, [location.pathname, token, user]);

  if (requireAuth && !isAuthenticated()) {
    const pathPrefix = location.pathname.split("/")[1] as
      | UserRole
      | undefined;
    if (["driver", "shipper", "admin"].includes(pathPrefix as string)) {
      const { switchRole } = useAppStore.getState();
      switchRole(pathPrefix as UserRole);
      return <>{children}</>;
    }
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (requiredRole && user) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      const fallback = getDefaultRouteByRole(user.role);
      return <Navigate to={fallback} replace />;
    }
  }

  return <>{children}</>;
}

const withGuard = (
  element: React.ReactNode,
  options?: Omit<GuardedRouteProps, "children">
) => <GuardedRoute {...options}>{element}</GuardedRoute>;

type PagePlaceholderProps = {
  title: string;
  description?: string;
  variant?: "driver" | "shipper" | "admin";
};

function PagePlaceholder({
  title,
  description,
  variant = "shipper",
}: PagePlaceholderProps) {
  const variantStyles: Record<
    NonNullable<PagePlaceholderProps["variant"]>,
    { container: string; title: string; badge: string }
  > = {
    driver: {
      container: "p-6",
      title: "text-deep-blue-900",
      badge: "bg-orange-50 text-primary-orange border-orange-100",
    },
    shipper: {
      container: "p-8",
      title: "text-deep-blue-900",
      badge: "bg-blue-50 text-deep-blue border-blue-100",
    },
    admin: {
      container: "p-8",
      title: "text-white",
      badge: "bg-white/10 text-primary-orange border-white/10",
    },
  };

  const style = variantStyles[variant];

  return (
    <div className={style.container}>
      {variant === "admin" ? (
        <div className="dashboard-panel animate-fade-in">
          <div className="dashboard-title">{title}</div>
          <div className="p-8">
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 bg-gradient-to-br from-primary-orange/20 to-deep-blue-400/20 border border-white/10">
                <span className="text-4xl">🚧</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
              <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
                {description ||
                  "该模块正在开发中，敬请期待。后续将提供完整的业务功能与数据大屏。"}
              </p>
              <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-orange animate-pulse" />
                <span className="text-xs text-white/60">
                  建设中 · Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card animate-fade-in">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className={`text-lg font-bold ${style.title}`}>{title}</h2>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style.badge}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
              模块建设中
            </span>
          </div>
          <div className="p-8">
            <div className="text-center py-14">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 bg-gradient-to-br from-orange-50 to-blue-50 border border-gray-100">
                <span className="text-4xl">🚧</span>
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${style.title}`}>
                {title}
              </h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                {description ||
                  "该模块页面正在开发中，后续将提供完整的业务流程与数据展示。"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const driverRoutes: RouteObject = {
  path: "/driver",
  element: withGuard(<DriverLayout />, { requiredRole: "driver" }),
  children: [
    {
      index: true,
      element: <Navigate to="/driver/home" replace />,
    },
    {
      path: "home",
      element: (
        <PagePlaceholder
          variant="driver"
          title="司机首页"
          description="附近货源、推荐订单、收益概览"
        />
      ),
    },
    {
      path: "orders",
      element: (
        <PagePlaceholder
          variant="driver"
          title="运单中心"
          description="待接、进行中、已完成运单管理"
        />
      ),
      children: [
        { index: true, element: <Navigate to="list" replace /> },
        {
          path: "list",
          element: (
            <PagePlaceholder variant="driver" title="运单列表" />
          ),
        },
        {
          path: ":id",
          element: (
            <PagePlaceholder variant="driver" title="运单详情" />
          ),
        },
      ],
    },
    {
      path: "stations",
      element: (
        <PagePlaceholder
          variant="driver"
          title="合作油站"
          description="附近油站导航、优惠油价、一键加油"
        />
      ),
    },
    {
      path: "wallet",
      element: (
        <PagePlaceholder
          variant="driver"
          title="我的钱包"
          description="账户余额、收支明细、提现管理"
        />
      ),
    },
    {
      path: "profile",
      element: (
        <PagePlaceholder
          variant="driver"
          title="个人中心"
          description="个人信息、车辆管理、设置"
        />
      ),
    },
    {
      path: "*",
      element: <Navigate to="/driver/home" replace />,
    },
  ],
};

const shipperRoutes: RouteObject = {
  path: "/shipper",
  element: withGuard(<ShipperLayout />, { requiredRole: "shipper" }),
  children: [
    {
      index: true,
      element: <Navigate to="/shipper/dashboard" replace />,
    },
    {
      path: "dashboard",
      element: <ShipperDashboard />,
    },
    {
      path: "orders",
      children: [
        {
          index: true,
          element: <Navigate to="/shipper/orders/list" replace />,
        },
        {
          path: "list",
          element: <ShipperOrders />,
        },
        {
          path: "create",
          element: <ShipperCreateOrder />,
        },
        {
          path: "tracking",
          element: <ShipperOrders />,
        },
        {
          path: ":id",
          element: <ShipperOrderDetail />,
        },
      ],
    },
    {
      path: "settlement",
      children: [
        {
          index: true,
          element: <Navigate to="/shipper/settlement/bills" replace />,
        },
        {
          path: "bills",
          element: <ShipperSettlement />,
        },
        {
          path: "invoice",
          element: <ShipperSettlement />,
        },
      ],
    },
    {
      path: "credit",
      element: <ShipperCredit />,
    },
    {
      path: "profile",
      element: (
        <PagePlaceholder title="个人中心" description="账户信息、企业资质" />
      ),
    },
    {
      path: "settings",
      element: <PagePlaceholder title="账户设置" description="安全设置、通知" />,
    },
    {
      path: "*",
      element: <Navigate to="/shipper/dashboard" replace />,
    },
  ],
};

const adminRoutes: RouteObject = {
  path: "/admin",
  element: withGuard(<AdminLayout />, { requiredRole: "admin" }),
  children: [
    {
      index: true,
      element: <Navigate to="/admin/dashboard" replace />,
    },
    {
      path: "dashboard",
      element: <AdminDashboard />,
    },
    {
      path: "risk",
      children: [
        {
          index: true,
          element: <Navigate to="/admin/risk/overview" replace />,
        },
        { path: "overview", element: <AdminRisk defaultTab="driver" /> },
        { path: "alerts", element: <AdminRisk defaultTab="blacklist" /> },
        { path: "rules", element: <AdminRisk defaultTab="advance" /> },
      ],
    },
    { path: "finance", children: [
      { index: true, element: <Navigate to="/admin/finance/flow" replace /> },
      { path: "flow", element: <AdminFund defaultTab="flow" /> },
      { path: "settle", element: <AdminFund defaultTab="flow" /> },
      { path: "reconcile", element: <AdminFund defaultTab="flow" /> },
    ] },
    { path: "stations", children: [
      { index: true, element: <Navigate to="/admin/stations/list" replace /> },
      { path: "list", element: <AdminStations defaultTab="list" defaultView="table" /> },
      { path: "prices", element: <AdminStations defaultTab="prices" defaultView="table" /> },
    ] },
    { path: "users", children: [
      { index: true, element: <Navigate to="/admin/users/drivers" replace /> },
      { path: "drivers", element: <AdminUsers defaultTab="driver" /> },
      { path: "shippers", element: <AdminUsers defaultTab="shipper" /> },
      { path: "admins", element: <AdminUsers defaultTab="driver" /> },
    ] },
    {
      path: "profile",
      element: (
        <PagePlaceholder variant="admin" title="个人中心" description="管理员信息" />
      ),
    },
    {
      path: "*",
      element: <Navigate to="/admin/dashboard" replace />,
    },
  ],
};

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Redirector />,
  },
  driverRoutes,
  shipperRoutes,
  adminRoutes,
  {
    path: "/login",
    element: (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-deep-blue-900 mb-2">
            登录页
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            演示模式下请直接返回首页选择角色体验
          </p>
          <button
            type="button"
            onClick={() => (window.location.href = "/")}
            className="px-6 py-2.5 rounded-xl bg-gradient-primary text-white font-medium shadow-soft-orange hover:brightness-105"
          >
            返回首页
          </button>
        </div>
      </div>
    ),
  },
  {
    path: "*",
    element: (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <div className="text-7xl mb-6">🧭</div>
          <h2 className="text-3xl font-bold text-deep-blue-900 mb-2">
            404 - 页面迷路了
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            您访问的页面不存在，或者已经被移除
          </p>
          <button
            type="button"
            onClick={() => (window.location.href = "/")}
            className="px-6 py-2.5 rounded-xl bg-gradient-primary text-white font-medium shadow-soft-orange hover:brightness-105"
          >
            回到首页
          </button>
        </div>
      </div>
    ),
  },
];

export const router = createBrowserRouter(routes);

export default router;

export type { GuardedRouteProps, PagePlaceholderProps };
export { GuardedRoute, PagePlaceholder };
