import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Camera, Mic, MessageSquare, Home, Search, Menu, X, MapPin, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { standardsApi } from '@/services/api';
import { City } from '../../../shared/types';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentCity, setCurrentCity, cities, setCities } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [citySelectorOpen, setCitySelectorOpen] = useState(false);

  useEffect(() => {
    const loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const data = await standardsApi.getCities();
      setCities(data.cities);
      if (!currentCity && data.cities.length > 0) {
        setCurrentCity(data.cities[0]);
      }
    } catch (err) {
      console.error('Failed to load cities:', err);
    }
  };

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/camera', icon: Camera, label: '拍照识别' },
    { path: '/voice', icon: Mic, label: '语音查询' },
    { path: '/search', icon: Search, label: '文本搜索' },
    { path: '/feedback', icon: MessageSquare, label: '错误反馈' },
  ];

  const handleCitySelect = (city: City) => {
    setCurrentCity(city);
    setCitySelectorOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xl shadow-lg shadow-green-500/30">
                ♻️
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                垃圾分类智能助手
                </h1>
                <p className="text-xs text-gray-500">让分类更简单</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setCitySelectorOpen(!citySelectorOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">{currentCity?.name || '选择城市'}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${citySelectorOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {citySelectorOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
                  {cities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleCitySelect(city)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        currentCity?.id === city.id ? 'bg-green-50 text-green-600' : 'text-gray-700'
                      }`}
                    >
                      {city.name}
                      <span className="text-xs text-gray-400 ml-2">{city.province}</span>
                    </button>
                  ))}
                </div>
              </div>

              <nav className="flex items-center gap-1 ml-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 animate-slide-up">
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-green-500" />
                <select
                  value={currentCity?.id || ''}
                  onChange={(e) => {
                    const city = cities.find(c => c.id === e.target.value);
                    if (city) setCurrentCity(city);
                  }}
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border-none outline-none text-sm"
                >
                  {cities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-100 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© 2024 垃圾分类智能助手 | 让城市更美好</p>
            <p className="mt-1">支持多城市差异化分类标准</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
