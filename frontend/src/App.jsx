import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import Materials from './pages/Materials';
import Prices from './pages/Prices';
import CostCalculator from './pages/CostCalculator';
import Quotes from './pages/Quotes';
import QuoteDetail from './pages/QuoteDetail';
import Reports from './pages/Reports';

function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <h1>🍪 食品成本核算系统</h1>
        <nav>
          <ul>
            <li><NavLink to="/" end>仪表盘</NavLink></li>
            <li><NavLink to="/recipes">配方库</NavLink></li>
            <li><NavLink to="/materials">原料管理</NavLink></li>
            <li><NavLink to="/prices">原料价格</NavLink></li>
            <li><NavLink to="/costs">成本计算</NavLink></li>
            <li><NavLink to="/quotes">报价管理</NavLink></li>
            <li><NavLink to="/reports">毛利报表</NavLink></li>
          </ul>
        </nav>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/prices" element={<Prices />} />
          <Route path="/costs" element={<CostCalculator />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/quotes/:id" element={<QuoteDetail />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
