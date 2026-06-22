import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Megaphone,
  Users,
  Calendar,
  Heart,
  Clock,
  Flower2,
  Settings,
  Headphones,
  LogOut,
  FileText,
  ChevronRight,
  Crown,
  CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/useUserStore';
import { mockBaoliaos } from '@/data/mockBaoliaos';
import { mockCircles } from '@/data/mockCircles';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import BaoliaoCard from '@/components/business/BaoliaoCard';

const menuItems = [
  { icon: Megaphone, name: '我的爆料', path: '/profile/baoliaos', color: 'text-westlake-500 bg-westlake-50' },
  { icon: Users, name: '我的圈子', path: '/profile/circles', color: 'text-honghua-500 bg-honghua-50' },
  { icon: Calendar, name: '我的活动', path: '/profile/activities', color: 'text-chaojing-500 bg-chaojing-50' },
  { icon: Heart, name: '我的收藏', path: '/profile/favorites', color: 'text-pink-500 bg-pink-50' },
  { icon: Clock, name: '我的预约', path: '/profile/bookings', color: 'text-purple-500 bg-purple-50' },
  { icon: Flower2, name: '积分中心', path: '/profile/points', color: 'text-orange-500 bg-orange-50' },
  { icon: Settings, name: '系统设置', path: '/profile/settings', color: 'text-neutral-500 bg-neutral-50' },
  { icon: Headphones, name: '联系客服', path: '/profile/support', color: 'text-teal-500 bg-teal-50' }
];

const stats = [
  { label: '发布爆料', value: 28, color: 'from-westlake-500 to-westlake-600' },
  { label: '加入圈子', value: 12, color: 'from-honghua-500 to-honghua-600' },
  { label: '参与活动', value: 45, color: 'from-chaojing-500 to-chaojing-600' },
  { label: '获得红花', value: 1280, color: 'from-pink-500 to-pink-600' }
];

type TabType = 'recent' | 'published';

export default function Profile() {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabType>('recent');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/profile' } });
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn || !user) {
    return null;
  }

  const handleMenuClick = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getLevelName = (level: number) => {
    if (level >= 10) return '钻石会员';
    if (level >= 5) return '黄金会员';
    if (level >= 3) return '白银会员';
    return '普通会员';
  };

  const getLevelColor = (level: number) => {
    if (level >= 10) return 'from-purple-400 to-purple-600';
    if (level >= 5) return 'from-chaojing-400 to-chaojing-600';
    if (level >= 3) return 'from-neutral-300 to-neutral-500';
    return 'from-westlake-400 to-westlake-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-neutral-50"
    >
      <div className="relative h-64 md:h-72 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://picsum.photos/seed/profile-bg/1200/400"
            alt="背景图"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-neutral-50" />
        </div>

        <div className="relative z-10 container-page pb-0 h-full flex flex-col justify-end">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex items-end gap-6 pb-6"
          >
            <div className="relative">
              <Avatar size="xl" src={user.avatar} name={user.nickname} />
              <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-gradient-to-r from-chaojing-400 to-chaojing-600 rounded-full text-xs font-bold text-neutral-800">
                LV.{user.level}
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {user.nickname}
              </h1>
              <div className="flex items-center gap-4">
                <span className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r text-white',
                  getLevelColor(user.level)
                )}>
                  <Crown className="w-4 h-4 inline mr-1" />
                  {getLevelName(user.level)}
                </span>
                <span className="text-white/80 text-sm">
                  <Flower2 className="w-4 h-4 inline mr-1 text-chaojing-300" />
                  {user.points} 小红花
                </span>
                <span className="text-white/80 text-sm">
                  <CalendarDays className="w-4 h-4 inline mr-1" />
                  连续签到 7 天
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container-page pb-20 -mt-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="p-4 md:p-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                  className="text-center"
                >
                  <div className={cn(
                    'text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r mb-1',
                    stat.color
                  )}>
                    {stat.value}
                  </div>
                  <p className="text-sm text-neutral-600">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-6"
        >
          <Card className="p-4 md:p-6">
            <h2 className="font-bold text-neutral-800 text-lg mb-4">功能菜单</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.name}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.05, duration: 0.4 }}
                  onClick={() => handleMenuClick(item.path)}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-neutral-50 transition-colors group"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', item.color)}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm text-neutral-700 font-medium group-hover:text-westlake-600 transition-colors">
                    {item.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mb-6"
        >
          <Card className="p-0 overflow-hidden">
            <div className="flex border-b border-neutral-100">
              <button
                onClick={() => setActiveTab('recent')}
                className={cn(
                  'flex-1 py-4 px-6 text-sm font-medium transition-colors relative',
                  activeTab === 'recent' ? 'text-westlake-600' : 'text-neutral-500 hover:text-neutral-700')}
              >
                最近浏览
                {activeTab === 'recent' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-westlake-500 to-westlake-600" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('published')}
                className={cn(
                  'flex-1 py-4 px-6 text-sm font-medium transition-colors relative',
                  activeTab === 'published' ? 'text-westlake-600' : 'text-neutral-500 hover:text-neutral-700')}
              >
                最近发布
                {activeTab === 'published' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-westlake-500 to-westlake-600" />
                )}
              </button>
            </div>

            <div className="p-4">
              <AnimatePresence mode="wait">
                {activeTab === 'recent' ? (
                  <motion.div
                    key="recent"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {mockBaoliaos.slice(0, 3).map((baoliao) => (
                      <BaoliaoCard key={baoliao.id} baoliao={baoliao} />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="published"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {mockBaoliaos.filter(b => b.userId === user.id).length > 0 ? (
                      mockBaoliaos.filter(b => b.userId === user.id).map((baoliao) => (
                        <BaoliaoCard key={baoliao.id} baoliao={baoliao} />
                      ))
                    ) : (
                      <div className="text-center py-12 text-neutral-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                        <p>暂无发布内容</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setShowLogoutModal(true)}
            className="w-full border-2 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
            leftIcon={<LogOut className="w-5 h-5" />}
          >
            退出登录
          </Button>
        </motion.div>
      </div>

      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <LogOut className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-neutral-800 mb-2">确认退出登录</h3>
                <p className="text-neutral-500">退出后您的登录信息将被清除</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleLogout}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600"
                >
                  确认退出
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
