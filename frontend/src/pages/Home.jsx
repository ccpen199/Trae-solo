import React, { useState, useEffect } from 'react';
import { Input, Select, Card, Row, Col, Tag, Button, Pagination, message, Space, Empty, Alert } from 'antd';
import { SearchOutlined, FilterOutlined, EyeOutlined, DashboardOutlined, BarChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

const Home = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    keyword: '',
    category: '',
    city: '',
    page: 1,
    pageSize: 10,
  });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/jobs/categories');
      setCategories(res.data.tree || []);
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.category) params.category = filters.category;
      if (filters.city) params.city = filters.city;
      params.page = filters.page;
      params.pageSize = filters.pageSize;

      const res = await api.get('/jobs', { params });
      setJobs(res.data.jobs || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      message.error('加载职位列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getSalaryText = (min, max) => {
    if (!min && !max) return '面议';
    if (min === max) return `${min / 1000}K`;
    return `${min / 1000}K-${max / 1000}K`;
  };

  const getQualificationTag = (status) => {
    const config = {
      approved: { color: 'green', text: '已认证' },
      pending: { color: 'orange', text: '待审核' },
      rejected: { color: 'red', text: '未通过' },
    };
    const cfg = config[status] || config.pending;
    return <Tag color={cfg.color}>{cfg.text}</Tag>;
  };

  const renderCategoryOptions = (items, level = 0) => {
    return items.map(item => (
      <React.Fragment key={item.category_code}>
        <Option value={item.category_code} style={{ paddingLeft: level * 16 }}>
          {level > 0 ? '　' : ''}{item.category_name}
        </Option>
        {item.children?.length > 0 && renderCategoryOptions(item.children, level + 1)}
      </React.Fragment>
    ));
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)',
        borderRadius: 12,
        padding: '48px 32px',
        marginBottom: 24,
        color: '#fff',
      }}>
        <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
          先进制造业人才招聘平台
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, marginBottom: 24 }}>
          专注CNC编程、模具设计、自动化设备、品质管理等制造业核心岗位
        </p>
        <Search
          placeholder="搜索岗位名称、关键词..."
          size="large"
          prefix={<SearchOutlined />}
          allowClear
          value={filters.keyword}
          onChange={(e) => setFilters(f => ({ ...f, keyword: e.target.value, page: 1 }))}
          onSearch={(value) => setFilters(f => ({ ...f, keyword: value, page: 1 }))}
          style={{ maxWidth: 600 }}
        />
      </div>

      <Alert
        message="制造业岗位分类国家标准（GB/T 6565-2015）"
        description={
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 8 }}>
            <Space>
              <Button type="primary" icon={<DashboardOutlined />} onClick={() => navigate('/dashboard')}>
                查看行业数据看板
              </Button>
              <Button icon={<BarChartOutlined />} onClick={() => navigate('/dashboard')}>
                岗位供需比 · 入职周期 · 留存率分析
              </Button>
            </Space>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
              分类编码结构：MFG（制造业）- 001（大类）- 001（小类）
            </span>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16, background: 'rgba(255,255,255,0.95)', border: 'none' }}
      />

      <Card style={{ marginBottom: 16 }} bordered={false}>
        <Space wrap>
          <FilterOutlined style={{ color: '#8c8c8c' }} />
          <span style={{ color: '#595959', marginRight: 8 }}>岗位类别：</span>
          <Select
            placeholder="全部类别"
            style={{ width: 200 }}
            allowClear
            value={filters.category || undefined}
            onChange={(value) => setFilters(f => ({ ...f, category: value || '', page: 1 }))}
          >
            {renderCategoryOptions(categories)}
          </Select>

          <span style={{ color: '#595959', marginRight: 8 }}>工作城市：</span>
          <Select
            placeholder="全部城市"
            style={{ width: 150 }}
            allowClear
            value={filters.city || undefined}
            onChange={(value) => setFilters(f => ({ ...f, city: value || '', page: 1 }))}
          >
            <Option value="上海">上海</Option>
            <Option value="苏州">苏州</Option>
            <Option value="深圳">深圳</Option>
            <Option value="东莞">东莞</Option>
            <Option value="广州">广州</Option>
            <Option value="无锡">无锡</Option>
          </Select>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={fetchJobs}
          >
            搜索筛选
          </Button>
          <Button
            onClick={() => setFilters({
              keyword: '',
              category: '',
              city: '',
              page: 1,
              pageSize: filters.pageSize,
            })}
          >
            重置筛选
          </Button>
        </Space>
        {categories.length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: '#595959' }}>发现分类：</span>
            {categories.slice(0, 6).map((category) => (
              <Button
                key={category.category_code}
                size="small"
                onClick={() => setFilters(f => ({ ...f, category: category.category_code, page: 1 }))}
              >
                {category.category_name}
              </Button>
            ))}
          </div>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        {jobs.map(job => (
          <Col xs={24} sm={12} lg={8} key={job.id}>
            <Card
              hoverable
              className="card-shadow fade-in"
              onClick={() => navigate(`/jobs/${job.id}`)}
              actions={[
                <Button type="link" icon={<EyeOutlined />} onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}>
                  查看详情
                </Button>
              ]}
            >
              <Card.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{job.job_title}</span>
                    <span className="salary-text">{getSalaryText(job.salary_min, job.salary_max)}</span>
                  </div>
                }
                description={
                  <div style={{ marginTop: 12 }}>
                    <div style={{ marginBottom: 8, color: '#595959' }}>
                      {job.enterprise_name}
                      {getQualificationTag(job.qualification_status)}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Tag color="blue">{job.category_name}</Tag>
                      <Tag color="#f0f0f0" style={{ color: '#8c8c8c', fontFamily: 'monospace', fontSize: 11 }}>
                        {job.category_code}
                      </Tag>
                      <Tag>{job.city}</Tag>
                      <Tag>{job.work_experience_required}</Tag>
                      <Tag>{job.education_required}</Tag>
                    </div>
                    {job.ability_model?.technical?.slice(0, 4).map((skill, idx) => (
                      <Tag key={idx} className="tag-gap" color="#f0f0f0" style={{ color: '#595959' }}>
                        {skill}
                      </Tag>
                    ))}
                    <div style={{ marginTop: 12, fontSize: 12, color: '#8c8c8c', textAlign: 'right' }}>
                      发布于 {dayjs(job.created_at).format('YYYY-MM-DD')}
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {jobs.length === 0 && !loading && (
        <Empty description="暂无符合条件的岗位" style={{ margin: '60px 0' }} />
      )}

      {total > 0 && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Pagination
            current={filters.page}
            pageSize={filters.pageSize}
            total={total}
            showSizeChanger
            showQuickJumper
            showTotal={(t) => `共 ${t} 条记录`}
            onChange={(page, pageSize) => setFilters(f => ({ ...f, page, pageSize }))}
          />
        </div>
      )}
    </div>
  );
};

export default Home;
