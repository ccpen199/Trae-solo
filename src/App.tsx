import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Spinner } from '@/components/common/UIComponents';
import { OwnerLayout } from '@/components/layouts/AppLayout';
import { StoreLayout } from '@/components/layouts/AppLayout';
import { useAuthStore } from '@/stores/authStore';
import Login from '@/pages/Login';
import OwnerHome from '@/pages/owner/OwnerHome';
import PetDetail from '@/pages/owner/PetDetail';
import BookingPage from '@/pages/owner/BookingPage';
import HealthRecordsPage from '@/pages/owner/HealthRecordsPage';
import ShopPage from '@/pages/owner/ShopPage';
import ConsultPage from '@/pages/owner/ConsultPage';
import SymptomCheckPage from '@/pages/owner/SymptomCheckPage';
import MemberCenterPage from '@/pages/owner/MemberCenterPage';
import StoreDashboard from '@/pages/store/StoreDashboard';
import SchedulePage from '@/pages/store/SchedulePage';
import ServiceExecutionPage from '@/pages/store/ServiceExecutionPage';
import InventoryPage from '@/pages/store/InventoryPage';
import MedicalRecordsPage from '@/pages/store/MedicalRecordsPage';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

function OwnerRoutes() {
  return (
    <OwnerLayout>
      <AnimatePresence mode="wait">
        <Routes>
          <Route
            index
            element={
              <motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <OwnerHome />
              </motion.div>
            }
          />
          <Route
            path="pets"
            element={
              <motion.div key="pets" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <OwnerHome />
              </motion.div>
            }
          />
          <Route
            path="pet/:id"
            element={
              <motion.div key="pet-detail" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <PetDetail />
              </motion.div>
            }
          />
          <Route
            path="booking"
            element={
              <motion.div key="booking" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <BookingPage />
              </motion.div>
            }
          />
          <Route
            path="health-records"
            element={
              <motion.div key="health-records" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <HealthRecordsPage />
              </motion.div>
            }
          />
          <Route
            path="shop"
            element={
              <motion.div key="shop" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <ShopPage />
              </motion.div>
            }
          />
          <Route
            path="consult"
            element={
              <motion.div key="consult" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <ConsultPage />
              </motion.div>
            }
          />
          <Route
            path="symptom-check"
            element={
              <motion.div key="symptom-check" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <SymptomCheckPage />
              </motion.div>
            }
          />
          <Route
            path="member"
            element={
              <motion.div key="member" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <MemberCenterPage />
              </motion.div>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </OwnerLayout>
  );
}

function StoreRoutes() {
  return (
    <StoreLayout>
      <AnimatePresence mode="wait">
        <Routes>
          <Route
            index
            element={
              <motion.div key="dashboard" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <StoreDashboard />
              </motion.div>
            }
          />
          <Route
            path="schedule"
            element={
              <motion.div key="schedule" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <SchedulePage />
              </motion.div>
            }
          />
          <Route
            path="service"
            element={
              <motion.div key="service" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <ServiceExecutionPage />
              </motion.div>
            }
          />
          <Route
            path="services"
            element={
              <motion.div key="services" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <ServiceExecutionPage />
              </motion.div>
            }
          />
          <Route
            path="inventory"
            element={
              <motion.div key="inventory" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <InventoryPage />
              </motion.div>
            }
          />
          <Route
            path="medical"
            element={
              <motion.div key="medical" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <MedicalRecordsPage />
              </motion.div>
            }
          />
          <Route
            path="records"
            element={
              <motion.div key="records" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <MedicalRecordsPage />
              </motion.div>
            }
          />
          <Route
            path="members"
            element={
              <motion.div key="members" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <StoreDashboard />
              </motion.div>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </StoreLayout>
  );
}

function AppContent() {
  const { user, isAuthenticated, isLoading, initialize } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-mint-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-neutral-500">正在加载...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AnimatePresence>
    );
  }

  if (user?.role === 'owner') {
    return (
      <Routes location={location} key={location.pathname}>
        <Route path="/owner/*" element={<OwnerRoutes />} />
        <Route path="*" element={<Navigate to="/owner" replace />} />
      </Routes>
    );
  }

  if (user?.role === 'store_staff' || user?.role === 'store_manager') {
    return (
      <Routes location={location} key={location.pathname}>
        <Route path="/store/*" element={<StoreRoutes />} />
        <Route path="*" element={<Navigate to="/store" replace />} />
      </Routes>
    );
  }

  if (user?.role === 'veterinarian') {
    return (
      <Routes location={location} key={location.pathname}>
        <Route path="/store/*" element={<StoreRoutes />} />
        <Route path="*" element={<Navigate to="/store" replace />} />
      </Routes>
    );
  }

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
