import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense, Component, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';
import AppLayout from '@/layouts/AppLayout';

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-4 border-3 border-ivory-200 border-t-terracotta-500 rounded-full animate-spin" />
        <p className="text-ivory-500 text-sm">加载中...</p>
      </div>
    </div>
  );
}

interface EBProps {
  children: ReactNode;
}

class ErrorBoundary extends Component<EBProps, { hasError: boolean; error: unknown }> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card-base p-12 m-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-terracotta-50 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-terracotta-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="font-serif text-xl text-carbon-800 mb-2">页面加载出错</h2>
          <p className="text-ivory-500 text-sm mb-4">该功能模块暂时无法加载，请刷新页面重试</p>
          <pre className="text-xs text-terracotta-600 bg-terracotta-50 p-3 rounded-lg max-w-lg mx-auto overflow-auto mb-4">
            {String(this.state.error)}
          </pre>
          <button onClick={() => window.location.reload()} className="btn-primary">
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function LazyWrap({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

const HomePage = lazy(() => import('@/pages/Home'));
const DGeneratorPage = lazy(() => import('@/pages/owner/DGeneratorPage'));
const CalculatorPage = lazy(() => import('@/pages/owner/CalculatorPage'));
const InspirationLibrary = lazy(() => import('@/pages/owner/InspirationLibrary'));
const ImageSearchPage = lazy(() => import('@/pages/owner/ImageSearchPage'));
const InspirationDetail = lazy(() => import('@/pages/owner/InspirationDetail'));
const MaterialLibrary = lazy(() => import('@/pages/owner/MaterialLibrary'));
const CompanyListPage = lazy(() => import('@/pages/owner/CompanyListPage'));
const CompanyDetailPage = lazy(() => import('@/pages/owner/CompanyDetailPage'));
const AppointmentList = lazy(() => import('@/pages/owner/AppointmentList'));
const ComparisonBoard = lazy(() => import('@/pages/owner/ComparisonBoard'));
const ProgressTracker = lazy(() => import('@/pages/owner/ProgressTracker'));
const ProcessLibrary = lazy(() => import('@/pages/owner/ProcessLibrary'));
const ProcessDetail = lazy(() => import('@/pages/owner/ProcessDetail'));
const PitfallGuide = lazy(() => import('@/pages/owner/PitfallGuide'));
const CommunityHome = lazy(() => import('@/pages/owner/CommunityHome'));
const QuestionDetail = lazy(() => import('@/pages/owner/QuestionDetail'));
const OwnerProfile = lazy(() => import('@/pages/owner/OwnerProfile'));

const ProviderWorkspace = lazy(() => import('@/pages/provider/ProviderWorkspace'));
const QualificationAudit = lazy(() => import('@/pages/provider/QualificationAudit'));
const AppointmentSchedule = lazy(() => import('@/pages/provider/AppointmentSchedule'));
const PlanManagement = lazy(() => import('@/pages/provider/PlanManagement'));
const PlanCreator = lazy(() => import('@/pages/provider/PlanCreator'));
const SiteManagement = lazy(() => import('@/pages/provider/SiteManagement'));
const SiteDailyLog = lazy(() => import('@/pages/provider/SiteDailyLog'));
const CompanyProfile = lazy(() => import('@/pages/provider/CompanyProfile'));

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const CompanyAuditQueue = lazy(() => import('@/pages/admin/CompanyAuditQueue'));
const ProjectGantt = lazy(() => import('@/pages/admin/ProjectGantt'));
const SupplyChainAPI = lazy(() => import('@/pages/admin/SupplyChainAPI'));
const MaterialSKUAdmin = lazy(() => import('@/pages/admin/MaterialSKUAdmin'));
const DisputeList = lazy(() => import('@/pages/admin/DisputeList'));
const DisputeDetail = lazy(() => import('@/pages/admin/DisputeDetail'));

type LC = LazyExoticComponent<ComponentType<object>>;

function L(Comp: LC) {
  return (
    <LazyWrap>
      <Comp />
    </LazyWrap>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: L(HomePage),
      },
      {
        path: 'd-generator',
        element: L(DGeneratorPage),
      },
      {
        path: 'owner',
        children: [
          { index: true, element: L(OwnerProfile) },
          { path: '3d-generator', element: L(DGeneratorPage) },
          { path: 'calculator', element: L(CalculatorPage) },
          {
            path: 'inspiration',
            children: [
              { index: true, element: L(InspirationLibrary) },
              { path: 'search', element: L(ImageSearchPage) },
              { path: ':id', element: L(InspirationDetail) },
            ],
          },
          { path: 'materials', element: L(MaterialLibrary) },
          {
            path: 'companies',
            children: [
              { index: true, element: L(CompanyListPage) },
              { path: ':id', element: L(CompanyDetailPage) },
            ],
          },
          { path: 'appointments', element: L(AppointmentList) },
          { path: 'compare', element: L(ComparisonBoard) },
          {
            path: 'knowledge',
            children: [
              { path: 'process', element: L(ProcessLibrary) },
              { path: 'process/:id', element: L(ProcessDetail) },
              { path: 'pitfalls', element: L(PitfallGuide) },
            ],
          },
          {
            path: 'community',
            children: [
              { index: true, element: L(CommunityHome) },
              { path: 'questions/:id', element: L(QuestionDetail) },
            ],
          },
          {
            path: 'progress/:projectId',
            element: L(ProgressTracker),
          },
          { path: 'profile', element: L(OwnerProfile) },
        ],
      },
      {
        path: 'provider',
        children: [
          { index: true, element: L(ProviderWorkspace) },
          { path: 'audit', element: L(QualificationAudit) },
          { path: 'appointments', element: L(AppointmentSchedule) },
          {
            path: 'plans',
            children: [
              { index: true, element: L(PlanManagement) },
              { path: 'create', element: L(PlanCreator) },
            ],
          },
          {
            path: 'sites',
            children: [
              { index: true, element: L(SiteManagement) },
              { path: ':id/log', element: L(SiteDailyLog) },
            ],
          },
          { path: 'profile', element: L(CompanyProfile) },
        ],
      },
      {
        path: 'admin',
        children: [
          { index: true, element: L(AdminDashboard) },
          { path: 'company-audit', element: L(CompanyAuditQueue) },
          { path: 'gantt', element: L(ProjectGantt) },
          { path: 'supply-chain', element: L(SupplyChainAPI) },
          { path: 'materials', element: L(MaterialSKUAdmin) },
          {
            path: 'disputes',
            children: [
              { index: true, element: L(DisputeList) },
              { path: ':id', element: L(DisputeDetail) },
            ],
          },
        ],
      },
    ],
  },
]);

export default router;
