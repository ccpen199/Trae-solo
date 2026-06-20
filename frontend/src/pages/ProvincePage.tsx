import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Button, Input, Select, Space, Tag, List, Tooltip } from 'antd';
import { SearchOutlined, BuildOutlined, TeamOutlined, ReadOutlined, PlayCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { apiEndpoints, ApiResponse } from '../api';
import { formatSalary, formatDate, getIndustryZoneClass, getIndustryZoneLabel, getFairStatusLabel, getFairStatusColor } from '../utils';

const { Search } = Input;
const { Option } = Select;

const ProvincePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentDivision } = useAppStore();
  const [stats, setStats] = useState<any>({});
  const [jobs, setJobs] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [fairs, setFairs] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [industryZones, setIndustryZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedZone, setSelectedZone] = useState<string | undefined>();
  const [prosperity, setProsperity] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [currentDivision]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, jobsRes, companiesRes, fairsRes, policiesRes, zonesRes, prosperityRes] = await Promise.all([
        apiEndpoints.stats.getSummary({ admin_division_id: currentDivision?.id }) as Promise<ApiResponse>,
        apiEndpoints.jobs.getList({ pageSize: 8 }) as Promise<ApiResponse>,
        apiEndpoints.companies.getList({ pageSize: 6 }) as Promise<ApiResponse>,
        apiEndpoints.fairs.getList({ pageSize: 5, is_live: false }) as Promise<ApiResponse>,
        apiEndpoints.policies.getList({ pageSize: 5 }) as Promise<ApiResponse>,
        apiEndpoints.industryZones.getList() as Promise<ApiResponse>,
        apiEndpoints.prosperity.getCurrent({ admin_division_id: currentDivision?.id, period_type: 'monthly' }) as Promise<ApiResponse>,
      ]);

      setStats(statsRes.data);
      setJobs(jobsRes.data || []);
      setCompanies(companiesRes.data || []);
      setFairs(fairsRes.data || []);
      setPolicies(policiesRes.data || []);
      setIndustryZones(zonesRes.data || []);
      setProsperity(prosperityRes.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (value: string) => {
    setKeyword(value);
    const res = await apiEndpoints.jobs.getList({ keyword: value, industry_zone: selectedZone, pageSize: 8 }) as ApiResponse;
    setJobs(res.data || []);
  };

  const handleZoneChange = async (value: string | undefined) => {
    setSelectedZone(value);
    const res = await apiEndpoints.jobs.getList({ keyword, industry_zone: value, pageSize: 8 }) as ApiResponse;
    setJobs(res.data || []);
  };

  const jobColumns = [
    {
      title: '岗位名称',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <a onClick={() => navigate(`/job/${record.id}`)} style={{ fontWeight: 500 }}>{text}</a>
      ),
    },
    {
      title: '企业',
      dataIndex: 'company_name',
      key: 'company_name',
      render: (text: string, record: any) => (
        <Space>
          <a onClick={() => navigate(`/company/${record.company_id}`)}>{text}</a>
          {record.credit_level && <span className={`credit-badge ${record.credit_level}`}>{record.credit_level}</span>}
        </Space>
      ),
    },
    {
      title: '薪资',
      dataIndex: 'salary_min',
      key: 'salary',
      render: (_: any, record: any) => (
        <span className="salary-text">{formatSalary(record.salary_min, record.salary_max, record.salary_negotiable)}</span>
      ),
    },
    {
      title: '产业带',
      dataIndex: 'industry_zone',
      key: 'industry_zone',
      render: (zone: string) => (
        <span className={`industry-tag ${getIndustryZoneClass(zone)}`}>{getIndustryZoneLabel(zone)}</span>
      ),
    },
    {
      title: '工作地点',
      dataIndex: 'location_name',
      key: 'location_name',
    },
    {
      title: '发布时间',
      dataIndex: 'publish_date',
      key: 'publish_date',
      render: (date: string) => formatDate(date),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card">
            <Statistic
              title="入驻企业"
              value={stats.companies || 0}
              prefix={<BuildOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card green">
            <Statistic
              title="招聘岗位"
              value={stats.jobs || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card orange">
            <Statistic
              title="毕业生人才库"
              value={stats.graduates || 0}
              prefix={<ReadOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card blue">
            <Statistic
              title="招聘会"
              value={stats.fairs || 0}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </div>
        </Col>
      </Row>

      {prosperity && (
        <Card style={{ marginTop: 16 }} size="small">
          <Row gutter={16} align="middle">
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div className="prosperity-score">{prosperity.prosperity_score}</div>
                <div style={{ color: '#888', marginTop: 4 }}>用工景气指数</div>
                <Button type="link" size="small" onClick={() => navigate('/prosperity')}>
                  查看详情 <ArrowRightOutlined />
                </Button>
              </div>
            </Col>
            <Col span={18}>
              <Row gutter={[16, 8]}>
                <Col xs={12} sm={8}>
                  <div style={{ fontSize: 12, color: '#888' }}>岗位总数</div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>{prosperity.total_jobs}</div>
                </Col>
                <Col xs={12} sm={8}>
                  <div style={{ fontSize: 12, color: '#888' }}>投递总数</div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>{prosperity.total_applications}</div>
                </Col>
                <Col xs={12} sm={8}>
                  <div style={{ fontSize: 12, color: '#888' }}>薪资中位数</div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>¥{prosperity.salary_median?.toLocaleString()}</div>
                </Col>
                <Col xs={12} sm={8}>
                  <div style={{ fontSize: 12, color: '#888' }}>岗位增长率</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: prosperity.job_growth_rate >= 0 ? '#52c41a' : '#f5222d' }}>
                    {prosperity.job_growth_rate >= 0 ? '+' : ''}{prosperity.job_growth_rate}%
                  </div>
                </Col>
                <Col xs={12} sm={8}>
                  <div style={{ fontSize: 12, color: '#888' }}>投递增长率</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: prosperity.application_growth_rate >= 0 ? '#52c41a' : '#f5222d' }}>
                    {prosperity.application_growth_rate >= 0 ? '+' : ''}{prosperity.application_growth_rate}%
                  </div>
                </Col>
                <Col xs={12} sm={8}>
                  <div style={{ fontSize: 12, color: '#888' }}>平均薪资</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>¥{prosperity.salary_average?.toLocaleString()}</div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            title="最新招聘岗位"
            extra={
              <Button type="link" onClick={() => navigate('/province')}>
                查看更多 <ArrowRightOutlined />
              </Button>
            }
            size="small"
          >
            <Space style={{ marginBottom: 16 }} wrap>
              <Search
                placeholder="搜索岗位、企业、职位类别"
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                onSearch={handleSearch}
                style={{ width: 320 }}
              />
              <Select
                placeholder="选择产业带"
                allowClear
                style={{ width: 180 }}
                onChange={handleZoneChange}
                value={selectedZone}
              >
                {industryZones.map(zone => (
                  <Option key={zone.key} value={zone.key}>{zone.label}</Option>
                ))}
              </Select>
            </Space>
            <Table
              columns={jobColumns}
              dataSource={jobs}
              rowKey="id"
              pagination={false}
              loading={loading}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title="产业带专区"
            size="small"
            style={{ marginBottom: 16 }}
          >
            <List
              grid={{ gutter: 8, xs: 2, sm: 3, lg: 2 }}
              dataSource={industryZones.slice(0, 8)}
              renderItem={zone => (
                <List.Item>
                  <Card
                    hoverable
                    size="small"
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => handleZoneChange(zone.key)}
                    bodyStyle={{ padding: 12 }}
                  >
                    <span className={`industry-tag ${getIndustryZoneClass(zone.key)}`} style={{ marginBottom: 8 }}>
                      {zone.label}
                    </span>
                    <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                      {prosperity?.industry_zones?.[zone.key]?.jobs || 0} 个岗位
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </Card>

          <Card
            title="近期招聘会"
            size="small"
            style={{ marginBottom: 16 }}
          >
            <List
              dataSource={fairs}
              renderItem={fair => (
                <List.Item
                  className={`fair-card ${fair.is_live ? 'live' : ''}`}
                  style={{ padding: '8px 0' }}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <a onClick={() => navigate(`/fair/${fair.id}`)} style={{ fontWeight: 500 }}>
                          {fair.title}
                        </a>
                        {fair.is_live && <Tag color="red" className="live-tag">直播中</Tag>}
                        <Tag color={getFairStatusColor(fair.status)}>{getFairStatusLabel(fair.status)}</Tag>
                      </Space>
                    }
                    description={
                      <div style={{ fontSize: 12, color: '#888' }}>
                        <div>{fair.organizer}</div>
                        <div>{formatDate(fair.start_time)} · {fair.location}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card
            title="政策补贴指引"
            size="small"
          >
            <List
              dataSource={policies}
              renderItem={policy => (
                <List.Item style={{ padding: '8px 0' }}>
                  <Tooltip title={policy.content}>
                    <a style={{ fontSize: 13 }}>{policy.title}</a>
                  </Tooltip>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{formatDate(policy.publish_date)}</div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="优质企业"
        extra={
          <Button type="link" onClick={() => {}}>
            查看更多 <ArrowRightOutlined />
          </Button>
        }
        size="small"
        style={{ marginTop: 16 }}
      >
        <Row gutter={[16, 16]}>
          {companies.map(company => (
            <Col xs={24} sm={12} lg={8} xl={6} key={company.id}>
              <Card
                hoverable
                className="job-card"
                size="small"
                onClick={() => navigate(`/company/${company.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 6,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 600,
                      marginRight: 12,
                    }}
                  >
                    {company.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {company.name}
                    </div>
                    <Space size={4}>
                      <span className={`credit-badge ${company.credit_level}`}>{company.credit_level}</span>
                      <span className={`industry-tag ${getIndustryZoneClass(company.industry_zone)}`}>
                        {getIndustryZoneLabel(company.industry_zone)}
                      </span>
                    </Space>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>
                  {company.industry} · {company.employee_count}人
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default ProvincePage;
