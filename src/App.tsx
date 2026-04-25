import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import SourcesManagement from './pages/SourcesManagement';
import Monitoring from './pages/Monitoring';
import AlertsManagement from './pages/AlertsManagement';
import ReportsManagement from './pages/ReportsManagement';
import { useAppStore } from './store/appStore';
import './App.css';

function App() {
  const { currentPage } = useAppStore();
  
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'sources':
        return <SourcesManagement />;
      case 'monitoring':
        return <Monitoring />;
      case 'alerts':
        return <AlertsManagement />;
      case 'reports':
        return <ReportsManagement />;
      default:
        return <Dashboard />;
    }
  };
  
  return (
    <ConfigProvider locale={zhCN}>
      <MainLayout>
        {renderPage()}
      </MainLayout>
    </ConfigProvider>
  );
}

export default App;
