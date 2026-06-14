import { createContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi, logout as logoutApi, getProfile } from '../api/auth';
import { getToken, setToken, removeToken, getUser, setUser, removeUser } from '../utils/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [token, setTokenState] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getToken();
      const storedUser = getUser();

      if (storedToken && storedUser) {
        setTokenState(storedToken);
        setUserState(storedUser);
        setRoles(storedUser.roles || []);
        setPermissions(storedUser.permissions || []);
        setIsAuthenticated(true);

        try {
          const res = await getProfile();
          if (res?.data) {
            setUserState(res.data);
            setUser(res.data);
            setRoles(res.data.roles || []);
            setPermissions(res.data.permissions || []);
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    try {
      const res = await loginApi(username, password);
      const { token: newToken, user: userData } = res.data;

      setTokenState(newToken);
      setUserState(userData);
      setRoles(userData.roles || []);
      setPermissions(userData.permissions || []);
      setIsAuthenticated(true);

      setToken(newToken);
      setUser(userData);

      return res.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      setTokenState(null);
      setUserState(null);
      setRoles([]);
      setPermissions([]);
      setIsAuthenticated(false);

      removeToken();
      removeUser();
    }
  }, []);

  const updateUser = useCallback((userData) => {
    setUserState(userData);
    setUser(userData);
    setRoles(userData.roles || []);
    setPermissions(userData.permissions || []);
  }, []);

  const checkPermission = useCallback(
    (permission) => {
      if (!permission) return true;
      if (permissions.includes('*')) return true;
      return permissions.includes(permission);
    },
    [permissions]
  );

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    permissions,
    roles,
    login,
    logout,
    updateUser,
    checkPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
