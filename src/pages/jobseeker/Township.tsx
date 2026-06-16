import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Building2,
  Briefcase,
  Home,
  Bus,
  GraduationCap,
  Factory,
  TrendingUp,
  ChevronRight,
  Flame,
  Filter,
  ShieldCheck,
  ShieldX,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Card, Tag, Button, Tooltip, Tabs, Select, Modal, List, Slider } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { generateMockData } from '@/mock/data';
import { TOWNSHIPS, TownshipData } from '@/mock/townships';
import { IndustryTag, TownshipCode, Enterprise, JobPosition } from '@shared/types';
import StatsCard from '@/components/common/StatsCard';
import EnterpriseCard from '@/components/common/EnterpriseCard';
import JobCard from '@/components/common/JobCard';
import { cn } from '@/lib/utils';

const INDUSTRY_COLORS: Record<IndustryTag, string> = {
  [IndustryTag.HARDWARE]: '#165DFF',
  [IndustryTag.LIGHTING]: '#FF7D00',
  [IndustryTag.CASUALWEAR]: '#722ED1',
  [IndustryTag.FURNITURE]: '#13C2C2',
  [IndustryTag.ELECTRONICS]: '#52C41A',
  [IndustryTag.MACHINERY]: '#EB2F96',
  [IndustryTag.APPLIANCE]: '#FA8C16',
  [IndustryTag.FOOD]: '#F5222D',
  [IndustryTag.NEWENERGY]: '#2F54EB',
  [IndustryTag.ROBOTICS]: '#73D13D',
};

const INDUSTRY_ICONS: Record<IndustryTag, React.ReactNode> = {
  [IndustryTag.HARDWARE]: '🔧',
  [IndustryTag.LIGHTING]: '💡',
  [IndustryTag.CASUALWEAR]: '👕',
  [IndustryTag.FURNITURE]: '🛋️',
  [IndustryTag.ELECTRONICS]: '⚡',
  [IndustryTag.MACHINERY]: <Factory size={14} />,
  [IndustryTag.APPLIANCE]: <Building2 size={14} />,
  [IndustryTag.FOOD]: '🍜',
  [IndustryTag.NEWENERGY]: <TrendingUp size={14} />,
  [IndustryTag.ROBOTICS]: '🤖',
};

const SCALE_OPTIONS = [
  { label: '全部', value: '全部' },
  { label: '50人以下', value: '50人以下' },
  { label: '50-200人', value: '50-200人' },
  { label: '200-500人', value: '200-500人' },
  { label: '500人以上', value: '500人以上' },
];

const VERIFICATION_FILTER_OPTIONS = [
  { label: '全部', value: '全部' },
  { label: '已认证', value: 'verified' },
  { label: '待认证', value: 'pending' },
  { label: '未认证', value: 'unverified' },
];

const TOWNSHIP_LIFESTYLE: Record<TownshipCode, { housing: string; traffic: string; schools: string }> = {
  [TownshipCode.SQ]: { housing: '均价1.2万/㎡', traffic: '地铁1/2号线', schools: '25所中小学' },
  [TownshipCode.DQ]: { housing: '均价1.8万/㎡', traffic: '地铁1/6号线', schools: '32所中小学' },
  [TownshipCode.XQ]: { housing: '均价1.1万/㎡', traffic: '地铁3号线', schools: '18所中小学' },
  [TownshipCode.NQ]: { housing: '均价1.0万/㎡', traffic: '地铁4号线', schools: '15所中小学' },
  [TownshipCode.WGS]: { housing: '均价0.9万/㎡', traffic: '多条公交线路', schools: '8所中小学' },
  [TownshipCode.XL]: { housing: '均价0.8万/㎡', traffic: '地铁2号线', schools: '28所中小学' },
  [TownshipCode.GZ]: { housing: '均价0.9万/㎡', traffic: '城际轻轨古镇站', schools: '20所中小学' },
  [TownshipCode.DS]: { housing: '均价0.7万/㎡', traffic: '多条公交线路', schools: '15所中小学' },
  [TownshipCode.DF]: { housing: '均价0.8万/㎡', traffic: '广珠西线高速', schools: '12所中小学' },
  [TownshipCode.FS]: { housing: '均价0.6万/㎡', traffic: '广珠西线高速', schools: '9所中小学' },
  [TownshipCode.HP]: { housing: '均价0.8万/㎡', traffic: '广珠轻轨黄圃站', schools: '18所中小学' },
  [TownshipCode.NT]: { housing: '均价0.9万/㎡', traffic: '广珠轻轨南头站', schools: '14所中小学' },
  [TownshipCode.SJ]: { housing: '均价0.7万/㎡', traffic: '京珠高速', schools: '12所中小学' },
  [TownshipCode.MZ]: { housing: '均价0.6万/㎡', traffic: '省道S111', schools: '10所中小学' },
  [TownshipCode.NL]: { housing: '均价1.0万/㎡', traffic: '翠亨快线', schools: '13所中小学' },
  [TownshipCode.GK]: { housing: '均价0.9万/㎡', traffic: '中江高速', schools: '14所中小学' },
  [TownshipCode.SX]: { housing: '均价0.7万/㎡', traffic: '105国道', schools: '22所中小学' },
  [TownshipCode.DC]: { housing: '均价0.7万/㎡', traffic: '105国道', schools: '13所中小学' },
  [TownshipCode.BF]: { housing: '均价0.6万/㎡', traffic: '105国道', schools: '11所中小学' },
  [TownshipCode.SX2]: { housing: '均价0.9万/㎡', traffic: '广珠公路', schools: '20所中小学' },
  [TownshipCode.TZ]: { housing: '均价1.1万/㎡', traffic: '广珠西线高速', schools: '23所中小学' },
  [TownshipCode.SW]: { housing: '均价0.7万/㎡', traffic: '神湾大道', schools: '7所中小学' },
  [TownshipCode.HL]: { housing: '均价0.8万/㎡', traffic: '横栏快线', schools: '18所中小学' },
  [TownshipCode.ZG]: { housing: '均价1.3万/㎡', traffic: '中山港客运码头', schools: '26所中小学' },
  [TownshipCode.CH]: { housing: '均价1.5万/㎡', traffic: '翠亨快线', schools: '12所中小学' },
};

