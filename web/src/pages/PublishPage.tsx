import { useState, useEffect, useMemo } from 'react';
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select,
  Space, message, Tabs, Statistic, Descriptions, Alert, Progress,
  Popconfirm, Empty, Divider, Timeline, List
} from 'antd';
import {
  PlusOutlined, EditOutlined, ReloadOutlined, CheckCircleOutlined,
  CloseCircleOutlined, EyeOutlined, SendOutlined, LinkOutlined,
  UnorderedListOutlined, UserOutlined, EnvironmentOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { publishApi, receiptApi } from '../api';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const CHANNEL_TYPE_LABELS: Record<string, string> = {
  sms: '短信',
  announcement: '站内公告',
  api: '接口推送',
  grassroots: '基层通知',
};

const CHANNEL_TYPE_ICONS: Record<string, string> = {
  sms: '📱',
  announcement: '📢',
  api: '🔌',
  grassroots: '🏘️',
};

const CHANNEL_TYPE_COLORS: Record<string, string> = {
  sms: 'blue',
  announcement: 'green',
  api: 'purple',
  grassroots: 'cyan',
};

const PUBLISH_STATUS_LABELS: Record<string, string> = {
  pending: '待发送',
  sending: '发送中',
  completed: '已完成',
  failed: '失败',
};

const PUBLISH_STATUS_COLORS: Record<string, string> = {
  pending: 'default',
  sending: 'processing',
  completed: 'success',
  failed: 'error',
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

export default function PublishPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('records');
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [channels, setChannels] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterChannel, setFilterChannel] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const [channelModalOpen, setChannelModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<any>(null);
  const [channelForm] = Form.useForm();

  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any>(null);
  const [targetForm] = Form.useForm();

  const [failuresModalOpen, setFailuresModalOpen] = useState(false);
  const [failures, setFailures] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [retrying, setRetrying] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  const [recordReceipts, setRecordReceipts] = useState<any[]>([]);
  const [recordDetail, setRecordDetail] = useState<any>(null);

  useEffect(() => {
    loadAll();
  }, [page, pageSize, filterChannel, filterStatus]);

  async function loadAll() {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (filterChannel) params.channel_id = filterChannel;
      if (filterStatus) params.status = filterStatus;
      const [recs, chs, tgts]: any[] = await Promise.all([
        publishApi.records(params),
        publishApi.channels(),
        publishApi.targets(),
      ]);
      setRecords(recs.rows || []);
      setTotal(recs.total || 0);
      setChannels(chs);
      setTargets(tgts);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRetry(record: any) {
    setRetrying(true);
    try {
      const res: any = await publishApi.retry(record.id);
      message.success(
        <Space direction="vertical">
          <span>重发完成！</span>
          <span>成功: <Tag color="green">{res.retried}</Tag> 条</span>
          <span>剩余失败: <Tag color="red">{res.remaining_failures}</Tag> 条</span>
        </Space>,
        3
      );
      if (failuresModalOpen && selectedRecord?.id === record.id) {
        const fres: any = await publishApi.failures(record.id);
        setFailures(fres.targets || []);
      }
      loadAll();
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setRetrying(false);
    }
  }

  async function viewFailures(record: any) {
    setSelectedRecord(record);
    try {
      const res: any = await publishApi.failures(record.id);
      setFailures(res.targets || []);
      setFailuresModalOpen(true);
    } catch (e: any) {
      message.error(e.message);
    }
  }

  async function viewDetail(record: any) {
    setViewingRecord(record);
    try {
      const [detail, receipts]: any[] = await Promise.all([
        publishApi.get(record.id),
        receiptApi.list({ publish_record_id: record.id, pageSize: 50 }),
      ]);
      setRecordDetail(detail);
      setRecordReceipts(receipts.rows || []);
      setDetailModalOpen(true);
    } catch (e: any) {
      message.error(e.message);
    }
  }

  function openCreateChannel() {
    setEditingChannel(null);
    channelForm.resetFields();
    setChannelModalOpen(true);
  }

  function openEditChannel(ch: any) {
    setEditingChannel(ch);
    channelForm.setFieldsValue({
      name: ch.name,
      channel_type: ch.channel_type,
      config: ch.config ? (typeof ch.config === 'string' ? ch.config : JSON.stringify(ch.config)) : '',
      status: ch.status,
    });
    setChannelModalOpen(true);
  }

  async function handleSaveChannel() {
    try {
      const values = await channelForm.validateFields();
      if (editingChannel) {
        await publishApi.updateChannel(editingChannel.id, values);
        message.success('渠道更新成功');
      } else {
        await publishApi.createChannel(values);
        message.success('渠道创建成功');
      }
      setChannelModalOpen(false);
      loadAll();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.message);
    }
  }

  function openCreateTarget() {
    setEditingTarget(null);
    targetForm.resetFields();
    setTargetModalOpen(true);
  }

  function openEditTarget(t: any) {
    setEditingTarget(t);
    targetForm.setFieldsValue({
      name: t.name,
      target_type: t.target_type,
      contact: t.contact,
    });
    setTargetModalOpen(true);
  }

  async function handleSaveTarget() {
    try {
      const values = await targetForm.validateFields();
      if (editingTarget) {
        message.info('更新功能待实现');
      } else {
        await publishApi.createTarget(values);
        message.success('接收对象创建成功');
      }
      setTargetModalOpen(false);
      loadAll();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.message);
    }
  }

  const publishStats = useMemo(() => {
    let total = 0, success = 0, fail = 0;
    records.forEach((r: any) => {
      total += r.total_count || 0;
      success += r.success_count || 0;
      fail += r.fail_count || 0;
    });
    return {
      total,
      success,
      fail,
      rate: total > 0 ? ((success / total) * 100).toFixed(1) : '0',
    };
  }, [records]);

  const targetStats = useMemo(() => {
    const map: Record<string, number> = {};
    targets.forEach((t: any) => {
      map[t.target_type] = (map[t.target_type] || 0) + 1;
    });
    return map;
  }, [targets]);

  const recordColumns = [
    {
      title: '批次号',
      dataIndex: 'batch_no',
      key: 'batch_no',
      width: 200,
      render: (v: string, r: any) => (
        <Space>
          <code style={{ fontSize: 12, background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>{v}</code>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => viewDetail(r)}>详情</Button>
        </Space>
      ),
    },
    {
      title: '预警信息',
      key: 'warning',
      width: 180,
      render: (_: any, r: any) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Tag color="blue">{r.warning_type}</Tag>
            <Tag color={r.warning_level === 'red' ? 'red' : r.warning_level === 'orange' ? 'orange' : r.warning_level === 'yellow' ? 'gold' : 'blue'}>
              {r.warning_level}
            </Tag>
          </Space>
          <span style={{ fontSize: 12, color: '#999' }}>{r.warning_content?.slice(0, 20)}{r.warning_content?.length > 20 ? '...' : ''}</span>
        </Space>
      ),
    },
    {
      title: '发布渠道',
      key: 'channel',
      width: 140,
      render: (_: any, r: any) => (
        <Space>
          <span>{CHANNEL_TYPE_ICONS[r.channel_type]}</span>
          <Tag color={CHANNEL_TYPE_COLORS[r.channel_type]}>{CHANNEL_TYPE_LABELS[r.channel_type] || r.channel_type}</Tag>
          <span style={{ fontSize: 12 }}>{r.channel_name}</span>
        </Space>
      ),
    },
    {
      title: '发送统计',
      key: 'stats',
      width: 180,
      render: (_: any, r: any) => (
        <Space direction="vertical" size={2}>
          <Space>
            <Tag color="default">总数: {r.total_count}</Tag>
            <Tag color="green" icon={<CheckCircleOutlined />}>{r.success_count}</Tag>
            <Tag color="red" icon={<CloseCircleOutlined />}>{r.fail_count}</Tag>
          </Space>
          <Progress
            percent={r.total_count > 0 ? Math.round((r.success_count / r.total_count) * 100) : 0}
            size="small"
            showInfo={false}
            strokeColor={r.total_count > 0 && r.success_count === r.total_count ? '#52c41a' : '#faad14'}
          />
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => <Tag color={PUBLISH_STATUS_COLORS[v]}>{PUBLISH_STATUS_LABELS[v] || v}</Tag>,
    },
    {
      title: '发送时间',
      dataIndex: 'started_at',
      key: 'started_at',
      width: 150,
      render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm:ss') : '-',
    },
    {
      title: '流程贯通',
      key: 'links',
      width: 150,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<UnorderedListOutlined />}
            onClick={() => navigate(`/receipt?publish_record_id=${r.id}`)}
          >
            回执
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
      width: 180,
      fixed: 'right' as const,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button size="small" onClick={() => viewDetail(r)} icon={<EyeOutlined />}>详情</Button>
          {r.fail_count > 0 && (
            <Popconfirm
              title={`确认重发 ${r.fail_count} 个失败对象？`}
              description="系统将对发送失败的对象进行重试"
              onConfirm={() => handleRetry(r)}
              okText="确认重发"
              cancelText="取消"
            >
              <Button size="small" type="primary" icon={<ReloadOutlined />} loading={retrying}>重发</Button>
            </Popconfirm>
          )}
          {r.fail_count > 0 && (
            <Button size="small" danger onClick={() => viewFailures(r)} icon={<CloseCircleOutlined />}>失败名单</Button>
          )}
        </Space>
      ),
    },
  ];

  const channelColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (v: string, r: any) => (
        <Space>
          <span style={{ fontSize: 18 }}>{CHANNEL_TYPE_ICONS[r.channel_type]}</span>
          <strong>{v}</strong>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'channel_type',
      key: 'channel_type',
      width: 120,
      render: (v: string) => <Tag color={CHANNEL_TYPE_COLORS[v]}>{CHANNEL_TYPE_LABELS[v] || v}</Tag>,
    },
    {
      title: '配置',
      dataIndex: 'config',
      key: 'config',
      render: (v: string) => v ? <code style={{ fontSize: 11 }}>{v.slice(0, 80)}{v.length > 80 ? '...' : ''}</code> : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => <Tag color={v === 'active' ? 'green' : 'default'}>{v === 'active' ? '启用' : '停用'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, r: any) => <Button size="small" icon={<EditOutlined />} onClick={() => openEditChannel(r)}>编辑</Button>,
    },
  ];

  const targetColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (v: string, r: any) => (
        <Space>
          <UserOutlined />
          <strong>{v}</strong>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'target_type',
      key: 'target_type',
      width: 120,
      render: (v: string) => (
        <Space>
          <span>{TARGET_TYPE_ICONS[v]}</span>
          <Tag>{TARGET_TYPE_LABELS[v] || v}</Tag>
        </Space>
      ),
    },
    { title: '联系方式', dataIndex: 'contact', key: 'contact' },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, r: any) => <Button size="small" icon={<EditOutlined />} onClick={() => openEditTarget(r)}>编辑</Button>,
    },
  ];

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="总发送量"
              value={publishStats.total}
              prefix={<SendOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="成功数"
              value={publishStats.success}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="失败数"
              value={publishStats.fail}
              valueStyle={{ color: '#f5222d' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="总成功率"
              value={publishStats.rate}
              suffix="%"
              prefix={<Progress type="circle" percent={Number(publishStats.rate)} size={30} />}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'records',
            label: <Space><SendOutlined />发布记录</Space>,
            children: (
              <Card
                title={<Space><strong>发布记录管理</strong><Tag color="blue">{total} 条</Tag></Space>}
                extra={
                  <Space wrap>
                    <Select
                      placeholder="渠道筛选"
                      style={{ width: 140 }}
                      allowClear
                      value={filterChannel || undefined}
                      onChange={(v) => { setFilterChannel(v); setPage(1); }}
                    >
                      {channels.map((c: any) => (
                        <Option key={c.id} value={c.id}>
                          <Space><span>{CHANNEL_TYPE_ICONS[c.channel_type]}</span>{c.name}</Space>
                        </Option>
                      ))}
                    </Select>
                    <Select
                      placeholder="状态筛选"
                      style={{ width: 120 }}
                      allowClear
                      value={filterStatus || undefined}
                      onChange={(v) => { setFilterStatus(v); setPage(1); }}
                    >
                      {Object.entries(PUBLISH_STATUS_LABELS).map(([k, v]) => (
                        <Option key={k} value={k}>{v}</Option>
                      ))}
                    </Select>
                    <Button icon={<ReloadOutlined />} onClick={loadAll}>刷新</Button>
                  </Space>
                }
              >
                <Table
                  loading={loading}
                  dataSource={records}
                  rowKey="id"
                  scroll={{ x: 1400 }}
                  columns={recordColumns}
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
            key: 'channels',
            label: <Space>📢发布渠道</Space>,
            children: (
              <>
                <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                  {Object.entries(CHANNEL_TYPE_LABELS).map(([type, label]) => (
                    <Col xs={24} sm={12} md={6} key={type}>
                      <Card size="small">
                        <Space>
                          <span style={{ fontSize: 24 }}>{CHANNEL_TYPE_ICONS[type]}</span>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 'bold' }}>{label}</div>
                            <div style={{ color: '#999', fontSize: 12 }}>
                              {channels.filter((c: any) => c.channel_type === type).length} 个渠道
                            </div>
                          </div>
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>
                <Card
                  title={<Space><strong>发布渠道管理</strong><Tag color="purple">{channels.length} 个渠道</Tag></Space>}
                  extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreateChannel}>新建渠道</Button>}
                >
                  <Table dataSource={channels} rowKey="id" columns={channelColumns} pagination={false} />
                </Card>
              </>
            ),
          },
          {
            key: 'targets',
            label: <Space>👥接收对象</Space>,
            children: (
              <>
                <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                  {Object.entries(TARGET_TYPE_LABELS).map(([type, label]) => (
                    <Col xs={24} sm={12} md={6} key={type}>
                      <Card size="small">
                        <Space>
                          <span style={{ fontSize: 24 }}>{TARGET_TYPE_ICONS[type]}</span>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 'bold' }}>{label}</div>
                            <div style={{ color: '#999', fontSize: 12 }}>
                              {targetStats[type] || 0} 个对象
                            </div>
                          </div>
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>
                <Card
                  title={<Space><strong>接收对象管理</strong><Tag color="green">{targets.length} 个对象</Tag></Space>}
                  extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreateTarget}>新建对象</Button>}
                >
                  <Table dataSource={targets} rowKey="id" columns={targetColumns} pagination={false} />
                </Card>
              </>
            ),
          },
        ]}
      />

      <Modal
        title={editingChannel ? '编辑渠道' : '新建渠道'}
        open={channelModalOpen}
        onCancel={() => setChannelModalOpen(false)}
        onOk={handleSaveChannel}
        width={600}
      >
        <Form form={channelForm} layout="vertical">
          <Form.Item name="name" label="渠道名称" rules={[{ required: true }]}>
            <Input placeholder="如：应急短信网关" />
          </Form.Item>
          <Form.Item name="channel_type" label="渠道类型" rules={[{ required: true }]}>
            <Select>
              {Object.entries(CHANNEL_TYPE_LABELS).map(([k, v]) => (
                <Option key={k} value={k}>
                  <Space><span>{CHANNEL_TYPE_ICONS[k]}</span>{v}</Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="config" label="配置 (JSON)">
            <Input.TextArea rows={4} placeholder='{"gateway":"http://sms.example.com/api", "apiKey":"your-api-key"}' />
          </Form.Item>
          {editingChannel && (
            <Form.Item name="status" label="状态">
              <Select>
                <Option value="active">启用</Option>
                <Option value="inactive">停用</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title={editingTarget ? '编辑接收对象' : '新建接收对象'}
        open={targetModalOpen}
        onCancel={() => setTargetModalOpen(false)}
        onOk={handleSaveTarget}
        width={600}
      >
        <Form form={targetForm} layout="vertical">
          <Form.Item name="name" label="对象名称" rules={[{ required: true }]}>
            <Input placeholder="如：东河镇政府" />
          </Form.Item>
          <Form.Item name="target_type" label="对象类型" rules={[{ required: true }]}>
            <Select>
              {Object.entries(TARGET_TYPE_LABELS).map(([k, v]) => (
                <Option key={k} value={k}>
                  <Space><span>{TARGET_TYPE_ICONS[k]}</span>{v}</Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="contact" label="联系方式">
            <Input placeholder="手机号 / 邮箱 / 接口地址" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <CloseCircleOutlined style={{ color: '#f5222d' }} />
            <strong>失败名单 - 发送批次详情</strong>
          </Space>
        }
        open={failuresModalOpen}
        onCancel={() => setFailuresModalOpen(false)}
        width={800}
        footer={
          <Space>
            <Button onClick={() => setFailuresModalOpen(false)}>关闭</Button>
            {selectedRecord && failures.length > 0 && (
              <Popconfirm
                title={`确认重发 ${failures.length} 个失败对象？`}
                onConfirm={() => handleRetry(selectedRecord)}
                okText="确认重发"
              >
                <Button type="primary" icon={<ReloadOutlined />} loading={retrying}>
                  重发所有失败 ({failures.length})
                </Button>
              </Popconfirm>
            )}
          </Space>
        }
      >
        {selectedRecord && (
          <>
            <Alert
              type="error"
              showIcon
              message={
                <Space>
                  <span>批次号:</span>
                  <code>{selectedRecord.batch_no}</code>
                  <Tag color="red">失败 {selectedRecord.fail_count} 条</Tag>
                </Space>
              }
              description={
                <Space direction="vertical" style={{ marginTop: 8 }} size={4}>
                  <span>预警: {selectedRecord.warning_type} ({selectedRecord.warning_level})</span>
                  <span>渠道: {selectedRecord.channel_name}</span>
                  <span>发送时间: {selectedRecord.started_at}</span>
                </Space>
              }
              style={{ marginBottom: 16 }}
            />

            <Descriptions column={3} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="预警类型">{selectedRecord.warning_type}</Descriptions.Item>
              <Descriptions.Item label="预警级别">
                <Tag color={selectedRecord.warning_level === 'red' ? 'red' : 'orange'}>{selectedRecord.warning_level}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="发布渠道">{selectedRecord.channel_name}</Descriptions.Item>
              <Descriptions.Item label="发送总数">{selectedRecord.total_count}</Descriptions.Item>
              <Descriptions.Item label="成功数量"><Tag color="green">{selectedRecord.success_count}</Tag></Descriptions.Item>
              <Descriptions.Item label="失败数量"><Tag color="red">{selectedRecord.fail_count}</Tag></Descriptions.Item>
            </Descriptions>

            <Divider orientation="left"><UnorderedListOutlined /> 失败对象列表 ({failures.length})</Divider>

            {failures.length > 0 ? (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                <List
                  dataSource={failures}
                  renderItem={(item: any) => (
                    <List.Item
                      actions={[
                        <Popconfirm
                          key="retry"
                          title={`重发给 ${item.name}？`}
                          onConfirm={() => handleRetry(selectedRecord)}
                        >
                          <Button type="link" size="small" icon={<ReloadOutlined />}>单条重发</Button>
                        </Popconfirm>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<span style={{ fontSize: 24 }}>{TARGET_TYPE_ICONS[item.target_type]}</span>}
                        title={
                          <Space>
                            <strong>{item.name}</strong>
                            <Tag color="blue">{TARGET_TYPE_LABELS[item.target_type]}</Tag>
                          </Space>
                        }
                        description={
                          <Space>
                            <span><EnvironmentOutlined /> {item.contact || '无联系方式'}</span>
                            <Tag color="red">发送失败</Tag>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            ) : (
              <Empty description="暂无失败对象" />
            )}
          </>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <EyeOutlined />
            <strong>发布详情 - 连续可查</strong>
          </Space>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        width={1100}
        footer={
          <Space>
            <Button onClick={() => setDetailModalOpen(false)}>关闭</Button>
            <Button icon={<LinkOutlined />} onClick={() => navigate(`/receipt?publish_record_id=${viewingRecord?.id}`)}>
              查看回执处置
            </Button>
            <Button type="primary" icon={<BarChartOutlined />} onClick={() => navigate('/report')}>
              查看复盘报表
            </Button>
          </Space>
        }
      >
        {recordDetail && (
          <>
            <Alert
              message={
                <Space>
                  <code>{recordDetail.batch_no}</code>
                  <Tag color={PUBLISH_STATUS_COLORS[recordDetail.status]}>{PUBLISH_STATUS_LABELS[recordDetail.status]}</Tag>
                </Space>
              }
              description={recordDetail.warning_content}
              type="info"
              showIcon
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
                        <Descriptions.Item label="预警类型">{recordDetail.warning_type}</Descriptions.Item>
                        <Descriptions.Item label="预警级别">
                          <Tag color={recordDetail.warning_level === 'red' ? 'red' : 'orange'}>
                            {recordDetail.warning_level}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="发布渠道">
                          <Space>
                            <span>{CHANNEL_TYPE_ICONS[recordDetail.channel_type]}</span>
                            {recordDetail.channel_name}
                            <Tag color={CHANNEL_TYPE_COLORS[recordDetail.channel_type]}>
                              {CHANNEL_TYPE_LABELS[recordDetail.channel_type]}
                            </Tag>
                          </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="发送时间">
                          {recordDetail.started_at ? dayjs(recordDetail.started_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="完成时间">
                          {recordDetail.completed_at ? dayjs(recordDetail.completed_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="发送统计">
                          <Space>
                            <Tag color="default">总数: {recordDetail.total_count}</Tag>
                            <Tag color="green">成功: {recordDetail.success_count}</Tag>
                            <Tag color="red">失败: {recordDetail.fail_count}</Tag>
                          </Space>
                        </Descriptions.Item>
                      </Descriptions>

                      <Divider orientation="left"><BarChartOutlined /> 发送统计</Divider>
                      <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
                        <Col span={12}>
                          <Card size="small">
                            <Progress
                              type="circle"
                              percent={recordDetail.total_count > 0 ? Math.round((recordDetail.success_count / recordDetail.total_count) * 100) : 0}
                              format={(v) => `${v}%`}
                              size={120}
                              strokeColor={{ '0%': '#108ee9', '100%': '#52c41a' }}
                            />
                            <div style={{ textAlign: 'center', marginTop: 8, fontWeight: 'bold' }}>发送成功率</div>
                          </Card>
                        </Col>
                        <Col span={12}>
                          <Timeline style={{ paddingTop: 16 }}>
                            <Timeline.Item color="green">
                              <Space>
                                <strong>发送完成</strong>
                                <span style={{ color: '#999' }}>
                                  {recordDetail.completed_at || recordDetail.started_at}
                                </span>
                              </Space>
                              <div>成功 {recordDetail.success_count} 条，失败 {recordDetail.fail_count} 条</div>
                            </Timeline.Item>
                            <Timeline.Item color="blue">
                              <Space>
                                <strong>开始发送</strong>
                                <span style={{ color: '#999' }}>{recordDetail.started_at}</span>
                              </Space>
                              <div>渠道: {recordDetail.channel_name}</div>
                            </Timeline.Item>
                            <Timeline.Item>
                              <Space>
                                <strong>预警发布请求</strong>
                                <span style={{ color: '#999' }}>{recordDetail.started_at}</span>
                              </Space>
                              <div>覆盖 {recordDetail.total_count} 个接收对象</div>
                            </Timeline.Item>
                          </Timeline>
                        </Col>
                      </Row>
                    </>
                  ),
                },
                {
                  key: 'receipt',
                  label: `回执处置 (${recordReceipts.length})`,
                  children: recordReceipts.length > 0 ? (
                    <>
                      <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                        <Col span={6}>
                          <Card size="small"><Statistic title="已确认" value={recordReceipts.filter((r: any) => r.confirm_status === 'confirmed').length} valueStyle={{ color: '#52c41a' }} /></Card>
                        </Col>
                        <Col span={6}>
                          <Card size="small"><Statistic title="已转发" value={recordReceipts.filter((r: any) => r.confirm_status === 'forwarded').length} valueStyle={{ color: '#1890ff' }} /></Card>
                        </Col>
                        <Col span={6}>
                          <Card size="small"><Statistic title="已处置" value={recordReceipts.filter((r: any) => r.confirm_status === 'acted').length} valueStyle={{ color: '#722ed1' }} /></Card>
                        </Col>
                        <Col span={6}>
                          <Card size="small"><Statistic title="待确认" value={recordReceipts.filter((r: any) => r.confirm_status === 'pending').length} valueStyle={{ color: '#faad14' }} /></Card>
                        </Col>
                      </Row>
                      <Table
                        size="small"
                        dataSource={recordReceipts}
                        rowKey="id"
                        pagination={false}
                        columns={[
                          { title: '接收对象', dataIndex: 'target_name', key: 'target_name' },
                          {
                            title: '类型',
                            dataIndex: 'target_type',
                            key: 'target_type',
                            render: (v: string) => (
                              <Space><span>{TARGET_TYPE_ICONS[v]}</span>{TARGET_TYPE_LABELS[v]}</Space>
                            ),
                          },
                          {
                            title: '状态',
                            dataIndex: 'confirm_status',
                            key: 'confirm_status',
                            render: (v: string) => (
                              <Tag color={
                                v === 'confirmed' ? 'green' :
                                v === 'forwarded' ? 'blue' :
                                v === 'acted' ? 'purple' :
                                v === 'no_response' ? 'red' : 'default'
                              }>
                                {v === 'confirmed' ? '已确认' :
                                 v === 'forwarded' ? '已转发' :
                                 v === 'acted' ? '已处置' :
                                 v === 'no_response' ? '未响应' : '待确认'}
                              </Tag>
                            ),
                          },
                          { title: '确认时间', dataIndex: 'confirm_time', key: 'confirm_time', render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
                          { title: '转发至', dataIndex: 'forward_to', key: 'forward_to' },
                        ]}
                      />
                    </>
                  ) : <Empty description="暂无回执数据" />,
                },
              ]}
            />
          </>
        )}
      </Modal>
    </>
  );
}