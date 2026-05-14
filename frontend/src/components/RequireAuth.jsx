import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useStore from '../store';

const RequireAuth = ({ children }) => {
  const token = useStore(state => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAuth;
