import React, { useEffect, useState } from 'react';
import { Layout, Menu, Dropdown, Avatar, Space, Spin } from 'antd';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  FileTextOutlined,
  IdcardOutlined,
  BookOutlined,
  FolderOutlined,
  TeamOutlined,
  CalendarOutlined,
  DollarOutlined,
  PieChartOutlined,
  ToolOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { useAppStore } from './store';
import { api } from './api';

import Login from './pages/Login';
import RegisterWorker from './pages/RegisterWorker';
import RegisterEnterprise from './pages/RegisterEnterprise';
import Dashboard from './pages/Dashboard';
import JobList from './pages/JobList';
import JobDetail from './pages/JobDetail';
import CertificationList from './pages/CertificationList';
import CertificationSubmit from './pages/CertificationSubmit';
import SkillAssessmentList from './pages/SkillAssessmentList';
import SkillExam from './pages/SkillExam';
import ContractList from './pages/ContractList';
import ContractDetail from './pages/ContractDetail';
import AttendanceList from './pages/AttendanceList';
import AttendanceCheck from './pages/AttendanceCheck';
import PayrollList from './pages/PayrollList';
import PayrollDetail from './pages/PayrollDetail';

import EnterpriseJobList from './pages/enterprise/JobList';
import EnterpriseJobCreate from './pages/enterprise/JobCreate';
import EnterpriseProjectList from './pages/enterprise/ProjectList';
import EnterpriseProjectCreate from './pages/enterprise/ProjectCreate';
import EnterpriseContractList from './pages/enterprise/ContractList';
import EnterpriseContractCreate from './pages/enterprise/ContractCreate';
import EnterpriseAttendance from './pages/enterprise/Attendance';
import EnterprisePayroll from './pages/enterprise/Payroll';
import EnterpriseDashboard from './pages/enterprise/Dashboard';

