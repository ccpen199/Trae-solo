import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [menus, setMenus] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mfaChallenge, setMfaChallenge] = useState(null);

  const initFromStorage = useCallback(() => {
    const storedToken = localStorage.getItem('iam_token');
    const storedUser = localStorage.getItem('iam_user');
    const storedMenus = localStorage.getItem('iam_menus');
    const storedPermissions = localStorage.getItem('iam_permissions');
    const storedRoles = localStorage.getItem('iam_roles');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setMenus(storedMenus ? JSON.parse(storedMenus) : []);
      setPermissions(storedPermissions ? JSON.parse(storedPermissions) : []);
      setRoles(storedRoles ? JSON.parse(storedRoles) : []);
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
  }, []);

  useEffect(() => {
    initFromStorage();
    setLoading(false);
  }, [initFromStorage]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        const { user: userData, menus: menuData, permissions: permData, roles: rolesData } = response.data.data;
        
        setUser(userData);
        setMenus(menuData || []);
        setPermissions(permData || []);
        setRoles(rolesData || []);

        localStorage.setItem('iam_user', JSON.stringify(userData));
        localStorage.setItem('iam_menus', JSON.stringify(menuData || []));
        localStorage.setItem('iam_permissions', JSON.stringify(permData || []));
        localStorage.setItem('iam_roles', JSON.stringify(rolesData || []));

        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false, error };
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      
      if (response.data.success) {
        if (response.data.mfaRequired) {
          setMfaChallenge({
            mfaType: response.data.mfaType,
            challengeId: response.data.challengeId,
            deliveryInfo: response.data.deliveryInfo,
            riskAnalysis: response.data.riskAnalysis,
            username,
            password
          });
          return {
            success: true,
            mfaRequired: true,
            challenge: response.data
          };
        }

        const { token: jwtToken, user: userData, menus: menuData, permissions: permData, roles: rolesData } = response.data;
        
        setToken(jwtToken);
        setUser(userData);
        setMenus(menuData || []);
        setPermissions(permData || []);
        setRoles(rolesData || []);
        setMfaChallenge(null);

        localStorage.setItem('iam_token', jwtToken);
        localStorage.setItem('iam_user', JSON.stringify(userData));
        localStorage.setItem('iam_menus', JSON.stringify(menuData || []));
        localStorage.setItem('iam_permissions', JSON.stringify(permData || []));
        localStorage.setItem('iam_roles', JSON.stringify(rolesData || []));

        api.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;

        return {
          success: true,
          mfaRequired: false,
          user: userData
        };
      }

      return {
        success: false,
        error: response.data.error || '登录失败'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  };

  const verifyMFA = async (code) => {
    if (!mfaChallenge) {
      return { success: false, error: '没有待验证的 MFA 挑战' };
    }

    try {
      const response = await api.post('/auth/mfa/verify', {
        username: mfaChallenge.username,
        password: mfaChallenge.password,
        code,
        challengeId: mfaChallenge.challengeId,
        mfaType: mfaChallenge.mfaType
      });

      if (response.data.success) {
        const { token: jwtToken, user: userData, menus: menuData, permissions: permData, roles: rolesData } = response.data;
        
        setToken(jwtToken);
        setUser(userData);
        setMenus(menuData || []);
        setPermissions(permData || []);
        setRoles(rolesData || []);
        setMfaChallenge(null);

        localStorage.setItem('iam_token', jwtToken);
        localStorage.setItem('iam_user', JSON.stringify(userData));
        localStorage.setItem('iam_menus', JSON.stringify(menuData || []));
        localStorage.setItem('iam_permissions', JSON.stringify(permData || []));
        localStorage.setItem('iam_roles', JSON.stringify(rolesData || []));

        api.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;

        return {
          success: true,
          user: userData
        };
      }

      return {
        success: false,
        error: response.data.error || '验证失败'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    setToken(null);
    setUser(null);
    setMenus([]);
    setPermissions([]);
    setRoles([]);
    setMfaChallenge(null);

    localStorage.removeItem('iam_token');
    localStorage.removeItem('iam_user');
    localStorage.removeItem('iam_menus');
    localStorage.removeItem('iam_permissions');
    localStorage.removeItem('iam_roles');

    delete api.defaults.headers.common['Authorization'];
  };

  const hasPermission = (permissionCode) => {
    return permissions.includes(permissionCode);
  };

  const hasRole = (roleName) => {
    return roles.some(role => role.name === roleName);
  };

  const value = {
    user,
    token,
    menus,
    permissions,
    roles,
    loading,
    mfaChallenge,
    login,
    verifyMFA,
    logout,
    hasPermission,
    hasRole,
    fetchCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
