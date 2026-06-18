import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Plus, X, TrendingUp, TrendingDown, CheckCircle2, AlertCircle,
  GitCompare, Database, CheckCircle, Download, History, Trash2
} from 'lucide-react';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { TrendBadge } from '@/components/ui/TrendBadge';
import { RadarChart } from '@/components/charts/RadarChart';
import { BarChart } from '@/components/charts/BarChart';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface CompareItem {
  id: number;
  name: string;
  category: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  dimensions: { name: string; score: number }[];
  advantages: string[];
  disadvantages: string[];
}

interface CompareHistoryItem {
  id: string;
  time: string;
  items: { id: number; name: string }[];
}

const searchCandidates = [
  { id: 1, name: '蒙牛乳业', category: '消费品牌' },
  { id: 2, name: '农夫山泉', category: '消费品牌' },
  { id: 3, name: '伊利集团', category: '消费品牌' },
  { id: 4, name: '海天味业', category: '消费品牌' },
  { id: 5, name: '海尔智家', category: '消费品牌' },
  { id: 6, name: '格力电器', category: '消费品牌' },
  { id: 101, name: '新东方教育', category: '教育服务' },
  { id: 102, name: '学而思', category: '教育服务' },
  { id: 103, name: '好未来', category: '教育服务' },
];

const mockCompareData: Record<number, CompareItem> = {
  1: { id: 1, name: '蒙牛乳业', category: '消费品牌', score: 92, trend: 'up', trendValue: 3, dimensions: [{ name: '产品质量', score: 94 }, { name: '服务体验', score: 88 }, { name: '品牌信誉', score: 92 }, { name: '价格公道', score: 86 }], advantages: ['产品品质稳定', '品牌知名度高', '售后服务完善'], disadvantages: ['高端线性价比一般', '部分地区配送慢'] },
  2: { id: 2, name: '农夫山泉', category: '消费品牌', score: 89, trend: 'stable', trendValue: 0, dimensions: [{ name: '产品质量', score: 91 }, { name: '服务体验', score: 85 }, { name: '品牌信誉', score: 90 }, { name: '价格公道', score: 88 }], advantages: ['产品口碑好', '价格亲民', '市场覆盖广'], disadvantages: ['产品线相对单一', '创新产品较少'] },
  3: { id: 3, name: '伊利集团', category: '消费品牌', score: 87, trend: 'up', trendValue: 1, dimensions: [{ name: '产品质量', score: 88 }, { name: '服务体验', score: 86 }, { name: '品牌信誉', score: 89 }, { name: '价格公道', score: 84 }], advantages: ['渠道覆盖广', '营销能力强', '产品线丰富'], disadvantages: ['高端产品评价一般', '投诉处理稍慢'] },
  4: { id: 4, name: '海天味业', category: '消费品牌', score: 85, trend: 'down', trendValue: 2, dimensions: [{ name: '产品质量', score: 86 }, { name: '服务体验', score: 82 }, { name: '品牌信誉', score: 87 }, { name: '价格公道', score: 85 }], advantages: ['品类覆盖广', '市场占有率高', '价格亲民'], disadvantages: ['产品创新不足', '高端市场评价一般'] },
  5: { id: 5, name: '海尔智家', category: '消费品牌', score: 83, trend: 'up', trendValue: 5, dimensions: [{ name: '产品质量', score: 85 }, { name: '服务体验', score: 88 }, { name: '品牌信誉', score: 82 }, { name: '价格公道', score: 80 }], advantages: ['售后服务好', '智能家居生态完善', '品质可靠'], disadvantages: ['价格偏高', '部分产品智能化程度一般'] },
  6: { id: 6, name: '格力电器', category: '消费品牌', score: 81, trend: 'down', trendValue: 3, dimensions: [{ name: '产品质量', score: 84 }, { name: '服务体验', score: 79 }, { name: '品牌信誉', score: 83 }, { name: '价格公道', score: 78 }], advantages: ['核心技术强', '空调品类口碑好'], disadvantages: ['售后服务响应慢', '产品线相对单一'] },
  101: { id: 101, name: '新东方教育', category: '教育服务', score: 91, trend: 'up', trendValue: 2, dimensions: [{ name: '教学质量', score: 93 }, { name: '师资力量', score: 92 }, { name: '服务水平', score: 88 }, { name: '性价比', score: 85 }], advantages: ['师资力量雄厚', '教学体系完善', '品牌知名度高'], disadvantages: ['价格偏高', '部分校区班型选择少'] },
  102: { id: 102, name: '学而思', category: '教育服务', score: 88, trend: 'stable', trendValue: 0, dimensions: [{ name: '教学质量', score: 90 }, { name: '师资力量', score: 89 }, { name: '服务水平', score: 85 }, { name: '性价比', score: 86 }], advantages: ['教研体系强', '在线教育资源丰富', '家长口碑好'], disadvantages: ['退费流程繁琐', '线下网点较少'] },
  103: { id: 103, name: '好未来', category: '教育服务', score: 86, trend: 'up', trendValue: 4, dimensions: [{ name: '教学质量', score: 87 }, { name: '师资力量', score: 88 }, { name: '服务水平', score: 84 }, { name: '性价比', score: 85 }], advantages: ['在线教育成熟', '科技驱动教学', '课程体系完善'], disadvantages: ['互动性不如线下', '高端课程价格高'] },
};

