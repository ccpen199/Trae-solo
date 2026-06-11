import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar, StarfieldBackground } from '@/components/layout';
import { AudioPlayer } from '@/components/audio';
import DashboardPage from '@/pages/DashboardPage';
import MonitorPage from '@/pages/MonitorPage';
import ReportPage from '@/pages/ReportPage';
import AudioPage from '@/pages/AudioPage';
import PlanPage from '@/pages/PlanPage';
import MorningPage from '@/pages/MorningPage';
import RiskPage from '@/pages/RiskPage';
import ProfilePage from '@/pages/ProfilePage';

function PageLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div className="min-h-screen relative">
      <StarfieldBackground />
      <Sidebar />
      <main className="md:ml-72 min-h-screen relative z-10 pb-36">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 md:p-10 max-w-[1600px] mx-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <AudioPlayer />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PageLayout><DashboardPage /></PageLayout>} />
      <Route path="/monitor" element={<PageLayout><MonitorPage /></PageLayout>} />
      <Route path="/report/:date" element={<PageLayout><ReportPage /></PageLayout>} />
      <Route path="/reports" element={<PageLayout><ReportPage /></PageLayout>} />
      <Route path="/audio" element={<PageLayout><AudioPage /></PageLayout>} />
      <Route path="/plan" element={<PageLayout><PlanPage /></PageLayout>} />
      <Route path="/morning" element={<PageLayout><MorningPage /></PageLayout>} />
      <Route path="/risk" element={<PageLayout><RiskPage /></PageLayout>} />
      <Route path="/profile" element={<PageLayout><ProfilePage /></PageLayout>} />
      <Route path="*" element={<PageLayout><DashboardPage /></PageLayout>} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
