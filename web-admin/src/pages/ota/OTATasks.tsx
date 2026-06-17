import { useState, useEffect } from 'react';
import {
  Card,
  Tag,
  Button,
  Tabs,
  Progress,
  Modal,
  message,
  Empty,
  Table,
  Space,
  Slider,
  Input,
  Divider,
  Row,
  Col,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlayCircle,
  Plus,
  Eye,
  StopCircle,
  Clock,
  Calendar,
  Target,
  CheckCircle,
  XCircle,
  Loader,
  MapPin,
  Monitor,
  Percent,
  PauseCircle,
  Play,
  Maximize2,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { otaApi } from '@/services/api';
import type { OTATask } from '@/types';

const statusMap: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: '待执行', color: 'default', icon: Clock },
  running: { label: '进行中', color: 'processing', icon: Loader },
  paused: { label: '已暂停', color: 'warning', icon: PauseCircle },
  completed: { label: '已完成', color: 'success', icon: CheckCircle },
  failed: { label: '失败', color: 'error', icon: XCircle },
};

const strategyMap: Record<string, string> = {
  all: '全量发布',
  region: '按地域发布',
  model: '按型号发布',
  manual: '手动选择',
};

interface FailedDevice {
  key: string;
  deviceId: string;
  model: string;
  region: string;
  reason: string;
}

interface RegionProgress {
  region: string;
  progress: number;
  total: number;
  success: number;
}

interface ModelProgress {
  model: string;
  progress: number;
  total: number;
  success: number;
}

const mockRegionProgress: RegionProgress[] = [
  { region: '华南', progress: 100, total: 50, success: 50 },
  { region: '华东', progress: 85, total: 80, success: 68 },
  { region: '华北', progress: 60, total: 60, success: 36 },
  { region: '西南', progress: 40, total: 40, success: 16 },
  { region: '东北', progress: 30, total: 30, success: 9 },
];

const mockModelProgress: ModelProgress[] = [
  { model: 'IPC-2000', progress: 90, total: 100, success: 90 },
  { model: 'IPC-3000', progress: 75, total: 80, success: 60 },
  { model: 'NVR-5000', progress: 50, total: 60, success: 30 },
];

const mockFailedDevices: FailedDevice[] = [
  { key: '1', deviceId: 'dev-10234', model: 'IPC-3000', region: '华北', reason: '网络超时：设备连接中断' },
  { key: '2', deviceId: 'dev-10456', model: 'NVR-5000', region: '西南', reason: '存储空间不足' },
  { key: '3', deviceId: 'dev-10789', model: 'IPC-3000', region: '华北', reason: '固件校验失败' },
  { key: '4', deviceId: 'dev-11001', model: 'NVR-5000', region: '西南', reason: '设备离线，无法连接' },
  { key: '5', deviceId: 'dev-11234', model: 'NVR-5000', region: '东北', reason: '升级包下载失败' },
];

