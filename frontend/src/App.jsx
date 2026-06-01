import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Liquors from './pages/Liquors.jsx';
import Recipes from './pages/Recipes.jsx';
import Sales from './pages/Sales.jsx';
import StockTake from './pages/StockTake.jsx';
import Reports from './pages/Reports.jsx';

const navItems = [
  { path: '/', label: '数据看板', icon: '📊' },
  { path: '/liquors', label: '酒水档案', icon: '🍾' },
  { path: '/recipes', label: '配方管理', icon: '📋' },
  { path: '/sales', label: '销售出杯', icon: '💰' },
  { path: '/stock-take', label: '库存盘点', icon: '📦' },
  { path: '/reports', label: '毛利报表', icon: '📈' },
];

function App() {
  const [currentUser, setCurrentUser] = useState({ name: '张店长', role: 'manager' });
  const location = useLocation();

  return (
    <div className="app">
      <Sidebar navItems={navItems} currentPath={location.pathname} user={currentUser} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/liquors" element={<Liquors />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/stock-take" element={<StockTake />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
