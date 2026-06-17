import { useState } from 'react';
import {
  Card,
  Button,
  Tag,
  Space,
  Progress,
  Tabs,
  List,
  Modal,
  message,
  Divider,
  Statistic,
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  HardDrive,
  Cloud,
  Save,
  Check,
  Crown,
  Zap,
  Activity,
  RefreshCw,
  AlertTriangle,
  Info,
  Shield,
  Clock,
} from 'lucide-react';
import type { StoragePlan, Device } from '@/types';

const { TabPane } = Tabs;

const storagePlans: StoragePlan[] = [
  {
    type: 'cloud_7d',
    name: '7天云存储',
    description: '基础云存储套餐，适合日常使用',
    price: 19,
    cycleDays: 7,
  },
  {
    type: 'cloud_30d',
    name: '30天云存储',
    description: '专业云存储套餐，更长录像保留时间',
    price: 49,
    cycleDays: 30,
  },
  {
    type: 'sd_card',
    name: 'SD卡本地存储',
    description: '本地存储，无需额外费用',
    price: 0,
    cycleDays: 0,
  },
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
];

const planFeatures: Record<string, string[]> = {
  cloud_7d: [
    '7天循环录像',
    '云端存储',
    '随时随地查看',
    '数据加密存储',
    '最多支持5台设备',
  ],
  cloud_30d: [
    '30天循环录像',
    '云端存储',
    '随时随地查看',
    '数据加密存储',
    'AI智能分析',
    '支持无限设备',
    '优先客服支持',
  ],
  sd_card: [
    '本地存储',
    '无需额外费用',
    '循环录像',
    '手动下载录像',
    '单设备存储',
  ],
};

