import React, { useEffect, useState } from 'react';
import {
  Table, Card, Button, Space, Tag, Input, Select, Modal, Form,
  DatePicker, Drawer, Descriptions, Image, Timeline, Empty,
  Radio, message, Tooltip, Popconfirm, Badge, Avatar, Row, Col
} from 'antd';
import {
  BellOutlined, SearchOutlined, CheckCircleOutlined,
  InfoCircleOutlined, WarningOutlined, DeleteOutlined,
  ExclamationCircleOutlined, EyeOutlined, FilterOutlined,
  ReadOutlined, SafetyOutlined, VideoCameraOutlined,
  ClockCircleOutlined, PhoneOutlined, WechatOutlined,
  MessageOutlined, SendOutlined
} from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import dayjs, { Dayjs } from 'dayjs';
import { streamApi, deviceApi, userApi } from '@/services/api';
import appStore from '@/store';
import { formatTime, formatRelativeTime, getEventLevelColor, getEventTypeText, copyToClipboard } from '@/utils/format';
import { Alert, AIEvent, Device } from '@/types';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Alerts: React.FC = observer(() => {
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [events, setEvents] = useState<AIEvent[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [activeTab, setActiveTab] = useState<'alert' | 'event'>('alert');

  const [filterDevice, setFilterDevice] = useState<number | undefined>(undefined);
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [filterLevel, setFilterLevel] = useState<string | undefined>(undefined);
  const [filterRead, setFilterRead] = useState<number | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  const [detailDrawer, setDetailDrawer] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Alert | AIEvent | null>(null);
  const [auditModal, setAuditModal] = useState(false);
  const [auditForm] = Form.useForm();

  useEffect(() => {
    loadDevices();
    loadAlerts();
    loadEvents();
  }, [page, pageSize, filterDevice, filterType, filterLevel, filterRead, dateRange, activeTab]);

  const loadDevices = async () => {
    try {
      const res = await deviceApi.listDevices({ pageSize: 200 });
      setDevices(res.list || []);
    } catch (e) {}
  };

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (filterDevice) params.deviceId = filterDevice;
      if (filterType) params.alertType = filterType;
      if (filterRead !== undefined) params.readStatus = filterRead;
      if (dateRange && dateRange[0]) params.startTime = dateRange[0].toISOString();
      if (dateRange && dateRange[1]) params.endTime = dateRange[1].toISOString();
      const res = await streamApi.listAlerts(params);
      setAlerts(res.list || []);
      setTotal(res.total || 0);
      setUnread(res.unreadCount || 0);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const params: any = { page, pageSize };
      if (filterDevice) params.deviceId = filterDevice;
      if (filterType) params.eventType = filterType;
      if (filterLevel) params.eventLevel = filterLevel;
      if (dateRange && dateRange[0]) params.startTime = dateRange[0].toISOString();
      if (dateRange && dateRange[1]) params.endTime = dateRange[1].toISOString();
      const res = await streamApi.listEvents(params);
      setEvents(res.list || []);
    } catch (e) {}
  };

  const markAllRead = async () => {
    try {
      await streamApi.markAlertsRead({});
      message.success('已全部标记为已读');
      appStore.loadUnreadAlerts();
      loadAlerts();
    } catch (e) {}
  };

  const markOneRead = async (id: number) => {
    try {
      await streamApi.markAlertsRead({ ids: [id] });
      appStore.loadUnreadAlerts();
      loadAlerts();
    } catch (e) {}
  };

  const openDetail = (record: Alert | AIEvent) => {
    setCurrentRecord(record);
    if ('read_status' in record && record.read_status === 0) {
      markOneRead(record.id);
    }
    setDetailDrawer(true);
  };

  const submitAudit = async () => {
    try {
      const values = await auditForm.validateFields();
      await streamApi.createAuditLog({
        alertId: currentRecord?.id,
        action: values.action,
        detail: values.detail
      });
      message.success('已记录');
      setAuditModal(false);
      auditForm.resetFields();
    } catch (e: any) {
      if (e?.errorFields) return;
    }
  };

  const sentChannels = (str?: string) => {
    if (!str) return [];
    try { return JSON.parse(str); } catch { return []; }
  };

  const alertColumns = [
    {
      title: '',
      key: 'status',
      width: 50,
      render: (_: any, r: Alert) => (
        <Badge dot status={r.read_status === 0 ? 'processing' : 'default'} />
      ),
    },
    {
      title: '级别',
      dataIndex: 'event_level',
      key: 'event_level',
      width: 90,
      render: (level: string) => {
        const lvl = level || 'normal';
        const icon = lvl === 'critical' || lvl === 'high' ? <WarningOutlined /> : <InfoCircleOutlined />;
        return (
          <Tag icon={icon} color={getEventLevelColor(lvl)} className="!m-0 !text-xs">
            {getEventTypeText(lvl)}
          </Tag>
        );
      },
    },
    {
      title: '告警标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, r: Alert) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{title}</div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">
            {r.content}
          </div>
        </div>
      ),
    },
    {
      title: '设备',
      dataIndex: 'device_name',
      key: 'device_name',
      width: 140,
      render: (v: string, r: Alert) => (
        <div className="flex items-center gap-1.5">
          <VideoCameraOutlined className="text-blue-500" />
          <span>{v}</span>
        </div>
      ),
    },
    {
      title: '告警渠道',
      dataIndex: 'sent_channels',
      key: 'sent_channels',
      width: 150,
      render: (v: string) => {
        const ch = sentChannels(v);
        return (
          <Space size={4} wrap>
            {ch.includes('inapp') && <Tag color="blue" icon={<BellOutlined />}>站内</Tag>}
            {ch.includes('sms') && <Tag color="orange" icon={<PhoneOutlined />}>短信</Tag>}
            {ch.includes('wechat') && <Tag color="green" icon={<WechatOutlined />}>微信</Tag>}
          </Space>
        );
      },
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (v: string) => (
        <div className="text-sm">
          <div>{formatTime(v, 'MM-DD HH:mm:ss')}</div>
          <div className="text-xs text-gray-400">{formatRelativeTime(v)}</div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, r: Alert) => (
        <Space size={4}>
          <Tooltip title="查看详情">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)} />
          </Tooltip>
          {r.read_status === 0 && (
            <Tooltip title="标记已读">
              <Button type="link" size="small" icon={<ReadOutlined />} onClick={() => markOneRead(r.id)} />
            </Tooltip>
          )}
          <Tooltip title="告警处置">
            <Button type="link" size="small" icon={<SafetyOutlined />} onClick={() => { setCurrentRecord(r); setAuditModal(true); }} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const eventColumns = [
    {
      title: '抓拍',
      dataIndex: 'snapshot_path',
      key: 'snapshot',
      width: 120,
      render: (v: string) => v ? (
        <Image
          width={100}
          height={56}
          src={`/api${v.replace(/^\.\/uploads/, '/uploads')}`}
          style={{ objectFit: 'cover', borderRadius: 4 }}
        />
      ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无" style={{ height: 56 }} />,
    },
    {
      title: '事件类型',
      dataIndex: 'event_type',
      key: 'event_type',
      width: 140,
      render: (v: string, r: AIEvent) => (
        <div>
          <Tag color={getEventLevelColor(r.event_level)} className="!mb-1">
            {getEventTypeText(v)}
          </Tag>
          <div className="text-xs text-gray-500">置信度 {Math.round((r.confidence || 0) * 100)}%</div>
        </div>
      ),
    },
    {
      title: '设备',
      dataIndex: 'device_name',
      key: 'device_name',
      width: 140,
      render: (v: string) => v,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (v: string) => v || '-',
    },
    {
      title: '位置信息',
      key: 'loc',
      width: 160,
      render: (_: any, r: AIEvent) => (
        <span className="font-mono text-xs text-gray-600">
          {r.location_x !== undefined && r.location_y !== undefined
            ? `x:${r.location_x}, y:${r.location_y}${r.location_w ? `, ${r.location_w}x${r.location_h}` : ''}`
            : '-'
          }
        </span>
      ),
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (v: string) => (
        <div className="text-sm">
          <div>{formatTime(v, 'MM-DD HH:mm:ss')}</div>
          <div className="text-xs text-gray-400">{formatRelativeTime(v)}</div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, r: AIEvent) => (
        <Tooltip title="查看详情">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <Card
        className="!rounded-xl"
        title={
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-base flex items-center gap-2">
              <BellOutlined /> 告警中心
              {unread > 0 && <Badge count={unread} showZero={false} />}
            </span>
            <Radio.Group value={activeTab} onChange={(e) => setActiveTab(e.target.value)} size="small">
              <Radio.Button value="alert">告警消息</Radio.Button>
              <Radio.Button value="event">AI事件</Radio.Button>
            </Radio.Group>
          </div>
        }
        extra={
          <Space wrap>
            <Select
              placeholder="设备"
              allowClear
              style={{ width: 160 }}
              showSearch
              value={filterDevice}
              onChange={(v) => { setFilterDevice(v); setPage(1); }}
              optionFilterProp="label"
            >
              {devices.map(d => <Option key={d.id} value={d.id} label={d.name}>{d.name}</Option>)}
            </Select>
            {activeTab === 'alert' ? (
              <Select
                placeholder="状态"
                allowClear
                style={{ width: 120 }}
                value={filterRead}
                onChange={(v) => { setFilterRead(v); setPage(1); }}
              >
                <Option value={0}>未读</Option>
                <Option value={1}>已读</Option>
              </Select>
            ) : (
              <Select
                placeholder="级别"
                allowClear
                style={{ width: 120 }}
                value={filterLevel}
                onChange={(v) => { setFilterLevel(v); setPage(1); }}
              >
                <Option value="low">低</Option>
                <Option value="normal">普通</Option>
                <Option value="high">高</Option>
                <Option value="critical">严重</Option>
              </Select>
            )}
            <Select
              placeholder="类型"
              allowClear
              style={{ width: 140 }}
              value={filterType}
              onChange={(v) => { setFilterType(v); setPage(1); }}
            >
              <Option value="person_detect">人形侦测</Option>
              <Option value="motion_detect">移动侦测</Option>
              <Option value="intrusion">区域入侵</Option>
              <Option value="line_cross">越界侦测</Option>
              <Option value="offline">设备离线</Option>
            </Select>
            <RangePicker showTime value={dateRange} onChange={(v) => { setDateRange(v as any); setPage(1); }} />
            {activeTab === 'alert' && (
              <Button icon={<ReadOutlined />} onClick={markAllRead} disabled={unread === 0}>
                全部已读
              </Button>
            )}
            <Button icon={<FilterOutlined />} onClick={() => {
              setFilterDevice(undefined); setFilterType(undefined); setFilterLevel(undefined);
              setFilterRead(undefined); setDateRange(null); setPage(1);
            }}>重置</Button>
          </Space>
        }
      >
        {activeTab === 'alert' ? (
          <Table
            rowKey="id"
            loading={loading}
            columns={alertColumns}
            dataSource={alerts}
            locale={{ emptyText: <Empty description="暂无告警消息" /> }}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p, ps) => { setPage(p); setPageSize(ps); }
            }}
            rowClassName={(r) => r.read_status === 0 ? 'bg-blue-50/30' : ''}
          />
        ) : (
          <Table
            rowKey="id"
            loading={loading}
            columns={eventColumns}
            dataSource={events}
            locale={{ emptyText: <Empty description="暂无AI事件记录" /> }}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p, ps) => { setPage(p); setPageSize(ps); }
            }}
          />
        )}
      </Card>

      <Drawer
        title="告警/事件详情"
        width={560}
        open={detailDrawer}
        onClose={() => setDetailDrawer(false)}
        destroyOnClose
      >
        {currentRecord && (
          <div className="space-y-5">
            {('snapshot_path' in currentRecord) && currentRecord.snapshot_path && (
              <div>
                <div className="font-medium mb-2 flex items-center gap-1.5">
                  <Image src={`/api${currentRecord.snapshot_path.replace(/^\.\/uploads/, '/uploads')}`} alt="" style={{ borderRadius: 8, width: '100%' }} />
                </div>
              </div>
            )}

            <Card size="small" title="基本信息">
              <Descriptions column={1} size="small" bordered>
                {'title' in currentRecord && <Descriptions.Item label="告警标题">{currentRecord.title}</Descriptions.Item>}
                {'event_type' in currentRecord && <Descriptions.Item label="事件类型">{getEventTypeText(currentRecord.event_type)}</Descriptions.Item>}
                {'event_level' in currentRecord && <Descriptions.Item label="级别"><Tag color={getEventLevelColor(currentRecord.event_level || 'normal')}>{currentRecord.event_level}</Tag></Descriptions.Item>}
                {'confidence' in currentRecord && (currentRecord.confidence ?? 0) > 0 && (
                  <Descriptions.Item label="AI置信度">{Math.round((currentRecord.confidence ?? 0) * 100)}%</Descriptions.Item>
                )}
                <Descriptions.Item label="设备">{currentRecord.device_name}</Descriptions.Item>
                {'content' in currentRecord && <Descriptions.Item label="详细说明">{currentRecord.content || '-'}</Descriptions.Item>}
                {'description' in currentRecord && <Descriptions.Item label="AI描述">{currentRecord.description || '-'}</Descriptions.Item>}
                <Descriptions.Item label="发生时间">
                  <div>
                    <div>{formatTime(currentRecord.created_at)}</div>
                    <div className="text-xs text-gray-500">{formatRelativeTime(currentRecord.created_at)}</div>
                  </div>
                </Descriptions.Item>
                {'read_status' in currentRecord && (
                  <Descriptions.Item label="阅读状态">
                    <Tag color={currentRecord.read_status === 0 ? 'warning' : 'success'}>
                      {currentRecord.read_status === 0 ? '未读' : '已读'}
                    </Tag>
                  </Descriptions.Item>
                )}
                {'sent_channels' in currentRecord && (
                  <Descriptions.Item label="推送渠道">
                    {sentChannels(currentRecord.sent_channels).length ? sentChannels(currentRecord.sent_channels).map((c: string) => (
                      <Tag key={c} color={c === 'sms' ? 'orange' : c === 'wechat' ? 'green' : 'blue'}>
                        {c === 'sms' ? '短信' : c === 'wechat' ? '微信模板' : '站内信'}
                      </Tag>
                    )) : '-'}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {'location_x' in currentRecord && currentRecord.location_x !== undefined && (
              <Card size="small" title="目标位置（像素）">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>X 坐标: <code>{currentRecord.location_x}</code></div>
                  <div>Y 坐标: <code>{currentRecord.location_y}</code></div>
                  <div>宽: <code>{currentRecord.location_w}</code></div>
                  <div>高: <code>{currentRecord.location_h}</code></div>
                </div>
              </Card>
            )}

            {appStore.isOwner && 'title' in currentRecord && (
              <div className="pt-2">
                <Button type="primary" icon={<SafetyOutlined />} block onClick={() => setAuditModal(true)}>
                  录入处置记录
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        title="告警处置记录"
        open={auditModal}
        onOk={submitAudit}
        onCancel={() => setAuditModal(false)}
        okText="提交"
      >
        <Form form={auditForm} layout="vertical" initialValues={{ action: 'view' }}>
          <Form.Item name="action" label="处置动作" rules={[{ required: true }]}>
            <Select>
              <Option value="view">已查看</Option>
              <Option value="confirm">确认有效告警</Option>
              <Option value="ignore">标记误报</Option>
              <Option value="dispatch">已派发处理</Option>
              <Option value="close">处理完成</Option>
            </Select>
          </Form.Item>
          <Form.Item name="detail" label="处置说明">
            <Input.TextArea rows={4} placeholder="请输入处置详情（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});

export default Alerts;
