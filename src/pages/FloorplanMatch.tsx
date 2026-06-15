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
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Filter,
  ZoomIn,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { mockCases } from '@/mock/data';
import type { Case } from '@shared/types';

interface MatchedCase extends Case {
  similarity: number;
  layoutSimilarity: number;
  areaCloseness: number;
  styleMatch: number;
  budgetMatch: number;
  dataCompleteness: number;
  evidenceCompleteness: number;
  evidenceCount: number;
  totalEvidenceCount: number;
  layoutScore: number;
  budgetScore: number;
  evidenceScore: number;
  overallScore: number;
  platformRecommendIndex: number;
  matchReasons: string[];
  similarityExplanation: string;
  rank: number;
  isOverBudget: boolean;
  matchBasis: {
    area: string;
    layout: string;
    style: string;
    budget: string;
  };
  isSampleRecommendation: boolean;
}

type MatchType = 'floorplan' | 'params' | 'default';

interface MatchTypeInfo {
  type: MatchType;
  label: string;
  icon: string;
  color: string;
  description: string;
  accuracy?: string;
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
  { label: '在1,280万+案例库中检索匹配...', detail: '按户型、面积、风格初筛', duration: 300, completed: false, successText: '' },
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
  idx: number,
  isSampleRecommendation: boolean
): MatchedCase {
  const inputArea = Number(formData.area) || 100;
  const inputRooms = Number(formData.bedrooms) || 3;
  const inputBudgetMin = Number(formData.budgetMin) || 0;
  const inputBudgetMax = Number(formData.budgetMax) || Infinity;
  const inputLayout = formData.layout || '三居室';
  const inputStyle = formData.style || '现代简约';

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
    inputLayout && layoutKeywords[inputLayout]
      ? layoutKeywords[inputLayout].some((k) => (c.houseType || '').includes(k) || (c.layout || '').includes(k))
      : roomMatch;
  
  let layoutSimilarity: number;
  if (layoutMatch) {
    layoutSimilarity = 85 + Math.min(15, Math.abs(c.rooms - inputRooms) === 0 ? 15 : 8);
  } else if (Math.abs((c.rooms ?? 0) - inputRooms) <= 1) {
    layoutSimilarity = 65 + Math.min(15, 10 - Math.abs((c.rooms ?? 0) - inputRooms) * 5);
  } else {
    layoutSimilarity = Math.max(30, 50 - Math.abs((c.rooms ?? 0) - inputRooms) * 8);
  }
  layoutSimilarity = Math.round(layoutSimilarity);

  const styleKeywords: Record<string, string[]> = {
    '现代简约': ['现代', '简约', 'ins风'],
    '北欧风格': ['北欧'],
    '新中式': ['新中式', '中式'],
    '轻奢风格': ['轻奢'],
    '日式风格': ['日式', '禅意'],
  };
  const styleMatchBool =
    inputStyle && styleKeywords[inputStyle]
      ? styleKeywords[inputStyle].some((k) => c.style.includes(k))
      : true;
  const styleMatch = styleMatchBool ? 80 + Math.min(20, 15 - (idx % 4) * 3) : 40 + Math.min(25, 20 - (idx % 5) * 4);

  const caseBudgetWan = c.budget / 10000;
  const budgetInRange = caseBudgetWan >= inputBudgetMin && caseBudgetWan <= inputBudgetMax;
  const isOverBudget = !budgetInRange;
  
  let budgetMatch: number;
  if (budgetInRange) {
    const budgetMid = (inputBudgetMin + inputBudgetMax) / 2;
    const budgetDiff = Math.abs(caseBudgetWan - budgetMid);
    const budgetRange = inputBudgetMax - inputBudgetMin;
    budgetMatch = Math.round(85 + Math.min(15, (1 - budgetDiff / Math.max(budgetRange, 1)) * 15));
  } else {
    const overAmount = caseBudgetWan < inputBudgetMin ? inputBudgetMin - caseBudgetWan : caseBudgetWan - inputBudgetMax;
    const budgetRange = Math.max(inputBudgetMax - inputBudgetMin, 10);
    budgetMatch = Math.max(20, Math.round(60 - (overAmount / budgetRange) * 40));
  }

  const similarity = Math.round(
    layoutSimilarity * 0.35 + areaCloseness * 0.30 + styleMatch * 0.25 + budgetMatch * 0.10
  );

  const hasImages = (c.images?.length ?? 0) > 0;
  const hasMaterials = (c.materials?.length ?? 0) > 0;
  const hasFloorPlan = !!c.floorPlanSvg;
  const hasAcceptance = (c.acceptancePhotos?.length ?? 0) > 0;
  const hasElectricPlan = !!c.electricPlanSvg;
  const hasWaterPlan = !!c.waterPlanSvg;
  
  const evidenceItems = [
    hasImages,
    hasMaterials,
    hasFloorPlan,
    hasElectricPlan,
    hasWaterPlan,
    hasAcceptance,
    hasAcceptance && (c.acceptancePhotos?.length ?? 0) >= 3,
    hasMaterials && (c.materials?.length ?? 0) >= 5,
    hasImages && (c.images?.length ?? 0) >= 4,
    !!c.qualityScore,
    !!c.designerName,
    !!c.duration,
    !!c.tags && (c.tags?.length ?? 0) > 0,
    !!c.description,
    !!c.coverImage,
  ];
  const totalEvidenceCount = evidenceItems.length;
  const evidenceCount = evidenceItems.filter(Boolean).length;
  const evidenceCompleteness = Math.round((evidenceCount / totalEvidenceCount) * 100);
  const dataCompleteness = Math.round(
    [hasImages, hasMaterials, hasFloorPlan, hasAcceptance].filter(Boolean).length / 4 * 100
  );

  const matchReasons: string[] = [];
  const explanationParts: string[] = [];

  if (layoutMatch) {
    matchReasons.push('户型一致');
    explanationParts.push(`户型匹配：${inputLayout}`);
  } else if (Math.abs((c.rooms ?? 0) - inputRooms) <= 1) {
    matchReasons.push('户型相近');
    explanationParts.push(`户型相近：您${inputRooms}室 vs 案例${c.rooms ?? c.bedrooms ?? '?'}室`);
  } else {
    explanationParts.push(`户型差异：您${inputRooms}室 vs 案例${c.rooms ?? c.bedrooms ?? '?'}室`);
  }

  if (areaDiff <= 5) {
    matchReasons.push(`面积仅差${areaDiff}㎡`);
    explanationParts.push(`面积匹配：您${inputArea}㎡ vs 案例${c.area}㎡`);
  } else if (areaDiff <= 10) {
    matchReasons.push(`面积接近±${areaDiff}㎡`);
    explanationParts.push(`面积接近：您${inputArea}㎡ vs 案例${c.area}㎡`);
  } else if (areaDiff <= 20) {
    matchReasons.push('面积差异适中');
    explanationParts.push(`面积差异：您${inputArea}㎡ vs 案例${c.area}㎡`);
  } else {
    explanationParts.push(`面积差异：您${inputArea}㎡ vs 案例${c.area}㎡`);
  }

  if (styleMatchBool) {
    matchReasons.push('风格匹配');
    explanationParts.push(`风格匹配：${inputStyle}`);
  } else {
    matchReasons.push('风格可参考');
    explanationParts.push(`风格差异：您${inputStyle} vs 案例${c.style}`);
  }

  if (budgetInRange) {
    matchReasons.push('预算匹配');
    explanationParts.push(`预算匹配：${inputBudgetMin}-${inputBudgetMax}万`);
  } else {
    explanationParts.push(`预算差异：您${inputBudgetMin}-${inputBudgetMax}万 vs 案例${caseBudgetWan.toFixed(1)}万`);
  }

  if (matchReasons.length === 0) {
    matchReasons.push('优质案例推荐');
  }

  const similarityExplanation = explanationParts.slice(0, 3).join(' + ');

  const overallScore = similarity;
  const platformRecommendIndex = 80 + (idx % 20);

  const layoutScore = layoutSimilarity;
  const budgetScore = budgetMatch;
  const evidenceScore = evidenceCompleteness;

  return {
    ...c,
    similarity: Math.min(99, Math.max(30, similarity)),
    layoutSimilarity,
    areaCloseness,
    styleMatch,
    budgetMatch,
    dataCompleteness,
    evidenceCompleteness,
    evidenceCount,
    totalEvidenceCount,
    layoutScore,
    budgetScore,
    evidenceScore,
    overallScore,
    platformRecommendIndex,
    matchReasons,
    similarityExplanation,
    rank: 0,
    isOverBudget,
    matchBasis: {
      area: `面积匹配：您${inputArea}㎡ vs 案例${c.area}㎡`,
      layout: `户型匹配：您${inputRooms}室 vs 案例${c.rooms ?? c.bedrooms ?? '?'}室`,
      style: `风格匹配：您${inputStyle} vs 案例${c.style}`,
      budget: `预算匹配：您${inputBudgetMin}-${inputBudgetMax}万 vs 案例${caseBudgetWan.toFixed(1)}万`,
    },
    isSampleRecommendation,
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

function MatchTypeBadge({ matchTypeInfo }: { matchTypeInfo: MatchTypeInfo }) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-100 text-green-700 border-green-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colorClasses[matchTypeInfo.color]}`}>
      <span className="text-base">{matchTypeInfo.icon}</span>
      <span className="text-sm font-semibold">{matchTypeInfo.label}</span>
      {matchTypeInfo.accuracy && (
        <span className="text-xs opacity-80">· 识别准确率：{matchTypeInfo.accuracy}</span>
      )}
    </div>
  );
}

function ThreeDimensionScores({ item }: { item: MatchedCase }) {
  const showSimilarity = !item.isSampleRecommendation;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 flex items-center gap-1">
            <Ruler className="w-3.5 h-3.5 text-teal-600" />
            户型相似度
          </span>
          <span className="font-semibold text-teal-700">{item.layoutSimilarity}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-700"
            style={{ width: `${item.layoutSimilarity}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-400">{item.matchBasis.layout}</p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5 text-blue-600" />
            预算匹配
          </span>
          <span className={`font-semibold ${item.isOverBudget ? 'text-orange-600' : 'text-blue-700'}`}>
            {item.budgetMatch}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${item.isOverBudget ? 'bg-orange-400' : 'bg-blue-500'}`}
            style={{ width: `${item.budgetMatch}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-400">{item.matchBasis.budget}</p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
            证据完整度
          </span>
          <span className="font-semibold text-green-700">{item.evidenceCompleteness}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-700"
            style={{ width: `${item.evidenceCompleteness}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-400">
          <CheckCircle className="w-3 h-3 inline mr-1 text-green-500" />
          {item.evidenceCount}项证据完整核验 / 共{item.totalEvidenceCount}项
        </p>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            {showSimilarity ? '综合推荐指数' : '平台推荐指数'}
          </span>
          <span className={`text-lg font-bold ${showSimilarity ? 'text-teal-600' : 'text-orange-600'}`}>
            {showSimilarity ? item.similarity : item.platformRecommendIndex}%
          </span>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          {showSimilarity
            ? '户型35% + 面积30% + 风格25% + 预算10%'
            : '基于案例质量、热度、好评度综合评定'}
        </p>
      </div>
    </div>
  );
}

function BudgetBadge({ isOverBudget }: { isOverBudget: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
      isOverBudget
        ? 'bg-orange-100 text-orange-700'
        : 'bg-green-100 text-green-700'
    }`}>
      {isOverBudget ? (
        <>
          <AlertTriangle className="w-3 h-3" />
          超出预算
        </>
      ) : (
        <>
          <CheckCircle className="w-3 h-3" />
          符合预算
        </>
      )}
    </span>
  );
}

