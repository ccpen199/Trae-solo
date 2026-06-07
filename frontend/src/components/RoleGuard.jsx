import { Navigate } from 'react-router-dom';
import { isLoggedIn, getUserRole } from '../utils/auth';

const roleRedirectMap = {
  requester: '/requester/publish',
  courier: '/courier/available',
  admin: '/admin/dashboard',
};

export default function RoleGuard({ allowedRole, children }) {
  const loggedIn = isLoggedIn();
  const role = getUserRole();

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to={roleRedirectMap[role] || '/login'} replace />;
  }

  return children;
}
