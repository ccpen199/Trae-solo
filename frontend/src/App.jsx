import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getUser } from './api';
import AuthGuard from './components/AuthGuard';
import SelectRole from './pages/SelectRole';
import Home from './pages/Home';
import CreateRequest from './pages/CreateRequest';
import RequestDetail from './pages/RequestDetail';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import Orders from './pages/Orders';

function App() {
  const user = getUser();

  return (
    <Router>
      <Routes>
        <Route path="/select-role" element={<SelectRole />} />
        <Route path="/" element={
          <AuthGuard>
            <Home />
          </AuthGuard>
        } />
        <Route path="/create-request" element={
          <AuthGuard requireRole="student">
            <CreateRequest />
          </AuthGuard>
        } />
        <Route path="/request/:id" element={
          <AuthGuard>
            <RequestDetail />
          </AuthGuard>
        } />
        <Route path="/order/:id" element={
          <AuthGuard>
            <OrderDetail />
          </AuthGuard>
        } />
        <Route path="/orders" element={
          <AuthGuard>
            <Orders />
          </AuthGuard>
        } />
        <Route path="/profile" element={
          <AuthGuard>
            <Profile />
          </AuthGuard>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
