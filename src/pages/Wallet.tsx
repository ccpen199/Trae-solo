import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, TrendingUp, TrendingDown, Wallet as WalletIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { get } from '../utils/request';
import { useUserStore } from '../stores/userStore';

interface CoinRecord {
  id: string;
  amount: number;
  type: string;
  source: string;
  description: string;
  createdAt: string;
}

const Wallet = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUserStore();
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [records, setRecords] = useState<CoinRecord[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isLoggedIn, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const statsRes: any = await get('/wallet/statistics');
      if (statsRes.success) {
        setStatistics(statsRes.statistics);
      }

      const typeParam = activeTab === 'all' ? '' : activeTab;
      const recordsRes: any = await get(`/wallet/records${typeParam ? `?type=${typeParam}` : ''}`);
      if (recordsRes.success) {
        setRecords(recordsRes.records);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (source: string) => {
    if (source.includes('task') || source.includes('joke') || source.includes('idiom')) {
      return <TrendingUp size={18} />;
    }
    if (source.includes('invite')) {
      return <WalletIcon size={18} />;
    }
    if (source.includes('withdraw')) {
      return <TrendingDown size={18} />;
    }
    return <Coins size={18} />;
  };

  const getSourceText = (source: string): string => {
    const map: Record<string, string> = {
      task: '任务奖励',
      register: '注册奖励',
      invite: '邀请奖励',
      invite_commission: '邀请分佣',
      withdraw: '提现',
      withdraw_refund: '提现退回',
    };
    return map[source] || source;
  };

  const tabs = [
    { id: 'all', label: '全部' },
    { id: 'income', label: '收入' },
    { id: 'expense', label: '支出' },
  ];

  return (
    <div className="min-h-screen bg-dark-50 pb-20">
      <div className="bg-gradient-primary text-white pb-8">
        <div className="h-14 flex items-center justify-center">
          <h1 className="text-lg font-bold">金币钱包</h1>
        </div>

        <div className="px-4 text-center">
          <p className="text-white/80 text-sm mb-2">我的金币</p>
          <div className="flex items-baseline justify-center gap-2">
            <Coins size={32} className="text-yellow-300" />
            <span className="text-4xl font-bold">{(user?.coins || 0).toFixed(0)}</span>
          </div>
          <p className="text-white/70 text-sm mt-2">≈ {(user?.coins || 0) * 0.01} 元</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 px-4">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
              <ArrowUpRight size={16} />
              <span>今日收入</span>
            </div>
            <p className="text-xl font-bold">+{statistics?.todayIncome || 0}</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
              <ArrowDownRight size={16} />
              <span>今日支出</span>
            </div>
            <p className="text-xl font-bold">-{statistics?.todayExpense || 0}</p>
          </div>
        </div>

        <div className="mt-6 px-4">
          <button
            onClick={() => navigate('/withdraw')}
            className="w-full py-3.5 bg-white text-primary-500 font-bold rounded-xl shadow-lg"
          >
            立即提现
          </button>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="flex border-b border-dark-100">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'all' | 'income' | 'expense')}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-dark-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-10 text-dark-400">加载中...</div>
            ) : records.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto mb-3 bg-dark-100 rounded-full flex items-center justify-center">
                  <WalletIcon size={28} className="text-dark-300" />
                </div>
                <p className="text-dark-400">暂无{activeTab === 'income' ? '收入' : activeTab === 'expense' ? '支出' : ''}记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((record) => (
                  <div key={record.id} className="flex items-center gap-3 py-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      record.type === 'income' 
                        ? 'bg-green-100 text-green-500' 
                        : 'bg-red-100 text-red-500'
                    }`}>
                      {record.type === 'income' ? (
                        <TrendingUp size={20} />
                      ) : (
                        <TrendingDown size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-dark-800 truncate">{record.description || getSourceText(record.source)}</p>
                      <p className="text-xs text-dark-400 mt-0.5">
                        {new Date(record.createdAt).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className={`text-right font-bold ${
                      record.type === 'income' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {record.type === 'income' ? '+' : '-'}{record.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 mx-4 bg-white rounded-2xl shadow-card p-5">
        <h3 className="font-bold text-dark-800 mb-4">统计数据</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-dark-50 rounded-xl">
            <p className="text-xs text-dark-500 mb-1">本周收入</p>
            <p className="text-lg font-bold text-dark-800">{statistics?.weekIncome || 0} 金币</p>
          </div>
          <div className="text-center p-3 bg-dark-50 rounded-xl">
            <p className="text-xs text-dark-500 mb-1">本月收入</p>
            <p className="text-lg font-bold text-dark-800">{statistics?.monthIncome || 0} 金币</p>
          </div>
          <div className="text-center p-3 bg-dark-50 rounded-xl">
            <p className="text-xs text-dark-500 mb-1">累计收入</p>
            <p className="text-lg font-bold text-dark-800">{statistics?.totalIncome || 0} 金币</p>
          </div>
          <div className="text-center p-3 bg-dark-50 rounded-xl">
            <p className="text-xs text-dark-500 mb-1">累计支出</p>
            <p className="text-lg font-bold text-dark-800">{statistics?.totalExpense || 0} 金币</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
