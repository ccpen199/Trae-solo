import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';

const BlankLayout: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
};

export default BlankLayout;
