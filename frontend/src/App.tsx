import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ExplorePage from './pages/ExplorePage'
import TopicPage from './pages/TopicPage'
import ContentDetailPage from './pages/ContentDetailPage'
import CreateContentPage from './pages/CreateContentPage'
import EditContentPage from './pages/EditContentPage'
import ProfilePage from './pages/ProfilePage'
import CollectionsPage from './pages/CollectionsPage'
import CollectionDetailPage from './pages/CollectionDetailPage'
import NotificationsPage from './pages/NotificationsPage'
import EarningsPage from './pages/EarningsPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminContentsPage from './pages/admin/AdminContentsPage'
import AdminReviewPage from './pages/admin/AdminReviewPage'
import AdminTopicsPage from './pages/admin/AdminTopicsPage'
import AdminHotListPage from './pages/admin/AdminHotListPage'
import AdminSensitivePage from './pages/admin/AdminSensitivePage'
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="topic/:slug" element={<TopicPage />} />
        <Route path="content/:id" element={<ContentDetailPage />} />
        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="profile/:id" element={<ProfilePage />} />
        <Route path="create" element={<ProtectedRoute><CreateContentPage /></ProtectedRoute>} />
        <Route path="edit/:id" element={<ProtectedRoute><EditContentPage /></ProtectedRoute>} />
        <Route path="collections" element={<ProtectedRoute><CollectionsPage /></ProtectedRoute>} />
        <Route path="collection/:id" element={<ProtectedRoute><CollectionDetailPage /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="earnings" element={<ProtectedRoute><EarningsPage /></ProtectedRoute>} />
      </Route>
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="contents" element={<AdminContentsPage />} />
        <Route path="review" element={<AdminReviewPage />} />
        <Route path="topics" element={<AdminTopicsPage />} />
        <Route path="hotlist" element={<AdminHotListPage />} />
        <Route path="sensitive" element={<AdminSensitivePage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
      </Route>
    </Routes>
  )
}
