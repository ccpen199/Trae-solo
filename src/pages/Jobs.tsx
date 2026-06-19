import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  DollarSign,
  Clock,
  Heart,
  Send,
  ChevronDown,
  Building2,
  Users,
  Briefcase,
  TrendingUp,
  Sparkles,
  BookOpen,
  GraduationCap,
  GitBranch,
  Code2,
  BarChart3,
  Filter,
  X,
  Star,
} from 'lucide-react';
import { jobsApi } from '@/lib/api';
import type { JobPost, GrowthTags } from '@shared/types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TagChips, type TagChipsItem } from '@/components/ui/TagChips';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { cn } from '@/lib/utils';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

const GROWTH_TAG_OPTIONS: TagChipsItem[] = [
  { value: 'hasTrainingSystem', label: '培训体系' },
  { value: 'hasRotationProgram', label: '轮岗机会' },
  { value: 'techStackEvolution', label: '技术栈演进' },
  { value: 'mentorshipProgram', label: '导师制' },
  { value: 'promotionPathClear', label: '晋升路径' },
  { value: 'learningBudget', label: '学习预算' },
];

const CITY_OPTIONS: TagChipsItem[] = [
  { value: '北京', label: '北京' },
  { value: '上海', label: '上海' },
  { value: '深圳', label: '深圳' },
  { value: '广州', label: '广州' },
  { value: '杭州', label: '杭州' },
  { value: '成都', label: '成都' },
  { value: '南京', label: '南京' },
  { value: '武汉', label: '武汉' },
  { value: '西安', label: '西安' },
  { value: '苏州', label: '苏州' },
  { value: '厦门', label: '厦门' },
  { value: '重庆', label: '重庆' },
];

const COMPANY_SIZE_OPTIONS: TagChipsItem[] = [
  { value: '10000人以上', label: '10000+ 大厂' },
  { value: '5000-10000人', label: '5000-10000' },
  { value: '1000-5000人', label: '1000-5000' },
  { value: '500-1000人', label: '500-1000' },
  { value: '100-500人', label: '100-500' },
  { value: '100人以下', label: '100人以下' },
];

const INDUSTRY_OPTIONS: TagChipsItem[] = [
  { value: '互联网', label: '互联网' },
  { value: '金融', label: '金融' },
  { value: '医疗健康', label: '医疗健康' },
  { value: '智能制造', label: '智能制造' },
  { value: '教育培训', label: '教育培训' },
  { value: '新零售', label: '新零售' },
  { value: '管理咨询', label: '管理咨询' },
  { value: '文化传媒', label: '文化传媒' },
];

const IMPLICIT_SIGNAL_OPTIONS: TagChipsItem[] = [
  { value: 'techBlog', label: '技术博客' },
  { value: 'openSource', label: '开源贡献' },
  { value: 'levelHealthy', label: '职级健康度' },
];

const SORT_OPTIONS = [
  { value: 'match', label: '匹配度优先' },
  { value: 'salary', label: '薪资优先' },
  { value: 'published', label: '最新发布' },
  { value: 'growth', label: '成长性优先' },
];

const GROWTH_TAG_LABEL: Record<keyof GrowthTags, { label: string; icon: React.ReactNode; color: string }> = {
  hasTrainingSystem: { label: '培训体系', icon: <GraduationCap className="w-3 h-3" />, color: 'emerald' },
  hasRotationProgram: { label: '轮岗机会', icon: <GitBranch className="w-3 h-3" />, color: 'indigo' },
  techStackEvolution: { label: '技术演进', icon: <Code2 className="w-3 h-3" />, color: 'purple' },
  mentorshipProgram: { label: '导师制', icon: <Users className="w-3 h-3" />, color: 'gold' },
  promotionPathClear: { label: '晋升路径', icon: <TrendingUp className="w-3 h-3" />, color: 'emerald' },
  learningBudget: { label: '学习预算', icon: <BookOpen className="w-3 h-3" />, color: 'purple' },
};

function formatPublishedDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '今天发布';
  if (days === 1) return '昨天发布';
  if (days < 7) return `${days}天前发布`;
  if (days < 30) return `${Math.floor(days / 7)}周前发布`;
  return `${Math.floor(days / 30)}月前发布`;
}

function getActiveGrowthTags(tags: GrowthTags): Array<keyof GrowthTags> {
  return (Object.keys(tags) as Array<keyof GrowthTags>).filter((k) => {
    if (k === 'techStackEvolution') return tags[k] !== 'stable';
    return tags[k] === true;
  });
}

function MatchBreakdownBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="text-slate-700 font-semibold">{value}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className={cn('h-full rounded-full', color)}
        />
      </div>
    </div>
  );
}

function DualRangeSlider({
  min,
  max,
  step,
  value,
  onChange,
  labelFormatter,
}: {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  labelFormatter?: (v: number) => string;
}) {
  const [minVal, maxVal] = value;
  const range = max - min;
  const leftPercent = ((minVal - min) / range) * 100;
  const rightPercent = ((maxVal - min) / range) * 100;

  return (
    <div className="space-y-3">
      <div className="relative h-2 bg-slate-100 rounded-full">
        <div
          className="absolute h-full rounded-full bg-gradient-to-r from-emerald-400 via-lavender-400 to-space-indigo-400"
          style={{ left: `${leftPercent}%`, right: `${100 - rightPercent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            onChange([Math.min(v, maxVal - step), maxVal]);
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto"
          style={{ zIndex: 3 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            onChange([minVal, Math.max(v, minVal + step)]);
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto"
          style={{ zIndex: 4 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-emerald-500 rounded-full shadow-md pointer-events-none"
          style={{ left: `${leftPercent}%`, zIndex: 5 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-space-indigo-500 rounded-full shadow-md pointer-events-none"
          style={{ left: `${rightPercent}%`, zIndex: 5 }}
        />
      </div>
      <div className="flex justify-between items-center">
        <Badge variant="emerald" size="sm">
          {labelFormatter ? labelFormatter(minVal) : minVal}
        </Badge>
        <span className="text-xs text-slate-400">至</span>
        <Badge variant="indigo" size="sm">
          {labelFormatter ? labelFormatter(maxVal) : maxVal}
        </Badge>
      </div>
    </div>
  );
}

function SingleRangeSlider({
  min,
  max,
  step,
  value,
  onChange,
  suffix,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-3">
      <div className="relative h-2 bg-slate-100 rounded-full">
        <div
          className="absolute h-full rounded-full bg-gradient-to-r from-emerald-400 to-lavender-500"
          style={{ right: `${100 - percent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-lavender-500 rounded-full shadow-md pointer-events-none"
          style={{ left: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400">{min}{suffix}</span>
        <Badge variant="purple" size="sm">
          最低 {value}{suffix}
        </Badge>
        <span className="text-xs text-slate-400">{max}{suffix}</span>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 group"
      >
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-50 to-lavender-50 text-lavender-600">
            {icon}
          </span>
          <span className="font-semibold text-sm text-slate-800 group-hover:text-space-indigo-700 transition-colors">
            {title}
          </span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pb-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function JobCard({ job, index }: { job: JobPost; index: number }) {
  const navigate = useNavigate();
  const [favorited, setFavorited] = useState(false);
  const activeGrowthTags = getActiveGrowthTags(job.growthTags);
  const visibleGrowthTags = activeGrowthTags.slice(0, 4);
  const extraGrowthCount = activeGrowthTags.length - visibleGrowthTags.length;
  const matchBreakdown = job.matchBreakdown ?? { competency: 75, growth: 80, preference: 70, implicit: 65 };
  const matchScore = job.matchScore ?? 78;

  return (
    <motion.div
      variants={scaleIn}
      custom={index}
      whileHover={{ y: -6 }}
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      <Card
        variant="glass"
        hoverable
        glowOnHover
        className="overflow-hidden h-full group"
      >
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-space-indigo-50 via-lavender-50 to-emerald-50 flex items-center justify-center text-2xl border border-slate-100 shadow-sm">
                {job.company.logo}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-heading font-bold text-lg text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                  {job.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-slate-500">
                  <span className="font-medium text-slate-700 truncate max-w-[140px]">
                    {job.company.name}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" />
                    {job.city}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {formatPublishedDate(job.publishedAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <ProgressRing percent={matchScore} size={64} strokeWidth={6} />
            </div>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-heading font-bold gradient-text tracking-tight">
              {job.salaryRange[0]}K
            </span>
            <span className="text-lg font-bold text-slate-400">-</span>
            <span className="text-2xl font-heading font-bold text-lavender-600">
              {job.salaryRange[1]}K
            </span>
            <span className="text-xs text-slate-400 ml-1">/月</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {visibleGrowthTags.map((tag) => {
              const cfg = GROWTH_TAG_LABEL[tag];
              return (
                <Badge
                  key={tag}
                  variant={cfg.color as 'emerald' | 'indigo' | 'purple' | 'gold'}
                  size="sm"
                  className="gap-1"
                >
                  {cfg.icon}
                  {cfg.label}
                </Badge>
              );
            })}
            {extraGrowthCount > 0 && (
              <Badge variant="default" size="sm">
                +{extraGrowthCount}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {job.implicitSignals.techBlogFrequency !== 'none' && (
              <Badge variant="implicit" size="sm" withDot>
                <BookOpen className="w-3 h-3" />
                博客
                {job.implicitSignals.techBlogFrequency === 'high' ? '高频' : job.implicitSignals.techBlogFrequency === 'medium' ? '中频' : '低频'}
              </Badge>
            )}
            {job.implicitSignals.openSourceContributions > 0 && (
              <Badge variant="implicit" size="sm" withDot>
                <Star className="w-3 h-3" />
                {job.implicitSignals.openSourceContributions} 开源贡献
              </Badge>
            )}
            <Badge variant="implicit" size="sm" withDot>
              <Users className="w-3 h-3" />
              平均 {job.implicitSignals.avgTenureMonths} 月在职
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <MatchBreakdownBar
              label="能力"
              value={matchBreakdown.competency}
              color="bg-gradient-to-r from-emerald-400 to-emerald-500"
            />
            <MatchBreakdownBar
              label="成长"
              value={matchBreakdown.growth}
              color="bg-gradient-to-r from-lavender-400 to-lavender-500"
            />
            <MatchBreakdownBar
              label="偏好"
              value={matchBreakdown.preference}
              color="bg-gradient-to-r from-space-indigo-400 to-space-indigo-500"
            />
            <MatchBreakdownBar
              label="隐性"
              value={matchBreakdown.implicit}
              color="bg-gradient-to-r from-amber-gold-400 to-amber-gold-500"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              leftIcon={<Heart className={cn('w-4 h-4 transition-colors', favorited && 'fill-rose-500 text-rose-500')} />}
              onClick={(e) => {
                e.stopPropagation();
                setFavorited(!favorited);
              }}
              className={cn(favorited && '!text-rose-500 !bg-rose-50')}
            >
              收藏
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth
              rightIcon={<Send className="w-4 h-4" />}
              onClick={(e) => e.stopPropagation()}
            >
              立即投递
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function JobCardSkeleton() {
  return (
    <Card variant="glass" className="overflow-hidden animate-pulse">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 bg-slate-200 rounded" />
              <div className="h-3 w-1/2 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="w-16 h-16 rounded-full bg-slate-200" />
        </div>
        <div className="h-8 w-1/2 bg-slate-200 rounded" />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-6 w-16 rounded-full bg-slate-100" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 bg-slate-100 rounded" />
              <div className="h-1.5 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <div className="h-9 flex-1 bg-slate-100 rounded-xl" />
          <div className="h-9 flex-1 bg-slate-200 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Jobs() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selectedGrowthTags, setSelectedGrowthTags] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCompanySizes, setSelectedCompanySizes] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedImplicitSignals, setSelectedImplicitSignals] = useState<string[]>([]);
  const [minMatchScore, setMinMatchScore] = useState(50);
  const [salaryRange, setSalaryRange] = useState<[number, number]>([5, 100]);
  const [sortBy, setSortBy] = useState('match');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const fetchJobs = useCallback(
    async (reset = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      if (reset) setLoading(true);

      try {
        const currentPage = reset ? 1 : page;
        const res = await jobsApi.getJobs({
          page: currentPage,
          pageSize,
          keyword: keyword || undefined,
          cities: selectedCities.length > 0 ? selectedCities : undefined,
          salaryMin: salaryRange[0] !== 5 ? salaryRange[0] * 1000 : undefined,
          salaryMax: salaryRange[1] !== 100 ? salaryRange[1] * 1000 : undefined,
          industries: selectedIndustries.length > 0 ? selectedIndustries : undefined,
          growthTags: selectedGrowthTags.length > 0 ? (selectedGrowthTags as Array<keyof GrowthTags>) : undefined,
          sortBy: sortBy as 'match' | 'salary' | 'published' | 'growth',
        });

        const data = res.data ?? [];
        setJobs((prev) => (reset ? data : [...prev, ...data]));
        setTotal(res.total ?? 0);
        if (reset) setPage(2);
        else setPage((p) => p + 1);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [page, keyword, selectedCities, salaryRange, selectedIndustries, selectedGrowthTags, sortBy]
  );

  useEffect(() => {
    fetchJobs(true);
  }, [keyword, selectedCities, salaryRange, selectedIndustries, selectedGrowthTags, sortBy, minMatchScore]);

  useEffect(() => {
    if (!sentinelRef.current || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && jobs.length < total) {
          fetchJobs(false);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading, jobs.length, total, fetchJobs]);

  const handleSearch = () => setKeyword(searchInput.trim());

  const filteredJobs = jobs.filter((j) => {
    if (selectedCompanySizes.length > 0 && !selectedCompanySizes.includes(j.company.size)) return false;
    if (selectedImplicitSignals.includes('techBlog') && j.implicitSignals.techBlogFrequency === 'none') return false;
    if (selectedImplicitSignals.includes('openSource') && j.implicitSignals.openSourceContributions === 0) return false;
    if (selectedImplicitSignals.includes('levelHealthy')) {
      const dist = j.implicitSignals.employeeLevelDistribution;
      const totalEmp = dist.entry + dist.junior + dist.middle + dist.senior + dist.expert + dist.lead;
      if (dist.middle / totalEmp < 0.3) return false;
    }
    const score = j.matchScore ?? 78;
    if (score < minMatchScore) return false;
    return true;
  });

  const FilterPanel = () => (
    <div className="space-y-0">
      <div className="flex items-center justify-between mb-2 lg:hidden">
        <h3 className="font-heading font-bold text-lg text-slate-900">筛选条件</h3>
        <button
          onClick={() => setMobileFilterOpen(false)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <FilterSection title="成长性标签" icon={<TrendingUp className="w-4 h-4" />}>
        <TagChips
          items={GROWTH_TAG_OPTIONS}
          selected={selectedGrowthTags}
          onChange={setSelectedGrowthTags}
          showAllOption={false}
        />
      </FilterSection>

      <FilterSection title="匹配度范围" icon={<Sparkles className="w-4 h-4" />}>
        <SingleRangeSlider
          min={50}
          max={100}
          step={5}
          value={minMatchScore}
          onChange={setMinMatchScore}
          suffix="%"
        />
      </FilterSection>

      <FilterSection title="薪资范围 (K/月)" icon={<DollarSign className="w-4 h-4" />}>
        <DualRangeSlider
          min={5}
          max={100}
          step={5}
          value={salaryRange}
          onChange={setSalaryRange}
          labelFormatter={(v) => `${v}K`}
        />
      </FilterSection>

      <FilterSection title="城市" icon={<MapPin className="w-4 h-4" />}>
        <TagChips
          items={CITY_OPTIONS}
          selected={selectedCities}
          onChange={setSelectedCities}
          showAllOption={false}
        />
      </FilterSection>

      <FilterSection title="公司规模" icon={<Building2 className="w-4 h-4" />}>
        <TagChips
          items={COMPANY_SIZE_OPTIONS}
          selected={selectedCompanySizes}
          onChange={setSelectedCompanySizes}
          showAllOption={false}
        />
      </FilterSection>

      <FilterSection title="行业筛选" icon={<Briefcase className="w-4 h-4" />}>
        <TagChips
          items={INDUSTRY_OPTIONS}
          selected={selectedIndustries}
          onChange={setSelectedIndustries}
          showAllOption={false}
        />
      </FilterSection>

      <FilterSection title="隐性信号" icon={<BarChart3 className="w-4 h-4" />}>
        <TagChips
          items={IMPLICIT_SIGNAL_OPTIONS}
          selected={selectedImplicitSignals}
          onChange={setSelectedImplicitSignals}
          showAllOption={false}
        />
      </FilterSection>
    </div>
  );

  return (
    <div className="min-h-screen pt-4 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <Card variant="glass" className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="搜索职位、公司、关键词..."
                  className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-slate-100 bg-white/80 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100/50 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={<Filter className="w-4 h-4" />}
                  className="lg:hidden"
                  onClick={() => setMobileFilterOpen(true)}
                >
                  筛选
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  rightIcon={<Search className="w-4 h-4" />}
                  onClick={handleSearch}
                >
                  搜索职位
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="flex gap-6">
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-20">
              <Card variant="glass" className="p-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <FilterPanel />
              </Card>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-5"
            >
              <Card variant="glass" className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">
                      找到
                      <span className="mx-1 font-heading font-bold text-xl gradient-text">
                        {loading ? '...' : filteredJobs.length > 0 ? filteredJobs.length : 0}
                      </span>
                      个匹配职位
                    </span>
                    {keyword && (
                      <Badge variant="purple" size="sm" className="gap-1">
                        关键词: {keyword}
                        <button onClick={() => { setKeyword(''); setSearchInput(''); }} className="hover:text-lavender-900">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">排序：</span>
                    <div className="flex rounded-xl bg-slate-100 p-1 gap-0.5">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setSortBy(opt.value)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                            sortBy === opt.value
                              ? 'bg-white text-space-indigo-700 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {loading && jobs.length === 0 ? (
              <div className="grid md:grid-cols-2 gap-5">
                {[...Array(6)].map((_, i) => (
                  <JobCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="py-20"
              >
                <Card variant="glass" className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-lavender-100 to-emerald-100 flex items-center justify-center">
                    <Briefcase className="w-10 h-10 text-lavender-500" />
                  </div>
                  <h3 className="font-heading font-bold text-xl text-slate-900 mb-2">暂无匹配职位</h3>
                  <p className="text-slate-500 mb-6 max-w-md mx-auto">
                    尝试调整筛选条件或扩大搜索范围，也许下一个完美机会就在等你。
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedGrowthTags([]);
                        setSelectedCities([]);
                        setSelectedCompanySizes([]);
                        setSelectedIndustries([]);
                        setSelectedImplicitSignals([]);
                        setMinMatchScore(50);
                        setSalaryRange([5, 100]);
                        setKeyword('');
                        setSearchInput('');
                      }}
                    >
                      清空筛选条件
                    </Button>
                    <Button variant="primary" onClick={() => navigate('/')}>
                      回到首页
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                key={`${keyword}-${selectedCities.join(',')}-${sortBy}`}
                className="grid md:grid-cols-2 gap-5"
              >
                {filteredJobs.map((job, i) => (
                  <JobCard key={job.id} job={job} index={i} />
                ))}
              </motion.div>
            )}

            <div ref={sentinelRef} className="h-12" />

            {loading && jobs.length > 0 && (
              <div className="py-8 text-center">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 border border-slate-100 shadow-sm">
                  <svg className="animate-spin h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm text-slate-500">加载更多职位...</span>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white z-50 lg:hidden shadow-2xl overflow-y-auto"
            >
              <div className="p-4">
                <FilterPanel />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
