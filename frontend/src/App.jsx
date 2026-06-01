import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import OrderResult from './pages/OrderResult';
import Orders from './pages/Orders';
import Admin from './pages/Admin';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <div className="container">
            <div className="header-content">
              <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
                <div className="logo">✈️ 红人旅游</div>
              </Link>
              <nav className="nav-links">
                <Link to="/">首页</Link>
                <Link to="/orders">我的订单</Link>
                <Link to="/admin">后台管理</Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="container" style={{ padding: '20px 16px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/order-result/:id" element={<OrderResult />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/admin/*" element={<Admin />} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="container">
            <p>© 2024 红人旅游 - 让旅行更简单</p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
