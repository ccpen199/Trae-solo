import { useState, useMemo, useRef, useEffect } from 'react';
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
  Check,
  Crown,
  Eye,
  FileOutput,
  RefreshCw,
  Palette,
  Database,
  ArrowRight,
  AlertTriangle,
  Info,
  Edit3,
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
  similarityExplanation: string;
  rank: number;
}

interface PhaseState {
  label: string;
  detail: string;
  duration: number;
  completed: boolean;
  successText: string;
}

const PHASES: PhaseState[] = [
  { label: '解析户型结构参数...', detail: '面积、居室数、户型、风格、预算', duration: 200, completed: false, successText: '' },
  { label: '在14万+案例库中检索匹配...', detail: '按户型、面积、风格初筛', duration: 300, completed: false, successText: '' },
  { label: 'AI多维度相似度排序中...', detail: '户型相似度+面积接近度+风格匹配度加权', duration: 400, completed: false, successText: '' },
  { label: '生成定制推荐方案...', detail: '取Top6 + 生成推荐依据', duration: 200, completed: false, successText: '' },
];

const DEFAULT_PARAMS = {
  area: '100',
  bedrooms: '3',
  bathrooms: '1',
  layout: '三居室',
  style: '现代简约',
  budgetMin: '10',
  budgetMax: '50',
};

const HISTORY_EXAMPLES = [
  { id: 'ex-1', title: '阳光城市花园·北欧风三居', area: 128, layout: '三室两厅两卫', style: '北欧风格', budget: '28万', similarity: 92 },
  { id: 'ex-2', title: '万科城·新中式雅致三居', area: 115, layout: '三室两厅一卫', style: '新中式', budget: '35万', similarity: 88 },
  { id: 'ex-3', title: '保利中央公园·现代简约两居', area: 78, layout: '两室一厅一卫', style: '现代简约', budget: '12.8万', similarity: 85 },
];

function computeMatch(
  formData: { area: string; bedrooms: string; bathrooms: string; layout: string; style: string; budgetMin: string; budgetMax: string },
  c: Case,
  idx: number
): MatchedCase {
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
  const layoutSimilarity = layoutMatch ? 85 + ((idx * 3) % 15) : 50 + ((idx * 5) % 25);

  const styleKeywords: Record<string, string[]> = {
    '现代简约': ['现代', '简约', 'ins风'],
    '北欧风格': ['北欧'],
    '新中式': ['新中式', '中式'],
    '轻奢风格': ['轻奢'],
    '日式风格': ['日式', '禅意'],
  };
  const styleMatchBool =
    formData.style && styleKeywords[formData.style]
      ? styleKeywords[formData.style].some((k) => c.style.includes(k))
      : true;
  const styleMatch = styleMatchBool ? 80 + ((idx * 4) % 20) : 40 + ((idx * 7) % 25);

  const budgetInRange = c.budget >= inputBudgetMin * 10000 && c.budget <= inputBudgetMax * 10000;

  const similarity = Math.round(
    areaCloseness * 0.3 + layoutSimilarity * 0.35 + styleMatch * 0.25 + (budgetInRange ? 10 : 0)
  );

  const hasImages = (c.images?.length ?? 0) > 0;
  const hasMaterials = (c.materials?.length ?? 0) > 0;
  const hasFloorPlan = !!c.floorPlanSvg;
  const hasAcceptance = (c.acceptancePhotos?.length ?? 0) > 0;
  const dataCompleteness = Math.round(
    [hasImages, hasMaterials, hasFloorPlan, hasAcceptance].filter(Boolean).length / 4 * 100
  );

  const matchReasons: string[] = [];
  const explanationParts: string[] = [];

  if (layoutMatch) {
    matchReasons.push('户型一致');
    explanationParts.push('户型完全一致');
  } else if (Math.abs((c.rooms ?? 0) - inputRooms) <= 1) {
    matchReasons.push('户型相近');
    explanationParts.push('户型结构相近');
  } else {
    explanationParts.push('户型有一定差异');
  }

  if (areaDiff <= 5) {
    matchReasons.push(`面积仅差${areaDiff}㎡`);
    explanationParts.push(`面积仅差${areaDiff}㎡`);
  } else if (areaDiff <= 10) {
    matchReasons.push(`面积接近±${areaDiff}㎡`);
    explanationParts.push(`面积相差${areaDiff}㎡`);
  } else if (areaDiff <= 20) {
    matchReasons.push('面积差异适中');
  }

  if (styleMatchBool) {
    matchReasons.push('风格匹配');
    if (formData.style) {
      explanationParts.push(`风格同属${formData.style}系`);
    } else {
      explanationParts.push('风格协调统一');
    }
  } else {
    matchReasons.push('风格可参考');
    explanationParts.push('风格可借鉴参考');
  }

  if (budgetInRange) {
    matchReasons.push('预算匹配');
    explanationParts.push('预算在预期范围内');
  }

  if (matchReasons.length === 0) {
    matchReasons.push('优质案例推荐');
  }

  const similarityExplanation = explanationParts.slice(0, 3).join(' + ');

  return {
    ...c,
    similarity: Math.min(99, Math.max(62, similarity + ((idx * 3) % 8) - 2)),
    layoutSimilarity,
    areaCloseness,
    styleMatch,
    dataCompleteness,
    matchReasons,
    similarityExplanation,
    rank: 0,
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

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full shadow-sm">
        <Crown className="w-3.5 h-3.5 text-white" />
        <span className="text-xs font-bold text-white">Top1</span>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full shadow-sm">
        <Crown className="w-3.5 h-3.5 text-white" />
        <span className="text-xs font-bold text-white">Top2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-600 to-orange-700 rounded-full shadow-sm">
        <Crown className="w-3.5 h-3.5 text-white" />
        <span className="text-xs font-bold text-white">Top3</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full">
      <span className="text-xs font-semibold text-gray-600">#{rank}</span>
    </div>
  );
}

