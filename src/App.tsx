import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import JobsPage from './pages/JobsPage';
import MapPage from './pages/MapPage';
import CompaniesPage from './pages/CompaniesPage';
import CompanyDetailPage from './pages/CompanyDetailPage';
import SeekersPage from './pages/SeekersPage';
import SeekerDetailPage from './pages/SeekerDetailPage';
import SearchPage from './pages/SearchPage';
import EnterprisePage from './pages/EnterprisePage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/company/:id" element={<CompanyDetailPage />} />
        <Route path="/seekers" element={<SeekersPage />} />
        <Route path="/seeker/:id" element={<SeekerDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/enterprise" element={<EnterprisePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </div>
  );
}

export default App;
