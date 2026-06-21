import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  Crown,
  Star,
  Users,
  Calendar,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import LineChart from '@/components/charts/LineChart';
import CreditBadge from '@/components/ui/CreditBadge';
import {
  formatDate,
  getCreditLevelBg,
  getCreditLevelColor,
} from '@/utils/formatters';
import type { CreditLevel, UserRole } from '@/types';

const roleTabs: { key: UserRole | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'owner', label: '业主' },
  { key: 'designer', label: '设计师' },
  { key: 'contractor', label: '施工队' },
  { key: 'supplier', label: '供应商' },
];

const levelColors: Record<CreditLevel, string> = {
  S: 'from-yellow-400 to-amber-500',
  A: 'from-green-400 to-emerald-500',
  B: 'from-blue-400 to-cyan-500',
  C: 'from-amber-400 to-orange-500',
  D: 'from-red-400 to-rose-500',
};

const levelDescriptions: Record<CreditLevel, string> = {
  S: '卓越信用，可享受平台最高优先级服务和费率优惠',
  A: '优秀信用，可享受快速审核和推荐优先权',
  B: '良好信用，正常使用平台全部功能',
  C: '一般信用，部分功能受限，需提升信用',
  D: '较低信用，重点监控，限制接单权限',
};

export default function CreditCenter() {
  const { users, creditHistory, currentUser, dashboardStats } = useAppStore();
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [selectedUserId, setSelectedUserId] = useState(currentUser.id);

  const filteredUsers = useMemo(() => {
    if (selectedRole === 'all') return users;
    return users.filter((u) => u.role === selectedRole);
  }, [users, selectedRole]);

  const selectedUser = users.find((u) => u.id === selectedUserId) || currentUser;

  const userCreditHistory = creditHistory.filter(
    (h) => h.userId === selectedUser.id
  );

  const creditTrendData = dashboardStats.creditTrend.map((item) => ({
    name: item.date,
    value: item.score,
  }));

  const levelStats = useMemo(() => {
    const stats = { S: 0, A: 0, B: 0, C: 0, D: 0 };
    users.forEach((u) => {
      stats[u.creditLevel]++;
    });
    return stats;
  }, [users]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 font-display">
          信用中心
        </h1>
        <p className="text-gray-500 mt-1">信用驱动·透明公正·共建信任</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={`card p-8 bg-gradient-to-br ${levelColors[selectedUser.creditLevel]} text-white relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src={selectedUser.avatar}
                alt={selectedUser.name}
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white/30"
              />
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Crown
                  className={`w-5 h-5 ${getCreditLevelColor(selectedUser.creditLevel)}`}
                />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold font-display">
                {selectedUser.name}
              </h2>
              <p className="text-white/80 mt-1">
                {selectedUser.role === 'owner' && '业主'}
                {selectedUser.role === 'designer' && '设计师'}
                {selectedUser.role === 'contractor' && '施工队'}
                {selectedUser.role === 'supplier' && '供应商'}
              </p>
              <div className="mt-4 flex items-center gap-4">
                <div>
                  <p className="text-white/70 text-sm">信用分</p>
                  <p className="text-4xl font-bold font-display">
                    {selectedUser.creditScore}
                  </p>
                </div>
                <div className="h-12 w-px bg-white/30" />
                <div>
                  <p className="text-white/70 text-sm">信用等级</p>
                  <div className="mt-1">
                    <CreditBadge
                      score={selectedUser.creditScore}
                      level={selectedUser.creditLevel}
                      size="lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-right max-w-md">
            <p className="text-white/90 text-sm leading-relaxed">
              {levelDescriptions[selectedUser.creditLevel]}
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <TrendingUp className="w-4 h-4 text-white/70" />
              <span className="text-white/70 text-sm">
                较上月 +{dashboardStats.creditTrend[5].score - dashboardStats.creditTrend[0].score} 分
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                信用分趋势
              </h3>
            </div>
            <LineChart
              data={creditTrendData}
              color="#d69e2e"
              height={250}
              showArea
              yAxisFormatter={(value) => value.toString()}
            />
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" />
              信用变动记录
            </h3>
            <div className="space-y-3">
              {userCreditHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  暂无信用变动记录
                </p>
              ) : (
                userCreditHistory.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        record.type === 'increase'
                          ? 'bg-success-100 text-success-600'
                          : 'bg-danger-100 text-danger-600'
                      }`}
                    >
                      {record.type === 'increase' ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-medium text-gray-900">
                          {record.reason}
                        </p>
                        <span
                          className={`font-semibold flex-shrink-0 ${
                            record.type === 'increase'
                              ? 'text-success-600'
                              : 'text-danger-600'
                          }`}
                        >
                          {record.type === 'increase' ? '+' : ''}
                          {record.amount}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(record.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-6"
        >
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              信用等级分布
            </h3>
            <div className="space-y-3">
              {(Object.keys(levelStats) as CreditLevel[]).map((level) => (
                <div key={level} className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white bg-gradient-to-br ${levelColors[level]}`}
                  >
                    {level}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">{level}级用户</span>
                      <span className="font-medium text-gray-900">
                        {levelStats[level]}人
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(levelStats[level] / users.length) * 100}%`,
                        }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className={`h-full rounded-full bg-gradient-to-r ${levelColors[level]}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-primary-500" />
              信用排行榜
            </h3>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {roleTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedRole(tab.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedRole === tab.key
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {[...filteredUsers]
                .sort((a, b) => b.creditScore - a.creditScore)
                .slice(0, 5)
                .map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      selectedUserId === user.id
                        ? 'bg-primary-50 border border-primary-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0
                          ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white'
                          : index === 1
                          ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white'
                          : index === 2
                          ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {user.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold ${getCreditLevelColor(user.creditLevel)}`}
                        >
                          {user.creditScore}分
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${getCreditLevelBg(user.creditLevel)}`}
                        >
                          {user.creditLevel}级
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-500" />
              信用权益说明
            </h3>
            <div className="space-y-3">
              {[
                {
                  level: 'S',
                  benefit: '优先推荐、费率8折、快速审核、专属客服',
                },
                {
                  level: 'A',
                  benefit: '优先推荐、费率9折、快速审核',
                },
                { level: 'B', benefit: '正常推荐、标准费率' },
                { level: 'C', benefit: '限制推荐、提高保证金' },
                { level: 'D', benefit: '暂停接单、限制功能' },
              ].map((item) => (
                <div
                  key={item.level}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                >
                  <span
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br ${levelColors[item.level as CreditLevel]}`}
                  >
                    {item.level}
                  </span>
                  <p className="text-sm text-gray-600">{item.benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
