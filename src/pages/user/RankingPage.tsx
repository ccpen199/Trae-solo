import { useState, Fragment } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, MapPin, Search, Database, Clock, FileText, Shield, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { TrendBadge } from '@/components/ui/TrendBadge';
import { DataSourceTag } from '@/components/ui/DataSourceTag';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

type CategoryCode = 'consumer' | 'education' | 'medical' | 'travel';

const categories: { code: CategoryCode; name: string; icon: string }[] = [
  { code: 'consumer', name: '消费品牌', icon: '🛒' },
  { code: 'education', name: '教育服务', icon: '🎓' },
  { code: 'medical', name: '医疗健康', icon: '🏥' },
  { code: 'travel', name: '旅游出行', icon: '✈️' },
];

const cities = ['全国', '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京'];

interface DimensionScore {
  dimension: string;
  score: number;
  dataSources: { type: 'ecommerce' | 'government' | 'complaint' | 'review' | 'sampling'; count: number; collectTime: string; verified: boolean }[];
}

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
  dimensionScores: DimensionScore[];
  dataSources: { type: 'ecommerce' | 'government' | 'complaint' | 'review' | 'sampling'; count: number }[];
  crossValidated: boolean;
  lastUpdated: string;
}

const baseData: Record<CategoryCode, { name: string; baseScores: number[]; dims: string[]; id: number }[]> = {
  consumer: [
    { name: '蒙牛乳业', baseScores: [94, 88, 92, 86], dims: ['产品质量', '服务体验', '品牌信誉', '价格公道'], id: 1 },
    { name: '农夫山泉', baseScores: [91, 85, 90, 88], dims: ['产品质量', '服务体验', '品牌信誉', '价格公道'], id: 2 },
    { name: '伊利集团', baseScores: [88, 86, 89, 84], dims: ['产品质量', '服务体验', '品牌信誉', '价格公道'], id: 3 },
    { name: '海天味业', baseScores: [86, 82, 87, 85], dims: ['产品质量', '服务体验', '品牌信誉', '价格公道'], id: 4 },
    { name: '海尔智家', baseScores: [85, 88, 82, 80], dims: ['产品质量', '服务体验', '品牌信誉', '价格公道'], id: 5 },
    { name: '格力电器', baseScores: [84, 79, 83, 78], dims: ['产品质量', '服务体验', '品牌信誉', '价格公道'], id: 6 },
  ],
  education: [
    { name: '新东方教育', baseScores: [93, 92, 88, 85], dims: ['教学质量', '师资力量', '服务水平', '性价比'], id: 101 },
    { name: '学而思', baseScores: [90, 89, 85, 86], dims: ['教学质量', '师资力量', '服务水平', '性价比'], id: 102 },
    { name: '好未来', baseScores: [87, 88, 84, 85], dims: ['教学质量', '师资力量', '服务水平', '性价比'], id: 103 },
    { name: '网易有道', baseScores: [85, 83, 84, 86], dims: ['教学质量', '师资力量', '服务水平', '性价比'], id: 104 },
    { name: '中公教育', baseScores: [82, 84, 80, 83], dims: ['教学质量', '师资力量', '服务水平', '性价比'], id: 105 },
  ],
  medical: [
    { name: '北京协和医院', baseScores: [96, 88, 92, 84], dims: ['医疗水平', '服务态度', '设施环境', '收费合理'], id: 201 },
    { name: '上海瑞金医院', baseScores: [94, 89, 91, 86], dims: ['医疗水平', '服务态度', '设施环境', '收费合理'], id: 202 },
    { name: '广州中山医院', baseScores: [92, 88, 90, 88], dims: ['医疗水平', '服务态度', '设施环境', '收费合理'], id: 203 },
    { name: '武汉同济医院', baseScores: [90, 86, 88, 87], dims: ['医疗水平', '服务态度', '设施环境', '收费合理'], id: 204 },
    { name: '四川华西医院', baseScores: [89, 83, 86, 88], dims: ['医疗水平', '服务态度', '设施环境', '收费合理'], id: 205 },
  ],
  travel: [
    { name: '携程旅行', baseScores: [92, 88, 86, 85], dims: ['产品丰富度', '服务质量', '价格优势', '售后保障'], id: 301 },
    { name: '同程旅行', baseScores: [88, 87, 88, 84], dims: ['产品丰富度', '服务质量', '价格优势', '售后保障'], id: 302 },
    { name: '飞猪旅行', baseScores: [86, 84, 87, 83], dims: ['产品丰富度', '服务质量', '价格优势', '售后保障'], id: 303 },
    { name: '去哪儿网', baseScores: [84, 81, 86, 80], dims: ['产品丰富度', '服务质量', '价格优势', '售后保障'], id: 304 },
    { name: '美团酒店', baseScores: [82, 80, 84, 79], dims: ['产品丰富度', '服务质量', '价格优势', '售后保障'], id: 305 },
  ],
};