const OTATasks: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<OTATask[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<OTATask | null>(null);
  const [pauseModalVisible, setPauseModalVisible] = useState(false);
  const [expandModalVisible, setExpandModalVisible] = useState(false);
  const [newGrayPercentage, setNewGrayPercentage] = useState<number>(30);
  const [expandRemark, setExpandRemark] = useState('');

  const fetchTasks = async (status?: string) => {
    setLoading(true);
    try {
      const data = await otaApi.getTasks(status && status !== 'all' ? { status } : {});
      setTasks(data.map((t: OTATask) => ({
        ...t,
        grayPercentage: t.grayPercentage ?? (t.strategy === 'all' ? 100 : 30),
      })));
    } catch (error) {
      console.error('获取任务列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    fetchTasks(key);
  };

  const handleStartTask = async (task: OTATask) => {
    try {
      await otaApi.startTask(task.id);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'running' as const } : t));
      message.success('任务已启动');
    } catch (error) {
      message.error('启动任务失败');
    }
  };

  const handleStopTask = (task: OTATask) => {
    Modal.confirm({
      title: '确认停止任务',
      content: `确定要停止任务 "${task.id}" 吗？停止后已升级的设备不会回滚。`,
      okText: '确认停止',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await otaApi.stopTask(task.id);
          setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'failed' as const } : t));
          message.success('任务已停止');
          fetchTasks(activeTab);
        } catch (error) {
          message.error('停止任务失败');
        }
      },
    });
  };

  const handleViewProgress = (task: OTATask) => {
    setSelectedTask(task);
    setProgressModalVisible(true);
  };

  const handlePauseToggle = (task: OTATask) => {
    setSelectedTask(task);
    setPauseModalVisible(true);
  };

  const confirmPauseToggle = async () => {
    if (!selectedTask) return;
    const isNowPaused = selectedTask.status === 'running';
    setTasks(prev => prev.map(t =>
      t.id === selectedTask.id
        ? { ...t, status: isNowPaused ? 'paused' as const : 'running' as const }
        : t
    ));
    message.success(isNowPaused ? '任务已暂停' : '任务已继续');
    setPauseModalVisible(false);
    setSelectedTask(null);
  };

  const handleExpandGray = (task: OTATask) => {
    setSelectedTask(task);
    setNewGrayPercentage(task.grayPercentage || 30);
    setExpandRemark('');
    setExpandModalVisible(true);
  };

  const confirmExpandGray = async () => {
    if (!selectedTask) return;
    if (newGrayPercentage <= (selectedTask.grayPercentage || 30)) {
      message.warning('灰度比例必须大于当前值');
      return;
    }
    setTasks(prev => prev.map(t =>
      t.id === selectedTask.id
        ? { ...t, grayPercentage: newGrayPercentage }
        : t
    ));
    message.success(`灰度比例已调整为 ${newGrayPercentage}%`);
    setExpandModalVisible(false);
    setSelectedTask(null);
  };

  const failedDeviceColumns: ColumnsType<FailedDevice> = [
    {
      title: '设备ID',
      dataIndex: 'deviceId',
      key: 'deviceId',
      render: (text) => <span className="font-mono text-xs text-gray-700">{text}</span>,
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
      render: (text) => <Tag color="blue" className="border-0 m-0">{text}</Tag>,
    },
    {
      title: '地区',
      dataIndex: 'region',
      key: 'region',
      render: (text) => (
        <Space size={4}>
          <MapPin size={12} className="text-gray-400" />
          <span className="text-gray-700">{text}</span>
        </Space>
      ),
    },
    {
      title: '失败原因',
      dataIndex: 'reason',
      key: 'reason',
      render: (text) => (
        <span className="text-danger-600 text-sm flex items-center gap-1">
          <AlertCircle size={12} />
          {text}
        </span>
      ),
    },
  ];

  const TaskCard = ({ task }: { task: OTATask }) => {
    const currentStatus = task.status;
    const statusInfo = statusMap[currentStatus] || statusMap.pending;
    const StatusIcon = statusInfo.icon;
    const progress = task.totalDevices > 0
      ? Math.round(((task.successDevices + task.failedDevices) / task.totalDevices) * 100)
      : 0;
    const successPercent = task.totalDevices > 0
      ? Math.round((task.successDevices / task.totalDevices) * 100)
      : 0;
    const grayPercentage = task.grayPercentage ?? (task.strategy === 'all' ? 100 : 30);
    const isGrayRelease = grayPercentage < 100;
    const isPaused = currentStatus === 'paused';
    const isRunning = currentStatus === 'running';

    return (
      <Card className="shadow-sm hover:shadow-md transition-shadow" bordered={false}>
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isRunning
                    ? 'bg-primary-50 text-primary-500'
                    : isPaused
                    ? 'bg-warning-50 text-warning-500'
                    : currentStatus === 'completed'
                    ? 'bg-green-50 text-green-500'
                    : currentStatus === 'failed'
                    ? 'bg-red-50 text-red-500'
                    : 'bg-gray-50 text-gray-500'
                }`}
              >
                <PlayCircle size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">
                  OTA升级 - {task.version}
                </h3>
                <p className="text-gray-400 text-sm font-mono">{task.id}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Tag color={statusInfo.color} icon={<StatusIcon size={12} />}>
                {statusInfo.label}
              </Tag>
              {isGrayRelease && (
                <Tag color="orange" icon={<Percent size={12} />}>
                  灰度 {grayPercentage}%
                </Tag>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">升级进度</span>
              <span className="text-gray-700 font-medium">
                {task.successDevices + task.failedDevices} / {task.totalDevices} 台 ({progress}%)
              </span>
            </div>
            <Progress
              percent={progress}
              showInfo={false}
              strokeColor={{
                '0%': '#165DFF',
                '100%': '#00B42A',
              }}
              trailColor="#f0f0f0"
              size="small"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span className="text-green-500">成功 {task.successDevices} 台</span>
              <span className="text-red-500">失败 {task.failedDevices} 台</span>
              <span>成功率 {successPercent}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Target size={14} />
              <span>策略：</span>
              <span className="text-gray-700">{strategyMap[task.strategy]}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar size={14} />
              <span>开始：</span>
              <span className="text-gray-700">
                {dayjs(task.startTime).format('MM-DD HH:mm')}
              </span>
            </div>
            {task.models.length > 0 && (
              <div className="col-span-2 flex items-start gap-2 text-gray-500">
                <Monitor size={14} className="mt-1 flex-shrink-0" />
                <span className="text-gray-400 mt-0.5">目标型号：</span>
                <div className="flex flex-wrap gap-1">
                  {task.models.map((model) => (
                    <Tag key={model} color="blue" className="border-0 m-0">
                      {model}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
            {task.regions.length > 0 && (
              <div className="col-span-2 flex items-start gap-2 text-gray-500">
                <MapPin size={14} className="mt-1 flex-shrink-0" />
                <span className="text-gray-400 mt-0.5">分批地域：</span>
                <div className="flex flex-wrap gap-1">
                  {task.regions.map((region) => (
                    <Tag key={region} color="cyan" className="border-0 m-0">
                      {region}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
            {isGrayRelease && (
              <div className="col-span-2 bg-orange-50 border border-orange-100 rounded-lg p-3">
                <div className="flex items-center gap-2 text-orange-700">
                  <Percent size={14} />
                  <span className="font-medium">灰度发布策略</span>
                </div>
                <p className="text-sm text-orange-600 mt-1">
                  当前批次推送 {grayPercentage}% 设备，覆盖 {task.regions.join('、') || '全部区域'}，预计影响 ~{Math.round(task.totalDevices * grayPercentage / 100)} 台
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
            <Button
              size="small"
              icon={<Eye size={14} />}
              onClick={() => handleViewProgress(task)}
            >
              查看进度
            </Button>
            {task.status === 'pending' && (
              <Button
                size="small"
                type="primary"
                icon={<PlayCircle size={14} />}
                onClick={() => handleStartTask(task)}
              >
                开始
              </Button>
            )}
            {(isRunning || isPaused) && (
              <Button
                size="small"
                icon={isPaused ? <Play size={14} /> : <PauseCircle size={14} />}
                onClick={() => handlePauseToggle(task)}
                className={isPaused ? '' : 'text-warning-600 border-warning-300 hover:border-warning-400 hover:text-warning-700'}
              >
                {isPaused ? '继续' : '暂停'}
              </Button>
            )}
            {(isRunning || isPaused) && isGrayRelease && (
              <Button
                size="small"
                type="primary"
                icon={<ChevronUp size={14} />}
                onClick={() => handleExpandGray(task)}
                className="bg-orange-500 border-orange-500 hover:bg-orange-600 hover:border-orange-600"
              >
                灰度扩量
              </Button>
            )}
            {isRunning && (
              <Button
                size="small"
                danger
                icon={<StopCircle size={14} />}
                onClick={() => handleStopTask(task)}
              >
                停止
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'running', label: '进行中' },
    { key: 'paused', label: '已暂停' },
    { key: 'pending', label: '待执行' },
    { key: 'completed', label: '已完成' },
    { key: 'failed', label: '失败' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">发布任务</h1>
          <p className="text-gray-500 mt-1">管理 OTA 固件升级发布任务</p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => navigate('/ota/tasks/create')}
        >
          创建任务
        </Button>
      </div>

      <Card className="shadow-sm" bordered={false} bodyStyle={{ padding: '16px 24px 0' }}>
        <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} />
      </Card>

      <Card className="shadow-sm" bordered={false} loading={loading}>
        {tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <Empty
            description="暂无任务"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>

      <Modal
        title={
          <Space>
            <Maximize2 size={18} className="text-primary-500" />
            <span>升级进度详情</span>
            {selectedTask && (
              <Tag color="blue" className="ml-2">
                {selectedTask.version}
              </Tag>
            )}
          </Space>
        }
        open={progressModalVisible}
        onCancel={() => {
          setProgressModalVisible(false);
          setSelectedTask(null);
        }}
        footer={[
          <Button key="close" onClick={() => setProgressModalVisible(false)}>
            关闭
          </Button>,
          selectedTask && selectedTask.status === 'running' && (
            <Button
              key="retry"
              type="primary"
              onClick={() => message.success('已对失败设备发起重试')}
            >
              重试失败设备
            </Button>
          ),
        ]}
        width={880}
        destroyOnClose
      >
        {selectedTask && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-primary-50 to-success-50 rounded-xl p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">总体升级进度</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {selectedTask.successDevices + selectedTask.failedDevices}
                    <span className="text-lg text-gray-400 mx-1">/</span>
                    <span className="text-2xl text-gray-600">{selectedTask.totalDevices} 台</span>
                  </p>
                </div>
                <Tag color={statusMap[selectedTask.status]?.color} icon={<Clock size={12} />}>
                  {statusMap[selectedTask.status]?.label}
                </Tag>
              </div>
              <Progress
                percent={
                  selectedTask.totalDevices > 0
                    ? Math.round(
                        ((selectedTask.successDevices + selectedTask.failedDevices) /
                          selectedTask.totalDevices) *
                          100
                      )
                    : 0
                }
                strokeColor={{
                  '0%': '#165DFF',
                  '100%': '#00B42A',
                }}
                trailColor="#fff"
                size={[null, 16]}
              />
              <div className="flex justify-between mt-3 text-sm">
                <Space>
                  <CheckCircle size={14} className="text-green-500" />
                  <span className="text-green-700">
                    成功 <strong>{selectedTask.successDevices}</strong> 台
                  </span>
                </Space>
                <Space>
                  <XCircle size={14} className="text-red-500" />
                  <span className="text-red-700">
                    失败 <strong>{selectedTask.failedDevices}</strong> 台
                  </span>
                </Space>
                <span className="text-gray-500">
                  成功率{' '}
                  <strong>
                    {selectedTask.totalDevices > 0
                      ? Math.round((selectedTask.successDevices / selectedTask.totalDevices) * 100)
                      : 0}
                    %
                  </strong>
                </span>
              </div>
            </div>

            {selectedTask.regions.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <MapPin size={16} className="text-cyan-500" />
                  按地域分批进度
                </h4>
                <div className="space-y-3">
                  {mockRegionProgress.map((item) => (
                    <div key={item.region} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <Space>
                          <Tag color="cyan" className="border-0 m-0">
                            {item.region}
                          </Tag>
                          <span className="text-sm text-gray-500">
                            {item.success}/{item.total} 台
                          </span>
                        </Space>
                        <span
                          className={`text-sm font-medium ${
                            item.progress === 100
                              ? 'text-green-600'
                              : item.progress >= 60
                              ? 'text-primary-600'
                              : 'text-warning-600'
                          }`}
                        >
                          {item.progress}%
                        </span>
                      </div>
                      <Progress
                        percent={item.progress}
                        showInfo={false}
                        size="small"
                        strokeColor={
                          item.progress === 100
                            ? '#00B42A'
                            : item.progress >= 60
                            ? '#165DFF'
                            : '#FF7D00'
                        }
                        trailColor="#fff"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTask.models.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <Monitor size={16} className="text-blue-500" />
                  按型号分批进度
                </h4>
                <Row gutter={[16, 16]}>
                  {mockModelProgress.map((item) => (
                    <Col xs={24} sm={12} md={8} key={item.model}>
                      <Card className="shadow-sm" size="small" bordered>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Tag color="blue" className="border-0 m-0">
                              {item.model}
                            </Tag>
                          </div>
                          <Progress
                            type="dashboard"
                            percent={item.progress}
                            size={96}
                            strokeColor={
                              item.progress === 100
                                ? '#00B42A'
                                : item.progress >= 60
                                ? '#165DFF'
                                : '#FF7D00'
                            }
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            {item.success}/{item.total} 台
                          </p>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {selectedTask.failedDevices > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <XCircle size={16} className="text-red-500" />
                  升级失败设备列表
                  <Tag color="red" className="ml-2">
                    共 {mockFailedDevices.length} 台
                  </Tag>
                </h4>
                <Table
                  columns={failedDeviceColumns}
                  dataSource={mockFailedDevices}
                  size="small"
                  pagination={{
                    pageSize: 5,
                    showSizeChanger: false,
                    showTotal: (total) => `共 ${total} 台`,
                  }}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            {selectedTask?.status === 'running' ? (
              <PauseCircle size={18} className="text-warning-500" />
            ) : (
              <Play size={18} className="text-success-500" />
            )}
            <span>
              {selectedTask?.status === 'running' ? '确认暂停任务' : '确认继续任务'}
            </span>
          </Space>
        }
        open={pauseModalVisible}
        onCancel={() => {
          setPauseModalVisible(false);
          setSelectedTask(null);
        }}
        onOk={confirmPauseToggle}
        okText={selectedTask?.status === 'running' ? '确认暂停' : '确认继续'}
        okType={selectedTask?.status === 'running' ? 'warning' : 'primary'}
        cancelText="取消"
        width={480}
      >
        {selectedTask && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">任务ID</p>
              <p className="font-mono text-gray-800">{selectedTask.id}</p>
              <p className="text-sm text-gray-500 mt-2 mb-1">版本</p>
              <p className="font-medium text-gray-800">{selectedTask.version}</p>
            </div>
            {selectedTask.status === 'running' ? (
              <div className="bg-warning-50 border border-warning-100 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle_ size={18} className="text-warning-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-warning-800">暂停任务提示</p>
                    <p className="text-sm text-warning-600 mt-1">
                      暂停后，正在升级中的设备将继续完成本次升级，尚未开始升级的设备会被推迟。已升级成功的设备不会回滚。
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-success-50 border border-success-100 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle size={18} className="text-success-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-success-800">继续任务提示</p>
                    <p className="text-sm text-success-600 mt-1">
                      继续后，任务将按照当前灰度策略继续推送升级。如需调整灰度比例，请使用「灰度扩量」功能。
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <ChevronUp size={18} className="text-orange-500" />
            <span>灰度扩量</span>
            {selectedTask && (
              <Tag color="orange" className="ml-2">
                {selectedTask.version}
              </Tag>
            )}
          </Space>
        }
        open={expandModalVisible}
        onCancel={() => {
          setExpandModalVisible(false);
          setSelectedTask(null);
        }}
        onOk={confirmExpandGray}
        okText="确认扩量"
        okType="primary"
        cancelText="取消"
        width={560}
      >
        {selectedTask && (
          <div className="space-y-5">
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
              <Row gutter={16}>
                <Col span={12}>
                  <p className="text-sm text-gray-500 mb-1">当前灰度比例</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {selectedTask.grayPercentage || 30}%
                  </p>
                </Col>
                <Col span={12}>
                  <p className="text-sm text-gray-500 mb-1">预计覆盖设备</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {Math.round(selectedTask.totalDevices * (selectedTask.grayPercentage || 30) / 100)}
                    <span className="text-sm font-normal text-gray-400 ml-1">
                      / {selectedTask.totalDevices} 台
                    </span>
                  </p>
                </Col>
              </Row>
            </div>

            <Divider className="my-0" />

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center justify-between">
                <span>调整灰度比例</span>
                <span className="text-primary-600 font-bold text-lg">{newGrayPercentage}%</span>
              </label>
              <Slider
                min={selectedTask.grayPercentage || 30}
                max={100}
                value={newGrayPercentage}
                onChange={(val) => setNewGrayPercentage(val as number)}
                marks={{
                  [selectedTask.grayPercentage || 30]: {
                    style: { color: '#f50' },
                    label: <strong>当前</strong>,
                  },
                  50: '50%',
                  75: '75%',
                  100: '全量',
                }}
                tooltip={{ formatter: (val) => `${val}%` }}
              />
              <div className="flex justify-between mt-3 text-xs text-gray-500">
                <span>
                  新增覆盖：
                  <strong className="text-primary-600">
                    {Math.round(
                      selectedTask.totalDevices *
                        (newGrayPercentage - (selectedTask.grayPercentage || 30)) /
                        100
                    )}
                    台
                  </strong>
                </span>
                <span>
                  调整后总数：
                  <strong className="text-gray-800">
                    {Math.round(selectedTask.totalDevices * newGrayPercentage / 100)}
                    台
                  </strong>
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                扩量说明（可选）
              </label>
              <Input.TextArea
                rows={3}
                placeholder="请填写本次灰度扩量的原因、观察指标等信息..."
                value={expandRemark}
                onChange={(e) => setExpandRemark(e.target.value)}
                maxLength={200}
                showCount
              />
            </div>

            {newGrayPercentage >= 100 && (
              <div className="bg-primary-50 border border-primary-100 rounded-lg p-3">
                <div className="flex items-start gap-2 text-sm">
                  <AlertCircle size={14} className="text-primary-500 mt-0.5 flex-shrink-0" />
                  <span className="text-primary-700">
                    选择 100% 将转为<strong>全量发布</strong>，所有符合条件的设备都将收到升级推送，请确认无误。
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

function AlertTriangle_(props: { size?: number; className?: string }) {
  return <AlertTriangle size={props.size} className={props.className} />;
}

export default OTATasks;
