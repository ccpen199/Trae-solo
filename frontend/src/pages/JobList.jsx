import { useState, useEffect } from 'react';
import { Card, Row, Col, Input, Select, Button, Tag, Pagination, Space, DatePicker, Slider, Typography } from 'antd';
import { SearchOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { jobsAPI } from '../utils/api';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title } = Typography;

const SKILLS = [
  '旋挖钻机手', '木工', '电工', '架子工', '钢筋工', '混凝土工', '砌筑工', '抹灰工',
  '防水工', '油漆工', '水暖工', '焊工', '起重工', '信号工', '测量工', '试验工',
  '挖掘机司机', '装载机司机', '塔吊司机', '施工升降机司机', '叉车司机'
];

const REGIONS = [
  '北京市东城区', '北京市西城区', '北京市朝阳区', '北京市海淀区', '北京市丰台区',
  '北京市石景山区', '北京市通州区', '北京市顺义区', '北京市大兴区', '北京市昌平区'
];

const DISTANCES = [
  { value: 0, label: '不限' },
  { value: 5, label: '5km' },
  { value: 10, label: '10km' },
  { value: 20, label: '20km' },
  { value: 50, label: '50km' },
  { value: 100, label: '100km' }
];

const DURATIONS = [
  { value: 0, label: '不限' },
  { value: 7, label: '1周内' },
  { value: 30, label: '1个月内' },
  { value: 90, label: '3个月内' },
  { value: 180, label: '6个月内' }
];

const JOB_TYPES = ['全职', '临时', '包工', '点工'];

