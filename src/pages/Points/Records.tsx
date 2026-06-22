import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Flower2,
  TrendingUp,
  TrendingDown,
  Ticket,
  Package,
  Gift,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  Sparkles,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePointStore } from '@/stores/usePointStore';
import { useUserStore } from '@/stores/useUserStore';
import type { PointRecord } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Empty from '@/components/common/Empty';
import Tag from '@/components/common/Tag';

type TabType = 'all' | 'earn' | 'spend';

const tabLabels: Record<TabType, string> = {
  all: '全部记录',
  earn: '积分收入',
  spend: '积分支出'
};

const sourceConfig: Record<string, { label: string; icon: typeof Gift; color: string }> = {
  login: { label: '每日签到', icon: Calendar, color: 'text-westlake-600 bg-westlake-100' },
  publish_baoliao: { label: '发布爆料', icon: Sparkles, color: 'text-honghua-600 bg-honghua-100' },
  join_activity: { label: '参与活动', icon: Gift, color: 'text-chaojing-600 bg-chaojing-100' },
  invite: { label: '邀请好友', icon: TrendingUp, color: 'text-purple-600 bg-purple-100' },
  exchange: { label: '积分兑换', icon: Ticket, color: 'text-pink-600 bg-pink-100' },
  donate: { label: '公益捐赠', icon: Heart, color: 'text-red-600 bg-red-100' },
};

export default function PointRecords() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUserStore();
  const { pointRecords, loading, fetchPointRecords } = usePointStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (isLoggedIn) {
      fetchPointRecords();
    }
  }, [isLoggedIn, fetchPointRecords]);

  const filteredRecords = useMemo(() => {
    let records = [...pointRecords];
    if (activeTab === 'earn') {
      records = records.filter(r => r.type === 'earn');
    } else if (activeTab === 'spend') {
      records = records.filter(r => r.type === 'spend');
    }
    return records.slice(0, page * pageSize);
  }, [pointRecords, activeTab, page]);

  const hasMore = filteredRecords.length < pointRecords.filter(r => 
    activeTab === 'all' || r.type === activeTab
  ).length;

  const stats = useMemo(() => {
    const totalEarn = pointRecords.filter(r => r.type === 'earn').reduce((s, r) => s + r.amount, 0);
    const totalSpend = pointRecords.filter(r => r.type === 'spend').reduce((s, r) => s + r.amount, 0);
    return { totalEarn, totalSpend };
  }, [pointRecords]);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hours}:${minutes}`;
  };

  const getSourceInfo = (record: PointRecord) => {
    const config = sourceConfig[record.source] || sourceConfig.publish_baoliao;
    const Icon = config.icon;
    return { ...config, Icon };
  };

  if (!isLoggedIn || !user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-neutral-50 flex items-center justify-center"
      >
        <Card className="p-8 text-center max-w-sm mx-4">
          <div className="w-20 h-20 rounded-full bg-chaojing-100 flex items-center justify-center mx-auto mb-4">
            <Flower2 className="w-10 h-10 text-chaojing-500" />
          </div>
          <h2 className="text-xl font-bold text-neutral-800 mb-2">登录后查看记录</h2>
          <p className="text-neutral-500 mb-6">登录即可查看积分收支明细</p>
          <Button
            variant="warning"
            size="lg"
            onClick={() => navigate('/login', { state: { from: '/points/records' } })}
            className="w-full"
          >
            立即登录
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-neutral-50"
    >
      <div className="sticky top-0 z-40 bg-white border-b border-neutral-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <h1 className="font-semibold text-lg text-neutral-800">积分明细</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6"
        >
          <Card className="p-4 bg-gradient-to-br from-chaojing-500 via-chaojing-500 to-chaojing-600 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Flower2 className="w-5 h-5" />
              <span className="font-medium">当前积分</span>
            </div>
            <div className="text-4xl font-bold mb-4">{user.points.toLocaleString()}</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/20 rounded-xl p-3">
                <div className="flex items-center gap-1 text-white/80 text-sm mb-1">
                  <TrendingUp className="w-4 h-4" />
                  累计获得
                </div>
                <div className="text-xl font-bold">+{stats.totalEarn.toLocaleString()}</div>
              </div>
              <div className="bg-white/20 rounded-xl p-3">
                <div className="flex items-center gap-1 text-white/80 text-sm mb-1">
                  <TrendingDown className="w-4 h-4" />
                  累计支出
                </div>
                <div className="text-xl font-bold">-{stats.totalSpend.toLocaleString()}</div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="p-0 overflow-hidden">
            <div className="flex border-b border-neutral-100">
              {(Object.keys(tabLabels) as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setPage(1); }}
                  className={cn(
                    'flex-1 py-3 px-4 text-sm font-medium transition-colors relative',
                    activeTab === tab ? 'text-chaojing-600' : 'text-neutral-500 hover:text-neutral-700'
                  )}
                >
                  {tabLabels[tab]}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeRecordTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-chaojing-400 to-chaojing-600"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="divide-y divide-neutral-100">
              {loading && filteredRecords.length === 0 ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-chaojing-500 animate-spin" />
                </div>
              ) : filteredRecords.length > 0 ? (
                <>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {filteredRecords.map((record, index) => {
                        const sourceInfo = getSourceInfo(record);
                        const Icon = sourceInfo.Icon;
                        return (
                          <motion.div
                            key={record.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center',
                                sourceInfo.color
                              )}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-medium text-neutral-800">{record.reason}</div>
                                <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(record.createdAt)}
                                  <Tag size="sm" color={record.type === 'earn' ? 'honghua' : 'chaojing'}>
                                    {sourceInfo.label}
                                  </Tag>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={cn(
                                'font-bold text-lg',
                                record.type === 'earn' ? 'text-honghua-600' : 'text-neutral-700'
                              )}>
                                {record.type === 'earn' ? '+' : '-'}{record.amount}
                              </div>
                              <div className="text-xs text-neutral-400">余额 {record.balance}</div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </AnimatePresence>

                  {hasMore && (
                    <div className="p-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setPage(p => p + 1)}
                        rightIcon={<ChevronRight className="w-4 h-4" />}
                      >
                        加载更多
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12">
                  <Empty
                    title="暂无积分记录"
                    description={activeTab === 'earn' ? '快去完成任务赚取小红花吧' : activeTab === 'spend' ? '还没有积分支出记录' : '还没有任何积分记录'}
                  />
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
