import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useUserStore from '../store/userStore';

function ProtectedRoute({ children, requireModerator = false }) {
  const { isAuthenticated, isAdmin, isModerator } = useUserStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireModerator && !isModerator() && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
