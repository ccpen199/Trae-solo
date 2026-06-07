import { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Input, Select, Button, Pagination, Tag, Space, Empty, Badge, Progress, Alert, Tooltip } from 'antd';
import { SearchOutlined, FilterOutlined, SafetyCertificateOutlined, ReloadOutlined, BulbOutlined, QuestionCircleOutlined, UserOutlined, EnvironmentOutlined, HistoryOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuthStore } from '../store/auth';

const { Search } = Input;
const { Option } = Select;

const workTypeMap: Record<string, string> = {
  fulltime: '全职',
  parttime: '兼职',
  intern: '实习',
};

const authenticityColor = (score: number) => {
  if (score >= 90) return '#52c41a';
  if (score >= 75) return '#1890ff';
  return '#fa8c16';
};

const sortOptions = [
  { value: 'latest', label: '最新发布' },
  { value: 'salary_high', label: '薪资最高' },
  { value: 'salary_low', label: '薪资最低' },
  { value: 'apply_most', label: '申请最多' },
  { value: 'smart_match', label: '智能匹配' },
];

const sortExplanation: Record<string, string> = {
  latest: '按职位发布时间倒序排列，最新发布的职位优先显示',
  salary_high: '按薪资上限从高到低排序',
  salary_low: '按薪资下限从低到高排序',
  apply_most: '按申请人数从多到少排序，显示热门职位',
  smart_match: '基于您的技能、经验、学历和期望城市进行智能匹配排序',
};

