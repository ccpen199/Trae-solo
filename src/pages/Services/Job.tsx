import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Search,
  MapPin,
  Building2,
  GraduationCap,
  Clock,
  Filter,
  Star,
  ChevronRight,
  X,
  Upload,
  Edit3,
  TrendingUp,
  Users
} from 'lucide-react';
import { useServiceStore } from '@/stores/useServiceStore';
import type { Job } from '@/types';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Tag from '@/components/common/Tag';
import Badge from '@/components/common/Badge';
import { cn } from '@/lib/utils';

const jobCategories = [
  { id: 'tech', name: '技术开发', icon: '💻', keywords: ['前端', '后端', '开发', '工程师', 'Java', 'Python'] },
  { id: 'product', name: '产品运营', icon: '📊', keywords: ['产品', '运营', '策划', '推广'] },
  { id: 'sales', name: '销售', icon: '💼', keywords: ['销售', '客户经理', '业务员', '市场'] },
  { id: 'admin', name: '行政财务', icon: '📋', keywords: ['行政', '人事', '财务', '会计', 'HR'] },
  { id: 'production', name: '生产制造', icon: '🏭', keywords: ['生产', '主管', '质检', '操作工'] },
  { id: 'design', name: '设计创意', icon: '🎨', keywords: ['设计', 'UI', '美工', '平面'] }
];

const districtOptions = [
  { value: '', label: '全部区域' },
  { value: '惠城区', label: '惠城区' },
  { value: '惠阳区', label: '惠阳区' },
  { value: '仲恺区', label: '仲恺区' },
  { value: '大亚湾区', label: '大亚湾区' },
  { value: '惠东县', label: '惠东县' },
  { value: '博罗县', label: '博罗县' },
  { value: '龙门县', label: '龙门县' }
];

const experienceOptions = [
  { value: '', label: '不限经验' },
  { value: '1年以内', label: '1年以内' },
  { value: '1-3年', label: '1-3年' },
  { value: '3-5年', label: '3-5年' },
  { value: '5-10年', label: '5-10年' },
  { value: '10年以上', label: '10年以上' }
];

const salaryOptions = [
  { value: '', label: '不限薪资' },
  { value: '5k以下', label: '5k以下' },
  { value: '5k-10k', label: '5k-10k' },
  { value: '10k-20k', label: '10k-20k' },
  { value: '20k-30k', label: '20k-30k' },
  { value: '30k以上', label: '30k以上' }
];

