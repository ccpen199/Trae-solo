import { Layout } from 'antd';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Breadcrumb from './components/Breadcrumb';

const { Content } = Layout;

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Layout>
        <Header />
        <Content className="px-4 md:px-6 py-4 md:py-6 overflow-auto">
          <div className="mb-4">
            <Breadcrumb />
          </div>
          <div className="min-h-[calc(100vh-64px-48px-48px-48px)]">
            <Outlet />
          </div>
          <footer className="mt-8 py-4 text-center text-xs text-gray-400 border-t border-gray-100">
            © {new Date().getFullYear()} 华南制造业智能招聘中台 · Powered by 科技创新
          </footer>
        </Content>
      </Layout>
    </Layout>
  );
}
