import React, { useState, useEffect } from "react";
import { Layout, Menu, Avatar, Dropdown, Badge, Typography } from "antd";
import {
  DashboardOutlined,
  AppstoreOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "../../store";
import { authAPI, imAPI, approvalAPI } from "../../api";
import type { MenuProps } from "antd";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);
  const setUnreadMessageCount = useAppStore((state) => state.setUnreadMessageCount);
  const setPendingApprovalCount = useAppStore((state) => state.setPendingApprovalCount);
  const unreadMessageCount = useAppStore((state) => state.unreadMessageCount);
  const pendingApprovalCount = useAppStore((state) => state.pendingApprovalCount);

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [imRes, approvalRes] = await Promise.all([
          imAPI.getUnreadCount(),
          approvalAPI.getStats(),
        ]);
        if (imRes?.total !== undefined) {
          setUnreadMessageCount(imRes.total);
        }
        if (approvalRes?.myPending !== undefined) {
          setPendingApprovalCount(approvalRes.myPending);
        }
      } catch (error) {
        console.error("Failed to load counts:", error);
      }
    };
    loadCounts();
    const interval = setInterval(loadCounts, 30000);
    return () => clearInterval(interval);
  }, [setUnreadMessageCount, setPendingApprovalCount]);

  const menuItems: MenuProps["items"] = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "仪表盘",
    },
    {
      key: "/positions",
      icon: <AppstoreOutlined />,
      label: "职位管理",
    },
    {
      key: "/candidates",
      icon: <TeamOutlined />,
      label: "候选人看板",
    },
    {
      key: "/interviews",
      icon: <VideoCameraOutlined />,
      label: "面试安排",
    },
    {
      key: "/im",
      icon: (
        <Badge count={unreadMessageCount} size="small" offset={[10, 0]}>
          <MessageOutlined />
        </Badge>
      ),
      label: "IM沟通",
    },
    {
      key: "/approvals",
      icon: (
        <Badge count={pendingApprovalCount} size="small" offset={[10, 0]}>
          <CheckCircleOutlined />
        </Badge>
      ),
      label: "审批中心",
    },
    {
      key: "/analytics",
      icon: <BarChartOutlined />,
      label: "数据分析",
    },
  ];

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    logout();
    navigate("/login", { replace: true });
  };

  const userMenu: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "个人中心",
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      onClick: handleLogout,
    },
  ];

  const roleNames: Record<string, string> = {
    admin: "系统管理员",
    hr: "HR",
    hiring_manager: "用人经理",
    interviewer: "面试官",
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={240}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: collapsed ? 16 : 20,
            fontWeight: 600,
            background: "rgba(255, 255, 255, 0.1)",
          }}
        >
          {collapsed ? "👥" : "👥 招聘管理后台"}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0, 21, 41, 0.08)",
          }}
        >
          <div>
            <Text strong style={{ fontSize: 16 }}>
              招聘协同管理后台
            </Text>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <Badge count={unreadMessageCount + pendingApprovalCount} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: "pointer", color: "#666" }} />
            </Badge>
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: 4,
                }}
              >
                <Avatar size={32} icon={<UserOutlined />} src={user?.avatar} />
                {!collapsed && (
                  <div style={{ lineHeight: 1.2 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      {user?.name || "用户"}
                    </div>
                    <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                      {roleNames[user?.role || ""] || user?.role}
                    </div>
                  </div>
                )}
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            padding: 24,
            background: "#f0f2f5",
            minHeight: "calc(100vh - 64px)",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
