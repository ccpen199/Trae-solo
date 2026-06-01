import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import Tasks from './pages/Tasks';
import ChangeOrders from './pages/ChangeOrders';
import Executions from './pages/Executions';
import Audits from './pages/Audits';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  function renderPage() {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'applications':
        return <Applications />;
      case 'tasks':
        return <Tasks />;
      case 'change-orders':
        return <ChangeOrders />;
      case 'executions':
        return <Executions />;
      case 'audits':
        return <Audits />;
      default:
        return <Dashboard />;
    }
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>任务调度平台</h2>
        <nav>
          <div
            className={'nav-item ' + (currentPage === 'dashboard' ? 'active' : '')}
            onClick={() => setCurrentPage('dashboard')}
          >
            📊 数据看板
          </div>
          <div
            className={'nav-item ' + (currentPage === 'applications' ? 'active' : '')}
            onClick={() => setCurrentPage('applications')}
          >
            📦 应用管理
          </div>
          <div
            className={'nav-item ' + (currentPage === 'tasks' ? 'active' : '')}
            onClick={() => setCurrentPage('tasks')}
          >
            ⚡ 任务调度
          </div>
          <div
            className={'nav-item ' + (currentPage === 'change-orders' ? 'active' : '')}
            onClick={() => setCurrentPage('change-orders')}
          >
            📝 配置变更
          </div>
          <div
            className={'nav-item ' + (currentPage === 'executions' ? 'active' : '')}
            onClick={() => setCurrentPage('executions')}
          >
            📜 执行记录
          </div>
          <div
            className={'nav-item ' + (currentPage === 'audits' ? 'active' : '')}
            onClick={() => setCurrentPage('audits')}
          >
            🔍 权限审计
          </div>
        </nav>
      </aside>
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
