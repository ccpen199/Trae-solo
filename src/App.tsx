import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";

import BaoliaoList from "@/pages/baoliao/List";
import PublishBaoliao from "@/pages/baoliao/Publish";
import BaoliaoDetail from "@/pages/baoliao/Detail";

import CircleList from "@/pages/circles/List";
import CircleDetail from "@/pages/circles/Detail";
import ActivityPublish from "@/pages/circles/ActivityPublish";
import ActivityDetail from "@/pages/activity/Detail";

import ServiceIndex from "@/pages/services/Index";
import BusService from "@/pages/services/Bus";
import CinemaService from "@/pages/services/Cinema";
import JobService from "@/pages/services/Job";
import GovernmentService from "@/pages/services/Government";

import PointCenter from "@/pages/points/Center";
import PointMall from "@/pages/points/Mall";
import PointDonate from "@/pages/points/Donate";
import PointRecords from "@/pages/points/Records";
import PointHelp from "@/pages/points/Help";

import ActivityManage from "@/pages/activity/Manage";

import AdminDashboard from "@/pages/admin/Dashboard";
import AdminReview from "@/pages/admin/Review";
import AdminHeatmap from "@/pages/admin/Heatmap";
import AdminStats from "@/pages/admin/Stats";

import Header from "@/components/layout/Header";
import TabBar from "@/components/layout/TabBar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { useUserStore } from "@/stores/useUserStore";

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -20,
  },
};

const pageTransition = {
  type: "tween" as const,
  ease: "easeOut" as const,
  duration: 0.3,
};

const AnimatedPage = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={pageVariants}
    transition={pageTransition}
    className="flex-1"
  >
    {children}
  </motion.div>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const AppLayout = () => {
  const location = useLocation();
  const { user } = useUserStore();

  const isAdminPage = location.pathname.startsWith("/admin");
  const isLoginPage = location.pathname === "/login";
  const isPublishPage = location.pathname === "/baoliao/publish";

  if (isAdminPage) {
    const hasAccess = user?.role === "editor" || user?.role === "government";
    
    return (
      <div className="min-h-screen bg-neutral-900 flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col ml-0 lg:ml-64">
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/admin" element={<AnimatedPage><AdminDashboard /></AnimatedPage>} />
                <Route path="/admin/review" element={<AnimatedPage><AdminReview /></AnimatedPage>} />
                <Route path="/admin/heatmap" element={<AnimatedPage><AdminHeatmap /></AnimatedPage>} />
                <Route path="/admin/statistics" element={<AnimatedPage><AdminStats /></AnimatedPage>} />
                <Route 
                  path="/admin/users" 
                  element={
                    <AnimatedPage>
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <h1 className="text-2xl font-bold text-white mb-2">用户管理</h1>
                          <p className="text-neutral-400">功能开发中</p>
                        </div>
                      </div>
                    </AnimatedPage>
                  } 
                />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    return (
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
          </Routes>
        </AnimatePresence>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header />
      <main className={`flex-1 ${isPublishPage ? 'pb-0' : 'pb-20 md:pb-0'}`}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<AnimatedPage><Home /></AnimatedPage>} />
            <Route path="/profile" element={<AnimatedPage><Profile /></AnimatedPage>} />
            
            <Route path="/baoliao" element={<AnimatedPage><BaoliaoList /></AnimatedPage>} />
            <Route path="/baoliao/publish" element={<AnimatedPage><PublishBaoliao /></AnimatedPage>} />
            <Route path="/baoliao/:id" element={<AnimatedPage><BaoliaoDetail /></AnimatedPage>} />
            
            <Route path="/circles" element={<AnimatedPage><CircleList /></AnimatedPage>} />
            <Route path="/circles/:id" element={<AnimatedPage><CircleDetail /></AnimatedPage>} />
            <Route path="/circles/:id/activity/publish" element={<AnimatedPage><ActivityPublish /></AnimatedPage>} />
            <Route path="/activity/:id" element={<AnimatedPage><ActivityDetail /></AnimatedPage>} />
            
            <Route path="/services" element={<AnimatedPage><ServiceIndex /></AnimatedPage>} />
            <Route path="/services/bus" element={<AnimatedPage><BusService /></AnimatedPage>} />
            <Route path="/services/cinema" element={<AnimatedPage><CinemaService /></AnimatedPage>} />
            <Route path="/services/job" element={<AnimatedPage><JobService /></AnimatedPage>} />
            <Route path="/services/government" element={<AnimatedPage><GovernmentService /></AnimatedPage>} />
            
            <Route path="/points" element={<AnimatedPage><PointCenter /></AnimatedPage>} />
            <Route path="/points/mall" element={<AnimatedPage><PointMall /></AnimatedPage>} />
            <Route path="/points/donate" element={<AnimatedPage><PointDonate /></AnimatedPage>} />
            <Route path="/points/records" element={<AnimatedPage><PointRecords /></AnimatedPage>} />
            <Route path="/points/help" element={<AnimatedPage><PointHelp /></AnimatedPage>} />
            
            <Route path="/activity/:id" element={<AnimatedPage><ActivityDetail /></AnimatedPage>} />
            <Route path="/activity/:activityId/manage" element={<AnimatedPage><ActivityManage /></AnimatedPage>} />
            
            <Route 
              path="*" 
              element={
                <AnimatedPage>
                  <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <h1 className="text-6xl font-bold text-westlake-500 mb-4">404</h1>
                    <p className="text-xl text-neutral-600 mb-8">页面不存在或已被移除</p>
                    <button 
                      onClick={() => window.location.href = '/'}
                      className="btn-primary"
                    >
                      返回首页
                    </button>
                  </div>
                </AnimatedPage>
              } 
            />
          </Routes>
        </AnimatePresence>
      </main>
      <TabBar />
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppLayout />
    </Router>
  );
}
