import { Navigate, useLocation } from 'react-router-dom';
import { getUser } from '../api';

const AuthGuard = ({ children, requireRole }) => {
  const location = useLocation();
  const user = getUser();

  if (!user) {
    return <Navigate to="/select-role" state={{ from: location }} replace />;
  }

  if (requireRole && user.role !== requireRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AuthGuard;
