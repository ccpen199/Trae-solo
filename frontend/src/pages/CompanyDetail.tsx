import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Row, Col, Tag, Button, Space, Table, Statistic, Divider, List, Breadcrumb, Progress } from 'antd';
import { ArrowLeftOutlined, BuildOutlined, EnvironmentOutlined, TeamOutlined, StarOutlined, SafetyOutlined, FileTextOutlined } from '@ant-design/icons';
import { apiEndpoints, ApiResponse } from '../api';
import { formatSalary, formatDate, getIndustryZoneClass, getIndustryZoneLabel, getCreditLevelLabel } from '../utils';

const CompanyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [companyRes, jobsRes] = await Promise.all([
        apiEndpoints.companies.getDetail(id!) as Promise<ApiResponse>,
        apiEndpoints.jobs.getList({ company_id: id, pageSize: 20 }) as Promise<ApiResponse>,
      ]);

      setCompany(companyRes.data);
      setJobs(jobsRes.data || []);
    } catch (error) {
      console.error('加载企业详情失败:', error);
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
      title: '薪资',
      dataIndex: 'salary_min',
      key: 'salary',
      render: (_: any, record: any) => (
        <span className="salary-text">{formatSalary(record.salary_min, record.salary_max, record.salary_negotiable)}</span>
      ),
    },
    {
      title: '工作地点',
      dataIndex: 'location_name',
      key: 'location_name',
    },
    {
      title: '学历要求',
      dataIndex: 'education_requirement',
      key: 'education_requirement',
    },
    {
      title: '发布时间',
      dataIndex: 'publish_date',
      key: 'publish_date',
      render: (date: string) => formatDate(date),
    },
  ];

  if (!company) return <Card loading={true} />;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回列表
        </Button>
        <Breadcrumb style={{ marginTop: 8 }}>
          <Breadcrumb.Item>云南省</Breadcrumb.Item>
          <Breadcrumb.Item>企业名录</Breadcrumb.Item>
          <Breadcrumb.Item>{company.name}</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Card loading={loading} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 24 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 600,
              fontSize: 32,
              marginRight: 24,
            }}
          >
            {company.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, marginBottom: 12, fontSize: 28 }}>{company.name}</h1>
            <Space wrap size="middle">
              <span className={`industry-tag ${getIndustryZoneClass(company.industry_zone)}`}>
                {getIndustryZoneLabel(company.industry_zone)}
              </span>
              <span className={`credit-badge ${company.credit_level}`}>
                信用等级: {getCreditLevelLabel(company.credit_level)}
              </span>
              <Tag color="blue">{company.industry}</Tag>
              <Tag color="green"><TeamOutlined /> {company.employee_count}人</Tag>
              <Tag color="purple"><EnvironmentOutlined /> {company.location_name}</Tag>
            </Space>
          </div>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <Statistic
              title="在招岗位"
              value={jobs.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="成立年限"
              value={company.founded_year ? `${2025 - company.founded_year}` : '-'}
              suffix="年"
              prefix={<BuildOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="信用评分"
              value={company.credit_score || 0}
              suffix="/100"
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
        </Row>

        <Divider orientation="left" style={{ marginTop: 32 }}>工商注册信息</Divider>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="统一社会信用代码">
            <span style={{ fontFamily: 'monospace' }}>{company.credit_code}</span>
          </Descriptions.Item>
          <Descriptions.Item label="人社用工备案号">
            <span style={{ fontFamily: 'monospace' }}>{company.labor_filing_number}</span>
          </Descriptions.Item>
          <Descriptions.Item label="法定代表人">{company.legal_representative}</Descriptions.Item>
          <Descriptions.Item label="成立日期">{company.founded_year}年</Descriptions.Item>
          <Descriptions.Item label="注册资本">{company.registered_capital}</Descriptions.Item>
          <Descriptions.Item label="企业类型">{company.company_type}</Descriptions.Item>
          <Descriptions.Item label="经营状态">
            <Tag color={company.business_status === '正常' ? 'green' : 'orange'}>
              {company.business_status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="注册地址">{company.registered_address}</Descriptions.Item>
        </Descriptions>

        <Divider orientation="left" style={{ marginTop: 32 }}>企业简介</Divider>
        <div style={{ lineHeight: 2, color: '#333', whiteSpace: 'pre-wrap' }}>
          {company.description}
        </div>

        <Divider orientation="left" style={{ marginTop: 32 }}>资质信息</Divider>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Card size="small" className="qualification-card">
              <Space>
                <SafetyOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>人社用工备案</div>
                  <div style={{ fontSize: 12, color: '#888' }}>已备案 · 备案号: {company.labor_filing_number}</div>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card size="small" className="qualification-card">
              <Space>
                <StarOutlined style={{ fontSize: 20, color: '#faad14' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>信用等级认证</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{getCreditLevelLabel(company.credit_level)}级 · {company.credit_score}分</div>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        {company.credit_level === 'AAA' && (
          <div style={{ marginTop: 16, padding: 16, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
            <Space>
              <StarOutlined style={{ fontSize: 24, color: '#faad14' }} />
              <div>
                <div style={{ fontWeight: 600, color: '#389e0d' }}>AAA级信用企业</div>
                <div style={{ fontSize: 12, color: '#52c41a' }}>该企业为最高信用等级企业，享受政策补贴优先审批待遇</div>
              </div>
            </Space>
          </div>
        )}
      </Card>

      <Card title={`在招岗位 (${jobs.length})`} loading={loading}>
        <Table
          columns={jobColumns}
          dataSource={jobs}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default CompanyDetail;