function parseSkills(skills: any): string[] {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills;
  try {
    const parsed = JSON.parse(skills);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatLocation(job: any) {
  const parts = [job.city, job.district, job.street].filter(Boolean);
  return parts.join('·');
}

export default function JobListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('latest');
  const [isRecommendation, setIsRecommendation] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [industryCount, setIndustryCount] = useState(0);
  const [showColdStart, setShowColdStart] = useState(false);
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    industry: '',
    city: '',
    district: '',
    street: '',
    skill: '',
    salaryMin: '',
    salaryMax: '',
    experience: '',
    education: '',
    workType: '',
  });

  const [districts, setDistricts] = useState<any[]>([]);
  const [skillOptions, setSkillOptions] = useState<string[]>([]);
  const [skillSearchValue, setSkillSearchValue] = useState('');
  const skillSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const industries = [
    { id: 'internet', name: '互联网/IT' },
    { id: 'manufacturing', name: '生产制造' },
    { id: 'service', name: '服务业' },
    { id: 'logistics', name: '物流仓储' },
    { id: 'retail', name: '零售百货' },
    { id: 'finance', name: '金融保险' },
  ];

  const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆'];
  const experiences = ['不限', '应届生', '1-3年', '3-5年', '5-10年', '10年以上'];
  const educations = ['不限', '大专', '本科', '硕士', '博士'];
  const salaryRanges = [
    { label: '不限', min: '', max: '' },
    { label: '5K以下', min: '', max: 5 },
    { label: '5K-10K', min: 5, max: 10 },
    { label: '10K-20K', min: 10, max: 20 },
    { label: '20K-30K', min: 20, max: 30 },
    { label: '30K以上', min: 30, max: '' },
  ];

  useEffect(() => {
    loadJobs();
  }, [page, filters, sortBy]);

  useEffect(() => {
    if (filters.city) {
      loadDistricts(filters.city);
    } else {
      setDistricts([]);
      setFilters(prev => {
        if (!prev.district && !prev.street) return prev;
        return { ...prev, district: '', street: '' };
      });
    }
  }, [filters.city]);

  useEffect(() => {
    checkColdStart();
  }, [user]);

  const checkColdStart = async () => {
    if (user?.role === 'jobseeker') {
      try {
        const { data } = await axios.get('/jobseeker/profile');
        let skills: string[] = [];
        try {
          skills = JSON.parse(data.skills || '[]');
        } catch {
          skills = [];
        }
        const hasProfile = data.education || data.experience_years !== undefined || skills.length > 0;
        setShowColdStart(!hasProfile);
      } catch {
        setShowColdStart(true);
      }
    } else {
      setShowColdStart(false);
    }
  };

  const loadJobs = async () => {
    setLoading(true);
    try {
      const isSmartMatch = sortBy === 'smart_match' && user?.role === 'jobseeker';
      
      if (isSmartMatch) {
        const { data } = await axios.get('/jobs/recommendations', { 
          params: { page, pageSize } 
        });
        setJobs(data.list || []);
        setTotal(data.total || 0);
        setIsRecommendation(true);
      } else {
        const params: any = { page, pageSize };
        if (filters.keyword) params.keyword = filters.keyword;
        if (filters.industry) params.industry = filters.industry;
        if (filters.city) params.city = filters.city;
        if (filters.district) params.district = filters.district;
        if (filters.skill) params.skill = filters.skill;
        if (filters.salaryMin) params.salaryMin = filters.salaryMin;
        if (filters.salaryMax) params.salaryMax = filters.salaryMax;
        if (filters.experience && filters.experience !== '不限') params.experience = filters.experience;
        if (filters.education && filters.education !== '不限') params.education = filters.education;
        if (filters.workType) params.workType = filters.workType;

        const { data } = await axios.get('/jobs', { params });
        let jobList = data.list || [];

        if (sortBy === 'salary_high') {
          jobList.sort((a: any, b: any) => b.salary_max - a.salary_max);
        } else if (sortBy === 'salary_low') {
          jobList.sort((a: any, b: any) => a.salary_min - b.salary_min);
        } else if (sortBy === 'apply_most') {
          jobList.sort((a: any, b: any) => (b.apply_count || 0) - (a.apply_count || 0));
        }

        setJobs(jobList);
        setTotal(data.total || 0);
        setIsRecommendation(false);

        if (filters.keyword && jobList.length > 0) {
          const uniqueIndustries = new Set(jobList.map((j: any) => j.industry));
          setIndustryCount(uniqueIndustries.size);
        }
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setJobs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const loadDistricts = async (city: string) => {
    try {
      const { data } = await axios.get('/districts', { params: { city } });
      setDistricts(data || []);
    } catch {
      setDistricts([]);
    }
  };

  const handleSkillSearch = (value: string) => {
    setSkillSearchValue(value);
    if (skillSearchTimer.current) clearTimeout(skillSearchTimer.current);
    if (!value.trim()) {
      setSkillOptions([]);
      return;
    }
    skillSearchTimer.current = setTimeout(async () => {
      try {
        const { data } = await axios.get('/jobs/search/skills', { params: { keyword: value } });
        setSkillOptions(Array.isArray(data) ? data : []);
      } catch {
        setSkillOptions([]);
      }
    }, 300);
  };

  const handleSearch = (value: string) => {
    const keyword = value.trim() || 'Java';
    setFilters({ ...filters, keyword });
    setPage(1);
    setHasSearched(true);
  };

  const resetFilters = () => {
    setFilters({
      keyword: '',
      industry: '',
      city: '',
      district: '',
      street: '',
      skill: '',
      salaryMin: '',
      salaryMax: '',
      experience: '',
      education: '',
      workType: '',
    });
    setSkillSearchValue('');
    setSkillOptions([]);
    setDistricts([]);
    setPage(1);
    setSortBy('latest');
    setHasSearched(false);
  };

  const handleSortChange = (value: string) => {
    if (value === 'smart_match' && !user) {
      navigate('/login');
      return;
    }
    if (value === 'smart_match' && user?.role !== 'jobseeker') {
      return;
    }
    setSortBy(value);
    setPage(1);
  };

  const maxMatchScore = jobs.length > 0 
    ? Math.max(...jobs.map((j: any) => j.match_score || 0)) 
    : 0;

  const uniqueDistricts = [...new Set(districts.map((d: any) => d.district).filter(Boolean))];
  const streetsInDistrict = filters.district
    ? districts.filter((d: any) => d.district === filters.district).map((d: any) => d.street).filter(Boolean)
    : [];
  const uniqueStreets = [...new Set(streetsInDistrict)];

  return (
    <div>
      {showColdStart && (
        <Alert
          message="完善您的简历和技能标签，获取更精准推荐"
          type="warning"
          showIcon
          action={
            <Button size="small" type="primary">
              <Link to="/jobseeker/profile">去完善</Link>
            </Button>
          }
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setShowColdStart(false)}
        />
      )}

      {isRecommendation && (
        <Alert
          message={
            <Space>
              <BulbOutlined style={{ color: '#1890ff' }} />
              基于您的技能图谱为您推荐
            </Space>
          }
          type="info"
          showIcon={false}
          style={{ marginBottom: 16 }}
        />
      )}

      {hasSearched && filters.keyword && (
        <Alert
          message={`搜索结果：关键词「${filters.keyword}」共找到 ${total} 个职位${industryCount > 0 ? `，分布在 ${industryCount} 个行业` : ''}`}
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
          closable
        />
      )}

      {isRecommendation && total > 0 && (
        <Alert
          message={`为您找到 ${total} 个职位，匹配度最高可达 ${maxMatchScore}%`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {(() => {
        const activeFilters: { label: string; value: string }[] = [];
        const industryMap: Record<string, string> = industries.reduce((m, i) => ({ ...m, [i.id]: i.name }), {});
        if (filters.industry) activeFilters.push({ label: '行业', value: industryMap[filters.industry] || filters.industry });
        if (filters.city) activeFilters.push({ label: '城市', value: filters.city });
        if (filters.district) activeFilters.push({ label: '区县', value: filters.district });
        if (filters.street) activeFilters.push({ label: '街道', value: filters.street });
        if (filters.skill) activeFilters.push({ label: '技能', value: filters.skill });
        if (filters.salaryMin || filters.salaryMax) activeFilters.push({ label: '薪资', value: `${filters.salaryMin || '0'}K-${filters.salaryMax || '∞'}` });
        if (filters.experience) activeFilters.push({ label: '经验', value: filters.experience });
        if (filters.education) activeFilters.push({ label: '学历', value: filters.education });
        if (filters.workType) activeFilters.push({ label: '类型', value: workTypeMap[filters.workType] || filters.workType });

        if (activeFilters.length === 0) return null;

        return (
          <Card size="small" style={{ marginBottom: 16 }} styles={{ body: { padding: '12px 16px' } }}>
            <Space size={[12, 8]} wrap>
              <span style={{ color: '#666', fontSize: 13 }}>当前筛选：</span>
              {activeFilters.map((f, idx) => (
                <Tag key={idx} color="blue" closable onClose={() => {
                  const key = f.label === '类型' ? 'workType' : 
                             f.label === '经验' ? 'experience' :
                             f.label === '学历' ? 'education' :
                             f.label.toLowerCase();
                  setFilters(prev => ({ ...prev, [key]: '' }));
                  setPage(1);
                }}>
                  {f.label}: {f.value}
                </Tag>
              ))}
              <Button type="link" size="small" onClick={resetFilters}>
                清除全部
              </Button>
              <Tag color="green">
                共找到 <strong style={{ color: '#52c41a' }}>{total}</strong> 个职位
              </Tag>
            </Space>
          </Card>
        );
      })()}

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Search
            placeholder="搜索职位、技能或公司..."
            size="large"
            enterButton={<Button type="primary" icon={<SearchOutlined />}>搜索</Button>}
            onSearch={handleSearch}
            defaultValue={filters.keyword}
          />
          <Row gutter={16}>
            <Col span={4}>
              <Select
                placeholder="选择行业"
                style={{ width: '100%' }}
                value={filters.industry || undefined}
                onChange={(value) => setFilters({ ...filters, industry: value })}
                allowClear
              >
                {industries.map(ind => (
                  <Option key={ind.id} value={ind.id}>{ind.name}</Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="选择城市"
                style={{ width: '100%' }}
                value={filters.city || undefined}
                onChange={(value) => setFilters({ ...filters, city: value || '', district: '', street: '' })}
                allowClear
              >
                {cities.map(city => (
                  <Option key={city} value={city}>{city}</Option>
                ))}
              </Select>
            </Col>
            <Col span={3}>
              <Select
                placeholder="区/县"
                style={{ width: '100%' }}
                value={filters.district || undefined}
                onChange={(value) => setFilters({ ...filters, district: value || '', street: '' })}
                allowClear
                disabled={!filters.city}
              >
                {uniqueDistricts.map(d => (
                  <Option key={d} value={d}>{d}</Option>
                ))}
              </Select>
            </Col>
            <Col span={3}>
              <Select
                placeholder="街道"
                style={{ width: '100%' }}
                value={filters.street || undefined}
                onChange={(value) => setFilters({ ...filters, street: value || '' })}
                allowClear
                disabled={!filters.district}
              >
                {uniqueStreets.map(s => (
                  <Option key={s} value={s}>{s}</Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="薪资范围"
                style={{ width: '100%' }}
                onChange={(value: any) => setFilters({ ...filters, salaryMin: value?.min || '', salaryMax: value?.max || '' })}
                allowClear
              >
                {salaryRanges.map((range, index) => (
                  <Option key={index} value={range}>{range.label}</Option>
                ))}
              </Select>
            </Col>
            <Col span={3}>
              <Select
                placeholder="工作经验"
                style={{ width: '100%' }}
                value={filters.experience || undefined}
                onChange={(value) => setFilters({ ...filters, experience: value })}
                allowClear
              >
                {experiences.map(exp => (
                  <Option key={exp} value={exp}>{exp}</Option>
                ))}
              </Select>
            </Col>
            <Col span={3}>
              <Select
                placeholder="学历要求"
                style={{ width: '100%' }}
                value={filters.education || undefined}
                onChange={(value) => setFilters({ ...filters, education: value })}
                allowClear
              >
                {educations.map(edu => (
                  <Option key={edu} value={edu}>{edu}</Option>
                ))}
              </Select>
            </Col>
          </Row>
          <Row gutter={16} align="middle">
            <Col span={6}>
              <Select
                placeholder="输入技能关键词搜索..."
                style={{ width: '100%' }}
                showSearch
                value={filters.skill || undefined}
                onSearch={handleSkillSearch}
                onChange={(value) => setFilters({ ...filters, skill: value || '' })}
                filterOption={false}
                allowClear
                notFoundContent={skillSearchValue ? '无匹配技能' : '输入关键词搜索技能'}
              >
                {skillOptions.map(s => (
                  <Option key={s} value={s}>{s}</Option>
                ))}
              </Select>
            </Col>
            <Col span={3}>
              <Select
                placeholder="工作类型"
                style={{ width: '100%' }}
                value={filters.workType || undefined}
                onChange={(value) => setFilters({ ...filters, workType: value || '' })}
                allowClear
              >
                <Option value="fulltime">全职</Option>
                <Option value="parttime">兼职</Option>
                <Option value="intern">实习</Option>
              </Select>
            </Col>
            <Col span={5}>
              <Space>
                <Select
                  placeholder="排序方式"
                  style={{ width: 140 }}
                  value={sortBy}
                  onChange={handleSortChange}
                  suffixIcon={
                    <Tooltip title={sortExplanation[sortBy]}>
                      <QuestionCircleOutlined style={{ color: '#999', cursor: 'help' }} />
                    </Tooltip>
                  }
                >
                  {sortOptions.map(opt => (
                    <Option 
                      key={opt.value} 
                      value={opt.value}
                      disabled={opt.value === 'smart_match' && user?.role !== 'jobseeker'}
                    >
                      {opt.label}
                      {opt.value === 'smart_match' && user?.role !== 'jobseeker' && ' (仅求职者)'}
                    </Option>
                  ))}
                </Select>
                <Tooltip title={sortExplanation[sortBy]}>
                  <Button icon={<QuestionCircleOutlined />} size="small">
                    排序说明
                  </Button>
                </Tooltip>
              </Space>
            </Col>
            <Col span={3}>
              <Button icon={<ReloadOutlined />} onClick={resetFilters}>
                重置筛选
              </Button>
            </Col>
            <Col span={7} style={{ textAlign: 'right', color: '#999' }}>
              查询结果共找到 <span style={{ color: '#1890ff', fontWeight: 600 }}>{total}</span> 个职位
            </Col>
          </Row>
        </Space>
      </Card>

      {jobs.length > 0 ? (
        <Row gutter={[24, 24]}>
          {jobs.map((job: any) => {
            const skills = parseSkills(job.skills);
            const score = job.authenticity_score || 0;
            const matchScore = job.match_score;
            return (
              <Col span={12} key={job.id}>
                <Card
                  className="card-hover"
                  hoverable
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <Row justify="space-between" align="top">
                    <Col flex="auto">
                      <Space size={8} align="center" style={{ marginBottom: 8 }}>
                        <h3 style={{ margin: 0 }}>{job.title}</h3>
                        {job.work_type && (
                          <Tag color="purple">{workTypeMap[job.work_type] || job.work_type}</Tag>
                        )}
                        {matchScore !== undefined && (
                          <Tag color="blue" icon={<BulbOutlined />}>
                            匹配度 {matchScore}%
                          </Tag>
                        )}
                      </Space>
                      <div style={{ color: '#666', marginBottom: 8 }}>
                        {job.company_name}
                        <Space size={6} style={{ marginLeft: 8 }}>
                          {job.social_security_verified && (
                            <Tooltip title="企业社保缴纳已核验">
                              <Tag color="success" icon={<SafetyCertificateOutlined />} style={{ fontSize: 11 }}>社保核验</Tag>
                            </Tooltip>
                          )}
                          {job.address_verified && (
                            <Tooltip title="办公地址已标注">
                              <Tag color="blue" icon={<EnvironmentOutlined />} style={{ fontSize: 11 }}>地址核验</Tag>
                            </Tooltip>
                          )}
                          {job.has_reputation_good && (
                            <Tooltip title="历史招聘行为良好">
                              <Tag color="green" icon={<HistoryOutlined />} style={{ fontSize: 11 }}>信誉良好</Tag>
                            </Tooltip>
                          )}
                          {job.report_count > 0 && (
                            <Tooltip title={`有${job.report_count}条举报记录，已全部处理`}>
                              <Tag color="orange" icon={<ExclamationCircleOutlined />} style={{ fontSize: 11 }}>{job.report_count}条举报</Tag>
                            </Tooltip>
                          )}
                        </Space>
                      </div>
                      <div style={{ color: '#999', marginBottom: 8, fontSize: 13 }}>
                        <EnvironmentOutlined /> {formatLocation(job)}
                        {job.street && ` · ${job.street}`}
                      </div>
                      <Space size={[6, 6]} wrap style={{ marginBottom: 8 }}>
                        {job.experience_required && <Tag style={{ fontSize: 11 }}>{job.experience_required}</Tag>}
                        {job.education_required && <Tag style={{ fontSize: 11 }}>{job.education_required}</Tag>}
                        {skills.slice(0, 4).map((skill: string, idx: number) => (
                          <Tag key={idx} color="blue" style={{ fontSize: 11 }}>{skill}</Tag>
                        ))}
                        {skills.length > 4 && <Tag style={{ fontSize: 11 }}>+{skills.length - 4}</Tag>}
                      </Space>
                      {matchScore !== undefined && (
                        <div style={{ marginTop: 8 }}>
                          <Progress 
                            percent={matchScore} 
                            size="small" 
                            showInfo={false}
                            strokeColor={matchScore >= 80 ? '#52c41a' : matchScore >= 60 ? '#1890ff' : '#fa8c16'}
                          />
                        </div>
                      )}
                    </Col>
                    <Col style={{ textAlign: 'right', minWidth: 130 }}>
                      <span className="salary-tag" style={{ fontSize: 16, fontWeight: 600 }}>{job.salary_min}-{job.salary_max}K</span>
                      <div style={{ marginTop: 8 }}>
                        <Badge
                          count={`真实度 ${score}分`}
                          style={{
                            backgroundColor: authenticityColor(score),
                            fontSize: 11,
                          }}
                        />
                      </div>
                      <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                        <UserOutlined /> {job.apply_count || 0}人申请
                      </div>
                      {job.hiring_count > 0 && (
                        <div style={{ marginTop: 4, color: '#52c41a', fontSize: 11 }}>
                          <HistoryOutlined /> 累计招聘{job.hiring_count}人
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Empty description="暂无符合条件的职位" />
      )}

      {total > 0 && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Pagination
            current={page}
            total={total}
            pageSize={pageSize}
            onChange={setPage}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
}
