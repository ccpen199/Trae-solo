import { useState, Fragment, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ChevronDown, ChevronUp, MapPin, Search, Database, Clock, FileText,
  Shield, CheckCircle2, AlertTriangle, Plus, Check, GitCompare,
  X, ArrowRight
} from 'lucide-react';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { TrendBadge } from '@/components/ui/TrendBadge';
import { DataSourceTag } from '@/components/ui/DataSourceTag';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

type CategoryCode = 'consumer' | 'education' | 'medical' | 'travel';

const categories: { code: CategoryCode; name: string; icon: string; dims: string[] }[] = [
  { code: 'consumer', name: '消费品牌', icon: '🛒', dims: ['产品质量', '服务体验', '品牌信誉', '价格公道'] },
  { code: 'education', name: '教育服务', icon: '🎓', dims: ['教学质量', '师资力量', '服务水平', '性价比'] },
  { code: 'medical', name: '医疗健康', icon: '🏥', dims: ['医疗水平', '服务态度', '设施环境', '收费合理'] },
  { code: 'travel', name: '旅游出行', icon: '✈️', dims: ['产品丰富度', '服务质量', '价格优势', '售后保障'] },
];

const cities = ['全国', '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京'];

const cityOffsets: Record<string, number[]> = {
  '全国': [0, 0, 0, 0],
  '北京': [-4, 2, -3, 3],
  '上海': [-2, 3, -1, 2],
  '广州': [-5, -1, -4, 4],
  '深圳': [2, 1, 3, -2],
  '杭州': [4, 3, 2, -1],
  '成都': [-3, 2, -2, 3],
  '武汉': [1, -2, 2, -1],
  '南京': [3, 1, 4, -2],
};

const cityMultiplier: Record<string, number> = {
  '全国': 1.0, '北京': 1.2, '上海': 1.15, '广州': 1.05, '深圳': 1.1,
  '杭州': 0.95, '成都': 0.9, '武汉': 0.85, '南京': 0.8,
};

const baseBrands: Record<CategoryCode, { name: string; baseScores: number[]; id: number }[]> = {
  consumer: [
    { name: '蒙牛乳业', baseScores: [94, 88, 92, 86], id: 1 },
    { name: '农夫山泉', baseScores: [91, 85, 90, 88], id: 2 },
    { name: '伊利集团', baseScores: [88, 86, 89, 84], id: 3 },
    { name: '海天味业', baseScores: [86, 82, 87, 85], id: 4 },
    { name: '海尔智家', baseScores: [85, 88, 82, 80], id: 5 },
    { name: '格力电器', baseScores: [84, 79, 83, 78], id: 6 },
  ],
  education: [
    { name: '新东方教育', baseScores: [93, 92, 88, 85], id: 101 },
    { name: '学而思', baseScores: [90, 89, 85, 86], id: 102 },
    { name: '好未来', baseScores: [87, 88, 84, 85], id: 103 },
    { name: '网易有道', baseScores: [85, 83, 84, 86], id: 104 },
    { name: '中公教育', baseScores: [82, 84, 80, 83], id: 105 },
  ],
  medical: [
    { name: '北京协和医院', baseScores: [96, 88, 92, 84], id: 201 },
    { name: '上海瑞金医院', baseScores: [94, 89, 91, 86], id: 202 },
    { name: '广州中山医院', baseScores: [92, 88, 90, 88], id: 203 },
    { name: '武汉同济医院', baseScores: [90, 86, 88, 87], id: 204 },
    { name: '四川华西医院', baseScores: [89, 83, 86, 88], id: 205 },
  ],
  travel: [
    { name: '携程旅行', baseScores: [92, 88, 86, 85], id: 301 },
    { name: '同程旅行', baseScores: [88, 87, 88, 84], id: 302 },
    { name: '飞猪旅行', baseScores: [86, 84, 87, 83], id: 303 },
    { name: '去哪儿网', baseScores: [84, 81, 86, 80], id: 304 },
    { name: '美团酒店', baseScores: [82, 80, 84, 79], id: 305 },
  ],
};

const sourceTypes: ('ecommerce' | 'government' | 'complaint' | 'review' | 'sampling')[] = ['ecommerce', 'government', 'complaint', 'review', 'sampling'];