const colors = ['#10B981', '#6366F1', '#F59E0B', '#EF4444'];

export function ComparePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [history, setHistory] = useState<CompareHistoryItem[]>([]);
  const [toastMsg, setToastMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'matrix' | 'diff' | 'history'>('matrix');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('compareIds');
      if (saved) setCompareIds(JSON.parse(saved));
      const h = localStorage.getItem('compareHistory');
      if (h) setHistory(JSON.parse(h));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('compareIds', JSON.stringify(compareIds)); } catch {}
  }, [compareIds]);

  const filteredCandidates = searchCandidates.filter(
    (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !compareIds.includes(c.id)
  );

  const compareItems = compareIds.map((id) => mockCompareData[id]).filter(Boolean) as CompareItem[];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2200);
  };

  const addItem = (id: number) => {
    if (compareIds.length < 4 && !compareIds.includes(id)) {
      setCompareIds((prev) => [...prev, id]);
      showToast(`已加入 ${mockCompareData[id].name}`);
    } else if (compareIds.length >= 4) {
      showToast('最多4个对比对象');
    }
    setSearchQuery('');
  };

  const removeItem = (id: number) => {
    setCompareIds((prev) => prev.filter((i) => i !== id));
  };

  const clearAll = () => {
    setCompareIds([]);
    showToast('已清空对比列表');
  };

  const saveCompare = () => {
    if (compareItems.length < 2) return;
    const item: CompareHistoryItem = {
      id: Date.now().toString(),
      time: new Date().toLocaleString('zh-CN'),
      items: compareItems.map(i => ({ id: i.id, name: i.name })),
    };
    const newHistory = [item, ...history].slice(0, 5);
    setHistory(newHistory);
    try { localStorage.setItem('compareHistory', JSON.stringify(newHistory)); } catch {}

    try {
      const blob = new Blob([JSON.stringify({
        savedAt: item.time,
        items: compareItems,
      }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `对比结果_${item.items.map(i=>i.name).join('_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
    showToast('对比结果已保存');
  };

  const loadHistory = (ids: number[]) => {
    setCompareIds(ids.slice(0, 4));
    setActiveTab('matrix');
  };

  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem('compareHistory'); } catch {}
  };

  const allDimensionNames = [...new Set(compareItems.flatMap((item) => item.dimensions.map((d) => d.name)))];

  const radarData = allDimensionNames.map((dimName) => {
    const obj: any = { dimension: dimName };
    compareItems.forEach((item) => {
      const dim = item.dimensions.find((d) => d.name === dimName);
      obj[item.name] = dim ? dim.score : 0;
    });
    return obj;
  });

  const radarSeries = compareItems.map((item, idx) => ({
    key: item.name,
    color: colors[idx % colors.length],
    name: item.name,
  }));

  const barData = compareItems.map((item) => ({ name: item.name, 综合评分: item.score }));

  const diffDims = allDimensionNames.map(dimName => {
    const scores = compareItems.map(item => {
      const d = item.dimensions.find(x => x.name === dimName);
      return { name: item.name, score: d?.score || 0 };
    }).sort((a, b) => b.score - a.score);
    if (scores.length < 2) return null;
    const gap = scores[0].score - scores[scores.length - 1].score;
    return { dimName, gap, best: scores[0], worst: scores[scores.length - 1] };
  }).filter(Boolean).sort((a, b) => (b?.gap || 0) - (a?.gap || 0)).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 bg-primary text-white rounded-md shadow-lg animate-fade-in text-sm">
          {toastMsg}
        </div>
      )}

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-white mb-2 flex items-center gap-2">
              <GitCompare className="w-6 h-6 text-primary" />
              竞品对比分析
            </h1>
            <p className="text-slate-400 text-sm">选择最多4个品牌或机构进行多维度对比分析，支持保存与下载对比结果</p>
          </div>
          {compareItems.length >= 2 && (
            <div className="flex gap-2">
              <button onClick={clearAll} className="btn btn-outline text-sm">
                <Trash2 className="w-4 h-4 mr-1" />
                清空
              </button>
              <button onClick={saveCompare} className="btn btn-primary text-sm">
                <Download className="w-4 h-4 mr-1" />
                保存对比结果
              </button>
            </div>
          )}
        </div>

        <div className="card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {compareItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-md border-2 border-primary/50 ring-2 ring-primary/20">
                <ScoreRing score={item.score} size={32} strokeWidth={3} showLabel={false} />
                <div>
                  <div className="text-sm font-medium text-white">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.category} · {item.score}分</div>
                </div>
                {compareIds.length > 1 && (
                  <button onClick={() => removeItem(item.id)} className="ml-1 p-1 rounded hover:bg-danger/20 text-slate-400 hover:text-danger transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {compareIds.length < 4 && (
              <div className="relative">
                <button
                  onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); }}
                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-primary/50 rounded-md text-primary hover:bg-primary/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加对比 ({compareIds.length}/4)
                </button>
                {showSearch && (
                  <div className="absolute top-full left-0 mt-2 w-80 card z-10 animate-fade-in">
                    <div className="p-2 border-b border-slate-700/50">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="搜索品牌或机构..."
                          autoFocus
                          className="w-full pl-8 pr-3 py-2 bg-surface-light border border-border rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                      {filteredCandidates.length > 0 ? (
                        filteredCandidates.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => addItem(c.id)}
                            className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:bg-primary/10 hover:text-white flex items-center justify-between transition-colors"
                          >
                            <span className="font-medium">{c.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-surface-light text-slate-400">{c.category}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-center text-sm text-slate-500">暂无匹配结果</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {compareItems.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle className="w-3.5 h-3.5 text-primary" />
              已选 {compareItems.length} 个对象进行对比，点击 × 移除，或继续添加（最多4个）
            </div>
          )}
        </div>

        {compareItems.length >= 2 ? (
          <div className="space-y-6 animate-fade-in" key={compareIds.join('-')}>
            <div className="card p-6">
              <h3 className="font-serif font-semibold text-white mb-6">综合评分对比</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {compareItems.map((item) => (
                  <div key={item.id} className="text-center">
                    <ScoreRing score={item.score} size={100} strokeWidth={8} />
                    <h4 className="mt-3 font-medium text-white">{item.name}</h4>
                    <div className="mt-1"><TrendBadge trend={item.trend} value={item.trendValue} /></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-serif font-semibold text-white mb-4">维度雷达图</h3>
                <RadarChart data={radarData} series={radarSeries} height={320} />
              </div>
              <div className="card p-6">
                <h3 className="font-serif font-semibold text-white mb-4">综合评分对比</h3>
                <BarChart data={barData} series={[{ key: '综合评分', color: '#10B981' }]} height={320} />
              </div>
            </div>

            <div className="border-b border-slate-700/50 mb-2">
              <div className="flex gap-6">
                <button onClick={() => setActiveTab('matrix')} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'matrix' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  维度评分矩阵
                </button>
                <button onClick={() => setActiveTab('diff')} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'diff' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  差异字段分析
                </button>
                <button onClick={() => setActiveTab('history')} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <History className="w-4 h-4 inline mr-1" />对比历史 ({history.length})
                </button>
              </div>
            </div>

            {activeTab === 'matrix' && (
              <div className="card overflow-hidden animate-fade-in">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface-light/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">评价维度</th>
                        {compareItems.map((item) => (
                          <th key={item.id} className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">{item.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {allDimensionNames.map((dimName) => (
                        <tr key={dimName} className="hover:bg-surface-light/20">
                          <td className="px-4 py-3 text-sm text-slate-300">{dimName}</td>
                          {compareItems.map((item) => {
                            const dim = item.dimensions.find((d) => d.name === dimName);
                            const score = dim?.score || 0;
                            const allScoresForDim = compareItems.map((c) => c.dimensions.find((d) => d.name === dimName)?.score || 0);
                            const maxScore = Math.max(...allScoresForDim);
                            const isBest = score === maxScore && score > 0;
                            return (
                              <td key={item.id} className="px-4 py-3 text-center">
                                <span className={`text-sm font-medium ${isBest ? 'text-primary' : 'text-white'}`}>
                                  {score > 0 ? score : '-'}
                                  {isBest && <span className="ml-1 text-xs">★</span>}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr className="bg-surface-light/30">
                        <td className="px-4 py-3 text-sm font-medium text-white">综合评分</td>
                        {compareItems.map((item) => {
                          const maxScore = Math.max(...compareItems.map((c) => c.score));
                          const isBest = item.score === maxScore;
                          return (
                            <td key={item.id} className="px-4 py-3 text-center">
                              <span className={`text-base font-bold ${isBest ? 'text-primary' : 'text-white'}`}>
                                {item.score}
                                {isBest && <span className="ml-1 text-xs">★</span>}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'diff' && (
              <div className="space-y-3 animate-fade-in">
                <div className="card p-5">
                  <p className="text-sm text-slate-400 mb-4">以下为对比对象之间评分差异最大的 Top {diffDims.length} 个维度（差异越大越值得关注）</p>
                  <div className="space-y-3">
                    {diffDims.map((d, i) => d && (
                      <div key={i} className="p-4 bg-surface-light/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-semibold">{d.dimName}</span>
                          <span className="px-2 py-0.5 rounded bg-danger/10 text-danger text-xs border border-danger/20">差距 {d.gap} 分</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded bg-primary/5 border border-primary/20">
                            <div className="text-xs text-primary mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />表现最优</div>
                            <div className="text-white font-medium">{d.best.name} <span className="text-primary ml-2">{d.best.score}</span></div>
                          </div>
                          <div className="p-3 rounded bg-warning/5 border border-warning/20">
                            <div className="text-xs text-warning mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3" />有待改进</div>
                            <div className="text-white font-medium">{d.worst.name} <span className="text-warning ml-2">{d.worst.score}</span></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="card p-5 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-slate-400">最近保存的对比记录（最多5条）</p>
                  {history.length > 0 && (
                    <button onClick={clearHistory} className="text-xs text-danger hover:text-danger/80">清空历史</button>
                  )}
                </div>
                {history.length > 0 ? (
                  <div className="space-y-2">
                    {history.map((h) => (
                      <div key={h.id} className="p-3 bg-surface-light/30 rounded-md flex items-center justify-between">
                        <div>
                          <div className="text-sm text-white font-medium flex items-center gap-2 flex-wrap">
                            {h.items.map((it, i) => (
                              <span key={it.id} className="inline-flex items-center gap-1">
                                {i > 0 && <span className="text-slate-600">vs</span>}
                                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">{it.name}</span>
                              </span>
                            ))}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">{h.time}</div>
                        </div>
                        <button
                          onClick={() => loadHistory(h.items.map(i => i.id))}
                          className="px-3 py-1 rounded text-xs bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                        >
                          加载对比
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    <History className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    暂无对比历史记录，点击"保存对比结果"可保存当前对比
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {compareItems.map((item) => (
                <div key={item.id} className="card p-6">
                  <h3 className="font-serif font-semibold text-white mb-4">{item.name} 优劣势分析</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-primary mb-2 flex items-center gap-1"><TrendingUp className="w-4 h-4" />核心优势</h4>
                      <ul className="space-y-2">
                        {item.advantages.map((adv, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />{adv}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-warning mb-2 flex items-center gap-1"><TrendingDown className="w-4 h-4" />待改进点</h4>
                      <ul className="space-y-2">
                        {item.disadvantages.map((dis, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300"><AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />{dis}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-700/50">
                    <h4 className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1"><Database className="w-3.5 h-3.5" />评价数据溯源</h4>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">电商评论 {item.score > 88 ? '12,450' : '8,200'}条</span>
                      <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">政府抽检 {item.score > 88 ? '38' : '22'}批次</span>
                      <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">投诉数据 {item.score > 88 ? '156' : '203'}条</span>
                      <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">专业采样 {item.score > 88 ? '12' : '8'}份</span>
                      <span className="px-2 py-1 rounded bg-slate-700/50 text-slate-400">采集于 2026-06-10</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card p-12 text-center">
            <GitCompare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">请至少添加2个对象进行对比（可从首页或榜单页一键加入）</p>
            <Link to="/" className="btn btn-primary mt-4 inline-flex">去首页选择 <GitCompare className="w-4 h-4 ml-2" /></Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default ComparePage;
