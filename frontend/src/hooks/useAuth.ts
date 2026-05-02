import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { post } from '@/services/api';
import { message } from 'antd';
import { Role, Permission } from '@hospital/shared';

interface LoginParams {
  username: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    username: string;
    name: string;
    role: Role;
  };
  token: string;
}

export const useAuth = () => {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, setAuth, logout, hasRole, hasPermission, hasAnyPermission } =
    useAuthStore();

  const login = async (params: LoginParams): Promise<boolean> => {
    try {
      const response = await post<LoginResponse>('/auth/login', params);
      setAuth(response.user, response.token);
      message.success('登录成功');

      const redirectPath = getDashboardPath(response.user.role);
      navigate(redirectPath, { replace: true });

      return true;
    } catch (error) {
      console.error('登录失败:', error);
      return false;
    }
  };

  const handleLogout = () => {
    logout();
    message.info('已退出登录');
    navigate('/login', { replace: true });
  };

  const getDashboardPath = (role: Role): string => {
    const paths: Record<Role, string> = {
      ADMIN: '/admin/dashboard',
      DOCTOR: '/doctor/dashboard',
      NURSE: '/nurse/dashboard',
      REGISTRAR: '/registrar/dashboard',
      PATIENT: '/patient/dashboard',
    };
    return paths[role] || '/login';
  };

  const getRoleName = (role: Role): string => {
    const names: Record<Role, string> = {
      ADMIN: '管理员',
      DOCTOR: '医生',
      NURSE: '护士',
      REGISTRAR: '挂号员',
      PATIENT: '患者',
    };
    return names[role] || role;
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout: handleLogout,
    hasRole,
    hasPermission,
    hasAnyPermission,
    getDashboardPath,
    getRoleName,
  };
};
