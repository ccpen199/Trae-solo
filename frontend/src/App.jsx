import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Certification from './pages/Certification.jsx';
import Payment from './pages/Payment.jsx';
import Card from './pages/Card.jsx';
import Wallet from './pages/Wallet.jsx';
import Admin from './pages/Admin.jsx';
function App() {
 return (<div className="app">
 <Router>
 <header className="header">
 <h1>省级社保民生综合服务平台</h1>
 <nav className="nav">
 <NavLink to="/" end>首页</NavLink>
 <NavLink to="/certification">待遇认证</NavLink>
 <NavLink to="/payment">社保缴费</NavLink>
 <NavLink to="/card">电子社保卡</NavLink>
 <NavLink to="/wallet">养老钱包</NavLink>
 <NavLink to="/admin">管理后台</NavLink>
 </nav>
 </header>
 <main className="main">
 <Routes>
 <Route path="/" element={<Home />}/>
 <Route path="/certification" element={<Certification />}/>
 <Route path="/payment" element={<Payment />}/>
 <Route path="/card" element={<Card />}/>
 <Route path="/wallet" element={<Wallet />}/>
 <Route path="/admin" element={<Admin />}/>
 </Routes>
 </main>
 </Router>
 </div>);
}
export default App;

