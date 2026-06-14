import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Form,
  Select,
  DatePicker,
  Modal,
  Space,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Progress,
  Timeline,
  Badge,
  Empty,
  Descriptions,
  List,
  Alert,
  Tooltip,
  Upload,
  Input,
  Tabs,
} from 'antd';
import {
  ShareAltOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  BarChartOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { admin } from '@/api';
import type { DataShareComparison } from '@/types';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

interface CompareRecord {
  id: number;
  dataSource: string;
  compareType: string;
  compareTime: string;
  totalRecords: number;
  matchedCount: number;
  mismatchCount: number;
  pendingCount: number;
  status: 'completed' | 'running' | 'failed';
  operator: string;
  duration: string;
}

const mockCompareRecords: CompareRecord[] = [
  { id: 1, dataSource: '公安人口库', compareType: 'identity', compareTime: '2024-03-10 09:30:00', totalRecords: 12580, matchedCount: 12450, mismatchCount: 130, pendingCount: 0, status: 'completed', operator: '税务管理员', duration: '12分30秒' },
  { id: 2, dataSource: '民政婚姻登记库', compareType: 'family_relation', compareTime: '2024-03-10 09:15:00', totalRecords: 8650, matchedCount: 8580, mismatchCount: 70, pendingCount: 0, status: 'completed', operator: '系统定时任务', duration: '8分15秒' },
  { id: 3, dataSource: '民政死亡登记库', compareType: 'survival', compareTime: '2024-03-10 08:00:00', totalRecords: 15680, matchedCount: 15620, mismatchCount: 60, pendingCount: 0, status: 'completed', operator: '系统定时任务', duration: '15分20秒' },
  { id: 4, dataSource: '卫健医保系统', compareType: 'medical_insurance', compareTime: '2024-03-09 22:00:00', totalRecords: 25800, matchedCount: 25680, mismatchCount: 120, pendingCount: 0, status: 'completed', operator: '系统定时任务', duration: '25分45秒' },
  { id: 5, dataSource: '公安人口库', compareType: 'identity', compareTime: '2024-03-09 09:30:00', totalRecords: 12560, matchedCount: 12430, mismatchCount: 130, pendingCount: 0, status: 'completed', operator: '税务管理员', duration: '11分50秒' },
];

interface ReviewRecord {
  id: number;
  recordId: string;
  userName: string;
  idCard: string;
  compareType: string;
  dataSource: string;
  issueDescription: string;
  reviewStatus: 'pending' | 'confirmed' | 'resolved' | 'rejected';
  reviewTime?: string;
  reviewer?: string;
  reviewComment?: string;
  detectedAt: string;
}

const mockReviewRecords: ReviewRecord[] = [
  { id: 1, recordId: 'COMP-20240310-001', userName: '王建国', idCard: '430101196501011234', compareType: '身份信息比对', dataSource: '公安人口库', issueDescription: '公安系统中姓名为「王建国」，社保系统为「王建国」，身份证号一致但住址信息不一致', reviewStatus: 'pending', detectedAt: '2024-03-10 09:32:15' },
  { id: 2, recordId: 'COMP-20240310-002', userName: '李桂芳', idCard: '430101197205055678', compareType: '生存状态比对', dataSource: '民政死亡登记库', issueDescription: '民政系统显示2023年12月已死亡，但社保系统仍在发放养老金', reviewStatus: 'confirmed', reviewTime: '2024-03-10 10:15:00', reviewer: '税务管理员', reviewComment: '已核实，确已死亡，暂停养老金发放', detectedAt: '2024-03-10 08:05:30' },
  { id: 3, recordId: 'COMP-20240310-003', userName: '张小明', idCard: '430101199008089012', compareType: '亲属关系核验', dataSource: '民政婚姻登记库', issueDescription: '家庭共济申请中配偶关系与民政婚姻登记信息不符', reviewStatus: 'rejected', reviewTime: '2024-03-10 09:45:00', reviewer: '税务管理员', reviewComment: '经核实不存在婚姻关系，驳回共济申请', detectedAt: '2024-03-10 09:20:45' },
  { id: 4, recordId: 'COMP-20240310-004', userName: '刘翠花', idCard: '430101195812123456', compareType: '医保参保比对', dataSource: '卫健医保系统', issueDescription: '社保系统显示已参保，但医保系统无对应参保记录', reviewStatus: 'resolved', reviewTime: '2024-03-10 11:00:00', reviewer: '税务管理员', reviewComment: '已与医保系统同步数据，问题已解决', detectedAt: '2024-03-10 10:30:20' },
];

const dataSourceConfig = {
  police: { name: '公安人口库', icon: <SafetyCertificateOutlined />, color: '#165DFF', description: '居民身份证、户籍信息比对' },
  civil: { name: '民政数据库', icon: <UserOutlined />, color: '#52c41a', description: '婚姻登记、死亡登记比对' },
  health: { name: '卫健医保系统', icon: <DatabaseOutlined />, color: '#eb2f96', description: '医保参保、医疗费用比对' },
};

const compareTypeConfig: Record<string, { name: string; color: string }> = {
  identity: { name: '身份信息比对', color: 'blue' },
  family_relation: { name: '亲属关系核验', color: 'green' },
  survival: { name: '生存状态比对', color: 'red' },
  medical_insurance: { name: '医保参保比对', color: 'purple' },
};

const reviewStatusConfig: Record<string, { text: string; color: string }> = {
  pending: { text: '待复核', color: 'orange' },
  confirmed: { text: '已确认', color: 'red' },
  resolved: { text: '已解决', color: 'green' },
  rejected: { text: '已驳回', color: 'default' },
};

const DataSharePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [compareModalVisible, setCompareModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('compare');
  const [form] = Form.useForm();
  const [compareRecords, setCompareRecords] = useState<CompareRecord[]>(mockCompareRecords);
  const [reviewRecords, setReviewRecords] = useState<ReviewRecord[]>(mockReviewRecords);
  const [selectedRecord, setSelectedRecord] = useState<CompareRecord | null>(null);
  const [selectedReview, setSelectedReview] = useState<ReviewRecord | null>(null);
  const [comparing, setComparing] = useState(false);
  const [compareProgress, setCompareProgress] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await admin.getDataShareCompare();
      console.log('Data share compare:', res);
    } catch (error) {
      console.error('Load data share failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCompare = async (values: { dataSource: string; compareType: string }) => {
    setComparing(true);
    setCompareProgress(0);
    try {
      const interval = setInterval(() => {
        setCompareProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setComparing(false);
            const sourceConfig = dataSourceConfig[values.dataSource as keyof typeof dataSourceConfig];
            const typeConfig = compareTypeConfig[values.compareType];
            const newRecord: CompareRecord = {
              id: Date.now(),
              dataSource: sourceConfig?.name || values.dataSource,
              compareType: values.compareType,
              compareTime: new Date().toLocaleString(),
              totalRecords: Math.floor(Math.random() * 10000) + 5000,
              matchedCount: Math.floor(Math.random() * 10000) + 4800,
              mismatchCount: Math.floor(Math.random() * 200) + 10,
              pendingCount: 0,
              status: 'completed',
              operator: '税务管理员',
              duration: `${Math.floor(Math.random() * 20) + 5}分${Math.floor(Math.random() * 60)}秒`,
            };
            newRecord.matchedCount = newRecord.totalRecords - newRecord.mismatchCount;
            setCompareRecords([newRecord, ...compareRecords]);
            message.success(`数据比对完成，发现 ${newRecord.mismatchCount} 条异常数据`);
            return 100;
          }
          return prev + 5;
        });
      }, 150);
      setCompareModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Compare failed:', error);
      message.error('数据比对失败');
      setComparing(false);
    }
  };

  const openReviewModal = (record: ReviewRecord) => {
    setSelectedReview(record);
    setReviewModalVisible(true);
  };

  const openDetailModal = (record: CompareRecord) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  const handleReview = async (values: { status: string; comment: string }) => {
    if (!selectedReview) return;
    try {
      const updatedRecords = reviewRecords.map((r) =>
        r.id === selectedReview.id
          ? {
              ...r,
              reviewStatus: values.status as ReviewRecord['reviewStatus'],
              reviewTime: new Date().toLocaleString(),
              reviewer: '税务管理员',
              reviewComment: values.comment,
            }
          : r
      );
      setReviewRecords(updatedRecords);
      message.success('复核完成');
      setReviewModalVisible(false);
    } catch (error) {
      console.error('Review failed:', error);
    }
  };

  const stats = () => {
    const totalComparisons = compareRecords.length;
    const totalRecords = compareRecords.reduce((sum, r) => sum + r.totalRecords, 0);
    const totalMismatches = compareRecords.reduce((sum, r) => sum + r.mismatchCount, 0);
    const pendingReviews = reviewRecords.filter((r) => r.reviewStatus === 'pending').length;
    const matchRate = totalRecords > 0 ? Math.round(((totalRecords - totalMismatches) / totalRecords) * 100) : 0;

    return (
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={6}>
          <Card className="shadow-sm border-l-4" style={{ borderLeftColor: '#165DFF' }}>
            <Statistic
              title="累计比对次数"
              value={totalComparisons}
              prefix={<SyncOutlined />}
              valueStyle={{ color: '#165DFF' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="shadow-sm border-l-4" style={{ borderLeftColor: '#52c41a' }}>
            <Statistic
              title="累计比对记录"
              value={totalRecords}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="shadow-sm border-l-4" style={{ borderLeftColor: '#ff4d4f' }}>
            <Statistic
              title="待复核异常"
              value={pendingReviews}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="shadow-sm border-l-4" style={{ borderLeftColor: '#faad14' }}>
            <Row align="middle">
              <Col flex="auto">
                <Statistic
                  title="数据匹配率"
                  value={matchRate}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col>
                <Progress
                  type="dashboard"
                  percent={matchRate}
                  size={80}
                  strokeColor="#52c41a"
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    );
  };

  const dataSourceGuide = () => (
    <Card
      title={
        <div className="flex items-center gap-2">
          <ShareAltOutlined className="text-blue-600" />
          <span style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '16px' }}>
            跨部门数据共享说明
          </span>
        </div>
      }
      className="shadow-sm mb-6"
    >
      <Row gutter={[16, 16]}>
        {Object.entries(dataSourceConfig).map(([key, config]) => (
          <Col xs={24} md={8} key={key}>
            <div className="p-4 rounded-lg h-full" style={{ backgroundColor: `${config.color}10` }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: config.color }}>
                  {config.icon}
                </div>
                <div>
                  <div className="font-medium" style={{ color: config.color }}>
                    {config.name}
                  </div>
                  <div className="text-xs text-gray-500">实时数据接口</div>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• {config.description}</div>
                <div>• 数据沙箱安全隔离</div>
                <div>• 脱敏处理后比对</div>
                <div>• 全程操作留痕可审计</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );

  const compareColumns = [
    {
      title: '数据源',
      dataIndex: 'dataSource',
      key: 'dataSource',
    },
    {
      title: '比对类型',
      dataIndex: 'compareType',
      key: 'compareType',
      render: (val: string) => {
        const config = compareTypeConfig[val];
        return config ? <Tag color={config.color}>{config.name}</Tag> : val;
      },
    },
    {
      title: '比对记录数',
      dataIndex: 'totalRecords',
      key: 'totalRecords',
      render: (val: number) => <span className="font-medium">{val.toLocaleString()}</span>,
    },
    {
      title: '匹配',
      dataIndex: 'matchedCount',
      key: 'matchedCount',
      render: (val: number) => <span className="text-green-600">{val.toLocaleString()}</span>,
    },
    {
      title: '异常',
      dataIndex: 'mismatchCount',
      key: 'mismatchCount',
      render: (val: number) => (
        <Badge count={val} color="red" offset={[5, 0]}>
          <span className="text-red-600">{val.toLocaleString()}</span>
        </Badge>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => {
        const config = {
          completed: { color: 'success', text: '完成', icon: <CheckCircleOutlined /> },
          running: { color: 'processing', text: '比对中', icon: <SyncOutlined spin /> },
          failed: { color: 'error', text: '失败', icon: <CloseCircleOutlined /> },
        };
        const c = config[val as keyof typeof config];
        return (
          <Tag color={c.color} icon={c.icon}>
            {c.text}
          </Tag>
        );
      },
    },
    {
      title: '比对时间',
      dataIndex: 'compareTime',
      key: 'compareTime',
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: CompareRecord) => (
        <Space size="small">
          <Button type="link" size="small" icon={<BarChartOutlined />} onClick={() => openDetailModal(record)}>
            查看详情
          </Button>
          <Button type="link" size="small" icon={<DownloadOutlined />}>
            导出报告
          </Button>
        </Space>
      ),
    },
  ];

  const reviewColumns = [
    {
      title: '记录编号',
      dataIndex: 'recordId',
      key: 'recordId',
      render: (val: string) => <code className="text-primary">{val}</code>,
    },
    {
      title: '姓名',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      key: 'idCard',
    },
    {
      title: '比对类型',
      dataIndex: 'compareType',
      key: 'compareType',
      render: (val: string) => (
        <Tag color="blue">{val}</Tag>
      ),
    },
    {
      title: '数据源',
      dataIndex: 'dataSource',
      key: 'dataSource',
    },
    {
      title: '问题描述',
      dataIndex: 'issueDescription',
      key: 'issueDescription',
      ellipsis: true,
      width: 300,
    },
    {
      title: '复核状态',
      dataIndex: 'reviewStatus',
      key: 'reviewStatus',
      render: (val: string) => {
        const config = reviewStatusConfig[val];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '检测时间',
      dataIndex: 'detectedAt',
      key: 'detectedAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: ReviewRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<FileSearchOutlined />}
            onClick={() => openReviewModal(record)}
            disabled={record.reviewStatus !== 'pending'}
          >
            {record.reviewStatus === 'pending' ? '复核处理' : '查看详情'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Noto Serif SC, serif' }}>
          <ShareAltOutlined className="mr-2 text-primary" />
          跨部门数据共享沙箱
        </h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            刷新
          </Button>
          <Button type="primary" icon={<SyncOutlined />} onClick={() => setCompareModalVisible(true)}>
            发起比对
          </Button>
        </Space>
      </div>

      {stats()}

      {dataSourceGuide()}

      {comparing && (
        <Alert
          message="数据比对进行中"
          description={
            <div className="space-y-2">
              <div>正在与公安/民政/卫健部门进行数据比对，请耐心等待...</div>
              <Progress percent={compareProgress} status="active" />
            </div>
          }
          type="info"
          showIcon
          icon={<SyncOutlined spin />}
          closable
          onClose={() => setComparing(false)}
        />
      )}

      <Card className="shadow-sm" bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          style={{ padding: '0 24px' }}
          items={[
            { key: 'compare', label: '比对历史' },
            { key: 'review', label: '复查记录' },
          ]}
        />

        <div style={{ padding: '0 24px 24px' }}>
          {activeTab === 'compare' && (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-4">
                  <span className="text-gray-600">
                    共 <span className="text-primary font-semibold">{compareRecords.length}</span> 次比对
                  </span>
                </div>
                <Space>
                  <Select placeholder="数据源" style={{ width: 150 }} allowClear>
                    {Object.entries(dataSourceConfig).map(([key, config]) => (
                      <Option key={key} value={key}>{config.name}</Option>
                    ))}
                  </Select>
                  <RangePicker style={{ width: 260 }} />
                  <Button type="primary">查询</Button>
                </Space>
              </div>

              <Table
                columns={compareColumns}
                dataSource={compareRecords}
                rowKey="id"
                loading={loading}
                pagination={{
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条`,
                }}
              />
            </>
          )}

          {activeTab === 'review' && (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-4">
                  <span className="text-gray-600">
                    共 <span className="text-primary font-semibold">{reviewRecords.length}</span> 条复查记录
                  </span>
                  <Tag color="orange">
                    待复核: {reviewRecords.filter((r) => r.reviewStatus === 'pending').length}
                  </Tag>
                  <Tag color="red">
                    已确认: {reviewRecords.filter((r) => r.reviewStatus === 'confirmed').length}
                  </Tag>
                  <Tag color="green">
                    已解决: {reviewRecords.filter((r) => r.reviewStatus === 'resolved').length}
                  </Tag>
                </div>
                <Space>
                  <Select placeholder="复核状态" style={{ width: 150 }} allowClear>
                    {Object.entries(reviewStatusConfig).map(([key, config]) => (
                      <Option key={key} value={key}>{config.text}</Option>
                    ))}
                  </Select>
                  <Button type="primary">批量复核</Button>
                </Space>
              </div>

              <Table
                columns={reviewColumns}
                dataSource={reviewRecords}
                rowKey="id"
                loading={loading}
                pagination={{
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条`,
                }}
              />
            </>
          )}
        </div>
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <SyncOutlined className="text-blue-600" />
            <span style={{ fontFamily: 'Noto Serif SC, serif' }}>发起数据比对</span>
          </div>
        }
        open={compareModalVisible}
        onCancel={() => setCompareModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleStartCompare}>
          <Alert
            message="数据安全说明"
            description="所有跨部门数据比对均在数据沙箱中进行，数据脱敏处理，全程操作留痕可审计。"
            type="info"
            showIcon
            className="mb-4"
          />

          <Form.Item
            name="dataSource"
            label="选择数据源"
            rules={[{ required: true, message: '请选择数据源' }]}
          >
            <Select placeholder="请选择要比对的数据源">
              {Object.entries(dataSourceConfig).map(([key, config]) => (
                <Option key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span style={{ color: config.color }}>{config.icon}</span>
                    <span>{config.name}</span>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="compareType"
            label="比对类型"
            rules={[{ required: true, message: '请选择比对类型' }]}
          >
            <Select placeholder="请选择比对类型">
              {Object.entries(compareTypeConfig).map(([key, config]) => (
                <Option key={key} value={key}>
                  <Tag color={config.color}>{config.name}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="比对说明">
            <TextArea
              rows={3}
              placeholder="请输入比对说明（可选）"
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Space className="w-full">
              <Button type="primary" htmlType="submit" className="w-full" loading={comparing}>
                开始比对
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileSearchOutlined className="text-blue-600" />
            <span style={{ fontFamily: 'Noto Serif SC, serif' }}>
              {selectedReview?.reviewStatus === 'pending' ? '复核处理' : '复核详情'}
            </span>
          </div>
        }
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        width={650}
      >
        {selectedReview && (
          <div className="space-y-4">
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="记录编号">
                <code>{selectedReview.recordId}</code>
              </Descriptions.Item>
              <Descriptions.Item label="比对类型">
                <Tag color="blue">{selectedReview.compareType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="姓名">{selectedReview.userName}</Descriptions.Item>
              <Descriptions.Item label="身份证号">{selectedReview.idCard}</Descriptions.Item>
              <Descriptions.Item label="数据源">{selectedReview.dataSource}</Descriptions.Item>
              <Descriptions.Item label="检测时间">{selectedReview.detectedAt}</Descriptions.Item>
              <Descriptions.Item label="问题描述" span={2}>
                <Alert
                  message={selectedReview.issueDescription}
                  type="warning"
                  showIcon
                  icon={<ExclamationCircleOutlined />}
                />
              </Descriptions.Item>
            </Descriptions>

            <Card
              title="复核处理流程"
              size="small"
              className="bg-gray-50"
            >
              <Timeline
                size="small"
                items={[
                  {
                    color: 'blue',
                    children: (
                      <div>
                        <div className="font-medium">系统检测</div>
                        <div className="text-sm text-gray-500">
                          与{selectedReview.dataSource}比对发现异常，自动创建复核记录
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{selectedReview.detectedAt}</div>
                      </div>
                    ),
                  },
                  selectedReview.reviewStatus !== 'pending'
                    ? {
                        color: 'green',
                        children: (
                          <div>
                            <div className="font-medium">
                              {selectedReview.reviewStatus === 'confirmed' ? '异常已确认' :
                               selectedReview.reviewStatus === 'resolved' ? '问题已解决' : '复核驳回'}
                            </div>
                            <div className="text-sm text-gray-500">{selectedReview.reviewComment}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              处理人: {selectedReview.reviewer} · {selectedReview.reviewTime}
                            </div>
                          </div>
                        ),
                      }
                    : {
                        color: 'gray',
                        children: (
                          <div className="text-gray-400">
                            <div className="font-medium">待人工复核</div>
                            <div className="text-sm">请管理员核实情况并处理</div>
                          </div>
                        ),
                      },
                ]}
              />
            </Card>

            {selectedReview.reviewStatus === 'pending' && (
              <Form layout="vertical" onFinish={handleReview}>
                <Form.Item
                  name="status"
                  label="复核结果"
                  rules={[{ required: true, message: '请选择复核结果' }]}
                >
                  <Select placeholder="请选择复核结果">
                    <Option value="confirmed">
                      <Tag color="red">确认异常</Tag>
                    </Option>
                    <Option value="resolved">
                      <Tag color="green">问题已解决</Tag>
                    </Option>
                    <Option value="rejected">
                      <Tag color="default">数据无误，驳回</Tag>
                    </Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="comment"
                  label="复核说明"
                  rules={[{ required: true, message: '请输入复核说明' }]}
                >
                  <TextArea
                    rows={3}
                    placeholder="请详细说明复核情况和处理意见"
                    showCount
                    maxLength={500}
                  />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" className="w-full">
                    提交复核结果
                  </Button>
                </Form.Item>
              </Form>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <BarChartOutlined className="text-blue-600" />
            <span style={{ fontFamily: 'Noto Serif SC, serif' }}>比对详情 - {selectedRecord?.dataSource}</span>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button key="export" type="primary" icon={<DownloadOutlined />}>
            导出比对报告
          </Button>,
        ]}
      >
        {selectedRecord && (
          <div className="space-y-4">
            <Row gutter={[16, 16]}>
              <Col xs={8}>
                <Card className="text-center bg-blue-50">
                  <Statistic
                    title="比对总数"
                    value={selectedRecord.totalRecords}
                    valueStyle={{ color: '#165DFF' }}
                  />
                </Card>
              </Col>
              <Col xs={8}>
                <Card className="text-center bg-green-50">
                  <Statistic
                    title="匹配成功"
                    value={selectedRecord.matchedCount}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={8}>
                <Card className="text-center bg-red-50">
                  <Statistic
                    title="数据异常"
                    value={selectedRecord.mismatchCount}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
            </Row>

            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="数据源">{selectedRecord.dataSource}</Descriptions.Item>
              <Descriptions.Item label="比对类型">
                {compareTypeConfig[selectedRecord.compareType]?.name || selectedRecord.compareType}
              </Descriptions.Item>
              <Descriptions.Item label="比对时间">{selectedRecord.compareTime}</Descriptions.Item>
              <Descriptions.Item label="耗时">{selectedRecord.duration}</Descriptions.Item>
              <Descriptions.Item label="操作人">{selectedRecord.operator}</Descriptions.Item>
              <Descriptions.Item label="匹配率">
                {Math.round((selectedRecord.matchedCount / selectedRecord.totalRecords) * 100)}%
              </Descriptions.Item>
            </Descriptions>

            <Progress
              percent={Math.round((selectedRecord.matchedCount / selectedRecord.totalRecords) * 100)}
              strokeColor="#52c41a"
              size="small"
            />

            <Card
              title="比对结果说明"
              size="small"
              className="bg-gray-50"
            >
              <List
                size="small"
                dataSource={[
                  `本次比对共涉及 ${selectedRecord.totalRecords.toLocaleString()} 条记录`,
                  `数据匹配 ${selectedRecord.matchedCount.toLocaleString()} 条，匹配率 ${Math.round((selectedRecord.matchedCount / selectedRecord.totalRecords) * 100)}%`,
                  `发现异常数据 ${selectedRecord.mismatchCount} 条，已转入复核流程`,
                  '所有比对操作均已留痕，可通过审计日志追溯',
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <CheckCircleOutlined className="text-green-500 mr-2" />
                    {item}
                  </List.Item>
                )}
              />
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DataSharePage;