interface RankingRow {
  rank: number;
  targetId: number;
  targetName: string;
  overallScore: number;
  previousRank: number;
  changeTrend: 'up' | 'down' | 'stable';
  category: string;
  city: string;
  reportId: number;
  dimensionScores: {
    dimension: string;
    score: number;
    dataSources: { type: string; count: number; collectTime: string; verified: boolean }[];
  }[];
  dataSources: { type: string; count: number }[];
  crossValidated: boolean;
  lastUpdated: string;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateRankings(category: CategoryCode, city: string): RankingRow[] {
  const seed = category.charCodeAt(0) * 1000 + city.length * 37 + 7;
  const rand = seededRandom(seed);
  const items = baseBrands[category];
  const offsets = cityOffsets[city] || [0, 0, 0, 0];
  const mult = cityMultiplier[city] || 1;
  const dimNames = categories.find(c => c.code === category)?.dims || [];
  return items.map((item, idx) => {
    const dimScores = dimNames.map((dim, dIdx) => {
      const score = Math.max(60, Math.min(100, item.baseScores[dIdx] + offsets[dIdx] + Math.floor(rand() * 5) - 2));
      const numSources = 3 + Math.floor(rand() * 3);
      const usedSources = sourceTypes.slice(0, numSources);
      return {
        dimension: dim,
        score,
        dataSources: usedSources.map(st => ({
          type: st,
          count: Math.floor((Math.floor(rand() * 8000) + 200) * mult),
          collectTime: `2026-06-${String(10 + Math.floor(rand() * 8)).padStart(2, '0')}`,
          verified: rand() > 0.2,
        })),
      };
    });
    const overall = Math.round(dimScores.reduce((s, d) => s + d.score, 0) / dimScores.length);
    const prevRank = Math.max(1, idx + 1 + (offsets.reduce((a, b) => a + b, 0) > 0 ? -1 : offsets.reduce((a, b) => a + b, 0) < 0 ? 1 : 0));
    return {
      rank: 0,
      targetId: item.id,
      targetName: item.name,
      overallScore: overall,
      previousRank: prevRank,
      changeTrend: (prevRank > idx + 1 ? 'up' : prevRank < idx + 1 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
      category,
      city,
      reportId: item.id,
      dimensionScores: dimScores,
      dataSources: sourceTypes.slice(0, 4).map(st => ({ type: st, count: Math.floor((Math.floor(rand() * 10000) + 500) * mult) })),
      crossValidated: rand() > 0.15,
      lastUpdated: `2026-06-${String(10 + Math.floor(rand() * 8)).padStart(2, '0')}`,
    };
  }).sort((a, b) => b.overallScore - a.overallScore).map((r, i) => ({ ...r, rank: i + 1 }));
}

export function RankingPage() {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const activeCategory: CategoryCode = (category as CategoryCode) || 'consumer';
  const [activeCity, setActiveCity] = useState('全国');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [toast, setToast] = useState<{ msg: string; action?: { label: string; onClick: () => void } } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('compareIds');
      if (saved) setCompareIds(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('compareIds', JSON.stringify(compareIds)); } catch {}
  }, [compareIds]);

  const data = useMemo(
    () => generateRankings(activeCategory, activeCity),
    [activeCategory, activeCity]
  );

  const filteredData = useMemo(
    () => data.filter((item) => item.targetName.toLowerCase().includes(searchQuery.toLowerCase())),
    [data, searchQuery]
  );

  const catInfo = categories.find(c => c.code === activeCategory);
  const avgScore = filteredData.length > 0 ? Math.round(filteredData.reduce((s, d) => s + d.overallScore, 0) / filteredData.length) : 0;
  const maxScore = filteredData.length > 0 ? Math.max(...filteredData.map(d => d.overallScore)) : 0;
  const totalSources = filteredData.reduce((s, d) => s + d.dataSources.reduce((ss, ds) => ss + ds.count, 0), 0);
  const validRate = filteredData.length > 0 ? Math.round((filteredData.filter(d => d.crossValidated).length / filteredData.length) * 100) : 0;