const formatDateTime = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const matchScaleFilter = (scale: string, filter: string): boolean => {
  if (filter === '全部') return true;
  const scaleNum = parseInt(scale.replace(/[^0-9]/g, '')) || 0;
  switch (filter) {
    case '50人以下': return scaleNum < 50;
    case '50-200人': return scaleNum >= 50 && scaleNum <= 200;
    case '200-500人': return scaleNum > 200 && scaleNum <= 500;
    case '500人以上': return scaleNum > 500;
    default: return true;
  }
};

function Township() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mockData = useMemo(() => generateMockData(), []);
  const [hoveredTownship, setHoveredTownship] = useState<TownshipCode | null>(null);
  const [highlightedTownship, setHighlightedTownship] = useState<TownshipCode | null>(null);
  const [activeTab, setActiveTab] = useState<'jobs' | 'enterprises'>('jobs');
  const [expandedTownship, setExpandedTownship] = useState<TownshipCode | null>(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPosition | null>(null);
  const [dataUpdateTime] = useState(() => formatDateTime(new Date()));

  const [scaleFilter, setScaleFilter] = useState<string>('全部');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('全部');
  const [industryFilters, setIndustryFilters] = useState<IndustryTag[]>([]);
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 30]);

  const [experienceFilter, setExperienceFilter] = useState<string>('全部');
  const [educationFilter, setEducationFilter] = useState<string>('全部');

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const urlTownship = searchParams.get('township') as TownshipCode | null;

  useEffect(() => {
    if (urlTownship) {
      setHighlightedTownship(urlTownship);
      setExpandedTownship(urlTownship);
      setActiveTab('jobs');

      setTimeout(() => {
        const cardEl = cardRefs.current[urlTownship];
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);

      setTimeout(() => {
        setHighlightedTownship(null);
      }, 3000);
    }
  }, [urlTownship]);

  const getTownshipEnterprises = useCallback((townshipCode: TownshipCode) => {
    return mockData.enterprises.filter((e) => e.township === townshipCode);
  }, [mockData.enterprises]);

  const getTownshipPositions = useCallback((townshipCode: TownshipCode) => {
    return mockData.positions.filter((p) => p.township === townshipCode);
  }, [mockData.positions]);

  const getTownshipStats = useCallback((townshipCode: TownshipCode) => {
    const enterprises = getTownshipEnterprises(townshipCode);
    const positions = getTownshipPositions(townshipCode);
    return {
      verifiedEnterprises: enterprises.filter(e => e.verificationStatus === 'verified').length,
      attributedPositions: positions.filter(p => p.townshipVerification?.overallResult).length,
      totalEnterprises: enterprises.length,
      totalPositions: positions.length,
    };
  }, [getTownshipEnterprises, getTownshipPositions]);

  const filterEnterprises = useCallback((enterprises: Enterprise[]) => {
    return enterprises.filter((e) => {
      if (!matchScaleFilter(e.scale, scaleFilter)) return false;
      if (verifiedFilter !== '全部' && e.verificationStatus !== verifiedFilter) return false;
      if (industryFilters.length > 0 && !industryFilters.includes(e.industry)) return false;
      return true;
    });
  }, [scaleFilter, verifiedFilter, industryFilters]);

  const filterPositions = useCallback((positions: JobPosition[]) => {
    return positions.filter((p) => {
      const minK = p.salaryMin / 1000;
      const maxK = p.salaryMax / 1000;
      if (maxK < salaryRange[0] || minK > salaryRange[1]) return false;
      if (experienceFilter !== '全部' && p.experience !== experienceFilter) return false;
      if (educationFilter !== '全部' && p.education !== educationFilter) return false;
      return true;
    });
  }, [salaryRange, experienceFilter, educationFilter]);

  const handleTownshipClick = (township: TownshipData) => {
    setExpandedTownship(expandedTownship === township.code ? null : township.code);
    setSearchParams({ township: township.code });
  };

  const handleAuthClick = (enterprise: Enterprise) => {
    setSelectedEnterprise(enterprise);
    setAuthModalVisible(true);
  };

  const handleVerifyClick = (job: JobPosition) => {
    setSelectedJob(job);
    setVerifyModalVisible(true);
  };

  const clearAllFilters = () => {
    setScaleFilter('全部');
    setVerifiedFilter('全部');
    setIndustryFilters([]);
    setSalaryRange([0, 30]);
    setExperienceFilter('全部');
    setEducationFilter('全部');
  };

  const unifiedStats = mockData.unifiedStats;
  const townshipStats = {
    totalTownships: unifiedStats.totalTownships,
    totalJobs: unifiedStats.totalJobs,
    totalEnterprises: unifiedStats.totalEnterprises,
    totalPopulation: unifiedStats.totalPopulation,
    certifiedEnterprises: unifiedStats.certifiedEnterprises,
    hotTownships: unifiedStats.hotTownships,
  };
  const townshipJobCounts = useMemo(() => {
    const counts: Record<string, { enterprises: number; jobs: number }> = {};
    unifiedStats.townshipStats.forEach((t) => {
      counts[t.code] = {
        enterprises: t.enterpriseCount,
        jobs: t.jobCount,
      };
    });
    return counts;
  }, [unifiedStats.townshipStats]);

  const industryDistribution = useMemo(() => {
    const counts: Record<IndustryTag, number> = {} as Record<IndustryTag, number>;
    Object.values(IndustryTag).forEach((tag) => {
      counts[tag as IndustryTag] = 0;
    });
    TOWNSHIPS.forEach((t) => {
      Object.entries(t.enterpriseWeight).forEach(([tag, weight]) => {
        counts[tag as IndustryTag] += weight * t.openEnterpriseCount;
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value: Math.floor(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, []);

  const SCALE_ORDER: Record<string, number> = {
    '20人以下': 1,
    '20-99人': 2,
    '100-499人': 3,
    '500-999人': 4,
    '1000-9999人': 5,
    '10000人以上': 6,
  };

  const leadingEnterprises = useMemo(() => {
    const map: Record<string, string[]> = {};
    TOWNSHIPS.forEach((t) => {
      const townshipEnterprises = mockData.enterprises
        .filter((e) => e.township === t.code)
        .sort((a, b) => (SCALE_ORDER[b.scale] || 0) - (SCALE_ORDER[a.scale] || 0))
        .slice(0, 3)
        .map((e) => e.name);
      if (townshipEnterprises.length >= 3) {
        map[t.code] = townshipEnterprises;
      } else {
        const fallback = mockData.enterprises
          .sort(() => Math.random() - 0.5)
          .slice(0, 3 - townshipEnterprises.length)
          .map((e) => e.name);
        map[t.code] = [...townshipEnterprises, ...fallback];
      }
    });
    return map;
  }, [mockData.enterprises]); // eslint-disable-line react-hooks/exhaustive-deps

  const heatLevels = useMemo(() => {
    const maxJobs = Math.max(...Object.values(townshipJobCounts).map((c) => c.jobs));
    return (code: string) => {
      const jobs = townshipJobCounts[code]?.jobs || 0;
      const ratio = jobs / maxJobs;
      if (ratio > 0.8) return { level: '极高', color: 'bg-industrial-blue-600', text: 'text-white', ring: 'ring-industrial-blue-400' };
      if (ratio > 0.6) return { level: '高', color: 'bg-industrial-blue-500', text: 'text-white', ring: 'ring-industrial-blue-300' };
      if (ratio > 0.4) return { level: '中高', color: 'bg-industrial-blue-400', text: 'text-white', ring: 'ring-industrial-blue-200' };
      if (ratio > 0.2) return { level: '中', color: 'bg-vital-orange-400', text: 'text-white', ring: 'ring-vital-orange-300' };
      return { level: '一般', color: 'bg-vital-orange-200', text: 'text-vital-orange-800', ring: 'ring-vital-orange-200' };
    };
  }, [townshipJobCounts]);

  const sortedTownships = useMemo(() => {
    return [...TOWNSHIPS].sort(
      (a, b) => (townshipJobCounts[b.code]?.jobs || 0) - (townshipJobCounts[a.code]?.jobs || 0)
    );
  }, [townshipJobCounts]);

  const totalStats = {
    totalJobs: unifiedStats.totalJobs,
    totalEnterprises: unifiedStats.totalEnterprises,
    certifiedEnterprises: unifiedStats.certifiedEnterprises,
    totalPopulation: unifiedStats.totalPopulation,
  };

  const getVerificationItems = (job: JobPosition | null) => {
    if (!job?.townshipVerification) return [];
    const townshipName = job.townshipName || '';
    return [
      { label: '企业注册地校验', pass: job.townshipVerification.registrationAddress, desc: `注册地位于 ${townshipName}` },
      { label: '税务登记地校验', pass: job.townshipVerification.taxRegistration, desc: `税务登记属于 ${townshipName}` },
      { label: '社保缴纳地校验', pass: job.townshipVerification.socialInsurance, desc: `员工社保缴纳在 ${townshipName}` },
      { label: '岗位实际工作地校验', pass: job.townshipVerification.workLocation, desc: `工作地点位于 ${townshipName}` },
    ];
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-industrial-blue-600 via-industrial-blue-500 to-industrial-blue-600 rounded-2xl p-6 text-white shadow-industrial-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">🗺️ 中山市镇街招聘专区</h1>
            <p className="text-industrial-blue-100">覆盖全市 {townshipStats.totalTownships} 个镇街，精准对接产业集群与人才需求</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm">
            <MapPin size={18} className="text-vital-orange-400" />
            <span>中山市全域招聘地图</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatsCard
            title="在招职位"
            value={totalStats.totalJobs}
            suffix="个"
            theme="blue"
            icon={<Briefcase size={20} />}
            trend={18}
          />
          <StatsCard
            title="在招企业"
            value={totalStats.totalEnterprises}
            suffix="家"
            theme="orange"
            icon={<Building2 size={20} />}
            trend={12}
          />
          <StatsCard
            title="认证企业"
            value={totalStats.certifiedEnterprises}
            suffix="家"
            theme="green"
            icon={<Building2 size={20} />}
            trend={9}
          />
          <StatsCard
            title="覆盖镇街"
            value={townshipStats.totalTownships}
            unit="个"
            theme="cyan"
            icon={<MapPin size={20} />}
            suffix="全市"
          />
          <StatsCard
            title="服务人口"
            value={Math.floor(totalStats.totalPopulation / 10000)}
            suffix="万人"
            theme="purple"
            icon={<GraduationCap size={20} />}
          />
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-industrial-blue-200">
          <div className="flex items-center gap-1">
            <RefreshCw size={12} className="animate-spin" style={{ animationDuration: '3s' }} />
            <span>数据更新于 {dataUpdateTime}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>已认证企业 {totalStats.certifiedEnterprises} 家</span>
            <span>·</span>
            <span>岗位归属校验覆盖率 92%</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <Card
            className="rounded-2xl shadow-industrial-sm h-full"
            title={
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <span>镇街产业分布</span>
              </div>
            }
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={industryDistribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {industryDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={INDUSTRY_COLORS[entry.name as IndustryTag] || '#999'}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(22,93,255,0.15)' }}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-sm text-gray-700">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-industrial-blue-600"></div>
                <span className="text-xs text-gray-600">高新技术</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-vital-orange-500"></div>
                <span className="text-xs text-gray-600">传统制造</span>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card
            className="rounded-2xl shadow-industrial-sm h-full"
            title={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔥</span>
                  <span>招聘热度地图</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-500">热度：</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-3 rounded bg-vital-orange-200"></div>
                    <span className="text-gray-500">一般</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-3 rounded bg-vital-orange-400"></div>
                    <span className="text-gray-500">中</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-3 rounded bg-industrial-blue-400"></div>
                    <span className="text-gray-500">中高</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-3 rounded bg-industrial-blue-600"></div>
                    <span className="text-gray-500">极高</span>
                  </div>
                </div>
              </div>
            }
          >
            <div className="grid grid-cols-5 gap-3">
              {TOWNSHIPS.map((township, idx) => {
                const heat = heatLevels(township.code);
                const counts = townshipJobCounts[township.code];
                const isHovered = hoveredTownship === township.code;
                return (
                  <Tooltip
                    key={township.code}
                    title={
                      <div className="text-sm space-y-1">
                        <div className="font-bold">{township.name}</div>
                        <div>招聘热度：<span className="text-vital-orange-400">{heat.level}</span></div>
                        <div>在招企业：{counts.enterprises} 家</div>
                        <div>在招职位：{counts.jobs} 个</div>
                      </div>
                    }
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: idx * 0.02 }}
                      whileHover={{ scale: 1.08, y: -3 }}
                      onMouseEnter={() => setHoveredTownship(township.code)}
                      onMouseLeave={() => setHoveredTownship(null)}
                      onClick={() => handleTownshipClick(township)}
                      className={cn(
                        'cursor-pointer rounded-xl p-3 transition-all ring-2 ring-transparent',
                        heat.color,
                        heat.text,
                        isHovered ? heat.ring : 'ring-transparent'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm truncate">{township.name}</span>
                        {isHovered && <ChevronRight size={14} />}
                      </div>
                      <div className="text-xs opacity-90 flex items-center gap-1">
                        <Briefcase size={11} />
                        <span>{counts.jobs}个职位</span>
                      </div>
                      <div className="text-xs opacity-75 flex items-center gap-1">
                        <Building2 size={11} />
                        <span>{counts.enterprises}家企业</span>
                      </div>
                    </motion.div>
                  </Tooltip>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card
          className="rounded-2xl shadow-industrial-sm"
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏙️</span>
                <span>镇街详情</span>
                <Tag color="blue" className="ml-2">共 {TOWNSHIPS.length} 个</Tag>
              </div>
              <span className="text-sm text-gray-500">按招聘热度排序</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedTownships.map((township, idx) => {
              const heat = heatLevels(township.code);
              const counts = townshipJobCounts[township.code];
              const lifestyle = TOWNSHIP_LIFESTYLE[township.code];
              const leaders = leadingEnterprises[township.code] || [];
              const isExpanded = expandedTownship === township.code;
              const isHighlighted = highlightedTownship === township.code;
              const townshipEnterprises = getTownshipEnterprises(township.code);
              const townshipPositions = getTownshipPositions(township.code);
              const filteredEnterprises = filterEnterprises(townshipEnterprises);
              const filteredPositions = filterPositions(townshipPositions);
              const stats = getTownshipStats(township.code);

              return (
                <motion.div
                  key={township.code}
                  ref={(el) => { cardRefs.current[township.code] = el; }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.03 }}
                  whileHover={{ y: -5 }}
                  className={cn(
                    'transition-all duration-500',
                    isHighlighted && 'ring-4 ring-industrial-blue-400 ring-opacity-60 rounded-2xl animate-pulse'
                  )}
                >
                  <Card
                    className={cn(
                      'h-full rounded-xl hover:shadow-industrial-md transition-all duration-300 cursor-pointer border',
                      isExpanded ? 'border-industrial-blue-400 shadow-industrial-md' : 'border-gray-100',
                      isHighlighted && 'bg-industrial-blue-50/30'
                    )}
                    onClick={() => handleTownshipClick(township)}
                    styles={{ body: { padding: 0 } }}
                  >
                    <div className={cn('h-1.5 rounded-t-xl', heat.color)}></div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-gray-800">{township.name}</h3>
                            <Tag
                              color={heat.level === '极高' || heat.level === '高' ? 'red' : heat.level === '中高' ? 'blue' : heat.level === '中' ? 'orange' : 'default'}
                              icon={<Flame size={11} />}
                              className="!mr-0"
                            >
                              {heat.level}热度
                            </Tag>
                            {isHighlighted && (
                              <Tag color="blue" className="!mr-0">
                                定位中
                              </Tag>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2">{township.description}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {township.industryTags.map((tag) => (
                          <Tag
                            key={tag}
                            className="!border-0 !mb-0"
                            style={{
                              backgroundColor: `${INDUSTRY_COLORS[tag]}15`,
                              color: INDUSTRY_COLORS[tag],
                              borderRadius: '6px',
                            }}
                          >
                            <span className="inline-flex items-center gap-1">
                              {INDUSTRY_ICONS[tag]}
                              <span className="text-xs">{tag}</span>
                            </span>
                          </Tag>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-industrial-blue-50/60 rounded-lg px-2.5 py-2">
                          <div className="flex items-center gap-1 text-industrial-blue-600 text-xs mb-0.5">
                            <Briefcase size={11} />
                            <span>在招职位</span>
                          </div>
                          <div className="text-base font-bold text-industrial-blue-700">
                            {counts.jobs}
                            <span className="text-xs font-normal text-industrial-blue-500 ml-1">
                              (属地归属 {stats.attributedPositions} 个)
                            </span>
                          </div>
                        </div>
                        <div className="bg-vital-orange-50/60 rounded-lg px-2.5 py-2">
                          <div className="flex items-center gap-1 text-vital-orange-600 text-xs mb-0.5">
                            <Building2 size={11} />
                            <span>在招企业</span>
                          </div>
                          <div className="text-base font-bold text-vital-orange-700">
                            {counts.enterprises}
                            <span className="text-xs font-normal text-vital-orange-500 ml-1">
                              (已认证 {stats.verifiedEnterprises} 家)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                          <span>🏢</span>
                          <span>龙头企业</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {leaders.map((name, i) => (
                            <span
                              key={i}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded truncate max-w-full"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-2.5 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Home size={12} className="text-gray-400" />
                          <span className="text-gray-500 w-10">住房</span>
                          <span className="font-medium">{lifestyle.housing}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Bus size={12} className="text-gray-400" />
                          <span className="text-gray-500 w-10">交通</span>
                          <span className="font-medium">{lifestyle.traffic}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <GraduationCap size={12} className="text-gray-400" />
                          <span className="text-gray-500 w-10">教育</span>
                          <span className="font-medium">{lifestyle.schools}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <RefreshCw size={10} />
                          <span>更新于 {dataUpdateTime}</span>
                        </div>
                      </div>

                      <Button
                        type="primary"
                        size="small"
                        block
                        className="mt-3 h-9 !rounded-lg !bg-industrial-blue-600 hover:!bg-industrial-blue-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTownshipClick(township);
                        }}
                      >
                        {isExpanded ? '收起详情' : '查看镇街职位'}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Filter size={16} className="text-industrial-blue-600" />
                              <span className="text-sm font-medium text-gray-700">筛选条件</span>
                            </div>
                            <Button
                              type="link"
                              size="small"
                              className="!text-xs !text-gray-500"
                              onClick={clearAllFilters}
                            >
                              重置
                            </Button>
                          </div>
                          <Tabs
                            activeKey={activeTab}
                            onChange={(key) => setActiveTab(key as 'jobs' | 'enterprises')}
                            items={[
                              {
                                key: 'jobs',
                                label: (
                                  <span className="text-sm">
                                    <Briefcase size={14} className="inline mr-1" />
                                    在招职位 ({filteredPositions.length})
                                  </span>
                                ),
                              },
                              {
                                key: 'enterprises',
                                label: (
                                  <span className="text-sm">
                                    <Building2 size={14} className="inline mr-1" />
                                    入驻企业 ({filteredEnterprises.length})
                                  </span>
                                ),
                              },
                            ]}
                          />
                        </div>

                        {activeTab === 'enterprises' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 space-y-3"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">企业规模</label>
                                <Select
                                  value={scaleFilter}
                                  onChange={setScaleFilter}
                                  size="small"
                                  className="w-full"
                                >
                                  {SCALE_OPTIONS.map(opt => (
                                    <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                                  ))}
                                </Select>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">属地认证</label>
                                <Select
                                  value={verifiedFilter}
                                  onChange={setVerifiedFilter}
                                  size="small"
                                  className="w-full"
                                >
                                  {VERIFICATION_FILTER_OPTIONS.map(opt => (
                                    <Select.Option key={opt.value} value={opt.value}>
                                      <span className="inline-flex items-center gap-1">
                                        {opt.value === 'verified' && <ShieldCheck size={12} className="text-success-500" />}
                                        {opt.value === 'pending' && <Clock size={12} className="text-gray-400" />}
                                        {opt.value === 'unverified' && <ShieldX size={12} className="text-gray-400" />}
                                        {opt.label}
                                      </span>
                                    </Select.Option>
                                  ))}
                                </Select>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">行业筛选</label>
                                <Select
                                  mode="multiple"
                                  value={industryFilters}
                                  onChange={(val) => setIndustryFilters(val as IndustryTag[])}
                                  placeholder="选择行业"
                                  size="small"
                                  className="w-full"
                                  maxTagCount={2}
                                >
                                  {Object.values(IndustryTag).map((tag) => (
                                    <Select.Option key={tag} value={tag}>
                                      <span className="inline-flex items-center gap-1">
                                        {INDUSTRY_ICONS[tag]}
                                        {tag}
                                      </span>
                                    </Select.Option>
                                  ))}
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                              <AnimatePresence mode="popLayout">
                                {filteredEnterprises.length > 0 ? (
                                  filteredEnterprises.slice(0, 6).map((enterprise, idx) => (
                                    <motion.div
                                      key={enterprise.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      transition={{ delay: idx * 0.05 }}
                                      layout
                                    >
                                      <EnterpriseCard
                                        key={enterprise.id}
                                        enterprise={enterprise}
                                        onClick={() => handleAuthClick(enterprise)}
                                        onAuthClick={handleAuthClick}
                                      />
                                    </motion.div>
                                  ))
                                ) : (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="col-span-full py-8 text-center text-gray-400"
                                  >
                                    <Building2 size={32} className="mx-auto mb-2 opacity-40" />
                                    <p>暂无符合条件的企业</p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            {filteredEnterprises.length > 6 && (
                              <div className="text-center mt-2">
                                <Button type="link" size="small">
                                  查看全部 {filteredEnterprises.length} 家企业 <ChevronRight size={12} />
                                </Button>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {activeTab === 'jobs' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 space-y-3"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="sm:col-span-3">
                                <label className="text-xs text-gray-500 mb-1 block flex items-center justify-between">
                                  <span>薪资范围</span>
                                  <span className="text-industrial-blue-600 font-medium">
                                    {salaryRange[0]}K - {salaryRange[1] >= 30 ? '30K+' : `${salaryRange[1]}K`}
                                  </span>
                                </label>
                                <Slider
                                  range
                                  min={0}
                                  max={30}
                                  step={1}
                                  value={salaryRange}
                                  onChange={(val) => setSalaryRange(val as [number, number])}
                                  tooltip={{
                                    formatter: (val) => `${val}K`,
                                  }}
                                  marks={{
                                    0: '0K',
                                    5: '5K',
                                    10: '10K',
                                    15: '15K',
                                    20: '20K',
                                    25: '25K',
                                    30: '30K+',
                                  }}
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">经验要求</label>
                                <Select
                                  value={experienceFilter}
                                  onChange={setExperienceFilter}
                                  size="small"
                                  className="w-full"
                                >
                                  <Select.Option value="全部">全部</Select.Option>
                                  <Select.Option value="不限">不限</Select.Option>
                                  <Select.Option value="应届生">应届生</Select.Option>
                                  <Select.Option value="1-3年">1-3年</Select.Option>
                                  <Select.Option value="3-5年">3-5年</Select.Option>
                                  <Select.Option value="5-10年">5-10年</Select.Option>
                                  <Select.Option value="10年以上">10年以上</Select.Option>
                                </Select>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">学历要求</label>
                                <Select
                                  value={educationFilter}
                                  onChange={setEducationFilter}
                                  size="small"
                                  className="w-full"
                                >
                                  <Select.Option value="全部">全部</Select.Option>
                                  <Select.Option value="不限">不限</Select.Option>
                                  <Select.Option value="高中">高中</Select.Option>
                                  <Select.Option value="中专">中专</Select.Option>
                                  <Select.Option value="大专">大专</Select.Option>
                                  <Select.Option value="本科">本科</Select.Option>
                                  <Select.Option value="硕士">硕士</Select.Option>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                              <AnimatePresence mode="popLayout">
                                {filteredPositions.length > 0 ? (
                                  filteredPositions.slice(0, 6).map((position, idx) => (
                                    <motion.div
                                      key={position.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      transition={{ delay: idx * 0.05 }}
                                      layout
                                    >
                                      <JobCard
                                        key={position.id}
                                        job={position}
                                        onVerifyClick={handleVerifyClick}
                                      />
                                    </motion.div>
                                  ))
                                ) : (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="col-span-full py-8 text-center text-gray-400"
                                  >
                                    <Briefcase size={32} className="mx-auto mb-2 opacity-40" />
                                    <p>暂无符合条件的职位</p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            {filteredPositions.length > 6 && (
                              <div className="text-center mt-2">
                                <Button type="link" size="small">
                                  查看全部 {filteredPositions.length} 个职位 <ChevronRight size={12} />
                                </Button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      <AnimatePresence>
        {authModalVisible && selectedEnterprise && (
          <Modal
            title={
              <div className="flex items-center gap-2">
                {selectedEnterprise.verificationStatus === 'verified' ? (
                  <ShieldCheck size={20} className="text-success-500" />
                ) : selectedEnterprise.verificationStatus === 'pending' ? (
                  <Clock size={20} className="text-gray-400" />
                ) : (
                  <ShieldX size={20} className="text-gray-400" />
                )}
                <span>企业属地认证信息</span>
              </div>
            }
            open={authModalVisible}
            onCancel={() => setAuthModalVisible(false)}
            footer={[
              <Button key="close" onClick={() => setAuthModalVisible(false)}>
                关闭
              </Button>,
            ]}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 rounded-xl bg-industrial-gradient flex items-center justify-center text-white text-2xl font-bold"
                >
                  {selectedEnterprise.name.charAt(0)}
                </motion.div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{selectedEnterprise.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Tag
                      color={selectedEnterprise.verificationStatus === 'verified' ? 'success' : 'default'}
                      icon={selectedEnterprise.verificationStatus === 'verified' ? <ShieldCheck size={12} /> : selectedEnterprise.verificationStatus === 'pending' ? <Clock size={12} /> : <ShieldX size={12} />}
                    >
                      {selectedEnterprise.verificationStatus === 'verified' ? '已通过属地认证' : selectedEnterprise.verificationStatus === 'pending' ? '认证审核中' : '未认证'}
                    </Tag>
                  </div>
                </div>
              </div>

              <List
                size="small"
                dataSource={[
                  { label: '营业执照编号', value: selectedEnterprise.verificationDetail?.licenseNo || selectedEnterprise.licenseNo },
                  { label: '法定代表人', value: selectedEnterprise.verificationDetail?.legalRepresentative || selectedEnterprise.legalRepresentative },
                  { label: '成立年份', value: `${selectedEnterprise.establishedYear}年` },
                  { label: '注册资本', value: selectedEnterprise.registeredCapital ? `${selectedEnterprise.registeredCapital}万元` : '未披露' },
                  ...(selectedEnterprise.verificationDetail ? [
                    { label: '属地认证编号', value: selectedEnterprise.verificationDetail.verificationNo },
                    { label: '认证有效期', value: selectedEnterprise.verificationDetail.validUntil },
                  ] : []),
                  { label: '企业规模', value: selectedEnterprise.scale },
                  { label: '所属行业', value: selectedEnterprise.industry },
                  { label: '所在镇街', value: TOWNSHIPS.find(t => t.code === selectedEnterprise.township)?.name || selectedEnterprise.township },
                  { label: '认证时间', value: selectedEnterprise.verifiedAt ? new Date(selectedEnterprise.verifiedAt).toLocaleDateString() : '未认证' },
                  { label: '入驻时间', value: new Date(selectedEnterprise.createdAt).toLocaleDateString() },
                ]}
                renderItem={(item, index) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <List.Item className="px-0">
                      <span className="text-gray-500 text-sm w-28 flex-shrink-0">{item.label}</span>
                      <span className="text-gray-800 text-sm font-mono-num">{item.value}</span>
                    </List.Item>
                  </motion.div>
                )}
              />

              {selectedEnterprise.verificationStatus === 'unverified' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700"
                >
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <XCircle size={16} className="text-amber-500" />
                    <span>认证说明</span>
                  </div>
                  <p className="text-xs text-amber-600">
                    该企业尚未完成属地认证，建议求职时谨慎核实企业信息。认证企业需提供营业执照、法人身份证明等材料，经平台审核通过后方可获得认证标识。
                  </p>
                </motion.div>
              )}

              {selectedEnterprise.verificationStatus === 'pending' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700"
                >
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <Clock size={16} className="text-blue-500" />
                    <span>认证审核中</span>
                  </div>
                  <p className="text-xs text-blue-600">
                    该企业已提交认证申请，正在审核中。审核通过后将获得属地认证标识，招聘信息将被标记为可信。
                  </p>
                </motion.div>
              )}

              {selectedEnterprise.verificationStatus === 'verified' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-success-50 border border-success-200 rounded-lg p-3 text-sm text-success-700"
                >
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <CheckCircle2 size={16} className="text-success-500" />
                    <span>认证保障</span>
                  </div>
                  <p className="text-xs text-success-600">
                    该企业已通过中山市人力资源和社会保障局属地认证，招聘信息真实可信。求职过程中如遇问题，可向平台投诉维权。
                  </p>
                </motion.div>
              )}
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {verifyModalVisible && selectedJob && (
          <Modal
            title={
              <div className="flex items-center gap-2">
                {selectedJob.townshipVerification?.overallResult ? (
                  <ShieldCheck size={20} className="text-success-500" />
                ) : (
                  <ShieldX size={20} className="text-gray-400" />
                )}
                <span>岗位归属镇街校验</span>
              </div>
            }
            open={verifyModalVisible}
            onCancel={() => setVerifyModalVisible(false)}
            footer={[
              <Button key="close" onClick={() => setVerifyModalVisible(false)}>
                关闭
              </Button>,
            ]}
            width={520}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="w-12 h-12 rounded-xl bg-industrial-gradient flex items-center justify-center text-white text-xl font-bold"
                >
                  {selectedJob.title.charAt(0)}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{selectedJob.title}</h3>
                  <p className="text-sm text-gray-500 truncate">{selectedJob.enterpriseName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Tag
                      color={selectedJob.townshipVerification?.overallResult ? 'success' : 'default'}
                      icon={selectedJob.townshipVerification?.overallResult ? <ShieldCheck size={12} /> : <ShieldX size={12} />}
                      className="!mb-0"
                    >
                      {selectedJob.townshipName}属地岗位
                    </Tag>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {getVerificationItems(selectedJob).map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {item.pass ? (
                        <CheckCircle2 size={18} className="text-success-500" />
                      ) : (
                        <XCircle size={18} className="text-danger-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{item.label}</span>
                        {item.pass ? (
                          <span className="text-xs text-success-600">✅ {item.desc}</span>
                        ) : (
                          <span className="text-xs text-danger-600">❌ {item.desc.replace('位于', '不位于').replace('属于', '不属于').replace('在', '不在')}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={cn(
                  'rounded-lg p-4 text-sm',
                  selectedJob.townshipVerification?.overallResult
                    ? 'bg-success-50 border border-success-200 text-success-700'
                    : 'bg-amber-50 border border-amber-200 text-amber-700'
                )}
              >
                <div className="flex items-center gap-2 font-medium mb-1">
                  {selectedJob.townshipVerification?.overallResult ? (
                    <CheckCircle2 size={18} className="text-success-500" />
                  ) : (
                    <XCircle size={18} className="text-amber-500" />
                  )}
                  <span>综合校验结果</span>
                </div>
                <p className={cn('text-xs', selectedJob.townshipVerification?.overallResult ? 'text-success-600' : 'text-amber-600')}>
                  {selectedJob.townshipVerification?.overallResult
                    ? `✅ 该岗位归属 ${selectedJob.townshipName}，可享受镇街就业补贴政策`
                    : `⚠️ 该岗位不完全归属 ${selectedJob.townshipName}，需进一步核实岗位信息`}
                </p>
                {selectedJob.townshipVerification?.subsidyEligible && (
                  <p className="text-xs text-success-600 mt-1">
                    💰 企业可申请镇街吸纳就业补贴、社保补贴等政策支持
                  </p>
                )}
              </motion.div>

              <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
                数据来源：中山市人力资源和社会保障局 · 镇街人社分局
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Township;
