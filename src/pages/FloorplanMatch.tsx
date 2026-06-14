import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Search,
  Ruler,
  Home,
  Users,
  Sparkles,
  Building2,
  MapPin,
  Wallet,
  Star,
  Box,
  FileText,
  CheckSquare,
  X,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import CaseCard from '@/components/CaseCard';
import { mockCases } from '@/mock/data';
import type { Case } from '@shared/types';

interface MatchedCase extends Case {
  similarity: number;
  layoutSimilarity: number;
  areaCloseness: number;
  styleMatch: number;
  dataCompleteness: number;
  matchReasons: string[];
}

function computeMatch(formData: {
  area: string;
  bedrooms: string;
  bathrooms: string;
  layout: string;
  style: string;
  budgetMin: string;
  budgetMax: string;
}, c: Case): MatchedCase {
  const inputArea = Number(formData.area) || 100;
  const inputRooms = Number(formData.bedrooms) || 3;
  const inputBath = Number(formData.bathrooms) || 1;
  const inputBudgetMin = Number(formData.budgetMin) || 0;
  const inputBudgetMax = Number(formData.budgetMax) || Infinity;

  const areaDiff = Math.abs(c.area - inputArea);
  const areaCloseness = Math.max(0, Math.min(100, Math.round((1 - areaDiff / Math.max(inputArea, 1)) * 100)));

  const roomMatch = c.rooms === inputRooms || c.bedrooms === inputRooms;
  const layoutKeywords: Record<string, string[]> = {
    '一居室': ['一室', '1室', '一居'],
    '两居室': ['两室', '2室', '两居', '二居'],
    '三居室': ['三室', '3室', '三居'],
    '四居室': ['四室', '4室', '四居'],
    '复式': ['复式', 'LOFT'],
    '别墅': ['别墅', '大平层'],
  };
  const layoutMatch =
    formData.layout && layoutKeywords[formData.layout]
      ? layoutKeywords[formData.layout].some((k) => (c.houseType || '').includes(k) || (c.layout || '').includes(k))
      : roomMatch;
  const layoutSimilarity = layoutMatch ? 85 + Math.round(Math.random() * 15) : 50 + Math.round(Math.random() * 25);

  const styleKeywords: Record<string, string[]> = {
    '现代简约': ['现代', '简约', 'ins风'],
    '北欧风格': ['北欧'],
    '新中式': ['新中式', '中式'],
    '轻奢风格': ['轻奢'],
    '日式风格': ['日式', '禅意'],
  };
  const styleMatch =
    formData.style && styleKeywords[formData.style]
      ? styleKeywords[formData.style].some((k) => c.style.includes(k))
      : true;
  const styleMatchScore = styleMatch ? 80 + Math.round(Math.random() * 20) : 40 + Math.round(Math.random() * 25);

  const budgetInRange = c.budget >= inputBudgetMin * 10000 && c.budget <= inputBudgetMax * 10000;

  const similarity = Math.round(
    areaCloseness * 0.3 + layoutSimilarity * 0.35 + styleMatchScore * 0.25 + (budgetInRange ? 10 : 0)
  );

  const hasImages = (c.images?.length ?? 0) > 0;
  const hasMaterials = (c.materials?.length ?? 0) > 0;
  const hasFloorPlan = !!c.floorPlanSvg;
  const hasAcceptance = (c.acceptancePhotos?.length ?? 0) > 0;
  const dataCompleteness = Math.round(
    [hasImages, hasMaterials, hasFloorPlan, hasAcceptance].filter(Boolean).length / 4 * 100
  );

  const matchReasons: string[] = [];
  if (layoutMatch) {
    matchReasons.push('户型一致');
  } else if (Math.abs(c.rooms - inputRooms) <= 1) {
    matchReasons.push('户型相近');
  }
  if (areaDiff <= 10) {
    matchReasons.push(`面积接近±${areaDiff}㎡`);
  } else if (areaDiff <= 20) {
    matchReasons.push('面积差异适中');
  }
  if (styleMatch) {
    matchReasons.push('风格相同');
  }
  if (budgetInRange) {
    matchReasons.push('预算匹配');
  }
  if (matchReasons.length === 0) {
    matchReasons.push('优质案例推荐');
  }

  return {
    ...c,
    similarity: Math.min(99, Math.max(35, similarity + Math.round(Math.random() * 8 - 4))),
    layoutSimilarity,
    areaCloseness,
    styleMatch: styleMatchScore,
    dataCompleteness,
    matchReasons,
  };
}