const cityOffsets: Record<string, number[]> = {
  '全国': [0, 0, 0, 0],
  '北京': [-3, 1, -2, 2],
  '上海': [-1, -2, 2, -1],
  '广州': [-5, 3, -1, -3],
  '深圳': [2, -1, 3, 1],
  '杭州': [4, -3, 1, 2],
  '成都': [-2, 2, -3, 3],
  '武汉': [1, -1, 2, -2],
  '南京': [3, 2, -2, -1],
};

const cityMultiplier: Record<string, number> = {
  '全国': 1.0, '北京': 1.2, '上海': 1.15, '广州': 0.95, '深圳': 1.1,
  '杭州': 0.85, '成都': 0.8, '武汉': 0.75, '南京': 0.7,
};

const sourceTypes: ('ecommerce' | 'government' | 'complaint' | 'review' | 'sampling')[] = ['ecommerce', 'government', 'complaint', 'review', 'sampling'];

function generateRankings(category: CategoryCode, city: string): RankingRow[] {
  const items = baseData[category];
  const offsets = cityOffsets[city] || [0, 0, 0, 0];
  const multiplier = cityMultiplier[city] || 1.0;

  return items.map((item, idx) => {
    const dimScores: DimensionScore[] = item.dims.map((dim, dIdx) => {
      const baseScore = item.baseScores[dIdx];
      const offset = offsets[dIdx] || 0;
      const score = Math.max(60, Math.min(100, baseScore + offset + Math.floor(Math.random() * 3) - 1));
      const usedSources = sourceTypes.slice(0, 2 + Math.floor(Math.random() * 4));
      return {
        dimension: dim,
        score,
        dataSources: usedSources.map(st => ({
          type: st,
          count: Math.floor((Math.random() * 8000 + 200) * multiplier),
          collectTime: `2026-06-${String(10 + Math.floor(Math.random() * 8)).padStart(2, '0')}`,
          verified: Math.random() > 0.2,
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
      dataSources: sourceTypes.slice(0, 2 + Math.floor(Math.random() * 3)).map(st => ({
        type: st,
        count: Math.floor((Math.random() * 10000 + 500) * multiplier),
      })),
      crossValidated: Math.random() > 0.15,
      lastUpdated: `2026-06-${String(10 + Math.floor(Math.random() * 8)).padStart(2, '0')}`,
    };
  }).sort((a, b) => b.overallScore - a.overallScore).map((r, i) => ({ ...r, rank: i + 1 }));
}

export function RankingPage() {
  const { category } = useParams<{ category?: string }>();
  const activeCategory: CategoryCode = (category as CategoryCode) || 'consumer';
  const [activeCity, setActiveCity] = useState('全国');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const data = generateRankings(activeCategory, activeCity);
  const filteredData = data.filter((item) =>
    item.targetName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const catInfo = categories.find(c => c.code === activeCategory);
  const avgScore = filteredData.length > 0 ? Math.round(filteredData.reduce((s, d) => s + d.overallScore, 0) / filteredData.length) : 0;
  const totalSources = filteredData.reduce((s, d) => s + d.dataSources.reduce((ss, ds) => ss + ds.count, 0), 0);
  const validatedCount = filteredData.filter(d => d.crossValidated).length;
  const topScore = filteredData.length > 0 ? filteredData[0].overallScore : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
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
                <span className="text-sm text-slate-400">城市：</span>
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
              <div className="relative ml-auto">
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

          <div className="card p-4 mb-6 border-l-4 border-l-primary">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-white">
                {activeCity === '全国' ? '全国' : activeCity} · {catInfo?.name} 统计摘要
              </span>
              <span className="text-xs text-slate-500 ml-auto flex items-center gap-1">
                <Clock className="w-3 h-3" />数据更新于 2026-06-17
              </span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              <div className="bg-surface/50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-primary">{avgScore}</div>
                <div className="text-xs text-slate-500 mt-1">平均评分</div>
              </div>
              <div className="bg-surface/50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-white">{topScore}</div>
                <div className="text-xs text-slate-500 mt-1">最高评分</div>
              </div>
              <div className="bg-surface/50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-white">{filteredData.length}</div>
                <div className="text-xs text-slate-500 mt-1">评测对象</div>
              </div>
              <div className="bg-surface/50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-accent">{totalSources.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">数据条数</div>
              </div>
              <div className="bg-surface/50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-primary">{validatedCount}/{filteredData.length}</div>
                <div className="text-xs text-slate-500 mt-1">已验证</div>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-light/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-16">排名</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-32">评分</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-28">趋势</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-24">验证</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-20">操作</th>
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
                            <span className="inline-flex items-center gap-1 text-xs text-primary"><CheckCircle2 className="w-3.5 h-3.5" />已验证</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-warning"><AlertTriangle className="w-3.5 h-3.5" />待验证</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <button className="text-slate-400 hover:text-primary transition-colors">
                            {expandedRow === row.targetId ? <ChevronUp /> : <ChevronDown />}
                          </button>
                        </td>
                      </tr>
                      {expandedRow === row.targetId && (
                        <tr className="bg-surface-light/30 animate-fade-in">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="space-y-5">
                              <div>
                                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-primary" />
                                  维度评分（每项含数据来源与采集时间）
                                </h4>
                                <div className="space-y-3">
                                  {row.dimensionScores.map((dim) => (
                                    <div key={dim.dimension} className="bg-surface/50 rounded-lg p-3">
                                      <div className="flex items-center gap-3 mb-2">
                                        <span className="text-sm text-white font-medium w-20">{dim.dimension}</span>
                                        <div className="flex-1 h-2 bg-surface-light rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                                            style={{ width: `${dim.score}%` }}
                                          />
                                        </div>
                                        <span className="text-sm font-bold text-white w-10 text-right">{dim.score}</span>
                                      </div>
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        {dim.dataSources.map((ds, i) => (
                                          <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${
                                            ds.verified
                                              ? 'bg-primary/5 border-primary/20 text-primary'
                                              : 'bg-warning/5 border-warning/20 text-warning'
                                          }`}>
                                            <DataSourceTag type={ds.type} />
                                            <span className="ml-1">{ds.count.toLocaleString()}条</span>
                                            <span className="text-slate-500 ml-1">{ds.collectTime}</span>
                                            {ds.verified ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                                <div className="flex items-center gap-2">
                                  <Database className="w-4 h-4 text-primary" />
                                  <span className="text-xs text-slate-400">
                                    数据口径: {row.city} · 共 {row.dataSources.reduce((s, d) => s + d.count, 0).toLocaleString()} 条 · 更新于 {row.lastUpdated}
                                  </span>
                                </div>
                                <Link
                                  to={`/report/${row.reportId}`}
                                  className="text-sm text-primary hover:text-primary-dark inline-flex items-center gap-1"
                                >
                                  查看完整报告
                                  <ChevronDown className="w-3 h-3 -rotate-90" />
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
