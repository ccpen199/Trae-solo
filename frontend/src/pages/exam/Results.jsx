import { useState, useEffect } from 'react';
import {
  Card,
  Tag,
  Button,
  Space,
  Form,
  Input,
  Select,
  Table,
  Row,
  Col,
  Typography,
  Skeleton,
  Empty,
  message,
  Divider,
  Descriptions,
  Alert,
  Statistic,
  Progress,
} from 'antd';
import {
  SearchOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  IdcardOutlined,
  TrophyOutlined,
  FileTextOutlined,
  HistoryOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useRequest from '../../hooks/useRequest';
import { getExamResults, getExams } from '../../api/exam';

const { Title, Text } = Typography;
const { Option } = Select;

const mockExamOptions = [
  { id: 1, name: '2024年国家公务员考试', code: 'G2024' },
  { id: 2, name: '2024年上半年事业单位公开招聘', code: 'S2024' },
  { id: 3, name: '2024年一级建造师资格考试', code: 'J2024' },
  { id: 4, name: '2023年国家公务员考试', code: 'G2023' },
];

const mockResult = {
  id: 1,
  examName: '2024年国家公务员考试',
  examType: 'civil_servant',
  examTypeName: '公务员考试',
  ticketNumber: 'G2024110010012345',
  name: '张三',
  idCard: '110101199001011234',
  examTime: '2024-11-26',
  publishTime: '2024-12-15 09:00:00',
  totalScore: 128.5,
  totalFullScore: 200,
  passScore: 105,
  rank: 128,
  totalApplicants: 125800,
  status: 'passed',
  position: '办公厅综合处一级主任科员及以下',
  subjects: [
    { id: 1, name: '行政职业能力测验', score: 68.5, fullScore: 100, passScore: 50, passed: true },
    { id: 2, name: '申论', score: 60.0, fullScore: 100, passScore: 50, passed: true },
  ],
};

const mockHistoryResults = [
  {
    id: 1,
    examName: '2023年国家公务员考试',
    examTypeName: '公务员考试',
    examTime: '2023-11-26',
    totalScore: 115.2,
    totalFullScore: 200,
    status: 'passed',
    rank: 356,
  },
  {
    id: 2,
    examName: '2023年一级建造师资格考试',
    examTypeName: '职业资格',
    examTime: '2023-09-10',
    totalScore: 285.5,
    totalFullScore: 400,
    status: 'passed',
    rank: 89,
  },
  {
    id: 3,
    examName: '2022年下半年事业单位公开招聘',
    examTypeName: '事业单位',
    examTime: '2022-10-15',
    totalScore: 72.5,
    totalFullScore: 100,
    status: 'failed',
    rank: 256,
  },
];

const Results = () => {
  const [form] = Form.useForm();
  const [captcha, setCaptcha] = useState('');
  const [captchaImg, setCaptchaImg] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const { loading, data: results, refresh } = useRequest(getExamResults, {
    onError: () => {
      message.error('获取成绩列表失败');
    },
  });

  const { loading: examsLoading, data: exams } = useRequest(getExams, {
    onError: () => {
      message.error('获取考试列表失败');
    },
  });

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
    setCaptchaImg(generateCaptchaImage(result));
  };

  const generateCaptchaImage = (text) => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f0f7ff';
    ctx.fillRect(0, 0, 100, 40);
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#1E6FDB';
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      ctx.translate(15 + i * 20, 28);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(30, 111, 219, ${Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 100, Math.random() * 40);
      ctx.lineTo(Math.random() * 100, Math.random() * 40);
      ctx.stroke();
    }
    return canvas.toDataURL();
  };

  const getTypeColor = (type) => {
    const colorMap = {
      civil_servant: '#1E6FDB',
      public_institution: '#52C41A',
      professional_qualification: '#FAAD14',
      teacher: '#722ED1',
      medical: '#13C2C2',
      other: '#8C8C8C',
    };
    return colorMap[type] || '#8C8C8C';
  };

  const getStatusTag = (status) => {
    const statusMap = {
      passed: { color: 'success', text: '已通过', icon: <CheckCircleOutlined /> },
      failed: { color: 'error', text: '未通过', icon: <CloseCircleOutlined /> },
    };
    const statusInfo = statusMap[status] || statusMap.failed;
    return <Tag icon={statusInfo.icon} color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const handleQuery = async () => {
    try {
      const values = await form.validateFields();
      if (values.captcha.toUpperCase() !== captcha) {
        message.error('验证码错误');
        generateCaptcha();
        return;
      }
      setQueryResult(mockResult);
      setShowResult(true);
      message.success('查询成功');
    } catch (error) {
      console.log('Validation failed:', error);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setShowResult(false);
    setQueryResult(null);
    generateCaptcha();
  };

  const handleDownload = () => {
    message.success('正在下载成绩通知单...');
  };

  const handleHistoryQuery = (record) => {
    setQueryResult({
      ...mockResult,
      id: record.id,
      examName: record.examName,
      examTypeName: record.examTypeName,
      examTime: record.examTime,
      totalScore: record.totalScore,
      totalFullScore: record.totalFullScore,
      status: record.status,
      rank: record.rank,
    });
    setShowResult(true);
  };

  const subjectColumns = [
    {
      title: '科目名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      render: (score) => <Text strong>{score}</Text>,
    },
    {
      title: '满分',
      dataIndex: 'fullScore',
      key: 'fullScore',
    },
    {
      title: '合格线',
      dataIndex: 'passScore',
      key: 'passScore',
    },
    {
      title: '是否合格',
      dataIndex: 'passed',
      key: 'passed',
      render: (passed) => (
        passed ? <Tag color="success">合格</Tag> : <Tag color="error">不合格</Tag>
      ),
    },
  ];

  const historyColumns = [
    {
      title: '考试名称',
      dataIndex: 'examName',
      key: 'examName',
      render: (text, record) => (
        <Space direction="vertical" size={4}>
          <Text strong>{text}</Text>
          <Tag color={getTypeColor(record.examType)} style={{ margin: 0 }}>{record.examTypeName}</Tag>
        </Space>
      ),
    },
    {
      title: '考试时间',
      dataIndex: 'examTime',
      key: 'examTime',
      width: 120,
    },
    {
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 100,
      render: (score, record) => (
        <Text strong>{score} / {record.totalFullScore}</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank) => <Text strong>第 {rank} 名</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => handleHistoryQuery(record)}>
          查看详情
        </Button>
      ),
    },
  ];

  if (loading || examsLoading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  const examOptions = exams || mockExamOptions;
  const historyResults = results || mockHistoryResults;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>成绩查询</Title>
        <Text type="secondary">查询考试成绩，下载成绩单</Text>
      </div>

      <Alert
        message="成绩查询须知"
        description={
          <div>
            <div>• 请准确输入准考证号、身份证号和验证码进行查询</div>
            <div>• 成绩查询高峰期可能出现页面加载缓慢，请耐心等待</div>
            <div>• 如对成绩有异议，请在规定时间内申请成绩复核</div>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card
        title={
          <Space>
            <SearchOutlined style={{ color: '#1E6FDB' }} />
            成绩查询
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            examId: '',
          }}
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item
                name="examId"
                label="选择考试"
                rules={[{ required: true, message: '请选择考试' }]}
              >
                <Select placeholder="请选择考试">
                  {examOptions.map(exam => (
                    <Option key={exam.id} value={exam.id}>
                      {exam.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item
                name="ticketNumber"
                label="准考证号"
                rules={[
                  { required: true, message: '请输入准考证号' },
                  { min: 10, message: '准考证号长度不正确' },
                ]}
              >
                <Input
                  prefix={<FileTextOutlined />}
                  placeholder="请输入准考证号"
                  maxLength={20}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item
                name="idCard"
                label="身份证号"
                rules={[
                  { required: true, message: '请输入身份证号' },
                  { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '身份证号格式不正确' },
                ]}
              >
                <Input
                  prefix={<IdcardOutlined />}
                  placeholder="请输入身份证号"
                  maxLength={18}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item
                name="captcha"
                label="验证码"
                rules={[{ required: true, message: '请输入验证码' }]}
              >
                <div style={{ display: 'flex', gap: 8 }}>
                  <Input
                    placeholder="请输入验证码"
                    maxLength={4}
                    style={{ flex: 1 }}
                />
                  <img
                    src={captchaImg}
                    alt="验证码"
                    onClick={generateCaptcha}
                    style={{
                      cursor: 'pointer',
                      height: 32,
                      borderRadius: 4,
                      border: '1px solid #d9d9d9',
                    }}
                    title="点击刷新验证码"
                  />
                </div>
              </Form.Item>
            </Col>
          </Row>
          <div style={{ textAlign: 'center' }}>
            <Space size="middle">
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleQuery}
                style={{ background: '#1E6FDB', borderColor: '#1E6FDB' }}
              >
                查询成绩
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </div>
        </Form>
      </Card>

      {showResult && queryResult && (
        <Card
          title={
            <Space>
              <TrophyOutlined style={{ color: '#1E6FDB' }} />
              成绩查询结果
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              style={{ background: '#1E6FDB', borderColor: '#1E6FDB' }}
            >
              下载成绩通知单
            </Button>
          }
          style={{ marginBottom: 24 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Space style={{ marginBottom: 12 }}>
              <Tag color={getTypeColor(queryResult.examType)}>{queryResult.examTypeName}</Tag>
              {getStatusTag(queryResult.status)}
            </Space>
            <Title level={4} style={{ margin: '0 0 16px 0' }}>{queryResult.examName}</Title>
            <Row gutter={[24, 16]} justify="center">
              <Col xs={12} sm={6}>
                <Statistic
                  title="总分"
                  value={queryResult.totalScore}
                  suffix={`/ ${queryResult.totalFullScore}`}
                  valueStyle={{ color: queryResult.status === 'passed' ? '#52C41A' : '#F5222D' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="排名"
                  value={queryResult.rank}
                  suffix={`/ ${queryResult.totalApplicants.toLocaleString()}`}
                  prefix="第"
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="合格线"
                  value={queryResult.passScore}
                  valueStyle={{ color: '#FAAD14' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ padding: '0 24px' }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                    超过比例
                  </Text>
                  <Progress
                    percent={Math.round((1 - queryResult.rank / queryResult.totalApplicants) * 100)}
                    strokeColor="#1E6FDB"
                    format={(percent) => `${percent}%`}
                  />
                </div>
              </Col>
            </Row>
          </div>

          <Divider />

          <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
            <Descriptions.Item label="姓名">{queryResult.name}</Descriptions.Item>
            <Descriptions.Item label="准考证号">
              <Text style={{ fontFamily: 'monospace' }}>{queryResult.ticketNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="身份证号">{queryResult.idCard}</Descriptions.Item>
            <Descriptions.Item label="报考职位">{queryResult.position}</Descriptions.Item>
            <Descriptions.Item label="考试时间">
              {dayjs(queryResult.examTime).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="成绩发布时间">
              {dayjs(queryResult.publishTime).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
          </Descriptions>

          <Title level={5} style={{ marginBottom: 16 }}>
            <Space>
              <FileTextOutlined style={{ color: '#1E6FDB' }} />
              各科成绩明细
            </Space>
          </Title>
          <Table
            columns={subjectColumns}
            dataSource={queryResult.subjects}
            rowKey="id"
            pagination={false}
            size="middle"
          />

          <Divider />

          <div
            style={{
              padding: 20,
              background: queryResult.status === 'passed' ? '#f6ffed' : '#fff2f0',
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            {queryResult.status === 'passed' ? (
              <div>
                <CheckCircleOutlined style={{ fontSize: 32, color: '#52C41A', marginBottom: 8 }} />
                <div style={{ fontSize: 18, color: '#52C41A', fontWeight: 'bold' }}>
                  恭喜您，考试成绩已合格！
                </div>
                <div style={{ color: '#666', marginTop: 8 }}>
                  请关注后续资格审查和面试安排
                </div>
              </div>
            ) : (
              <div>
                <CloseCircleOutlined style={{ fontSize: 32, color: '#F5222D', marginBottom: 8 }} />
                <div style={{ fontSize: 18, color: '#F5222D', fontWeight: 'bold' }}>
                  很遗憾，考试成绩未达到合格标准
                </div>
                <div style={{ color: '#666', marginTop: 8 }}>
                  请继续努力，欢迎下次报考
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card
        title={
          <Space>
            <HistoryOutlined style={{ color: '#1E6FDB' }} />
            历史成绩查询
          </Space>
        }
      >
        <Table
          columns={historyColumns}
          dataSource={historyResults}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          locale={{ emptyText: <Empty description="暂无历史成绩" /> }}
        />
      </Card>
    </div>
  );
};

export default Results;
