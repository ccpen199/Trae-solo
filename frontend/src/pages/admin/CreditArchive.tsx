import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Descriptions,
  Table,
  Tag,
  Progress,
  Breadcrumb,
  Empty,
  Select,
  Spin,
} from 'antd';
import {
  ArrowLeftOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import type { Company } from '../../types';
import { admin } from '../../api/endpoints';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface DetailedScore {
  name: string;
  score: number;
  level: string;
  weight: number;
  description: string;
}

interface CreditData {
  companyId: number;
  companyName: string;
  reportDate: string;
  overallRating: { score: number; level: string };
  detailedScores: DetailedScore[];
}

const CreditArchive = () => {
  const navigate = useNavigate();
  const { companyId: urlCompanyId } = useParams<{ companyId: string }>();
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [creditData, setCreditData] = useState<CreditData | null>(null);
  const [enterprises, setEnterprises] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(
    urlCompanyId ? parseInt(urlCompanyId) : undefined
  );

  useEffect(() => {
    fetchEnterprises();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchCreditData(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  const fetchEnterprises = async () => {
    try {
      const response = await admin.enterprises({ pageSize: 100, status: 'approved' });
      const list = response.data.list || [];
      setEnterprises(list);
      if (!selectedCompanyId && list.length > 0) {
        setSelectedCompanyId(list[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch enterprises:', error);
    }
  };

  const fetchCreditData = async (id: number) => {
    setLoading(true);
    try {
      const [creditRes, enterprisesRes] = await Promise.all([
        admin.enterpriseCredit(id),
        admin.enterprises({ pageSize: 100 }),
      ]);
      const enterprisesList = enterprisesRes.data.list || [];
      setCreditData(creditRes.data as CreditData);
      const foundCompany = enterprisesList.find((c: Company) => c.id === id);
      if (foundCompany) {
        setCompany(foundCompany);
      }
    } catch (error) {
      console.error('Failed to fetch credit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (value: number) => {
    setSelectedCompanyId(value);
    navigate(`/admin/credit/${value}`, { replace: true });
  };

  const getScoreByName = (name: string): number => {
    if (!creditData?.detailedScores) return 0;
    const found = creditData.detailedScores.find(
      (s: DetailedScore) => s.name === name || s.name?.includes(name)
    );
    return found?.score || 0;
  };

  const overallScore = creditData?.overallRating?.score || 0;

  const getScoreLevel = (score?: number) => {
    if (!score) return { level: '暂无', color: '#d9d9d9', icon: <ExclamationCircleOutlined /> };
    if (score >= 90) return { level: 'AAA', color: '#52c41a', icon: <CheckCircleOutlined /> };
    if (score >= 80) return { level: 'AA', color: '#73d13d', icon: <CheckCircleOutlined /> };
    if (score >= 70) return { level: 'A', color: '#95de64', icon: <CheckCircleOutlined /> };
    if (score >= 60) return { level: 'B', color: '#faad14', icon: <ExclamationCircleOutlined /> };
    if (score >= 50) return { level: 'C', color: '#fa8c16', icon: <ExclamationCircleOutlined /> };
    return { level: 'D', color: '#ff4d4f', icon: <ExclamationCircleOutlined /> };
  };

  const radarOption = {
    tooltip: {},
    legend: {
      data: ['企业评分'],
    },
    radar: {
      indicator: [
        { name: '用工合规', max: 100 },
        { name: '社保缴纳', max: 100 },
        { name: '离职率', max: 100 },
        { name: '薪资准时率', max: 100 },
        { name: '加班合规', max: 100 },
      ],
    },
    series: [
      {
        name: '企业评分',
        type: 'radar',
        data: [
          {
            value: [
              getScoreByName('用工合规'),
              getScoreByName('社保缴纳'),
              getScoreByName('离职率'),
              getScoreByName('薪资准时'),
              getScoreByName('加班合规'),
            ],
            name: '当前评分',
            areaStyle: {
              color: 'rgba(24, 144, 255, 0.3)',
            },
            lineStyle: {
              color: '#1890ff',
            },
            itemStyle: {
              color: '#1890ff',
            },
          },
        ],
      },
    ],
  };

  const trendOption = {
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
    },
    series: [
      {
        data: [72, 75, 78, 82, 85, overallScore],
        type: 'line',
        smooth: true,
        lineStyle: {
          color: '#1890ff',
          width: 3,
        },
        areaStyle: {
          color: 'rgba(24, 144, 255, 0.2)',
        },
        itemStyle: {
          color: '#1890ff',
        },
      },
    ],
  };

  const historyColumns = [
    {
      title: '评估周期',
      dataIndex: 'evaluationPeriod',
      key: 'evaluationPeriod',
      width: 150,
    },
    {
      title: '综合评分',
      dataIndex: 'overallScore',
      key: 'overallScore',
      width: 120,
      render: (score: number) => (
        <Space>
          {score >= 80 ? (
            <RiseOutlined style={{ color: '#52c41a' }} />
          ) : (
            <FallOutlined style={{ color: '#faad14' }} />
          )}
          <Text strong style={{ color: score >= 80 ? '#52c41a' : '#faad14' }}>
            {score}分
          </Text>
        </Space>
      ),
    },
    {
      title: '用工合规',
      dataIndex: 'complianceScore',
      key: 'complianceScore',
      width: 100,
      render: (score: number) => <Progress percent={score} size="small" />,
    },
    {
      title: '社保缴纳',
      dataIndex: 'socialSecurityRate',
      key: 'socialSecurityRate',
      width: 100,
      render: (score: number) => <Progress percent={score} size="small" />,
    },
    {
      title: '薪资准时率',
      dataIndex: 'salaryOnTimeRate',
      key: 'salaryOnTimeRate',
      width: 100,
      render: (score: number) => <Progress percent={score} size="small" />,
    },
    {
      title: '评估时间',
      dataIndex: 'reportDate',
      key: 'reportDate',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const historyData = creditData
    ? [
        {
          id: 1,
          evaluationPeriod: '2024-Q2',
          overallScore: overallScore,
          complianceScore: getScoreByName('用工合规'),
          socialSecurityRate: getScoreByName('社保缴纳'),
          salaryOnTimeRate: getScoreByName('薪资准时'),
          reportDate: creditData.reportDate,
        },
        {
          id: 2,
          evaluationPeriod: '2024-Q1',
          overallScore: 88,
          complianceScore: 92,
          socialSecurityRate: 95,
          salaryOnTimeRate: 90,
          reportDate: '2024-03-31T00:00:00.000Z',
        },
        {
          id: 3,
          evaluationPeriod: '2023-Q4',
          overallScore: 82,
          complianceScore: 85,
          socialSecurityRate: 92,
          salaryOnTimeRate: 98,
          reportDate: '2023-12-31T00:00:00.000Z',
        },
        {
          id: 4,
          evaluationPeriod: '2023-Q3',
          overallScore: 78,
          complianceScore: 80,
          socialSecurityRate: 88,
          salaryOnTimeRate: 95,
          reportDate: '2023-09-30T00:00:00.000Z',
        },
      ]
    : [];

  const scoreLevel = getScoreLevel(overallScore);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载信用档案中..." />
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item onClick={() => navigate('/admin/enterprises')}>
          <a>企业管理</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>信用档案</Breadcrumb.Item>
      </Breadcrumb>

      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <CreditCardOutlined /> 企业信用档案
          </Title>
        </Col>
        <Col>
          <Space>
            <Select
              showSearch
              style={{ width: 260 }}
              placeholder="选择企业查看信用档案"
              value={selectedCompanyId}
              onChange={handleCompanyChange}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {enterprises.map(c => (
                <Option key={c.id} value={c.id}>
                  {c.companyName}
                </Option>
              ))}
            </Select>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              返回列表
            </Button>
          </Space>
        </Col>
      </Row>

      {company && creditData ? (
        <>
          <Card style={{ marginBottom: '16px' }}>
            <Row gutter={24} align="middle">
              <Col span={16}>
                <Space align="start" style={{ width: '100%' }}>
                  <CreditCardOutlined
                    style={{ fontSize: '48px', color: '#1890ff' }}
                  />
                  <div>
                    <Title level={4} style={{ margin: 0, marginBottom: '8px' }}>
                      {company.companyName}
                    </Title>
                    <Space>
                      <Text type="secondary">
                        {company.industry || '未填写行业'}
                      </Text>
                      <Text type="secondary">
                        {company.scale || '未填写规模'}
                      </Text>
                      <Tag
                        color={company.status === 'approved' ? 'green' : 'orange'}
                      >
                        {company.status === 'approved' ? '已认证' : '待审核'}
                      </Tag>
                    </Space>
                  </div>
                </Space>
              </Col>
              <Col span={8} style={{ textAlign: 'right' }}>
                <Space align="center">
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '48px',
                        fontWeight: 'bold',
                        color: scoreLevel.color,
                        lineHeight: 1,
                      }}
                    >
                      {overallScore || '--'}
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      综合评分
                    </Text>
                  </div>
                  <Tag
                    color={scoreLevel.color}
                    style={{
                      fontSize: '24px',
                      padding: '8px 24px',
                      borderRadius: '8px',
                    }}
                  >
                    {scoreLevel.icon} {creditData.overallRating?.level || scoreLevel.level}
                  </Tag>
                </Space>
              </Col>
            </Row>
          </Card>

          <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
            {creditData.detailedScores?.map((item, index) => (
              <Col xs={24} sm={12} md={8} key={index}>
                <Card>
                  <Space
                    align="start"
                    style={{ width: '100%', justifyContent: 'space-between' }}
                  >
                    <div>
                      <Text type="secondary">{item.name}</Text>
                      <div
                        style={{
                          fontSize: '24px',
                          fontWeight: 'bold',
                          color: item.score >= 80 ? '#52c41a' : '#faad14',
                        }}
                      >
                        {item.score}%
                      </div>
                    </div>
                    {item.score >= 80 ? (
                      <CheckCircleOutlined
                        style={{ fontSize: '32px', color: '#52c41a' }}
                      />
                    ) : (
                      <ExclamationCircleOutlined
                        style={{ fontSize: '32px', color: '#faad14' }}
                      />
                    )}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={16} style={{ marginBottom: '16px' }}>
            <Col xs={24} lg={12}>
              <Card title="五维度评分雷达图">
                <ReactECharts option={radarOption} style={{ height: '350px' }} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="信用评分趋势">
                <ReactECharts option={trendOption} style={{ height: '350px' }} />
              </Card>
            </Col>
          </Row>

          <Card title="详细指标数据" style={{ marginBottom: '16px' }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="评估周期">
                2024-Q2
              </Descriptions.Item>
              <Descriptions.Item label="评估时间">
                {creditData.reportDate
                  ? dayjs(creditData.reportDate).format('YYYY-MM-DD HH:mm')
                  : '-'}
              </Descriptions.Item>
              {creditData.detailedScores?.map((item, index) => (
                <Descriptions.Item key={index} label={`${item.name}说明`}>
                  {item.description}
                </Descriptions.Item>
              ))}
              <Descriptions.Item label="综合评分计算">
                用工合规25% + 社保缴纳25% + 离职率20% + 薪资准时率20% + 加班合规10%
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="历史记录">
            <Table
              columns={historyColumns}
              dataSource={historyData}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </>
      ) : (
        <Empty description="未找到企业信息，请从上方选择器选择企业" />
      )}
    </div>
  );
};

export default CreditArchive;
