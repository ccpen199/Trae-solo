import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Ruler,
  Banknote,
  Clock,
  MapPin,
  Palette,
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Search,
  Filter,
  Star,
  Trophy,
  Users,
  CalendarDays,
  Eye,
  Send,
  type LucideIcon,
} from 'lucide-react';
import type {
  Provider,
  MatchResult as MatchResultType,
  PropertyType,
  DesignStyle,
} from '@/types';
import { mockProviders, mockWorkOrders } from '@/mock';
import { cn } from '@/lib/utils';

const propertyTypes: PropertyType[] = ['写字楼', '商铺', '厂房', '产业园', '综合体'];
const designStyles: DesignStyle[] = ['现代简约', '新中式', '工业风', '北欧风', '商务轻奢', '科技感', '复古风', '自然生态'];
const cities = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '苏州市', '成都市', '南京市'];

const levelColorMap = {
  'S级': 'bg-gradient-to-r from-gold-500 to-gold-400 text-primary-900',
  'A级': 'bg-gradient-to-r from-primary-500 to-primary-400 text-white',
  'B级': 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white',
  'C级': 'bg-gradient-to-r from-neutral-500 to-neutral-400 text-white',
};

interface MatchCriteria {
  propertyType: PropertyType;
  area: number;
  minBudget: number;
  maxBudget: number;
  duration: number;
  city: string;
  designStyles: DesignStyle[];
  specialRequirements: string;
}

function generateMatchScore(provider: Provider, criteria: MatchCriteria): MatchResultType {
  const areaMatch = criteria.area >= provider.minArea && criteria.area <= provider.maxArea ? 95 : criteria.area > provider.maxArea ? Math.max(60, 100 - (criteria.area - provider.maxArea) / 100 * 10) : Math.max(65, 100 - (provider.minArea - criteria.area) / 50 * 8);
  const budgetMatch = criteria.maxBudget >= provider.minBudget && criteria.minBudget <= provider.maxBudget ? 92 : criteria.maxBudget < provider.minBudget ? Math.max(55, 100 - (provider.minBudget - criteria.maxBudget) / 100000 * 5) : Math.max(70, 100 - (criteria.minBudget - provider.maxBudget) / 100000 * 3);
  const durationMatch = criteria.duration >= 30 && criteria.duration <= 180 ? 88 + Math.random() * 10 : criteria.duration < 30 ? 75 : 80;
  const styleMatch = provider.specialities.some(s => criteria.designStyles.some(ds => s.includes(ds))) ? 90 + Math.random() * 8 : 65 + Math.random() * 15;
  const locationMatch = provider.provinces.some(p => criteria.city.includes(p) || criteria.city.includes('北京') && p === '北京' || criteria.city.includes('上海') && p === '上海') ? 95 : 70;
  const qualificationMatch = provider.level === 'S级' ? 98 : provider.level === 'A级' ? 90 : provider.level === 'B级' ? 80 : 70;
  const caseMatch = provider.cases.filter(c => c.propertyType === criteria.propertyType).length > 0 ? 90 : 70;
  
  const overall = Math.round((areaMatch * 0.2 + budgetMatch * 0.25 + durationMatch * 0.15 + styleMatch * 0.15 + locationMatch * 0.1 + qualificationMatch * 0.1 + caseMatch * 0.05));
  
  const recommendedReason: string[] = [];
  if (areaMatch >= 90) recommendedReason.push(`面积${criteria.area}㎡在服务商最佳服务范围内`);
  if (budgetMatch >= 90) recommendedReason.push(`预算${criteria.minBudget/10000}-${criteria.maxBudget/10000}万匹配度高`);
  if (provider.cases.some(c => c.propertyType === criteria.propertyType)) {
    const similarCase = provider.cases.find(c => c.propertyType === criteria.propertyType);
    if (similarCase) recommendedReason.push(`有${similarCase.name}等同类型项目经验`);
  }
  if (provider.level === 'S级' || provider.level === 'A级') recommendedReason.push(`${provider.level}优质服务商，资质齐全`);
  if (locationMatch >= 90) recommendedReason.push(`服务团队位于${criteria.city}，响应及时`);
  if (provider.rating.overall >= 4.7) recommendedReason.push(`综合评分${provider.rating.overall}分，客户满意度高`);
  
  const matchLevel = overall >= 90 ? '完美匹配' : overall >= 80 ? '高度匹配' : overall >= 70 ? '较好匹配' : '一般匹配';
  
  return {
    id: `MATCH-${provider.id}`,
    providerId: provider.id,
    provider,
    matchScore: {
      overall,
      areaMatch: Math.round(areaMatch),
      budgetMatch: Math.round(budgetMatch),
      durationMatch: Math.round(durationMatch),
      styleMatch: Math.round(styleMatch),
      locationMatch: Math.round(locationMatch),
      qualificationMatch: Math.round(qualificationMatch),
      caseMatch: Math.round(caseMatch),
    },
    matchLevel,
    recommendedReason: recommendedReason.slice(0, 4),
    potentialRisk: overall < 75 ? ['面积接近服务商服务上限，可能需要分包部分工程'] : undefined,
    estimatedQuotation: [Math.round(criteria.minBudget * 0.95), Math.round(criteria.maxBudget * 1.05)] as [number, number],
    estimatedDuration: Math.round(criteria.duration * (0.9 + Math.random() * 0.2)),
    availableTeam: {
      designers: Math.floor(Math.random() * 5) + 2,
      projectManagers: Math.floor(Math.random() * 2) + 1,
      workers: Math.floor(Math.random() * 30) + 20,
    },
    inviteStatus: Math.random() > 0.7 ? '已响应' : Math.random() > 0.5 ? '已邀请' : '未邀请',
    matchedAt: new Date().toISOString(),
  };
}

