import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  GraduationCap,
  Wrench,
  HardHat,
  BookOpen,
  GraduationCap as CampusIcon,
  TrendingUp,
  Building2,
  ChevronRight,
  Factory,
} from 'lucide-react';
import { Input, Select, Tag, Button, Tooltip } from 'antd';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { generateMockData } from '@/mock/data';
import { TOWNSHIPS, getTownshipByCode } from '@/mock/townships';
import { TownshipCode, IndustryTag, JobSeekerType } from '@shared/types';
import JobCard from '@/components/common/JobCard';
import StatsCard from '@/components/common/StatsCard';
import TownshipTag from '@/components/common/TownshipTag';
import MatchScoreRing from '@/components/common/MatchScoreRing';
import { cn } from '@/lib/utils';

const { Option } = Select;

const QUICK_ENTRIES = [
  {
    key: 'skilled',
    title: '技工专区',
    desc: '高薪技术岗位',
    icon: <Wrench size={28} />,
    color: 'from-industrial-blue-500 to-industrial-blue-600',
    bg: 'bg-industrial-blue-50',
    iconBg: 'bg-industrial-blue-100',
    iconColor: 'text-industrial-blue-600',
  },
  {
    key: 'graduate',
    title: '应届生专区',
    desc: '校招专属岗位',
    icon: <GraduationCap size={28} />,
    color: 'from-vital-orange-500 to-vital-orange-600',
    bg: 'bg-vital-orange-50',
    iconBg: 'bg-vital-orange-100',
    iconColor: 'text-vital-orange-600',
  },
  {
    key: 'bluecollar',
    title: '蓝领普工',
    desc: '大量基础岗位',
    icon: <HardHat size={28} />,
    color: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    key: 'education',
    title: '学历提升',
    desc: '职业技能培训',
    icon: <BookOpen size={28} />,
    color: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    key: 'campus',
    title: '校园招聘会',
    desc: '近期宣讲会',
    icon: <CampusIcon size={28} />,
    color: 'from-cyan-500 to-cyan-600',
    bg: 'bg-cyan-50',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
];

const INDUSTRY_ICONS: Record<IndustryTag, React.ReactNode> = {
  [IndustryTag.HARDWARE]: <Wrench size={12} />,
  [IndustryTag.LIGHTING]: '💡',
  [IndustryTag.CASUALWEAR]: '👕',
  [IndustryTag.FURNITURE]: '🛋️',
  [IndustryTag.ELECTRONICS]: '⚡',
  [IndustryTag.MACHINERY]: <Factory size={12} />,
  [IndustryTag.APPLIANCE]: <Building2 size={12} />,
  [IndustryTag.FOOD]: '🍜',
  [IndustryTag.NEWENERGY]: <TrendingUp size={12} />,
  [IndustryTag.ROBOTICS]: '🤖',
};

function Home() {
  const navigate = useNavigate();
  const mockData = useMemo(() => generateMockData(), []);
  const [searchText, setSearchText] = useState('');
  const [selectedTownship, setSelectedTownship] = useState<TownshipCode | undefined>();
  const [selectedJobType, setSelectedJobType] = useState<JobSeekerType | undefined>();

  const townshipJobCounts = useMemo(() => {
    const counts: Record<string, { enterprises: number; jobs: number }> = {};
    TOWNSHIPS.forEach((t) => {
      counts[t.code] = {
        enterprises: t.openEnterpriseCount,
        jobs: Math.floor(t.openEnterpriseCount * (5 + Math.random() * 10)),
      };
    });
    return counts;
  }, []);

  const recommendedJobs = useMemo(() => {
    const shuffled = [...mockData.positions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 9).map((job) => ({
      ...job,
      matchScore: Math.floor(70 + Math.random() * 28),
    }));
  }, [mockData.positions]);

  const trendData = useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
    return months.map((month, idx) => ({
      month,
      热度: 800 + Math.floor(Math.random() * 600) + idx * 50,
      投递: 300 + Math.floor(Math.random() * 300) + idx * 30,
    }));
  }, []);

  const totalStats = useMemo(() => {
    const totalJobs = mockData.positions.length;
    const totalEnterprises = mockData.enterprises.length;
    const totalSeekers = mockData.jobSeekers.length;
    const hotTownships = TOWNSHIPS.slice(0, 5).length;
    return { totalJobs, totalEnterprises, totalSeekers, hotTownships };
  }, [mockData]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="relative bg-gradient-to-br from-industrial-blue-600 via-industrial-blue-500 to-industrial-blue-700 rounded-2xl p-8 md:p-12 overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern bg-grid-32 opacity-20" />
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-vital-orange-400 opacity-20 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-60 h-60 rounded-full bg-white opacity-10 blur-3xl" />

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold text-white mb-3"
            >
              中山智能招聘 · 找到你的理想工作
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-industrial-blue-100 text-base md:text-lg mb-8"
            >
              25个镇街产业专区 · {totalStats.totalEnterprises}家优质企业 · {totalStats.totalJobs}个热招岗位
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="bg-white rounded-xl p-2 shadow-industrial-lg flex flex-col md:flex-row gap-2"
            >
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search size={20} className="text-gray-400 flex-shrink-0" />
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="搜索职位名称、企业名称或关键词"
                  className="!border-none !shadow-none !text-base !h-11"
                  size="large"
                />
              </div>
              <Select
                value={selectedTownship}
                onChange={setSelectedTownship}
                placeholder="选择镇街"
                allowClear
                className="!w-full md:!w-40"
                size="large"
                suffixIcon={<MapPin size={16} />}
              >
                {TOWNSHIPS.map((t) => (
                  <Option key={t.code} value={t.code}>
                    {t.name}
                  </Option>
                ))}
              </Select>
              <Select
                value={selectedJobType}
                onChange={setSelectedJobType}
                placeholder="职位类型"
                allowClear
                className="!w-full md:!w-40"
                size="large"
                suffixIcon={<Briefcase size={16} />}
              >
                <Option value={JobSeekerType.BLUE_COLLAR}>蓝领普工</Option>
                <Option value={JobSeekerType.SKILLED_WORKER}>技术工人</Option>
                <Option value={JobSeekerType.FRESH_GRADUATE}>应届生</Option>
              </Select>
              <Button
                type="primary"
                size="large"
                className="!h-11 !px-8 !text-base font-medium"
                icon={<Search size={18} />}
              >
                搜索职位
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-wrap justify-center gap-2 mt-4"
            >
              <span className="text-industrial-blue-100 text-sm">热门搜索：</span>
              {['CNC操作员', '电工', '普工', '装配工', '质检', '仓管'].map((kw) => (
                <Tag
                  key={kw}
                  className="!cursor-pointer !bg-white/10 !text-white !border-white/20 !text-sm !px-3 !py-0.5 hover:!bg-white/20 transition-colors"
                  onClick={() => setSearchText(kw)}
                >
                  {kw}
                </Tag>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="在招职位"
          value={totalStats.totalJobs}
          unit="个"
          theme="blue"
          icon={<Briefcase size={20} />}
          trend={12.5}
          trendLabel="月环比"
        />
        <StatsCard
          title="认证企业"
          value={totalStats.totalEnterprises}
          unit="家"
          theme="orange"
          icon={<Building2 size={20} />}
          trend={8.3}
          trendLabel="月环比"
        />
        <StatsCard
          title="活跃求职者"
          value={totalStats.totalSeekers}
          unit="人"
          theme="green"
          icon={<TrendingUp size={20} />}
          trend={15.7}
          trendLabel="月环比"
        />
        <StatsCard
          title="热门镇街"
          value={25}
          unit="个"
          theme="purple"
          icon={<MapPin size={20} />}
          suffix="全覆盖"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-industrial-blue-500 rounded-full inline-block" />
              快捷入口
            </h2>
            <p className="text-sm text-gray-500 mt-1">直达专属招聘专区</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {QUICK_ENTRIES.map((entry, idx) => (
            <motion.div
              key={entry.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.08, duration: 0.4 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className={cn(
                'relative bg-white rounded-xl p-5 cursor-pointer border border-gray-100',
                'transition-all duration-300 hover:shadow-card-hover hover:border-industrial-blue-200 group',
                'overflow-hidden'
              )}
            >
              <div
                className={cn(
                  'absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity',
                  entry.color
                )}
              />
              <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center mb-3', entry.iconBg)}>
                <span className={entry.iconColor}>{entry.icon}</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1 group-hover:text-industrial-blue-600 transition-colors">
                {entry.title}
              </h3>
              <p className="text-xs text-gray-500 mb-2">{entry.desc}</p>
              <span className="inline-flex items-center text-xs text-industrial-blue-600 font-medium">
                查看详情 <ChevronRight size={12} />
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-industrial-blue-500 rounded-full inline-block" />
              镇街招聘专区
            </h2>
            <p className="text-sm text-gray-500 mt-1">中山市25个镇街产业集群招聘</p>
          </div>
          <Button
            type="link"
            className="!text-industrial-blue-600 !font-medium"
            onClick={() => navigate('/jobseeker/township')}
          >
            查看全部镇街 <ChevronRight size={14} />
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {TOWNSHIPS.map((township, idx) => {
            const counts = townshipJobCounts[township.code] || { enterprises: 0, jobs: 0 };
            const primaryIndustry = township.industryTags[0];
            return (
              <motion.div
                key={township.code}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + idx * 0.03, duration: 0.4 }}
                whileHover={{ y: -3, scale: 1.02 }}
                onClick={() => navigate(`/jobseeker/township?township=${township.code}`)}
                className="bg-white rounded-xl p-4 border border-gray-100 cursor-pointer transition-all duration-300 hover:shadow-card-hover hover:border-industrial-blue-200 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-industrial-blue-50 to-transparent rounded-bl-full opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-industrial-blue-600 transition-colors">
                      {township.name}
                    </h3>
                    <Tooltip title={primaryIndustry}>
                      <span className="text-industrial-blue-500">{INDUSTRY_ICONS[primaryIndustry]}</span>
                    </Tooltip>
                  </div>
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Building2 size={10} /> 企业
                      </span>
                      <span className="font-semibold text-industrial-blue-600 font-mono-num">
                        {counts.enterprises}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Briefcase size={10} /> 职位
                      </span>
                      <span className="font-semibold text-vital-orange-500 font-mono-num">
                        {counts.jobs}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {township.industryTags.slice(0, 2).map((tag) => (
                      <Tag
                        key={tag}
                        className="!m-0 !text-[10px] !px-1.5 !py-0 !bg-gray-50 !text-gray-600 !border-gray-200"
                      >
                        {tag}
                      </Tag>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-vital-orange-500 rounded-full inline-block" />
                智能职位推荐
              </h2>
              <p className="text-sm text-gray-500 mt-1">基于您的简历和偏好为您匹配</p>
            </div>
            <Button
              type="link"
              className="!text-industrial-blue-600 !font-medium"
              onClick={() => navigate('/jobseeker/jobs')}
            >
              查看更多 <ChevronRight size={14} />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedJobs.slice(0, 6).map((job, idx) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + idx * 0.06, duration: 0.4 }}
              >
                <JobCard job={job} matchScore={job.matchScore} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-industrial-blue-500 rounded-full inline-block" />
                招聘热度趋势
              </h2>
              <p className="text-sm text-gray-500 mt-1">近6个月镇街招聘数据</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorHeat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#165DFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#165DFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorApply" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF7D00" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF7D00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2F3F5" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#86909C' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#86909C' }} axisLine={false} tickLine={false} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E6EB',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="热度"
                  stroke="#165DFF"
                  strokeWidth={2}
                  fill="url(#colorHeat)"
                  isAnimationActive
                  animationDuration={1200}
                />
                <Area
                  type="monotone"
                  dataKey="投递"
                  stroke="#FF7D00"
                  strokeWidth={2}
                  fill="url(#colorApply)"
                  isAnimationActive
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>

            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-industrial-blue-500" />
                <span className="text-xs text-gray-600">招聘热度</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-vital-orange-500" />
                <span className="text-xs text-gray-600">投递数量</span>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">热门镇街 TOP5</h3>
            <div className="space-y-3">
              {TOWNSHIPS.slice(0, 5).map((t, idx) => {
                const heat = 100 - idx * 15;
                return (
                  <div key={t.code} className="flex items-center gap-3">
                    <span
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                        idx === 0
                          ? 'bg-vital-orange-500 text-white'
                          : idx === 1
                          ? 'bg-industrial-blue-500 text-white'
                          : idx === 2
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      )}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-800 w-24 truncate">{t.name}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-industrial-blue-400 to-industrial-blue-500 rounded-full transition-all duration-1000"
                        style={{ width: `${heat}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 font-mono-num w-12 text-right">
                      {heat}℃
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Home;
