import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Plus, X, TrendingUp, TrendingDown, CheckCircle2, AlertCircle,
  GitCompare, Database, Download, History, Trash2, ArrowRight, Info
} from 'lucide-react';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { TrendBadge } from '@/components/ui/TrendBadge';
import { RadarChart } from '@/components/charts/RadarChart';
import { BarChart } from '@/components/charts/BarChart';
import { DataSourceTag } from '@/components/ui/DataSourceTag';
import { useCompareStore } from '@/store/compareStore';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface CompareItem {
  id: number;
  name: string;
  category: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  dimensions: { name: string; score: number; weight: number }[];
  advantages: string[];
  disadvantages: string[];
  sources: { type: string; count: number }[];
}

const allCandidates = [
  { id: 1, name: '蒙牛乳业', category: '消费品牌' },
  { id: 2, name: '农夫山泉', category: '消费品牌' },
  { id: 3, name: '伊利集团', category: '消费品牌' },
  { id: 4, name: '海天味业', category: '消费品牌' },
  { id: 5, name: '海尔智家', category: '消费品牌' },
  { id: 6, name: '格力电器', category: '消费品牌' },
  { id: 101, name: '新东方教育', category: '教育服务' },
  { id: 102, name: '学而思', category: '教育服务' },
  { id: 103, name: '好未来', category: '教育服务' },
  { id: 201, name: '北京协和医院', category: '医疗健康' },
  { id: 202, name: '上海瑞金医院', category: '医疗健康' },
  { id: 301, name: '携程旅行', category: '旅游出行' },
  { id: 302, name: '同程旅行', category: '旅游出行' },
];

