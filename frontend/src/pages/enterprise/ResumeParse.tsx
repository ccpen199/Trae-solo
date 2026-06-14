import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Progress,
  Row,
  Col,
  Typography,
  Modal,
  message,
  Spin,
  Descriptions,
  Empty,
} from 'antd';
import {
  FileTextOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { resumes } from '../../api/endpoints';
import type { Resume } from '../../types';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';

const { Title, Text } = Typography;

interface ParseResult {
  resume: Resume;
  score: number;
  parsedData: {
    psPlateSoftware?: {
      ps?: number;
      ai?: number;
      cdr?: number;
      indesign?: number;
    };
    printingExperience?: {
      gravure?: number;
      offset?: number;
      flexo?: number;
    };
    isoCertifications?: string[];
    equipmentExperience?: string[];
    radarData?: {
      name: string;
      value: number;
    }[];
  };
}

const ResumeParse = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Resume[]>([]);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [parsingId, setParsingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await resumes.list({ pageSize: 100 });
      setData(response.data.list);
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusConfig = (resume: Resume) => {
    if (resume.parseScore !== undefined && resume.parseScore !== null) {
      return {
        status: 'parsed',
        text: '已解析',
        color: 'success',
        icon: <CheckCircleOutlined />,
      };
    }
    if (resume.aiParsedData) {
      return {
        status: 'parsing',
        text: '解析中',
        color: 'processing',
        icon: <LoadingOutlined />,
      };
    }
    return {
      status: 'pending',
      text: '待解析',
      color: 'default',
      icon: <WarningOutlined />,
    };
  };

  const handleParse = async (resumeId: number) => {
    setParsingId(resumeId);
    try {
      await resumes.parse(resumeId);
      message.info('简历解析任务已提交，正在处理...');

      setTimeout(async () => {
        try {
          const result = await resumes.getParseResult(resumeId);
          const { parseScore, parsedData } = result.data;
          const resume = data.find((r) => r.id === resumeId);
          if (resume) {
            setParseResult({
              resume,
              score: parseScore,
              parsedData: parsedData || {},
            });
            setDetailModalVisible(true);
          }
          fetchData();
          message.success('简历解析完成');
        } catch (err) {
          console.error('Failed to get parse result:', err);
          message.error('获取解析结果失败');
        } finally {
          setParsingId(null);
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to parse resume:', error);
      message.error('解析失败，请重试');
      setParsingId(null);
    }
  };

  const handleViewDetail = async (resume: Resume) => {
    if (resume.parseScore !== undefined) {
      try {
        const result = await resumes.getParseResult(resume.id);
        const { parseScore, parsedData } = result.data;
        setParseResult({
          resume,
          score: parseScore,
          parsedData: parsedData || {},
        });
        setDetailModalVisible(true);
      } catch (error) {
        console.error('Failed to fetch parse result:', error);
        message.error('获取解析结果失败');
      }
    } else {
      message.info('该简历尚未解析，请先点击解析按钮');
    }
  };

  const getRadarOption = (data: { name: string; value: number }[]) => ({
    tooltip: {
      trigger: 'item',
    },
    radar: {
      indicator: data.map((item) => ({
        name: item.name,
        max: 100,
      })),
      shape: 'polygon',
      splitNumber: 5,
      axisName: {
        color: '#333',
        fontSize: 12,
      },
      splitLine: {
        lineStyle: {
          color: ['#e8e8e8'],
        },
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(24, 144, 255, 0.05)', 'rgba(24, 144, 255, 0.1)'],
        },
      },
      axisLine: {
        lineStyle: {
          color: '#d9d9d9',
        },
      },
    },
    series: [
      {
        name: '综合评分',
        type: 'radar',
        data: [
          {
            value: data.map((item) => item.value),
            name: '能力评估',
            areaStyle: {
              color: 'rgba(24, 144, 255, 0.3)',
            },
            lineStyle: {
              color: '#1890ff',
              width: 2,
            },
            itemStyle: {
              color: '#1890ff',
            },
          },
        ],
      },
    ],
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#1890ff';
    if (score >= 40) return '#faad14';
    return '#ff4d4f';
  };

  const columns = [
    {
      title: '候选人',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '期望职位',
      dataIndex: 'expectedPosition',
      key: 'expectedPosition',
      width: 160,
      render: (text: string) => text || '-',
    },
    {
      title: '期望薪资',
      dataIndex: 'expectedSalary',
      key: 'expectedSalary',
      width: 100,
      render: (salary: number) => (salary ? `${salary}K` : '面议'),
    },
    {
      title: '解析状态',
      key: 'parseStatus',
      width: 100,
      render: (_: any, record: Resume) => {
        const config = getStatusConfig(record);
        return <Tag color={config.color}>{config.icon} {config.text}</Tag>;
      },
    },
    {
      title: '解析评分',
      dataIndex: 'parseScore',
      key: 'parseScore',
      width: 120,
      render: (score: number) => {
        if (score === undefined || score === null) return '-';
        return (
          <Text strong style={{ color: getScoreColor(score) }}>
            {score} 分
          </Text>
        );
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: Resume) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleParse(record.id)}
            loading={parsingId === record.id}
            disabled={parsingId === record.id}
          >
            解析
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: '24px' }}>
        <FileTextOutlined style={{ marginRight: '8px' }} />
        简历解析
      </Title>

      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={24}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">简历总数</Text>
              <Title level={3} style={{ margin: '8px 0' }}>
                {data.length}
              </Title>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">已解析</Text>
              <Title level={3} style={{ margin: '8px 0', color: '#52c41a' }}>
                {data.filter((r) => r.parseScore !== undefined).length}
              </Title>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">待解析</Text>
              <Title level={3} style={{ margin: '8px 0', color: '#faad14' }}>
                {data.filter((r) => r.parseScore === undefined).length}
              </Title>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">平均评分</Text>
              <Title level={3} style={{ margin: '8px 0', color: '#1890ff' }}>
                {data.filter((r) => r.parseScore !== undefined).length > 0
                  ? Math.round(
                      data
                        .filter((r) => r.parseScore !== undefined)
                        .reduce((sum, r) => sum + (r.parseScore || 0), 0) /
                        data.filter((r) => r.parseScore !== undefined).length
                    )
                  : '-'}
              </Title>
            </div>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1300 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
        }}
      />

      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>简历解析结果</span>
            {parseResult && (
              <Tag color={getScoreColor(parseResult.score)} style={{ marginLeft: '8px' }}>
                综合评分: {parseResult.score} 分
              </Tag>
            )}
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={900}
      >
        {parseResult ? (
          <Spin spinning={false}>
            <Descriptions column={2} style={{ marginBottom: '24px' }}>
              <Descriptions.Item label="姓名">{parseResult.resume.name}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{parseResult.resume.email}</Descriptions.Item>
              <Descriptions.Item label="电话">{parseResult.resume.phone}</Descriptions.Item>
              <Descriptions.Item label="学历">{parseResult.resume.education || '-'}</Descriptions.Item>
              <Descriptions.Item label="期望职位">
                {parseResult.resume.expectedPosition || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="期望薪资">
                {parseResult.resume.expectedSalary ? `${parseResult.resume.expectedSalary}K` : '面议'}
              </Descriptions.Item>
            </Descriptions>

            <Card title="PS版软件熟练度" size="small" style={{ marginBottom: '16px' }}>
              {parseResult.parsedData.psPlateSoftware ? (
                <Row gutter={16}>
                  {[
                    { key: 'ps', label: 'Photoshop', value: parseResult.parsedData.psPlateSoftware.ps },
                    { key: 'ai', label: 'Illustrator', value: parseResult.parsedData.psPlateSoftware.ai },
                    { key: 'cdr', label: 'CorelDRAW', value: parseResult.parsedData.psPlateSoftware.cdr },
                    { key: 'indesign', label: 'InDesign', value: parseResult.parsedData.psPlateSoftware.indesign },
                  ].map((item) => (
                    <Col span={12} key={item.key} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <Text>{item.label}</Text>
                        <Text strong>{item.value || 0}%</Text>
                      </div>
                      <Progress percent={item.value || 0} showInfo={false} size="small" />
                    </Col>
                  ))}
                </Row>
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>

            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <Card title="印刷工艺经验年限" size="small">
                  {parseResult.parsedData.printingExperience ? (
                    <Space wrap>
                      <Tag color="blue">
                        凹印: {parseResult.parsedData.printingExperience.gravure || 0} 年
                      </Tag>
                      <Tag color="green">
                        胶印: {parseResult.parsedData.printingExperience.offset || 0} 年
                      </Tag>
                      <Tag color="orange">
                        柔印: {parseResult.parsedData.printingExperience.flexo || 0} 年
                      </Tag>
                    </Space>
                  ) : (
                    <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card title="ISO认证经历" size="small">
                  {parseResult.parsedData.isoCertifications &&
                  parseResult.parsedData.isoCertifications.length > 0 ? (
                    <Space wrap>
                      {parseResult.parsedData.isoCertifications.map((iso, idx) => (
                        <Tag color="purple" key={idx}>
                          {iso}
                        </Tag>
                      ))}
                    </Space>
                  ) : (
                    <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </Card>
              </Col>
            </Row>

            <Card title="印刷设备操作经验" size="small" style={{ marginBottom: '16px' }}>
              {parseResult.parsedData.equipmentExperience &&
              parseResult.parsedData.equipmentExperience.length > 0 ? (
                <Space wrap>
                  {parseResult.parsedData.equipmentExperience.map((eq, idx) => (
                    <Tag color="cyan" key={idx}>
                      {eq}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>

            <Card title="综合解析评分雷达图" size="small">
              {parseResult.parsedData.radarData ? (
                <div style={{ height: '350px' }}>
                  <ReactECharts
                    option={getRadarOption(parseResult.parsedData.radarData)}
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>
          </Spin>
        ) : (
          <Empty description="暂无解析结果" />
        )}
      </Modal>
    </div>
  );
};

export default ResumeParse;
