import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

const SceneEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/scenes/builder?id=${id}`} replace />;
};

export default SceneEditPage;