const featuredCompanies = [
  { id: 'f1', name: 'TCL科技集团', logo: 'https://picsum.photos/seed/company1/100/100', industry: '电子科技', jobs: 28, rating: 4.8 },
  { id: 'f2', name: '德赛西威汽车电子', logo: 'https://picsum.photos/seed/company2/100/100', industry: '汽车电子', jobs: 15, rating: 4.7 },
  { id: 'f3', name: '惠州亿纬锂能', logo: 'https://picsum.photos/seed/company10/100/100', industry: '新能源', jobs: 42, rating: 4.9 },
  { id: 'f4', name: '惠州三星电子', logo: 'https://picsum.photos/seed/company3/100/100', industry: '电子科技', jobs: 12, rating: 4.6 },
  { id: 'f5', name: '光弘科技', logo: 'https://picsum.photos/seed/company7/100/100', industry: '智能制造', jobs: 20, rating: 4.5 },
  { id: 'f6', name: '比亚迪电子（惠州）', logo: 'https://picsum.photos/seed/company8/100/100', industry: '新能源', jobs: 35, rating: 4.7 }
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

export default function JobService() {
  const navigate = useNavigate();
  const { jobs, fetchJobs } = useServiceStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [experienceFilter, setExperienceFilter] = useState('');
  const [salaryFilter, setSalaryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'featured'>('all');

  useEffect(() => {
    loadJobs();
  }, [searchKeyword, selectedDistrict, selectedCategory]);

  const loadJobs = async () => {
    setLoading(true);
    let keyword = searchKeyword;
    if (selectedCategory) {
      const category = jobCategories.find(c => c.id === selectedCategory);
      if (category) {
        keyword = keyword ? `${keyword} ${category.keywords[0]}` : category.keywords[0];
      }
    }
    await fetchJobs(keyword, selectedDistrict);
    setLoading(false);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (experienceFilter && job.experience !== experienceFilter) {
        if (experienceFilter === '1年以内' && !job.experience.includes('1年以内')) return false;
        if (experienceFilter === '1-3年' && !(job.experience === '1-3年')) return false;
        if (experienceFilter === '3-5年' && !(job.experience === '3-5年')) return false;
        if (experienceFilter === '5-10年' && !(job.experience === '5-10年')) return false;
        if (experienceFilter === '10年以上' && !job.experience.includes('10')) return false;
      }
      if (salaryFilter) {
        const salaryMin = job.salaryMin;
        if (salaryFilter === '5k以下' && salaryMin >= 5000) return false;
        if (salaryFilter === '5k-10k' && (salaryMin < 5000 || salaryMin >= 10000)) return false;
        if (salaryFilter === '10k-20k' && (salaryMin < 10000 || salaryMin >= 20000)) return false;
        if (salaryFilter === '20k-30k' && (salaryMin < 20000 || salaryMin >= 30000)) return false;
        if (salaryFilter === '30k以上' && salaryMin <= 30000) return false;
      }
      return true;
    });
  }, [jobs, experienceFilter, salaryFilter]);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadJobs();
  };

  const resetFilters = () => {
    setExperienceFilter('');
    setSalaryFilter('');
    setSelectedDistrict('');
    setSelectedCategory(null);
  };

  const activeFilterCount = [
    experienceFilter,
    salaryFilter,
    selectedDistrict,
    selectedCategory
  ].filter(f => f).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-neutral-50"
    >
      <div className="container pb-20">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pt-6 pb-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">招聘求职</h1>
              <p className="text-neutral-500">找好工作、招优秀人才</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Upload className="w-4 h-4" />}
              >
                上传简历
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Edit3 className="w-4 h-4" />}
              >
                编辑简历
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <Card>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Input
                    placeholder="搜索职位名称、公司、关键词..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    size="lg"
                    prefix={<Search className="w-5 h-5 text-neutral-400" />}
                    clearable
                  />
                </div>
                <div>
                  <Select
                    options={districtOptions}
                    value={selectedDistrict}
                    onChange={setSelectedDistrict}
                    placeholder="选择区域"
                    size="lg"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="lg"
                    className="flex-1"
                    loading={loading}
                    leftIcon={<Search className="w-5 h-5" />}
                  >
                    搜索
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(activeFilterCount > 0 && 'border-westlake-500 text-westlake-600')}
                    rightIcon={
                      activeFilterCount > 0 ? (
                        <Badge variant="westlake">{activeFilterCount}</Badge>
                      ) : undefined
                    }
                  >
                    <Filter className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-neutral-100">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-neutral-700">筛选条件</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={resetFilters}
                          rightIcon={<X className="w-4 h-4" />}
                        >
                          重置
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-neutral-600 mb-2 block">工作经验</label>
                          <Select
                            options={experienceOptions}
                            value={experienceFilter}
                            onChange={setExperienceFilter}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-neutral-600 mb-2 block">薪资范围</label>
                          <Select
                            options={salaryOptions}
                            value={salaryFilter}
                            onChange={setSalaryFilter}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </Card>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <Card>
            <h3 className="font-bold text-neutral-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-honghua-500" />
              热门职位分类
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {jobCategories.map((category, index) => (
                <motion.button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
                    selectedCategory === category.id
                      ? 'bg-westlake-500 text-white shadow-lg'
                      : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                  )}
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <span className="text-2xl">{category.icon}</span>
                  <span className="text-sm font-medium">{category.name}</span>
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <h2 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-chaojing-500" />
            名企推荐
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredCompanies.map((company, index) => (
              <motion.div
                key={company.id}
                variants={fadeInUp}
                custom={index}
              >
                <Card hover className="text-center">
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="w-16 h-16 rounded-xl mx-auto mb-3 object-cover"
                  />
                  <h3 className="font-semibold text-neutral-800 text-sm truncate mb-1">{company.name}</h3>
                  <p className="text-xs text-neutral-500 mb-2">{company.industry}</p>
                  <div className="flex items-center justify-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-neutral-400">
                      <Briefcase className="w-3 h-3" />
                      {company.jobs}
                    </span>
                    <span className="flex items-center gap-1 text-chaojing-600">
                      <Star className="w-3 h-3 fill-current" />
                      {company.rating}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-westlake-500" />
              职位列表
              <Badge variant="neutral" className="ml-2">{filteredJobs.length}个职位</Badge>
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  activeTab === 'all'
                    ? 'bg-westlake-500 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                )}
              >
                全部
              </button>
              <button
                onClick={() => setActiveTab('featured')}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  activeTab === 'featured'
                    ? 'bg-westlake-500 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                )}
              >
                高薪
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-westlake-500" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card className="text-center py-12">
              <Briefcase className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">暂无符合条件的职位</p>
              <p className="text-sm text-neutral-400 mt-1">请尝试修改筛选条件</p>
            </Card>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredJobs.map((job, index) => {
                  const isHighSalary = job.salaryMin >= 20000;
                  if (activeTab === 'featured' && !isHighSalary) return null;
                  
                  return (
                    <motion.div
                      key={job.id}
                      variants={fadeInUp}
                      custom={index}
                      layout
                    >
                      <Card
                        hover
                        onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                        className={cn(
                          selectedJob?.id === job.id && 'ring-2 ring-westlake-500'
                        )}
                      >
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <img
                              src={job.companyLogo}
                              alt={job.company}
                              className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg text-neutral-800">{job.title}</h3>
                                {isHighSalary && (
                                  <Badge variant="chaojing">高薪</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-neutral-500 mb-2">
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-4 h-4" />
                                  {job.company}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {job.location}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-neutral-400 mb-3">
                                <span className="flex items-center gap-1">
                                  <GraduationCap className="w-4 h-4" />
                                  {job.education}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {job.experience}
                                </span>
                                <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded-full">
                                  {job.publishDate}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {job.tags.slice(0, 5).map(tag => (
                                  <Tag key={tag} size="sm" color="neutral">{tag}</Tag>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 border-t md:border-t-0 border-neutral-100 pt-4 md:pt-0">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-westlake-600">{job.salary}</div>
                              <div className="text-xs text-neutral-400">月薪</div>
                            </div>

                            <Button
                              size="lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                alert(`即将投递简历：${job.title} @ ${job.company}`);
                              }}
                            >
                              <Users className="w-4 h-4" />
                              立即投递
                            </Button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {selectedJob?.id === job.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t border-neutral-100">
                                <h4 className="font-semibold text-neutral-800 mb-2">职位描述</h4>
                                <p className="text-sm text-neutral-600 leading-relaxed mb-4">
                                  {job.description}
                                </p>
                                <div className="flex items-center gap-4">
                                  <Button variant="outline" size="sm">
                                    查看详情
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    收藏职位
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
