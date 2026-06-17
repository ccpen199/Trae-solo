import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Tag,
  Space,
  Drawer,
  Empty,
  Spin,
  Select,
  DatePicker,
  List,
  Avatar,
  Divider,
  message,
  Tooltip,
} from 'antd';
import {
  Bell,
  Lock,
  Unlock,
  Trash2,
  Check,
  Filter,
  Video,
  AlertTriangle,
  AlertCircle,
  Info,
  User,
  Volume2,
  Eye,
  HardDrive,
  Clock,
  MapPin,
} from 'lucide-react';
import { useAlertStore } from '@/stores/useAlertStore';
import type { AlertEvent } from '@/types';

const { RangePicker } = DatePicker;
const { Option } = Select;

const mockAlerts: AlertEvent[] = [
  {
    id: '1',
    deviceId: '1',
    deviceName: '客厅摄像头',
    type: 'person',
    level: 'critical',
    timestamp: '2024-01-15 14:30:00',
    thumbnail: 'https://picsum.photos/seed/alert1/200/150',
    videoUrl: '',
    read: false,
    locked: true,
    description: '检测到陌生人进入客厅区域',
  },
  {
    id: '2',
    deviceId: '2',
    deviceName: '门口摄像头',
    type: 'motion',
    level: 'warning',
    timestamp: '2024-01-15 13:45:00',
    thumbnail: 'https://picsum.photos/seed/alert2/200/150',
    videoUrl: '',
    read: false,
    locked: false,
    description: '门口检测到移动目标',
  },
  {
    id: '3',
    deviceId: '1',
    deviceName: '客厅摄像头',
    type: 'sound',
    level: 'info',
    timestamp: '2024-01-15 12:20:00',
    thumbnail: 'https://picsum.photos/seed/alert3/200/150',
    videoUrl: '',
    read: true,
    locked: false,
    description: '检测到异常声响',
  },
  {
    id: '4',
    deviceId: '5',
    deviceName: '车库摄像头',
    type: 'person',
    level: 'warning',
    timestamp: '2024-01-15 10:15:00',
    thumbnail: 'https://picsum.photos/seed/alert4/200/150',
    videoUrl: '',
    read: true,
    locked: false,
    description: '车库检测到人员活动',
  },
  {
    id: '5',
    deviceId: '3',
    deviceName: '卧室摄像头',
    type: 'low_storage',
    level: 'warning',
    timestamp: '2024-01-14 22:00:00',
    thumbnail: 'https://picsum.photos/seed/alert5/200/150',
    videoUrl: '',
    read: true,
    locked: false,
    description: 'SD卡存储空间不足10%',
  },
  {
    id: '6',
    deviceId: '4',
    deviceName: '厨房摄像头',
    type: 'occlusion',
    level: 'critical',
    timestamp: '2024-01-14 18:30:00',
    thumbnail: 'https://picsum.photos/seed/alert6/200/150',
    videoUrl: '',
    read: false,
    locked: true,
    description: '摄像头被遮挡，请检查',
  },
  {
    id: '7',
    deviceId: '2',
    deviceName: '门口摄像头',
    type: 'person',
    level: 'info',
    timestamp: '2024-01-14 09:00:00',
    thumbnail: 'https://picsum.photos/seed/alert7/200/150',
    videoUrl: '',
    read: true,
    locked: false,
    description: '有人按门铃',
  },
  {
    id: '8',
    deviceId: '1',
    deviceName: '客厅摄像头',
    type: 'motion',
    level: 'info',
    timestamp: '2024-01-13 20:15:00',
    thumbnail: 'https://picsum.photos/seed/alert8/200/150',
    videoUrl: '',
    read: true,
    locked: false,
    description: '检测到移动目标',
  },
];

const alertTypeMap: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  motion: { label: '移动侦测', icon: <Eye size={14} />, color: 'blue' },
  sound: { label: '声音侦测', icon: <Volume2 size={14} />, color: 'purple' },
  occlusion: { label: '遮挡告警', icon: <Eye size={14} />, color: 'red' },
  person: { label: '人形识别', icon: <User size={14} />, color: 'orange' },
  low_storage: { label: '存储告警', icon: <HardDrive size={14} />, color: 'gold' },
};

