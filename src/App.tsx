import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Home from "@/pages/Home";
import TrafficRecords from "@/pages/TrafficRecords";
import TollCalculator from "@/pages/TollCalculator";
import Recharge from "@/pages/Recharge";
import Outlets from "@/pages/Outlets";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminSettlement from "@/pages/admin/AdminSettlement";
import AdminOBU from "@/pages/admin/AdminOBU";
import AdminException from "@/pages/admin/AdminException";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/AdminSidebar";
import { useStore } from "@/store/useStore";
import { useEffect } from "react";

function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <main className="container py-6">{children}</main>
    </div>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark-900 flex">
      <AdminSidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const { isAdminView, setIsAdminView } = useStore();

  useEffect(() => {
    const isAdminPath = location.pathname.startsWith('/admin');
    if (isAdminPath !== isAdminView) {
      setIsAdminView(isAdminPath);
    }
  }, [location.pathname, isAdminView, setIsAdminView]);

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Routes location={location}>
          <Route path="/" element={<ClientLayout><Home /></ClientLayout>} />
          <Route path="/traffic" element={<ClientLayout><TrafficRecords /></ClientLayout>} />
          <Route path="/toll-calculator" element={<ClientLayout><TollCalculator /></ClientLayout>} />
          <Route path="/recharge" element={<ClientLayout><Recharge /></ClientLayout>} />
          <Route path="/outlets" element={<ClientLayout><Outlets /></ClientLayout>} />
          
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/settlement" element={<AdminLayout><AdminSettlement /></AdminLayout>} />
          <Route path="/admin/obu" element={<AdminLayout><AdminOBU /></AdminLayout>} />
          <Route path="/admin/exception" element={<AdminLayout><AdminException /></AdminLayout>} />
          
          <Route path="*" element={<ClientLayout><div className="text-center py-20"><h2 className="text-2xl font-bold text-dark-800 mb-2">页面未找到</h2><p className="text-dark-500">请检查URL是否正确</p></div></ClientLayout>} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}
