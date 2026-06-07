import { useEffect, useState } from 'react';
import { ShieldAlert, Search, AlertTriangle, Battery, Zap, Fan, Flame, Home, Factory, TreePine } from 'lucide-react';
import { api } from '@/lib/api';

interface WikiArticle {
  id: string;
  title: string;
  content: string;
  category: 'home' | 'enterprise' | 'public' | 'fire' | 'electrical';
  dangerLevel: 'low' | 'medium' | 'high';
}

const mockArticles: WikiArticle[] = [
  { id: '1', title: '家庭用电安全指南', content: '1. 不要用湿手触碰电器；2. 定期检查电线老化情况；3. 不要在一个插座上连接多个大功率电器；4. 外出时关闭不必要的电器电源；5. 安装漏电保护器并定期测试。', category: 'home', dangerLevel: 'medium' },
  { id: '2', title: '电动车充电安全须知', content: '1. 购买正规厂家生产的电动车和充电器；2. 不要在楼道、室内充电；3. 不要过充（不超过8小时）；4. 定期检查电池状态；5. 充电时远离易燃易爆物品。', category: 'electrical', dangerLevel: 'high' },
  { id: '3', title: '企业用电安全管理规范', content: '1. 建立健全用电安全管理制度；2. 配备专职电工并持证上岗；3. 定期进行电气安全检测；4. 制定触电事故应急预案；5. 加强员工用电安全培训。', category: 'enterprise', dangerLevel: 'high' },
  { id: '4', title: '空调使用安全与节能', content: '1. 定期清洗空调滤网；2. 温度设置适中（夏季26℃以上）；3. 避免长时间直吹人体；4. 外出时提前关闭空调；5. 选用能效等级高的空调产品。', category: 'home', dangerLevel: 'low' },
  { id: '5', title: '电气火灾预防措施', content: '1. 不超负荷用电；2. 及时更换老化线路；3. 不在电线上晾晒衣物；4. 家用电器使用后及时拔下电源；5. 配备适用的灭火器材并掌握使用方法。', category: 'fire', dangerLevel: 'high' },
  { id: '6', title: '公共场所用电安全', content: '1. 不随意触碰公共用电设施；2. 发现电线垂落及时报警；3. 不在变压器附近玩耍；4. 雷雨天远离电线杆和大树；5. 发现有人触电不要直接施救，先断电。', category: 'public', dangerLevel: 'medium' },
  { id: '7', title: '电热水器安全使用', content: '1. 定期检查漏电保护装置；2. 洗澡时尽量断电使用；3. 定期清除水垢；4. 不要自行拆装维修；5. 达到使用年限及时更换。', category: 'home', dangerLevel: 'high' },
  { id: '8', title: '工业园区安全用电', content: '1. 合理规划配电系统；2. 建立设备巡检制度；3. 严禁违章作业；4. 落实三级安全培训；5. 定期开展应急演练。', category: 'enterprise', dangerLevel: 'high' },
];

const CATEGORY_TABS = [
  { key: 'all', label: '全部', icon: <ShieldAlert size={16} /> },
  { key: 'home', label: '家庭', icon: <Home size={16} /> },
  { key: 'enterprise', label: '企业', icon: <Factory size={16} /> },
  { key: 'electrical', label: '电器', icon: <Zap size={16} /> },
  { key: 'fire', label: '消防', icon: <Flame size={16} /> },
  { key: 'public', label: '公共场所', icon: <TreePine size={16} /> },
];

export default function SafetyWiki() {
  const [articles, setArticles] = useState<WikiArticle[]>(mockArticles);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<WikiArticle[]>('/knowledge/safety');
        setArticles(res);
      } catch {
        setArticles(mockArticles);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = articles.filter((a) => {
    const matchSearch = !search || a.title.includes(search) || a.content.includes(search);
    const matchCategory = activeCategory === 'all' || a.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const dangerBadge = (d: string) => (d === 'high' ? 'badge-red' : d === 'medium' ? 'badge-amber' : 'badge-green');
  const dangerLabel = (d: string) => (d === 'high' ? '高危' : d === 'medium' ? '中危' : '低危');
  const dangerIcon = (d: string) => (d === 'high' ? <AlertTriangle size={14} /> : d === 'medium' ? <Battery size={14} /> : <Fan size={14} />);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-csg-navy border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <ShieldAlert size={28} className="text-csg-red" />
        <div>
          <h1 className="page-title">安全百科</h1>
          <p className="page-desc">了解各类用电安全知识，防范安全事故</p>
        </div>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索安全知识..."
          className="input-field pl-10"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveCategory(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 ${activeCategory === tab.key ? 'bg-csg-red text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((article) => (
          <div key={article.id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${article.dangerLevel === 'high' ? 'bg-red-100 text-csg-red dark:bg-red-900/30' : article.dangerLevel === 'medium' ? 'bg-amber-100 text-csg-amber dark:bg-amber-900/30' : 'bg-green-100 text-csg-green dark:bg-green-900/30'}`}>
                {dangerIcon(article.dangerLevel)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{article.title}</h4>
                  <span className={dangerBadge(article.dangerLevel)}>
                    {dangerIcon(article.dangerLevel)} {dangerLabel(article.dangerLevel)}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                  {article.content}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <ShieldAlert size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">没有找到相关安全知识</p>
        </div>
      )}
    </div>
  );
}
