import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import Home from '@/pages/Home';
import AIEnhancePage from '@/pages/AIEnhancePage';
import ProductsPage from '@/pages/ProductsPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import TemplatesPage from '@/pages/TemplatesPage';
import EditorPage from '@/pages/EditorPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import OrderListPage from '@/pages/OrderListPage';
import OrderDetailPage from '@/pages/OrderDetailPage';
import UserCenterPage from '@/pages/UserCenterPage';
import UserPhotosPage from '@/pages/UserPhotosPage';
import UserWorksPage from '@/pages/UserWorksPage';
import CommunityPage from '@/pages/CommunityPage';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminSkuPage from '@/pages/AdminSkuPage';
import AdminAuditPage from '@/pages/AdminAuditPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/ai-enhance" element={<AIEnhancePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="/templates/:productId" element={<TemplatesPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrderListPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/user" element={<UserCenterPage />} />
          <Route path="/user/photos" element={<UserPhotosPage />} />
          <Route path="/user/works" element={<UserWorksPage />} />
          <Route path="/community" element={<CommunityPage />} />
        </Route>

        <Route path="/editor/:templateId" element={<EditorPage />} />

        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/sku" element={<AdminSkuPage />} />
          <Route path="/admin/audit" element={<AdminAuditPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
