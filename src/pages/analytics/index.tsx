import { useState, useCallback } from 'react';
import { Row, Col, Card, Statistic, Segmented, Cascader, Select, Tabs, Modal, Table, Button, Form, Input, Space, Tag, message } from 'antd';
import {
  UserOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  RiseOutlined,
  FallOutlined,
  SendOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { PageContainer } from '@/components/common';
import { getRegionTree } from '@/utils/region';
import { formatNumber, formatDuration } from '@/utils/format';
import {
  getBusinessOverview,
  getCityDrillDown,
  getPersonnelDetail,
  getReportList,
  createReport,
  reviewReport,
  type BusinessOverviewData,
  type ReportListItem,
} from '@/services/api/analytics';
import VisitorTab from './components/VisitorTab';
import DurationTab from './components/DurationTab';
import RegionTab from './components/RegionTab';
import ProfileTab from './components/ProfileTab';
import ReportStatusTab from './components/ReportStatusTab';
import './index.css';

const periodOptions = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本季度', value: 'quarter' },
  { label: '自定义', value: 'custom' },
];

const granularityOptions = [
  { label: '按日', value: 'day' },
  { label: '按周', value: 'week' },
  { label: '按月', value: 'month' },
];

const placeTypeOptions = [
  { label: '全部', value: 'all' },
  { label: '网吧', value: 'internet_cafe' },
  { label: '游戏厅', value: 'arcade' },
  { label: 'KTV', value: 'ktv' },
];

const regionTree = getRegionTree();
const cascaderOptions = [
  {
    value: regionTree.code,
    label: regionTree.name,
    children: (regionTree.children || []).map((city) => ({
      value: city.code,
      label: city.name,
      children: (city.children || []).map((district) => ({
        value: district.code,
        label: district.name,
      })),
    })),
  },
];

const regionDrillColumns = [
  { title: '区县', dataIndex: 'districtName', key: 'districtName', width: 100 },
  { title: '场所数', dataIndex: 'placeCount', key: 'placeCount', width: 90 },
  {
    title: '总人次',
    dataIndex: 'visitorCount',
    key: 'visitorCount',
    width: 110,
    render: (v: number) => formatNumber(v),
  },
  {
    title: '平均时长',
    dataIndex: 'avgDuration',
    key: 'avgDuration',
    width: 110,
    render: (v: number) => `${Math.floor(v / 60)}时${v % 60}分`,
  },
];

const durationDrillColumns = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 80 },
  {
    title: '身份证号',
    dataIndex: 'idCard',
    key: 'idCard',
    width: 180,
    render: (v: string) => v ? `${v.slice(0, 6)}****${v.slice(-4)}` : '-',
  },
  { title: '场所', dataIndex: 'placeName', key: 'placeName', ellipsis: true },
  { title: '入场时间', dataIndex: 'entryTime', key: 'entryTime', width: 100 },
  {
    title: '上网时长',
    dataIndex: 'duration',
    key: 'duration',
    width: 120,
    render: (v: number) => formatDuration(v * 60),
  },
];

