import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PropertyList from './pages/PropertyList';
import PropertyDetail from './pages/PropertyDetail';
import PublishProperty from './pages/PublishProperty';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import TenantDashboard from './pages/TenantDashboard';
import LandlordDashboard from './pages/LandlordDashboard';
import Services from './pages/Services';
import Escrow from './pages/Escrow';
import Contracts from './pages/Contracts';
import Insurance from './pages/Insurance';
import Disputes from './pages/Disputes';
import RentIndex from './pages/RentIndex';
import CreditCenter from './pages/CreditCenter';
import WorkOrders from './pages/WorkOrders';
import { useAuthStore } from './store/authStore';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user?.role === 'landlord') {
      return <Navigate to="/dashboard/landlord" replace />;
    } else {
      return <Navigate to="/dashboard/tenant" replace />;
    }
  }
  
  return children;
};

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<PropertyList />} />
          <Route path="/properties" element={<PropertyList />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          
          <Route path="/dashboard/tenant" element={
            <ProtectedRoute requiredRole="tenant">
              <TenantDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/landlord" element={
            <ProtectedRoute requiredRole="landlord">
              <LandlordDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/publish" element={
            <ProtectedRoute requiredRole="landlord">
              <PublishProperty />
            </ProtectedRoute>
          } />
          
          <Route path="/services" element={<Services />} />
          <Route path="/escrow" element={<Escrow />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/insurance" element={<Insurance />} />
          <Route path="/disputes" element={<Disputes />} />
          <Route path="/rent-index" element={<RentIndex />} />
          <Route path="/credit" element={<CreditCenter />} />
          <Route path="/workorders" element={<WorkOrders />} />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <AdminDashboard />
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
