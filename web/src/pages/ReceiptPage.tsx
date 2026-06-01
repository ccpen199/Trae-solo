import { useState, useEffect, useMemo } from 'react';
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select,
  Space, message, Tabs, Descriptions, Statistic, Progress,
  Divider, Timeline, Empty, Alert
} from 'antd';
import {
  CheckOutlined, ForwardOutlined, ThunderboltOutlined, CloseOutlined,
  MessageOutlined, EyeOutlined, BarChartOutlined, SendOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { receiptApi, reportApi } from '../api';
import { useNavigate, useLocation } from 'react-router-dom';

const { Option } = Select;

const STATUS_LABELS: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  forwarded: '已转发',
  acted: '已处置',
  no_response: '未响应',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'default',
  confirmed: 'green',
  forwarded: 'blue',
  acted: 'purple',
  no_response: 'red',
};

const STATUS_ICONS: Record<string, string> = {
  pending: '⏳',
  confirmed: '✅',
  forwarded: '🔄',
  acted: '⚡',
  no_response: '❌',
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  township: '乡镇',
  department: '部门',
  grid: '网格',
  public: '公众',
};

const TARGET_TYPE_ICONS: Record<string, string> = {
  township: '🏛️',
  department: '🏢',
  grid: '🔲',
  public: '👥',
};

