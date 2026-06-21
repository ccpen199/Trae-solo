import React, { useEffect, useState, useMemo } from 'react';
import {
  Card, Table, Button, DatePicker, Select, Form, Space, Tag,
  Modal, Input, Tooltip, Drawer, Empty, Progress, Popconfirm,
  Descriptions, Timeline, Row, Col
} from 'antd';
import {
  PlayCircleOutlined, CalendarOutlined, SearchOutlined,
  DeleteOutlined, DownloadOutlined, EyeOutlined, EditOutlined,
  PlusOutlined, FileTextOutlined, ClockCircleOutlined,
  SettingOutlined, SwapRightOutlined, VideoCameraOutlined
} from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import dayjs, { Dayjs } from 'dayjs';
import { deviceApi, streamApi } from '@/services/api';
import VideoPlayer from '@/components/VideoPlayer';
import { formatDuration, formatFileSize, formatTime, getEventTypeText, getEventLevelColor } from '@/utils/format';
import { Device, Recording, StoragePolicy } from '@/types';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Playback: React.FC = observer(() => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState<StoragePolicy[]>([]);

  const [filterDevice, setFilterDevice] = useState<number | undefined>(undefined);
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  const [playModal, setPlayModal] = useState(false);
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);

  const [policyModal, setPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<StoragePolicy | null>(null);
  const [policyForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState<'recordings' | 'policies'>('recordings');

  useEffect(() => {
    loadDevices();
    loadRecordings();
    loadPolicies();
  }, [page, pageSize, filterDevice, filterType, dateRange]);

  const loadDevices = async () => {
    try {
      const res = await deviceApi.listDevices({ pageSize: 200 });
      setDevices(res.list || []);
    } catch (e) {}
  };

  const loadRecordings = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (filterDevice) params.deviceId = filterDevice;
      if (filterType) params.recordType = filterType;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startTime = dateRange[0].startOf('day').toISOString();
        params.endTime = dateRange[1].endOf('day').toISOString();
      }
      const res = await streamApi.listRecordings(params);
      setRecordings(res.list || []);
      setTotal(res.total || 0);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const loadPolicies = async () => {
    try {
      const res = await streamApi.listStoragePolicies();
      setPolicies(res || []);
    } catch (e) {}
  };

  const deleteRecording = async (rec: Recording) => {
    try {
      await streamApi.deleteRecording(rec.id);
      message.success('删除成功');
      loadRecordings();
    } catch (e) {}
  };

  const openPolicyModal = (policy?: StoragePolicy) => {
    setEditingPolicy(policy || null);
    policyForm.resetFields();
    if (policy) {
      policyForm.setFieldsValue({
        name: policy.name,
        deviceId: policy.device_id,
        groupId: policy.group_id,
        policyType: policy.policy_type,
        retentionDays: policy.retention_days,
        scheduleConfig: policy.schedule_config,
        smartTags: policy.smart_tags,
        status: !!policy.status,
      });
    } else {
      policyForm.setFieldsValue({
        policyType: 'schedule',
        retentionDays: 7,
        status: true,
      });
    }
    setPolicyModal(true);
  };

  const submitPolicy = async () => {
    try {
      const values = await policyForm.validateFields();
      if (editingPolicy) {
        await streamApi.updateStoragePolicy(editingPolicy.id, values);
        message.success('更新成功');
      } else {
        await streamApi.createStoragePolicy(values);
        message.success('创建成功');
      }
      setPolicyModal(false);
      loadPolicies();
    } catch (e: any) {
      if (e?.errorFields) return;
    }
  };

  const deletePolicy = async (policy: StoragePolicy) => {
    try {
      await streamApi.deleteStoragePolicy(policy.id);
      message.success('删除成功');
      loadPolicies();
    } catch (e) {}
  };

  const recordingColumns = [
    {
      title: '设备',
      dataIndex: 'device_name',
      key: 'device_name',
      width: 160,
      render: (v: string, r: Recording) => (
        <div className="flex items-center gap-2">
          <VideoCameraOutlined className="text-blue-500" />
          <span>{v}</span>
        </div>
      )
    },
    {
      title: '文件信息',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (_: any, r: Recording) => (
        <div>
          <div className="font-mono text-sm">{r.file_name}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {formatFileSize(r.file_size)} · {formatDuration(r.duration)}
          </div>
        </div>
      ),
    },
    {
      title: '录制类型',
      dataIndex: 'record_type',
      key: 'record_type',
      width: 110,
      render: (v: string) => {
        const map: Record<string, { color: string; text: string }> = {
          manual: { color: 'blue', text: '手动录制' },
          schedule: { color: 'green', text: '定时录制' },
          event: { color: 'orange', text: '事件录制' },
          smart: { color: 'purple', text: '智能录制' },
        };
        const info = map[v] || { color: 'default', text: v };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '录制时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
      render: (v: number) => formatDuration(v),
    },
    {
      title: '起止时间',
      key: 'time',
      width: 280,
      render: (_: any, r: Recording) => (
        <div className="text-sm space-y-0.5">
          <div className="flex items-center gap-1 text-gray-600">
            <PlayCircleOutlined /> {formatTime(r.start_time, 'MM-DD HH:mm:ss')}
          </div>
          {r.end_time && (
            <div className="flex items-center gap-1 text-gray-600">
              <SwapRightOutlined /> {formatTime(r.end_time, 'MM-DD HH:mm:ss')}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, r: Recording) => (
        <Space size={4}>
          <Tooltip title="回放">
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => { setCurrentRecording(r); setPlayModal(true); }}
            />
          </Tooltip>
          <Tooltip title="下载">
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => window.open(streamApi.getRecordingPlaybackUrl(r.id))}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除该录像文件？"
            onConfirm={() => deleteRecording(r)}
            okText="删除"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const playbackUrl = currentRecording ? streamApi.getRecordingPlaybackUrl(currentRecording.id) : '';

  return (
    <div>
      <Card
        className="!rounded-xl"
        tabList={[
          { key: 'recordings', tab: <span><FileTextOutlined /> 录像列表</span> },
          { key: 'policies', tab: <span><SettingOutlined /> 云存储策略</span> },
        ]}
        activeTabKey={activeTab}
        onTabChange={(k) => setActiveTab(k as any)}
        extra={
          <Space>
            <Button icon={<SearchOutlined />} onClick={loadRecordings}>刷新</Button>
            {activeTab === 'policies' && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openPolicyModal()}>
                新建策略
              </Button>
            )}
          </Space>
        }
      >
        {activeTab === 'recordings' ? (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Select
                placeholder="选择设备"
                allowClear
                style={{ width: 180 }}
                showSearch
                value={filterDevice}
                onChange={(v) => { setFilterDevice(v); setPage(1); }}
                optionFilterProp="label"
              >
                {devices.map(d => (
                  <Option key={d.id} value={d.id} label={d.name}>
                    {d.name}（{d.device_sn}）
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="录制类型"
                allowClear
                style={{ width: 140 }}
                value={filterType}
                onChange={(v) => { setFilterType(v); setPage(1); }}
              >
                <Option value="manual">手动录制</Option>
                <Option value="schedule">定时录制</Option>
                <Option value="event">事件录制</Option>
                <Option value="smart">智能录制</Option>
              </Select>
              <RangePicker
                showTime
                value={dateRange}
                onChange={(v) => { setDateRange(v as any); setPage(1); }}
              />
            </div>

            <Table
              rowKey="id"
              loading={loading}
              columns={recordingColumns}
              dataSource={recordings}
              locale={{ emptyText: <Empty description="暂无录像记录，可前往实时预览手动录制或配置存储策略" /> }}
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
          </>
        ) : (
          policies.length === 0 ? (
            <Empty
              description={<div className="py-4">
                <div className="mb-3">暂无存储策略</div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openPolicyModal()}>
                  创建首个策略
                </Button>
              </div>}
            />
          ) : (
            <Row gutter={[16, 16]}>
              {policies.map(p => (
                <Col key={p.id} xs={24} md={12} lg={8}>
                  <Card
                    size="small"
                    className="!rounded-xl hover:!shadow-md transition-shadow"
                    title={<span className="font-medium">{p.name}</span>}
                    extra={
                      <Tag color={
                        p.policy_type === 'event' ? 'orange' :
                        p.policy_type === 'smart' ? 'purple' : 'green'
                      }>
                        {p.policy_type === 'event' ? '按事件' :
                         p.policy_type === 'smart' ? '智能标记' : '按定时'}
                      </Tag>
                    }
                    actions={[
                      <EditOutlined key="edit" onClick={() => openPolicyModal(p)} />,
                      <Popconfirm
                        key="del"
                        title="删除策略"
                        onConfirm={() => deletePolicy(p)}
                        okButtonProps={{ danger: true }}
                      >
                        <DeleteOutlined />
                      </Popconfirm>
                    ]}
                  >
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="适用范围">
                        {p.device_name || p.group_name || '全部设备'}
                      </Descriptions.Item>
                      <Descriptions.Item label="保留周期">
                        {p.retention_days} 天
                      </Descriptions.Item>
                      <Descriptions.Item label="状态">
                        <Tag color={p.status ? 'success' : 'default'}>
                          {p.status ? '已启用' : '已停用'}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="创建时间">
                        {formatTime(p.created_at, 'YYYY-MM-DD')}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              ))}
            </Row>
          )
        )}
      </Card>

      <Modal
        title={`录像回放 - ${currentRecording?.device_name}`}
        open={playModal}
        onCancel={() => setPlayModal(false)}
        footer={[
          <Button key="dl" icon={<DownloadOutlined />} onClick={() => window.open(playbackUrl)}>下载</Button>,
          <Button key="close" onClick={() => setPlayModal(false)}>关闭</Button>
        ]}
        width={900}
        destroyOnClose
      >
        {currentRecording && (
          <div>
            <div className="bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              {playbackUrl ? (
                <video
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  src={playbackUrl}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  录像文件加载中...
                </div>
              )}
            </div>
            <div className="mt-4">
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="设备名称">{currentRecording.device_name}</Descriptions.Item>
                <Descriptions.Item label="文件大小">{currentRecording.fileSizeFormatted}</Descriptions.Item>
                <Descriptions.Item label="开始时间">{formatTime(currentRecording.start_time)}</Descriptions.Item>
                <Descriptions.Item label="录制时长">{formatDuration(currentRecording.duration)}</Descriptions.Item>
                <Descriptions.Item label="录制类型" span={2}>
                  <Tag color={
                    currentRecording.record_type === 'event' ? 'orange' :
                    currentRecording.record_type === 'smart' ? 'purple' :
                    currentRecording.record_type === 'manual' ? 'blue' : 'green'
                  }>
                    {currentRecording.record_type === 'event' ? '事件录制' :
                     currentRecording.record_type === 'smart' ? '智能录制' :
                     currentRecording.record_type === 'manual' ? '手动录制' : '定时录制'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={editingPolicy ? '编辑存储策略' : '新建云存储策略'}
        open={policyModal}
        onOk={submitPolicy}
        onCancel={() => setPolicyModal(false)}
        width={700}
        okText="保存"
      >
        <Form form={policyForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="策略名称" rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="如：门口摄像头全量录制" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="policyType" label="存储类型" rules={[{ required: true }]}>
                <Select>
                  <Option value="schedule">定时录制（按计划录制）</Option>
                  <Option value="event">事件录制（告警触发时录制）</Option>
                  <Option value="smart">智能标记（AI识别对象时录制）</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deviceId" label="适用设备">
                <Select allowClear placeholder="所有设备" showSearch optionFilterProp="label">
                  {devices.map(d => (
                    <Option key={d.id} value={d.id} label={d.name}>{d.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="retentionDays" label="保留天数" rules={[{ required: true }]}>
                <Select>
                  <Option value={1}>1 天</Option>
                  <Option value={3}>3 天</Option>
                  <Option value={7}>7 天</Option>
                  <Option value={15}>15 天</Option>
                  <Option value={30}>30 天</Option>
                  <Option value={90}>90 天</Option>
                  <Option value={180}>半年</Option>
                  <Option value={365}>1 年</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.policyType !== cur.policyType}>
            {({ getFieldValue }) => {
              const type = getFieldValue('policyType');
              if (type === 'schedule') {
                return (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm">
                    <div className="font-medium text-blue-800 mb-2">📅 定时录制计划说明</div>
                    <ul className="text-blue-700 list-disc ml-5 space-y-1">
                      <li>默认：全天候 24 小时录制</li>
                      <li>可按时间段细化录制计划（如工作日 9:00-18:00）</li>
                      <li>码率默认主码流，可按需调整为子码流节省空间</li>
                    </ul>
                  </div>
                );
              }
              if (type === 'event') {
                return (
                  <div className="bg-orange-50 p-4 rounded-lg mb-4 text-sm">
                    <div className="font-medium text-orange-800 mb-2">⚠️ 事件录制说明</div>
                    <ul className="text-orange-700 list-disc ml-5 space-y-1">
                      <li>触发类型：人形侦测、移动侦测、越界、区域入侵等</li>
                      <li>录制范围：事件前 5 秒 - 事件后 25 秒（默认 30 秒/段）</li>
                      <li>事件录像单独标记，便于快速检索</li>
                    </ul>
                  </div>
                );
              }
              if (type === 'smart') {
                return (
                  <div className="bg-purple-50 p-4 rounded-lg mb-4 text-sm">
                    <div className="font-medium text-purple-800 mb-2">🤖 智能标记录制说明</div>
                    <ul className="text-purple-700 list-disc ml-5 space-y-1">
                      <li>识别到人/车/动物等目标时触发录制</li>
                      <li>录像打智能标签，可按标签检索</li>
                      <li>大幅降低无用录像，节省存储空间</li>
                    </ul>
                  </div>
                );
              }
              return null;
            }}
          </Form.Item>
          <Form.Item name="status" label="启用策略" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});

export default Playback;
