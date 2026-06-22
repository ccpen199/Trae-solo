import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import NewsList from "@/pages/NewsList";
import NewsDetail from "@/pages/NewsDetail";
import WorkOrderList from "@/pages/WorkOrderList";
import WorkOrderSubmit from "@/pages/WorkOrderSubmit";
import WorkOrderDetail from "@/pages/WorkOrderDetail";
import Emergency from "@/pages/Emergency";
import ServiceMap from "@/pages/ServiceMap";
import Services from "@/pages/Services";
import AdminContent from "@/pages/AdminContent";
import AdminAnalytics from "@/pages/AdminAnalytics";
import ElderlySettings from "@/pages/ElderlySettings";
import { initAccessibility } from "@/store";

export default function App() {
  useEffect(() => {
    initAccessibility();
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<NewsList />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/workorders" element={<WorkOrderList />} />
          <Route path="/workorders/submit" element={<WorkOrderSubmit />} />
          <Route path="/workorders/:id" element={<WorkOrderDetail />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/map" element={<ServiceMap />} />
          <Route path="/services" element={<Services />} />
          <Route path="/admin/content" element={<AdminContent />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/elderly-settings" element={<ElderlySettings />} />
          <Route path="*" element={
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="text-center">
                <p className="text-6xl font-bold text-gov-200 mb-4">404</p>
                <p className="text-xl text-gray-600 mb-6">页面未找到</p>
                <a href="/" className="btn-primary">返回首页</a>
              </div>
            </div>
          } />
        </Routes>
      </Layout>
    </Router>
  );
}
