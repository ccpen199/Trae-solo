import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useToast, ToastContainer } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import BottomNav from './components/BottomNav';
import { setToastHandler } from './utils/request';
import Home from './pages/Home';
import Search from './pages/Search';
import TopicDetail from './pages/TopicDetail';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import CreateNote from './pages/CreateNote';
import './App.css';

function AppContent() {
  const { toasts, showToast, removeToast } = useToast();

  setToastHandler(showToast);

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/topic/:id" element={<TopicDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/create" element={<CreateNote />} />
      </Routes>
      <BottomNav />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </Router>
  );
}

export default App
