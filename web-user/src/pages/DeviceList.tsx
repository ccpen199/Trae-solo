import { useState, useEffect } from 'react';
import { Card, Button, Tag, Space, Switch, Dropdown, MenuProps, Empty, Spin, Modal, Form, Input, Select, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Settings,
  EyeOff,
  Shield,
  Plus,
  MoreHorizontal,
  Wifi,
  WifiOff,
  MapPin,
  Camera,
} from 'lucide-react';
import { useDeviceStore } from '@/stores/useDeviceStore';
import type { Device, DeviceGroup } from '@/types';

const mockGroups: DeviceGroup[] = [
  { id: 'all', name: '全部设备', deviceIds: [] },
  { id: 'public', name: '公共区域', deviceIds: [] },
  { id: 'private', name: '私人区域', deviceIds: [] },
  { id: 'outdoor', name: '户外', deviceIds: [] },
  { id: 'bedroom', name: '卧室', deviceIds: [] },
  { id: 'livingroom', name: '客厅', deviceIds: [] },
];

const mockDevices: Device[] = [
  {
    id: '1',
    name: '客厅摄像头',
    type: 'IPC',
    model: 'IPC-2000 Pro',
    firmwareVersion: 'v2.3.1',
    status: 'online',
    groupId: 'livingroom',
    ipAddress: '192.168.1.101',
    macAddress: '00:11:22:33:44:55',
    storage: { total: 128, used: 45.2, sdCard: true, sdTotal: 128, sdUsed: 45.2 },
    privacy: { cameraEnabled: true, audioEnabled: true, physicalLock: false },
    lastOnline: '2024-01-15 14:30:00',
    location: '客厅',
    signalStrength: 85,
  },
  {
    id: '2',
    name: '门口摄像头',
    type: 'doorbell',
    model: 'DB-1000',
    firmwareVersion: 'v1.8.5',
    status: 'online',
    groupId: 'outdoor',
    ipAddress: '192.168.1.102',
    macAddress: '00:11:22:33:44:56',
    storage: { total: 64, used: 12.8, sdCard: true, sdTotal: 64, sdUsed: 12.8 },
    privacy: { cameraEnabled: true, audioEnabled: false, physicalLock: false },
    lastOnline: '2024-01-15 14:28:00',
    location: '门口',
    signalStrength: 92,
  },
  {
    id: '3',
    name: '卧室摄像头',
    type: 'IPC',
    model: 'IPC-2000 Pro',
    firmwareVersion: 'v2.3.1',
    status: 'offline',
    groupId: 'bedroom',
    ipAddress: '192.168.1.103',
    macAddress: '00:11:22:33:44:57',
    storage: { total: 128, used: 78.5, sdCard: true, sdTotal: 128, sdUsed: 78.5 },
    privacy: { cameraEnabled: false, audioEnabled: false, physicalLock: true },
    lastOnline: '2024-01-14 22:15:00',
    location: '主卧室',
    signalStrength: 0,
  },
  {
    id: '4',
    name: '厨房摄像头',
    type: 'IPC',
    model: 'IPC-1500',
    firmwareVersion: 'v2.1.0',
    status: 'online',
    groupId: 'public',
    ipAddress: '192.168.1.104',
    macAddress: '00:11:22:33:44:58',
    storage: { total: 64, used: 30.1, sdCard: true, sdTotal: 64, sdUsed: 30.1 },
    privacy: { cameraEnabled: true, audioEnabled: true, physicalLock: false },
    lastOnline: '2024-01-15 14:25:00',
    location: '厨房',
    signalStrength: 78,
  },
  {
    id: '5',
    name: '车库摄像头',
    type: 'IPC',
    model: 'IPC-3000 Outdoor',
    firmwareVersion: 'v2.2.3',
    status: 'online',
    groupId: 'outdoor',
    ipAddress: '192.168.1.105',
    macAddress: '00:11:22:33:44:59',
    storage: { total: 256, used: 156.7, sdCard: true, sdTotal: 256, sdUsed: 156.7 },
    privacy: { cameraEnabled: true, audioEnabled: false, physicalLock: false },
    lastOnline: '2024-01-15 14:20:00',
    location: '车库',
    signalStrength: 65,
  },
  {
    id: '6',
    name: '书房摄像头',
    type: 'IPC',
    model: 'IPC-2000 Pro',
    firmwareVersion: 'v2.3.0',
    status: 'upgrading',
    groupId: 'private',
    ipAddress: '192.168.1.106',
    macAddress: '00:11:22:33:44:60',
    storage: { total: 128, used: 55.3, sdCard: true, sdTotal: 128, sdUsed: 55.3 },
    privacy: { cameraEnabled: false, audioEnabled: false, physicalLock: false },
    lastOnline: '2024-01-15 13:45:00',
    location: '书房',
    signalStrength: 88,
  },
];

