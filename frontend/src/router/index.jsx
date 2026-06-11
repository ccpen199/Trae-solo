import { createBrowserRouter, Navigate, useLocation, Outlet } from 'react-router-dom'
import { getToken } from '../utils/auth'

import Login from '../pages/Login'
import MainLayout from '../layouts/MainLayout'
import Dashboard from '../pages/Dashboard'
import Jobs from '../pages/Jobs'
import JobCreate from '../pages/JobCreate'
import JobDetail from '../pages/JobDetail'
import Candidates from '../pages/Candidates'
import CandidateDetail from '../pages/CandidateDetail'
import Applications from '../pages/Applications'
import ApplicationDetail from '../pages/ApplicationDetail'
import Interviews from '../pages/Interviews'
import InterviewRoom from '../pages/InterviewRoom'
import Offers from '../pages/Offers'
import OfferDetail from '../pages/OfferDetail'
import Analytics from '../pages/Analytics'
import CompanySettings from '../pages/CompanySettings'
import Profile from '../pages/Profile'
import MobileDashboard from '../pages/mobile/MobileDashboard'
import MobileJobs from '../pages/mobile/MobileJobs'
import MobileCandidates from '../pages/mobile/MobileCandidates'

function RequireAuth({ children }) {
  const location = useLocation()
  const token = getToken()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      {
        path: 'jobs',
        children: [
          { index: true, element: <Jobs /> },
          { path: 'create', element: <JobCreate /> },
          { path: ':id', element: <JobDetail /> }
        ]
      },
      {
        path: 'candidates',
        children: [
          { index: true, element: <Candidates /> },
          { path: ':id', element: <CandidateDetail /> }
        ]
      },
      {
        path: 'applications',
        children: [
          { index: true, element: <Applications /> },
          { path: ':id', element: <ApplicationDetail /> }
        ]
      },
      {
        path: 'interviews',
        children: [
          { index: true, element: <Interviews /> },
          { path: ':id', element: <InterviewRoom /> }
        ]
      },
      {
        path: 'offers',
        children: [
          { index: true, element: <Offers /> },
          { path: ':id', element: <OfferDetail /> }
        ]
      },
      { path: 'analytics', element: <Analytics /> },
      { path: 'company', element: <CompanySettings /> },
      { path: 'profile', element: <Profile /> }
    ]
  },
  {
    path: '/m',
    element: (
      <RequireAuth>
        <Outlet />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/m/dashboard" replace /> },
      { path: 'dashboard', element: <MobileDashboard /> },
      { path: 'jobs', element: <MobileJobs /> },
      { path: 'candidates', element: <MobileCandidates /> }
    ]
  }
])

export default router
