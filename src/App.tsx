import { Routes, Route, Link, useLocation } from "react-router-dom";
import { Home, Calendar, Search, User } from "lucide-react";
import HomePage from "./pages/HomePage";
import MatchesPage from "./pages/MatchesPage";
import SearchPage from "./pages/SearchPage";
import NewsDetailPage from "./pages/NewsDetailPage";

function App() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-xl font-bold">足球资讯</Link>
            <div className="flex space-x-1">
              <Link to="/" className={`px-4 py-2 rounded-lg ${isActive("/") ? "bg-green-600" : "hover:bg-green-600"}`}>
                <Home className="w-5 h-5 inline mr-1" />首页
              </Link>
              <Link to="/matches" className={`px-4 py-2 rounded-lg ${isActive("/matches") ? "bg-green-600" : "hover:bg-green-600"}`}>
                <Calendar className="w-5 h-5 inline mr-1" />比赛
              </Link>
              <Link to="/search" className={`px-4 py-2 rounded-lg ${isActive("/search") ? "bg-green-600" : "hover:bg-green-600"}`}>
                <Search className="w-5 h-5 inline mr-1" />搜索
              </Link>
              <button className="px-4 py-2 rounded-lg hover:bg-green-600">
                <User className="w-5 h-5 inline mr-1" />登录
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/news/:id" element={<NewsDetailPage />} />
        </Routes>
      </main>
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>&copy; 2024 足球资讯社区</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