  const showToast = (msg: string, action?: { label: string; onClick: () => void }) => {
    setToast({ msg, action });
    setTimeout(() => setToast(null), 3500);
  };

  const addToCompare = (id: number, name: string) => {
    if (compareIds.includes(id)) {
      showToast(`${name} 已在对比列表中`);
    } else if (compareIds.length >= 4) {
      showToast('对比最多4个对象，请先移除');
    } else {
      const newIds = [...compareIds, id];
      setCompareIds(newIds);
      showToast(
        `已加入 ${name}，当前 ${newIds.length}/4`,
        { label: '去对比 →', onClick: () => navigate('/compare') }
      );
    }
  };

  const removeFromCompare = (id: number) => {
    setCompareIds(prev => prev.filter(i => i !== id));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 bg-primary text-white rounded-md shadow-lg animate-fade-in text-sm flex items-center gap-3">
          <span>{toast.msg}</span>
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
            >
              {toast.action.label}
            </button>
          )}
          <button onClick={() => setToast(null)} className="ml-1 text-white/70 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-serif font-bold text-white mb-4">
              {catInfo?.icon} {catInfo?.name || '评价'}排行榜
              <span className="ml-3 text-base font-normal text-slate-400">
                {activeCity === '全国' ? '全国维度' : `${activeCity}地区`}
              </span>
            </h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((cat) => (
                <Link
                  key={cat.code}
                  to={`/rankings/${cat.code}`}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeCategory === cat.code
                      ? 'bg-primary text-white shadow-glow-primary'
                      : 'bg-surface text-slate-300 hover:bg-surface-light hover:text-white'
                  }`}
                >
                  {cat.icon} {cat.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="card p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm text-slate-400">城市口径：</span>
                <div className="flex flex-wrap gap-1">
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => { setActiveCity(city); setExpandedRow(null); }}
                      className={`px-3 py-1 rounded text-xs transition-all ${
                        activeCity === city
                          ? 'bg-primary/20 text-primary border border-primary/30 font-medium'
                          : 'text-slate-400 hover:text-white hover:bg-surface-light'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative ml-auto flex items-center gap-3">
                <Link to="/compare" className="btn btn-primary text-sm">
                  <GitCompare className="w-4 h-4 mr-1" />
                  对比中心
                  {compareIds.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">{compareIds.length}/4</span>}
                </Link>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索品牌..."
                    className="w-56 px-3 py-1.5 pl-9 bg-surface-light border border-border rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {compareIds.length > 0 && (
            <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <GitCompare className="w-5 h-5 text-primary" />
                <span className="text-sm text-white">
                  已选 <span className="font-bold text-primary">{compareIds.length}</span> 个对象加入对比
                  <span className="text-slate-400 ml-2">（最多4个）</span>
                </span>
                <div className="flex items-center gap-1.5 ml-4">
                  {compareIds.map(id => {
                    const item = data.find(d => d.targetId === id);
                    return item ? (
                      <span key={id} className="px-2 py-1 bg-primary/15 text-primary text-xs rounded flex items-center gap-1 border border-primary/30">
                        {item.targetName}
                        <button onClick={() => removeFromCompare(id)} className="hover:text-white ml-1"><X className="w-3 h-3" /></button>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              <Link to="/compare" className="btn btn-primary text-xs">
                查看对比结果 <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="card p-4 text-center border-l-4 border-l-primary">
              <div className="text-2xl font-bold text-primary">{avgScore}</div>
              <div className="text-xs text-slate-500 mt-1">{activeCity}均分</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-accent">{maxScore}</div>
              <div className="text-xs text-slate-500 mt-1">最高评分</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-white">{filteredData.length}</div>
              <div className="text-xs text-slate-500 mt-1">评测对象</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{totalSources.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">数据条数</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-warning">{validRate}%</div>
              <div className="text-xs text-slate-500 mt-1">交叉验证比例</div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-light/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-16">排名</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">评测对象</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-32">综合评分</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-24">趋势</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-24">验证</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-28">对比</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-20">详情</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredData.map((row) => (
                    <Fragment key={row.targetId}>
                      <tr
                        className="hover:bg-surface-light/30 transition-colors cursor-pointer"
                        onClick={() => setExpandedRow(expandedRow === row.targetId ? null : row.targetId)}
                      >
                        <td className="px-4 py-4">
                          <span className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold ${
                            row.rank === 1 ? 'bg-warning/20 text-warning' :
                            row.rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                            row.rank === 3 ? 'bg-amber-700/20 text-amber-600' :
                            'bg-surface-light text-slate-400'
                          }`}>
                            {row.rank}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <ScoreRing score={row.overallScore} size={44} strokeWidth={4} showLabel={false} />
                            <div>
                              <div className="font-medium text-white">{row.targetName}</div>
                              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                <span>报告 #{String(row.reportId).padStart(6, '0')}</span>
                                <span className="text-slate-600">·</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{row.lastUpdated}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xl font-bold text-white">{row.overallScore}</span>
                          <span className="text-sm text-slate-500 ml-1">/100</span>
                        </td>
                        <td className="px-4 py-4">
                          <TrendBadge trend={row.changeTrend} value={Math.abs(row.previousRank - row.rank)} />
                        </td>
                        <td className="px-4 py-4">
                          {row.crossValidated ? (
                            <span className="inline-flex items-center gap-1 text-xs text-primary"><CheckCircle2 className="w-3.5 h-3.5" />已交叉验证</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-warning"><AlertTriangle className="w-3.5 h-3.5" />待补充验证</span>
                          )}
                        </td>
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => addToCompare(row.targetId, row.targetName)}
                            disabled={compareIds.includes(row.targetId)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                              compareIds.includes(row.targetId)
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'bg-surface-light text-slate-300 hover:bg-primary/10 hover:text-primary'
                            }`}
                          >
                            {compareIds.includes(row.targetId) ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                            {compareIds.includes(row.targetId) ? '已加入' : '加对比'}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <button className="text-slate-400 hover:text-primary transition-colors">
                            {expandedRow === row.targetId ? <ChevronUp /> : <ChevronDown />}
                          </button>
                        </td>
                      </tr>
                      {expandedRow === row.targetId && (
                        <tr className="bg-surface-light/30 animate-fade-in">
                          <td colSpan={7} className="px-4 py-5">
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-primary" />
                                  多维度评分明细（每项评分含数据来源·采集时间·验证状态）
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {row.dimensionScores.map((dim) => (
                                    <div key={dim.dimension} className="bg-surface/70 rounded-lg p-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-white font-semibold">{dim.dimension}</span>
                                        <span className="text-xl font-bold text-primary">{dim.score}<span className="text-xs text-slate-500 ml-0.5">/100</span></span>
                                      </div>
                                      <div className="h-2 bg-surface-light rounded-full overflow-hidden mb-3">
                                        <div
                                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                                          style={{ width: `${dim.score}%` }}
                                        />
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {dim.dataSources.map((ds, i) => (
                                          <div key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border ${
                                            ds.verified
                                              ? 'bg-primary/5 border-primary/20 text-primary'
                                              : 'bg-warning/5 border-warning/20 text-warning'
                                          }`}>
                                            <DataSourceTag type={ds.type as any} />
                                            <span className="text-slate-300">{ds.count.toLocaleString()}条</span>
                                            <span className="text-slate-600">·</span>
                                            <Clock className="w-3 h-3 text-slate-400" />
                                            <span className="text-slate-400">{ds.collectTime}</span>
                                            {ds.verified ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="pt-4 border-t border-slate-700/50 flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-6 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <Database className="w-4 h-4 text-primary" />
                                    <span className="text-xs text-slate-400">数据口径：{row.city} · 共 {row.dataSources.reduce((s, d) => s + d.count, 0).toLocaleString()} 条原始数据</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs text-slate-400">数据更新时间：{row.lastUpdated}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-primary" />
                                    <span className="text-xs text-slate-400">
                                      {row.crossValidated ? '交叉验证：3个独立数据源结果一致' : '交叉验证：需补充第3方数据验证'}
                                    </span>
                                  </div>
                                </div>
                                <Link to={`/report/${row.reportId}`} className="text-sm text-primary hover:text-primary-dark inline-flex items-center gap-1 font-medium">
                                  查看完整报告 <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default RankingPage;