export default function DeviceList() {
  const navigate = useNavigate();
  const { devices, loading, fetchDevices, updateDevice } = useDeviceStore();
  const [activeGroup, setActiveGroup] = useState('all');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const displayDevices = devices.length > 0 ? devices : mockDevices;

  const filteredDevices = activeGroup === 'all'
    ? displayDevices
    : displayDevices.filter(d => d.groupId === activeGroup || d.location.includes(mockGroups.find(g => g.id === activeGroup)?.name || ''));

  const handlePrivacyToggle = (device: Device, checked: boolean) => {
    updateDevice(device.id, {
      privacy: { ...device.privacy, cameraEnabled: checked },
    });
    message.success(checked ? '已关闭隐私模式' : '已开启隐私模式');
  };

  const handleAddDevice = (values: any) => {
    message.success('设备添加成功');
    setAddModalVisible(false);
    form.resetFields();
  };

  const getDeviceMenuItems = (device: Device): MenuProps['items'] => [
    {
      key: 'view',
      icon: <Eye size={14} />,
      label: '查看详情',
      onClick: () => navigate(`/device/${device.id}`),
    },
    {
      key: 'settings',
      icon: <Settings size={14} />,
      label: '设备设置',
    },
    {
      key: 'privacy',
      icon: device.privacy.cameraEnabled ? <EyeOff size={14} /> : <Eye size={14} />,
      label: device.privacy.cameraEnabled ? '开启隐私模式' : '关闭隐私模式',
      onClick: () => handlePrivacyToggle(device, !device.privacy.cameraEnabled),
    },
    { type: 'divider' as const },
    {
      key: 'delete',
      danger: true,
      label: '删除设备',
    },
  ];

  const getStatusColor = (status: Device['status']) => {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'default';
      case 'upgrading': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status: Device['status']) => {
    switch (status) {
      case 'online': return '在线';
      case 'offline': return '离线';
      case 'upgrading': return '升级中';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">设备列表</h1>
          <p className="text-gray-500 mt-1">共 {displayDevices.length} 台设备，{displayDevices.filter(d => d.status === 'online').length} 台在线</p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {mockGroups.map((group) => (
          <Button
            key={group.id}
            type={activeGroup === group.id ? 'primary' : 'default'}
            onClick={() => setActiveGroup(group.id)}
            className="flex-shrink-0 h-9"
          >
            {group.name}
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
        <Space size={12}>
          <Button type="primary" icon={<Shield size={16} />} onClick={() => message.success('一键布防已开启')}>
            一键布防
          </Button>
          <Button icon={<EyeOff size={16} />} onClick={() => message.success('全部隐私模式已开启')}>
            全部隐私模式
          </Button>
        </Space>
        <Button type="primary" icon={<Plus size={16} />} onClick={() => setAddModalVisible(true)}>
          添加设备
        </Button>
      </div>

      <Spin spinning={loading}>
        {filteredDevices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDevices.map((device) => (
              <Card
                key={device.id}
                hoverable
                className="rounded-xl overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow"
                onClick={() => navigate(`/device/${device.id}`)}
                cover={
                  <div className="relative h-44 bg-gray-200">
                    <img
                      src={`https://picsum.photos/seed/${device.id}/400/250`}
                      alt={device.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Tag color={getStatusColor(device.status)} className="flex items-center gap-1">
                        {device.status === 'online' ? <Wifi size={12} /> : <WifiOff size={12} />}
                        {getStatusText(device.status)}
                      </Tag>
                    </div>
                    <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        size="small"
                        checked={device.privacy.cameraEnabled}
                        onChange={(checked) => handlePrivacyToggle(device, checked)}
                        checkedChildren={<Eye size={10} />}
                        unCheckedChildren={<EyeOff size={10} />}
                      />
                    </div>
                    {!device.privacy.cameraEnabled && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <EyeOff size={32} className="mx-auto mb-2" />
                          <p className="text-sm">隐私模式</p>
                        </div>
                      </div>
                    )}
                  </div>
                }
                actions={[
                  <Button type="text" key="view" icon={<Eye size={16} />} onClick={(e) => { e.stopPropagation(); navigate(`/device/${device.id}`); }}>
                    查看
                  </Button>,
                  <Button type="text" key="settings" icon={<Settings size={16} />} onClick={(e) => e.stopPropagation()}>
                    设置
                  </Button>,
                  <Dropdown key="more" menu={{ items: getDeviceMenuItems(device) }} trigger={['click']}>
                    <Button type="text" icon={<MoreHorizontal size={16} />} onClick={(e) => e.stopPropagation()} />
                  </Dropdown>,
                ]}
              >
                <Card.Meta
                  title={<span className="font-medium text-gray-800">{device.name}</span>}
                  description={
                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                      <MapPin size={12} />
                      <span>{device.location}</span>
                      <span className="ml-auto">
                        <Camera size={12} className="inline mr-1" />
                        {device.type}
                      </span>
                    </div>
                  }
                />
              </Card>
            ))}
          </div>
        ) : (
          <Empty description="暂无设备" className="py-16" />
        )}
      </Spin>

      <Modal
        title="添加设备"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddDevice}>
          <Form.Item name="name" label="设备名称" rules={[{ required: true, message: '请输入设备名称' }]}>
            <Input placeholder="请输入设备名称" />
          </Form.Item>
          <Form.Item name="type" label="设备类型" rules={[{ required: true, message: '请选择设备类型' }]}>
            <Select placeholder="请选择设备类型">
              <Select.Option value="IPC">摄像头</Select.Option>
              <Select.Option value="doorbell">门铃</Select.Option>
              <Select.Option value="NVR">NVR录像机</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="groupId" label="设备分组">
            <Select placeholder="请选择分组">
              {mockGroups.filter(g => g.id !== 'all').map(group => (
                <Select.Option key={group.id} value={group.id}>{group.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="location" label="位置">
            <Input placeholder="请输入设备位置" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              添加设备
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
