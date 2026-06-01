import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ShipmentList from './pages/ShipmentList';
import ShipmentCreate from './pages/ShipmentCreate';
import ShipmentDetail from './pages/ShipmentDetail';

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>✈️ 空运运单管理系统</h1>
      </header>
      <nav className="nav">
        <NavLink to="/" end>工作台</NavLink>
        <NavLink to="/shipments">运单管理</NavLink>
        <NavLink to="/shipments/new">新建运单</NavLink>
      </nav>
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/shipments" element={<ShipmentList />} />
          <Route path="/shipments/new" element={<ShipmentCreate />} />
          <Route path="/shipments/:id" element={<ShipmentDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
