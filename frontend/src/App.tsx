import { Routes, Route, NavLink } from 'react-router-dom';
import MapPage from './pages/MapPage';
import ChargingPage from './pages/ChargingPage';
import VehiclePage from './pages/VehiclePage';
import DashboardPage from './pages/DashboardPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import ReviewPage from './pages/ReviewPage';

function App() {
  return (
    <div className="layout">
      <header className="header">
        <div className="header-logo">
          <span>⚡</span>
          <span>新能源充电服务平台</span>
        </div>
        <nav className="header-nav">
          <NavLink to="/" className="nav-link" end>
            充电地图
          </NavLink>
          <NavLink to="/charging" className="nav-link">
            启动充电
          </NavLink>
          <NavLink to="/vehicles" className="nav-link">
            我的车辆
          </NavLink>
          <NavLink to="/dashboard" className="nav-link">
            运营看板
          </NavLink>
          <NavLink to="/work-orders" className="nav-link">
            工单调度
          </NavLink>
          <NavLink to="/reviews" className="nav-link">
            评论审核
          </NavLink>
        </nav>
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/charging" element={<ChargingPage />} />
          <Route path="/vehicles" element={<VehiclePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/work-orders" element={<WorkOrdersPage />} />
          <Route path="/reviews" element={<ReviewPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
