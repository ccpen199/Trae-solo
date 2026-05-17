import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, MessageSquare, User } from 'lucide-react';
import { useAuthStore } from '@/store';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg" />
          <span className="text-xl font-bold text-neutral-800">视频社区</span>
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索视频、UP主..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-100 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          </div>
        </form>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <button className="relative p-2 hover:bg-neutral-100 rounded-full transition-colors">
                <Bell className="w-6 h-6 text-neutral-600" />
              </button>
              <Link to="/messages" className="relative p-2 hover:bg-neutral-100 rounded-full transition-colors">
                <MessageSquare className="w-6 h-6 text-neutral-600" />
              </Link>
              <Link to="/profile" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-neutral-200 rounded-full overflow-hidden">
                  <User className="w-full h-full p-1.5 text-neutral-400" />
                </div>
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
