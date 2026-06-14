import React, { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';

const { Content } = Layout;

const BasicLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout className="min-h-screen bg-neutral-50">
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout>
        <Header collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <Content
          className="mx-4 my-4 p-6 bg-white rounded-lg shadow-sm overflow-auto"
          style={{ minHeight: 'calc(100vh - 64px - 48px - 32px)' }}
        >
          <Outlet />
        </Content>
        <Footer />
      </Layout>
    </Layout>
  );
};

export default BasicLayout;
