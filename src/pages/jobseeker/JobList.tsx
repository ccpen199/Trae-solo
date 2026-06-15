import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Briefcase,
  GraduationCap,
  SlidersHorizontal,
  Clock,
  Building2,
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  Target,
  Wrench,
  User,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import {
  Input,
  Select,
  Slider,
  Checkbox,
  Tag,
  Button,
  Radio,
  Space,
  Divider,
  Empty,
  Progress,
  Descriptions,
  Tooltip,
} from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { generateMockData } from '@/mock/data';
import { TOWNSHIPS } from '@/mock/townships';
import { TownshipCode, JobPosition, JobSeekerType, IndustryTag, JobWithMatch, MatchDetails } from '@shared/types';
import JobCard from '@/components/common/JobCard';
import MatchScoreRing from '@/components/common/MatchScoreRing';
import TownshipTag from '@/components/common/TownshipTag';
import { cn } from '@/lib/utils';

const { Option } = Select;
const { Group: RadioGroup } = Radio;
const { Group: CheckboxGroup } = Checkbox;

type SortType = 'match' | 'latest' | 'salary' | 'distance';

const EXPERIENCE_OPTIONS = [
  { label: '不限', value: '不限' },
  { label: '应届生', value: '应届生' },
  { label: '1-3年', value: '1-3年' },
  { label: '3-5年', value: '3-5年' },
  { label: '5-10年', value: '5-10年' },
  { label: '10年以上', value: '10年以上' },
];

const EDUCATION_OPTIONS = [
  { label: '不限', value: '不限' },
  { label: '初中', value: '初中' },
  { label: '高中', value: '高中' },
  { label: '中专', value: '中专' },
  { label: '大专', value: '大专' },
  { label: '本科', value: '本科' },
  { label: '硕士', value: '硕士' },
];

const SCALE_OPTIONS = [
  { label: '20人以下', value: '20人以下' },
  { label: '20-99人', value: '20-99人' },
  { label: '100-499人', value: '100-499人' },
  { label: '500-999人', value: '500-999人' },
  { label: '1000人以上', value: '1000-9999人' },
];

const SKILL_TAGS = [
  'CNC操作', '电工', '焊工', 'PLC编程', '机械设计', '模具设计',
  '质检', '装配', '仓储管理', '电子维修', 'CAD绘图', '数控编程',
  '注塑工艺', '表面处理', 'SMT操作', 'PCB设计', '品质管理',
];

const DIFF_TYPE_CONFIG = {
  blue_collar: {
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    icon: '🔵',
  },
  skilled: {
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200',
    icon: '🟠',
  },
  graduate: {
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-200',
    icon: '🟢',
  },
};

