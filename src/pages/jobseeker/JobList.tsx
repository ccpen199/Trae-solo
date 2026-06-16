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
} from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { generateMockData } from '@/mock/data';
import { TOWNSHIPS } from '@/mock/townships';
import { TownshipCode, JobPosition, JobSeekerType, IndustryTag, JobWithMatch } from '@shared/types';
import JobCard from '@/components/common/JobCard';
import MatchScoreRing from '@/components/common/MatchScoreRing';
import TownshipTag from '@/components/common/TownshipTag';
import MatchDetailsPanel from '@/components/common/MatchDetailsPanel';
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
                      {expandedJobId === job.id && <MatchDetailsPanel matchDetails={job.matchDetails} />}
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
