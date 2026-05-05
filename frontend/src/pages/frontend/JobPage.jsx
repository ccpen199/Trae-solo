import React, { useEffect, useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Input, 
  Select, 
  Pagination, 
  Tag, 
  Typography,
  Button,
  Empty,
  Spin,
  Breadcrumb,
  List,
  Descriptions
} from 'antd';
import { 
  SearchOutlined, 
  EnvironmentOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  EducationOutlined,
  GoldOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jobsApi } from '../../api';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

function JobPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0
  });
  
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    department: searchParams.get('department') || '',
    location: searchParams.get('location') || ''
  });

  useEffect(() => {
    loadJobs();
  }, [filters, pagination.page]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        page_size: pagination.page_size,
        ...filters
      };
      const res = await jobsApi.getList(params);
      setJobs(res.data?.list || []);
      setPagination(prev => ({
        ...prev,
        total: res.data?.pagination?.total || 0
      }));
    } catch (error) {
      console.error('加载职位列表失败:', error);
      setJobs([
        { 
          id: 1, 
          title: '高级前端开发工程师', 
          department: '技术部',
          location: '北京',
          salary_range: '20K-35K',
          job_type: '全职',
          experience_requirement: '3-5年',
          education_requirement: '本科及以上',
          is_recommended: true,
          publish_date: '2024-01-15',
          view_count: 128,
          requirements: '1. 3年以上前端开发经验；2. 熟悉React、Vue等主流框架；3. 熟悉HTML、CSS、JavaScript等前端技术；4. 有大型项目开发经验优先。'
        },
        { 
          id: 2, 
          title: '产品经理', 
          department: '产品部',
          location: '北京',
          salary_range: '15K-25K',
          job_type: '全职',
          experience_requirement: '2-3年',
          education_requirement: '本科及以上',
          is_recommended: true,
          publish_date: '2024-01-12',
          view_count: 95,
          requirements: '1. 2年以上产品经理经验；2. 熟悉产品设计流程；3. 具备优秀的沟通协调能力；4. 有ToB产品经验优先。'
        },
        { 
          id: 3, 
          title: '销售经理', 
          department: '销售部',
          location: '上海',
          salary_range: '18K-30K',
          job_type: '全职',
          experience_requirement: '3-5年',
          education_requirement: '大专及以上',
          is_recommended: false,
          publish_date: '2024-01-10',
          view_count: 256,
          requirements: '1. 3年以上销售经验；2. 熟悉企业级客户开发经验；3. 具备优秀的商务谈判能力；4. 有行业资源者优先。'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, keyword: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
    setSearchParams({ keyword: value });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value || '' }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  return (
    <div style={{ padding: '40px 0', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <Breadcrumb style={{ marginBottom: 24 }}>
          <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>首页</Breadcrumb.Item>
          <Breadcrumb.Item>人力资源</Breadcrumb.Item>
        </Breadcrumb>

        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8}>
              <Text strong>搜索职位：</Text>
              <Search
                placeholder="输入职位名称或关键词"
                allowClear
                enterButton={<><SearchOutlined /> 搜索</>}
                style={{ width: '100%', marginTop: 8 }}
                value={filters.keyword}
                onSearch={handleSearch}
                onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
              />
            </Col>
            <Col xs={12} sm={5}>
              <Text strong>工作地点：</Text>
              <Select
                placeholder="选择城市"
                allowClear
                style={{ width: '100%', marginTop: 8 }}
                value={filters.location || undefined}
                onChange={(value) => handleFilterChange('location', value)}
              >
                <Select.Option value="北京">北京</Select.Option>
                <Select.Option value="上海">上海</Select.Option>
                <Select.Option value="广州">广州</Select.Option>
                <Select.Option value="深圳">深圳</Select.Option>
                <Select.Option value="杭州">杭州</Select.Option>
              </Select>
            </Col>
            <Col xs={12} sm={5}>
              <Text strong>所属部门：</Text>
              <Select
                placeholder="选择部门"
                allowClear
                style={{ width: '100%', marginTop: 8 }}
                value={filters.department || undefined}
                onChange={(value) => handleFilterChange('department', value)}
              >
                <Select.Option value="技术部">技术部</Select.Option>
                <Select.Option value="产品部">产品部</Select.Option>
                <Select.Option value="销售部">销售部</Select.Option>
                <Select.Option value="市场部">市场部</Select.Option>
                <Select.Option value="行政部">行政部</Select.Option>
              </Select>
            </Col>
            <Col xs={24} sm={6}>
              <div style={{ marginTop: 32 }}>
                <Button 
                  type="primary"
                  onClick={() => {
                    setFilters({ keyword: '', department: '', location: '' });
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                >
                  重置筛选
                </Button>
              </div>
            </Col>
          </Row>
        </Card>

        <Spin spinning={loading}>
          {jobs.length > 0 ? (
            <>
              {jobs.map((job) => (
                <Card 
                  key={job.id}
                  style={{ marginBottom: 16, cursor: 'pointer' }}
                  hoverable
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <Row gutter={[24, 16]}>
                    <Col xs={24} md={18}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <Title level={4} style={{ margin: 0 }}>{job.title}</Title>
                        {job.is_recommended && <Tag color="gold">热门职位</Tag>}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
                        <span><TeamOutlined /> {job.department}</span>
                        <span><EnvironmentOutlined /> {job.location}</span>
                        <span><ClockCircleOutlined /> {job.job_type}</span>
                        <span><EducationOutlined /> {job.experience_requirement}</span>
                        <span>{job.education_requirement}</span>
                      </div>
                      {job.requirements && (
                        <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                          {job.requirements}
                        </Paragraph>
                      )}
                    </Col>
                    <Col xs={24} md={6} style={{ textAlign: 'right' }}>
                      <div style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 24, color: '#f5222d', fontWeight: 'bold' }}>
                          {job.salary_range}
                        </Text>
                      </div>
                      <div style={{ color: '#999', fontSize: 12 }}>
                        <div>发布时间：{job.publish_date}</div>
                        <div>浏览次数：{job.view_count || 0}</div>
                      </div>
                      <Button type="primary" style={{ marginTop: 12 }}>
                        查看详情
                      </Button>
                    </Col>
                  </Row>
                </Card>
              ))}

              {pagination.total > 0 && (
                <div style={{ marginTop: 40, textAlign: 'center' }}>
                  <Pagination
                    current={pagination.page}
                    pageSize={pagination.page_size}
                    total={pagination.total}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    showQuickJumper
                    showTotal={(total) => `共 ${total} 个职位`}
                  />
                </div>
              )}
            </>
          ) : (
            <Card>
              <Empty description="暂无招聘职位" />
            </Card>
          )}
        </Spin>

        <Card title="为什么加入我们" style={{ marginTop: 40 }}>
          <Row gutter={[32, 32]}>
            <Col xs={24} sm={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }}>
                  <GoldOutlined />
                </div>
                <Title level={4}>有竞争力的薪酬</Title>
                <Text type="secondary">提供行业内有竞争力的薪酬待遇，定期进行薪酬调整</Text>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }}>
                  <TeamOutlined />
                </div>
                <Title level={4}>完善的培训体系</Title>
                <Text type="secondary">提供丰富的培训机会，帮助员工实现职业发展</Text>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, color: '#722ed1', marginBottom: 16 }}>
                  <EnvironmentOutlined />
                </div>
                <Title level={4}>舒适的办公环境</Title>
                <Text type="secondary">现代化办公设施，轻松愉悦的工作氛围</Text>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
}

export default JobPage;
