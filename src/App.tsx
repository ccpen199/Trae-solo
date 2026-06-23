import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout/Layout";
import Dashboard from "@/pages/Dashboard";
import UserProfile from "@/pages/UserProfile";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route
            path="/meter-reading"
            element={
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <p className="text-lg">智能抄表</p>
                  <p className="text-sm mt-2">功能开发中...</p>
                </div>
              </div>
            }
          />
          <Route
            path="/payment"
            element={
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <p className="text-lg">缴费中心</p>
                  <p className="text-sm mt-2">功能开发中...</p>
                </div>
              </div>
            }
          />
          <Route
            path="/repair"
            element={
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <p className="text-lg">报修工单</p>
                  <p className="text-sm mt-2">功能开发中...</p>
                </div>
              </div>
            }
          />
          <Route
            path="/inspection"
            element={
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <p className="text-lg">巡检管理</p>
                  <p className="text-sm mt-2">功能开发中...</p>
                </div>
              </div>
            }
          />
          <Route
            path="/warning"
            element={
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <p className="text-lg">安全预警</p>
                  <p className="text-sm mt-2">功能开发中...</p>
                </div>
              </div>
            }
          />
          <Route
            path="/gis"
            element={
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <p className="text-lg">GIS服务网点</p>
                  <p className="text-sm mt-2">功能开发中...</p>
                </div>
              </div>
            }
          />
          <Route
            path="/admin/pricing"
            element={
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <p className="text-lg">阶梯计价</p>
                  <p className="text-sm mt-2">功能开发中...</p>
                </div>
              </div>
            }
          />
          <Route
            path="/admin/outage"
            element={
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <p className="text-lg">停气排程</p>
                  <p className="text-sm mt-2">功能开发中...</p>
                </div>
              </div>
            }
          />
          <Route
            path="/admin/billing"
            element={
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <p className="text-lg">账单引擎</p>
                  <p className="text-sm mt-2">功能开发中...</p>
                </div>
              </div>
            }
          />
          <Route
            path="/admin/reporting"
            element={
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <p className="text-lg">指标报送</p>
                  <p className="text-sm mt-2">功能开发中...</p>
                </div>
              </div>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}
