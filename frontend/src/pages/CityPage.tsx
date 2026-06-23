import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, Table, Button, Input, Select, Space, List, Tabs, Radio } from 'antd';
import { SearchOutlined, BuildOutlined, TeamOutlined, ReadOutlined, VideoCameraOutlined, CalendarOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useAppStore } from '../store';
import { apiEndpoints, ApiResponse } from '../api';
import { formatSalary, formatDate, formatDateTime, getIndustryZoneClass, getIndustryZoneLabel, getFairStatusLabel, getFairStatusColor } from '../utils';

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const CityPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCurrentLevel, setCurrentDivision } = useAppStore();
  const [stats, setStats] = useState<any>({});
  const [jobs, setJobs] = useState<any[]>([]);
  const [fairs, setFairs] = useState<any[]>([]);
  const [liveFairs, setLiveFairs] = useState<any[]>([]);
  const [industryZones, setIndustryZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedZone, setSelectedZone] = useState<string | undefined>();
  const [prosperity, setProsperity] = useState<any>(null);
  const [divisionInfo, setDivisionInfo] = useState<any>(null);
  const [fairType, setFairType] = useState<'all' | 'live'>('all');

  useEffect(() => {
    if (id) {
      const abortController = new AbortController();
      loadDivisionInfo(abortController);
      loadData(abortController);
      return () => abortController.abort();
    }
  }, [id]);

  const loadDivisionInfo = async (abortController?: AbortController) => {
    try {
      const res = await apiEndpoints.divisions.getTree() as ApiResponse;
      if (abortController?.signal.aborted) return;
      if (res.success && res.data.length > 0) {
        const findDivision = (nodes: any[], targetId: string): any => {
          for (const node of nodes) {
            if (node.id === targetId) return node;
            if (node.children) {
              const found = findDivision(node.children, targetId);
              if (found) return found;
            }
          }
          return null;
        };
        const division = findDivision(res.data, id!);
        if (division && !abortController?.signal.aborted) {
          setDivisionInfo(division);
          setCurrentLevel('city');
          setCurrentDivision(division);
        }
      }
    } catch (error) {
      console.error('加载行政区划信息失败:', error);
    }
  };

  const loadData = async (abortController?: AbortController) => {
    if (!id) return;
    setLoading(true);
    
    const results = await Promise.allSettled([
      apiEndpoints.stats.getSummary({ admin_division_id: id }) as Promise<ApiResponse>,
      apiEndpoints.jobs.getList({ admin_division_id: id, pageSize: 10 }) as Promise<ApiResponse>,
      apiEndpoints.fairs.getList({ admin_division_id: id, pageSize: 5 }) as Promise<ApiResponse>,
      apiEndpoints.fairs.getList({ admin_division_id: id, is_live: true }) as Promise<ApiResponse>,
      apiEndpoints.prosperity.getCurrent({ admin_division_id: id, period_type: 'monthly' }) as Promise<ApiResponse>,
      apiEndpoints.industryZones.getList() as Promise<ApiResponse>,
    ]);

    if (abortController?.signal.aborted) return;

    const [statsRes, jobsRes, fairsRes, liveFairsRes, prosperityRes, zonesRes] = 
      results.map(r => r.status === 'fulfilled' ? r.value : null);

    if (statsRes?.data) setStats(statsRes.data);
    if (jobsRes) setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);
    if (fairsRes) setFairs(Array.isArray(fairsRes.data) ? fairsRes.data : []);
    if (liveFairsRes) setLiveFairs(Array.isArray(liveFairsRes.data) ? liveFairsRes.data : []);
    if (prosperityRes?.data) setProsperity(prosperityRes.data);
    if (zonesRes) setIndustryZones(Array.isArray(zonesRes.data) ? zonesRes.data : []);
    setLoading(false);
  };

  const handleSearch = async (value: string) => {
    setKeyword(value);
    const res = await apiEndpoints.jobs.getList({
      admin_division_id: id,
      keyword: value,
      industry_zone: selectedZone,
      pageSize: 10,
    }) as ApiResponse;
    setJobs(res.data || []);
  };

  const handleZoneChange = async (value: string | undefined) => {
    setSelectedZone(value);
    const res = await apiEndpoints.jobs.getList({
      admin_division_id: id,
      keyword,
      industry_zone: value,
      pageSize: 10,
    }) as ApiResponse;
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
    },
    {
      title: '薪资',
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
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button type="link" size="small" onClick={() => navigate(`/job/${record.id}`)}>
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      {divisionInfo && (
        <Card style={{ marginBottom: 16 }} size="small">
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            {divisionInfo.name} - 招聘服务平台
          </div>
          <div style={{ color: '#888', fontSize: 13 }}>
            覆盖 {divisionInfo.children?.length || 0} 个区县，聚合本地企业招聘资源，助力高校毕业生就业
          </div>
        </Card>
      )}

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
              title="本地毕业生"
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
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </div>
        </Col>
      </Row>

      {prosperity && (
        <Card style={{ marginTop: 16 }} size="small">
          <Row gutter={16} align="middle">
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <div className="prosperity-score" style={{ fontSize: 36 }}>{prosperity.prosperity_score}</div>
                <div style={{ color: '#888', marginTop: 4 }}>区域用工景气指数</div>
                <Button type="link" size="small" onClick={() => navigate('/prosperity')}>
                  查看全省排名 <ArrowRightOutlined />
                </Button>
              </div>
            </Col>
            <Col span={16}>
              <Row gutter={[16, 8]}>
                <Col xs={12} sm={6}>
                  <div style={{ fontSize: 12, color: '#888' }}>岗位总数</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{prosperity.total_jobs}</div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={{ fontSize: 12, color: '#888' }}>投递总数</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{prosperity.total_applications}</div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={{ fontSize: 12, color: '#888' }}>薪资中位数</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>¥{prosperity.salary_median?.toLocaleString()}</div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={{ fontSize: 12, color: '#888' }}>岗位增长率</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: prosperity.job_growth_rate >= 0 ? '#52c41a' : '#f5222d' }}>
                    {prosperity.job_growth_rate >= 0 ? '+' : ''}{prosperity.job_growth_rate}%
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            title={`${divisionInfo?.name || '本地'}招聘岗位`}
            size="small"
          >
            <Space style={{ marginBottom: 16 }} wrap>
              <Search
                placeholder="搜索岗位、企业"
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                onSearch={handleSearch}
                style={{ width: 280 }}
              />
              <Select
                placeholder="选择产业带"
                allowClear
                style={{ width: 160 }}
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
              pagination={{ pageSize: 10 }}
              loading={loading}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={`${divisionInfo?.name || '本地'}招聘会`}
            size="small"
            style={{ marginBottom: 16 }}
            extra={
              <Radio.Group value={fairType} onChange={e => setFairType(e.target.value)} size="small">
                <Radio.Button value="all">全部</Radio.Button>
                <Radio.Button value="live">
                  <span className="live-tag"><VideoCameraOutlined /> 直播带岗</span>
                </Radio.Button>
              </Radio.Group>
            }
          >
            <List
              dataSource={fairType === 'live' ? liveFairs : fairs}
              renderItem={fair => (
                <List.Item
                  className={`fair-card ${fair.is_live ? 'live' : ''}`}
                  style={{ padding: '12px 0' }}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <a onClick={() => navigate(`/fair/${fair.id}`)} style={{ fontWeight: 500 }}>
                          {fair.title}
                        </a>
                        {fair.is_live && (
                          <Button type="primary" size="small" icon={<VideoCameraOutlined />}>
                            观看直播
                          </Button>
                        )}
                      </Space>
                    }
                    description={
                      <div style={{ fontSize: 12, color: '#888' }}>
                        <Space>
                          <span style={{ color: getFairStatusColor(fair.status) }}>
                            {getFairStatusLabel(fair.status)}
                          </span>
                          <span>{fair.organizer}</span>
                        </Space>
                        <div style={{ marginTop: 4 }}>
                          {formatDateTime(fair.start_time)}
                        </div>
                        <div>{fair.location}</div>
                        <div>
                          {fair.registered_companies}/{fair.max_companies} 家企业 ·
                          {fair.registered_visitors}/{fair.max_visitors} 人预约
                        </div>
                      </div>
                    }
                  />
                  <Button type="link" size="small">预约参会</Button>
                </List.Item>
              )}
            />
          </Card>

          <Card
            title="辖区内高校"
            size="small"
          >
            <List
              dataSource={divisionInfo?.children?.slice(0, 5) || []}
              renderItem={county => (
                <List.Item
                  style={{ padding: '8px 0', cursor: 'pointer' }}
                  onClick={() => navigate(`/county/${county.id}`)}
                >
                  <List.Item.Meta
                    title={`${county.name}就业指导服务站`}
                    description={`${divisionInfo?.name}${county.name}校园招聘服务点`}
                  />
                  <Button type="link" size="small">
                    进入 <ArrowRightOutlined />
                  </Button>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CityPage;
