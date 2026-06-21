import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Grid3X3,
  Sparkles,
  FileSearch,
  TrendingUp,
  Scale,
  MapPin,
  ChevronDown,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { CITIES } from '@/data/mockData';

const navItems = [
  { to: '/', label: '首页', icon: Home },
  { to: '/grid', label: 'LBS网格', icon: Grid3X3 },
  { to: '/experience', label: '虚拟体验', icon: Sparkles },
  { to: '/demand', label: '需求发布', icon: FileSearch },
  { to: '/growth', label: '成长体系', icon: TrendingUp },
  { to: '/dispute', label: '纠纷仲裁', icon: Scale },
];

export const Navbar = () => {
  const location = useLocation();
  const { city, setCity, currentGridCode } = useAppStore();
  const [cityOpen, setCityOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl2 bg-gradient-to-br from-brand to-accent flex items-center justify-center shadow-soft">
              <MapPin className="text-white" size={22} />
            </div>
            <div>
              <div className="font-display text-xl font-semibold text-brand">邻里生活</div>
              <div className="text-xs text-brand-300">Local Life Aggregation</div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setCityOpen(!cityOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl2 bg-warm-card hover:bg-white transition-colors"
            >
              <MapPin size={16} className="text-accent" />
              <span className="font-medium text-brand">{city}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-400 font-mono">
                {currentGridCode}
              </span>
              <ChevronDown size={16} className="text-brand-300" />
            </button>
            <AnimatePresence>
              {cityOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full mt-2 left-0 w-48 card-base p-2 z-50"
                >
                  {CITIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCity(c);
                        setCityOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-xl transition-colors ${
                        c === city
                          ? 'bg-accent-50 text-accent-600 font-medium'
                          : 'hover:bg-warm-card text-brand'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive =
              to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl2 transition-all ${
                  isActive
                    ? 'bg-brand text-white shadow-soft'
                    : 'text-brand-400 hover:text-brand hover:bg-warm-card'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full bg-warm-card flex items-center justify-center hover:bg-white transition-colors">
            <User size={20} className="text-brand-400" />
          </button>
        </div>
      </div>
    </nav>
  );
};
