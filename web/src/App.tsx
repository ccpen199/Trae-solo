import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import OwnerLayout from './layouts/OwnerLayout';
import MerchantLayout from './layouts/MerchantLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/owner/Home';
import Bills from './pages/owner/Bills';
import WorkOrders from './pages/owner/WorkOrders';
import WorkOrderSubmit from './pages/owner/WorkOrderSubmit';
import Announcements from './pages/owner/Announcements';
import Posts from './pages/owner/Posts';
import Messages from './pages/common/Messages';
import Profile from './pages/common/Profile';

import MerchantHome from './pages/merchant/Home';
import MerchantProducts from './pages/merchant/Products';
import MerchantOrders from './pages/merchant/Orders';

import AdminHome from './pages/admin/Home';
import AdminWorkOrders from './pages/admin/WorkOrders';
import AdminBills from './pages/admin/Bills';
import AdminActivities from './pages/admin/Activities';
import AdminCommunities from './pages/admin/Communities';
import AdminMessages from './pages/admin/Messages';
import AdminGov from './pages/admin/Gov';
import { useAuthStore } from './store/auth';

function App() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (user.role === 'owner') {
    return (
      <OwnerLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/workorders" element={<WorkOrders />} />
          <Route path="/workorders/new" element={<WorkOrderSubmit />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </OwnerLayout>
    );
  }

  if (user.role === 'merchant') {
    return (
      <MerchantLayout>
        <Routes>
          <Route path="/" element={<MerchantHome />} />
          <Route path="/products" element={<MerchantProducts />} />
          <Route path="/orders" element={<MerchantOrders />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MerchantLayout>
    );
  }

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<AdminHome />} />
        <Route path="/workorders" element={<AdminWorkOrders />} />
        <Route path="/bills" element={<AdminBills />} />
        <Route path="/activities" element={<AdminActivities />} />
        <Route path="/communities" element={<AdminCommunities />} />
        <Route path="/messages" element={<AdminMessages />} />
        <Route path="/gov" element={<AdminGov />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminLayout>
  );
}

export default App;
