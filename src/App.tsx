import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';

const PersonalSpace = () => import('./pages/personal/PersonalSpace');
const Certificates = () => import('./pages/personal/Certificates');
const Progress = () => import('./pages/personal/Progress');
const Policies = () => import('./pages/personal/Policies');

const EnterpriseDesk = () => import('./pages/enterprise/EnterpriseDesk');
const Lifecycle = () => import('./pages/enterprise/Lifecycle');
const Subsidies = () => import('./pages/enterprise/Subsidies');

const CityLife = () => import('./pages/city/CityLife');
const Transit = () => import('./pages/city/Transit');
const Hospitals = () => import('./pages/city/Hospitals');
const Venues = () => import('./pages/city/Venues');

const GovernanceDashboard = () => import('./pages/governance/GovernanceDashboard');
const Population = () => import('./pages/governance/Population');
const Appeals = () => import('./pages/governance/Appeals');
const GridEvents = () => import('./pages/governance/GridEvents');

import { lazy, Suspense } from 'react';

const LazyPersonalSpace = lazy(PersonalSpace);
const LazyCertificates = lazy(Certificates);
const LazyProgress = lazy(Progress);
const LazyPolicies = lazy(Policies);
const LazyEnterpriseDesk = lazy(EnterpriseDesk);
const LazyLifecycle = lazy(Lifecycle);
const LazySubsidies = lazy(Subsidies);
const LazyCityLife = lazy(CityLife);
const LazyTransit = lazy(Transit);
const LazyHospitals = lazy(Hospitals);
const LazyVenues = lazy(Venues);
const LazyGovernanceDashboard = lazy(GovernanceDashboard);
const LazyPopulation = lazy(Population);
const LazyAppeals = lazy(Appeals);
const LazyGridEvents = lazy(GridEvents);

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.idType)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />

          <Route path="/personal" element={
            <ProtectedRoute roles={['personal']}>
              <Suspense fallback={<LoadingFallback />}>
                <LazyPersonalSpace />
              </Suspense>
            </ProtectedRoute>
          }>
            <Route path="certificates" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyCertificates />
              </Suspense>
            } />
            <Route path="progress" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyProgress />
              </Suspense>
            } />
            <Route path="policies" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyPolicies />
              </Suspense>
            } />
          </Route>

          <Route path="/enterprise" element={
            <ProtectedRoute roles={['enterprise']}>
              <Suspense fallback={<LoadingFallback />}>
                <LazyEnterpriseDesk />
              </Suspense>
            </ProtectedRoute>
          }>
            <Route path="lifecycle" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyLifecycle />
              </Suspense>
            } />
            <Route path="subsidies" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazySubsidies />
              </Suspense>
            } />
          </Route>

          <Route path="/city" element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <LazyCityLife />
              </Suspense>
            </ProtectedRoute>
          }>
            <Route path="transit" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyTransit />
              </Suspense>
            } />
            <Route path="hospitals" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyHospitals />
              </Suspense>
            } />
            <Route path="venues" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyVenues />
              </Suspense>
            } />
          </Route>

          <Route path="/governance" element={
            <ProtectedRoute roles={['government']}>
              <Suspense fallback={<LoadingFallback />}>
                <LazyGovernanceDashboard />
              </Suspense>
            </ProtectedRoute>
          }>
            <Route path="population" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyPopulation />
              </Suspense>
            } />
            <Route path="appeals" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyAppeals />
              </Suspense>
            } />
            <Route path="grid" element={
              <Suspense fallback={<LoadingFallback />}>
                <LazyGridEvents />
              </Suspense>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
