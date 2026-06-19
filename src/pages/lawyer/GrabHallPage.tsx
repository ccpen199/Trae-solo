import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  MapPin,
  AlertCircle,
  Sparkles,
  List,
  Check,
  TrendingUp,
  Clock,
  Star,
  Zap,
  Briefcase,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Empty } from '@/components/ui/Empty';
import GrabItem from '@/components/features/GrabItem';
import { useConsultationStore } from '@/stores/consultation.store';
import { useLawyerStore } from '@/stores/lawyer.store';
import { useAuthStore } from '@/stores/auth.store';
import { useChatStore } from '@/stores/chat.store';
import { getCategoryLabel } from '@/utils/format';
import type { CaseCategory, UrgencyLevel, Consultation, Lawyer } from '@/types';
import { cn } from '@/lib/utils';

type TabType = 'recommended' | 'all';

const categoryOptions: { value: CaseCategory | 'all'; label: string }[] = [
  { value: 'all', label: '全部案由' },
  { value: 'marriage', label: '婚姻家庭' },
  { value: 'labor', label: '劳动纠纷' },
  { value: 'debt', label: '债务债权' },
  { value: 'traffic', label: '交通事故' },
  { value: 'contract', label: '合同纠纷' },
  { value: 'criminal', label: '刑事辩护' },
  { value: 'other', label: '其他' },
];

const urgencyOptions: { value: UrgencyLevel | 'all'; label: string }[] = [
  { value: 'all', label: '全部紧急程度' },
  { value: 'high', label: '高紧急' },
  { value: 'medium', label: '中紧急' },
  { value: 'low', label: '低紧急' },
];

const regionOptions = [
  '全部地区',
  '北京市朝阳区',
  '上海市浦东新区',
  '广州市天河区',
  '深圳市南山区',
];

