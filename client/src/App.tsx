import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import HomePage from './pages/HomePage';
import PostDetailPage from './pages/PostDetailPage';
import CreatePostPage from './pages/CreatePostPage';
import CirclesPage from './pages/CirclesPage';
import CircleDetailPage from './pages/CircleDetailPage';
import ActivitiesPage from './pages/ActivitiesPage';
import ActivityDetailPage from './pages/ActivityDetailPage';
import ServicesPage from './pages/ServicesPage';
import PointsPage from './pages/PointsPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminReviews from './pages/admin/AdminReviews';
import AdminHeatmap from './pages/admin/AdminHeatmap';
import { useAuthStore } from './stores/authStore';

function App() {
  const { fetchProfile, token } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token, fetchProfile]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="heatmap" element={<AdminHeatmap />} />
      </Route>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="post/:id" element={<PostDetailPage />} />
        <Route path="create-post" element={<CreatePostPage />} />
        <Route path="circles" element={<CirclesPage />} />
        <Route path="circle/:id" element={<CircleDetailPage />} />
        <Route path="activities" element={<ActivitiesPage />} />
        <Route path="activity/:id" element={<ActivityDetailPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="points" element={<PointsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

export default App;
