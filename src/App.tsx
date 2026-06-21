import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Search from "@/pages/Search";
import CompanyDetail from "@/pages/CompanyDetail";
import Reports from "@/pages/Reports";
import Developers from "@/pages/Developers";
import Calculator from "@/pages/Calculator";
import AIHelper from "@/pages/AIHelper";
import Templates from "@/pages/Templates";
import CaseMarket from "@/pages/CaseMarket";
import CaseDetail from "@/pages/CaseDetail";
import CasePublish from "@/pages/CasePublish";
import Bidding from "@/pages/Bidding";
import Contracts from "@/pages/Contracts";
import Workspace from "@/pages/Workspace";
import CaseWorkspace from "@/pages/CaseWorkspace";
import KanbanBoard from "@/pages/KanbanBoard";
import Evidence from "@/pages/Evidence";
import ToolsCenter from "@/pages/Tools";
import Team from "@/pages/Team";
import Finance from "@/pages/Finance";
import Settings from "@/pages/Settings";
import AppLayout from "@/components/layout/AppLayout";
import legalTheme from "@/styles/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={legalTheme} locale={zhCN}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="search" element={<Search />} />
              <Route path="search/company/:id" element={<CompanyDetail />} />
              <Route path="reports" element={<Reports />} />
              <Route path="reports/new" element={<Reports />} />
              <Route path="developers" element={<Developers />} />
              <Route path="cases" element={<CaseMarket />} />
              <Route path="cases/:id" element={<CaseDetail />} />
              <Route path="cases/publish" element={<CasePublish />} />
              <Route path="cases/bidding" element={<Bidding />} />
              <Route path="contracts" element={<Contracts />} />
              <Route path="workspace" element={<Workspace />} />
              <Route path="workspace/case/:id" element={<CaseWorkspace />} />
              <Route path="workspace/board" element={<KanbanBoard />} />
              <Route path="workspace/evidence" element={<Evidence />} />
              <Route path="tools" element={<ToolsCenter />} />
              <Route path="tools/calculator" element={<Calculator />} />
              <Route path="tools/ai" element={<AIHelper />} />
              <Route path="tools/templates" element={<Templates />} />
              <Route path="team" element={<Team />} />
              <Route path="finance" element={<Finance />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={
                <div className="lc-card p-20 text-center">
                  <div className="text-6xl font-serif font-bold text-primary-900 mb-4">404</div>
                  <p className="text-neutral-ink-500 mb-6">您访问的页面不存在或正在开发中</p>
                  <button onClick={() => window.location.href = '/'} className="lc-btn-primary">
                    返回首页
                  </button>
                </div>
              } />
            </Route>
          </Routes>
        </Router>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
