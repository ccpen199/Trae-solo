import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Dishes from './pages/Dishes.jsx';
import DishDetail from './pages/DishDetail.jsx';
import Ingredients from './pages/Ingredients.jsx';
import Launch from './pages/Launch.jsx';
import Acceptance from './pages/Acceptance.jsx';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <div className="sidebar">
          <h2>🍳 菜品研发系统</h2>
          <nav>
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
              仪表盘
            </NavLink>
            <NavLink to="/dishes" className={({ isActive }) => isActive ? 'active' : ''}>
              菜品立项
            </NavLink>
            <NavLink to="/ingredients" className={({ isActive }) => isActive ? 'active' : ''}>
              原料库
            </NavLink>
            <NavLink to="/launch" className={({ isActive }) => isActive ? 'active' : ''}>
              上新计划
            </NavLink>
            <NavLink to="/acceptance" className={({ isActive }) => isActive ? 'active' : ''}>
              验收管理
            </NavLink>
          </nav>
        </div>
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dishes" element={<Dishes />} />
            <Route path="/dishes/:id" element={<DishDetail />} />
            <Route path="/ingredients" element={<Ingredients />} />
            <Route path="/launch" element={<Launch />} />
            <Route path="/acceptance" element={<Acceptance />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
