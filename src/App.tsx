import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import Reporter from './pages/Reporter';
import Sentiment from './pages/Sentiment';
import Training from './pages/Training';
import Assets from './pages/Assets';

const pageConfig: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: '数据大屏', subtitle: '融媒效能指标实时监控' },
  '/editor': { title: '编辑后台', subtitle: '多格式稿件协同编辑与审核分发' },
  '/reporter': { title: '记者移动端', subtitle: '素材回传与选题申报' },
  '/sentiment': { title: '舆情监测', subtitle: '实时舆情监测与热点分析' },
  '/training': { title: '培训管理', subtitle: '在线学习与考试认证' },
  '/assets': { title: '内容资产', subtitle: '素材管理与版权授权' },
};

function AppContent() {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isDashboard = location.pathname === '/';
  const config = pageConfig[location.pathname] || { title: '', subtitle: '' };

  if (isDashboard) {
    return (
      <div className="min-h-screen dashboard-bg">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <Dashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header title={config.title} subtitle={config.subtitle} />
        <main className="p-6">
          <Routes>
            <Route path="/editor" element={<Editor />} />
            <Route path="/reporter" element={<Reporter />} />
            <Route path="/sentiment" element={<Sentiment />} />
            <Route path="/training" element={<Training />} />
            <Route path="/assets" element={<Assets />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </Router>
  );
}

export default App;
