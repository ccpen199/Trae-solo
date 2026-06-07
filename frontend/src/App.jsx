import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Tracking from './pages/Tracking';
import Shipping from './pages/Shipping';
import Urgent from './pages/Urgent';
import International from './pages/International';
import Admin from './pages/Admin';
import './pages/styles.css';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/urgent" element={<Urgent />} />
            <Route path="/international" element={<International />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

function Header() {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">快递全链路平台</span>
            </div>
            <nav className="hidden md:flex space-x-4">
              <Link to="/tracking" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md font-medium transition-colors">
                查快递
              </Link>
              <Link to="/shipping" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md font-medium transition-colors">
                寄快递
              </Link>
              <Link to="/urgent" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md font-medium transition-colors">
                同城急送
              </Link>
              <Link to="/international" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md font-medium transition-colors">
                国际件
              </Link>
              <Link to="/admin" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md font-medium transition-colors">
                管理后台
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/?login=1')} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium">
              登录/注册
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold mb-4">关于我们</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>公司简介</li>
              <li>联系我们</li>
              <li>加入我们</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">服务支持</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>使用帮助</li>
              <li>常见问题</li>
              <li>投诉建议</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">法律声明</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>服务条款</li>
              <li>隐私政策</li>
              <li>用户协议</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">关注我们</h3>
            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 cursor-pointer">
                <span className="text-xs">微</span>
              </div>
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 cursor-pointer">
                <span className="text-xs">博</span>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>© 2026 快递物流全链路数智化服务平台 版权所有</p>
        </div>
      </div>
    </footer>
  );
}

export default App;
