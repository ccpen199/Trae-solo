import React, { useMemo, useState } from 'react';
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
import { TownshipCode, JobPosition, JobSeekerType, IndustryTag } from '@shared/types';
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

function JobList() {
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

  const jobsWithMatch = useMemo(() => {
    return mockData.positions.map((job) => ({
      ...job,
      matchScore: Math.floor(60 + Math.random() * 38),
    }));
  }, [mockData.positions]);

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

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-xl border border-gray-100 p-4"
      >
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 px-3 bg-gray-50 rounded-lg">
            <Search size={18} className="text-gray-400" />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索职位、企业、技能关键词"
              className="!border-none !shadow-none !bg-transparent"
              allowClear
            />
          </div>
          <Select
            mode="multiple"
            value={selectedTownships}
            onChange={(v) => setSelectedTownships(v as TownshipCode[])}
            placeholder="选择镇街"
            className="!w-full md:!w-64"
            suffixIcon={<MapPin size={16} />}
            maxTagCount={3}
          >
            {TOWNSHIPS.map((t) => (
              <Option key={t.code} value={t.code}>
                {t.name}
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<Search size={16} />}
            className="!px-6"
          >
            搜索
          </Button>
        </div>

        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2"
          >
            <span className="text-sm text-gray-500">已选条件：</span>

            {searchText && (
              <Tag
                closable
                onClose={() => setSearchText('')}
                className="!bg-industrial-blue-50 !text-industrial-blue-600 !border-industrial-blue-100"
              >
                关键词: {searchText}
              </Tag>
            )}

            {selectedTownships.map((code) => {
              const t = TOWNSHIPS.find((x) => x.code === code);
              return (
                <Tag
                  key={code}
                  closable
                  onClose={() => setSelectedTownships(selectedTownships.filter((c) => c !== code))}
                  className="!bg-industrial-blue-50 !text-industrial-blue-600 !border-industrial-blue-100"
                >
                  {t?.name}
                </Tag>
              );
            })}

            {(salaryRange[0] !== 0 || salaryRange[1] !== 30) && (
              <Tag
                closable
                onClose={() => setSalaryRange([0, 30])}
                className="!bg-vital-orange-50 !text-vital-orange-600 !border-vital-orange-100"
              >
                薪资: {salaryRange[0]}K-{salaryRange[1]}K
              </Tag>
            )}

            {selectedExperience !== '不限' && (
              <Tag
                closable
                onClose={() => setSelectedExperience('不限')}
                className="!bg-emerald-50 !text-emerald-600 !border-emerald-100"
              >
                经验: {selectedExperience}
              </Tag>
            )}

            {selectedEducation !== '不限' && (
              <Tag
                closable
                onClose={() => setSelectedEducation('不限')}
                className="!bg-purple-50 !text-purple-600 !border-purple-100"
              >
                学历: {selectedEducation}
              </Tag>
            )}

            {selectedSkills.map((s) => (
              <Tag
                key={s}
                closable
                onClose={() => setSelectedSkills(selectedSkills.filter((x) => x !== s))}
                className="!bg-cyan-50 !text-cyan-600 !border-cyan-100"
              >
                {s}
              </Tag>
            ))}

            {selectedScales.map((s) => (
              <Tag
                key={s}
                closable
                onClose={() => setSelectedScales(selectedScales.filter((x) => x !== s))}
                className="!bg-amber-50 !text-amber-600 !border-amber-100"
              >
                规模: {s}
              </Tag>
            ))}

            <Button
              size="small"
              type="text"
              icon={<X size={12} />}
              onClick={resetFilters}
              className="!text-gray-500 !text-xs"
            >
              清空全部
            </Button>
          </motion.div>
        )}
      </motion.div>

      <div className="flex gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-64 flex-shrink-0 hidden lg:block"
        >
          <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-4 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-industrial-blue-500" />
                高级筛选
              </h3>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                  <MapPin size={14} /> 工作镇街
                </h4>
                {selectedTownships.length > 0 && (
                  <span className="text-xs text-industrial-blue-600">已选 {selectedTownships.length}</span>
                )}
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                <CheckboxGroup
                  value={selectedTownships}
                  onChange={(v) => setSelectedTownships(v as TownshipCode[])}
                  className="flex flex-col !gap-1"
                >
                  {displayedTownships.map((t) => (
                    <Checkbox key={t.code} value={t.code} className="!text-xs">
                      {t.name}
                    </Checkbox>
                  ))}
                </CheckboxGroup>
              </div>
              {TOWNSHIPS.length > 10 && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => setShowMoreTownships(!showMoreTownships)}
                  className="!text-xs !text-industrial-blue-600 !px-0 !h-6"
                >
                  {showMoreTownships ? '收起' : `展开全部${TOWNSHIPS.length}个镇街`}
                  <ChevronDown size={12} className={cn('inline transition-transform', showMoreTownships && 'rotate-180')} />
                </Button>
              )}
            </div>

            <Divider className="!my-0" />

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-800">薪资范围</h4>
                <span className="text-xs text-vital-orange-600 font-semibold font-mono-num">
                  {salaryRange[0]}K - {salaryRange[1] >= 30 ? '30K+' : `${salaryRange[1]}K`}
                </span>
              </div>
              <Slider
                range
                min={0}
                max={30}
                step={1}
                value={salaryRange}
                onChange={(v) => setSalaryRange(v as [number, number])}
                marks={{
                  0: '0',
                  10: '10K',
                  20: '20K',
                  30: '30K+',
                }}
                tooltip={{ formatter: (v) => `${v}K` }}
              />
            </div>

            <Divider className="!my-0" />

            <div>
              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-1 mb-2">
                <Briefcase size={14} /> 经验要求
              </h4>
              <RadioGroup
                value={selectedExperience}
                onChange={(e) => setSelectedExperience(e.target.value)}
                className="flex flex-col !gap-1"
              >
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <Radio key={opt.value} value={opt.value} className="!text-xs">
                    {opt.label}
                  </Radio>
                ))}
              </RadioGroup>
            </div>

            <Divider className="!my-0" />

            <div>
              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-1 mb-2">
                <GraduationCap size={14} /> 学历要求
              </h4>
              <RadioGroup
                value={selectedEducation}
                onChange={(e) => setSelectedEducation(e.target.value)}
                className="flex flex-col !gap-1"
              >
                {EDUCATION_OPTIONS.map((opt) => (
                  <Radio key={opt.value} value={opt.value} className="!text-xs">
                    {opt.label}
                  </Radio>
                ))}
              </RadioGroup>
            </div>

            <Divider className="!my-0" />

            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">技能标签</h4>
              <div className="flex flex-wrap gap-1.5">
                {SKILL_TAGS.map((skill) => {
                  const selected = selectedSkills.includes(skill);
                  return (
                    <div
                      key={skill}
                      onClick={() => {
                        if (selected) {
                          setSelectedSkills(selectedSkills.filter((s) => s !== skill));
                        } else {
                          setSelectedSkills([...selectedSkills, skill]);
                        }
                      }}
                      className={cn(
                        'cursor-pointer text-xs m-0 rounded border px-2 py-0.5 transition-all',
                        selected
                          ? 'bg-industrial-blue-500 text-white border-industrial-blue-500'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-industrial-blue-300 hover:text-industrial-blue-600'
                      )}
                    >
                      {skill}
                    </div>
                  );
                })}
              </div>
            </div>

            <Divider className="!my-0" />

            <div>
              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-1 mb-2">
                <Users size={14} /> 企业规模
              </h4>
              <CheckboxGroup
                value={selectedScales}
                onChange={(v) => setSelectedScales(v as string[])}
                className="flex flex-col !gap-1"
              >
                {SCALE_OPTIONS.map((opt) => (
                  <Checkbox key={opt.value} value={opt.value} className="!text-xs">
                    {opt.label}
                  </Checkbox>
                ))}
              </CheckboxGroup>
            </div>

            <div className="pt-2">
              <Button block onClick={resetFilters} className="!border-gray-200">
                重置筛选
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="flex-1 min-w-0">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-white rounded-xl border border-gray-100 px-5 py-3 mb-4 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                共找到 <span className="font-bold text-industrial-blue-600 font-mono-num">{filteredJobs.length}</span> 个职位
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">排序：</span>
              <RadioGroup
                value={sortType}
                onChange={(e) => setSortType(e.target.value)}
                optionType="button"
                buttonStyle="solid"
                size="small"
              >
                <Radio.Button value="match">匹配度</Radio.Button>
                <Radio.Button value="latest">最新发布</Radio.Button>
                <Radio.Button value="salary">薪资最高</Radio.Button>
                <Radio.Button value="distance">距离最近</Radio.Button>
              </RadioGroup>
            </div>
          </motion.div>

          {filteredJobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl border border-gray-100 p-12"
            >
              <Empty
                description={
                  <div className="text-center">
                    <p className="text-gray-600 mb-2">未找到匹配的职位</p>
                    <Button type="link" onClick={resetFilters}>
                      清除筛选条件重新搜索
                    </Button>
                  </div>
                }
              />
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredJobs.slice(0, 20).map((job, idx) => {
                  const enterprise = mockData.enterprises.find((e) => e.id === job.enterpriseId);
                  return (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.03, duration: 0.35 }}
                      layout
                    >
                      <div className="bg-white rounded-xl border border-gray-100 p-5 cursor-pointer transition-all duration-300 hover:shadow-card-hover hover:border-industrial-blue-200 hover:-translate-y-0.5 group">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <MatchScoreRing score={job.matchScore} size="lg" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-industrial-blue-600 transition-colors">
                                  {job.title}
                                </h3>
                                {job.urgent && (
                                  <Tag color="red" className="!text-xs">急招</Tag>
                                )}
                                <Tag color="orange" className="!text-xs">
                                  {job.type}
                                </Tag>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-xl font-bold text-vital-orange-500">
                                  {formatSalary(job.salaryMin, job.salaryMax)}
                                </div>
                                <div className="text-xs text-gray-400">{job.salaryType}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <span className="flex items-center gap-1 text-sm text-gray-700">
                                <Building2 size={14} className="text-gray-400" />
                                {job.enterpriseName}
                              </span>
                              {enterprise?.verified && (
                                <span className="inline-flex items-center gap-0.5 text-xs text-success-600 bg-success-50 px-1.5 py-0.5 rounded">
                                  <Award size={10} /> 属地认证
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              <TownshipTag code={job.township as TownshipCode} size="sm" />
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                                <Briefcase size={10} /> {job.experience}
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                                <GraduationCap size={10} /> {job.education}
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <Users size={10} /> 招{job.hiringCount}人
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                <Clock size={10} /> {formatDate(job.publishedAt)}
                              </span>
                            </div>

                            {job.benefits?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {job.benefits.slice(0, 5).map((b, i) => (
                                  <span
                                    key={i}
                                    className="text-xs px-2 py-0.5 bg-industrial-blue-50 text-industrial-blue-600 rounded"
                                  >
                                    {b}
                                  </span>
                                ))}
                                {job.benefits.length > 5 && (
                                  <span className="text-xs text-gray-400">+{job.benefits.length - 5}</span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex-shrink-0 flex flex-col items-center justify-center gap-2">
                            <Button
                              type="primary"
                              className="!opacity-0 group-hover:!opacity-100 transition-opacity"
                              size="small"
                            >
                              查看详情
                            </Button>
                            <Button
                              type="default"
                              className="!opacity-0 group-hover:!opacity-100 transition-opacity"
                              size="small"
                            >
                              一键投递
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredJobs.length > 20 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-4"
                >
                  <Button type="primary" ghost>
                    加载更多职位
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobList;
