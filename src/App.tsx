import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import PropertyList from '@/pages/PropertyList';
import PropertyDetail from '@/pages/PropertyDetail';
import Login from '@/pages/Login';
import MortgageCalculator from '@/pages/tools/MortgageCalculator';
import TaxCalculator from '@/pages/tools/TaxCalculator';
import PropertyCompare from '@/pages/tools/PropertyCompare';
import AgentDashboard from '@/pages/agent/Dashboard';
import ViewingRecords from '@/pages/agent/ViewingRecords';
import ClientManagement from '@/pages/agent/ClientManagement';
import DealManagement from '@/pages/agent/DealManagement';

const PagePlaceholder = ({ title }: { title: string }) => (
  <div className="container mx-auto px-4 py-12">
    <div className="text-center py-20">
      <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-500">页面开发中，敬请期待...</p>
    </div>
  </div>
);

const MapSearch = () => <PagePlaceholder title="地图找房" />;
const Favorites = () => <PagePlaceholder title="我的收藏" />;
const Register = () => <PagePlaceholder title="注册" />;
const Profile = () => <PagePlaceholder title="个人中心" />;
const Agents = () => <PagePlaceholder title="经纪人" />;
const AgentDetail = () => <PagePlaceholder title="经纪人详情" />;
const About = () => <PagePlaceholder title="关于我们" />;
const Contact = () => <PagePlaceholder title="联系我们" />;
const NotFound = () => (
  <div className="container mx-auto px-4 py-12">
    <div className="text-center py-20">
      <h1 className="text-6xl font-serif font-bold text-primary-600 mb-4">404</h1>
      <p className="text-gray-500 mb-8">页面不存在或已被移除</p>
      <a href="/" className="btn-primary inline-block">返回首页</a>
    </div>
  </div>
);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<PropertyList />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/map" element={<MapSearch />} />
          <Route path="/tools/mortgage" element={<MortgageCalculator />} />
          <Route path="/tools/tax" element={<TaxCalculator />} />
          <Route path="/compare" element={<PropertyCompare />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/agent/:id" element={<AgentDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/agent/dashboard" element={<AgentDashboard />} />
          <Route path="/agent/viewings" element={<ViewingRecords />} />
          <Route path="/agent/clients" element={<ClientManagement />} />
          <Route path="/agent/deals" element={<DealManagement />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}