const mockCompareData: Record<number, CompareItem> = {
  1: { id: 1, name: '蒙牛乳业', category: '消费品牌', score: 92, trend: 'up', trendValue: 3, dimensions: [{ name: '产品质量', score: 94, weight: 0.30 }, { name: '服务体验', score: 88, weight: 0.25 }, { name: '品牌信誉', score: 92, weight: 0.25 }, { name: '价格公道', score: 86, weight: 0.20 }], advantages: ['产品品质稳定', '品牌知名度高', '售后服务完善'], disadvantages: ['高端线性价比一般', '部分地区配送慢'], sources: [{ type: 'ecommerce', count: 12450 }, { type: 'government', count: 38 }, { type: 'complaint', count: 156 }, { type: 'sampling', count: 12 }] },
  2: { id: 2, name: '农夫山泉', category: '消费品牌', score: 89, trend: 'stable', trendValue: 0, dimensions: [{ name: '产品质量', score: 91, weight: 0.30 }, { name: '服务体验', score: 85, weight: 0.25 }, { name: '品牌信誉', score: 90, weight: 0.25 }, { name: '价格公道', score: 88, weight: 0.20 }], advantages: ['产品口碑好', '价格亲民', '市场覆盖广'], disadvantages: ['产品线相对单一', '创新产品较少'], sources: [{ type: 'ecommerce', count: 10820 }, { type: 'government', count: 32 }, { type: 'complaint', count: 128 }, { type: 'sampling', count: 10 }] },
  3: { id: 3, name: '伊利集团', category: '消费品牌', score: 87, trend: 'up', trendValue: 1, dimensions: [{ name: '产品质量', score: 88, weight: 0.30 }, { name: '服务体验', score: 86, weight: 0.25 }, { name: '品牌信誉', score: 89, weight: 0.25 }, { name: '价格公道', score: 84, weight: 0.20 }], advantages: ['渠道覆盖广', '营销能力强', '产品线丰富'], disadvantages: ['高端产品评价一般', '投诉处理稍慢'], sources: [{ type: 'ecommerce', count: 9680 }, { type: 'government', count: 28 }, { type: 'complaint', count: 203 }, { type: 'sampling', count: 9 }] },
  4: { id: 4, name: '海天味业', category: '消费品牌', score: 85, trend: 'down', trendValue: 2, dimensions: [{ name: '产品质量', score: 86, weight: 0.30 }, { name: '服务体验', score: 82, weight: 0.25 }, { name: '品牌信誉', score: 87, weight: 0.25 }, { name: '价格公道', score: 85, weight: 0.20 }], advantages: ['品类覆盖广', '市场占有率高', '价格亲民'], disadvantages: ['产品创新不足', '高端市场评价一般'], sources: [{ type: 'ecommerce', count: 8200 }, { type: 'government', count: 22 }, { type: 'complaint', count: 189 }, { type: 'sampling', count: 8 }] },
  5: { id: 5, name: '海尔智家', category: '消费品牌', score: 83, trend: 'up', trendValue: 5, dimensions: [{ name: '产品质量', score: 85, weight: 0.30 }, { name: '服务体验', score: 88, weight: 0.25 }, { name: '品牌信誉', score: 82, weight: 0.25 }, { name: '价格公道', score: 80, weight: 0.20 }], advantages: ['售后服务好', '智能家居生态完善', '品质可靠'], disadvantages: ['价格偏高', '部分产品智能化程度一般'], sources: [{ type: 'ecommerce', count: 7580 }, { type: 'government', count: 18 }, { type: 'complaint', count: 132 }, { type: 'sampling', count: 7 }] },
  6: { id: 6, name: '格力电器', category: '消费品牌', score: 81, trend: 'down', trendValue: 3, dimensions: [{ name: '产品质量', score: 84, weight: 0.30 }, { name: '服务体验', score: 79, weight: 0.25 }, { name: '品牌信誉', score: 83, weight: 0.25 }, { name: '价格公道', score: 78, weight: 0.20 }], advantages: ['核心技术强', '空调品类口碑好'], disadvantages: ['售后服务响应慢', '产品线相对单一'], sources: [{ type: 'ecommerce', count: 6920 }, { type: 'government', count: 15 }, { type: 'complaint', count: 245 }, { type: 'sampling', count: 6 }] },
  101: { id: 101, name: '新东方教育', category: '教育服务', score: 91, trend: 'up', trendValue: 2, dimensions: [{ name: '教学质量', score: 93, weight: 0.30 }, { name: '师资力量', score: 92, weight: 0.30 }, { name: '服务水平', score: 88, weight: 0.20 }, { name: '性价比', score: 85, weight: 0.20 }], advantages: ['师资力量雄厚', '教学体系完善', '品牌知名度高'], disadvantages: ['价格偏高', '部分校区班型选择少'], sources: [{ type: 'review', count: 8420 }, { type: 'complaint', count: 98 }, { type: 'sampling', count: 15 }] },
  102: { id: 102, name: '学而思', category: '教育服务', score: 88, trend: 'stable', trendValue: 0, dimensions: [{ name: '教学质量', score: 90, weight: 0.30 }, { name: '师资力量', score: 89, weight: 0.30 }, { name: '服务水平', score: 85, weight: 0.20 }, { name: '性价比', score: 86, weight: 0.20 }], advantages: ['教研体系强', '在线教育资源丰富', '家长口碑好'], disadvantages: ['退费流程繁琐', '线下网点较少'], sources: [{ type: 'review', count: 7650 }, { type: 'complaint', count: 85 }, { type: 'sampling', count: 12 }] },
  103: { id: 103, name: '好未来', category: '教育服务', score: 86, trend: 'up', trendValue: 4, dimensions: [{ name: '教学质量', score: 87, weight: 0.30 }, { name: '师资力量', score: 88, weight: 0.30 }, { name: '服务水平', score: 84, weight: 0.20 }, { name: '性价比', score: 85, weight: 0.20 }], advantages: ['在线教育成熟', '科技驱动教学', '课程体系完善'], disadvantages: ['互动性不如线下', '高端课程价格高'], sources: [{ type: 'review', count: 6890 }, { type: 'complaint', count: 76 }, { type: 'sampling', count: 10 }] },
  201: { id: 201, name: '北京协和医院', category: '医疗健康', score: 94, trend: 'stable', trendValue: 0, dimensions: [{ name: '资质安全', score: 96, weight: 0.65 }, { name: '服务效果', score: 92, weight: 0.30 }, { name: '价格透明', score: 84, weight: 0.05 }], advantages: ['三甲资质齐全', '医疗水平权威', '专家资源丰富'], disadvantages: ['挂号难度大', '价格偏高'], sources: [{ type: 'government', count: 128 }, { type: 'review', count: 5420 }, { type: 'complaint', count: 45 }, { type: 'sampling', count: 22 }] },
  202: { id: 202, name: '上海瑞金医院', category: '医疗健康', score: 91, trend: 'up', trendValue: 1, dimensions: [{ name: '资质安全', score: 94, weight: 0.65 }, { name: '服务效果', score: 89, weight: 0.30 }, { name: '价格透明', score: 86, weight: 0.05 }], advantages: ['三甲资质', '专科特色突出', '服务态度好'], disadvantages: ['候诊时间长'], sources: [{ type: 'government', count: 112 }, { type: 'review', count: 4850 }, { type: 'complaint', count: 38 }, { type: 'sampling', count: 18 }] },
  301: { id: 301, name: '携程旅行', category: '旅游出行', score: 90, trend: 'up', trendValue: 2, dimensions: [{ name: '产品丰富度', score: 92, weight: 0.25 }, { name: '服务质量', score: 88, weight: 0.30 }, { name: '价格优势', score: 86, weight: 0.20 }, { name: '售后保障', score: 85, weight: 0.25 }], advantages: ['产品丰富', '品牌知名', '售后完善'], disadvantages: ['部分产品价格偏高'], sources: [{ type: 'ecommerce', count: 11200 }, { type: 'review', count: 6780 }, { type: 'complaint', count: 286 }, { type: 'sampling', count: 14 }] },
  302: { id: 302, name: '同程旅行', category: '旅游出行', score: 87, trend: 'up', trendValue: 3, dimensions: [{ name: '产品丰富度', score: 88, weight: 0.25 }, { name: '服务质量', score: 87, weight: 0.30 }, { name: '价格优势', score: 88, weight: 0.20 }, { name: '售后保障', score: 84, weight: 0.25 }], advantages: ['价格亲民', '下沉市场覆盖好', '交通票务强'], disadvantages: ['高端产品较少'], sources: [{ type: 'ecommerce', count: 9860 }, { type: 'review', count: 5420 }, { type: 'complaint', count: 245 }, { type: 'sampling', count: 12 }] },
};

