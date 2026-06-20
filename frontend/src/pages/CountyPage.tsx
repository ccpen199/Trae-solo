import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, Table, Button, Space, List, Tabs, Tag, Descriptions } from 'antd';
import { BuildOutlined, TeamOutlined, ReadOutlined, CalendarOutlined, BookOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useAppStore } from '../store';
import { apiEndpoints, ApiResponse } from '../api';
import { formatSalary, formatDate, getIndustryZoneClass, getIndustryZoneLabel } from '../utils';

const { TabPane } = Tabs;

const CountyPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCurrentLevel, setCurrentDivision } = useAppStore();
  const [stats, setStats] = useState<any>({});
  const [jobs, setJobs] = useState<any[]>([]);
  const [graduates, setGraduates] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [divisionInfo, setDivisionInfo] = useState<any>(null);
  const [policies, setPolicies] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadDivisionInfo();
      loadData();
    }
  }, [id]);

  const loadDivisionInfo = async () => {
    try {
      const res = await apiEndpoints.divisions.getTree() as ApiResponse;
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
        const division = findDivision(res.data, id);
        if (division) {
          setDivisionInfo(division);
          setCurrentLevel('county');
          setCurrentDivision(division);
        }
      }
    } catch (error) {
      console.error('加载行政区划信息失败:', error);
    }
  };

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [statsRes, jobsRes, gradsRes, schoolsRes, policiesRes] = await Promise.all([
        apiEndpoints.stats.getSummary({ admin_division_id: id }) as Promise<ApiResponse>,
        apiEndpoints.jobs.getList({ admin_division_id: id, pageSize: 8 }) as Promise<ApiResponse>,
        apiEndpoints.graduates.getList({ admin_division_id: id, pageSize: 8 }) as Promise<ApiResponse>,
        apiEndpoints.schools.getList({ admin_division_id: id }) as Promise<ApiResponse>,
        apiEndpoints.policies.getList({ admin_division_id: id, pageSize: 5 }) as Promise<ApiResponse>,
      ]);

      setStats(statsRes.data);
      setJobs(jobsRes.data || []);
      setGraduates(gradsRes.data || []);
      setSchools(schoolsRes.data || []);
      setPolicies(policiesRes.data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
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
      title: '发布时间',
      dataIndex: 'publish_date',
      key: 'publish_date',
      render: (date: string) => formatDate(date),
    },
  ];

  const gradColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <a onClick={() => navigate(`/graduate/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '学校',
      dataIndex: 'school',
      key: 'school',
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
    },
    {
      title: '学历',
      dataIndex: 'education_level',
      key: 'education_level',
    },
    {
      title: '技能',
      dataIndex: 'skills',
      key: 'skills',
      render: (skills: string[]) => (
        <Space wrap>
          {skills?.slice(0, 3).map((skill, idx) => (
            <Tag key={idx} color="blue">{skill}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '就业状态',
      dataIndex: 'employment_status',
      key: 'employment_status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          employed: 'green',
          unemployed: 'red',
          postgraduate: 'blue',
          other: 'default',
        };
        const labelMap: Record<string, string> = {
          employed: '已就业',
          unemployed: '未就业',
          postgraduate: '升学',
          other: '其他',
        };
        return <Tag color={colorMap[status]}>{labelMap[status]}</Tag>;
      },
    },
  ];

  return (
    <div>
      {divisionInfo && (
        <Card style={{ marginBottom: 16 }} size="small">
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            {divisionInfo.full_path?.replace(/\//g, ' · ')} · 就业指导服务站
          </div>
          <Descriptions size="small" column={4}>
            <Descriptions.Item label="下辖乡镇">{divisionInfo.children?.length || 0} 个</Descriptions.Item>
            <Descriptions.Item label="企业数量">{stats.companies || 0} 家</Descriptions.Item>
            <Descriptions.Item label="岗位数量">{stats.jobs || 0} 个</Descriptions.Item>
            <Descriptions.Item label="毕业生人数">{stats.graduates || 0} 人</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card">
            <Statistic
              title="辖区企业"
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
              title="毕业生"
              value={stats.graduates || 0}
              prefix={<ReadOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card blue">
            <Statistic
              title="校园招聘点"
              value={schools.length || 0}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </div>
        </Col>
      </Row>

      <Card
        style={{ marginTop: 16 }}
        size="small"
        title="校园就业指导系统"
        extra={
          <Button type="primary" size="small" disabled={schools.length === 0}>
            {schools.length > 0 ? `共${schools.length}所学校` : '暂无学校数据'}
          </Button>
        }
      >
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
          dataSource={schools}
          renderItem={school => (
            <List.Item>
              <Card
                hoverable
                size="small"
                onClick={() => navigate(`/school/${school.id}`)}
                className="job-card"
              >
                <div style={{ fontWeight: 500, marginBottom: 8 }}>{school.name}</div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                  {school.school_type === 'university' ? '本科院校' : school.school_type === 'college' ? '专科院校' : '职业院校'}
                </div>
                <div style={{ fontSize: 12, color: '#52c41a' }}>
                  {school.majors?.length || 0} 个专业
                </div>
                <Button type="link" size="small" style={{ padding: 0, marginTop: 8 }}>
                  进入就业办后台 <ArrowRightOutlined />
                </Button>
              </Card>
            </List.Item>
          )}
        />
      </Card>

      <Tabs defaultActiveKey="1" style={{ marginTop: 16 }}>
        <TabPane tab="本地招聘岗位" key="1">
          <Table
            columns={jobColumns}
            dataSource={jobs}
            rowKey="id"
            pagination={false}
            loading={loading}
            size="small"
          />
        </TabPane>
        <TabPane tab="毕业生档案" key="2">
          <Table
            columns={gradColumns}
            dataSource={graduates}
            rowKey="id"
            pagination={false}
            loading={loading}
            size="small"
          />
        </TabPane>
        <TabPane tab="就业政策" key="3">
          <List
            dataSource={policies}
            renderItem={policy => (
              <List.Item style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color={policy.policy_type === 'subsidy' ? 'green' : 'blue'}>
                        {policy.policy_type === 'subsidy' ? '补贴政策' : '培训政策'}
                      </Tag>
                      <a style={{ fontWeight: 500 }}>{policy.title}</a>
                    </Space>
                  }
                  description={
                    <div>
                      <div style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>{policy.content}</div>
                      <Space size="middle">
                        <span style={{ color: '#aaa', fontSize: 12 }}>适用对象: {policy.target_group}</span>
                        <span style={{ color: '#aaa', fontSize: 12 }}>发布时间: {formatDate(policy.publish_date)}</span>
                      </Space>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default CountyPage;
