import { useState, useEffect } from 'react';
import { Card, Tag, Button, Progress, Timeline, Tooltip, Divider, Statistic, Spin } from 'antd';
import {
  ArrowLeft,
  Clock,
  WifiOff,
  Video,
  HardDrive,
  Package,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { healthApi } from '@/services/api';
import type { DeviceHealth, OfflineLog, RecordingIntegrityDay, HealthLevel } from '@/types';

const getHealthLevel = (score: number): { level: HealthLevel; label: string; color: string } => {
  if (score >= 90) return { level: 'excellent', label: '优秀', color: 'success' };
  if (score >= 80) return { level: 'good', label: '良好', color: 'blue' };
  if (score >= 60) return { level: 'fair', label: '一般', color: 'warning' };
  return { level: 'poor', label: '较差', color: 'error' };
};

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟${seconds % 60}秒`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}小时${mins}分钟`;
};

const DeviceHealthDetail: React.FC = () => {
  const navigate = useNavigate();
  const { deviceId } = useParams<{ deviceId: string }>();
  const [deviceHealth, setDeviceHealth] = useState<DeviceHealth | null>(null);
  const [offlineLogs, setOfflineLogs] = useState<OfflineLog[]>([]);
  const [recordingData, setRecordingData] = useState<RecordingIntegrityDay[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const [detail, logs, recording] = await Promise.all([
        healthApi.getDeviceDetail(deviceId),
        healthApi.getOfflineLogs(deviceId),
        healthApi.getRecordingIntegrity(deviceId),
      ]);
      setDeviceHealth(detail);
      setOfflineLogs(logs);
      setRecordingData(recording);
    } catch (error) {
      console.error('获取设备详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [deviceId]);

  const healthInfo = getHealthLevel(deviceHealth?.overallScore || 0);
  const device = deviceHealth?.device;
  const storageUsed = device?.storage.used || 0;
  const storageTotal = device?.storage.total || 1;
  const storagePercent = Math.round((storageUsed / storageTotal) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          type="text"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/health')}
          className="px-2"
        >
          返回
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">
              {deviceHealth?.deviceName || '设备详情'}
            </h1>
            <Tag color={healthInfo.color} className="text-base px-3 py-1">
              {healthInfo.label}
            </Tag>
          </div>
          <p className="text-gray-500 mt-1">
            设备型号：{device?.model || '-'} | IP地址：{device?.ipAddress || '-'} | 位置：{device?.location || '-'}
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-primary-600">
              {deviceHealth?.overallScore || 0}
            </span>
            <span className="text-gray-400 text-lg">/ 100</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">健康评分</p>
        </div>
      </div>

      <Spin spinning={loading} tip="加载中...">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm" bordered={false}>
          <Statistic
            title={
              <span className="flex items-center gap-2 text-gray-500">
                <Clock size={16} />
                在线时长
              </span>
            }
            value={168}
            suffix="小时"
            className="text-gray-800"
          />
          <p className="text-gray-400 text-xs mt-2">近7天累计在线</p>
        </Card>
        <Card className="shadow-sm" bordered={false}>
          <Statistic
            title={
              <span className="flex items-center gap-2 text-gray-500">
                <WifiOff size={16} />
                离线次数
              </span>
            }
            value={deviceHealth?.offlineCount || 0}
            suffix="次"
            valueStyle={{ color: deviceHealth && deviceHealth.offlineCount > 5 ? '#F53F3F' : undefined }}
          />
          <p className="text-gray-400 text-xs mt-2">近7天累计离线</p>
        </Card>
        <Card className="shadow-sm" bordered={false}>
          <Statistic
            title={
              <span className="flex items-center gap-2 text-gray-500">
                <Clock size={16} />
                平均离线时长
              </span>
            }
            value={4.2}
            suffix="分钟"
          />
          <p className="text-gray-400 text-xs mt-2">每次离线平均时长</p>
        </Card>
        <Card className="shadow-sm" bordered={false}>
          <Statistic
            title={
              <span className="flex items-center gap-2 text-gray-500">
                <Video size={16} />
                录像完整率
              </span>
            }
            value={deviceHealth?.recordingIntegrity || 0}
            suffix="%"
            precision={1}
            valueStyle={{ color: deviceHealth && deviceHealth.recordingIntegrity < 80 ? '#FF7D00' : undefined }}
          />
          <p className="text-gray-400 text-xs mt-2">近7天录像完整度</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title={
            <span className="flex items-center gap-2">
              <WifiOff size={18} className="text-primary-500" />
              离线记录
            </span>
          }
          className="shadow-sm"
          bordered={false}
          extra={<span className="text-gray-400 text-sm">近10次</span>}
        >
          <Timeline
            items={offlineLogs.slice(0, 6).map((log) => ({
              color: log.reason === '网络波动' ? 'orange' : 'blue',
              children: (
                <div className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{log.reason}</p>
                      <p className="text-gray-500 text-sm">
                        {dayjs(log.startTime).format('YYYY-MM-DD HH:mm:ss')}
                      </p>
                    </div>
                    <Tag color="orange" className="flex-shrink-0">
                      {formatDuration(log.duration)}
                    </Tag>
                  </div>
                </div>
              ),
            }))}
          />
          {offlineLogs.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <WifiOff size={40} className="mx-auto mb-2 opacity-50" />
              <p>暂无离线记录</p>
            </div>
          )}
        </Card>

        <Card
          title={
            <span className="flex items-center gap-2">
              <Video size={18} className="text-primary-500" />
              录像完整性热力图
            </span>
          }
          className="shadow-sm"
          bordered={false}
          extra={<span className="text-gray-400 text-sm">近7天 x 24小时</span>}
        >
          <div className="space-y-2">
            <div className="flex gap-1">
              <div className="w-12 text-xs text-gray-400 pt-1">日期</div>
              <div className="flex-1 flex gap-px">
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="flex-1 text-center text-xs text-gray-400">
                    {i % 6 === 0 ? i : ''}
                  </div>
                ))}
              </div>
            </div>
            {recordingData.map((day) => (
              <div key={day.date} className="flex gap-1 items-center">
                <div className="w-12 text-xs text-gray-500 flex-shrink-0">
                  {dayjs(day.date).format('MM-DD')}
                </div>
                <div className="flex-1 flex gap-px">
                  {day.hours.map((hour) => (
                    <Tooltip
                      key={hour.hour}
                      title={`${day.date} ${hour.hour}:00 - ${hour.hasRecording ? '有录像' : '无录像'}`}
                    >
                      <div
                        className={`flex-1 h-6 rounded-sm cursor-pointer transition-all hover:scale-110 ${
                          hour.hasRecording ? 'bg-green-400 hover:bg-green-500' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      />
                    </Tooltip>
                  ))}
                </div>
                <div className="w-12 text-xs text-gray-400 text-right">
                  {Math.round(day.integrity * 100)}%
                </div>
              </div>
            ))}
            <div className="flex justify-end items-center gap-4 mt-4 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-400 rounded-sm" />
                <span>有录像</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-100 rounded-sm border border-gray-200" />
                <span>无录像</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title={
            <span className="flex items-center gap-2">
              <HardDrive size={18} className="text-primary-500" />
              存储状态
            </span>
          }
          className="shadow-sm"
          bordered={false}
          extra={
            deviceHealth?.storageWarning ? (
              <Tag color="warning" icon={<AlertTriangle size={12} />}>
                空间告警
              </Tag>
            ) : (
              <Tag color="success" icon={<CheckCircle size={12} />}>
                正常
              </Tag>
            )
          }
        >
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">总容量</span>
                <span className="font-medium text-gray-800">{storageTotal} GB</span>
              </div>
              <Progress
                percent={storagePercent}
                status={deviceHealth?.storageWarning ? 'exception' : 'active'}
                strokeColor={{ from: '#165DFF', to: '#00B42A' }}
                trailColor="#f0f0f0"
              />
              <div className="flex justify-between text-sm text-gray-400 mt-1">
                <span>已用 {storageUsed} GB</span>
                <span>剩余 {storageTotal - storageUsed} GB</span>
              </div>
            </div>
            <Divider className="my-4" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-sm mb-1">SD卡状态</p>
                <p className="font-medium text-gray-800">
                  {device?.storage.sdCard ? '已插入' : '未插入'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-1">SD卡健康度</p>
                <p className="font-medium text-success-500">良好 (98%)</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-1">存储循环</p>
                <p className="font-medium text-gray-800">已开启</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-1">录像模式</p>
                <p className="font-medium text-gray-800">移动侦测</p>
              </div>
            </div>
          </div>
        </Card>

        <Card
          title={
            <span className="flex items-center gap-2">
              <Package size={18} className="text-primary-500" />
              固件状态
            </span>
          }
          className="shadow-sm"
          bordered={false}
          extra={
            deviceHealth?.firmwareOutdated ? (
              <Tag color="orange" icon={<Info size={12} />}>
                待升级
              </Tag>
            ) : (
              <Tag color="success" icon={<CheckCircle size={12} />}>
                最新版本
              </Tag>
            )
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary-50 flex items-center justify-center">
                <Package size={28} className="text-primary-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">
                  {device?.firmwareVersion || 'v1.0.0'}
                </p>
                <p className="text-gray-500 text-sm">当前固件版本</p>
              </div>
            </div>
            <Divider className="my-3" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">发布时间</span>
                <span className="text-gray-800">2024-05-10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">文件大小</span>
                <span className="text-gray-800">15.2 MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">升级建议</span>
                <span className={deviceHealth?.firmwareOutdated ? 'text-warning-500' : 'text-success-500'}>
                  {deviceHealth?.firmwareOutdated ? '建议升级' : '无需升级'}
                </span>
              </div>
            </div>
            {deviceHealth?.firmwareOutdated && (
              <Button type="primary" block className="mt-2">
                立即升级
              </Button>
            )}
          </div>
        </Card>
      </div>
      </Spin>
    </div>
  );
};

export default DeviceHealthDetail;