function ScoreRing({ score, size = 120, strokeWidth = 10 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? '#D4A853' : score >= 80 ? '#3D5D97' : score >= 70 ? '#059669' : '#64748B';
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(61, 93, 151, 0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px ${color}60)`, transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-bold glow-text-gold">{score}</span>
        <span className="text-[10px] text-neutral-400">匹配度</span>
      </div>
    </div>
  );
}

function MatchCard({ match, index }: { match: MatchResultType; index: number }) {
  const { provider, matchScore, matchLevel, recommendedReason, estimatedQuotation, estimatedDuration, availableTeam, inviteStatus } = match;
  
  const statusColorMap = {
    '未邀请': 'bg-neutral-500/20 text-neutral-300 border-neutral-500/30',
    '已邀请': 'bg-info-500/20 text-info-300 border-info-500/30',
    '已响应': 'bg-success-500/20 text-success-300 border-success-500/30',
    '已拒绝': 'bg-danger-500/20 text-danger-300 border-danger-500/30',
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="card-base p-6 group"
    >
      <div className="flex gap-6">
        <div className="shrink-0">
          <ScoreRing score={matchScore.overall} />
          <div className="mt-2 text-center">
            <span className={cn(
              "inline-block px-2.5 py-0.5 rounded-full text-xs font-bold",
              matchLevel === '完美匹配' ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30' :
              matchLevel === '高度匹配' ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' :
              matchLevel === '较好匹配' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              'bg-neutral-500/20 text-neutral-300 border border-neutral-500/30'
            )}>
              {matchLevel}
            </span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-white truncate">{provider.companyName}</h3>
                <span className={cn("shrink-0 px-2 py-0.5 rounded-md text-xs font-bold", levelColorMap[provider.level])}>
                  {provider.level}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-400 truncate">{provider.shortName} · {provider.businessScope[0]}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
              <span className="font-mono font-bold text-gold-300">{provider.rating.overall.toFixed(1)}</span>
            </div>
          </div>
          
          <div className="mt-3 flex flex-wrap gap-1.5">
            {provider.qualifications.slice(0, 3).map(q => (
              <span key={q.id} className="chip chip-gold text-[11px]">
                {q.name} {q.level}
              </span>
            ))}
            <span className="chip text-[11px]">
              <Trophy className="w-3 h-3 mr-1" />
              {provider.rating.totalOrders}个项目
            </span>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
            {[
              { label: '面积匹配', value: matchScore.areaMatch, color: '#3B82F6' },
              { label: '预算匹配', value: matchScore.budgetMatch, color: '#8B5CF6' },
              { label: '工期匹配', value: matchScore.durationMatch, color: '#EC4899' },
              { label: '风格匹配', value: matchScore.styleMatch, color: '#F59E0B' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-xs text-neutral-400 w-16">{item.label}</span>
                <div className="flex-1 h-1.5 bg-primary-800/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${item.value}%`, backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}60` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-neutral-300 w-8">{item.value}%</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 space-y-1.5">
            {recommendedReason.map((reason, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-neutral-300">{reason}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gold-500/10 grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider">预估报价</p>
              <p className="mt-0.5 font-mono font-bold text-gold-300 text-sm">
                {(estimatedQuotation[0]/10000).toFixed(0)}~{(estimatedQuotation[1]/10000).toFixed(0)}万
              </p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider">预估工期</p>
              <p className="mt-0.5 font-mono font-bold text-info-400 text-sm">{estimatedDuration}天</p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider">可投入团队</p>
              <p className="mt-0.5 font-mono font-bold text-emerald-400 text-sm">
                <Users className="w-3 h-3 inline mr-1" />
                {availableTeam.designers + availableTeam.projectManagers + availableTeam.workers}人
              </p>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-2">
            {provider.cases.slice(0, 2).map(c => (
              <div key={c.id} className="relative h-16 rounded-lg overflow-hidden group/case">
                <img
                  src={c.coverUrl || `https://images.unsplash.com/photo-1497366216548-37526070297c?w=400`}
                  alt={c.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover/case:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 via-primary-900/40 to-transparent" />
                <div className="absolute bottom-1.5 left-2 right-2">
                  <p className="text-[10px] text-white/90 font-medium truncate">{c.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] text-gold-300">NPS {c.npsScore}</span>
                    <span className="text-[9px] text-neutral-400">{c.area}㎡</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", statusColorMap[inviteStatus])}>
              {inviteStatus}
            </span>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg text-xs font-medium bg-primary-700/50 text-neutral-200 hover:bg-primary-700 transition-colors flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                查看详情
              </button>
              <button className={cn(
                "px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all",
                inviteStatus === '未邀请'
                  ? "btn-gold"
                  : "bg-neutral-700/50 text-neutral-400 cursor-not-allowed"
              )}
                disabled={inviteStatus !== '未邀请'}
              >
                <Send className="w-3.5 h-3.5" />
                {inviteStatus === '未邀请' ? '邀请报价' : '已邀请'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function MatchingPage() {
  const [criteria, setCriteria] = useState<MatchCriteria>({
    propertyType: '写字楼',
    area: 1500,
    minBudget: 3000000,
    maxBudget: 5000000,
    duration: 90,
    city: '上海市',
    designStyles: ['现代简约', '商务轻奢'],
    specialRequirements: '',
  });
  const [sortBy, setSortBy] = useState<'match' | 'rating' | 'price' | 'duration'>('match');
  const [isMatching, setIsMatching] = useState(false);
  const [hasSearched, setHasSearched] = useState(true);
  
  const matchResults = useMemo(() => {
    return mockProviders
      .map(p => generateMatchScore(p, criteria))
      .sort((a, b) => {
        if (sortBy === 'match') return b.matchScore.overall - a.matchScore.overall;
        if (sortBy === 'rating') return b.provider.rating.overall - a.provider.rating.overall;
        if (sortBy === 'price') return a.estimatedQuotation[0] - b.estimatedQuotation[0];
        return a.estimatedDuration - b.estimatedDuration;
      });
  }, [criteria, sortBy]);
  
  const handleMatch = () => {
    setIsMatching(true);
    setTimeout(() => {
      setIsMatching(false);
      setHasSearched(true);
    }, 1500);
  };
  
  const toggleStyle = (style: DesignStyle) => {
    setCriteria(prev => ({
      ...prev,
      designStyles: prev.designStyles.includes(style)
        ? prev.designStyles.filter(s => s !== style)
        : [...prev.designStyles, style]
    }));
  };
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-[1600px] p-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-primary-900 flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-gold-500" />
            智能匹配引擎
          </h1>
          <p className="mt-1 text-sm text-neutral-500">基于面积、预算、工期、风格四维算法，为您精准推荐最适合的装饰服务商</p>
        </motion.div>
        
        <div className="grid grid-cols-12 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-12 lg:col-span-4 xl:col-span-3"
          >
            <div className="card-base p-6 sticky top-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Filter className="w-4.5 h-4.5 text-gold-400" />
                匹配需求
              </h2>
              
              <div className="mt-5 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary-400" />
                    房源类型
                  </label>
                  <select
                    value={criteria.propertyType}
                    onChange={(e) => setCriteria({ ...criteria, propertyType: e.target.value as PropertyType })}
                    className="input-tech"
                  >
                    {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-2 flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-primary-400" />
                    装修面积 (㎡)
                  </label>
                  <input
                    type="number"
                    value={criteria.area}
                    onChange={(e) => setCriteria({ ...criteria, area: Number(e.target.value) })}
                    className="input-tech"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-2 flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-gold-400" />
                    预算范围 (万元)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={criteria.minBudget / 10000}
                      onChange={(e) => setCriteria({ ...criteria, minBudget: Number(e.target.value) * 10000 })}
                      className="input-tech"
                      placeholder="最小"
                    />
                    <span className="text-neutral-500">-</span>
                    <input
                      type="number"
                      value={criteria.maxBudget / 10000}
                      onChange={(e) => setCriteria({ ...criteria, maxBudget: Number(e.target.value) * 10000 })}
                      className="input-tech"
                      placeholder="最大"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-info-400" />
                    期望工期 (天)
                  </label>
                  <input
                    type="number"
                    value={criteria.duration}
                    onChange={(e) => setCriteria({ ...criteria, duration: Number(e.target.value) })}
                    className="input-tech"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-danger-400" />
                    所在城市
                  </label>
                  <select
                    value={criteria.city}
                    onChange={(e) => setCriteria({ ...criteria, city: e.target.value })}
                    className="input-tech"
                  >
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-2 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-violet-400" />
                    设计风格偏好
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {designStyles.map(style => (
                      <button
                        key={style}
                        onClick={() => toggleStyle(style)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-medium transition-all border",
                          criteria.designStyles.includes(style)
                            ? "bg-gold-500/20 text-gold-300 border-gold-500/40"
                            : "bg-primary-800/30 text-neutral-400 border-neutral-600/30 hover:border-neutral-500/50"
                        )}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-neutral-400" />
                    特殊需求 (选填)
                  </label>
                  <textarea
                    value={criteria.specialRequirements}
                    onChange={(e) => setCriteria({ ...criteria, specialRequirements: e.target.value })}
                    className="input-tech min-h-[80px] resize-y"
                    placeholder="如：需要百级洁净车间、多媒体会议室、VIP接待区等..."
                  />
                </div>
                
                <div className="divider-gold" />
                
                <button
                  onClick={handleMatch}
                  disabled={isMatching}
                  className="btn-gold w-full h-11 text-base font-bold group"
                >
                  {isMatching ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-900/30 border-t-primary-900 rounded-full animate-spin" />
                      智能匹配中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      开始智能匹配
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="col-span-12 lg:col-span-8 xl:col-span-9"
          >
            <div className="card-base p-4 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-xs text-neutral-400">找到</span>
                    <span className="mx-1.5 font-mono text-xl font-bold glow-text-gold">{matchResults.length}</span>
                    <span className="text-xs text-neutral-400">家匹配供应商</span>
                  </div>
                  <div className="h-6 w-px bg-gold-500/20" />
                  <div>
                    <span className="text-xs text-neutral-400">平均匹配度</span>
                    <span className="mx-1.5 font-mono text-xl font-bold text-gold-300">
                      {Math.round(matchResults.reduce((s, r) => s + r.matchScore.overall, 0) / matchResults.length)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">排序：</span>
                  <div className="flex bg-primary-800/30 rounded-lg p-0.5">
                    {[
                      { key: 'match', label: '匹配度' },
                      { key: 'rating', label: '评分' },
                      { key: 'price', label: '价格' },
                      { key: 'duration', label: '工期' },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setSortBy(opt.key as typeof sortBy)}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                          sortBy === opt.key
                            ? "bg-gold-500 text-primary-900"
                            : "text-neutral-400 hover:text-white"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {isMatching ? (
              <div className="card-base p-16 flex flex-col items-center justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-gold-500/20" />
                  <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-gold-500 animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-gold-400" />
                </div>
                <p className="mt-4 text-lg font-medium text-white">AI智能匹配引擎分析中...</p>
                <p className="mt-1 text-sm text-neutral-400">正在根据您的需求从128家认证服务商中筛选最佳匹配</p>
              </div>
            ) : (
              <div className="space-y-5">
                {matchResults.map((match, i) => (
                  <MatchCard key={match.id} match={match} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
