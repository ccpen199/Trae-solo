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
} from 'antd';
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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { otaApi } from '@/services/api';
import type { OTATask } from '@/types';

const statusMap: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: '待执行', color: 'default', icon: Clock },
  running: { label: '进行中', color: 'processing', icon: Loader },
  completed: { label: '已完成', color: 'success', icon: CheckCircle },
  failed: { label: '失败', color: 'error', icon: XCircle },
};

const strategyMap: Record<string, string> = {
  all: '全量发布',
  region: '按地域发布',
  model: '按型号发布',
  manual: '手动选择',
};

const OTATasks: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<OTATask[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const fetchTasks = async (status?: string) => {
    setLoading(true);
    try {
      const data = await otaApi.getTasks(status && status !== 'all' ? { status } : {});
      setTasks(data);
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
      message.success('任务已启动');
      fetchTasks(activeTab);
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
          message.success('任务已停止');
          fetchTasks(activeTab);
        } catch (error) {
          message.error('停止任务失败');
        }
      },
    });
  };

  const handleViewDetail = (task: OTATask) => {
    message.info(`查看任务详情: ${task.id}`);
  };

  const TaskCard = ({ task }: { task: OTATask }) => {
    const statusInfo = statusMap[task.status];
    const StatusIcon = statusInfo.icon;
    const progress = task.totalDevices > 0
      ? Math.round(((task.successDevices + task.failedDevices) / task.totalDevices) * 100)
      : 0;
    const successPercent = task.totalDevices > 0
      ? Math.round((task.successDevices / task.totalDevices) * 100)
      : 0;
    const grayPercentage = task.grayPercentage || (task.strategy === 'all' ? 100 : 30);
    const isGrayRelease = grayPercentage < 100;

    return (
      <Card className="shadow-sm hover:shadow-md transition-shadow" bordered={false}>
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  task.status === 'running'
                    ? 'bg-primary-50 text-primary-500'
                    : task.status === 'completed'
                    ? 'bg-green-50 text-green-500'
                    : task.status === 'failed'
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

          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <Button size="small" icon={<Eye size={14} />} onClick={() => handleViewDetail(task)}>
              详情
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
            {task.status === 'running' && (
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
    </div>
  );
};

export default OTATasks;
