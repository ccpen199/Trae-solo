import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout, AuthLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Dashboard from '@/pages/dashboard/Dashboard';
import ArtistList from '@/pages/artists/ArtistList';
import ArtistDetail from '@/pages/artists/ArtistDetail';
import ArtistEdit from '@/pages/artists/ArtistEdit';
import ScheduleCalendar from '@/pages/artists/ScheduleCalendar';
import ModelCardList from '@/pages/model-cards/ModelCardList';
import ModelCardEditor from '@/pages/model-cards/ModelCardEditor';
import CastingList from '@/pages/castings/CastingList';
import CastingCreate from '@/pages/castings/CastingCreate';
import CastingDetail from '@/pages/castings/CastingDetail';
import ApplicationList from '@/pages/castings/ApplicationList';
import TalentSearch from '@/pages/search/TalentSearch';
import AgencyDashboard from '@/pages/agency/AgencyDashboard';
import AgencyArtistList from '@/pages/agency/AgencyArtistList';
import AgencyTeam from '@/pages/agency/AgencyTeam';
import ContactRecords from '@/pages/agency/ContactRecords';
import SecurityCenter from '@/pages/security/SecurityCenter';
import AuthorizationList from '@/pages/security/AuthorizationList';
import DataAccessLog from '@/pages/security/DataAccessLog';
import DataExportDelete from '@/pages/security/DataExportDelete';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />

          <Route path="/artists" element={<ArtistList />} />
          <Route path="/artists/:id" element={<ArtistDetail />} />
          <Route path="/artists/:id/edit" element={<ArtistEdit />} />

          <Route path="/profile" element={<ArtistDetail isProfile />} />
          <Route path="/profile/schedule" element={<ScheduleCalendar />} />

          <Route path="/model-cards" element={<ModelCardList />} />
          <Route path="/model-cards/create" element={<ModelCardEditor />} />

          <Route path="/castings" element={<CastingList />} />
          <Route path="/castings/create" element={<CastingCreate />} />
          <Route path="/castings/:id" element={<CastingDetail />} />
          <Route path="/castings/:id/applications" element={<ApplicationList />} />

          <Route path="/search" element={<TalentSearch />} />

          <Route path="/agency" element={<AgencyDashboard />} />
          <Route path="/agency/artists" element={<AgencyArtistList />} />
          <Route path="/agency/team" element={<AgencyTeam />} />
          <Route path="/agency/contacts" element={<ContactRecords />} />

          <Route path="/security" element={<SecurityCenter />} />
          <Route path="/security/authorizations" element={<AuthorizationList />} />
          <Route path="/security/logs" element={<DataAccessLog />} />
          <Route path="/security/data" element={<DataExportDelete />} />

          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