function JobList() {
  const navigate = useNavigate();
  const mockData = useMemo(() => generateMockData(), []);
  const [searchText, setSearchText] = useState('');
  const [selectedTownships, setSelectedTownships] = useState<TownshipCode[]>([]);
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 30]);
  const [selectedExperience, setSelectedExperience] = useState<string>('不限');
  const [selectedEducation, setSelectedEducation] = useState<string>('不限');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedScales, setSelectedScales] = useState<string[]>([]);
  const [sortType, setSortType] = useState<SortType>('match');
  const [showMoreTownships, setShowMoreTownships] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const jobsWithMatch = useMemo(() => {
    return mockData.jobsWithMatch.map((job) => ({
      ...job,
      enterpriseName: mockData.enterprises.find((e) => e.id === job.enterpriseId)?.name || job.enterpriseName,
    }));
  }, [mockData.jobsWithMatch, mockData.enterprises]);

  const filteredJobs = useMemo(() => {
    let result = [...jobsWithMatch];

    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(lower) ||
          j.enterpriseName?.toLowerCase().includes(lower) ||
          j.requiredSkills.some((s) => s.name.toLowerCase().includes(lower))
      );
    }

    if (selectedTownships.length > 0) {
      result = result.filter((j) => selectedTownships.includes(j.township));
    }

    if (salaryRange[0] > 0 || salaryRange[1] < 30) {
      result = result.filter(
        (j) => j.salaryMax >= salaryRange[0] && j.salaryMin <= salaryRange[1]
      );
    }

    if (selectedExperience !== '不限') {
      result = result.filter((j) => j.experience === selectedExperience);
    }

    if (selectedEducation !== '不限') {
      result = result.filter((j) => j.education === selectedEducation);
    }

    if (selectedSkills.length > 0) {
      result = result.filter((j) =>
        j.requiredSkills.some((s) => selectedSkills.includes(s.name))
      );
    }

    if (selectedScales.length > 0) {
      const entIds = mockData.enterprises
        .filter((e) => selectedScales.includes(e.scale))
        .map((e) => e.id);
      result = result.filter((j) => entIds.includes(j.enterpriseId));
    }

    switch (sortType) {
      case 'match':
        result.sort((a, b) => b.matchScore - a.matchScore);
        break;
      case 'latest':
        result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        break;
      case 'salary':
        result.sort((a, b) => b.salaryMax - a.salaryMax);
        break;
      case 'distance':
        result.sort(() => Math.random() - 0.5);
        break;
    }

    return result;
  }, [
    jobsWithMatch,
    searchText,
    selectedTownships,
    salaryRange,
    selectedExperience,
    selectedEducation,
    selectedSkills,
    selectedScales,
    sortType,
    mockData.enterprises,
  ]);

  useEffect(() => {
    if (hasSearched && filteredJobs.length > 0) {
      setExpandedJobId(filteredJobs[0].id);
    }
  }, [hasSearched, filteredJobs]);

  const handleSearch = () => {
    setHasSearched(true);
  };

  const formatSalary = (min: number, max: number) => {
    if (!min && !max) return '面议';
    if (min === max) return `${min}K`;
    return `${min}-${max}K`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return '今天发布';
    if (diff === 1) return '昨天发布';
    if (diff < 7) return `${diff}天前发布`;
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const resetFilters = () => {
    setSearchText('');
    setSelectedTownships([]);
    setSalaryRange([0, 30]);
    setSelectedExperience('不限');
    setSelectedEducation('不限');
    setSelectedSkills([]);
    setSelectedScales([]);
    setExpandedJobId(null);
    setHasSearched(false);
  };

  const toggleExpand = (jobId: string) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  const activeFilterCount =
    (searchText ? 1 : 0) +
    selectedTownships.length +
    (salaryRange[0] !== 0 || salaryRange[1] !== 30 ? 1 : 0) +
    (selectedExperience !== '不限' ? 1 : 0) +
    (selectedEducation !== '不限' ? 1 : 0) +
    selectedSkills.length +
    selectedScales.length;

  const displayedTownships = showMoreTownships ? TOWNSHIPS : TOWNSHIPS.slice(0, 10);

  const renderMatchDetails = (matchDetails: MatchDetails) => {
    const { resumeParse, jdMatch, skillAlignment, differentiation } = matchDetails;
    const diffConfig = DIFF_TYPE_CONFIG[differentiation.type];

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gray-50 border-t border-gray-100 mt-4 pt-4"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={18} className="text-industrial-blue-500" />
              <h4 className="font-semibold text-gray-800">📄 简历解析结果</h4>
            </div>
            <Descriptions column={2} size="small" className="text-sm">
              <Descriptions.Item label="工作经验">{resumeParse.yearsOfExperience}年</Descriptions.Item>
              <Descriptions.Item label="学历">{resumeParse.education}</Descriptions.Item>
              <Descriptions.Item label="期望地点">{resumeParse.location}</Descriptions.Item>
              <Descriptions.Item label="期望薪资">{resumeParse.targetSalary[0]}-{resumeParse.targetSalary[1]}K</Descriptions.Item>
            </Descriptions>
            <div className="mt-3">
              <div className="text-xs text-gray-500 mb-1">技能标签</div>
              <div className="flex flex-wrap gap-1">
                {resumeParse.skills.map((skill, idx) => (
                  <Tag key={idx} color="blue" className="!text-xs">{skill}</Tag>
                ))}
              </div>
            </div>
            {resumeParse.certificates.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-1">持有证书</div>
                <div className="flex flex-wrap gap-1">
                  {resumeParse.certificates.map((cert, idx) => (
                    <Tag key={idx} color="gold" className="!text-xs">{cert}</Tag>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target size={18} className="text-vital-orange-500" />
              <h4 className="font-semibold text-gray-800">🎯 JD语义匹配</h4>
            </div>
            <div className="space-y-3">
              {Object.entries(jdMatch).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">{value.label}</span>
                    <span className="text-xs font-semibold text-gray-700">{value.score}%</span>
                  </div>
                  <Progress
                    percent={value.score}
                    size="small"
                    strokeColor={value.score >= 80 ? '#52c41a' : value.score >= 60 ? '#faad14' : '#ff4d4f'}
                    showInfo={false}
                  />
                  <Tooltip title={value.reason}>
                    <p className="text-xs text-gray-500 mt-0.5 truncate cursor-help">{value.reason}</p>
                  </Tooltip>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-100 p-4 lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Wrench size={18} className="text-purple-500" />
              <h4 className="font-semibold text-gray-800">🔧 技能图谱对齐</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1">
                  <CheckCircle size={12} /> 已匹配技能
                </div>
                {skillAlignment.matched.length > 0 ? (
                  <div className="space-y-2">
                    {skillAlignment.matched.map((item, idx) => (
                      <div key={idx} className="bg-green-50 border border-green-100 rounded p-2 text-xs">
                        <div className="font-medium text-green-700">{item.name}</div>
                        <div className="text-green-600 mt-0.5">掌握: {item.level} / 要求: {item.required}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">暂无匹配技能</div>
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1">
                  <Sparkles size={12} /> 相关技能
                </div>
                {skillAlignment.related.length > 0 ? (
                  <div className="space-y-2">
                    {skillAlignment.related.map((item, idx) => (
                      <div key={idx} className="bg-blue-50 border border-blue-100 rounded p-2 text-xs">
                        <div className="font-medium text-blue-700 flex items-center justify-between">
                          <span>{item.name}</span>
                          <span className="text-blue-500">加分 {item.bonus}</span>
                        </div>
                        <div className="text-blue-600 mt-0.5">掌握: {item.level}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">暂无相关技能</div>
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                  <AlertCircle size={12} /> 待补技能
                </div>
                {skillAlignment.missing.length > 0 ? (
                  <div className="space-y-2">
                    {skillAlignment.missing.map((item, idx) => (
                      <div key={idx} className="bg-red-50 border border-red-100 rounded p-2 text-xs">
                        <div className="font-medium text-red-700">{item.name}</div>
                        <div className="text-red-600 mt-0.5">{item.suggestion || `建议补充${item.name}经验`}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">暂无明显短板</div>
                )}
              </div>
            </div>
          </div>

          <div className={cn('bg-white rounded-lg border p-4 lg:col-span-2', diffConfig.bgColor, diffConfig.borderColor)}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={18} className={diffConfig.textColor} />
              <h4 className="font-semibold text-gray-800">
                {diffConfig.icon} {differentiation.typeLabel || '差异化匹配建议'}
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {differentiation.highlights.map((item, idx) => (
                <div key={idx} className="text-sm text-gray-700 bg-white/70 rounded px-3 py-2">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const townshipOptions = displayedTownships.map((township) => ({
    label: township.name,
    value: township.code,
  }));

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-industrial-blue-600 font-semibold">
              <Search size={18} />
              职位搜索
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">智能岗位匹配</h1>
            <p className="text-sm text-gray-500 mt-1">按镇街、薪资、经验和技能快速筛选中山制造业岗位。</p>
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Tag color="blue">已选 {activeFilterCount} 项筛选</Tag>
            )}
            <Button icon={<X size={14} />} onClick={resetFilters}>
              重置筛选
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-5">
          <div className="lg:col-span-5">
            <Input
              size="large"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              onPressEnter={handleSearch}
              placeholder="搜索职位名称、企业名称或技能"
              prefix={<Search size={16} className="text-gray-400" />}
            />
          </div>
          <div className="lg:col-span-3">
            <Select
              className="w-full"
              size="large"
              value={selectedExperience}
              onChange={setSelectedExperience}
              suffixIcon={<Briefcase size={16} />}
            >
              {EXPERIENCE_OPTIONS.map((item) => (
                <Option key={item.value} value={item.value}>
                  {item.label}
                </Option>
              ))}
            </Select>
          </div>
          <div className="lg:col-span-3">
            <Select
              className="w-full"
              size="large"
              value={selectedEducation}
              onChange={setSelectedEducation}
              suffixIcon={<GraduationCap size={16} />}
            >
              {EDUCATION_OPTIONS.map((item) => (
                <Option key={item.value} value={item.value}>
                  {item.label}
                </Option>
              ))}
            </Select>
          </div>
          <div className="lg:col-span-1">
            <Button type="primary" size="large" block icon={<Search size={16} />} onClick={handleSearch}>
              搜索
            </Button>
          </div>
        </div>

        <Divider className="!my-5" />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
          <div className="xl:col-span-1 space-y-5">
            <div>
              <div className="flex items-center gap-2 font-medium text-gray-800 mb-3">
                <MapPin size={16} /> 镇街
              </div>
              <CheckboxGroup
                className="grid grid-cols-2 xl:grid-cols-1 gap-2"
                value={selectedTownships}
                options={townshipOptions}
                onChange={(values) => setSelectedTownships(values as TownshipCode[])}
              />
              <Button
                type="link"
                size="small"
                className="!px-0 mt-2"
                onClick={() => setShowMoreTownships(!showMoreTownships)}
                icon={showMoreTownships ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              >
                {showMoreTownships ? '收起镇街' : '查看全部镇街'}
              </Button>
            </div>

            <div>
              <div className="flex items-center gap-2 font-medium text-gray-800 mb-3">
                <SlidersHorizontal size={16} /> 月薪范围
              </div>
              <Slider
                range
                min={0}
                max={30}
                value={salaryRange}
                onChange={(value) => setSalaryRange(value as [number, number])}
                tooltip={{ formatter: (value) => `${value}K` }}
              />
              <div className="text-xs text-gray-500">{formatSalary(salaryRange[0], salaryRange[1])}</div>
            </div>

            <div>
              <div className="flex items-center gap-2 font-medium text-gray-800 mb-3">
                <Building2 size={16} /> 企业规模
              </div>
              <CheckboxGroup
                className="grid grid-cols-1 gap-2"
                value={selectedScales}
                options={SCALE_OPTIONS}
                onChange={(values) => setSelectedScales(values as string[])}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 font-medium text-gray-800 mb-3">
                <Award size={16} /> 技能标签
              </div>
              <Space wrap size={[6, 6]}>
                {SKILL_TAGS.map((skill) => {
                  const active = selectedSkills.includes(skill);
                  return (
                    <Tag.CheckableTag
                      key={skill}
                      checked={active}
                      onChange={(checked) =>
                        setSelectedSkills((current) =>
                          checked ? [...current, skill] : current.filter((item) => item !== skill)
                        )
                      }
                    >
                      {skill}
                    </Tag.CheckableTag>
                  );
                })}
              </Space>
            </div>
          </div>

          <div className="xl:col-span-3 space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="text-sm text-gray-600">
                共找到 <span className="font-semibold text-gray-900">{filteredJobs.length}</span> 个岗位
                {hasSearched && filteredJobs[0] && (
                  <span className="ml-2 text-industrial-blue-600">已展开最高匹配岗位</span>
                )}
              </div>
              <RadioGroup
                value={sortType}
                onChange={(event) => setSortType(event.target.value)}
                optionType="button"
                buttonStyle="solid"
                size="small"
              >
                <Radio value="match">匹配度</Radio>
                <Radio value="latest">最新</Radio>
                <Radio value="salary">薪资</Radio>
                <Radio value="distance">距离</Radio>
              </RadioGroup>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 py-16">
                <Empty description="暂无符合条件的职位" />
              </div>
            ) : (
              <div className="space-y-3">
                {filteredJobs.slice(0, 30).map((job: JobWithMatch) => (
                  <div key={job.id} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                    <div className="flex items-start gap-4 p-4">
                      <div className="pt-1">
                        <MatchScoreRing score={job.matchScore} size="md" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <JobCard
                          job={job}
                          matchScore={job.matchScore}
                          className="!border-0 !p-0 !shadow-none"
                          onViewDetail={() => navigate(`/jobseeker/jobs/${job.id}`)}
                        />
                        <div className="flex flex-wrap items-center gap-2 px-1 pb-1 text-xs text-gray-500">
                          <TownshipTag code={job.township as TownshipCode} size="sm" />
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} /> {formatDate(job.publishedAt)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users size={12} /> 招{job.hiringCount}人
                          </span>
                        </div>
                        <div className="px-1 pb-3">
                          <Button
                            size="small"
                            type="link"
                            className="!px-0"
                            onClick={() => toggleExpand(job.id)}
                          >
                            {expandedJobId === job.id ? '收起匹配分析' : '查看匹配分析'}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedJobId === job.id && renderMatchDetails(job.matchDetails)}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobList;
