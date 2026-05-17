import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Login from './pages/Login';
import Live from './pages/Live';
import Activities from './pages/Activities';
import Music from './pages/Music';
import Ranking from './pages/Ranking';
import Wallet from './pages/Wallet';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />}>
            <Route path="live" element={<Live />} />
            <Route path="activities" element={<Activities />} />
            <Route path="music" element={<Music />} />
            <Route path="ranking" element={<Ranking />} />
            <Route path="wallet" element={<Wallet />} />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
