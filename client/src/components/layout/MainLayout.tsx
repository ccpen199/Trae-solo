import React, { useEffect, useState, useCallback } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, theme, Badge, notification } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  BookOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore, useRoleStore } from '@/store';
import { UserRole } from '@/types';

const { Header, Sider, Content } = Layout;

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  roles?: UserRole[];
  children?: MenuItem[];
}

const MainLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { isAdmin, isQuestionSetter, isGrader, isExaminee } = useRoleStore();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const [collapsed, setCollapsed] = useState(false);
  const [api, contextHolder] = notification.useNotification();

  const getMenuItems = useCallback((): MenuItem[] => {
    const items: MenuItem[] = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: '工作台',
      },
    ];

    if (isQuestionSetter() || isAdmin()) {
      items.push(
        {
          key: '/knowledge-points',
          icon: <AppstoreOutlined />,
          label: '知识点管理',
        },
        {
          key: '/questions',
          icon: <FileTextOutlined />,
          label: '题库管理',
        },
        {
          key: '/exam-papers',
          icon: <BookOutlined />,
          label: '试卷管理',
        }
      );
    }

    if (isAdmin()) {
      items.push({
        key: '/exams',
        icon: <SafetyCertificateOutlined />,
        label: '考试管理',
      });
    }

    if (isGrader() || isAdmin()) {
      items.push({
        key: '/grading',
        icon: <EditOutlined />,
        label: '阅卷管理',
      });
    }

    if (isAdmin() || isQuestionSetter()) {
      items.push({
        key: '/statistics',
        icon: <BarChartOutlined />,
        label: '统计分析',
      });
    }

    return items;
  }, [isAdmin, isQuestionSetter, isGrader]);

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider' as const,
    },
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

  const getRoleName = (role: UserRole): string => {
    const roleMap: Record<UserRole, string> = {
      [UserRole.ADMIN]: '管理员',
      [UserRole.QUESTION_SETTER]: '出题人',
      [UserRole.EXAMINEE]: '考生',
      [UserRole.GRADER]: '阅卷老师',
    };
    return roleMap[role] || role;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {contextHolder}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
          }}
        >
          <SafetyCertificateOutlined
            style={{
              fontSize: collapsed ? 28 : 32,
              color: '#fff',
            }}
          />
          {!collapsed && (
            <span
              style={{
                marginLeft: 12,
                color: '#fff',
                fontSize: 18,
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
              }}
            >
              在线考试系统
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <ClockCircleOutlined /> : <ClockCircleOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={0} showZero>
              <Button type="text" icon={<ClockCircleOutlined />} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: 8,
                }}
              >
                <Avatar
                  size={36}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                >
                  {user?.name?.charAt(0)}
                </Avatar>
                <div style={{ marginLeft: 12, textAlign: 'right' }}>
                  <div style={{ fontWeight: 500 }}>{user?.name}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {getRoleName(user?.role || UserRole.EXAMINEE)}
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            background: colorBgContainer,
            minHeight: 280,
            borderRadius: 8,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
