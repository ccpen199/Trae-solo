import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer } from 'react-leaflet';
import {
  MapPin,
  Search,
  ShoppingBag,
  Package,
  ClipboardList,
  Home,
  Clock,
  History,
  ChevronRight,
  Map as MapIcon,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { generateMockRiders, generateMockOrders, generateMockUsers } from '../../utils/mockData';
import { CITY_CENTER } from '../../utils';
import HeatmapLayer from '../../components/map/HeatmapLayer';
import RiderMarker from '../../components/map/RiderMarker';
import OrderCard from '../../components/order/OrderCard';
import type { RiderProfile, Order, OrderType, User } from '../../types';

const serviceCards: {
  type: OrderType;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  gradient: string;
}[] = [
  {
    type: 'buy',
    icon: <ShoppingBag size={32} />,
    title: '代买',
    subtitle: '代购商品 · 30分钟送达',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    type: 'deliver',
    icon: <Package size={32} />,
    title: '代送',
    subtitle: '同城速递 · 安全可靠',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    type: 'errand',
    icon: <ClipboardList size={32} />,
    title: '代办',
    subtitle: '帮您办事 · 省心省力',
    gradient: 'from-violet-500 to-indigo-500',
  },
];

const quickEntries = [
  { icon: <Home size={22} />, label: '常用地址', path: '/profile' },
  { icon: <History size={22} />, label: '历史订单', path: '/orders' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { addToast } = useAppStore();
  const [riders, setRiders] = useState<RiderProfile[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setGreeting('凌晨好');
    else if (hour < 12) setGreeting('早上好');
    else if (hour < 14) setGreeting('中午好');
    else if (hour < 18) setGreeting('下午好');
    else setGreeting('晚上好');

    const mockUsers = generateMockUsers(25);
    const mockRiders = generateMockRiders(20);
    const mockOrders = generateMockOrders(15, mockRiders, mockUsers);
    const userOrders = mockOrders.filter(
      (o) => o.status === 'pending_accept' || o.status === 'picking' || o.status === 'delivering'
    );
    setUsers(mockUsers);
    setRiders(mockRiders);
    setActiveOrders(userOrders.slice(0, 5));
  }, []);

  const nearbyRiders = riders
    .filter((r) => r.status !== 'offline')
    .slice(0, 5);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      addToast({ type: 'info', message: `搜索：${searchQuery}`, duration: 2000 });
    }
  };

  const handleServiceClick = (type: OrderType) => {
    navigate(`/publish?type=${type}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="min-h-screen bg-gradient-to-b from-dark via-dark to-dark/95 pb-8"
    >
      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-white mb-1">
              {greeting}，闪跑侠 👋
            </div>
            <div className="flex items-center gap-1.5 text-sm text-white/60">
              <MapPin size={14} className="text-accent shrink-0" />
              <span className="truncate">{CITY_CENTER.address}</span>
              <ChevronRight size={14} className="text-white/30 shrink-0" />
            </div>
          </div>
          <NavLink
            to="/user/profile"
            className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
          >
            S
          </NavLink>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="relative"
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-white/40" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索服务、订单、地址..."
            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-sm"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="grid grid-cols-3 gap-3"
        >
          {serviceCards.map((card, idx) => (
            <motion.button
              key={card.type}
              onClick={() => handleServiceClick(card.type)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + idx * 0.08, duration: 0.4 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`relative aspect-[4/5] rounded-2xl p-4 overflow-hidden bg-gradient-to-br ${card.gradient} text-white shadow-xl hover:shadow-2xl transition-all duration-300 text-left`}
            >
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full bg-black/10 blur-xl" />
              <div className="relative h-full flex flex-col justify-between">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  {card.icon}
                </div>
                <div>
                  <div className="text-xl font-bold mb-1">{card.title}</div>
                  <div className="text-xs text-white/80 leading-relaxed">{card.subtitle}</div>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapIcon size={18} className="text-accent" />
              <h2 className="text-lg font-bold text-white">实时骑手分布</h2>
            </div>
            <div className="text-xs text-white/50">
              {nearbyRiders.length} 位骑手附近待命
            </div>
          </div>
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl" style={{ height: 280 }}>
            <MapContainer
              center={[CITY_CENTER.lat, CITY_CENTER.lng]}
              zoom={13}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%', background: '#0a0f1e' }}
              className="!z-0"
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <HeatmapLayer riders={riders} />
              {nearbyRiders.map((rider) => {
                const riderUser = users.find((u) => u.id === rider.userId);
                return (
                  <RiderMarker
                    key={rider.userId}
                    rider={{
                      ...rider,
                      user: riderUser
                        ? { nickname: riderUser.nickname, avatarUrl: riderUser.avatarUrl }
                        : undefined,
                    }}
                  />
                );
              })}
            </MapContainer>
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dark/70 backdrop-blur-sm border border-white/10 text-xs text-white/70">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              实时更新
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              <h2 className="text-lg font-bold text-white">进行中订单</h2>
            </div>
            <NavLink
              to="/user/orders"
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium"
            >
              查看全部 <ChevronRight size={14} />
            </NavLink>
          </div>
          {activeOrders.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {activeOrders.map((order, idx) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + idx * 0.08, duration: 0.4 }}
                  className="shrink-0 w-[320px]"
                >
                  <OrderCard
                    order={order}
                    onClick={() => navigate(`/order/${order.id}`)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white/5 border border-dashed border-white/10 p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/5 flex items-center justify-center">
                <Package size={28} className="text-white/30" />
              </div>
              <div className="text-white/60 text-sm">暂无进行中订单</div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="grid grid-cols-2 gap-3"
        >
          {quickEntries.map((entry) => (
            <NavLink
              key={entry.label}
              to={entry.path}
              className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center text-primary">
                {entry.icon}
              </div>
              <div>
                <div className="font-semibold text-white text-sm">{entry.label}</div>
                <div className="text-xs text-white/40 mt-0.5">快速进入</div>
              </div>
              <ChevronRight size={18} className="ml-auto text-white/20" />
            </NavLink>
          ))}
        </motion.div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </motion.div>
  );
}
