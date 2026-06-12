import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import HomePage from '@/pages/Home';

import DGeneratorPage from '@/pages/owner/DGeneratorPage';
import CalculatorPage from '@/pages/owner/CalculatorPage';
import InspirationLibrary from '@/pages/owner/InspirationLibrary';
import ImageSearchPage from '@/pages/owner/ImageSearchPage';
import InspirationDetail from '@/pages/owner/InspirationDetail';
import MaterialLibrary from '@/pages/owner/MaterialLibrary';
import ProcessLibrary from '@/pages/owner/ProcessLibrary';
import ProcessDetail from '@/pages/owner/ProcessDetail';
import PitfallGuide from '@/pages/owner/PitfallGuide';
import CommunityHome from '@/pages/owner/CommunityHome';
import QuestionDetail from '@/pages/owner/QuestionDetail';
import ComparisonBoard from '@/pages/owner/ComparisonBoard';
import CompanyListPage from '@/pages/owner/CompanyListPage';
import CompanyDetailPage from '@/pages/owner/CompanyDetailPage';
import AppointmentList from '@/pages/owner/AppointmentList';

import ProviderWorkspace from '@/pages/provider/ProviderWorkspace';
import QualificationAudit from '@/pages/provider/QualificationAudit';
import AppointmentSchedule from '@/pages/provider/AppointmentSchedule';
import PlanManagement from '@/pages/provider/PlanManagement';
import PlanCreator from '@/pages/provider/PlanCreator';
import SiteManagement from '@/pages/provider/SiteManagement';
import SiteDailyLog from '@/pages/provider/SiteDailyLog';

import AdminDashboard from '@/pages/admin/AdminDashboard';
import CompanyAuditQueue from '@/pages/admin/CompanyAuditQueue';
import ProjectGantt from '@/pages/admin/ProjectGantt';
import SupplyChainAPI from '@/pages/admin/SupplyChainAPI';
import MaterialSKUAdmin from '@/pages/admin/MaterialSKUAdmin';
import DisputeList from '@/pages/admin/DisputeList';
import DisputeDetail from '@/pages/admin/DisputeDetail';

const Placeholder = ({ title }: { title: string }) => (
  <div className="card-base p-12 m-8">
    <h1 className="section-title">{title}</h1>
    <p className="text-ivory-600 mt-2">页面功能开发中，敬请期待...</p>
    <div className="mt-6 grid grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-32 bg-ivory-100 rounded-card animate-pulse" />
      ))}
    </div>
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'd-generator',
        element: <DGeneratorPage />,
      },
      {
        path: 'owner',
        children: [
          { index: true, element: <Placeholder title="业主个人中心" /> },
          { path: '3d-generator', element: <DGeneratorPage /> },
          { path: 'calculator', element: <CalculatorPage /> },
          {
            path: 'inspiration',
            children: [
              { index: true, element: <InspirationLibrary /> },
              { path: 'search', element: <ImageSearchPage /> },
              { path: ':id', element: <InspirationDetail /> },
            ],
          },
          { path: 'materials', element: <MaterialLibrary /> },
          {
            path: 'companies',
            children: [
              { index: true, element: <CompanyListPage /> },
              { path: ':id', element: <CompanyDetailPage /> },
            ],
          },
          { path: 'appointments', element: <AppointmentList /> },
          { path: 'compare', element: <ComparisonBoard /> },
          {
            path: 'knowledge',
            children: [
              { path: 'process', element: <ProcessLibrary /> },
              { path: 'process/:id', element: <ProcessDetail /> },
              { path: 'pitfalls', element: <PitfallGuide /> },
            ],
          },
          {
            path: 'community',
            children: [
              { index: true, element: <CommunityHome /> },
              {
                path: 'questions/:id',
                element: <QuestionDetail />,
              },
            ],
          },
          {
            path: 'progress/:projectId',
            element: <Placeholder title="我的装修进度追踪" />,
          },
          { path: 'profile', element: <Placeholder title="个人资料与收藏管理" /> },
        ],
      },
      {
        path: 'provider',
        children: [
          { index: true, element: <ProviderWorkspace /> },
          { path: 'audit', element: <QualificationAudit /> },
          { path: 'appointments', element: <AppointmentSchedule /> },
          {
            path: 'plans',
            children: [
              { index: true, element: <PlanManagement /> },
              { path: 'create', element: <PlanCreator /> },
            ],
          },
          {
            path: 'sites',
            children: [
              { index: true, element: <SiteManagement /> },
              { path: ':id/log', element: <SiteDailyLog /> },
            ],
          },
          { path: 'profile', element: <Placeholder title="公司信息维护" /> },
        ],
      },
      {
        path: 'admin',
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'company-audit', element: <CompanyAuditQueue /> },
          { path: 'gantt', element: <ProjectGantt /> },
          { path: 'supply-chain', element: <SupplyChainAPI /> },
          { path: 'materials', element: <MaterialSKUAdmin /> },
          {
            path: 'disputes',
            children: [
              { index: true, element: <DisputeList /> },
              { path: ':id', element: <DisputeDetail /> },
            ],
          },
        ],
      },
    ],
  },
]);

export default router;
