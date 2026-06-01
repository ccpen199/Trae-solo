import { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AllMoviesPage from './pages/AllMoviesPage';
import MovieDetailPage from './pages/MovieDetailPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import TicketCenterPage from './pages/TicketCenterPage';
import TicketDetailPage from './pages/TicketDetailPage';
import VipCenterPage from './pages/VipCenterPage';
import VideoPage from './pages/VideoPage';
import VideoPlayerPage from './pages/VideoPlayerPage';
import ArtFilmPage from './pages/ArtFilmPage';
import CommunityPage from './pages/CommunityPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  const { currentPage, isLoggedIn, setCurrentPage } = useAppStore();

  useEffect(() => {
    if ((currentPage === 'tickets' || currentPage === 'vip' || currentPage === 'admin') && !isLoggedIn) {
      setCurrentPage('login');
    }
  }, [currentPage, isLoggedIn, setCurrentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'all-movies':
        return <AllMoviesPage />;
      case 'movie':
        return <MovieDetailPage />;
      case 'seat':
        return <SeatSelectionPage />;
      case 'tickets':
        return <TicketCenterPage />;
      case 'ticket-detail':
        return <TicketDetailPage />;
      case 'vip':
        return <VipCenterPage />;
      case 'videos':
        return <VideoPage />;
      case 'video-player':
        return <VideoPlayerPage />;
      case 'art-film':
        return <ArtFilmPage />;
      case 'community':
        return <CommunityPage />;
      case 'admin':
        return <AdminDashboard />;
      case 'login':
        return <LoginPage />;
      case 'register':
        return <RegisterPage />;
      default:
        return <HomePage />;
    }
  };

  const showNavbar = currentPage !== 'login' && currentPage !== 'admin';

  return (
    <div className="min-h-screen bg-cinema-bg">
      {showNavbar && <Navbar />}
      <main className={showNavbar ? 'pt-16' : ''}>
        {renderPage()}
      </main>
    </div>
  );
}