import AdminDashboard from './pages/admin/Dashboard';
import AdminUserList from './pages/admin/UserList';
import AdminCertificationList from './pages/admin/CertificationList';
import AdminProjectList from './pages/admin/ProjectList';
import AdminSocialSecurity from './pages/admin/SocialSecurity';
import AdminBiometricLogs from './pages/admin/BiometricLogs';
import AdminAuditLogs from './pages/admin/AuditLogs';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const { user, token, logout } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [loadingUser, setLoadingUser] = useState(false);

  useEffect(() => {
    if (token && !user) {
      setLoadingUser(true);
      api.auth.getCurrentUser().then(res => {
        useAppStore.getState().setUser(res.data);
      }).catch(() => {
        logout();
        navigate('/login');
      }).finally(() => {
        setLoadingUser(false);
      });
    }
  }, [token, user, logout, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getWorkerMenu = () => [
    { key: '/dashboard', icon: <HomeOutlined />, label: '首页' },
    { key: '/jobs', icon: <FolderOutlined />, label: '岗位大厅' },
    { key: '/certifications', icon: <IdcardOutlined />, label: '工种认证' },
    { key: '/assessments', icon: <BookOutlined />, label: '技能评定' },
    { key: '/contracts', icon: <FileTextOutlined />, label: '我的合同' },
    { key: '/attendance', icon: <CalendarOutlined />, label: '考勤打卡' },
    { key: '/payrolls', icon: <DollarOutlined />, label: '工资条' }
  ];

  const getEnterpriseMenu = () => [
    { key: '/enterprise/dashboard', icon: <HomeOutlined />, label: '首页' },
    { key: '/enterprise/jobs', icon: <FolderOutlined />, label: '岗位管理' },
    { key: '/enterprise/projects', icon: <TeamOutlined />, label: '项目管理' },
    { key: '/enterprise/contracts', icon: <FileTextOutlined />, label: '合同管理' },
    { key: '/enterprise/attendance', icon: <CalendarOutlined />, label: '考勤管理' },
    { key: '/enterprise/payroll', icon: <DollarOutlined />, label: '工资管理' }
  ];

  const getAdminMenu = () => [
    { key: '/admin/dashboard', icon: <PieChartOutlined />, label: '数据概览' },
    { key: '/admin/users', icon: <TeamOutlined />, label: '用户管理' },
    { key: '/admin/certifications', icon: <IdcardOutlined />, label: '认证审核' },
    { key: '/admin/projects', icon: <FolderOutlined />, label: '项目管理' },
    { key: '/admin/social-security', icon: <SafetyOutlined />, label: '社保预警' },
    { key: '/admin/biometric', icon: <SafetyOutlined />, label: '生物特征管理' },
    { key: '/admin/audit-logs', icon: <ToolOutlined />, label: '审计日志' }
  ];

  const getMenuItems = () => {
    if (!user) return [];
    if (user.role === 'worker') return getWorkerMenu();
    if (user.role === 'enterprise') return getEnterpriseMenu();
    if (user.role === 'admin') return getAdminMenu();
    return [];
  };

  const getDefaultRoute = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'enterprise') return '/enterprise/dashboard';
    return '/dashboard';
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register/worker" element={<RegisterWorker />} />
        <Route path="/register/enterprise" element={<RegisterEnterprise />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (loadingUser || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="正在加载用户信息..." />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#001529', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 24px'
      }}>
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🏗️</span>
          建筑行业蓝领用工数字化平台
        </div>
        <Space>
          <span style={{ color: 'white', marginRight: '12px' }}>
            欢迎，{user?.realName || user?.username}
            <span style={{ marginLeft: '8px', padding: '2px 8px', background: '#1890ff', borderRadius: '4px', fontSize: '12px' }}>
              {user?.role === 'worker' ? '工人' : user?.role === 'enterprise' ? '企业' : '管理员'}
            </span>
          </span>
          <Dropdown menu={{ items: userMenuItems }}>
            <Avatar style={{ backgroundColor: '#1890ff', cursor: 'pointer' }} icon={<UserOutlined />} />
          </Dropdown>
        </Space>
      </Header>
      <Layout>
        <Sider width={220} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={getMenuItems()}
            onClick={({ key }: { key: string }) => navigate(key)}
          />
        </Sider>
        <Content style={{ background: '#f5f7fa', padding: '24px' }}>
          <Routes>
            <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
            
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/jobs" element={<JobList />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/certifications" element={<CertificationList />} />
            <Route path="/certifications/submit" element={<CertificationSubmit />} />
            <Route path="/assessments" element={<SkillAssessmentList />} />
            <Route path="/assessments/exam/:tradeId" element={<SkillExam />} />
            <Route path="/contracts" element={<ContractList />} />
            <Route path="/contracts/:id" element={<ContractDetail />} />
            <Route path="/attendance" element={<AttendanceList />} />
            <Route path="/attendance/check" element={<AttendanceCheck />} />
            <Route path="/payrolls" element={<PayrollList />} />
            <Route path="/payrolls/:id" element={<PayrollDetail />} />
            
            <Route path="/enterprise/dashboard" element={<EnterpriseDashboard />} />
            <Route path="/enterprise/jobs" element={<EnterpriseJobList />} />
            <Route path="/enterprise/jobs/create" element={<EnterpriseJobCreate />} />
            <Route path="/enterprise/projects" element={<EnterpriseProjectList />} />
            <Route path="/enterprise/projects/create" element={<EnterpriseProjectCreate />} />
            <Route path="/enterprise/contracts" element={<EnterpriseContractList />} />
            <Route path="/enterprise/contracts/create" element={<EnterpriseContractCreate />} />
            <Route path="/enterprise/attendance" element={<EnterpriseAttendance />} />
            <Route path="/enterprise/payroll" element={<EnterprisePayroll />} />
            
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUserList />} />
            <Route path="/admin/certifications" element={<AdminCertificationList />} />
            <Route path="/admin/projects" element={<AdminProjectList />} />
            <Route path="/admin/social-security" element={<AdminSocialSecurity />} />
            <Route path="/admin/biometric" element={<AdminBiometricLogs />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
            
            <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