const colors = ['#10B981', '#6366F1', '#F59E0B', '#EF4444'];

export function ComparePage() {
  const { compareIds, addId, removeId, clear, history, saveHistory, clearHistory, setIds } = useCompareStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'matrix' | 'diff' | 'history'>('matrix');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 2000); };

  const compareItems = compareIds.map((id) => mockCompareData[id]).filter(Boolean) as CompareItem[];
  const quickAddList = allCandidates.filter(c => !compareIds.includes(c.id)).slice(0, 6);

  const filteredCandidates = allCandidates.filter(
    (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !compareIds.includes(c.id)
  );

  const addItem = (id: number) => {
    const result = addId(id);
    if (!result.success) { showToast(result.msg); return; }
    showToast(`已加入 ${mockCompareData[id].name}`);
  };

  const saveCompare = () => {
    if (compareItems.length < 2) { showToast('至少需要2个对比对象'); return; }
    saveHistory(compareItems.map(i => ({ id: i.id, name: i.name })));
    try {
      const blob = new Blob([JSON.stringify({
        savedAt: new Date().toLocaleString('zh-CN'),
        items: compareItems.map(i => ({
          name: i.name,
          category: i.category,
          score: i.score,
          dimensions: i.dimensions,
          advantages: i.advantages,
          disadvantages: i.disadvantages,
          sources: i.sources,
        })),
      }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `对比结果_${compareItems.map(i => i.name).join('_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
    showToast('对比结果已保存并下载');
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

  const radarSeries = compareItems.map((item, idx) => ({ key: item.name, color: colors[idx % colors.length], name: item.name }));
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

      {toastMsg && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 bg-primary text-white rounded-md shadow-lg animate-fade-in text-sm">{toastMsg}</div>}

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-white mb-2 flex items-center gap-2">
              <GitCompare className="w-6 h-6 text-primary" />竞品对比分析
            </h1>
            <p className="text-slate-400 text-sm">选择最多4个品牌或机构，进行多维度加权对比分析，可保存下载结果</p>
          </div>
          {compareItems.length >= 2 && (
            <div className="flex gap-2">
              <button onClick={clear} className="btn btn-outline text-sm"><Trash2 className="w-4 h-4 mr-1" />清空</button>
              <button onClick={saveCompare} className="btn btn-primary text-sm"><Download className="w-4 h-4 mr-1" />保存对比结果</button>
            </div>
          )}
        </div>

        <div className="card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {compareItems.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-2 rounded-md border-2" style={{ borderColor: `${colors[idx % colors.length]}50`, backgroundColor: `${colors[idx % colors.length]}10` }}>
                <ScoreRing score={item.score} size={32} strokeWidth={3} showLabel={false} />
                <div>
                  <div className="text-sm font-medium text-white">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.category}</div>
                </div>
                <span className="text-xs px-1.5 py-0.5 rounded ml-1" style={{ backgroundColor: `${colors[idx % colors.length]}25`, color: colors[idx % colors.length] }}>{item.score}分</span>
                {compareIds.length > 1 && <button onClick={() => removeId(item.id)} className="ml-1 p-1 rounded hover:bg-danger/20 text-slate-400 hover:text-danger"><X className="w-4 h-4" /></button>}
              </div>
            ))}

            {compareIds.length < 4 && (
              <div className="relative">
                <button onClick={() => setShowPicker(!showPicker)} className="flex items-center gap-2 px-4 py-2 border border-dashed border-primary/50 rounded-md text-primary hover:bg-primary/10 transition-colors">
                  <Plus className="w-4 h-4" />添加对比 ({compareIds.length}/4)
                </button>
                {showPicker && (
                  <div className="absolute top-full left-0 mt-2 w-80 card z-10 animate-fade-in">
                    <div className="p-2 border-b border-slate-700/50">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索..." autoFocus className="w-full pl-8 pr-3 py-2 bg-surface-light border border-border rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary" />
                      </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto py-1">
                      {filteredCandidates.length > 0 ? filteredCandidates.map((c) => (
                        <button key={c.id} onClick={() => addItem(c.id)} className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:bg-primary/10 hover:text-white flex items-center justify-between transition-colors">
                          <span className="font-medium">{c.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-surface-light text-slate-400">{c.category}</span>
                        </button>
                      )) : <div className="px-3 py-4 text-center text-sm text-slate-500">暂无匹配</div>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {compareItems.length < 2 && (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              {compareItems.length === 0 ? (
                <div>
                  <div className="flex items-center gap-2 text-sm text-warning mb-3"><Info className="w-4 h-4" />对比列表为空，可从下方快速添加或从 <Link to="/" className="text-primary hover:underline">首页</Link> / <Link to="/rankings" className="text-primary hover:underline">榜单页</Link> 一键加入</div>
                  <div className="text-xs text-slate-400 mb-2">快速添加（最多选4个）：</div>
                  <div className="flex flex-wrap gap-2">
                    {quickAddList.map(c => (
                      <button key={c.id} onClick={() => addItem(c.id)} className="px-3 py-1.5 rounded-md text-xs bg-surface-light text-slate-300 hover:bg-primary/10 hover:text-primary border border-slate-700 hover:border-primary/50 transition-colors inline-flex items-center gap-1">
                        <Plus className="w-3 h-3" />{c.name} <span className="text-slate-500">· {c.category}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 text-sm text-warning mb-3"><Info className="w-4 h-4" />当前已添加 {compareItems.length} 个对象，至少还需添加 <span className="font-bold text-warning">{2 - compareItems.length}</span> 个才可形成对比矩阵</div>
                  <div className="text-xs text-slate-400 mb-2">继续添加：</div>
                  <div className="flex flex-wrap gap-2">
                    {quickAddList.slice(0, 4).map(c => (
                      <button key={c.id} onClick={() => addItem(c.id)} className="px-3 py-1.5 rounded-md text-xs bg-surface-light text-slate-300 hover:bg-primary/10 hover:text-primary border border-slate-700 hover:border-primary/50 transition-colors inline-flex items-center gap-1">
                        <Plus className="w-3 h-3" />{c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {compareItems.length >= 2 ? (
          <div className="space-y-6 animate-fade-in" key={compareIds.join('-')}>
            <div className="card p-6">
              <h3 className="font-serif font-semibold text-white mb-6">综合加权评分对比</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {compareItems.map((item, idx) => (
                  <div key={item.id} className="text-center">
                    <ScoreRing score={item.score} size={100} strokeWidth={8} color={colors[idx % colors.length]} />
                    <h4 className="mt-3 font-medium text-white">{item.name}</h4>
                    <div className="mt-1"><TrendBadge trend={item.trend} value={item.trendValue} /></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-serif font-semibold text-white mb-4">维度雷达图（按维度名称对齐）</h3>
                <RadarChart data={radarData} series={radarSeries} height={320} />
              </div>
              <div className="card p-6">
                <h3 className="font-serif font-semibold text-white mb-4">综合评分柱状对比</h3>
                <BarChart data={barData} series={[{ key: '综合评分', color: '#10B981' }]} height={320} />
              </div>
            </div>

            <div className="border-b border-slate-700/50 mb-2">
              <div className="flex gap-6">
                <button onClick={() => setActiveTab('matrix')} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'matrix' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>维度评分矩阵</button>
                <button onClick={() => setActiveTab('diff')} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'diff' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>差异字段分析 Top 3</button>
                <button onClick={() => setActiveTab('history')} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-200'}`}><History className="w-4 h-4 inline mr-1" />对比历史 ({history.length})</button>
              </div>
            </div>

            {activeTab === 'matrix' && (
              <div className="card overflow-hidden animate-fade-in">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface-light/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">评价维度 (权重)</th>
                        {compareItems.map((item, idx) => (
                          <th key={item.id} className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: colors[idx % colors.length] }}>{item.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {allDimensionNames.map((dimName) => {
                        const weight = compareItems[0]?.dimensions.find(d => d.name === dimName)?.weight || 0;
                        return (
                          <tr key={dimName} className="hover:bg-surface-light/20">
                            <td className="px-4 py-3 text-sm">
                              <span className="text-slate-300">{dimName}</span>
                              <span className="text-xs text-slate-500 ml-2">({(weight * 100).toFixed(0)}%)</span>
                            </td>
                            {compareItems.map((item, idx) => {
                              const dim = item.dimensions.find((d) => d.name === dimName);
                              const score = dim?.score || 0;
                              const allScores = compareItems.map((c) => c.dimensions.find((d) => d.name === dimName)?.score || 0);
                              const maxScore = Math.max(...allScores);
                              const isBest = score === maxScore && score > 0;
                              return (
                                <td key={item.id} className="px-4 py-3 text-center">
                                  <span className={`text-sm font-medium ${isBest ? '' : 'text-white'}`} style={isBest ? { color: colors[idx % colors.length] } : {}}>
                                    {score > 0 ? score : '-'}
                                    {isBest && <span className="ml-1 text-xs">★</span>}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      <tr className="bg-surface-light/30">
                        <td className="px-4 py-3 text-sm font-medium text-white">综合加权评分</td>
                        {compareItems.map((item, idx) => {
                          const maxScore = Math.max(...compareItems.map((c) => c.score));
                          const isBest = item.score === maxScore;
                          return (
                            <td key={item.id} className="px-4 py-3 text-center">
                              <span className={`text-base font-bold ${isBest ? '' : 'text-white'}`} style={isBest ? { color: colors[idx % colors.length] } : {}}>
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
                  <p className="text-sm text-slate-400 mb-4">以下为 {compareItems.length} 个对比对象之间评分差异最大的 Top 3 维度</p>
                  <div className="space-y-3">
                    {diffDims.map((d, i) => d && (
                      <div key={i} className="p-4 bg-surface-light/30 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white font-semibold">第{i + 1}差异：{d.dimName}</span>
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
                  <p className="text-sm text-slate-400">最近保存的对比记录（最多5条，自动持久化）</p>
                  {history.length > 0 && <button onClick={clearHistory} className="text-xs text-danger hover:text-danger/80">清空历史</button>}
                </div>
                {history.length > 0 ? (
                  <div className="space-y-2">
                    {history.map((h) => (
                      <div key={h.id} className="p-3 bg-surface-light/30 rounded-md flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <div className="text-sm text-white font-medium flex items-center gap-2 flex-wrap">
                            {h.items.map((it, i) => (
                              <span key={it.id} className="inline-flex items-center gap-1">{i > 0 && <span className="text-slate-600">vs</span>}<span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">{it.name}</span></span>
                            ))}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">{h.time}</div>
                        </div>
                        <button onClick={() => setIds(h.items.map(i => i.id))} className="px-3 py-1 rounded text-xs bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">加载此对比</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    <History className="w-10 h-10 mx-auto mb-2 opacity-40" />暂无历史记录，点击「保存对比结果」可保存当前对比
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {compareItems.map((item, idx) => (
                <div key={item.id} className="card p-6" style={{ borderTop: `3px solid ${colors[idx % colors.length]}` }}>
                  <h3 className="font-serif font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                    {item.name} 优劣势分析
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-primary mb-2 flex items-center gap-1"><TrendingUp className="w-4 h-4" />核心优势</h4>
                      <ul className="space-y-2">{item.advantages.map((adv, i) => (<li key={i} className="flex items-start gap-2 text-sm text-slate-300"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />{adv}</li>))}</ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-warning mb-2 flex items-center gap-1"><TrendingDown className="w-4 h-4" />待改进点</h4>
                      <ul className="space-y-2">{item.disadvantages.map((dis, i) => (<li key={i} className="flex items-start gap-2 text-sm text-slate-300"><AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />{dis}</li>))}</ul>
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-700/50">
                    <h4 className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1"><Database className="w-3.5 h-3.5" />评价数据溯源（{item.sources.reduce((s, d) => s + d.count, 0).toLocaleString()}条）</h4>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {item.sources.map((s, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-surface-light text-slate-300 flex items-center gap-1">
                          <DataSourceTag type={s.type as any} /> {s.count.toLocaleString()}条
                        </span>
                      ))}
                      <span className="px-2 py-1 rounded bg-slate-700/50 text-slate-400">采集于 2026-06-12</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card p-12 text-center">
            <GitCompare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">请至少添加2个对比对象（可从首页或榜单页一键加入）</p>
            <div className="flex items-center gap-3 justify-center">
              <Link to="/rankings" className="btn btn-primary">去榜单选择 <ArrowRight className="w-4 h-4 ml-2" /></Link>
              <Link to="/" className="btn btn-outline">返回首页</Link>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default ComparePage;