function JobList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    keyword: '',
    skill: '',
    location: '',
    minSalary: '',
    maxSalary: '',
    distance: '',
    duration: '',
    jobType: '',
    startDate: '',
    endDate: '',
    page: 1,
    pageSize: 10
  });

  useEffect(() => {
    loadJobs();
  }, [filters]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await jobsAPI.getJobs(filters);
      setJobs(res.data.jobs || res.data);
      setTotal(res.data.total || (res.data || []).length);
    } catch (error) {
      console.error('Load jobs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, page: 1 });
  };

  const handleReset = () => {
    setFilters({
      keyword: '', skill: '', location: '',
      minSalary: '', maxSalary: '', distance: '',
      duration: '', jobType: '', startDate: '', endDate: '',
      page: 1, pageSize: 10
    });
  };

  const getStatusTag = (status) => {
    const statusMap = {
      open: { color: 'green', text: '招聘中' },
      matched: { color: 'blue', text: '已匹配' },
      in_progress: { color: 'orange', text: '进行中' },
      completed: { color: 'gray', text: '已完成' },
      cancelled: { color: 'red', text: '已取消' }
    };
    const s = statusMap[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const handleDateChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setFilters({
        ...filters,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
        page: 1
      });
    } else {
      setFilters({ ...filters, startDate: '', endDate: '', page: 1 });
    }
  };

  return (
    <div className="page-container">
      <Title level={4} style={{ marginBottom: 16 }}>
        招工大厅 <Tag color="blue">{total} 个岗位</Tag>
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle" style={{ marginBottom: showAdvanced ? 16 : 0 }}>
          <Input
            placeholder="搜索关键词（工种/地点/企业）"
            style={{ width: 280 }}
            allowClear
            prefix={<SearchOutlined />}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value, page: 1 })}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="选择工种"
            style={{ width: 160 }}
            allowClear
            showSearch
            value={filters.skill || undefined}
            onChange={(v) => setFilters({ ...filters, skill: v, page: 1 })}
          >
            {SKILLS.map(s => <Option key={s} value={s}>{s}</Option>)}
          </Select>
          <Select
            placeholder="选择区域"
            style={{ width: 160 }}
            allowClear
            showSearch
            value={filters.location || undefined}
            onChange={(v) => setFilters({ ...filters, location: v, page: 1 })}
          >
            {REGIONS.map(r => <Option key={r} value={r}>{r}</Option>)}
          </Select>
          <Select
            placeholder="距离范围"
            style={{ width: 120 }}
            allowClear
            value={filters.distance || undefined}
            onChange={(v) => setFilters({ ...filters, distance: v, page: 1 })}
          >
            {DISTANCES.map(d => <Option key={d.value} value={d.value}>{d.label}</Option>)}
          </Select>
          <Select
            placeholder="用工类型"
            style={{ width: 120 }}
            allowClear
            value={filters.jobType || undefined}
            onChange={(v) => setFilters({ ...filters, jobType: v, page: 1 })}
          >
            {JOB_TYPES.map(t => <Option key={t} value={t}>{t}</Option>)}
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<FilterOutlined />} onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? '收起筛选' : '高级筛选'}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>

        {showAdvanced && (
          <div style={{ paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>日薪范围（元/天）</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Input
                    placeholder="最低"
                    type="number"
                    value={filters.minSalary || ''}
                    onChange={(e) => setFilters({ ...filters, minSalary: e.target.value, page: 1 })}
                  />
                  <span>-</span>
                  <Input
                    placeholder="最高"
                    type="number"
                    value={filters.maxSalary || ''}
                    onChange={(e) => setFilters({ ...filters, maxSalary: e.target.value, page: 1 })}
                  />
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>工期范围</div>
                <RangePicker
                  style={{ width: '100%' }}
                  minDate={dayjs()}
                  onChange={handleDateChange}
                  value={filters.startDate && filters.endDate ?
                    [dayjs(filters.startDate), dayjs(filters.endDate)] : null}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>工期长度</div>
                <Select
                  placeholder="选择工期长度"
                  style={{ width: '100%' }}
                  allowClear
                  value={filters.duration || undefined}
                  onChange={(v) => setFilters({ ...filters, duration: v, page: 1 })}
                >
                  {DURATIONS.map(d => <Option key={d.value} value={d.value}>{d.label}</Option>)}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>薪资水平</div>
                <Slider
                  range
                  min={100}
                  max={1000}
                  step={50}
                  defaultValue={[filters.minSalary || 100, filters.maxSalary || 1000]}
                  onChange={(v) => setFilters({ ...filters, minSalary: v[0], maxSalary: v[1], page: 1 })}
                  tooltip={{ formatter: v => `¥${v}/天` }}
                />
              </Col>
            </Row>
          </div>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        {jobs.map(job => (
          <Col xs={24} md={12} lg={8} key={job.id}>
            <Card
              className="card-hover"
              hoverable
              onClick={() => navigate(`/jobs/${job.id}`)}
              actions={[
                <Button type="primary" size="small" onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}>
                  查看详情
                </Button>,
                <Button size="small" onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}>
                  立即申请
                </Button>
              ]}
            >
              <Card.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>{job.title}</span>
                    {getStatusTag(job.status)}
                  </div>
                }
                description={
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <Tag color="blue">{job.skill_required}</Tag>
                      <Tag color="orange">{job.job_type || '临时'}</Tag>
                      <Tag>{job.workers_needed}人</Tag>
                    </div>
                    <div style={{ color: '#666', marginBottom: 4 }}>
                      📍 {job.location}
                    </div>
                    <div style={{ color: '#666', marginBottom: 4 }}>
                      📅 {job.start_date} ~ {job.end_date}
                    </div>
                    {job.deposit_amount > 0 && (
                      <div style={{ color: '#722ed1', marginBottom: 4 }}>
                        🔒 保证金 ¥{job.deposit_amount}（履约保障）
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <span style={{ color: '#f5222d', fontWeight: 'bold', fontSize: 18 }}>
                        ¥{job.daily_salary} /天
                      </span>
                      <span style={{ color: '#999', fontSize: 12 }}>
                        {job.company_name}
                      </span>
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {total > 0 && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Pagination
            current={filters.page}
            pageSize={filters.pageSize}
            total={total}
            onChange={(page) => setFilters({ ...filters, page })}
          />
        </div>
      )}

      {jobs.length === 0 && !loading && (
        <Card style={{ textAlign: 'center', color: '#999' }}>
          暂无招工信息
        </Card>
      )}
    </div>
  );
}

export default JobList;
