import { useState, useEffect } from 'react';
import { Button, Tabs, Tag, Switch, Progress, Card, Statistic, Row, Col, Space, message, Alert, Modal, Divider, Radio, List, Badge, Tooltip } from 'antd';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  Download,
  RefreshCw,
  Signal,
  Clock,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  DownloadCloud,
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

const mockFirmwareVersions = [
  {
    version: 'v2.3.1',
    date: '2024-01-10',
    notes: [
      '修复了夜间模式下的噪点问题',
      '优化了Wi-Fi连接稳定性',
      '新增人形检测灵敏度调节',
    ],
    isCurrent: true,
  },
  {
    version: 'v2.3.0',
    date: '2023-12-20',
    notes: [
      '新增对NVR存储支持',
      '修复已知安全漏洞',
    ],
    isCurrent: false,
  },
  {
    version: 'v2.2.5',
    date: '2023-12-05',
    notes: [
      '优化了移动侦测算法',
    ],
    isCurrent: false,
  },
];

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedDevice, fetchDeviceDetail, updateDevice, loading } = useDeviceStore();
  const [device, setDevice] = useState<Device>(mockDevice);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [storageThreshold, setStorageThreshold] = useState(90);
  const [storageAlertEnabled, setStorageAlertEnabled] = useState(true);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latencyTesting, setLatencyTesting] = useState(false);
  const [latency, setLatency] = useState<number | null>(42);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'settings') {
      setActiveTab('settings');
    }
  }, [searchParams]);

  useEffect(() => {
    if (id) {
      fetchDeviceDetail(id).then((data) => {
        if (data) {
          setDevice(data);
        }
      });
    }
  }, [id, fetchDeviceDetail]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'settings') {
      searchParams.set('tab', 'settings');
      setSearchParams(searchParams);
    } else {
      searchParams.delete('tab');
      setSearchParams(searchParams);
    }
  };

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
      settings: '已跳转到设备配置',
    };
    if (action === 'settings') {
      handleTabChange('settings');
    } else {
      message.success(actionMap[action] || '操作成功');
    }
  };

  const handleCheckUpdate = () => {
    setCheckingUpdate(true);
    setTimeout(() => {
      setCheckingUpdate(false);
      setUpdateAvailable(false);
      message.success('当前已是最新版本');
    }, 2000);
  };

  const handleTestLatency = () => {
    setLatencyTesting(true);
    setLatency(null);
    setTimeout(() => {
      setLatency(Math.floor(Math.random() * 80) + 20);
      setLatencyTesting(false);
      message.success('延迟测试完成');
    }, 3000);
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

  const renderPreviewPanel = () => (
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
  );

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

      <Card className="rounded-2xl border-0 shadow-sm">
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane tab={
            <span className="flex items-center gap-1">
              <Camera size={14} />
              实时预览
            </span>
          } key="preview">
            {renderPreviewPanel()}
          </TabPane>

          <TabPane tab={
            <span className="flex items-center gap-1">
              <Info size={14} />
              设备信息
            </span>
          } key="info">
            <Row gutter={[24, 24]} className="pt-4">
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

          <TabPane tab={
            <span className="flex items-center gap-1">
              <HardDrive size={14} />
              存储管理
            </span>
          } key="storage">
            <div className="space-y-6 max-w-2xl pt-4">
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

          <TabPane tab={
            <span className="flex items-center gap-1">
              <Video size={14} />
              录像回放
            </span>
          } key="playback">
            <div className="text-center py-16">
              <Video size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">选择日期查看录像回放</p>
              <div className="mt-6 flex justify-center gap-4">
                <Button type="primary">选择日期</Button>
                <Button>今日录像</Button>
              </div>
            </div>
          </TabPane>

          <TabPane tab={
            <span className="flex items-center gap-1">
              <Settings size={14} />
              设备配置
            </span>
          } key="settings">
            <div className="space-y-8 pt-4 max-w-3xl">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <DownloadCloud size={18} className="text-primary-500" />
                  <h3 className="text-lg font-semibold text-gray-800">固件版本</h3>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">当前版本</span>
                        <Badge status="success" text="最新" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{device.firmwareVersion}</p>
                      <p className="text-sm text-gray-500 mt-1">发布日期：2024-01-10</p>
                    </div>
                    <Button
                      type="primary"
                      icon={checkingUpdate ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                      onClick={handleCheckUpdate}
                      loading={checkingUpdate}
                    >
                      {checkingUpdate ? '检查中...' : '检查更新'}
                    </Button>
                  </div>
                  <Divider style={{ margin: '8px 0' }} />
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <Download size={14} />
                      更新日志
                    </h4>
                    <List
                      size="small"
                      dataSource={mockFirmwareVersions}
                      renderItem={(item) => (
                        <List.Item className="px-0 border-0 py-3">
                          <div className="w-full">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800">{item.version}</span>
                                {item.isCurrent && <Tag color="blue">当前</Tag>}
                              </div>
                              <span className="text-xs text-gray-400">{item.date}</span>
                            </div>
                            <ul className="text-sm text-gray-500 space-y-1 mt-1">
                              {item.notes.map((note, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-gray-300 mt-1">•</span>
                                  <span>{note}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </List.Item>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={18} className="text-success-500" />
                  <h3 className="text-lg font-semibold text-gray-800">在线诊断</h3>
                </div>
                <div className="bg-gray-50 rounded-xl p-5">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <div className="bg-white rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                          <AlertTriangle size={14} />
                          最近7天掉线次数
                        </div>
                        <div className="text-2xl font-bold text-gray-800">
                          0 <span className="text-sm font-normal text-green-600 ml-1">次</span>
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div className="bg-white rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                          <Clock size={14} />
                          平均在线时长
                        </div>
                        <div className="text-2xl font-bold text-gray-800">
                          24 <span className="text-sm font-normal text-gray-500 ml-1">小时/天</span>
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div className="bg-white rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                          <Signal size={14} />
                          信号强度
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="text-2xl font-bold text-gray-800">{device.signalStrength}</div>
                          <div className="text-sm font-normal text-gray-500 mb-1">%</div>
                          <Progress
                            percent={device.signalStrength}
                            showInfo={false}
                            size="small"
                            strokeColor={device.signalStrength > 70 ? '#00B42A' : device.signalStrength > 40 ? '#FF7D00' : '#F53F3F'}
                            className="flex-1 mb-1"
                          />
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div className="bg-white rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                              <Gauge size={14} />
                              网络延迟
                            </div>
                            <div className="text-2xl font-bold text-gray-800">
                              {latencyTesting ? (
                                <RefreshCw size={20} className="animate-spin text-gray-400" />
                              ) : latency !== null ? (
                                <>
                                  {latency} <span className="text-sm font-normal text-gray-500 ml-1">ms</span>
                                </>
                              ) : (
                                <span className="text-gray-400 text-base">--</span>
                              )}
                            </div>
                          </div>
                          <Tooltip title="测试设备到云端的网络延迟">
                            <Button
                              size="small"
                              icon={<Activity size={14} />}
                              onClick={handleTestLatency}
                              loading={latencyTesting}
                            >
                              延迟测试
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={18} className="text-warning-500" />
                  <h3 className="text-lg font-semibold text-gray-800">隐私模式</h3>
                </div>
                <div className="space-y-6">
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
                          <h3 className="font-medium text-gray-800">音频采集</h3>
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
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <HardDrive size={18} className="text-primary-500" />
                  <h3 className="text-lg font-semibold text-gray-800">存储告警配置</h3>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-700 font-medium">存储空间阈值</span>
                      <span className="text-sm text-gray-500">使用率超过此值时触发告警</span>
                    </div>
                    <Radio.Group
                      value={storageThreshold}
                      onChange={(e) => setStorageThreshold(e.target.value)}
                    >
                      <Radio.Button value={80}>80%</Radio.Button>
                      <Radio.Button value={90}>90%</Radio.Button>
                      <Radio.Button value={95}>95%</Radio.Button>
                    </Radio.Group>
                    <Progress
                      percent={storageThreshold}
                      showInfo={false}
                      size="small"
                      strokeColor={storageThreshold > 90 ? '#F53F3F' : storageThreshold > 80 ? '#FF7D00' : '#165DFF'}
                      className="mt-3"
                    />
                  </div>

                  <Divider style={{ margin: '4px 0' }} />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <CheckCircle2 size={20} className="text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">SD卡健康检测</h4>
                        <p className="text-sm text-gray-500">自动检测SD卡坏块和读写性能</p>
                      </div>
                    </div>
                    <Button size="small" onClick={() => message.success('SD卡健康检测已启动，预计需要1-2分钟')}>
                      立即检测
                    </Button>
                  </div>

                  <Divider style={{ margin: '4px 0' }} />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <AlertTriangle size={20} className="text-orange-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">告警通知</h4>
                        <p className="text-sm text-gray-500">存储异常时推送APP和邮件通知</p>
                      </div>
                    </div>
                    <Switch
                      checked={storageAlertEnabled}
                      onChange={(checked) => {
                        setStorageAlertEnabled(checked);
                        message.success(checked ? '存储告警已开启' : '存储告警已关闭');
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}