function SampleBadge() {
  return (
    <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500 text-white text-xs font-medium shadow-md z-10">
      <Star className="w-3 h-3" />
      样本推荐
    </span>
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
  const [showPreMatchWarning, setShowPreMatchWarning] = useState(false);
  const [matchType, setMatchType] = useState<MatchType | null>(null);
  const [filterCompleteEvidence, setFilterCompleteEvidence] = useState(false);

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

  const matchTypeInfo = useMemo((): MatchTypeInfo | null => {
    if (!matchType) return null;

    if (matchType === 'floorplan') {
      return {
        type: 'floorplan',
        label: '户型图匹配',
        icon: '📐',
        color: 'green',
        description: '基于您上传的户型图进行AI智能匹配',
        accuracy: '95.8%',
      };
    } else if (matchType === 'params') {
      return {
        type: 'params',
        label: '参数匹配',
        icon: '✍️',
        color: 'blue',
        description: '基于您填写的户型信息进行匹配',
      };
    } else {
      return {
        type: 'default',
        label: '样本推荐',
        icon: '📋',
        color: 'orange',
        description: '平台精选案例推荐（非个性化匹配）',
      };
    }
  }, [matchType]);

  const handleFormChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setIsFormModified(true);
    setValidationError('');
  };

  const scrollToForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToResults = () => {
    resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    const isSample = isUsingDefaultParams || matchType === 'default';
    
    try {
      const results = mockCases
        .map((c, i) => computeMatch(effectiveParams, c, i, isSample))
        .sort((a, b) => {
          if (a.isOverBudget && !b.isOverBudget) return 1;
          if (!a.isOverBudget && b.isOverBudget) return -1;
          return b.similarity - a.similarity;
        })
        .slice(0, 6)
        .map((c, i) => ({ ...c, rank: i + 1 }));

      if (results.length === 0) {
        return mockCases.slice(0, 6).map((c, i) => ({
          ...computeMatch(effectiveParams, c, i, true),
          similarity: 85 + (i % 14),
          matchReasons: ['优质案例推荐'],
          similarityExplanation: '平台精选优质案例推荐',
          rank: i + 1,
          isSampleRecommendation: true,
        }));
      }
      return results;
    } catch {
      return mockCases.slice(0, 6).map((c, i) => ({
        ...computeMatch(effectiveParams, c, i, true),
        similarity: 85 + (i % 14),
        matchReasons: ['优质案例推荐'],
        similarityExplanation: '平台精选优质案例推荐',
        rank: i + 1,
        isSampleRecommendation: true,
      }));
    }
  };

  const determineMatchType = (): MatchType => {
    if (uploaded) return 'floorplan';
    if (isFormModified) return 'params';
    return 'default';
  };

  const proceedWithMatch = (forcedMatchType?: MatchType) => {
    setShowPreMatchWarning(false);
    const finalMatchType = forcedMatchType || determineMatchType();
    setMatchType(finalMatchType);
    setFilterCompleteEvidence(false);

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
          next[1] = { ...next[1], completed: true, successText: `初筛命中${(120000 + Math.floor(Math.random() * 20000)).toLocaleString()}个相似案例` };
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
              scrollToResults();

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
      scrollToResults();
      setPhases(prev => prev.map((p, i) => i < 4 ? { ...p, completed: true, successText: p.successText || '处理完成' } : p));
    }, 3500);
  };

  const handleMatch = () => {
    if (!uploaded && !isFormModified) {
      setShowPreMatchWarning(true);
      return;
    }
    proceedWithMatch();
  };

  const handleRematchWithCaseParams = (caseItem: MatchedCase) => {
    setFormData({
      area: String(caseItem.area),
      bedrooms: String(caseItem.bedrooms ?? caseItem.rooms ?? 3),
      bathrooms: String(caseItem.bathrooms ?? 1),
      layout: caseItem.layout ?? caseItem.houseType ?? '三居室',
      style: caseItem.style,
      budgetMin: String(Math.floor(caseItem.budget / 15000)),
      budgetMax: String(Math.ceil(caseItem.budget / 8000)),
    });
    setIsFormModified(true);
    setMatchType('params');
    scrollToForm();
  };

  const handleQuickAdjust = (type: 'area' | 'budget' | 'style') => {
    if (type === 'area') {
      const currentArea = Number(effectiveParams.area) || 100;
      handleFormChange('area', String(Math.round(currentArea * 1.2)));
    } else if (type === 'budget') {
      handleFormChange('budgetMin', '5');
      handleFormChange('budgetMax', '100');
    } else if (type === 'style') {
      handleFormChange('style', '');
    }
    setIsFormModified(true);
    scrollToForm();
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
    if (!matched || matchedCases.length === 0) return [];
    
    let cases = [...matchedCases];
    
    if (filterCompleteEvidence) {
      cases = cases.filter(c => c.evidenceCompleteness === 100);
    }
    
    return cases;
  }, [matched, matchedCases, filterCompleteEvidence]);

  const hasZeroResults = matched && matchedCases.length === 0;
  const hasFilteredZeroResults = matched && displayCases.length === 0 && matchedCases.length > 0;

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

            {showPreMatchWarning && (
              <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800 mb-1">
                      ⚠️ 您未上传户型图且未填写户型信息
                    </p>
                    <p className="text-sm text-yellow-700 mb-4">
                      将基于默认参数（三居室·100㎡·现代简约·10-50万预算）为您推荐平台精选案例。上传户型图可获得更精准的匹配结果。
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => proceedWithMatch('default')}
                        className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <TrendingUp className="w-4 h-4" />
                        继续用默认参数匹配
                      </button>
                      <button
                        onClick={() => {
                          setShowPreMatchWarning(false);
                          handleUpload();
                        }}
                        className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        上传户型图
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!showPreMatchWarning && (
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
            )}

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
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Database className="w-5 h-5 text-teal-700" />
                    智能匹配结果
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">基于真实施工数据、户型图、水电图和验收照片综合排序</p>
                </div>
                {matched && (
                  <div className="relative w-16 h-16 shrink-0">
                    <ScoreRing value={matchType === 'default' ? 85 : avgSimilarity} size={64} />
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-teal-700">
                      {matchType === 'default' ? '85%' : `${avgSimilarity}%`}
                    </div>
                  </div>
                )}
              </div>

              {matched && matchTypeInfo && (
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <MatchTypeBadge matchTypeInfo={matchTypeInfo} />
                  <span className="text-sm text-gray-500">{matchTypeInfo.description}</span>
                </div>
              )}

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
                        {isUsingDefaultParams && matchType !== 'default' && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 text-xs font-medium">
                            默认参数
                          </span>
                        )}
                        {matchType === 'default' && (
                          <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-xs font-medium">
                            样本推荐
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        匹配依据：{effectiveParams.layout} · {effectiveParams.area}㎡ · {effectiveParams.style}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5 text-gray-400" />
                        预算：{effectiveParams.budgetMin}-{effectiveParams.budgetMax}万
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
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-teal-50 p-3">
                      <p className="text-xs text-teal-700">匹配案例</p>
                      <p className="text-2xl font-bold text-teal-900 mt-1">{matchedCases.length}</p>
                    </div>
                    <div className="rounded-xl bg-orange-50 p-3">
                      <p className="text-xs text-orange-700">
                        {matchType === 'default' ? '平台推荐指数' : '平均相似度'}
                      </p>
                      <p className="text-2xl font-bold text-orange-700 mt-1">
                        {matchType === 'default' ? '85%' : `${avgSimilarity}%`}
                      </p>
                    </div>
                    <div className="rounded-xl bg-blue-50 p-3">
                      <p className="text-xs text-blue-700">可对比资料</p>
                      <p className="text-2xl font-bold text-blue-700 mt-1">4类</p>
                    </div>
                  </div>

                  {matchedCases.length > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                      <button
                        onClick={() => setFilterCompleteEvidence(!filterCompleteEvidence)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filterCompleteEvidence
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                        }`}
                      >
                        <Filter className="w-4 h-4" />
                        {filterCompleteEvidence ? '显示全部案例' : '筛选证据完整案例'}
                      </button>
                      {filterCompleteEvidence && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          仅显示证据链100%完整的案例
                        </span>
                      )}
                    </div>
                  )}
                </>
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

            {hasZeroResults && (
              <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-red-800 mb-2">未找到完全匹配的案例</p>
                    <p className="text-sm text-red-700 mb-4">
                      可能原因：①面积范围过窄 ②预算区间特殊 ③风格选择小众
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleQuickAdjust('area')}
                        className="px-3 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200 transition-colors flex items-center gap-1.5"
                      >
                        <ZoomIn className="w-4 h-4" />
                        放宽面积±20㎡
                      </button>
                      <button
                        onClick={() => handleQuickAdjust('budget')}
                        className="px-3 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200 transition-colors flex items-center gap-1.5"
                      >
                        <Wallet className="w-4 h-4" />
                        扩大预算范围
                      </button>
                      <button
                        onClick={() => handleQuickAdjust('style')}
                        className="px-3 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200 transition-colors flex items-center gap-1.5"
                      >
                        <Palette className="w-4 h-4" />
                        选择更多风格
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {hasFilteredZeroResults && (
              <div className="mt-4 rounded-xl bg-yellow-50 border border-yellow-200 p-5">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-800 mb-2">当前筛选条件下无匹配案例</p>
                    <p className="text-sm text-yellow-700 mb-4">
                      已筛选"证据链100%完整"的案例，但暂无符合条件的结果。您可以取消筛选查看全部案例。
                    </p>
                    <button
                      onClick={() => setFilterCompleteEvidence(false)}
                      className="px-4 py-2 rounded-lg bg-yellow-500 text-white text-sm font-medium hover:bg-yellow-600 transition-colors"
                    >
                      显示全部案例
                    </button>
                  </div>
                </div>
              </div>
            )}

            {displayCases.length > 0 ? (
              <div className="space-y-4">
                {displayCases.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
                    {item.isSampleRecommendation && <SampleBadge />}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <RankBadge rank={item.rank} />
                            <CompletenessBadge score={item.dataCompleteness} />
                            <BudgetBadge isOverBudget={item.isOverBudget} />
                          </div>
                          <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {item.city} · {item.area}㎡ · {item.houseType || item.layout} · {item.style}
                            <span className="ml-2 font-medium text-gray-700">
                              预算：{formatBudget(item.budget)}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <ThreeDimensionScores item={item} />
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.matchReasons.map((reason, idx) => (
                          <span key={idx} className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                            {reason}
                          </span>
                        ))}
                      </div>

                      <p className="text-sm text-gray-600 mb-4">{item.similarityExplanation}</p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
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

                      <button
                        onClick={() => handleRematchWithCaseParams(item)}
                        className="w-full py-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 text-sm font-medium hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50 transition-all flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-4 h-4" />
                        按此户型重新匹配
                      </button>
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