export default function GrabHallPage() {
  const navigate = useNavigate();
  const { consultations, getPendingConsultations, assignLawyer } = useConsultationStore();
  const { lawyers, getLawyerById, grabConsultation } = useLawyerStore();
  const { currentUser, role } = useAuthStore();
  const { fetchMessages } = useChatStore();

  const [activeTab, setActiveTab] = useState<TabType>('recommended');
  const [categoryFilter, setCategoryFilter] = useState<CaseCategory | 'all'>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | 'all'>('all');
  const [regionFilter, setRegionFilter] = useState<string>('全部地区');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showUrgencyDropdown, setShowUrgencyDropdown] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const currentLawyer = useMemo(() => {
    if (role === 'lawyer' && currentUser) {
      return getLawyerById((currentUser as Lawyer).id) || (currentUser as Lawyer);
    }
    return lawyers.find((l) => l.verifyStatus === 'approved') || null;
  }, [currentUser, role, getLawyerById, lawyers]);

  const pendingConsultations = useMemo(() => getPendingConsultations(), [getPendingConsultations]);

  const filteredConsultations = useMemo(() => {
    let list = pendingConsultations;

    if (activeTab === 'recommended' && currentLawyer) {
      list = list.filter((c) => currentLawyer.specialties.includes(c.category));
    }

    if (categoryFilter !== 'all') {
      list = list.filter((c) => c.category === categoryFilter);
    }

    if (urgencyFilter !== 'all') {
      list = list.filter((c) => c.urgency === urgencyFilter);
    }

    if (regionFilter !== '全部地区') {
      list = list.filter((c) => c.region === regionFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }

    return list;
  }, [pendingConsultations, activeTab, currentLawyer, categoryFilter, urgencyFilter, regionFilter, searchQuery]);

  const recommendedCount = useMemo(() => {
    if (!currentLawyer) return 0;
    return pendingConsultations.filter((c) => currentLawyer.specialties.includes(c.category)).length;
  }, [pendingConsultations, currentLawyer]);

  const stats = useMemo(() => {
    if (!currentLawyer) {
      return {
        todayGrabbed: 0,
        activeCases: 0,
        rating: 0,
        avgResponse: 0,
      };
    }
    const lawyerConsultations = consultations.filter((c) => c.lawyerId === currentLawyer.id);
    const activeCases = lawyerConsultations.filter(
      (c) => c.status === 'matched' || c.status === 'chatting'
    ).length;
    const today = new Date().toDateString();
    const todayGrabbed = lawyerConsultations.filter(
      (c) => c.matchedAt && new Date(c.matchedAt).toDateString() === today
    ).length;

    return {
      todayGrabbed,
      activeCases,
      rating: currentLawyer.averageRating,
      avgResponse: 15,
    };
  }, [currentLawyer, consultations]);

  const handleGrab = (consultation: Consultation) => {
    if (!currentLawyer) return;

    const success = grabConsultation(currentLawyer.id, consultation.id);
    if (success) {
      assignLawyer(consultation.id, currentLawyer.id);
      fetchMessages(consultation.id);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        navigate(`/consultation/${consultation.id}`);
      }, 1500);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setShowCategoryDropdown(false);
      setShowUrgencyDropdown(false);
      setShowRegionDropdown(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const DropdownSelect = ({
    value,
    options,
    onChange,
    isOpen,
    setIsOpen,
    icon,
  }: {
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    icon?: React.ReactNode;
  }) => (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => {
          setShowCategoryDropdown(false);
          setShowUrgencyDropdown(false);
          setShowRegionDropdown(false);
          setIsOpen(!isOpen);
        }}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border border-primary-100 bg-white px-3.5 py-2 text-sm text-primary-700 transition-all hover:border-accent-gold hover:text-accent-gold-dark',
          isOpen && 'border-accent-gold text-accent-gold-dark'
        )}
      >
        {icon}
        <span>{options.find((o) => o.value === value)?.label || value}</span>
        <svg
          className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-lg border border-primary-100 bg-white py-1 shadow-card-hover"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between px-3.5 py-2 text-left text-sm transition-colors',
                  value === opt.value
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-primary-600 hover:bg-primary-50/60 hover:text-primary-700'
                )}
              >
                <span>{opt.label}</span>
                {value === opt.value && <Check className="h-3.5 w-3.5 text-accent-gold" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-primary-900 mb-1">抢单大厅</h1>
        <p className="text-sm text-primary-500">匹配您专长领域的法律咨询，快速响应获得优质案源</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <Card bordered={true} shadow={true}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400" />
                  <input
                    type="text"
                    placeholder="搜索咨询标题或描述..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-primary-100 bg-primary-50/40 pl-10 pr-4 py-2.5 text-sm text-primary-800 placeholder:text-primary-400 focus:border-accent-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-primary-400 hover:text-primary-600 hover:bg-primary-100 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <DropdownSelect
                    value={categoryFilter}
                    options={categoryOptions}
                    onChange={(v) => setCategoryFilter(v as CaseCategory | 'all')}
                    isOpen={showCategoryDropdown}
                    setIsOpen={setShowCategoryDropdown}
                    icon={<Filter className="h-3.5 w-3.5" />}
                  />
                  <DropdownSelect
                    value={regionFilter}
                    options={regionOptions.map((r) => ({ value: r, label: r }))}
                    onChange={setRegionFilter}
                    isOpen={showRegionDropdown}
                    setIsOpen={setShowRegionDropdown}
                    icon={<MapPin className="h-3.5 w-3.5" />}
                  />
                  <DropdownSelect
                    value={urgencyFilter}
                    options={urgencyOptions}
                    onChange={(v) => setUrgencyFilter(v as UrgencyLevel | 'all')}
                    isOpen={showUrgencyDropdown}
                    setIsOpen={setShowUrgencyDropdown}
                    icon={<AlertCircle className="h-3.5 w-3.5" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-1 rounded-xl bg-primary-50/60 p-1">
            <button
              onClick={() => setActiveTab('recommended')}
              className={cn(
                'flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200',
                activeTab === 'recommended'
                  ? 'bg-white text-primary-800 shadow-sm'
                  : 'text-primary-500 hover:text-primary-700'
              )}
            >
              <Sparkles className="h-4 w-4 text-accent-gold" />
              智能推荐
              <Badge variant="info" className="ml-0.5">{recommendedCount}</Badge>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200',
                activeTab === 'all'
                  ? 'bg-white text-primary-800 shadow-sm'
                  : 'text-primary-500 hover:text-primary-700'
              )}
            >
              <List className="h-4 w-4" />
              全部咨询
              <Badge variant="default" className="ml-0.5">{pendingConsultations.length}</Badge>
            </button>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredConsultations.length === 0 ? (
                <Empty
                  title="暂无匹配的咨询"
                  description={
                    activeTab === 'recommended'
                      ? '当前没有匹配您专长的咨询，请稍后再来或查看全部咨询'
                      : '暂无待抢单的咨询，请稍后刷新'
                  }
                  action={
                    activeTab === 'recommended' && (
                      <Button variant="outline" onClick={() => setActiveTab('all')}>
                        查看全部咨询
                      </Button>
                    )
                  }
                />
              ) : (
                filteredConsultations.map((consultation) => (
                  <GrabItem
                    key={consultation.id}
                    consultation={consultation}
                    grabbedCount={Math.floor(Math.random() * 8) + 1}
                    onGrab={handleGrab}
                    isRecommended={
                      activeTab === 'recommended' ||
                      (currentLawyer?.specialties.includes(consultation.category) ?? false)
                    }
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <Card bordered={true} shadow={true}>
            <CardHeader className="pb-3">
              <h2 className="font-serif text-lg font-semibold text-primary-900">个人数据统计</h2>
              <p className="text-xs text-primary-400">实时更新的执业数据</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  whileHover={{ y: -2 }}
                  className="rounded-lg bg-gradient-to-br from-primary-700 to-primary-800 p-4 text-white"
                >
                  <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2 py-0.5 text-[10px]">
                    <Zap className="h-3 w-3" />
                    今日抢单
                  </div>
                  <div className="mt-2 font-serif text-3xl font-bold">{stats.todayGrabbed}</div>
                  <div className="text-xs text-white/60">单</div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  className="rounded-lg bg-gradient-to-br from-accent-gold to-accent-gold-dark p-4 text-primary-900"
                >
                  <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary-900/10 px-2 py-0.5 text-[10px]">
                    <Briefcase className="h-3 w-3" />
                    进行中案件
                  </div>
                  <div className="mt-2 font-serif text-3xl font-bold">{stats.activeCases}</div>
                  <div className="text-xs text-primary-800/60">件</div>
                </motion.div>
              </div>

              <div className="rounded-lg border border-primary-100 bg-primary-50/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-accent-gold fill-accent-gold" />
                    <span className="text-sm font-medium text-primary-700">好评率</span>
                  </div>
                  <span className="font-serif text-xl font-bold text-primary-900">
                    {(stats.rating * 20).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4 transition-colors',
                        i <= Math.round(stats.rating)
                          ? 'text-accent-gold fill-accent-gold'
                          : 'text-primary-200'
                      )}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium text-primary-700">{stats.rating.toFixed(1)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.rating * 20}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gold-gradient rounded-full"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-primary-100 bg-primary-50/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary-600" />
                    <span className="text-sm font-medium text-primary-700">平均响应时长</span>
                  </div>
                  <span className="font-serif text-xl font-bold text-primary-900">
                    {stats.avgResponse}
                    <span className="ml-1 text-sm font-normal text-primary-500">分钟</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs text-primary-500">优于平台 78% 的律师</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {currentLawyer && (
            <Card bordered={true} shadow={true}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-primary-500 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-accent-gold" />
                  <span>我的专长领域</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentLawyer.specialties.map((s) => (
                    <Badge key={s} variant="info">
                      {getCategoryLabel(s)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="relative flex flex-col items-center rounded-2xl bg-white px-10 py-8 shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', damping: 15 }}
                className="relative mb-4"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-accent-gold/30"
                />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gold-gradient shadow-gold">
                  <Check className="h-10 w-10 text-primary-900" strokeWidth={3} />
                </div>
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-serif text-xl font-bold text-primary-900 mb-1"
              >
                抢单成功！
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-primary-500"
              >
                正在跳转至咨询会话...
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
