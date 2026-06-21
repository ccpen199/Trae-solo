import { motion } from 'framer-motion';
import { Bell, Search, Settings, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency, getCreditLevelBg } from '@/utils/formatters';
import { useState } from 'react';

export default function Header() {
  const { currentUser } = useAppStore();
  const [notifications] = useState([
    { id: 1, title: '新项目报价完成', time: '5分钟前', unread: true },
    { id: 2, title: '施工节点待验收', time: '30分钟前', unread: true },
    { id: 3, title: '设计师新回复', time: '2小时前', unread: false },
  ]);

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="h-16 bg-white/80 backdrop-blur-lg border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索项目、设计师、材料..."
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-80 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            {notifications.filter((n) => n.unread).length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full animate-pulse" />
            )}
          </button>
        </div>

        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Settings className="w-5 h-5 text-gray-600" />
        </button>

        <div className="h-8 w-px bg-gray-200" />

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
              <span className={`badge ${getCreditLevelBg(currentUser.creditLevel)}`}>
                {currentUser.creditLevel}级
              </span>
            </div>
            <p className="text-xs text-gray-500">
              信用分 {currentUser.creditScore}
            </p>
          </div>
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-md"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-success-500 rounded-full border-2 border-white" />
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </motion.header>
  );
}
