import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import ElderlyModePage from './pages/ElderlyModePage';
import MessagePage from './pages/MessagePage';
import PersonalCenterPage from './pages/PersonalCenterPage';
import AirportTransferPage from './pages/AirportTransferPage';
import TrainTransferPage from './pages/TrainTransferPage';
import CharterPage from './pages/CharterPage';
import PermissionCheckPage from './pages/PermissionCheckPage';
import NetworkErrorPage from './pages/NetworkErrorPage';

function App() {
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPermissionCheck, setShowPermissionCheck] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setHasLocationPermission(true);
          setTimeout(() => setShowPermissionCheck(false), 1500);
        },
        () => {
          setHasLocationPermission(false);
          setTimeout(() => setShowPermissionCheck(false), 1500);
        }
      );
    } else {
      setHasLocationPermission(false);
      setTimeout(() => setShowPermissionCheck(false), 1500);
    }
  }, []);

  if (!isOnline) {
    return <NetworkErrorPage onRetry={() => window.location.reload()} />;
  }

  if (showPermissionCheck && hasLocationPermission !== null) {
    return (
      <PermissionCheckPage
        hasLocationPermission={hasLocationPermission}
        onContinue={() => setShowPermissionCheck(false)}
      />
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage hasLocationPermission={hasLocationPermission} />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/elderly" element={<ElderlyModePage />} />
        <Route path="/messages" element={<MessagePage />} />
        <Route path="/profile" element={<PersonalCenterPage />} />
        <Route path="/airport" element={<AirportTransferPage />} />
        <Route path="/train" element={<TrainTransferPage />} />
        <Route path="/charter" element={<CharterPage />} />
      </Routes>
    </Router>
  );
}

export default App;
