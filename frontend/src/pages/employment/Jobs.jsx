import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Slider,
  Button,
  Space,
  Tag,
  Checkbox,
  Progress,
  Pagination,
  Empty,
  Skeleton,
  Typography,
  List,
  Avatar,
  Tooltip,
  message,
} from 'antd';
import {
  SearchOutlined,
  HeartOutlined,
  HeartFilled,
  SendOutlined,
  MapPinOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  FilterOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useRequest from '../../hooks/useRequest';
import { getJobs, getRecommendedJobs } from '../../api/employment';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const mockJobs = [
  {
    id: 1,
    title: '高级前端开发工程师',
    salary: '20K-35K',
    company: '科技创新有限公司',
    companyLogo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tech%20company%20logo%20blue&image_size=square',
    location: '北京市朝阳区',
    publishTime: '2024-01-15',
    benefits: ['五险一金', '年终奖金', '带薪年假', '弹性工作'],
    matchScore: 92,
    type: '全职',
    industry: '互联网',
    education: '本科',
    experience: '3-5年',
    companySize: '500-1000人',
  },
  {
    id: 2,
    title: 'Java后端开发工程师',
    salary: '18K-30K',
    company: '智慧政务科技公司',
    companyLogo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=government%20tech%20logo&image_size=square',
    location: '北京市海淀区',
    publishTime: '2024-01-14',
    benefits: ['六险一金', '节日福利', '定期团建', '免费午餐'],
    matchScore: 85,
    type: '全职',
    industry: '政务服务',
    education: '本科',
    experience: '3-5年',
    companySize: '100-500人',
  },
  {
    id: 3,
    title: '产品经理',
    salary: '25K-40K',
    company: '数字科技集团',
    companyLogo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=digital%20tech%20group%20logo&image_size=square',
    location: '上海市浦东新区',
    publishTime: '2024-01-13',
    benefits: ['五险一金', '股票期权', '年度旅游', '健康体检'],
    matchScore: 78,
    type: '全职',
    industry: '金融科技',
    education: '硕士',
    experience: '5-10年',
    companySize: '1000人以上',
  },
  {
    id: 4,
    title: 'UI/UX设计师',
    salary: '15K-25K',
    company: '创意设计工作室',
    companyLogo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=creative%20design%20studio%20logo&image_size=square',
    location: '广州市天河区',
    publishTime: '2024-01-12',
    benefits: ['弹性工作', '设计补贴', '培训机会', '项目奖金'],
    matchScore: 88,
    type: '全职',
    industry: '设计服务',
    education: '本科',
    experience: '1-3年',
    companySize: '50-100人',
  },
  {
    id: 5,
    title: '数据分析师',
    salary: '16K-28K',
    company: '大数据科技公司',
    companyLogo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=big%20data%20tech%20company%20logo&image_size=square',
    location: '深圳市南山区',
    publishTime: '2024-01-11',
    benefits: ['五险一金', '数据补贴', '技术分享', '晋升通道'],
    matchScore: 72,
    type: '全职',
    industry: '大数据',
    education: '本科',
    experience: '1-3年',
    companySize: '100-500人',
  },
  {
    id: 6,
    title: '人力资源专员',
    salary: '8K-12K',
    company: '企业管理咨询公司',
    companyLogo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hr%20consulting%20company%20logo&image_size=square',
    location: '杭州市西湖区',
    publishTime: '2024-01-10',
    benefits: ['五险一金', '生日福利', '年度体检', '节日礼品'],
    matchScore: 68,
    type: '全职',
    industry: '咨询服务',
    education: '本科',
    experience: '不限',
    companySize: '50-100人',
  },
];

const mockRecommendedJobs = [
  { id: 101, title: '高级前端架构师', salary: '35K-50K', company: '互联网巨头', matchScore: 95 },
  { id: 102, title: 'React开发工程师', salary: '22K-35K', company: '创业科技公司', matchScore: 90 },
  { id: 103, title: '全栈开发工程师', salary: '25K-40K', company: '金融科技公司', matchScore: 86 },
];

const jobTypes = ['全部', '全职', '兼职', '实习', '远程'];
const locations = ['全部', '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉'];
const industries = ['互联网', '政务服务', '金融科技', '大数据', '设计服务', '咨询服务', '教育培训'];
const companySizes = ['50人以下', '50-100人', '100-500人', '500-1000人', '1000人以上'];
const educationLevels = ['不限', '大专', '本科', '硕士', '博士'];
const experiences = ['不限', '应届生', '1-3年', '3-5年', '5-10年', '10年以上'];

const Jobs = () => {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedType, setSelectedType] = useState('全部');
  const [selectedLocation, setSelectedLocation] = useState('全部');
  const [salaryRange, setSalaryRange] = useState([0, 100]);
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedEducation, setSelectedEducation] = useState([]);
  const [selectedExperience, setSelectedExperience] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const { loading, data: jobsData } = useRequest(getJobs, {
    onError: () => message.error('获取岗位列表失败'),
  });

  const { loading: recommendLoading, data: recommendedData } = useRequest(getRecommendedJobs, {
    onError: () => message.error('获取推荐岗位失败'),
  });

  const displayJobs = jobsData || mockJobs;
  const displayRecommended = recommendedData || mockRecommendedJobs;

  const filteredJobs = useMemo(() => {
    return displayJobs.filter(job => {
      if (searchKeyword && !job.title.toLowerCase().includes(searchKeyword.toLowerCase()) && 
          !job.company.toLowerCase().includes(searchKeyword.toLowerCase())) {
        return false;
      }
      if (selectedType !== '全部' && job.type !== selectedType) return false;
      if (selectedLocation !== '全部' && !job.location.includes(selectedLocation)) return false;
      if (selectedIndustries.length > 0 && !selectedIndustries.includes(job.industry)) return false;
      if (selectedSizes.length > 0 && !selectedSizes.includes(job.companySize)) return false;
      if (selectedEducation.length > 0 && !selectedEducation.includes(job.education)) return false;
      if (selectedExperience.length > 0 && !selectedExperience.includes(job.experience)) return false;
      return true;
    });
  }, [displayJobs, searchKeyword, selectedType, selectedLocation, selectedIndustries, selectedSizes, selectedEducation, selectedExperience]);

  const paginatedJobs = filteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleFavorite = (jobId) => {
    setFavorites(prev => {
      if (prev.includes(jobId)) {
        message.success('已取消收藏');
        return prev.filter(id => id !== jobId);
      } else {
        message.success('已添加收藏');
        return [...prev, jobId];
      }
    });
  };

  const handleApply = (jobId) => {
    message.success('简历投递成功！');
  };

  const handleJobClick = (jobId) => {
    navigate(`/employment/jobs/${jobId}`);
  };

  const getMatchScoreColor = (score) => {
    if (score >= 90) return '#52C41A';
    if (score >= 80) return '#1E6FDB';
    if (score >= 70) return '#FAAD14';
    return '#F5222D';
  };

  if (loading || recommendLoading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 20 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索岗位、公司名称"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={(value) => setSearchKeyword(value)}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              value={selectedType}
              onChange={setSelectedType}
              size="large"
              style={{ width: '100%' }}
            >
              {jobTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              value={selectedLocation}
              onChange={setSelectedLocation}
              size="large"
              style={{ width: '100%' }}
            >
              {locations.map(loc => (
                <Option key={loc} value={loc}>{loc}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text type="secondary">薪资范围:</Text>
              <Slider
                range
                value={salaryRange}
                onChange={setSalaryRange}
                min={0}
                max={100}
                step={5}
                style={{ flex: 1 }}
                tooltip={{ formatter: (value) => `${value}K` }}
              />
              <Text strong style={{ color: '#1E6FDB', minWidth: 80 }}>
                {salaryRange[0]}K-{salaryRange[1]}K
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={6}>
          <Card
            title={
              <Space>
                <FilterOutlined style={{ color: '#1E6FDB' }} />
                筛选条件
              </Space>
            }
            style={{ position: 'sticky', top: 24 }}
          >
            <div style={{ marginBottom: 20 }}>
              <Title level={5} style={{ marginBottom: 12 }}>行业</Title>
              <Checkbox.Group
                value={selectedIndustries}
                onChange={setSelectedIndustries}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                {industries.map(ind => (
                  <Checkbox key={ind} value={ind}>{ind}</Checkbox>
                ))}
              </Checkbox.Group>
            </div>

            <div style={{ marginBottom: 20 }}>
              <Title level={5} style={{ marginBottom: 12 }}>公司规模</Title>
              <Checkbox.Group
                value={selectedSizes}
                onChange={setSelectedSizes}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                {companySizes.map(size => (
                  <Checkbox key={size} value={size}>{size}</Checkbox>
                ))}
              </Checkbox.Group>
            </div>

            <div style={{ marginBottom: 20 }}>
              <Title level={5} style={{ marginBottom: 12 }}>学历要求</Title>
              <Checkbox.Group
                value={selectedEducation}
                onChange={setSelectedEducation}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                {educationLevels.map(edu => (
                  <Checkbox key={edu} value={edu}>{edu}</Checkbox>
                ))}
              </Checkbox.Group>
            </div>

            <div style={{ marginBottom: 20 }}>
              <Title level={5} style={{ marginBottom: 12 }}>工作经验</Title>
              <Checkbox.Group
                value={selectedExperience}
                onChange={setSelectedExperience}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                {experiences.map(exp => (
                  <Checkbox key={exp} value={exp}>{exp}</Checkbox>
                ))}
              </Checkbox.Group>
            </div>

            <Button
              type="primary"
              block
              onClick={() => {
                setSelectedIndustries([]);
                setSelectedSizes([]);
                setSelectedEducation([]);
                setSelectedExperience([]);
                setSearchKeyword('');
                setSelectedType('全部');
                setSelectedLocation('全部');
                setSalaryRange([0, 100]);
              }}
            >
              重置筛选
            </Button>
          </Card>
        </Col>

        <Col xs={24} sm={24} md={12}>
          {paginatedJobs.length > 0 ? (
            <>
              <List
                dataSource={paginatedJobs}
                renderItem={(job) => (
                  <List.Item
                    key={job.id}
                    style={{ padding: 0, marginBottom: 16, border: 'none' }}
                  >
                    <Card
                      hoverable
                      onClick={() => handleJobClick(job.id)}
                      bodyStyle={{ padding: 20 }}
                    >
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={18}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                            <Avatar src={job.companyLogo} size={48} shape="square" />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Title level={4} style={{ margin: 0, cursor: 'pointer', color: '#1E6FDB' }}>
                                  {job.title}
                                </Title>
                                <Tag color="#1E6FDB">{job.type}</Tag>
                              </div>
                              <Text type="secondary">{job.company}</Text>
                            </div>
                            <Text strong style={{ color: '#F5222D', fontSize: 18 }}>
                              {job.salary}
                            </Text>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 12, color: '#666' }}>
                            <span>
                              <MapPinOutlined style={{ marginRight: 4 }} />
                              {job.location}
                            </span>
                            <span>
                              <ClockCircleOutlined style={{ marginRight: 4 }} />
                              {job.publishTime}
                            </span>
                            <span>
                              <BulbOutlined style={{ marginRight: 4 }} />
                              {job.experience}
                            </span>
                          </div>

                          <div style={{ marginBottom: 12 }}>
                            {job.benefits.map((benefit, index) => (
                              <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
                                {benefit}
                              </Tag>
                            ))}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Text type="secondary" style={{ minWidth: 80 }}>智能匹配:</Text>
                            <Progress
                              percent={job.matchScore}
                              size="small"
                              strokeColor={getMatchScoreColor(job.matchScore)}
                              style={{ flex: 1, maxWidth: 200 }}
                            />
                            <Text strong style={{ color: getMatchScoreColor(job.matchScore) }}>
                              {job.matchScore}%
                            </Text>
                          </div>
                        </Col>

                        <Col xs={24} sm={6} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
                          <Button
                            type="primary"
                            icon={<SendOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApply(job.id);
                            }}
                            block
                          >
                            立即投递
                          </Button>
                          <Tooltip title={favorites.includes(job.id) ? '取消收藏' : '收藏岗位'}>
                            <Button
                              icon={favorites.includes(job.id) ? <HeartFilled style={{ color: '#F5222D' }} /> : <HeartOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(job.id);
                              }}
                              block
                            >
                              {favorites.includes(job.id) ? '已收藏' : '收藏'}
                            </Button>
                          </Tooltip>
                        </Col>
                      </Row>
                    </Card>
                  </List.Item>
                )}
              />

              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredJobs.length}
                  onChange={setCurrentPage}
                  showSizeChanger={false}
                  showTotal={(total) => `共 ${total} 条记录`}
                />
              </div>
            </>
          ) : (
            <Card>
              <Empty description="暂无符合条件的岗位" />
            </Card>
          )}
        </Col>

        <Col xs={24} sm={24} md={6}>
          <Card
            title={
              <Space>
                <StarOutlined style={{ color: '#FAAD14' }} />
                智能推荐
              </Space>
            }
            style={{ position: 'sticky', top: 24 }}
          >
            {displayRecommended.length > 0 ? (
              <List
                dataSource={displayRecommended}
                renderItem={(job) => (
                  <List.Item
                    key={job.id}
                    style={{ cursor: 'pointer', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                    onClick={() => navigate(`/employment/jobs/${job.id}`)}
                  >
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text strong ellipsis style={{ maxWidth: 150 }}>{job.title}</Text>
                        <Text type="success" strong>{job.matchScore}%</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text type="secondary" ellipsis style={{ maxWidth: 120, fontSize: 12 }}>{job.company}</Text>
                        <Text type="danger" style={{ fontSize: 12 }}>{job.salary}</Text>
                      </div>
                      <Progress
                        percent={job.matchScore}
                        size="small"
                        showInfo={false}
                        strokeColor={getMatchScoreColor(job.matchScore)}
                        style={{ marginTop: 4 }}
                      />
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无推荐" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Jobs;
