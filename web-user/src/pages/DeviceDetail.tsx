import { useState, useEffect } from 'react';
import { Button, Tabs, Tag, Switch, Progress, Card, Statistic, Row, Col, Space, message, Alert, Modal } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Camera as CameraIcon,
  Mic,
  Lock,
  Play,
  Camera,
  Video,
  MessageSquare,
  Move,
  Settings,
  Wifi,
  WifiOff,
  HardDrive,
  Cpu,
  Globe,
  Activity,
  Shield,
  Info,
  EyeOff,
} from 'lucide-react';
import { useDeviceStore } from '@/stores/useDeviceStore';
import type { Device } from '@/types';

const { TabPane } = Tabs;

const mockDevice: Device = {
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
};

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedDevice, fetchDeviceDetail, updateDevice, loading } = useDeviceStore();
  const [device, setDevice] = useState<Device>(mockDevice);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDeviceDetail(id).then((data) => {
        if (data) {
          setDevice(data);
        }
      });
    }
  }, [id, fetchDeviceDetail]);

  const handleCameraToggle = (checked: boolean) => {
    const newDevice = { ...device, privacy: { ...device.privacy, cameraEnabled: checked } };
    setDevice(newDevice);
    updateDevice(device.id, { privacy: newDevice.privacy });
    message.success(checked ? '摄像头已开启' : '摄像头已关闭');
  };

  const handleAudioToggle = (checked: boolean) => {
    const newDevice = { ...device, privacy: { ...device.privacy, audioEnabled: checked } };
    setDevice(newDevice);
    updateDevice(device.id, { privacy: newDevice.privacy });
    message.success(checked ? '音频已开启' : '音频已关闭');
  };

  const handlePhysicalLockToggle = (checked: boolean) => {
    const newDevice = { ...device, privacy: { ...device.privacy, physicalLock: checked } };
    setDevice(newDevice);
    updateDevice(device.id, { privacy: newDevice.privacy });
    message.success(checked ? '物理锁定已开启' : '物理锁定已关闭');
  };

  const handleControlAction = (action: string) => {
    const actionMap: Record<string, string> = {
      screenshot: '截图成功',
      record: '开始录像',
      talk: '对讲功能已开启',
      ptz: '云台控制已激活',
      settings: '设置面板已打开',
    };
    message.success(actionMap[action] || '操作成功');
  };

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

  const storagePercent = device.storage.sdCard
    ? Math.round((device.storage.sdUsed / device.storage.sdTotal) * 100)
    : 0;

  const controlButtons = [
    { key: 'screenshot', icon: <Camera size={20} />, label: '截图' },
    { key: 'record', icon: <Video size={20} />, label: '录像' },
    { key: 'talk', icon: <MessageSquare size={20} />, label: '对讲' },
    { key: 'ptz', icon: <Move size={20} />, label: '云台' },
    { key: 'settings', icon: <Settings size={20} />, label: '设置' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button type="text" icon={<ArrowLeft size={20} />} onClick={() => navigate('/')}>
          返回
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">{device.name}</h1>
            <Tag color={getStatusColor(device.status)} className="flex items-center gap-1">
              {device.status === 'online' ? <Wifi size={12} /> : <WifiOff size={12} />}
              {getStatusText(device.status)}
            </Tag>
          </div>
          <p className="text-gray-500 text-sm mt-1">{device.location} · {device.model}</p>
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
        {device.privacy.cameraEnabled ? (
          <>
            <img
              src={`https://picsum.photos/seed/${device.id}-live/1280/720`}
              alt={device.name}
              className="w-full h-full object-cover"
            />
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <Button
                  type="primary"
                  shape="circle"
                  size="large"
                  icon={<Play size={24} className="ml-1" />}
                  onClick={() => setIsPlaying(true)}
                  className="w-16 h-16 bg-primary-500 hover:bg-primary-600"
                />
              </div>
            )}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                <span>LIVE</span>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-white">
              <EyeOff size={64} className="mx-auto mb-4 opacity-60" />
              <p className="text-lg">隐私模式已开启</p>
              <p className="text-sm opacity-60 mt-1">摄像头处于关闭状态</p>
            </div>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="flex items-center justify-center gap-8">
            {controlButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => handleControlAction(btn.key)}
                className="flex flex-col items-center gap-1 text-white hover:text-primary-300 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                  {btn.icon}
                </div>
                <span className="text-xs">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <Tabs defaultActiveKey="info">
          <TabPane tab="设备信息" key="info">
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} md={8}>
                <Card size="small" className="rounded-xl border border-gray-100">
                  <Statistic
                    title="设备型号"
                    value={device.model}
                    prefix={<Cpu size={18} className="text-primary-500" />}
                    valueStyle={{ fontSize: '16px' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small" className="rounded-xl border border-gray-100">
                  <Statistic
                    title="固件版本"
                    value={device.firmwareVersion}
                    prefix={<Activity size={18} className="text-success-500" />}
                    valueStyle={{ fontSize: '16px' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small" className="rounded-xl border border-gray-100">
                  <Statistic
                    title="信号强度"
                    value={device.signalStrength}
                    suffix="%"
                    prefix={<Wifi size={18} className="text-success-500" />}
                    valueStyle={{ fontSize: '16px' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small" className="rounded-xl border border-gray-100">
                  <Statistic
                    title="IP地址"
                    value={device.ipAddress}
                    prefix={<Globe size={18} className="text-primary-500" />}
                    valueStyle={{ fontSize: '16px' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small" className="rounded-xl border border-gray-100">
                  <Statistic
                    title="MAC地址"
                    value={device.macAddress}
                    prefix={<HardDrive size={18} className="text-gray-500" />}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small" className="rounded-xl border border-gray-100">
                  <Statistic
                    title="最后在线"
                    value={device.lastOnline}
                    prefix={<Info size={18} className="text-warning-500" />}
                    valueStyle={{ fontSize: '12px' }}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="隐私控制" key="privacy">
            <div className="space-y-6 max-w-2xl">
              <Alert
                message="隐私安全提示"
                description="物理级锁定会禁止所有设备访问，请谨慎操作。解锁需要验证身份。"
                type="warning"
                showIcon
                icon={<Shield size={16} />}
              />

              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                      <CameraIcon size={24} className="text-primary-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">摄像头</h3>
                      <p className="text-sm text-gray-500">开启后可查看实时画面和录像</p>
                    </div>
                  </div>
                  <Switch checked={device.privacy.cameraEnabled} onChange={handleCameraToggle} />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center">
                      <Mic size={24} className="text-success-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">音频</h3>
                      <p className="text-sm text-gray-500">开启后可收听和对讲</p>
                    </div>
                  </div>
                  <Switch checked={device.privacy.audioEnabled} onChange={handleAudioToggle} />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-danger-100 flex items-center justify-center">
                      <Lock size={24} className="text-danger-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">物理级锁定</h3>
                      <p className="text-sm text-gray-500">完全禁用设备，解锁需身份验证</p>
                    </div>
                  </div>
                  <Switch
                    checked={device.privacy.physicalLock}
                    onChange={handlePhysicalLockToggle}
                    checkedChildren={<Lock size={12} />}
                    unCheckedChildren={<Lock size={12} />}
                  />
                </div>
              </div>
            </div>
          </TabPane>

          <TabPane tab="存储管理" key="storage">
            <div className="space-y-6 max-w-2xl">
              {device.storage.sdCard ? (
                <>
                  <div className="bg-gray-50 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <HardDrive size={24} className="text-primary-500" />
                        <span className="font-medium text-gray-800">SD卡存储</span>
                      </div>
                      <Tag color="success">正常</Tag>
                    </div>
                    <Progress
                      percent={storagePercent}
                      strokeColor="#165DFF"
                      trailColor="#E5E7EB"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>已用 {device.storage.sdUsed} GB</span>
                      <span>共 {device.storage.sdTotal} GB</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button onClick={() => message.success('正在检测SD卡健康状态...')}>
                      健康检测
                    </Button>
                    <Button
                      danger
                      onClick={() =>
                        Modal.confirm({
                          title: '确认格式化？',
                          content: '格式化将删除所有录像数据，此操作不可恢复。',
                          onOk: () => message.success('格式化已开始'),
                        })
                      }
                    >
                      格式化
                    </Button>
                  </div>
                </>
              ) : (
                <Alert
                  message="未检测到SD卡"
                  description="请插入SD卡以使用本地存储功能"
                  type="warning"
                  showIcon
                />
              )}

              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-medium text-gray-800 mb-3">录像存储设置</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">录像画质</span>
                    <Tag color="blue">1080P</Tag>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">录像模式</span>
                    <Tag color="green">移动侦测</Tag>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">预录时间</span>
                    <Tag color="purple">5秒</Tag>
                  </div>
                </div>
              </div>
            </div>
          </TabPane>

          <TabPane tab="录像回放" key="playback">
            <div className="text-center py-16">
              <Video size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">选择日期查看录像回放</p>
              <div className="mt-6 flex justify-center gap-4">
                <Button type="primary">选择日期</Button>
                <Button>今日录像</Button>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}
