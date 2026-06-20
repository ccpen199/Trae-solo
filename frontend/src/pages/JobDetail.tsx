import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Row, Col, Tag, Button, Space, Table, Statistic, Divider, message, Modal, List, Breadcrumb } from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined, BookOutlined, SendOutlined, CheckCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { apiEndpoints, ApiResponse } from '../api';
import { formatSalary, formatDate, getIndustryZoneClass, getIndustryZoneLabel, getCreditLevelLabel, getJobStatusLabel, getJobStatusColor } from '../utils';

const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [matchedGraduates, setMatchedGraduates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [graduateId, setGraduateId] = useState('');

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobRes, matchedRes] = await Promise.all([
        apiEndpoints.jobs.getDetail(id!) as Promise<ApiResponse>,
        apiEndpoints.jobs.getMatchedGraduates(id!, 10) as Promise<ApiResponse>,
      ]);

      setJob(jobRes.data);
      setMatchedGraduates(matchedRes.data || []);

      if (jobRes.data?.company_id) {
        const companyRes = await apiEndpoints.companies.getDetail(jobRes.data.company_id) as ApiResponse;
        setCompany(companyRes.data);
      }
    } catch (error) {
      console.error('加载岗位详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!graduateId) {
      message.warning('请输入毕业生ID');
      return;
    }
    try {
      const res = await apiEndpoints.jobs.apply(id!, graduateId) as ApiResponse;
      if (res.success) {
        message.success('投递成功');
        setApplyModalVisible(false);
        setGraduateId('');
      } else {
        message.error(res.message || '投递失败');
      }
    } catch (error) {
      message.error('投递失败');
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
      dataIndex: 'education',
      key: 'education',
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
  ];

  if (!job) return <Card loading={true} />;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回列表
        </Button>
        <Breadcrumb style={{ marginTop: 8 }}>
          <Breadcrumb.Item>云南省</Breadcrumb.Item>
          <Breadcrumb.Item>招聘岗位</Breadcrumb.Item>
          <Breadcrumb.Item>{job.title}</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="岗位详情" loading={loading}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, marginBottom: 8, fontSize: 24 }}>{job.title}</h2>
                <Space wrap>
                  <span className={`industry-tag ${getIndustryZoneClass(job.industry_zone)}`}>
                    {getIndustryZoneLabel(job.industry_zone)}
                  </span>
                  <Tag color={getJobStatusColor(job.status)}>{getJobStatusLabel(job.status)}</Tag>
                  {job.is_hot && <Tag color="red">热门</Tag>}
                </Space>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="salary-text" style={{ fontSize: 28, fontWeight: 700 }}>
                  {formatSalary(job.salary_min, job.salary_max, job.salary_negotiable)}
                </div>
                <div style={{ color: '#888', fontSize: 12 }}>
                  {job.experience_requirement} · {job.education_requirement}
                </div>
              </div>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <Descriptions column={2} size="small">
              <Descriptions.Item label="招聘人数">{job.headcount}人</Descriptions.Item>
              <Descriptions.Item label="工作地点">
                <Space><EnvironmentOutlined />{job.location_name}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="发布时间">{formatDate(job.publish_date)}</Descriptions.Item>
              <Descriptions.Item label="截止时间">{formatDate(job.expire_date)}</Descriptions.Item>
              <Descriptions.Item label="社保福利" span={2}>
                {job.welfare_tags?.split(',').map((tag: string, i: number) => (
                  <Tag key={i} color="blue">{tag}</Tag>
                ))}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">岗位职责</Divider>
            <div style={{ lineHeight: 2, color: '#333', whiteSpace: 'pre-wrap' }}>
              {job.responsibilities}
            </div>

            <Divider orientation="left">任职要求</Divider>
            <div style={{ lineHeight: 2, color: '#333', whiteSpace: 'pre-wrap' }}>
              {job.requirements}
            </div>

            <Divider orientation="left">技能要求</Divider>
            <Space wrap>
              {job.skill_requirements?.split(',').map((skill: string, i: number) => (
                <Tag key={i} color="green">{skill}</Tag>
              ))}
            </Space>
          </Card>

          {matchedGraduates.length > 0 && (
            <Card title="智能匹配毕业生" style={{ marginTop: 16 }} size="small">
              <Table
                columns={graduateColumns}
                dataSource={matchedGraduates}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          {company && (
            <Card
              title="企业信息"
              extra={<Button type="link" size="small" onClick={() => navigate(`/company/${company.id}`)}>查看详情</Button>}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 24,
                    marginRight: 16,
                  }}
                >
                  {company.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{company.name}</div>
                  <Space>
                    <span className={`credit-badge ${company.credit_level}`}>
                      {getCreditLevelLabel(company.credit_level)}
                    </span>
                  </Space>
                </div>
              </div>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="所属行业">{company.industry}</Descriptions.Item>
                <Descriptions.Item label="企业规模">{company.employee_count}人</Descriptions.Item>
                <Descriptions.Item label="注册地区">{company.location_name}</Descriptions.Item>
                <Descriptions.Item label="统一社会信用代码">
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{company.credit_code}</span>
                </Descriptions.Item>
                <Descriptions.Item label="人社用工备案号">
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{company.labor_filing_number}</span>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="浏览次数"
                  value={job.view_count || 0}
                  prefix={<BookOutlined />}
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="投递人数"
                  value={job.apply_count || 0}
                  prefix={<TeamOutlined />}
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
            </Row>
          </Card>

          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
            block
            onClick={() => setApplyModalVisible(true)}
          >
            立即投递
          </Button>
        </Col>
      </Row>

      <Modal
        title="投递简历"
        open={applyModalVisible}
        onCancel={() => setApplyModalVisible(false)}
        onOk={handleApply}
        okText="确认投递"
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, color: '#888', fontSize: 13 }}>
            投递岗位: <span style={{ color: '#333', fontWeight: 500 }}>{job.title}</span>
          </div>
          <div style={{ color: '#888', fontSize: 13 }}>
            招聘企业: <span style={{ color: '#333', fontWeight: 500 }}>{company?.name}</span>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>毕业生档案ID</label>
          <input
            type="text"
            value={graduateId}
            onChange={(e) => setGraduateId(e.target.value)}
            placeholder="请输入毕业生ID进行投递"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6 }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
            <List
              size="small"
              dataSource={['提示：可在毕业生档案中查看ID', '示例：grad_001']}
              renderItem={(item) => (
                <List.Item>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                  {item}
                </List.Item>
              )}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default JobDetail;
