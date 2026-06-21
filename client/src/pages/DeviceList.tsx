import React, { useEffect, useState } from 'react';
import {
  Table, Card, Button, Space, Tag, Input, Modal, Form, Select,
  Switch, Popconfirm, message, Empty, Dropdown, Tooltip, Divider
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  ShareAltOutlined, EyeOutlined, SettingOutlined, SyncOutlined,
  FolderOpenOutlined, MoreOutlined, VideoCameraOutlined,
  CheckCircleOutlined, DisconnectOutlined, ExportOutlined
} from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { deviceApi, streamApi } from '@/services/api';
import appStore from '@/store';
import { formatTime, getPermissionText, copyToClipboard } from '@/utils/format';
import { Device, DeviceGroup, DeviceShare } from '@/types';

const { Option } = Select;

const DeviceList: React.FC = observer(() => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [groups, setGroups] = useState<DeviceGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [filterGroup, setFilterGroup] = useState<number | null | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<number | undefined>(undefined);

  const [deviceModal, setDeviceModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [groupModal, setGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DeviceGroup | null>(null);
  const [shareModal, setShareModal] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [shares, setShares] = useState<DeviceShare[]>([]);
  const [shareTab, setShareTab] = useState<'share' | 'list'>('share');

  const [deviceForm] = Form.useForm();
  const [groupForm] = Form.useForm();
  const [shareForm] = Form.useForm();

  useEffect(() => {
    loadGroups();
    loadDevices();
  }, [page, pageSize, keyword, filterGroup, filterStatus]);

  const loadGroups = async () => {
    try {
      const res = await deviceApi.listGroups();
      setGroups(res || []);
    } catch (e) {}
  };

  const loadDevices = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (filterGroup !== undefined) params.groupId = filterGroup === null ? 'null' : filterGroup;
      if (filterStatus !== undefined) params.status = filterStatus;
      const res = await deviceApi.listDevices(params);
      setDevices(res.list || []);
      setTotal(res.total || 0);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const openDeviceModal = (device?: Device) => {
    setEditingDevice(device || null);
    deviceForm.resetFields();
    if (device) {
      deviceForm.setFieldsValue({
        name: device.name,
        model: device.model,
        firmwareVersion: device.firmware_version,
        protocol: device.protocol,
        streamUrl: device.stream_url,
        rtspUrl: device.rtsp_url,
        rtmpUrl: device.rtmp_url,
        videoCodec: device.video_codec,
        audioCodec: device.audio_codec,
        resolution: device.resolution,
        groupId: device.group_id,
        imei: device.imei,
        ipAddress: device.ip_address,
        macAddress: device.mac_address,
        supportPTZ: !!device.support_ptz,
        supportAudio: !!device.support_audio,
        status: !!device.status,
      });
    } else {
      deviceForm.setFieldsValue({
        protocol: 'ONVIF',
        videoCodec: 'H.264',
        audioCodec: 'G.711A',
        supportAudio: true,
        status: true,
      });
    }
    setDeviceModal(true);
  };

  const submitDevice = async () => {
    try {
      const values = await deviceForm.validateFields();
      const params = {
        ...values,
        supportPTZ: values.supportPTZ ? 1 : 0,
        supportAudio: values.supportAudio ? 1 : 0,
        status: values.status ? 1 : 0,
      };
      if (editingDevice) {
        await deviceApi.updateDevice(editingDevice.id, params);
        message.success('更新成功');
      } else {
        await deviceApi.createDevice(params);
        message.success('添加成功');
      }
      setDeviceModal(false);
      loadDevices();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error('操作失败');
    }
  };

  const deleteDevice = async (device: Device) => {
    try {
      await deviceApi.deleteDevice(device.id);
      message.success('删除成功');
      loadDevices();
    } catch (e) {}
  };

  const openGroupModal = (group?: DeviceGroup) => {
    setEditingGroup(group || null);
    groupForm.resetFields();
    if (group && group.id) {
      groupForm.setFieldsValue({
        name: group.name,
        description: group.description,
        sortOrder: group.sort_order,
      });
    }
    setGroupModal(true);
  };

  const submitGroup = async () => {
    try {
      const values = await groupForm.validateFields();
      if (editingGroup && editingGroup.id) {
        await deviceApi.updateGroup(editingGroup.id, values);
        message.success('更新成功');
      } else {
        await deviceApi.createGroup(values);
        message.success('创建成功');
      }
      setGroupModal(false);
      loadGroups();
    } catch (e: any) {
      if (e?.errorFields) return;
    }
  };

  const deleteGroup = async (group: DeviceGroup) => {
    if (!group.id) return;
    try {
      await deviceApi.deleteGroup(group.id);
      message.success('删除成功');
      loadGroups();
    } catch (e) {}
  };

  const openShareModal = async (device: Device) => {
    setCurrentDevice(device);
    shareForm.resetFields();
    shareForm.setFieldsValue({
      permissionLevel: 'view',
      temporary: false,
    });
    setShareTab('share');
    try {
      const res = await deviceApi.listOutgoingShares();
      setShares((res?.list || []).filter((s: DeviceShare) => s.device_id === device.id));
    } catch (e) {}
    setShareModal(true);
  };

  const submitShare = async () => {
    if (!currentDevice) return;
    try {
      const values = await shareForm.validateFields();
      const res = await deviceApi.shareDevice(currentDevice.id, {
        ...values,
        expireHours: values.expireHours ? values.expireHours * 24 : undefined,
      });
      if (values.temporary && res.shareLink) {
        const fullUrl = window.location.origin + '/temp-view' + res.shareLink.replace('/api/stream/temporary', '');
        Modal.success({
          title: '临时分享链接已生成',
          content: (
            <div>
              <p>访问链接有效期：{values.expireHours ? `${values.expireHours}天` : '24小时'}</p>
              <Input
                value={fullUrl}
                readOnly
                addonAfter={<Button onClick={() => copyToClipboard(fullUrl)}>复制</Button>}
              />
              <p className="mt-2 text-gray-500 text-sm">⚠️ 请勿将链接随意分享给他人</p>
            </div>
          )
        });
      } else {
        message.success('分享成功');
      }
      const res2 = await deviceApi.listOutgoingShares();
      setShares((res2?.list || []).filter((s: DeviceShare) => s.device_id === currentDevice.id));
      shareForm.resetFields();
    } catch (e: any) {
      if (e?.errorFields) return;
    }
  };

  const revokeShare = async (share: DeviceShare) => {
    try {
      await deviceApi.revokeShare(share.id);
      message.success('已撤销');
      const res = await deviceApi.listOutgoingShares();
      setShares((res?.list || []).filter((s: DeviceShare) => s.device_id === currentDevice?.id));
    } catch (e) {}
  };

  const columns = [
    {
      title: '设备信息',
      dataIndex: 'name',
      key: 'name',
      width: 240,
      render: (name: string, record: Device) => (
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              record.online_status ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
            }`}
          >
            <VideoCameraOutlined />
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{name}</div>
            <div className="text-xs text-gray-500 mt-0.5 truncate">SN: {record.device_sn}</div>
            <div className="text-xs text-gray-500 truncate">{record.model || '-'}</div>
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      key: 'online_status',
      width: 120,
      render: (_: any, record: Device) => (
        <Space direction="vertical" size={4}>
          <Tag
            icon={record.online_status ? <CheckCircleOutlined /> : <DisconnectOutlined />}
            color={record.online_status ? 'success' : 'default'}
          >
            {record.online_status ? '在线' : '离线'}
          </Tag>
          <span className="text-xs text-gray-500">
            {record.last_online_at ? formatTime(record.last_online_at, 'MM-DD HH:mm') : '未连接'}
          </span>
        </Space>
      ),
    },
    {
      title: '分组',
      dataIndex: 'group_name',
      key: 'group_name',
      width: 100,
      render: (v: string) => <Tag color="blue">{v || '未分组'}</Tag>,
    },
    {
      title: '规格',
      key: 'spec',
      width: 180,
      render: (_: any, record: Device) => (
        <div className="text-xs text-gray-600 space-y-1">
          <div><Tag color="purple">{record.video_codec}</Tag> <Tag color="cyan">{record.audio_codec}</Tag></div>
          <div className="text-gray-500">分辨率: {record.resolution || '自动'}</div>
          <div className="flex gap-1 flex-wrap">
            {record.support_ptz ? <Tag color="orange">云台</Tag> : null}
            {record.support_audio ? <Tag color="green">音频</Tag> : null}
            <Tag color={record.protocol === 'ONVIF' ? 'blue' : 'geekblue'}>{record.protocol}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: '我的权限',
      dataIndex: 'my_permission',
      key: 'my_permission',
      width: 100,
      render: (v: string) => (
        <Tag color={v === 'owner' ? 'purple' : v === 'config' ? 'blue' : v === 'talk' ? 'orange' : 'green'}>
          {getPermissionText(v)}
        </Tag>
      ),
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 120,
      render: (v: string) => <span className="font-mono text-xs">{v || '-'}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: Device) => (
        <Space size={4}>
          <Tooltip title="预览">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/live?device=${record.id}`)} />
          </Tooltip>
          {record.my_permission === 'config' || record.my_permission === 'owner' ? (
            <>
              <Tooltip title="编辑">
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openDeviceModal(record)} />
              </Tooltip>
              <Tooltip title="分享">
                <Button type="link" size="small" icon={<ShareAltOutlined />} onClick={() => openShareModal(record)} />
              </Tooltip>
              <Popconfirm title="确认删除该设备？" onConfirm={() => deleteDevice(record)} okText="删除" cancelText="取消" okButtonProps={{ danger: true }}>
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        className="!rounded-xl"
        title={
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-base"><VideoCameraOutlined /> 设备列表</span>
            <Space size="small" wrap>
              <Select
                style={{ width: 140 }}
                placeholder="选择分组"
                allowClear
                value={filterGroup}
                onChange={(v) => { setFilterGroup(v); setPage(1); }}
              >
                {groups.map((g) => (
                  <Option key={g.id ?? 'null'} value={g.id ?? null}>
                    {g.name} ({g.device_count})
                  </Option>
                ))}
              </Select>
              <Select
                style={{ width: 120 }}
                placeholder="设备状态"
                allowClear
                onChange={(v) => { setFilterStatus(v); setPage(1); }}
              >
                <Option value={1}>启用中</Option>
                <Option value={0}>已停用</Option>
              </Select>
            </Space>
          </div>
        }
        extra={
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="搜索设备名称/SN/型号"
              style={{ width: 220 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={() => setPage(1)}
            />
            <Dropdown
              menu={{
                items: groups.filter(g => g.id).map((g) => ({
                  key: g.id!,
                  label: <span>{g.name}</span>,
                  onClick: () => openGroupModal(g)
                })),
                onClick: (info) => {
                  if (info.key === 'new') openGroupModal();
                  if (info.key === 'manage') navigate('/settings');
                }
              }}
            >
              <Button icon={<FolderOpenOutlined />}>
                分组管理
              </Button>
            </Dropdown>
            <Button icon={<SyncOutlined />} onClick={loadDevices}>刷新</Button>
            {appStore.isOwner && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openDeviceModal()}>
                添加设备
              </Button>
            )}
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={devices}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (t) => `共 ${t} 台设备`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); }
          }}
        />
      </Card>

      <Modal
        title={editingDevice ? '编辑设备' : '添加IPC设备'}
        open={deviceModal}
        onOk={submitDevice}
        onCancel={() => setDeviceModal(false)}
        width={720}
        okText="保存"
        cancelText="取消"
      >
        <Form form={deviceForm} layout="vertical">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item name="name" label="设备名称" rules={[{ required: true, message: '请输入名称' }]}>
              <Input placeholder="如：客厅摄像头" />
            </Form.Item>
            <Form.Item name="model" label="设备型号">
              <Input placeholder="如：HK-2CD1001" />
            </Form.Item>
            <Form.Item name="protocol" label="接入协议">
              <Select>
                <Option value="ONVIF">ONVIF</Option>
                <Option value="RTSP">RTSP</Option>
                <Option value="GB28181">GB28181</Option>
                <Option value="CUSTOM">私有协议</Option>
              </Select>
            </Form.Item>
            <Form.Item name="groupId" label="分组">
              <Select allowClear placeholder="选择分组">
                {groups.filter(g => g.id).map((g) => (
                  <Option key={g.id!} value={g.id}>{g.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="streamUrl" label="主码流地址">
              <Input placeholder="如：rtsp://192.168.1.100:554/stream1" />
            </Form.Item>
            <Form.Item name="rtspUrl" label="RTSP地址">
              <Input placeholder="RTSP拉流地址" />
            </Form.Item>
            <Form.Item name="videoCodec" label="视频编码">
              <Select>
                <Option value="H.264">H.264</Option>
                <Option value="H.265">H.265</Option>
                <Option value="H.265+">H.265+</Option>
              </Select>
            </Form.Item>
            <Form.Item name="audioCodec" label="音频编码">
              <Select>
                <Option value="G.711A">G.711A</Option>
                <Option value="G.711U">G.711U</Option>
                <Option value="AAC">AAC</Option>
                <Option value="NONE">无音频</Option>
              </Select>
            </Form.Item>
            <Form.Item name="resolution" label="分辨率">
              <Select allowClear>
                <Option value="1920x1080">1080P (1920x1080)</Option>
                <Option value="1280x720">720P (1280x720)</Option>
                <Option value="2560x1440">2K (2560x1440)</Option>
                <Option value="3840x2160">4K (3840x2160)</Option>
                <Option value="640x480">VGA (640x480)</Option>
              </Select>
            </Form.Item>
            <Form.Item name="firmwareVersion" label="固件版本">
              <Input placeholder="如：V5.5.800" />
            </Form.Item>
            <Form.Item name="ipAddress" label="设备IP">
              <Input placeholder="如：192.168.1.100" />
            </Form.Item>
            <Form.Item name="macAddress" label="MAC地址">
              <Input placeholder="如：AA:BB:CC:DD:EE:FF" />
            </Form.Item>
            <Form.Item name="imei" label="设备IMEI" tooltip="用于设备绑定与身份校验（15位）">
              <Input maxLength={15} placeholder="15位IMEI码" />
            </Form.Item>
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-x-4">
              <Form.Item name="supportPTZ" label="云台控制" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="supportAudio" label="支持双向语音" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="status" label="启用设备" valuePropName="checked">
                <Switch />
              </Form.Item>
            </div>
          </div>
        </Form>
      </Modal>

      <Modal
        title={editingGroup?.id ? '编辑分组' : '创建设备分组'}
        open={groupModal}
        onOk={submitGroup}
        onCancel={() => setGroupModal(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={groupForm} layout="vertical">
          <Form.Item name="name" label="分组名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：一楼区域" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="分组说明（可选）" />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序" initialValue={0}>
            <Select>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <Option key={n} value={n}>第 {n + 1} 位</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
        <Divider />
        <div>
          <div className="text-sm font-medium mb-2">已有分组（点击编辑/删除）</div>
          {groups.filter(g => g.id).length === 0 ? (
            <Empty description="暂无自定义分组" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {groups.filter(g => g.id).map((g) => (
                <div key={g.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>{g.name} ({g.device_count}台)</span>
                  <Space>
                    <Button size="small" onClick={() => openGroupModal(g)} icon={<EditOutlined />} />
                    <Popconfirm
                      title="删除分组，分组下的设备会移至未分组"
                      onConfirm={() => deleteGroup(g)}
                      okText="删除"
                      okButtonProps={{ danger: true }}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        title={`分享设备 - ${currentDevice?.name}`}
        open={shareModal}
        onOk={submitShare}
        onCancel={() => setShareModal(false)}
        okText={shareTab === 'share' ? '确认分享' : '完成'}
        cancelText="关闭"
        footer={shareTab === 'list' ? [
          <Button key="close" onClick={() => setShareModal(false)}>关闭</Button>
        ] : undefined}
        tabList={[
          { key: 'share', tab: '新增分享' },
          { key: 'list', tab: `已分享 (${shares.length})` },
        ]}
        activeTabKey={shareTab}
        onTabChange={(k) => setShareTab(k as any)}
      >
        {shareTab === 'share' ? (
          <Form form={shareForm} layout="vertical">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Form.Item
                name="toPhone"
                label="目标用户"
                tooltip="输入对方的用户名或手机号"
                className="sm:col-span-2"
              >
                <Input placeholder="用户名或手机号（留空可仅生成临时链接）" />
              </Form.Item>
              <Form.Item
                name="permissionLevel"
                label="权限等级"
                rules={[{ required: true, message: '请选择权限' }]}
              >
                <Select>
                  <Option value="view">只看 - 仅可预览画面</Option>
                  <Option value="talk">可对讲 - 预览 + 双向语音</Option>
                  <Option value="config">可配置 - 全部权限（含云台、设置）</Option>
                </Select>
              </Form.Item>
              <Form.Item name="expireHours" label="有效期（天）">
                <Select allowClear placeholder="永久有效">
                  <Option value={1}>1 天</Option>
                  <Option value={7}>7 天</Option>
                  <Option value={30}>30 天</Option>
                  <Option value={90}>90 天</Option>
                </Select>
              </Form.Item>
              <Form.Item name="temporary" label="生成临时访问链接" valuePropName="checked" className="sm:col-span-2">
                <Switch />
              </Form.Item>
              <div className="sm:col-span-2 text-gray-500 text-sm bg-blue-50 p-3 rounded">
                💡 <strong>权限说明：</strong>
                <ul className="list-disc ml-5 mt-1 space-y-0.5">
                  <li><strong>只看</strong>：只能查看实时视频，无法操作设备</li>
                  <li><strong>可对讲</strong>：查看视频 + 语音对讲</li>
                  <li><strong>可配置</strong>：云台控制、设备参数修改等</li>
                </ul>
              </div>
            </div>
          </Form>
        ) : (
          shares.length === 0 ? (
            <Empty description="暂无分享记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {shares.map((s) => (
                <div key={s.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{s.to_nickname || s.to_username || s.share_to_phone || '临时访客'}</span>
                        <Tag color={s.permission_level === 'config' ? 'blue' : s.permission_level === 'talk' ? 'orange' : 'green'}>
                          {getPermissionText(s.permission_level)}
                        </Tag>
                        {s.temporary_token && <Tag color="geekblue">临时链接</Tag>}
                        {!s.status ? <Tag color="default">已撤销</Tag> : null}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 space-x-3">
                        <span>分享于 {formatTime(s.created_at, 'MM-DD HH:mm')}</span>
                        {s.expire_at && <span>到期 {formatTime(s.expire_at, 'MM-DD HH:mm')}</span>}
                      </div>
                      {s.shareLink && (
                        <div className="mt-2">
                          <Input
                            size="small"
                            readOnly
                            value={window.location.origin + '/temp-view' + s.shareLink.replace('/api/stream/temporary', '')}
                            addonAfter={<Button size="small" onClick={() => copyToClipboard(window.location.origin + '/temp-view' + s.shareLink.replace('/api/stream/temporary', ''))}>复制</Button>}
                          />
                        </div>
                      )}
                    </div>
                    {s.status ? (
                      <Popconfirm title="确认撤销此分享？" onConfirm={() => revokeShare(s)} okText="撤销" okButtonProps={{ danger: true }}>
                        <Button size="small" danger>撤销</Button>
                      </Popconfirm>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </Modal>
    </div>
  );
});

export default DeviceList;
