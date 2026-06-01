import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

const users = [
  { id: 1, username: 'admin', name: '系统管理员', role: 'admin', phone: '13800000000' },
  { id: 2, username: 'sales', name: '销售顾问-张三', role: 'sales', phone: '13800000001' },
  { id: 3, username: 'material', name: '材料专员-李四', role: 'material', phone: '13800000002' },
  { id: 4, username: 'officer', name: '工商办理员-王五', role: 'officer', phone: '13800000003' }
];

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(users[0]);

  const roleNames = {
    admin: '系统管理员',
    sales: '销售顾问',
    material: '材料专员',
    officer: '工商办理员'
  };

  const canAccess = (requiredRoles) => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return requiredRoles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      setCurrentUser, 
      users, 
      roleNames,
      canAccess 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
