import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import NamingWizard from '@/pages/NamingWizard'
import NamingResults from '@/pages/NamingResults'
import NameDetail from '@/pages/NameDetail'
import Cases from '@/pages/Cases'
import CaseDetail from '@/pages/CaseDetail'
import Masters from '@/pages/Masters'
import MasterDetail from '@/pages/MasterDetail'
import UserCenter from '@/pages/UserCenter'
import ReportPage from '@/pages/ReportPage'
import AdminLogin from '@/pages/AdminLogin'
import AdminDashboard from '@/pages/AdminDashboard'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

function ReportLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen">{children}</div>
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout>
              <Home />
            </MainLayout>
          }
        />
        <Route
          path="/naming/wizard"
          element={
            <MainLayout>
              <NamingWizard />
            </MainLayout>
          }
        />
        <Route
          path="/naming/results"
          element={
            <MainLayout>
              <NamingResults />
            </MainLayout>
          }
        />
        <Route
          path="/name/:id"
          element={
            <MainLayout>
              <NameDetail />
            </MainLayout>
          }
        />
        <Route
          path="/cases"
          element={
            <MainLayout>
              <Cases />
            </MainLayout>
          }
        />
        <Route
          path="/cases/:id"
          element={
            <MainLayout>
              <CaseDetail />
            </MainLayout>
          }
        />
        <Route
          path="/masters"
          element={
            <MainLayout>
              <Masters />
            </MainLayout>
          }
        />
        <Route
          path="/masters/:id"
          element={
            <MainLayout>
              <MasterDetail />
            </MainLayout>
          }
        />
        <Route
          path="/user/history"
          element={
            <MainLayout>
              <UserCenter />
            </MainLayout>
          }
        />
        <Route
          path="/user/favorites"
          element={
            <MainLayout>
              <UserCenter />
            </MainLayout>
          }
        />
        <Route
          path="/user/membership"
          element={
            <MainLayout>
              <UserCenter />
            </MainLayout>
          }
        />
        <Route
          path="/user/settings"
          element={
            <MainLayout>
              <UserCenter />
            </MainLayout>
          }
        />
        <Route
          path="/report/:id"
          element={
            <ReportLayout>
              <ReportPage />
            </ReportLayout>
          }
        />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
    </Router>
  )
}
