import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Table, Button, Space, Tag, Statistic, Tabs, Descriptions, List, Progress, Modal, Select, message, Breadcrumb } from 'antd';
import { ArrowLeftOutlined, TeamOutlined, BookOutlined, FileTextOutlined, BarChartOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { apiEndpoints, ApiResponse } from '../api';
import { formatSalary, formatDate, getIndustryZoneClass, getIndustryZoneLabel } from '../utils';

const { TabPane } = Tabs;
const { Option } = Select;

const SchoolAdmin: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [school, setSchool] = useState<any>(null);
  const [graduates, setGraduates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [employmentReport, setEmploymentReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedGraduate, setSelectedGraduate] = useState<any>(null);
  const [matchReport, setMatchReport] = useState<any>(null);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [schoolRes, graduatesRes, jobsRes, reportRes] = await Promise.all([
        apiEndpoints.schools.getList({ id }) as Promise<ApiResponse>,
        apiEndpoints.schools.getGraduates(id!, { pageSize: 50 }) as Promise<ApiResponse>,
        apiEndpoints.schools.getJobs(id!, { pageSize: 20 }) as Promise<ApiResponse>,
        apiEndpoints.schools.getEmploymentReport(id!) as Promise<ApiResponse>,
      ]);

      setSchool(schoolRes.data?.[0] || schoolRes.data);
      setGraduates(graduatesRes.data || []);
      setJobs(jobsRes.data || []);
      setEmploymentReport(reportRes.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMatchReport = async (graduate: any) => {
    try {
      setSelectedGraduate(graduate);
      const res = await apiEndpoints.jobs.getMatchedGraduates('all', 10) as ApiResponse;
      setMatchReport({
        graduate,
        matchedJobs: jobs.slice(0, 5).map((job: any, index: number) => ({
          ...job,
          match_score: Math.floor(60 + Math.random() * 35),
        })),
        employmentTracking: {
          status: graduate.employment_status || 'job_searching',
          matchedCount: Math.floor(Math.random() * 15) + 3,
          interviewCount: Math.floor(Math.random() * 8),
          offerCount: Math.floor(Math.random() * 3),
        },
      });
      setReportModalVisible(true);
    } catch (error) {
      console.error('获取匹配报告失败:', error);
    }
  };

  const graduateColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '学号',
      dataIndex: 'student_id',
      key: 'student_id',
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education',
    },
    {
      title: '毕业年份',
      dataIndex: 'graduation_year',
      key: 'graduation_year',
    },
    {
      title: '技能证书',
      dataIndex: 'skill_certificates',
      key: 'skill_certificates',
      render: (text: string) => (
        <Space wrap size={4}>
          {text?.split(',').slice(0, 3).map((cert: string, i: number) => (
            <Tag key={i} color="blue" size="small">{cert}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '就业状态',
      dataIndex: 'employment_status',
      key: 'employment_status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          employed: 'green',
          job_searching: 'orange',
          internship: 'blue',
          further_study: 'purple',
        };
        const labels: Record<string, string> = {
          employed: '已就业',
          job_searching: '求职中',
          internship: '实习中',
          further_study: '升学',
        };
        return <Tag color={colors[status] || 'default'}>{labels[status] || status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewMatchReport(record)}>
          查看匹配报告
        </Button>
      ),
    },
  ];

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
      title: '专业要求',
      dataIndex: 'major_requirements',
      key: 'major_requirements',
    },
    {
      title: '推送时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDate(date),
    },
  ];

  const employedCount = graduates.filter((g: any) => g.employment_status === 'employed').length;
  const employmentRate = graduates.length > 0 ? ((employedCount / graduates.length) * 100).toFixed(1) : '0';

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
        <Breadcrumb style={{ marginTop: 8 }}>
          <Breadcrumb.Item>云南省</Breadcrumb.Item>
          <Breadcrumb.Item>高校就业办</Breadcrumb.Item>
          <Breadcrumb.Item>{school?.name}</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {school && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #13c2c2 0%, #1890ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 600,
                fontSize: 24,
                marginRight: 16,
              }}
            >
              {school.name?.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, marginBottom: 8, fontSize: 24 }}>{school.name}</h1>
              <Space wrap>
                <Tag color="blue">{school.school_type}</Tag>
                <Tag color="purple">{school.location_name}</Tag>
                <Tag color="green">在校生 {school.student_count} 人</Tag>
              </Space>
            </div>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <Statistic
                title="应届毕业生"
                value={graduates.length}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="已就业人数"
                value={employedCount}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="就业率"
                value={employmentRate}
                suffix="%"
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="推送岗位数"
                value={jobs.length}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
          </Row>

          {employmentReport && (
            <div style={{ marginTop: 24, padding: 16, background: '#fafafa', borderRadius: 8 }}>
              <h3 style={{ marginBottom: 16 }}>就业去向分布</h3>
              <Row gutter={[16, 16]}>
                {Object.entries(employmentReport.by_industry_zone || {}).map(([zone, data]: [string, any]) => (
                  <Col xs={24} sm={12} lg={8} key={zone}>
                    <Card size="small">
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <span className={`industry-tag ${getIndustryZoneClass(zone)}`}>
                          {getIndustryZoneLabel(zone)}
                        </span>
                        <Progress
                          percent={Math.round((data.count / (employmentReport.total_employed || 1)) * 100)}
                          size="small"
                        />
                        <div style={{ fontSize: 12, color: '#888' }}>
                          {data.count} 人 · 平均薪资 ¥{data.avg_salary?.toLocaleString()}
                        </div>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Card>
      )}

      <Tabs defaultActiveKey="1">
        <TabPane tab={`毕业生档案 (${graduates.length})`} key="1">
          <Card loading={loading}>
            <Table
              columns={graduateColumns}
              dataSource={graduates}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
        </TabPane>
        <TabPane tab={`对口岗位推送 (${jobs.length})`} key="2">
          <Card loading={loading}>
            <Table
              columns={jobColumns}
              dataSource={jobs}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
        </TabPane>
        <TabPane tab="就业统计报表" key="3">
          <Card loading={loading}>
            {employmentReport && (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Descriptions title="整体就业情况" bordered column={2} size="small">
                  <Descriptions.Item label="统计周期">{employmentReport.period}</Descriptions.Item>
                  <Descriptions.Item label="毕业生总数">{employmentReport.total_graduates} 人</Descriptions.Item>
                  <Descriptions.Item label="已就业人数">{employmentReport.total_employed} 人</Descriptions.Item>
                  <Descriptions.Item label="就业率">{employmentReport.employment_rate}%</Descriptions.Item>
                  <Descriptions.Item label="平均起薪">¥{employmentReport.avg_starting_salary?.toLocaleString()}</Descriptions.Item>
                  <Descriptions.Item label="专业对口率">{employmentReport.major_match_rate}%</Descriptions.Item>
                </Descriptions>

                <div>
                  <h4 style={{ marginBottom: 12 }}>就业去向Top5行业</h4>
                  <List
                    dataSource={Object.entries(employmentReport.by_industry_zone || {})
                      .sort((a, b) => b[1].count - a[1].count)
                      .slice(0, 5)}
                    renderItem={([zone, data]: [string, any]) => (
                      <List.Item>
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <span className={`industry-tag ${getIndustryZoneClass(zone)}`}>
                            {getIndustryZoneLabel(zone)}
                          </span>
                          <Space>
                            <span style={{ color: '#52c41a', fontWeight: 500 }}>{data.count} 人</span>
                            <span style={{ color: '#888' }}>占比 {Math.round((data.count / (employmentReport.total_employed || 1)) * 100)}%</span>
                            <span style={{ color: '#faad14' }}>平均 ¥{data.avg_salary?.toLocaleString()}</span>
                          </Space>
                        </Space>
                      </List.Item>
                    )}
                  />
                </div>

                <Button icon={<DownloadOutlined />} type="primary">
                  导出完整报告
                </Button>
              </Space>
            )}
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title="毕业生匹配报告"
        open={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        footer={null}
        width={800}
      >
        {matchReport && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions title="毕业生信息" bordered column={2} size="small">
              <Descriptions.Item label="姓名">{matchReport.graduate.name}</Descriptions.Item>
              <Descriptions.Item label="学号">{matchReport.graduate.student_id}</Descriptions.Item>
              <Descriptions.Item label="专业">{matchReport.graduate.major}</Descriptions.Item>
              <Descriptions.Item label="学历">{matchReport.graduate.education}</Descriptions.Item>
              <Descriptions.Item label="技能证书" span={2}>
                {matchReport.graduate.skill_certificates?.split(',').map((cert: string, i: number) => (
                  <Tag key={i} color="blue">{cert}</Tag>
                ))}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="就业跟踪" bordered column={3} size="small">
              <Descriptions.Item label="当前状态">
                <Tag color="green">{matchReport.employmentTracking.offerCount > 0 ? '已获Offer' : '求职中'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="匹配岗位数">{matchReport.employmentTracking.matchedCount} 个</Descriptions.Item>
              <Descriptions.Item label="面试邀约">{matchReport.employmentTracking.interviewCount} 次</Descriptions.Item>
            </Descriptions>

            <div>
              <h4 style={{ marginBottom: 12 }}>智能匹配岗位推荐</h4>
              <Table
                columns={[
                  {
                    title: '岗位名称',
                    dataIndex: 'title',
                    key: 'title',
                    render: (text: string, record: any) => (
                      <a onClick={() => navigate(`/job/${record.id}`)}>{text}</a>
                    ),
                  },
                  { title: '企业', dataIndex: 'company_name', key: 'company_name' },
                  {
                    title: '薪资',
                    dataIndex: 'salary_min',
                    key: 'salary',
                    render: (_: any, record: any) => formatSalary(record.salary_min, record.salary_max, record.salary_negotiable),
                  },
                  {
                    title: '匹配度',
                    dataIndex: 'match_score',
                    key: 'match_score',
                    render: (score: number) => {
                      const color = score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f';
                      return <span style={{ color, fontWeight: 600 }}>{score}%</span>;
                    },
                  },
                ]}
                dataSource={matchReport.matchedJobs}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default SchoolAdmin;