export default function Storage() {
  const [selectedPlan, setSelectedPlan] = useState<string>('cloud_7d');
  const [subscribedPlan, setSubscribedPlan] = useState<string>('cloud_7d');

  const handleSubscribe = (planType: string) => {
    if (planType === subscribedPlan) {
      message.info('您已订阅此套餐');
      return;
    }
    Modal.confirm({
      title: '确认订阅',
      content: `确定要订阅「${storagePlans.find(p => p.type === planType)?.name}」吗？`,
      onOk: () => {
        setSubscribedPlan(planType);
        message.success('订阅成功');
      },
    });
  };

  const handleFormatSD = (device: Device) => {
    Modal.confirm({
      title: '确认格式化',
      content: `确定要格式化「${device.name}」的SD卡吗？此操作将删除所有录像数据，不可恢复。`,
      okText: '确认格式化',
      okButtonProps: { danger: true },
      onOk: () => {
        message.success('SD卡格式化已开始');
      },
    });
  };

  const handleHealthCheck = (device: Device) => {
    message.loading({ content: '正在检测SD卡健康状态...', key: 'health' });
    setTimeout(() => {
      message.success({ content: 'SD卡健康状态良好', key: 'health' });
    }, 1500);
  };

  const totalStorage = mockDevices.reduce((sum, d) => sum + d.storage.sdTotal, 0);
  const totalUsed = mockDevices.reduce((sum, d) => sum + d.storage.sdUsed, 0);
  const totalPercent = Math.round((totalUsed / totalStorage) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">存储服务</h1>
        <p className="text-gray-500 mt-1">管理您的云存储套餐和设备存储</p>
      </div>

      <Row gutter={24}>
        <Col xs={24} md={12} lg={8}>
          <Card className="rounded-xl border-0 shadow-sm text-center">
            <Statistic
              title="总存储容量"
              value={totalStorage}
              suffix="GB"
              prefix={<HardDrive size={20} className="text-primary-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card className="rounded-xl border-0 shadow-sm text-center">
            <Statistic
              title="已使用"
              value={totalUsed.toFixed(1)}
              suffix="GB"
              prefix={<Save size={20} className="text-warning-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} md={24} lg={8}>
          <Card className="rounded-xl border-0 shadow-sm text-center">
            <Statistic
              title="设备数量"
              value={mockDevices.length}
              suffix="台"
              prefix={<Activity size={20} className="text-success-500" />}
            />
          </Card>
        </Col>
      </Row>

      <Card className="rounded-xl border-0 shadow-sm" title="云存储套餐">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {storagePlans.map((plan) => (
            <Card
              key={plan.type}
              className={`rounded-xl border-2 transition-all cursor-pointer ${
                selectedPlan === plan.type ? 'border-primary-500 shadow-md' : 'border-gray-100 hover:border-gray-200'
              } ${plan.type === 'cloud_30d' ? 'relative' : ''}`}
              onClick={() => setSelectedPlan(plan.type)}
            >
              {plan.type === 'cloud_30d' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Tag color="warning" icon={<Crown size={12} />}>
                    推荐
                  </Tag>
                </div>
              )}

              <div className="text-center py-4">
                <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center
                  ${plan.type === 'cloud_7d' ? 'bg-blue-100 text-blue-500' :
                    plan.type === 'cloud_30d' ? 'bg-primary-100 text-primary-500' :
                    'bg-gray-100 text-gray-500'}`}>
                  {plan.type === 'sd_card' ? <HardDrive size={32} /> : <Cloud size={32} />}
                </div>

                <h3 className="text-lg font-bold text-gray-800">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>

                <div className="mt-4 mb-4">
                  <span className="text-3xl font-bold text-gray-800">
                    {plan.price === 0 ? '免费' : `¥${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="text-gray-500 text-sm">/月</span>}
                </div>

                <Divider className="my-4" />

                <div className="space-y-2 text-left">
                  {planFeatures[plan.type]?.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check size={14} className="text-success-500 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                {subscribedPlan === plan.type ? (
                  <Button type="primary" block disabled icon={<Check size={14} />}>
                    已订阅
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    block
                    onClick={(e) => { e.stopPropagation(); handleSubscribe(plan.type); }}
                  >
                    {plan.price === 0 ? '使用' : '立即订阅'}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="rounded-xl border-0 shadow-sm" title="设备存储状态">
        <Tabs defaultActiveKey="all">
          <TabPane tab="全部设备" key="all">
            <List
              dataSource={mockDevices}
              renderItem={(device) => {
                const percent = Math.round((device.storage.sdUsed / device.storage.sdTotal) * 100);
                const isWarning = percent > 80;
                return (
                  <List.Item key={device.id} className="px-0">
                    <List.Item.Meta
                      avatar={
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <HardDrive size={20} className="text-gray-500" />
                        </div>
                      }
                      title={
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{device.name}</span>
                          {device.storage.sdCard ? (
                            <Tag color="success">SD卡正常</Tag>
                          ) : (
                            <Tag color="warning">无SD卡</Tag>
                          )}
                          {isWarning && (
                            <Tooltip title="存储空间不足">
                              <AlertTriangle size={14} className="text-warning-500" />
                            </Tooltip>
                          )}
                        </div>
                      }
                      description={
                        <div className="w-64 mt-1">
                          <Progress
                            percent={percent}
                            size="small"
                            strokeColor={isWarning ? '#F53F3F' : '#165DFF'}
                            showInfo={false}
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>已用 {device.storage.sdUsed} GB</span>
                            <span>共 {device.storage.sdTotal} GB</span>
                          </div>
                        </div>
                      }
                    />
                    <Space>
                      <Button size="small" icon={<RefreshCw size={14} />} onClick={() => handleHealthCheck(device)}>
                        健康检测
                      </Button>
                      <Button size="small" danger onClick={() => handleFormatSD(device)}>
                        格式化
                      </Button>
                    </Space>
                  </List.Item>
                );
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Card className="rounded-xl border-0 shadow-sm" title="SD卡管理">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockDevices.map((device) => {
            const percent = Math.round((device.storage.sdUsed / device.storage.sdTotal) * 100);
            return (
              <Card key={device.id} size="small" className="rounded-xl border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-800">{device.name}</span>
                  <Tag color={device.status === 'online' ? 'success' : 'default'}>
                    {device.status === 'online' ? '在线' : '离线'}
                  </Tag>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">容量</span>
                    <span className="text-gray-800">{device.storage.sdTotal} GB</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">已用</span>
                    <span className="text-gray-800">{device.storage.sdUsed} GB</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">状态</span>
                    <span className="text-success-500">健康</span>
                  </div>
                </div>

                <Progress
                  percent={percent}
                  size="small"
                  strokeColor="#165DFF"
                  className="mt-3"
                />

                <div className="flex gap-2 mt-4">
                  <Button size="small" block icon={<RefreshCw size={12} />} onClick={() => handleHealthCheck(device)}>
                    健康检测
                  </Button>
                  <Button size="small" block danger onClick={() => handleFormatSD(device)}>
                    格式化
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      <Card className="rounded-xl border-0 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Shield size={24} className="text-primary-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-800">数据安全保障</h3>
            <p className="text-sm text-gray-500 mt-1">
              我们采用银行级别的数据加密技术，确保您的录像数据安全可靠。所有云存储数据均经过端到端加密，
              只有您可以访问。
            </p>
            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Check size={14} className="text-success-500" />
                <span>端到端加密</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Check size={14} className="text-success-500" />
                <span>多重备份</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Check size={14} className="text-success-500" />
                <span>随时删除</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Check size={14} className="text-success-500" />
                <span>隐私合规</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
