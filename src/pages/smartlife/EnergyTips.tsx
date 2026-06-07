import { useEffect, useState } from 'react';
import { Lightbulb, Sun, Cloud, Snowflake, Thermometer, Leaf, Zap, Home, Building2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';

interface Tip {
  id: string;
  title: string;
  description: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
  customerType: 'all' | 'individual' | 'family' | 'enterprise' | 'park';
  category: string;
  saving: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const mockTips: Tip[] = [
  { id: '1', title: '夏季空调温度设置', description: '将夏季空调温度设置为26℃以上，每提高1℃可节省约7%的空调能耗。建议搭配风扇使用，提高舒适度同时降低能耗。', season: 'summer', customerType: 'all', category: '空调', saving: '5-10%', difficulty: 'easy' },
  { id: '2', title: '充分利用自然光', description: '白天尽量拉开窗帘，充分利用自然光照明，减少电灯使用。采用分区照明，人走灯灭。', season: 'all', customerType: 'all', category: '照明', saving: '15-20%', difficulty: 'easy' },
  { id: '3', title: '定期清洗空调滤网', description: '空调滤网积尘会增加风阻，降低制冷效率。建议每月清洗一次，可提升制冷效率15%以上。', season: 'all', customerType: 'all', category: '保养', saving: '10-15%', difficulty: 'easy' },
  { id: '4', title: '冬季采暖温度合理设置', description: '冬季采暖温度建议设置在18-20℃，每降低1℃可节省约5%的采暖能耗。', season: 'winter', customerType: 'all', category: '采暖', saving: '5-8%', difficulty: 'easy' },
  { id: '5', title: '企业错峰用电', description: '将高能耗生产工序安排在夜间谷时进行，可大幅降低电费支出。安装储能设备，平抑负荷。', season: 'all', customerType: 'enterprise', category: '生产', saving: '20-30%', difficulty: 'medium' },
  { id: '6', title: '园区光伏发电', description: '在园区公共区域安装智能照明控制系统，根据自然光强度自动调节灯光亮度。', season: 'all', customerType: 'park', category: '照明', saving: '30-40%', difficulty: 'hard' },
  { id: '7', title: '家电待机能耗', description: '家电待机状态下仍有少量能耗，长期积累不容小觑。建议使用智能插座，一键切断待机电源。', season: 'all', customerType: 'family', category: '家电', saving: '3-5%', difficulty: 'easy' },
  { id: '8', title: '热水器保温', description: '根据季节调整热水器温度，夏季可适当降低温度设置，定期清除水垢，提高加热效率。', season: 'all', customerType: 'individual', category: '热水', saving: '10-15%', difficulty: 'easy' },
];

const SEASON_ICONS: Record<string, React.ReactNode> = {
  spring: <Sun size={16} />,
  summer: <Sun size={16} />,
  autumn: <Cloud size={16} />,
  winter: <Snowflake size={16} />,
  all: <Thermometer size={16} />,
};

const SEASON_LABELS: Record<string, string> = {
  spring: '春季',
  summer: '夏季',
  autumn: '秋季',
  winter: '冬季',
  all: '全年',
};

const getCurrentSeason = (): Tip['season'] => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
};

export default function EnergyTips() {
  const { user } = useAuthStore();
  const [tips, setTips] = useState<Tip[]>(mockTips);
  const [loading, setLoading] = useState(true);
  const [seasonFilter, setSeasonFilter] = useState<Tip['season'] | 'all'>(getCurrentSeason());
  const [typeFilter, setTypeFilter] = useState<'all' | Tip['customerType']>('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<Tip[]>('/smartlife/tips');
        setTips(res);
      } catch {
        setTips(mockTips);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = tips.filter((tip) => {
    const seasonMatch = seasonFilter === 'all' || tip.season === 'all' || tip.season === seasonFilter;
    const typeMatch = typeFilter === 'all' || tip.customerType === 'all' || tip.customerType === typeFilter;
    return seasonMatch && typeMatch;
  });

  const difficultyBadge = (d: string) => (d === 'easy' ? 'badge-green' : d === 'medium' ? 'badge-amber' : 'badge-blue');
  const difficultyLabel = (d: string) => (d === 'easy' ? '简单' : d === 'medium' ? '中等' : '困难');

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-csg-navy border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <Lightbulb size={28} className="text-csg-amber" />
        <div>
          <h1 className="page-title">节能建议</h1>
          <p className="page-desc">根据季节和用户类型推荐个性化节能建议</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">季节：</span>
          {(['all', 'spring', 'summer', 'autumn', 'winter'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSeasonFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${seasonFilter === s ? 'bg-csg-navy text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
            >
              {SEASON_ICONS[s]} {SEASON_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">用户类型：</span>
          <button onClick={() => setTypeFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${typeFilter === 'all' ? 'bg-csg-green text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>全部</button>
          <button onClick={() => setTypeFilter('individual')} className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${typeFilter === 'individual' ? 'bg-csg-green text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}><Home size={14} /> 个人</button>
          <button onClick={() => setTypeFilter('family')} className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${typeFilter === 'family' ? 'bg-csg-green text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}><Home size={14} /> 家庭</button>
          <button onClick={() => setTypeFilter('enterprise')} className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${typeFilter === 'enterprise' ? 'bg-csg-green text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}><Building2 size={14} /> 企业</button>
          <button onClick={() => setTypeFilter('park')} className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${typeFilter === 'park' ? 'bg-csg-green text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}><Building2 size={14} /> 园区</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((tip) => (
          <div key={tip.id} className="card p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-csg-amber/10 flex items-center justify-center shrink-0">
                <Lightbulb size={20} className="text-csg-amber" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{tip.title}</h4>
                  <span className="badge-blue">{tip.category}</span>
                  <span className={difficultyBadge(tip.difficulty)}>{difficultyLabel(tip.difficulty)}</span>
                  <span className="badge-green">节省 {tip.saving}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{tip.description}</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
                  {SEASON_ICONS[tip.season]}
                  <span>适用：{SEASON_LABELS[tip.season]}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <Leaf size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">没有符合条件的节能建议</p>
        </div>
      )}
    </div>
  );
}
