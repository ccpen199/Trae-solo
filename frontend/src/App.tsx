import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ReturnRequests from './pages/ReturnRequests';
import ReturnRequestDetail from './pages/ReturnRequestDetail';
import WarehouseInspection from './pages/WarehouseInspection';
import Processing from './pages/Processing';
import RefundManagement from './pages/RefundManagement';
import Reports from './pages/Reports';

function App() {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>
              仪表盘
            </NavLink>
          </li>
          <li>
            <NavLink to="/return-requests" className={({ isActive }) => isActive ? 'active' : ''}>
              退货申请
            </NavLink>
          </li>
          <li>
            <NavLink to="/warehouse-inspection" className={({ isActive }) => isActive ? 'active' : ''}>
              入仓检验
            </NavLink>
          </li>
          <li>
            <NavLink to="/processing" className={({ isActive }) => isActive ? 'active' : ''}>
              处理决策
            </NavLink>
          </li>
          <li>
            <NavLink to="/refunds" className={({ isActive }) => isActive ? 'active' : ''}>
              退款管理
            </NavLink>
          </li>
          <li>
            <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
              报表中心
            </NavLink>
          </li>
        </ul>
      </nav>
      
      <div className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/return-requests" element={<ReturnRequests />} />
          <Route path="/return-requests/:id" element={<ReturnRequestDetail />} />
          <Route path="/warehouse-inspection" element={<WarehouseInspection />} />
          <Route path="/processing" element={<Processing />} />
          <Route path="/refunds" element={<RefundManagement />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