const levelColorMap: Record<string, string> = {
  info: 'blue',
  warning: 'orange',
  critical: 'red',
};

const levelTextMap: Record<string, string> = {
  info: '提示',
  warning: '警告',
  critical: '严重',
};

export default function Alerts() {
  const { alerts, loading, unreadCount, fetchAlerts, fetchUnreadCount, markAsRead, markAllAsRead, lockAlert, unlockAlert } = useAlertStore();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertEvent | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchAlerts();
    fetchUnreadCount();
  }, [fetchAlerts, fetchUnreadCount]);

  const displayAlerts = alerts.length > 0 ? alerts : mockAlerts;

  const filteredAlerts = displayAlerts.filter((alert) => {
    if (filterLevel !== 'all' && alert.level !== filterLevel) return false;
    if (filterType !== 'all' && alert.type !== filterType) return false;
    return true;
  });

  const groupedAlerts = filteredAlerts.reduce((groups, alert) => {
    const date = alert.timestamp.split(' ')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(alert);
    return groups;
  }, {} as Record<string, AlertEvent[]>);

  const handleAlertClick = (alert: AlertEvent) => {
    setSelectedAlert(alert);
    setDrawerVisible(true);
    if (!alert.read) {
      markAsRead(alert.id);
    }
  };

  const handleLockToggle = (alert: AlertEvent) => {
    if (alert.locked) {
      unlockAlert(alert.id);
      message.success('已解锁');
    } else {
      lockAlert(alert.id);
      message.success('已锁定');
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    message.success('全部标记为已读');
  };

  const handleDelete = () => {
    message.success('告警已删除');
    setDrawerVisible(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">告警中心</h1>
          <p className="text-gray-500 mt-1">
            共 {filteredAlerts.length} 条告警，<span className="text-danger-500 font-medium">{unreadCount || displayAlerts.filter(a => !a.read).length} 条未读</span>
          </p>
        </div>
        <Space>
          <Button onClick={handleMarkAllRead} icon={<Check size={16} />}>
            全部已读
          </Button>
        </Space>
      </div>

      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0 space-y-6">
          <Card className="rounded-xl border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={16} className="text-gray-500" />
              <span className="font-medium text-gray-800">筛选条件</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">告警级别</label>
                <Select value={filterLevel} onChange={setFilterLevel} className="w-full">
                  <Option value="all">全部级别</Option>
                  <Option value="info">提示</Option>
                  <Option value="warning">警告</Option>
                  <Option value="critical">严重</Option>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block">告警类型</label>
                <Select value={filterType} onChange={setFilterType} className="w-full">
                  <Option value="all">全部类型</Option>
                  <Option value="motion">移动侦测</Option>
                  <Option value="person">人形识别</Option>
                  <Option value="sound">声音侦测</Option>
                  <Option value="occlusion">遮挡告警</Option>
                  <Option value="low_storage">存储告警</Option>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block">时间范围</label>
                <RangePicker className="w-full" />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block">设备筛选</label>
                <Select mode="multiple" placeholder="选择设备" className="w-full" allowClear>
                  <Option value="1">客厅摄像头</Option>
                  <Option value="2">门口摄像头</Option>
                  <Option value="3">卧室摄像头</Option>
                  <Option value="4">厨房摄像头</Option>
                  <Option value="5">车库摄像头</Option>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="rounded-xl border-0 shadow-sm">
            <h3 className="font-medium text-gray-800 mb-4">告警统计</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-600">严重</span>
                </div>
                <span className="font-medium">{displayAlerts.filter(a => a.level === 'critical').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-sm text-gray-600">警告</span>
                </div>
                <span className="font-medium">{displayAlerts.filter(a => a.level === 'warning').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-600">提示</span>
                </div>
                <span className="font-medium">{displayAlerts.filter(a => a.level === 'info').length}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex-1">
          <Spin spinning={loading}>
            {Object.keys(groupedAlerts).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedAlerts).map(([date, dateAlerts]) => (
                  <div key={date}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={16} />
                        <span className="font-medium">{date}</span>
                      </div>
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="text-sm text-gray-400">{dateAlerts.length} 条</span>
                    </div>
                    <List
                      itemLayout="horizontal"
                      dataSource={dateAlerts}
                      className="bg-white rounded-xl shadow-sm overflow-hidden"
                      renderItem={(alert) => (
                        <List.Item
                          className={`cursor-pointer hover:bg-gray-50 transition-colors px-4 ${!alert.read ? 'bg-blue-50/30' : ''}`}
                          onClick={() => handleAlertClick(alert)}
                        >
                          <List.Item.Meta
                            avatar={
                              <div className="relative">
                                <Avatar
                                  shape="square"
                                  size={64}
                                  src={alert.thumbnail}
                                  className="rounded-lg"
                                  icon={<Bell size={24} />}
                                />
                                {!alert.read && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full border-2 border-white"></div>
                                )}
                              </div>
                            }
                            title={
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800">{alert.deviceName}</span>
                                <Tag color={levelColorMap[alert.level]}>
                                  {levelTextMap[alert.level]}
                                </Tag>
                                {alert.locked && (
                                  <Tooltip title="已锁定">
                                    <Lock size={14} className="text-orange-500" />
                                  </Tooltip>
                                )}
                              </div>
                            }
                            description={
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  {alertTypeMap[alert.type]?.icon}
                                  <span>{alertTypeMap[alert.type]?.label}</span>
                                  <Divider type="vertical" className="my-0" />
                                  <MapPin size={12} />
                                  <span>{alert.deviceName}</span>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-1">{alert.description}</p>
                              </div>
                            }
                          />
                          <div className="text-right">
                            <div className="text-sm text-gray-400">{alert.timestamp.split(' ')[1]}</div>
                          </div>
                        </List.Item>
                      )}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="暂无告警记录" className="py-16 bg-white rounded-xl" />
            )}
          </Spin>
        </div>
      </div>

      <Drawer
        title="告警详情"
        placement="right"
        width={480}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          <Space>
            <Button
              icon={selectedAlert?.locked ? <Unlock size={14} /> : <Lock size={14} />}
              onClick={() => selectedAlert && handleLockToggle(selectedAlert)}
            >
              {selectedAlert?.locked ? '解锁' : '锁定'}
            </Button>
            <Button danger icon={<Trash2 size={14} />} onClick={handleDelete}>
              删除
            </Button>
          </Space>
        }
      >
        {selectedAlert && (
          <div className="space-y-6">
            <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video">
              {selectedAlert.thumbnail ? (
                <img
                  src={selectedAlert.thumbnail}
                  alt="告警截图"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Bell size={48} className="text-gray-600" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                <Button type="primary" shape="circle" size="large" icon={<Video size={20} />}>
                  回放
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-800 text-lg">{selectedAlert.deviceName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Tag color={levelColorMap[selectedAlert.level]}>
                    {levelTextMap[selectedAlert.level]}
                  </Tag>
                  <Tag color={alertTypeMap[selectedAlert.type]?.color}>
                    {alertTypeMap[selectedAlert.type]?.label}
                  </Tag>
                  {selectedAlert.locked && (
                    <Tag color="orange" icon={<Lock size={12} />}>已锁定</Tag>
                  )}
                </div>
              </div>

              <Divider className="my-2" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">告警时间</span>
                  <span className="text-gray-800">{selectedAlert.timestamp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">设备名称</span>
                  <span className="text-gray-800">{selectedAlert.deviceName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">告警类型</span>
                  <span className="text-gray-800">{alertTypeMap[selectedAlert.type]?.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">告警级别</span>
                  <span className="text-gray-800">{levelTextMap[selectedAlert.level]}</span>
                </div>
              </div>

              <Divider className="my-2" />

              <div>
                <h4 className="font-medium text-gray-800 mb-2">告警描述</h4>
                <p className="text-gray-600 text-sm">{selectedAlert.description}</p>
              </div>

              {selectedAlert.level === 'critical' && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800">重要提醒</h4>
                      <p className="text-sm text-red-600 mt-1">此告警为严重级别，请及时处理。如为误报可标记为已读或删除。</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
