import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import PersonalSpace from './pages/PersonalSpace';
import EnterpriseDesk from './pages/EnterpriseDesk';
import CityLife from './pages/CityLife';
import GovernanceCockpit from './pages/GovernanceCockpit';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/personal" element={<PersonalSpace />} />
            <Route path="/enterprise" element={<EnterpriseDesk />} />
            <Route path="/life" element={<CityLife />} />
            <Route path="/governance" element={<GovernanceCockpit />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