export default function ReceiptPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [tab, setTab] = useState('list');
  const [receipts, setReceipts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({ confirm_status: '', publish_record_id: '' });
  const [loading, setLoading] = useState(false);

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<string>('');
  const [actionForm] = Form.useForm();
  const [currentReceipt, setCurrentReceipt] = useState<any>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<any>(null);
  const [receiptOperations, setReceiptOperations] = useState<any[]>([]);

  const [byWarning, setByWarning] = useState<any[]>([]);
  const [byTarget, setByTarget] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>({});

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const prId = params.get('publish_record_id');
    if (prId) {
      setFilters((f) => ({ ...f, publish_record_id: prId }));
    }
  }, [location.search]);

  useEffect(() => {
    loadReceipts();
    loadSummary();
  }, [page, pageSize, filters]);

  async function loadReceipts() {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (filters.confirm_status) params.confirm_status = filters.confirm_status;
      if (filters.publish_record_id) params.publish_record_id = filters.publish_record_id;
      const data: any = await receiptApi.list(params);
      setReceipts(data.rows || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadSummary() {
    try {
      const [bw, bt, ov]: any[] = await Promise.all([
        receiptApi.byWarning(),
        receiptApi.byTarget(),
        reportApi.overview(),
      ]);
      setByWarning(bw);
      setByTarget(bt);
      setOverview(ov);
    } catch (e: any) {
      message.error(e.message);
    }
  }

  function openAction(r: any, type: string) {
    setCurrentReceipt(r);
    setActionType(type);
    actionForm.resetFields();
    setActionModalOpen(true);
  }

  async function handleAction() {
    try {
      const values = await actionForm.validateFields();
      if (actionType === 'confirm') {
        await receiptApi.confirm(currentReceipt.id);
        message.success('已确认');
      } else if (actionType === 'forward') {
        await receiptApi.forward(currentReceipt.id, values.forward_to);
        message.success('已转发');
      } else if (actionType === 'act') {
        await receiptApi.act(currentReceipt.id, values.action_measures);
        message.success('已记录处置措施');
      } else if (actionType === 'no_response') {
        await receiptApi.markNoResponse(currentReceipt.id);
        message.success('已标记未响应');
      } else if (actionType === 'feedback') {
        await receiptApi.feedback(currentReceipt.id, values.feedback);
        message.success('已记录反馈');
      }
      setActionModalOpen(false);
      loadReceipts();
      loadSummary();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.message);
    }
  }

  async function viewDetail(r: any) {
    setViewingReceipt(r);
    try {
      const [detail, ops]: any[] = await Promise.all([
        receiptApi.get(r.id),
        reportApi.opsLog({ entity_type: 'receipt', entity_id: r.id, pageSize: 20 }),
      ]);
      setViewingReceipt(detail);
      setReceiptOperations(ops.rows || []);
      setDetailModalOpen(true);
    } catch (e: any) {
      message.error(e.message);
    }
  }

  const receiptStats = useMemo(() => {
    const map: Record<string, number> = {};
    receipts.forEach((r: any) => {
      map[r.confirm_status] = (map[r.confirm_status] || 0) + 1;
    });
    return {
      pending: map.pending || 0,
      confirmed: map.confirmed || 0,
      forwarded: map.forwarded || 0,
      acted: map.acted || 0,
      no_response: map.no_response || 0,
    };
  }, [receipts]);

  const responseRate = useMemo(() => {
    if (receipts.length === 0) return 0;
    const responded = receipts.filter(
      (r: any) => ['confirmed', 'forwarded', 'acted'].includes(r.confirm_status)
    ).length;
    return Math.round((responded / receipts.length) * 100);
  }, [receipts]);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      render: (v: number, r: any) => (
        <Button type="link" size="small" onClick={() => viewDetail(r)}>{v}</Button>
      ),
    },
    {
      title: '预警信息',
      key: 'warning',
      width: 150,
      render: (_: any, r: any) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Tag color="blue">{r.warning_type || '-'}</Tag>
            <Tag color={r.warning_level === 'red' ? 'red' : r.warning_level === 'orange' ? 'orange' : 'gold'}>
              {r.warning_level || '-'}
            </Tag>
          </Space>
          <span style={{ fontSize: 11, color: '#999' }}>批次: {r.batch_no}</span>
        </Space>
      ),
    },
    {
      title: '接收对象',
      key: 'target',
      width: 140,
      render: (_: any, r: any) => (
        <Space>
          <span style={{ fontSize: 18 }}>{TARGET_TYPE_ICONS[r.target_type]}</span>
          <div>
            <div style={{ fontWeight: 'bold' }}>{r.target_name}</div>
            <div style={{ fontSize: 11, color: '#999' }}>
              {TARGET_TYPE_LABELS[r.target_type]}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '确认状态',
      dataIndex: 'confirm_status',
      key: 'confirm_status',
      width: 110,
      render: (v: string) => (
        <Space>
          <span>{STATUS_ICONS[v]}</span>
          <Tag color={STATUS_COLORS[v]}>{STATUS_LABELS[v] || v}</Tag>
        </Space>
      ),
    },
    {
      title: '确认时间',
      dataIndex: 'confirm_time',
      key: 'confirm_time',
      width: 140,
      render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm:ss') : <Tag color="default">未确认</Tag>,
    },
    {
      title: '转发至',
      dataIndex: 'forward_to',
      key: 'forward_to',
      width: 120,
      render: (v: string) => v || '-',
    },
    {
      title: '处置措施',
      dataIndex: 'action_measures',
      key: 'action_measures',
      width: 160,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '流程贯通',
      key: 'links',
      width: 120,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<SendOutlined />}
            onClick={() => navigate(`/publish`)}
          >
            发布
          </Button>
          <Button
            type="link"
            size="small"
            icon={<BarChartOutlined />}
            onClick={() => navigate('/report')}
          >
            复盘
          </Button>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right' as const,
      render: (_: any, r: any) => (
        <Space size="small" wrap>
          <Button size="small" icon={<EyeOutlined />} onClick={() => viewDetail(r)}>详情</Button>
          {r.confirm_status === 'pending' && (
            <>
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => openAction(r, 'confirm')}>确认</Button>
              <Button size="small" icon={<ForwardOutlined />} onClick={() => openAction(r, 'forward')}>转发</Button>
              <Button size="small" danger icon={<CloseOutlined />} onClick={() => openAction(r, 'no_response')}>未响应</Button>
            </>
          )}
          {r.confirm_status === 'confirmed' && (
            <Button size="small" type="primary" icon={<ThunderboltOutlined />} onClick={() => openAction(r, 'act')}>处置</Button>
          )}
          {(r.confirm_status === 'confirmed' || r.confirm_status === 'forwarded' || r.confirm_status === 'acted') && (
            <Button size="small" icon={<MessageOutlined />} onClick={() => openAction(r, 'feedback')}>反馈</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={4}>
          <Card size="small">
            <Statistic title="回执总数" value={total} prefix={<UnorderedListOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card size="small">
            <Statistic
              title="已确认"
              value={receiptStats.confirmed}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card size="small">
            <Statistic
              title="已转发"
              value={receiptStats.forwarded}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ForwardOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card size="small">
            <Statistic
              title="已处置"
              value={receiptStats.acted}
              valueStyle={{ color: '#722ed1' }}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card size="small">
            <Statistic
              title="待确认"
              value={receiptStats.pending}
              valueStyle={{ color: '#faad14' }}
              prefix="⏳"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card size="small">
            <Statistic
              title="响应率"
              value={responseRate}
              suffix="%"
              prefix={<Progress type="circle" percent={responseRate} size={30} />}
            />
          </Card>
        </Col>
      </Row>

      {filters.publish_record_id && (
        <Alert
          type="info"
          showIcon
          message={`当前按发布记录 ID: ${filters.publish_record_id} 过滤`}
          action={
            <Button size="small" onClick={() => setFilters((f) => ({ ...f, publish_record_id: '' }))}>
              清除过滤
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'list',
            label: <Space><UnorderedListOutlined />回执处置</Space>,
            children: (
              <Card
                title={
                  <Space>
                    <strong>回执处置管理</strong>
                    <Tag color="blue">{total} 条</Tag>
                    {filters.publish_record_id && <Tag color="orange">按发布记录</Tag>}
                  </Space>
                }
                extra={
                  <Space wrap>
                    <Select
                      placeholder="状态筛选"
                      style={{ width: 130 }}
                      allowClear
                      value={filters.confirm_status || undefined}
                      onChange={(v) => { setFilters((f) => ({ ...f, confirm_status: v })); setPage(1); }}
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <Option key={k} value={k}>
                          <Space><span>{STATUS_ICONS[k]}</span>{v}</Space>
                        </Option>
                      ))}
                    </Select>
                    <Button icon={<EyeOutlined />} onClick={() => navigate('/report')}>查看复盘报表</Button>
                  </Space>
                }
              >
                <Table
                  loading={loading}
                  dataSource={receipts}
                  rowKey="id"
                  scroll={{ x: 1600 }}
                  columns={columns}
                  pagination={{
                    current: page,
                    pageSize,
                    total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (t) => `共 ${t} 条记录`,
                    onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                  }}
                />
              </Card>
            ),
          },
          {
            key: 'byWarning',
            label: <Space>📊按预警汇总</Space>,
            children: (
              <Card title={<Space><strong>按预警汇总回执情况</strong></Space>}>
                <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
                  {byWarning.slice(0, 4).map((w: any) => (
                    <Col xs={24} sm={12} md={6} key={w.warning_id}>
                      <Card size="small">
                        <Space direction="vertical" size={0}>
                          <Space>
                            <Tag color="blue">{w.type}</Tag>
                            <Tag color={w.level === 'red' ? 'red' : 'orange'}>{w.level}</Tag>
                          </Space>
                          <span style={{ fontSize: 11, color: '#999' }}>{w.affected_area}</span>
                          <Progress
                            percent={w.total_targets > 0 ? Math.round(((w.confirmed + w.forwarded + w.acted) / w.total_targets) * 100) : 0}
                            size="small"
                            style={{ marginTop: 4 }}
                          />
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>
                <Table
                  dataSource={byWarning}
                  rowKey="warning_id"
                  pagination={false}
                  columns={[
                    { title: '预警ID', dataIndex: 'warning_id', key: 'warning_id', width: 80 },
                    { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
                    { title: '级别', dataIndex: 'level', key: 'level', width: 80 },
                    { title: '影响区域', dataIndex: 'affected_area', key: 'affected_area' },
                    { title: '发布次数', dataIndex: 'publish_count', key: 'publish_count', width: 80 },
                    { title: '总对象', dataIndex: 'total_targets', key: 'total_targets', width: 70 },
                    { title: '已确认', dataIndex: 'confirmed', key: 'confirmed', width: 70, render: (v: number) => <Tag color="green">{v}</Tag> },
                    { title: '已转发', dataIndex: 'forwarded', key: 'forwarded', width: 70, render: (v: number) => <Tag color="blue">{v}</Tag> },
                    { title: '已处置', dataIndex: 'acted', key: 'acted', width: 70, render: (v: number) => <Tag color="purple">{v}</Tag> },
                    { title: '待确认', dataIndex: 'pending', key: 'pending', width: 70, render: (v: number) => <Tag>{v}</Tag> },
                    { title: '未响应', dataIndex: 'no_response', key: 'no_response', width: 70, render: (v: number) => <Tag color="red">{v}</Tag> },
                    {
                      title: '响应率',
                      key: 'rate',
                      width: 100,
                      render: (_: any, r: any) => {
                        const rate = r.total_targets > 0 ? Math.round(((r.confirmed + r.forwarded + r.acted) / r.total_targets) * 100) : 0;
                        return <Progress percent={rate} size="small" />;
                      },
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'byTarget',
            label: <Space>👥按对象汇总</Space>,
            children: (
              <Card title={<Space><strong>按接收对象汇总回执情况</strong></Space>}>
                <Table
                  dataSource={byTarget}
                  rowKey="target_id"
                  pagination={false}
                  columns={[
                    { title: '对象ID', dataIndex: 'target_id', key: 'target_id', width: 80 },
                    { title: '名称', dataIndex: 'name', key: 'name' },
                    {
                      title: '类型',
                      dataIndex: 'target_type',
                      key: 'target_type',
                      width: 100,
                      render: (v: string) => (
                        <Space><span>{TARGET_TYPE_ICONS[v]}</span>{TARGET_TYPE_LABELS[v]}</Space>
                      ),
                    },
                    { title: '总回执', dataIndex: 'total_receipts', key: 'total_receipts', width: 70 },
                    { title: '已确认', dataIndex: 'confirmed', key: 'confirmed', width: 70, render: (v: number) => <Tag color="green">{v}</Tag> },
                    { title: '已转发', dataIndex: 'forwarded', key: 'forwarded', width: 70, render: (v: number) => <Tag color="blue">{v}</Tag> },
                    { title: '已处置', dataIndex: 'acted', key: 'acted', width: 70, render: (v: number) => <Tag color="purple">{v}</Tag> },
                    { title: '待确认', dataIndex: 'pending', key: 'pending', width: 70, render: (v: number) => <Tag>{v}</Tag> },
                    { title: '未响应', dataIndex: 'no_response', key: 'no_response', width: 70, render: (v: number) => <Tag color="red">{v}</Tag> },
                    {
                      title: '响应率',
                      key: 'rate',
                      width: 120,
                      render: (_: any, r: any) => {
                        const rate = r.total_receipts > 0 ? Math.round(((r.confirmed + r.forwarded + r.acted) / r.total_receipts) * 100) : 0;
                        return <Progress percent={rate} size="small" />;
                      },
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title={
          { confirm: '确认回执', forward: '转发回执', act: '记录处置措施', no_response: '标记未响应', feedback: '记录反馈' }[actionType] || '操作'
        }
        open={actionModalOpen}
        onCancel={() => setActionModalOpen(false)}
        onOk={handleAction}
        width={600}
      >
        {currentReceipt && (
          <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="接收对象">
              <Space>
                <span style={{ fontSize: 18 }}>{TARGET_TYPE_ICONS[currentReceipt.target_type]}</span>
                {currentReceipt.target_name}
                <Tag>{TARGET_TYPE_LABELS[currentReceipt.target_type]}</Tag>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="预警信息">
              <Space>
                <Tag color="blue">{currentReceipt.warning_type || '-'}</Tag>
                <Tag color={currentReceipt.warning_level === 'red' ? 'red' : 'orange'}>
                  {currentReceipt.warning_level || '-'}
                </Tag>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="批次号">
              <code>{currentReceipt.batch_no}</code>
            </Descriptions.Item>
            <Descriptions.Item label="当前状态">
              <Space>
                <span>{STATUS_ICONS[currentReceipt.confirm_status]}</span>
                <Tag color={STATUS_COLORS[currentReceipt.confirm_status]}>
                  {STATUS_LABELS[currentReceipt.confirm_status]}
                </Tag>
              </Space>
            </Descriptions.Item>
          </Descriptions>
        )}
        <Form form={actionForm} layout="vertical">
          {actionType === 'forward' && (
            <Form.Item name="forward_to" label="转发至" rules={[{ required: true }]}>
              <Input placeholder="转发目的地/部门/人员，如：应急管理办公室" />
            </Form.Item>
          )}
          {actionType === 'act' && (
            <Form.Item name="action_measures" label="处置措施" rules={[{ required: true }]}>
              <Input.TextArea rows={5} placeholder="请详细描述已采取的处置措施，如：转移人员、巡查险情等" />
            </Form.Item>
          )}
          {actionType === 'feedback' && (
            <Form.Item name="feedback" label="反馈内容" rules={[{ required: true }]}>
              <Input.TextArea rows={4} placeholder="请输入反馈信息，包括现场情况、处置效果、存在问题等" />
            </Form.Item>
          )}
          {actionType === 'no_response' && (
            <Alert
              type="warning"
              showIcon
              message={'确认将此回执标记为"未响应"？'}
              description="标记后将记录在案，可在复盘报表中统计未响应率"
            />
          )}
          {actionType === 'confirm' && (
            <Alert
              type="success"
              showIcon
              message="确认已收到预警通知？"
              description="确认后将进入处置流程，可记录具体的处置措施"
            />
          )}
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <EyeOutlined />
            <strong>回执详情 - 全链路追溯</strong>
          </Space>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        width={900}
        footer={
          <Space>
            <Button onClick={() => setDetailModalOpen(false)}>关闭</Button>
            {viewingReceipt && viewingReceipt.confirm_status === 'pending' && (
              <Button type="primary" onClick={() => { setDetailModalOpen(false); openAction(viewingReceipt, 'confirm'); }}>
                立即确认
              </Button>
            )}
            <Button icon={<BarChartOutlined />} onClick={() => navigate('/report')}>
              查看复盘报表
            </Button>
          </Space>
        }
      >
        {viewingReceipt && (
          <>
            <Alert
              type={
                viewingReceipt.confirm_status === 'acted' ? 'success' :
                viewingReceipt.confirm_status === 'pending' ? 'warning' :
                viewingReceipt.confirm_status === 'no_response' ? 'error' : 'info'
              }
              showIcon
              message={
                <Space>
                  <span style={{ fontSize: 20 }}>{STATUS_ICONS[viewingReceipt.confirm_status]}</span>
                  <strong>{STATUS_LABELS[viewingReceipt.confirm_status]}</strong>
                  <Tag color="blue">{viewingReceipt.warning_type}</Tag>
                  <Tag color={viewingReceipt.warning_level === 'red' ? 'red' : 'orange'}>
                    {viewingReceipt.warning_level}
                  </Tag>
                </Space>
              }
              description={viewingReceipt.warning_content || '暂无预警内容'}
              style={{ marginBottom: 16 }}
            />

            <Tabs
              items={[
                {
                  key: 'base',
                  label: '基本信息',
                  children: (
                    <>
                      <Descriptions column={2} size="small" bordered>
                        <Descriptions.Item label="预警类型">{viewingReceipt.warning_type || '-'}</Descriptions.Item>
                        <Descriptions.Item label="预警级别">
                          <Tag color={viewingReceipt.warning_level === 'red' ? 'red' : 'orange'}>
                            {viewingReceipt.warning_level}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="影响区域">{viewingReceipt.affected_area || '-'}</Descriptions.Item>
                        <Descriptions.Item label="建议措施">{viewingReceipt.suggested_actions || '-'}</Descriptions.Item>
                        <Descriptions.Item label="接收对象">
                          <Space>
                            <span style={{ fontSize: 18 }}>{TARGET_TYPE_ICONS[viewingReceipt.target_type]}</span>
                            {viewingReceipt.target_name}
                          </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="对象类型">{TARGET_TYPE_LABELS[viewingReceipt.target_type]}</Descriptions.Item>
                        <Descriptions.Item label="联系方式">{viewingReceipt.contact || '-'}</Descriptions.Item>
                        <Descriptions.Item label="批次号"><code>{viewingReceipt.batch_no}</code></Descriptions.Item>
                        <Descriptions.Item label="当前状态">
                          <Tag color={STATUS_COLORS[viewingReceipt.confirm_status]}>
                            {STATUS_LABELS[viewingReceipt.confirm_status]}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="确认时间">
                          {viewingReceipt.confirm_time ? dayjs(viewingReceipt.confirm_time).format('YYYY-MM-DD HH:mm:ss') : '-'}
                        </Descriptions.Item>
                      </Descriptions>

                      {viewingReceipt.forward_to && (
                        <>
                          <Divider orientation="left"><ForwardOutlined /> 转发信息</Divider>
                          <Descriptions column={1} size="small" bordered>
                            <Descriptions.Item label="转发至">{viewingReceipt.forward_to}</Descriptions.Item>
                          </Descriptions>
                        </>
                      )}

                      {viewingReceipt.action_measures && (
                        <>
                          <Divider orientation="left"><ThunderboltOutlined /> 处置措施</Divider>
                          <Card size="small" type="inner">
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {viewingReceipt.action_measures}
                            </pre>
                          </Card>
                        </>
                      )}

                      {viewingReceipt.feedback && (
                        <>
                          <Divider orientation="left"><MessageOutlined /> 反馈信息</Divider>
                          <Card size="small" type="inner">
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {viewingReceipt.feedback}
                            </pre>
                          </Card>
                        </>
                      )}
                    </>
                  ),
                },
                {
                  key: 'timeline',
                  label: `操作轨迹 (${receiptOperations.length})`,
                  children: receiptOperations.length > 0 ? (
                    <Timeline style={{ paddingTop: 16 }}>
                      {receiptOperations.map((op: any) => (
                        <Timeline.Item
                          key={op.id}
                          color={
                            op.action === 'confirm_receipt' ? 'green' :
                            op.action === 'forward_receipt' ? 'blue' :
                            op.action === 'act_receipt' ? 'purple' :
                            op.action === 'no_response' ? 'red' : 'default'
                          }
                        >
                          <Space>
                            <strong>{op.action_name || op.action}</strong>
                            <span style={{ color: '#999' }}>
                              {op.created_at ? dayjs(op.created_at).format('MM-DD HH:mm:ss') : ''}
                            </span>
                            <Tag color="default">{op.operator}</Tag>
                          </Space>
                          {op.details && typeof op.details === 'object' && (
                            <div style={{ color: '#666', marginTop: 4 }}>
                              {Object.entries(op.details).map(([k, v]) => (
                                <div key={k}>{k}: {String(v)}</div>
                              ))}
                            </div>
                          )}
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  ) : <Empty description="暂无操作轨迹" />,
                },
              ]}
            />
          </>
        )}
      </Modal>
    </>
  );
}