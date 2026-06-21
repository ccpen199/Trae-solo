import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import Home from './pages/Home';
import Relationship from './pages/Relationship';
import Finance from './pages/Finance';
import Projects from './pages/Projects';
import SupplyChain from './pages/SupplyChain';
import MultiSearch from './pages/MultiSearch';
import Monitoring from './pages/Monitoring';
import Sentiment from './pages/Sentiment';
import Dashboard from './pages/Dashboard';
import { cn } from './lib/utils';

function AppLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-dark-950 text-dark-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/relationship" element={<Relationship />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/supply-chain" element={<SupplyChain />} />
            <Route path="/search" element={<MultiSearch />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/sentiment" element={<Sentiment />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