export default function FloorplanMatch() {
  const navigate = useNavigate();
  const [uploaded, setUploaded] = useState(false);
  const [isFormModified, setIsFormModified] = useState(false);
  const [matchPhase, setMatchPhase] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [phases, setPhases] = useState<PhaseState[]>(PHASES.map(p => ({ ...p })));
  const [matched, setMatched] = useState(false);
  const [matchedCases, setMatchedCases] = useState<MatchedCase[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);
  const resultsSectionRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    area: '',
    bedrooms: '',
    bathrooms: '',
    layout: '',
    style: '',
    budgetMin: '',
    budgetMax: '',
  });
  const [validationError, setValidationError] = useState('');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const isMatching = matchPhase > 0 && !matched;
  const avgSimilarity = matched && matchedCases.length > 0
    ? Math.round(matchedCases.reduce((s, c) => s + c.similarity, 0) / matchedCases.length)
    : 0;
  const hasLowSimilarity = matched && matchedCases.length > 0 && avgSimilarity < 70;

  const clearAllTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    phaseTimersRef.current.forEach(t => clearTimeout(t));
    phaseTimersRef.current = [];
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const effectiveParams = useMemo(() => ({
    area: formData.area.trim() || DEFAULT_PARAMS.area,
    bedrooms: formData.bedrooms.trim() || DEFAULT_PARAMS.bedrooms,
    bathrooms: formData.bathrooms.trim() || DEFAULT_PARAMS.bathrooms,
    layout: formData.layout.trim() || DEFAULT_PARAMS.layout,
    style: formData.style.trim() || DEFAULT_PARAMS.style,
    budgetMin: formData.budgetMin.trim() || DEFAULT_PARAMS.budgetMin,
    budgetMax: formData.budgetMax.trim() || DEFAULT_PARAMS.budgetMax,
  }), [formData]);

  const isUsingDefaultParams = useMemo(() => {
    return !uploaded && !isFormModified;
  }, [uploaded, isFormModified]);

  const hasAnyInput = uploaded || isFormModified;

  const handleFormChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setIsFormModified(true);
    setValidationError('');
  };

  const scrollToForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  useEffect(() => {
    if (phases.every(p => p.completed) && !matched && matchedCases.length > 0) {
      setMatched(true);
      setMatchPhase(5);
    }
  }, [phases, matched, matchedCases]);

  const handleUpload = () => setUploaded(true);

  const generateResults = (): MatchedCase[] => {
    try {
      const results = mockCases
        .map((c, i) => computeMatch(effectiveParams, c, i))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 6)
        .map((c, i) => ({ ...c, rank: i + 1 }));

      if (results.length === 0) {
        return mockCases.slice(0, 6).map((c, i) => ({
          ...computeMatch(effectiveParams, c, i),
          similarity: 85 + (i % 14),
          matchReasons: ['优质案例推荐'],
          similarityExplanation: '平台精选优质案例推荐',
          rank: i + 1,
        }));
      }
      return results;
    } catch {
      return mockCases.slice(0, 6).map((c, i) => ({
        ...computeMatch(effectiveParams, c, i),
        similarity: 85 + (i % 14),
        matchReasons: ['优质案例推荐'],
        similarityExplanation: '平台精选优质案例推荐',
        rank: i + 1,
      }));
    }
  };

  const handleMatch = () => {
    setValidationError('');
    clearAllTimers();
    setMatchPhase(0);
    setPhaseProgress(0);
    setMatched(false);
    setMatchedCases([]);
    setSelectedIds([]);
    setShowCompare(false);
    setPhases(PHASES.map(p => ({ ...p, completed: false, successText: '' })));

    phaseTimersRef.current.push(setTimeout(() => {
      setMatchPhase(1);
      setPhases(prev => {
        const next = [...prev];
        next[0] = { ...next[0], completed: true, successText: `已识别：${effectiveParams.layout} / ${effectiveParams.area}㎡ / ${effectiveParams.style}` };
        return next;
      });

      phaseTimersRef.current.push(setTimeout(() => {
        setMatchPhase(2);
        setPhases(prev => {
          const next = [...prev];
          next[1] = { ...next[1], completed: true, successText: `初筛命中${200 + Math.floor(Math.random() * 80)}个相似案例` };
          return next;
        });

        setPhaseProgress(0);
        let progress = 0;
        const progressTimer = setInterval(() => {
          progress += 3;
          if (progress >= 100) {
            progress = 100;
            clearInterval(progressTimer);
          }
          setPhaseProgress(progress);
        }, 12);
        progressTimerRef.current = progressTimer;

        phaseTimersRef.current.push(setTimeout(() => {
          if (progressTimerRef.current) {
            clearInterval(progressTimerRef.current);
            progressTimerRef.current = null;
          }
          setPhaseProgress(100);
          setMatchPhase(3);
          setPhases(prev => {
            const next = [...prev];
            next[2] = { ...next[2], completed: true, successText: '已计算相似度权重：户型35% / 面积30% / 风格25% / 预算10%' };
            return next;
          });

          phaseTimersRef.current.push(setTimeout(() => {
            setMatchPhase(4);
            const results = generateResults();
            setMatchedCases(results);
            setPhases(prev => {
              const next = [...prev];
              next[3] = { ...next[3], completed: true, successText: `已为您匹配${results.length}个最相似装修案例` };
              return next;
            });

            setTimeout(() => {
              setMatched(true);
              setMatchPhase(5);

              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
            }, 50);
          }, 200));
        }, 400));
      }, 300));
    }, 200));

    timeoutRef.current = setTimeout(() => {
      const results = generateResults();
      setMatchedCases(results);
      setMatched(true);
      setMatchPhase(5);
      setPhaseProgress(100);
      setPhases(prev => prev.map((p, i) => i < 4 ? { ...p, completed: true, successText: p.successText || '处理完成' } : p));
    }, 3500);
  };

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

  const displayCases = useMemo(() => {
    if (matched && matchedCases.length > 0) return matchedCases;
    return [];
  }, [matched, matchedCases]);

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
          <div ref={formSectionRef} className="space-y-6">
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
                    onChange={(e) => handleFormChange('area', e.target.value)}
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
                    onChange={(e) => handleFormChange('layout', e.target.value)}
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
                    onChange={(e) => handleFormChange('bedrooms', e.target.value)}
                    placeholder="例如：3"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">卫生间数</label>
                  <input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => handleFormChange('bathrooms', e.target.value)}
                    placeholder="例如：2"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">装修风格</label>
                  <select
                    value={formData.style}
                    onChange={(e) => handleFormChange('style', e.target.value)}
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
                      onChange={(e) => handleFormChange('budgetMin', e.target.value)}
                      placeholder="最低"
                      className="input-base"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      value={formData.budgetMax}
                      onChange={(e) => handleFormChange('budgetMax', e.target.value)}
                      placeholder="最高"
                      className="input-base"
                    />
                  </div>
                </div>
              </div>
            </div>

            {!hasAnyInput && (
              <div className="flex items-start gap-2 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">您还未上传户型图或填写户型信息</p>
                  <p className="mt-0.5 text-yellow-700">系统将基于默认参数（三居室·100㎡·现代简约·10-50万预算）为您推荐。上传户型图可获得更精准的匹配结果。</p>
                </div>
              </div>
            )}

            {uploaded && !isFormModified && (
              <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">已上传户型图，建议补充户型信息获得更精准匹配</p>
                  <p className="mt-0.5 text-blue-700">填写面积、户型、风格和预算后，匹配结果会更贴合您的需求。</p>
                </div>
              </div>
            )}

            {!uploaded && isFormModified && (
              <div className="flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">已填写户型信息，上传户型图可获得更精准的匹配</p>
                  <p className="mt-0.5 text-teal-700">上传真实户型图后，AI 能识别更详细的户型结构，匹配度提升约 30%。</p>
                </div>
              </div>
            )}

            {validationError && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <button
              onClick={handleMatch}
              disabled={isMatching}
              className="w-full py-4 bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-800 hover:to-teal-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isMatching ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  AI 智能匹配中... ({matchPhase}/4)
                </>
              ) : matched ? (
                <>
                  <RefreshCw className="w-5 h-5" />
                  重新匹配
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  开始智能匹配
                </>
              )}
            </button>

            {(isMatching || matchPhase >= 1) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-teal-700" />
                  匹配进度
                </h3>
                <div className="space-y-3">
                  {phases.map((phase, idx) => {
                    const phaseNum = idx + 1;
                    const isActive = matchPhase === phaseNum;
                    const isDone = phase.completed;
                    return (
                      <div key={idx} className="relative">
                        <div className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
                          isActive ? 'bg-teal-50 border border-teal-200' :
                          isDone ? 'bg-gray-50' : 'bg-transparent'
                        }`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            isDone ? 'bg-teal-600 text-white' :
                            isActive ? 'bg-teal-600 text-white' :
                            'bg-gray-200 text-gray-400'
                          }`}>
                            {isDone ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <span className="text-xs font-semibold">{phaseNum}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium ${
                                isDone ? 'text-gray-600' :
                                isActive ? 'text-teal-700' :
                                'text-gray-400'
                              }`}>
                                {phase.label}
                              </p>
                              {isActive && (
                                <div className="w-4 h-4 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{phase.detail}</p>
                            {isDone && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                <p className="text-xs text-teal-600">{phase.successText}</p>
                              </div>
                            )}
                            {isActive && phaseNum === 3 && (
                              <div className="mt-2 h-2 bg-teal-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-teal-600 rounded-full transition-all duration-200"
                                  style={{ width: `${phaseProgress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {matched && selectedCases.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-teal-700" />
                  已选择对比案例
                </h3>
                <div className="space-y-3">
                  {selectedCases.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-500">
                          {item.area}㎡ · {item.houseType || item.layout} · {formatBudget(item.budget)}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleSelect(item.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                        aria-label="移除对比案例"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowCompare((value) => !value)}
                  className="mt-4 w-full py-2.5 rounded-xl bg-teal-50 text-teal-700 font-medium hover:bg-teal-100"
                >
                  {showCompare ? '收起对比分析' : '查看详细对比'}
                </button>
              </div>
            )}
          </div>

          <div ref={resultsSectionRef} className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Database className="w-5 h-5 text-teal-700" />
                    智能匹配结果
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">基于真实施工数据、户型图、水电图和验收照片综合排序</p>
                </div>
                {matched && (
                  <div className="relative w-16 h-16 shrink-0">
                    <ScoreRing value={avgSimilarity} size={64} />
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-teal-700">
                      {avgSimilarity}%
                    </div>
                  </div>
                )}
              </div>

              {!matched && !isMatching && (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                  <Box className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium text-gray-700">上传户型图或完整填写信息后开始智能匹配</p>
                  <p className="text-sm text-gray-500 mt-1">系统会把匹配依据绑定到用户输入，返回相似案例、预算区间、设计师和可交付资料</p>
                </div>
              )}

              {isMatching && (
                <div className="rounded-xl bg-teal-50 border border-teal-100 p-5">
                  <div className="flex items-start gap-3">
                    <RefreshCw className="w-5 h-5 text-teal-700 animate-spin mt-0.5" />
                    <div>
                      <p className="font-medium text-teal-900">AI 正在分析户型与案例库</p>
                      <p className="text-sm text-teal-700 mt-1">预计 3 秒内生成 Top6 推荐方案</p>
                    </div>
                  </div>
                </div>
              )}

              {matched && isUsingDefaultParams && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-100 p-4">
                  <Info className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600">
                      当前基于默认参数匹配。上传您的真实户型图可获得更精准的推荐结果
                    </p>
                    <button
                      onClick={scrollToForm}
                      className="mt-3 px-4 py-2 rounded-lg bg-gray-700 text-white text-sm font-medium hover:bg-gray-800 flex items-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      立即上传户型图
                    </button>
                  </div>
                </div>
              )}

              {matched && (
                <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-gray-900">匹配条件</h3>
                        {isUsingDefaultParams && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 text-xs font-medium">
                            默认参数
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        匹配依据：{effectiveParams.layout} · {effectiveParams.area}㎡ · {effectiveParams.style} · {effectiveParams.budgetMin}-{effectiveParams.budgetMax}万预算
                      </p>
                      {uploaded && (
                        <p className="mt-1 text-sm text-teal-600 flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          户型图已识别
                        </p>
                      )}
                    </div>
                    <button
                      onClick={scrollToForm}
                      className="shrink-0 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      修改参数
                    </button>
                  </div>
                </div>
              )}

              {matched && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-teal-50 p-3">
                    <p className="text-xs text-teal-700">匹配案例</p>
                    <p className="text-2xl font-bold text-teal-900 mt-1">{matchedCases.length}</p>
                  </div>
                  <div className="rounded-xl bg-orange-50 p-3">
                    <p className="text-xs text-orange-700">平均相似度</p>
                    <p className="text-2xl font-bold text-orange-700 mt-1">{avgSimilarity}%</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-3">
                    <p className="text-xs text-blue-700">可对比资料</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">4类</p>
                  </div>
                </div>
              )}

              {hasLowSimilarity && (
                <div className="mt-4 rounded-xl bg-orange-50 border border-orange-200 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-orange-800">匹配度较低，建议尝试以下调整：</p>
                      <p className="text-sm text-orange-700 mt-1">
                        ①扩大面积范围 ②放宽风格限制 ③调整预算区间
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            const currentArea = Number(effectiveParams.area) || 100;
                            handleFormChange('area', String(Math.round(currentArea * 1.3)));
                            setIsFormModified(true);
                            scrollToForm();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 text-xs font-medium hover:bg-orange-200 transition-colors"
                        >
                          面积扩大30%
                        </button>
                        <button
                          onClick={() => {
                            handleFormChange('style', '');
                            setIsFormModified(true);
                            scrollToForm();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 text-xs font-medium hover:bg-orange-200 transition-colors"
                        >
                          不限风格
                        </button>
                        <button
                          onClick={() => {
                            handleFormChange('budgetMin', '5');
                            handleFormChange('budgetMax', '100');
                            setIsFormModified(true);
                            scrollToForm();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 text-xs font-medium hover:bg-orange-200 transition-colors"
                        >
                          放宽预算
                        </button>
                        <button
                          onClick={scrollToForm}
                          className="px-3 py-1.5 rounded-lg bg-white border border-orange-200 text-orange-600 text-xs font-medium hover:bg-orange-50 transition-colors"
                        >
                          手动调整
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {showCompare && selectedCases.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">预算对比</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={budgetChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => [`${value}万`, '预算']} />
                      <Bar dataKey="预算" fill="#0f766e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {displayCases.length > 0 ? (
              <div className="space-y-4">
                {displayCases.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <RankBadge rank={item.rank} />
                            <CompletenessBadge score={item.dataCompleteness} />
                          </div>
                          <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {item.city} · {item.area}㎡ · {item.houseType || item.layout} · {item.style}
                          </p>
                        </div>
                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                          <div className="relative w-14 h-14">
                            <ScoreRing value={item.similarity} size={56} />
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-teal-700">
                              {item.similarity}%
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-400 leading-tight text-center">
                            得分组成：户型35% + 面积30% + 风格25% + 预算10%
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <DimensionBar label="户型" value={item.layoutSimilarity} color="bg-teal-500" />
                        <DimensionBar label="面积" value={item.areaCloseness} color="bg-blue-500" />
                        <DimensionBar label="风格" value={item.styleMatch} color="bg-orange-400" />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="px-2 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-medium">
                          户型 {item.layoutSimilarity}分
                        </span>
                        <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                          面积 {item.areaCloseness}分
                        </span>
                        <span className="px-2 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium">
                          风格 {item.styleMatch}分
                        </span>
                        {item.matchReasons.slice(3).map((reason) => (
                          <span key={reason} className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                            {reason}
                          </span>
                        ))}
                      </div>

                      <p className="mt-3 text-sm text-gray-600">{item.similarityExplanation}</p>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => toggleSelect(item.id)}
                          className={`py-2 rounded-xl text-sm font-medium ${
                            selectedIds.includes(item.id)
                              ? 'bg-teal-700 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {selectedIds.includes(item.id) ? '已加入对比' : '加入对比'}
                        </button>
                        <button
                          onClick={() => navigate(`/cases/${item.id}/3d`)}
                          className="py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-4 h-4" />
                          3D预览
                        </button>
                        <button
                          onClick={() => navigate(`/cases/${item.id}`)}
                          className="py-2 rounded-xl bg-teal-50 text-teal-700 text-sm font-medium hover:bg-teal-100 flex items-center justify-center gap-1.5"
                        >
                          <FileText className="w-4 h-4" />
                          查看详情
                        </button>
                        <button
                          onClick={() => navigate(`/pdf-delivery/${item.id}`)}
                          className="py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 flex items-center justify-center gap-1.5"
                        >
                          <FileOutput className="w-4 h-4" />
                          PDF交付
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">历史匹配样例</h3>
                <div className="space-y-3">
                  {HISTORY_EXAMPLES.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                        {item.similarity}%
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        <p className="text-xs text-gray-500">
                          {item.area}㎡ · {item.layout} · {item.style} · {item.budget}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 ml-auto" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