const reportStatusMap: Record<string, { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  submitted: { color: 'blue', text: '已提交' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已驳回' },
};

const AnalyticsPage = () => {
  const [period, setPeriod] = useState<string>('today');
  const [regionCode, setRegionCode] = useState<string | undefined>(undefined);
  const [placeType, setPlaceType] = useState<string>('all');
  const [granularity, setGranularity] = useState<string>('day');

  const { data: overviewData } = useRequest(() =>
    getBusinessOverview({ regionCode, period })
  );

  const overview: BusinessOverviewData | undefined = overviewData?.data;

  const [drillModalOpen, setDrillModalOpen] = useState(false);
  const [drillTitle, setDrillTitle] = useState('');
  const [drillColumns, setDrillColumns] = useState<any[]>([]);
  const [drillDataSource, setDrillDataSource] = useState<any[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillRowKey, setDrillRowKey] = useState<string>('districtCode');

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitForm] = Form.useForm();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<ReportListItem | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const { data: reviewListData, run: fetchReviewList, loading: reviewListLoading } = useRequest(
    () => getReportList({ page: 1, pageSize: 50, status: 'submitted' }),
    { manual: true }
  );

  const renderTrendIcon = (value: number) => {
    if (value > 0) return <RiseOutlined style={{ color: '#f5222d' }} />;
    if (value < 0) return <FallOutlined style={{ color: '#52c41a' }} />;
    return null;
  };

  const renderTrendText = (value: number | undefined) => {
    if (!value) return null;
    return (
      <span style={{ fontSize: 12, color: value > 0 ? '#f5222d' : '#52c41a' }}>
        {renderTrendIcon(value)}
        {Math.abs(value)}%
      </span>
    );
  };

  const handleCascaderChange = (value: string[]) => {
    if (!value || value.length === 0) {
      setRegionCode(undefined);
    } else {
      setRegionCode(value[value.length - 1]);
    }
  };

  const handleDrillDown = useCallback(async (params: {
    type: 'region' | 'duration';
    title: string;
    cityCode?: string;
    hour?: number;
  }) => {
    setDrillTitle(params.title);
    setDrillModalOpen(true);
    setDrillLoading(true);

    if (params.type === 'region') {
      setDrillColumns(regionDrillColumns);
      setDrillRowKey('districtCode');
    } else {
      setDrillColumns(durationDrillColumns);
      setDrillRowKey('idCard');
    }

    try {
      if (params.type === 'region' && params.cityCode) {
        const res = await getCityDrillDown({ cityCode: params.cityCode });
        setDrillDataSource(res.data || []);
      } else if (params.type === 'duration' && params.hour !== undefined) {
        const res = await getPersonnelDetail({ hour: params.hour, regionCode });
        setDrillDataSource(res.data || []);
      }
    } catch {
      setDrillDataSource([]);
    } finally {
      setDrillLoading(false);
    }
  }, [regionCode]);

  const handleSubmitReport = useCallback(async () => {
    try {
      const values = await submitForm.validateFields();
      setSubmitLoading(true);
      await createReport({
        placeId: values.placeId || 'default',
        date: values.date || new Date().toISOString().slice(0, 10),
        totalVisitors: overview?.totalVisitors || 0,
        totalDuration: overview?.totalDuration || 0,
        remarks: values.remarks,
      });
      message.success('数据上报成功');
      setSubmitModalOpen(false);
      submitForm.resetFields();
    } catch {
      // validation or API error
    } finally {
      setSubmitLoading(false);
    }
  }, [overview, submitForm]);

  const handleOpenReview = useCallback(() => {
    setReviewModalOpen(true);
    setReviewTarget(null);
    setReviewComment('');
    fetchReviewList();
  }, [fetchReviewList]);

  const handleReviewAction = useCallback(async (action: 'approved' | 'rejected') => {
    if (!reviewTarget) {
      message.warning('请先选择需要复核的报告');
      return;
    }
    setReviewLoading(true);
    try {
      await reviewReport(reviewTarget.id, { status: action, comment: reviewComment });
      message.success(action === 'approved' ? '复核通过' : '已驳回');
      setReviewTarget(null);
      setReviewComment('');
      fetchReviewList();
    } catch {
      message.error('操作失败，请重试');
    } finally {
      setReviewLoading(false);
    }
  }, [reviewTarget, reviewComment, fetchReviewList]);

  const reviewListColumns = [
    { title: '场所名称', dataIndex: 'placeName', key: 'placeName', ellipsis: true, width: 160 },
    { title: '上报日期', dataIndex: 'date', key: 'date', width: 110 },
    {
      title: '总人次',
      dataIndex: 'totalVisitors',
      key: 'totalVisitors',
      width: 90,
      render: (v: number) => formatNumber(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (v: string) => {
        const cfg = reportStatusMap[v] || { color: 'default', text: v };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt', width: 160, render: (v: string) => v || '-' },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: ReportListItem) => (
        <Button
          type={reviewTarget?.id === record.id ? 'primary' : 'link'}
          size="small"
          onClick={() => setReviewTarget(record)}
        >
          选择
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'visitor',
      label: '上网人次分析',
      children: <VisitorTab regionCode={regionCode} period={period} />,
    },
    {
      key: 'duration',
      label: '上网时长分析',
      children: <DurationTab regionCode={regionCode} onDrillDown={handleDrillDown} />,
    },
    {
      key: 'region',
      label: '地域分布分析',
      children: <RegionTab regionCode={regionCode} onDrillDown={handleDrillDown} />,
    },
    {
      key: 'profile',
      label: '人员画像分析',
      children: <ProfileTab regionCode={regionCode} />,
    },
    {
      key: 'report',
      label: '上报状态看板',
      children: <ReportStatusTab regionCode={regionCode} />,
    },
  ];

  return (
    <PageContainer
      title="经营数据分析"
      subTitle="山东省文旅场所经营数据综合分析"
    >
      <div className="analytics-page">
        <div className="filter-bar">
          <span style={{ fontSize: 13, color: '#86909C', whiteSpace: 'nowrap' }}>时间范围</span>
          <Segmented options={periodOptions} value={period} onChange={(v) => setPeriod(v as string)} />

          <span style={{ fontSize: 13, color: '#86909C', whiteSpace: 'nowrap', marginLeft: 8 }}>区域下钻</span>
          <Cascader
            options={cascaderOptions}
            onChange={handleCascaderChange as any}
            placeholder="全省"
            changeOnSelect
            allowClear
            style={{ width: 240 }}
          />

          <span style={{ fontSize: 13, color: '#86909C', whiteSpace: 'nowrap', marginLeft: 8 }}>场所类型</span>
          <Select
            value={placeType}
            onChange={setPlaceType}
            options={placeTypeOptions}
            style={{ width: 120 }}
          />

          <span style={{ fontSize: 13, color: '#86909C', whiteSpace: 'nowrap', marginLeft: 8 }}>数据粒度</span>
          <Segmented options={granularityOptions} value={granularity} onChange={(v) => setGranularity(v as string)} />
        </div>

        <Row gutter={[16, 16]} className="stat-cards">
          <Col xs={24} sm={12} lg={4}>
            <Card hoverable>
              <Statistic
                title="上网总人次"
                value={overview?.totalVisitors || 0}
                formatter={(v) => formatNumber(v as number)}
                prefix={<UserOutlined />}
                suffix={renderTrendText(overview?.visitorTrend)}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card hoverable>
              <Statistic
                title="上网总时长"
                value={overview?.totalDuration || 0}
                formatter={() => {
                  const seconds = overview?.totalDuration || 0;
                  const hours = Math.floor(seconds / 3600);
                  return `${formatNumber(hours)}`;
                }}
                prefix={<ClockCircleOutlined />}
                suffix={<span style={{ fontSize: 12 }}>小时 {renderTrendText(overview?.durationTrend)}</span>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card hoverable>
              <Statistic
                title="人均上网时长"
                value={overview?.avgDuration || 0}
                formatter={() => formatDuration(overview?.avgDuration || 0)}
                prefix={<ThunderboltOutlined />}
                suffix={renderTrendText(overview?.avgDurationTrend)}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card hoverable>
              <Statistic
                title="峰值时段"
                value={overview?.peakHour || '-'}
                prefix={<ThunderboltOutlined />}
                valueStyle={{ fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card hoverable>
              <Statistic
                title="活跃场所数"
                value={overview?.activePlaces || 0}
                formatter={(v) => formatNumber(v as number)}
                prefix={<EnvironmentOutlined />}
                suffix={renderTrendText(overview?.activePlaceTrend)}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card hoverable>
              <Statistic
                title="未成年人拦截数"
                value={128}
                prefix={<SafetyCertificateOutlined />}
                valueStyle={{ color: '#f5222d' }}
                suffix={
                  <span style={{ fontSize: 12, color: '#f5222d' }}>
                    <RiseOutlined /> 12%
                  </span>
                }
              />
            </Card>
          </Col>
        </Row>

        <Card style={{ marginTop: 16 }}>
          <Tabs
            defaultActiveKey="visitor"
            items={tabItems}
            size="middle"
            type="card"
          />
        </Card>

        <Space className="analytics-fab" direction="vertical">
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => setSubmitModalOpen(true)}
          >
            数据上报
          </Button>
          <Button
            icon={<AuditOutlined />}
            onClick={handleOpenReview}
          >
            复核
          </Button>
        </Space>

        <Modal
          title={drillTitle}
          open={drillModalOpen}
          onCancel={() => {
            setDrillModalOpen(false);
            setDrillDataSource([]);
          }}
          footer={null}
          width={750}
        >
          <Table
            rowKey={drillRowKey}
            columns={drillColumns}
            dataSource={drillDataSource}
            loading={drillLoading}
            pagination={{ pageSize: 8, showTotal: (total) => `共 ${total} 条` }}
            size="small"
          />
        </Modal>

        <Modal
          title="数据上报"
          open={submitModalOpen}
          onCancel={() => {
            setSubmitModalOpen(false);
            submitForm.resetFields();
          }}
          onOk={handleSubmitReport}
          confirmLoading={submitLoading}
          okText="确认上报"
        >
          <div style={{ marginBottom: 16, padding: 16, background: '#f7f8fa', borderRadius: 8 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="上网总人次" value={overview?.totalVisitors || 0} formatter={(v) => formatNumber(v as number)} />
              </Col>
              <Col span={8}>
                <Statistic title="总时长(小时)" value={overview?.totalDuration ? Math.floor(overview.totalDuration / 3600) : 0} formatter={(v) => formatNumber(v as number)} />
              </Col>
              <Col span={8}>
                <Statistic title="活跃场所数" value={overview?.activePlaces || 0} formatter={(v) => formatNumber(v as number)} />
              </Col>
            </Row>
          </div>
          <Form form={submitForm} layout="vertical">
            <Form.Item name="placeId" label="场所" rules={[{ required: true, message: '请输入场所ID' }]}>
              <Input placeholder="请输入场所ID" />
            </Form.Item>
            <Form.Item name="date" label="上报日期" rules={[{ required: true, message: '请输入上报日期' }]}>
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="remarks" label="备注">
              <Input.TextArea rows={3} placeholder="请输入备注信息" />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="数据复核"
          open={reviewModalOpen}
          onCancel={() => {
            setReviewModalOpen(false);
            setReviewTarget(null);
            setReviewComment('');
          }}
          footer={null}
          width={800}
        >
          <Table
            rowKey="id"
            columns={reviewListColumns}
            dataSource={reviewListData?.data?.list || []}
            loading={reviewListLoading}
            pagination={{ pageSize: 5, showTotal: (total) => `共 ${total} 条待复核` }}
            size="small"
            rowClassName={(record) => record.id === reviewTarget?.id ? 'ant-table-row-selected' : ''}
          />
          {reviewTarget && (
            <div style={{ marginTop: 16, padding: 16, background: '#f7f8fa', borderRadius: 8 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>复核对象：</strong>{reviewTarget.placeName} - {reviewTarget.date}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>上网人次：</strong>{formatNumber(reviewTarget.totalVisitors)}，
                <strong>总时长：</strong>{formatDuration(reviewTarget.totalDuration)}
              </div>
              <Input.TextArea
                rows={2}
                placeholder="复核意见（可选）"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <Space>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={reviewLoading}
                  onClick={() => handleReviewAction('approved')}
                >
                  通过
                </Button>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  loading={reviewLoading}
                  onClick={() => handleReviewAction('rejected')}
                >
                  驳回
                </Button>
              </Space>
            </div>
          )}
        </Modal>
      </div>
    </PageContainer>
  );
};

export default AnalyticsPage;
