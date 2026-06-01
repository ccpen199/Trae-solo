import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/Home';
import AddDevicePage from './pages/AddDevice';
import SettingsPage from './pages/Settings';
import VoicePage from './pages/Voice';
import AutomationPage from './pages/Automation';
import useHomeStore from './store/useHomeStore';

const App: React.FC = () => {
  const { loadHomes } = useHomeStore();

  useEffect(() => {
    loadHomes();
  }, [loadHomes]);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/add-device" element={<AddDevicePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/voice" element={<VoicePage />} />
            <Route path="/automation" element={<AutomationPage />} />
          </Routes>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