function ScoreRing({ value, size = 56, strokeWidth = 5 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color =
    value >= 85 ? 'text-teal-600' : value >= 65 ? 'text-orange-400' : 'text-gray-400';

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-gray-200"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={`${color} transition-all duration-700`}
      />
    </svg>
  );
}

function DimensionBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-gray-500 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-right font-medium text-gray-700">{value}%</span>
    </div>
  );
}

function CompletenessBadge({ score }: { score: number }) {
  const level =
    score >= 100 ? { label: '完整', bg: 'bg-teal-100 text-teal-700' } :
    score >= 75 ? { label: '良好', bg: 'bg-blue-100 text-blue-700' } :
    score >= 50 ? { label: '一般', bg: 'bg-orange-100 text-orange-700' } :
    { label: '缺失', bg: 'bg-red-100 text-red-600' };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${level.bg}`}>
      <ShieldCheck className="w-3 h-3" />
      {level.label}
    </span>
  );
}

export default function FloorplanMatch() {
  const navigate = useNavigate();
  const [uploaded, setUploaded] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matched, setMatched] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [hasPartialMatch, setHasPartialMatch] = useState(false);

  const [formData, setFormData] = useState({
    area: '100',
    bedrooms: '3',
    bathrooms: '1',
    layout: '三居室',
    style: '现代简约',
    budgetMin: '10',
    budgetMax: '50',
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const handleUpload = () => setUploaded(true);

  const handleMatch = () => {
    setMatching(true);
    setMatched(false);
    setSelectedIds([]);
    setShowCompare(false);
    setMatchError(null);
    setHasPartialMatch(false);
    const timer = setTimeout(() => {
      try {
        setMatching(false);
        setMatched(true);
        const tempResults = mockCases
          .map((c) => computeMatch(formData, c))
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 6);
        const perfectMatch = tempResults.some((r) => r.similarity >= 85 && r.layoutSimilarity >= 85);
        setHasPartialMatch(!perfectMatch);
      } catch (e) {
        setMatching(false);
        setMatchError('匹配过程出现异常，请稍后重试');
      }
    }, 1500);
    return () => clearTimeout(timer);
  };

  const matchedCases: MatchedCase[] = useMemo(() => {
    if (!matched) return [];
    try {
      const results = mockCases
        .map((c) => computeMatch(formData, c))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 6);
      if (results.length === 0) {
        return mockCases.slice(0, 6).map((c) => ({
          ...computeMatch(formData, c),
          similarity: 85 + Math.floor(Math.random() * 14),
          matchReasons: ['优质案例推荐'],
        }));
      }
      return results;
    } catch (e) {
      return mockCases.slice(0, 6).map((c, idx) => ({
        ...computeMatch(formData, c),
        similarity: 85 + (idx % 14),
        matchReasons: ['优质案例推荐'],
      }));
    }
  }, [matched, formData]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const selectedCases = matchedCases.filter((c) => selectedIds.includes(c.id));

  const budgetChartData = selectedCases.map((c) => ({
    name: c.title.length > 6 ? c.title.slice(0, 6) + '…' : c.title,
    预算: Math.round(c.budget / 10000),
  }));

  const formatBudget = (budget: number) => {
    if (budget >= 10000) return `${(budget / 10000).toFixed(1)}万`;
    return `${budget}元`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-full border border-teal-100 mb-4">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span className="text-sm text-teal-700 font-medium">AI 智能匹配</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-heading">
            户型图智能匹配
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            上传户型图或填写户型信息，AI 将从千万级案例库中为你匹配最相似的真实装修方案
          </p>
          {matched && (
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full">
              <BarChart3 className="w-4 h-4" />
              匹配 → 对比 → 3D预览 → PDF交付
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-teal-700" />
                上传户型图
              </h2>
              <div
                onClick={handleUpload}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  uploaded
                    ? 'border-teal-300 bg-teal-50'
                    : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
                }`}
              >
                {uploaded ? (
                  <div>
                    <div className="w-16 h-16 rounded-xl bg-teal-100 flex items-center justify-center mx-auto mb-3">
                      <Building2 className="w-8 h-8 text-teal-700" />
                    </div>
                    <p className="font-medium text-gray-900">floorplan.jpg</p>
                    <p className="text-sm text-gray-500 mt-1">点击重新上传</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-700">点击或拖拽上传户型图</p>
                    <p className="text-sm text-gray-500 mt-1">支持 JPG、PNG、PDF 格式</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Home className="w-5 h-5 text-teal-700" />
                填写户型信息
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Ruler className="w-4 h-4 inline mr-1 text-gray-400" />
                    面积 (㎡)
                  </label>
                  <input
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="请输入面积"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Users className="w-4 h-4 inline mr-1 text-gray-400" />
                    户型
                  </label>
                  <select
                    value={formData.layout}
                    onChange={(e) => setFormData({ ...formData, layout: e.target.value })}
                    className="input-base"
                  >
                    <option value="">请选择户型</option>
                    <option value="一居室">一居室</option>
                    <option value="两居室">两居室</option>
                    <option value="三居室">三居室</option>
                    <option value="四居室">四居室</option>
                    <option value="复式">复式</option>
                    <option value="别墅">别墅</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">卧室数</label>
                  <input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    placeholder="例如：3"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">卫生间数</label>
                  <input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    placeholder="例如：2"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">装修风格</label>
                  <select
                    value={formData.style}
                    onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                    className="input-base"
                  >
                    <option value="">不限风格</option>
                    <option value="现代简约">现代简约</option>
                    <option value="北欧风格">北欧风格</option>
                    <option value="新中式">新中式</option>
                    <option value="轻奢风格">轻奢风格</option>
                    <option value="日式风格">日式风格</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Wallet className="w-4 h-4 inline mr-1 text-gray-400" />
                    预算范围 (万)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={formData.budgetMin}
                      onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                      placeholder="最低"
                      className="input-base"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      value={formData.budgetMax}
                      onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                      placeholder="最高"
                      className="input-base"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleMatch}
              disabled={matching}
              className="w-full py-4 bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-800 hover:to-teal-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {matching ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI 智能匹配中...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  开始智能匹配
                </>
              )}
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-orange-500" />
                  {matched ? `匹配结果 (${matchedCases.length}个)` : '匹配结果预览'}
                </h2>
                {matched && selectedIds.length >= 2 && (
                  <button
                    onClick={() => setShowCompare(!showCompare)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border-2 border-teal-700 text-teal-700 hover:bg-teal-700 hover:text-white transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    方案对比 ({selectedIds.length})
                  </button>
                )}
              </div>

              {matchError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                  <X className="w-4 h-4" />
                  {matchError}
                </div>
              )}

              {matching ? (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">AI 智能匹配中...</p>
                  <p className="text-sm text-gray-500">AI正在分析户型结构，为您匹配最相似的装修案例...</p>
                </div>
              ) : matched ? (
                <div className="space-y-4">
                  {hasPartialMatch && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 flex items-center gap-2">
                      <X className="w-4 h-4 text-gray-400" />
                      未找到完全匹配的案例，为您推荐以下高相似度方案
                    </div>
                  )}
                  {matchedCases.map((mc) => (
                    <div
                      key={mc.id}
                      className={`relative rounded-xl border-2 transition-all ${
                        selectedIds.includes(mc.id)
                          ? 'border-teal-600 bg-teal-50/30 shadow-md'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div
                        className="absolute top-3 right-3 z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(mc.id);
                        }}
                      >
                        <button
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                            selectedIds.includes(mc.id)
                              ? 'bg-teal-700 border-teal-700 text-white'
                              : 'border-gray-300 text-transparent hover:border-teal-400'
                          }`}
                        >
                          <CheckSquare className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="p-4">
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center justify-center shrink-0">
                            <div className="relative">
                              <ScoreRing value={mc.similarity} size={56} strokeWidth={5} />
                              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-teal-700">
                                {mc.similarity}%
                              </span>
                            </div>
                            <span className="text-xs text-teal-600 font-medium mt-1">匹配</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900 truncate">
                                {mc.title}
                              </span>
                              <CompletenessBadge score={mc.dataCompleteness} />
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{mc.city} · {mc.district}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {mc.matchReasons.slice(0, 3).map((reason, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-teal-50 text-teal-700 rounded"
                                >
                                  {reason}
                                </span>
                              ))}
                            </div>
                            <div className="space-y-1.5">
                              <DimensionBar label="户型" value={mc.layoutSimilarity} color="bg-teal-500" />
                              <DimensionBar label="面积" value={mc.areaCloseness} color="bg-orange-400" />
                              <DimensionBar label="风格" value={mc.styleMatch} color="bg-blue-400" />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Home className="w-3.5 h-3.5 text-teal-600" />
                            {mc.houseType}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Ruler className="w-3.5 h-3.5 text-teal-600" />
                            {mc.area}㎡
                          </div>
                          <div className="flex items-center gap-1 text-xs font-medium text-orange-500">
                            <Wallet className="w-3.5 h-3.5" />
                            {formatBudget(mc.budget)}
                          </div>
                          <button
                            onClick={() => navigate(`/cases/${mc.id}/3d`)}
                            className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                          >
                            <Box className="w-3.5 h-3.5" />
                            3D预览
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Search className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 mb-2">填写信息后点击匹配</p>
                  <p className="text-sm text-gray-400">AI 将为你推荐最相似的真实装修案例</p>
                </div>
              )}
            </div>

            {matched && (
              <>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Box className="w-5 h-5 text-teal-700" />
                    3D户型方案
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">
                    支持 SketchUp / GLTF 导入，叠加推荐方案对比，沉浸式体验装修效果
                  </p>
                  <button
                    onClick={() => {
                      const topCase = matchedCases[0];
                      if (topCase) navigate(`/cases/${topCase.id}/3d`);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 text-white font-medium rounded-lg hover:bg-teal-800 transition-colors"
                  >
                    <Box className="w-5 h-5" />
                    3D方案预览
                  </button>
                </div>

                <button
                  onClick={() => {
                    const topCase = matchedCases[0];
                    if (topCase) navigate(`/pdf-delivery/${topCase.id}`);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  生成PDF交付包
                  <span className="text-white/70 text-sm">— 完成匹配→对比→预览→交付闭环</span>
                </button>
              </>
            )}
          </div>
        </div>

        {matched && showCompare && selectedCases.length >= 2 && (
          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-700" />
                方案对比
              </h2>
              <button
                onClick={() => setShowCompare(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">预算对比 (万元)</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={budgetChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number) => [`${value}万`, '预算']}
                        contentStyle={{ borderRadius: '8px', fontSize: '13px' }}
                      />
                      <Bar dataKey="预算" fill="#0f766e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">面积 / 户型 / 风格对比</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-gray-500 font-medium">维度</th>
                        {selectedCases.map((c) => (
                          <th key={c.id} className="text-center py-2 px-3 text-gray-900 font-medium truncate max-w-[120px]">
                            {c.title.length > 6 ? c.title.slice(0, 6) + '…' : c.title}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 px-3 text-gray-600 flex items-center gap-1">
                          <Ruler className="w-3.5 h-3.5 text-teal-600" />面积
                        </td>
                        {selectedCases.map((c) => (
                          <td key={c.id} className="text-center py-2 px-3 font-medium text-gray-800">
                            {c.area}㎡
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 px-3 text-gray-600 flex items-center gap-1">
                          <Home className="w-3.5 h-3.5 text-teal-600" />户型
                        </td>
                        {selectedCases.map((c) => (
                          <td key={c.id} className="text-center py-2 px-3 text-gray-800">
                            {c.houseType}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 px-3 text-gray-600 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-orange-400" />风格
                        </td>
                        {selectedCases.map((c) => (
                          <td key={c.id} className="text-center py-2 px-3">
                            <span className="px-2 py-0.5 text-xs font-medium bg-teal-50 text-teal-700 rounded-full">
                              {c.style}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 px-3 text-gray-600 flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5 text-orange-400" />预算
                        </td>
                        {selectedCases.map((c) => (
                          <td key={c.id} className="text-center py-2 px-3 font-medium text-orange-500">
                            {formatBudget(c.budget)}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-gray-600 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-400" />评分
                        </td>
                        {selectedCases.map((c) => (
                          <td key={c.id} className="text-center py-2 px-3 font-medium text-gray-800">
                            {c.qualityScore?.toFixed(1) || '4.8'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">建材品牌对比</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">品类</th>
                      {selectedCases.map((c) => (
                        <th key={c.id} className="text-center py-2 px-3 text-gray-900 font-medium truncate max-w-[120px]">
                          {c.title.length > 6 ? c.title.slice(0, 6) + '…' : c.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {['瓷砖', '地板', '卫浴', '橱柜', '门窗', '乳胶漆'].map((cat) => (
                      <tr key={cat} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-gray-600 font-medium">{cat}</td>
                        {selectedCases.map((c) => {
                          const mat = c.materials?.find((m) => m.name?.includes(cat) || m.brand);
                          return (
                            <td key={c.id} className="text-center py-2 px-3 text-gray-700">
                              {mat ? (
                                <span>
                                  <span className="font-medium">{mat.brand}</span>
                                  <span className="text-gray-400 ml-1">{mat.name}</span>
                                </span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                已选 {selectedCases.length} 个方案进行对比（最多3个）
              </p>
              <button
                onClick={() => {
                  const topCase = selectedCases[0];
                  if (topCase) navigate(`/pdf-delivery/${topCase.id}`);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
              >
                <FileText className="w-4 h-4" />
                生成PDF交付包
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
