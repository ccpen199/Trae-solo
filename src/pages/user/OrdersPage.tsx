import { useState, useEffect, useMemo } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  PackageOpen,
  Clock,
  CheckCircle2,
  ListTodo,
  Search,
  SlidersHorizontal,
  Plus,
} from 'lucide-react';
import { Tabs, TabList, Tab, TabPanel } from '../../components/ui/Tabs';
import OrderCard from '../../components/order/OrderCard';
import {
  generateMockOrders,
  generateMockRiders,
  generateMockUsers,
} from '../../utils/mockData';
import type { Order, RiderProfile, User } from '../../types';

type TabKey = 'all' | 'active' | 'review' | 'completed';

const tabConfig: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: '全部', icon: <ListTodo size={16} /> },
  { key: 'active', label: '进行中', icon: <Clock size={16} /> },
  { key: 'review', label: '待评价', icon: <PackageOpen size={16} /> },
  { key: 'completed', label: '已完成', icon: <CheckCircle2 size={16} /> },
];

const activeStatuses = ['pending_pay', 'pending_accept', 'picking', 'delivering', 'fused'];
const reviewStatuses: string[] = [];
const completedStatuses = ['completed'];

export default function OrdersPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<RiderProfile[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const mockUsers = generateMockUsers(25);
    const mockRiders = generateMockRiders(20);
    const mockOrders = generateMockOrders(30, mockRiders, mockUsers);
    mockOrders.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
    setUsers(mockUsers);
    setRiders(mockRiders);
    setOrders(mockOrders);
  }, []);

  const filteredOrders = useMemo(() => {
    let result = orders;
    switch (activeTab) {
      case 'active':
        result = orders.filter((o) => activeStatuses.includes(o.status));
        break;
      case 'review':
        result = orders.filter((o) => reviewStatuses.includes(o.status));
        break;
      case 'completed':
        result = orders.filter((o) => completedStatuses.includes(o.status));
        break;
      default:
        break;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          (o.pickup.address || '').toLowerCase().includes(q) ||
          (o.deliver.address || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, activeTab, searchQuery]);

  const tabCounts = useMemo(
    () => ({
      all: orders.length,
      active: orders.filter((o) => activeStatuses.includes(o.status)).length,
      review: orders.filter((o) => reviewStatuses.includes(o.status)).length,
      completed: orders.filter((o) => completedStatuses.includes(o.status)).length,
    }),
    [orders]
  );

  const getRiderForOrder = (order: Order) => {
    if (!order.riderId) return undefined;
    const rider = riders.find((r) => r.userId === order.riderId);
    if (!rider) return undefined;
    const riderUser = users.find((u) => u.id === rider.userId);
    return {
      ...rider,
      user: riderUser
        ? { nickname: riderUser.nickname, avatarUrl: riderUser.avatarUrl }
        : undefined,
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="min-h-screen bg-gradient-to-b from-dark via-dark to-dark/95 pb-8"
    >
      <div className="sticky top-0 z-30 bg-dark/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-white">我的订单</h1>
          <button
            onClick={() => navigate('/user/publish')}
            className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 text-accent hover:bg-accent/25 flex items-center justify-center transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="max-w-2xl mx-auto px-4 pb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={16} className="text-white/35" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索订单标题、地址、编号..."
              className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-primary/50 focus:bg-white/[0.07] transition-all text-sm"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
                <SlidersHorizontal size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
          <div className="bg-dark/50 rounded-2xl p-1.5 border border-white/10 overflow-x-auto">
            <TabList className="!bg-transparent !p-0 w-full min-w-max">
              {tabConfig.map((t) => (
                <Tab
                  key={t.key}
                  value={t.key}
                  className="!px-3.5 !text-xs !rounded-xl whitespace-nowrap"
                >
                  <span className="flex items-center gap-1.5">
                    {t.icon}
                    {t.label}
                    <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] tabular-nums">
                      {tabCounts[t.key]}
                    </span>
                  </span>
                </Tab>
              ))}
            </TabList>
          </div>

          {(['all', 'active', 'review', 'completed'] as TabKey[]).map((key) => (
            <TabPanel key={key} value={key}>
              <OrderListContent
                orders={filteredOrders.filter((o) => {
                  if (key === 'all') return true;
                  if (key === 'active') return activeStatuses.includes(o.status);
                  if (key === 'review') return reviewStatuses.includes(o.status);
                  if (key === 'completed') return completedStatuses.includes(o.status);
                  return true;
                })}
                getRiderForOrder={getRiderForOrder}
                onOrderClick={(id) => navigate(`/order/${id}`)}
                tabKey={key}
                activeTab={activeTab}
              />
            </TabPanel>
          ))}
        </Tabs>
      </div>
    </motion.div>
  );
}

interface OrderListContentProps {
  orders: Order[];
  getRiderForOrder: (o: Order) => ReturnType<typeof Object> | undefined;
  onOrderClick: (id: string) => void;
  tabKey: TabKey;
  activeTab: TabKey;
}

function OrderListContent({ orders, getRiderForOrder, onOrderClick }: OrderListContentProps) {
  if (orders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="py-20"
      >
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-3xl bg-primary/5 blur-2xl scale-150" />
            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 flex items-center justify-center">
              <PackageOpen size={40} className="text-white/25" strokeWidth={1.2} />
            </div>
          </div>
          <div className="text-lg font-bold text-white/80 mb-1">还没有订单哦</div>
          <div className="text-sm text-white/40 mb-6 max-w-xs">
            试试发布一个跑腿需求，体验极速同城服务
          </div>
          <NavLink
            to="/publish"
            className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-accent hover:bg-accent/90 text-white font-medium shadow-lg shadow-accent/25 transition-all"
          >
            <Plus size={18} />
            立即发布订单
          </NavLink>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div layout className="space-y-4">
      <AnimatePresence mode="popLayout">
        {orders.map((order, idx) => {
          const rider = getRiderForOrder(order) as any;
          return (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ delay: idx * 0.04, duration: 0.3 }}
            >
              <OrderCard
                order={order}
                rider={rider}
                onClick={() => onOrderClick(order.id)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
