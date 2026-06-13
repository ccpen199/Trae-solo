import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import PropertyList from '@/pages/PropertyList';
import PropertyDetail from '@/pages/PropertyDetail';
import MapSearch from '@/pages/MapSearch';
import Butler from '@/pages/Butler';
import Subsidy from '@/pages/Subsidy';
import Analytics from '@/pages/Analytics';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<PropertyList />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/map" element={<MapSearch />} />
          <Route path="/butler" element={<Butler />} />
          <Route path="/subsidy" element={<Subsidy />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </Layout>
    </Router>
  );
}
