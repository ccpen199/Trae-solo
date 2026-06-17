import { useState, useEffect } from 'react';
import { Card, Button, Tag, Space, Switch, Dropdown, MenuProps, Empty, Spin, Modal, Form, Input, Select, message, Steps, Progress, Alert, Result } from 'antd';
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
  QrCode,
  Smartphone,
  CheckCircle2,
  Loader2,
  Lock,
  Unlock,
  Signal,
  Activity,
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

const mockDetectedDevice = {
  model: 'IPC-2000 Pro',
  macAddress: 'AA:BB:CC:DD:EE:FF',
  serialNumber: 'YST2024011500123',
  type: 'IPC' as const,
};

const mockWiFiName = 'HomeWiFi_2.4G';

export default function DeviceList() {
  const navigate = useNavigate();
  const { devices, loading, fetchDevices, updateDevice, addDevice } = useDeviceStore();
  const [activeGroup, setActiveGroup] = useState('all');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [wifiForm] = Form.useForm();

  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [detectedDevice, setDetectedDevice] = useState<typeof mockDetectedDevice | null>(null);
  const [serialNumber, setSerialNumber] = useState('');
  const [wifiPasswordVisible, setWifiPasswordVisible] = useState(false);
  const [bindingProgress, setBindingProgress] = useState(0);
  const [bindingStatus, setBindingStatus] = useState<'connecting' | 'online' | 'bound' | 'success' | 'failed'>('connecting');
  const [boundDeviceId, setBoundDeviceId] = useState<string>('');

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

  const startScanning = () => {
    setScanning(true);
    setScanSuccess(false);
    setDetectedDevice(null);
    setTimeout(() => {
      setScanning(false);
      setScanSuccess(true);
      setDetectedDevice(mockDetectedDevice);
      setSerialNumber(mockDetectedDevice.serialNumber);
      message.success('检测到设备');
    }, 2000);
  };

  const handleManualSerial = (value: string) => {
    setSerialNumber(value);
    if (value.length >= 10) {
      setScanSuccess(true);
      setDetectedDevice(mockDetectedDevice);
    }
  };

  const handleStep1Next = () => {
    if (!scanSuccess || !detectedDevice) {
      message.warning('请先扫描二维码或输入序列号');
      return;
    }
    setCurrentStep(1);
  };

  const handleStep2Next = async () => {
    try {
      await wifiForm.validateFields();
      setCurrentStep(2);
      startBindingProcess();
    } catch {
      message.warning('请输入Wi-Fi密码');
    }
  };

  const startBindingProcess = () => {
    setBindingProgress(0);
    setBindingStatus('connecting');

    const progressSteps = [
      { progress: 33, status: 'connecting' as const, delay: 0 },
      { progress: 66, status: 'online' as const, delay: 1500 },
      { progress: 100, status: 'bound' as const, delay: 3000 },
      { progress: 100, status: 'success' as const, delay: 4500 },
    ];

    progressSteps.forEach(({ progress, status, delay }) => {
      setTimeout(() => {
        setBindingProgress(progress);
        setBindingStatus(status);
      }, delay);
    });

    setTimeout(() => {
      const newId = Date.now().toString();
      setBoundDeviceId(newId);
      addDevice({
        id: newId,
        name: '新设备',
        type: detectedDevice?.type || 'IPC',
        model: detectedDevice?.model || 'IPC-2000 Pro',
        firmwareVersion: 'v2.3.1',
        status: 'online',
        groupId: 'public',
        ipAddress: '192.168.1.200',
        macAddress: detectedDevice?.macAddress || 'AA:BB:CC:DD:EE:FF',
        storage: { total: 128, used: 0, sdCard: false, sdTotal: 128, sdUsed: 0 },
        privacy: { cameraEnabled: true, audioEnabled: true, physicalLock: false },
        lastOnline: new Date().toLocaleString(),
        location: '未设置',
        signalStrength: 85,
      });
    }, 4500);
  };

  const resetAddModal = () => {
    setCurrentStep(0);
    setScanning(false);
    setScanSuccess(false);
    setDetectedDevice(null);
    setSerialNumber('');
    setWifiPasswordVisible(false);
    setBindingProgress(0);
    setBindingStatus('connecting');
    setBoundDeviceId('');
    form.resetFields();
    wifiForm.resetFields();
  };

  const handleCloseAddModal = () => {
    setAddModalVisible(false);
    setTimeout(resetAddModal, 300);
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
      onClick: () => navigate(`/device/${device.id}?tab=settings`),
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
                  <Button type="text" key="settings" icon={<Settings size={16} />} onClick={(e) => { e.stopPropagation(); navigate(`/device/${device.id}?tab=settings`); }}>
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
        title={
          <div className="flex items-center gap-2">
            <QrCode size={20} className="text-primary-500" />
            <span>扫码绑定设备</span>
          </div>
        }
        open={addModalVisible}
        onCancel={handleCloseAddModal}
        footer={null}
        width={560}
        destroyOnClose
      >
        <div className="mb-6">
          <Steps
            current={currentStep}
            items={[
              { title: '扫码绑定' },
              { title: 'Wi-Fi配置' },
              { title: '绑定结果' },
            ]}
          />
        </div>

        {currentStep === 0 && (
          <div className="space-y-5">
            <div className="relative mx-auto w-64 h-64 bg-gray-900 rounded-2xl flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
              <div className="relative z-10 text-center">
                <div className="w-36 h-36 mx-auto bg-white p-3 rounded-xl shadow-2xl">
                  <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-700 to-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                    <div className="grid grid-cols-7 gap-0.5 w-full h-full p-2">
                      {Array.from({ length: 49 }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-sm ${Math.random() > 0.45 ? 'bg-white' : 'bg-transparent'}`}
                        />
                      ))}
                    </div>
                    <div className="absolute top-1 left-1 w-5 h-5 border-2 border-white rounded-sm">
                      <div className="absolute inset-1 bg-white rounded-sm" />
                    </div>
                    <div className="absolute top-1 right-1 w-5 h-5 border-2 border-white rounded-sm">
                      <div className="absolute inset-1 bg-white rounded-sm" />
                    </div>
                    <div className="absolute bottom-1 left-1 w-5 h-5 border-2 border-white rounded-sm">
                      <div className="absolute inset-1 bg-white rounded-sm" />
                    </div>
                  </div>
                </div>
                <Smartphone size={20} className="text-white/50 mx-auto mt-3" />
              </div>
              {scanning && (
                <div className="absolute inset-0 z-20">
                  <div className="absolute left-4 right-4 h-0.5 bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.8)] animate-pulse" style={{ animation: 'scan 1.5s ease-in-out infinite' }} />
                  <style>{`
                    @keyframes scan {
                      0%, 100% { top: 10%; }
                      50% { top: 85%; }
                    }
                  `}</style>
                </div>
              )}
              {scanSuccess && (
                <div className="absolute inset-0 z-30 bg-green-500/20 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center text-white">
                    <CheckCircle2 size={48} className="mx-auto mb-2 text-green-400" />
                    <p className="font-medium">检测到设备</p>
                  </div>
                </div>
              )}
            </div>

            <p className="text-center text-gray-500 text-sm">
              请使用设备底部的云视通二维码，或输入设备序列号
            </p>

            <div className="space-y-3">
              <Input
                placeholder="请输入设备序列号"
                value={serialNumber}
                onChange={(e) => handleManualSerial(e.target.value)}
                prefix={<QrCode size={16} className="text-gray-400" />}
              />
              <Button
                block
                type={scanning ? 'default' : 'primary'}
                icon={scanning ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                onClick={startScanning}
                disabled={scanning}
              >
                {scanning ? '扫描中...' : '开始扫码识别'}
              </Button>
            </div>

            {scanSuccess && detectedDevice && (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircle2 size={16} />}
                message="已识别设备信息"
                description={
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">设备型号：</span>
                      <span className="text-gray-800 font-medium">{detectedDevice.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">MAC地址：</span>
                      <span className="text-gray-800 font-mono text-xs">{detectedDevice.macAddress}</span>
                    </div>
                  </div>
                }
              />
            )}

            <div className="flex justify-end pt-2">
              <Button type="primary" onClick={handleStep1Next}>
                下一步
              </Button>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-5">
            <Alert
              type="info"
              showIcon
              icon={<Wifi size={16} />}
              message="自动连接设备热点"
              description="请确保手机已连接到设备发出的热点，设备将自动接收Wi-Fi配置信息"
            />

            <div className="bg-gray-50 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-2">当前Wi-Fi</label>
                <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 border border-gray-200">
                  <Wifi size={20} className="text-primary-500" />
                  <div>
                    <p className="font-medium text-gray-800">{mockWiFiName}</p>
                    <p className="text-xs text-gray-500">2.4GHz频段 · 信号良好</p>
                  </div>
                  <Tag color="success" className="ml-auto">已连接</Tag>
                </div>
              </div>

              <Form form={wifiForm} layout="vertical">
                <Form.Item
                  name="wifiPassword"
                  label="Wi-Fi密码"
                  rules={[{ required: true, message: '请输入Wi-Fi密码' }]}
                >
                  <Input.Password
                    placeholder="请输入Wi-Fi密码"
                    iconRender={(visible) => visible ? <Unlock size={16} /> : <Lock size={16} />}
                    visibilityToggle={{ visible: wifiPasswordVisible, onVisibleChange: setWifiPasswordVisible }}
                  />
                </Form.Item>
              </Form>
            </div>

            <Alert
              type="warning"
              showIcon
              icon={<Shield size={16} />}
              message="安全提示"
              description="Wi-Fi密码将通过加密通道直接传输至设备，云端不保存任何明文密码"
            />

            <div className="flex justify-between pt-2">
              <Button onClick={() => setCurrentStep(0)}>上一步</Button>
              <Button type="primary" onClick={handleStep2Next}>
                开始配置
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            {bindingStatus !== 'success' ? (
              <div className="space-y-5 py-4">
                <Progress
                  percent={bindingProgress}
                  status={bindingStatus === 'failed' ? 'exception' : 'active'}
                  strokeColor={{ '0%': '#165DFF', '100%': '#00B42A' }}
                />
                <div className="space-y-3">
                  {[
                    { key: 'connecting', label: '正在连接Wi-Fi', icon: <Wifi size={16} /> },
                    { key: 'online', label: '设备上线', icon: <Signal size={16} /> },
                    { key: 'bound', label: '云端绑定', icon: <Activity size={16} /> },
                  ].map((step, idx) => {
                    const order = ['connecting', 'online', 'bound'];
                    const currentIdx = order.indexOf(bindingStatus);
                    const stepIdx = order.indexOf(step.key as any);
                    const isDone = currentIdx >= stepIdx;
                    const isActive = currentIdx === stepIdx;
                    return (
                      <div
                        key={step.key}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                          isDone ? 'bg-green-50' : isActive ? 'bg-blue-50' : 'bg-gray-50'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isDone
                              ? 'bg-green-500 text-white'
                              : isActive
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-300 text-gray-500'
                          }`}
                        >
                          {isDone ? <CheckCircle2 size={16} /> : isActive ? <Loader2 size={16} className="animate-spin" /> : step.icon}
                        </div>
                        <span
                          className={`font-medium ${
                            isDone ? 'text-green-700' : isActive ? 'text-blue-700' : 'text-gray-500'
                          }`}
                        >
                          {step.label}
                        </span>
                        {isActive && <span className="ml-auto text-xs text-blue-500">进行中...</span>}
                        {isDone && <span className="ml-auto text-xs text-green-600">完成</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Result
                status="success"
                title="设备绑定成功"
                subTitle="设备已成功添加到您的账户"
                extra={[
                  <div key="info" className="bg-gray-50 rounded-xl p-5 text-left mb-4 w-full">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">设备名称：</span>
                        <span className="text-gray-800 font-medium">新设备</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">设备ID：</span>
                        <span className="text-gray-800 font-mono text-xs">{boundDeviceId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">所在位置：</span>
                        <span className="text-gray-800">未设置</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">绑定时间：</span>
                        <span className="text-gray-800">{new Date().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>,
                  <div key="buttons" className="flex gap-3 justify-center w-full">
                    <Button type="primary" onClick={() => { handleCloseAddModal(); navigate(`/device/${boundDeviceId}?tab=settings`); }}>
                      进入设备详情
                    </Button>
                    <Button onClick={() => { resetAddModal(); }}>
                      继续添加
                    </Button>
                  </div>,
                ]}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
