import { useState, useEffect, useMemo } from 'react';
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
  Table,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
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
  FileText,
  ExternalLink,
  Globe,
  CheckSquare,
} from 'lucide-react';
import { useAlertStore } from '@/stores/useAlertStore';
import { useNavigate } from 'react-router-dom';
import type { AlertEvent } from '@/types';

interface AuditLogItem {
  id: string;
  action: string;
  deviceId?: string;
  deviceName?: string;
  ip: string;
  timestamp: string;
  details: string;
  operator: string;
  operatorAvatar?: string;
}

const mockAuditLogs: AuditLogItem[] = [
  {
    id: '1',
    action: '查看实时画面',
    deviceId: '1',
    deviceName: '客厅摄像头',
    ip: '192.168.1.105',
    timestamp: '2024-01-15 14:35:22',
    details: '通过Web端查看客厅摄像头实时画面，时长3分20秒',
    operator: '张三',
  },
  {
    id: '2',
    action: '开启隐私模式',
    deviceId: '3',
    deviceName: '卧室摄像头',
    ip: '114.247.50.128',
    timestamp: '2024-01-15 13:20:15',
    details: '开启卧室摄像头隐私模式，持续8小时',
    operator: '张三',
  },
  {
    id: '3',
    action: '告警处置',
    deviceId: '2',
    deviceName: '门口摄像头',
    ip: '192.168.1.105',
    timestamp: '2024-01-15 12:45:33',
    details: '标记告警ID #1024为已处理状态',
    operator: '张三',
  },
  {
    id: '4',
    action: '锁定告警',
    deviceId: '1',
    deviceName: '客厅摄像头',
    ip: '192.168.1.105',
    timestamp: '2024-01-15 11:30:08',
    details: '锁定告警ID #1021，防止自动清理',
    operator: '张三',
  },
  {
    id: '5',
    action: '查看告警详情',
    deviceId: '5',
    deviceName: '车库摄像头',
    ip: '114.247.50.128',
    timestamp: '2024-01-15 10:18:45',
    details: '查看车库摄像头人形识别告警详情',
    operator: '张三',
  },
  {
    id: '6',
    action: '修改设备配置',
    deviceId: '4',
    deviceName: '厨房摄像头',
    ip: '192.168.1.105',
    timestamp: '2024-01-15 09:22:10',
    details: '修改移动侦测灵敏度：中 → 高',
    operator: '张三',
  },
  {
    id: '7',
    action: '删除告警',
    deviceId: '2',
    deviceName: '门口摄像头',
    ip: '114.247.50.128',
    timestamp: '2024-01-14 23:15:42',
    details: '删除告警ID #1015，类型：移动侦测',
    operator: '张三',
  },
  {
    id: '8',
    action: '导出录像',
    deviceId: '1',
    deviceName: '客厅摄像头',
    ip: '192.168.1.105',
    timestamp: '2024-01-14 20:45:30',
    details: '导出2024-01-14 18:00至20:00的录像文件',
    operator: '张三',
  },
  {
    id: '9',
    action: '登录系统',
    ip: '114.247.50.128',
    timestamp: '2024-01-14 19:30:00',
    details: '通过Web端登录系统，浏览器：Chrome 120',
    operator: '张三',
  },
  {
    id: '10',
    action: '设备分享',
    deviceId: '2',
    deviceName: '门口摄像头',
    ip: '192.168.1.105',
    timestamp: '2024-01-14 15:10:25',
    details: '将门口摄像头分享给用户李四（有效期7天）',
    operator: '张三',
  },
];

const actionColorMap: Record<string, string> = {
  '查看实时画面': 'green',
  '开启隐私模式': 'blue',
  '告警处置': 'cyan',
  '锁定告警': 'orange',
  '解锁告警': 'gold',
  '查看告警详情': 'purple',
  '修改设备配置': 'geekblue',
  '删除告警': 'red',
  '导出录像': 'magenta',
  '登录系统': 'green',
  '设备分享': 'cyan',
};

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
    read: false,
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
    read: false,
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
    read: false,
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

interface AlertProcessInfo {
  alertId: string;
  handler: string;
  handleTime: string;
}

export default function Alerts() {
  const navigate = useNavigate();
  const { alerts, loading, unreadCount, fetchAlerts, fetchUnreadCount, markAsRead, markAllAsRead, lockAlert, unlockAlert, updateAlert } = useAlertStore();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [auditDrawerVisible, setAuditDrawerVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertEvent | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const [localAlerts, setLocalAlerts] = useState<AlertEvent[]>([]);
  const [localUnreadCount, setLocalUnreadCount] = useState<number>(0);
  const [processInfoMap, setProcessInfoMap] = useState<Record<string, AlertProcessInfo>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    const saved = localStorage.getItem('auditLogs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return mockAuditLogs;
      }
    }
    return mockAuditLogs;
  });

  const [auditFilterAction, setAuditFilterAction] = useState<string | undefined>();
  const [auditFilterOperator, setAuditFilterOperator] = useState<string | undefined>();
  const [auditFilterDateRange, setAuditFilterDateRange] = useState<[any, any] | null>(null);

  const currentUser = '张三';

  const generateRandomIP = () => {
    const lastOctet = Math.floor(Math.random() * 255) + 1;
    return `192.168.1.${lastOctet}`;
  };

  useEffect(() => {
    fetchAlerts();
    fetchUnreadCount();
  }, [fetchAlerts, fetchUnreadCount]);

  useEffect(() => {
    let initialAlerts: AlertEvent[];
    if (alerts.length > 0) {
      initialAlerts = [...alerts];
    } else {
      initialAlerts = [...mockAlerts];
    }

    const allRead = initialAlerts.length > 0 && initialAlerts.every(a => a.read);
    if (initialAlerts.length === 0 || allRead) {
      initialAlerts = initialAlerts.map((alert, index) => ({
        ...alert,
        read: index >= 5,
      }));
    }

    setLocalAlerts(initialAlerts);
    setLocalUnreadCount(initialAlerts.filter(a => !a.read).length);
  }, [alerts, unreadCount]);

  const displayAlerts = localAlerts;

  const filteredAlerts = displayAlerts.filter((alert) => {
    if (filterLevel !== 'all' && alert.level !== filterLevel) return false;
    if (filterType !== 'all' && alert.type !== filterType) return false;
    return true;
  });

  const alertStats = useMemo(() => {
    const critical = displayAlerts.filter(a => a.level === 'critical').length;
    const warning = displayAlerts.filter(a => a.level === 'warning').length;
    const info = displayAlerts.filter(a => a.level === 'info').length;
    return { critical, warning, info };
  }, [displayAlerts]);

  const groupedAlerts = filteredAlerts.reduce((groups, alert) => {
    const date = alert.timestamp.split(' ')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(alert);
    return groups;
  }, {} as Record<string, AlertEvent[]>);

  const addAuditLog = (log: Omit<AuditLogItem, 'id' | 'timestamp'>) => {
    const newLog: AuditLogItem = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev];
      localStorage.setItem('auditLogs', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAlertClick = (alert: AlertEvent) => {
    setSelectedAlert(alert);
    setDrawerVisible(true);
  };

  const handleLockToggle = (alert: AlertEvent) => {
    if (alert.locked) {
      unlockAlert(alert.id);
      setLocalAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, locked: false } : a));
      message.success('已解锁');
    } else {
      lockAlert(alert.id);
      setLocalAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, locked: true } : a));
      message.success('已锁定');
    }
  };

  const handleMarkAllRead = () => {
    const unreadAlerts = displayAlerts.filter(a => !a.read);
    if (unreadAlerts.length === 0) {
      message.info('没有未处理的告警');
      return;
    }

    markAllAsRead();
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    const newProcessMap: Record<string, AlertProcessInfo> = {};
    unreadAlerts.forEach(alert => {
      newProcessMap[alert.id] = {
        alertId: alert.id,
        handler: currentUser,
        handleTime: now,
      };

      const randomIP = generateRandomIP();
      addAuditLog({
        action: '告警处置',
        deviceId: alert.deviceId,
        deviceName: alert.deviceName,
        ip: randomIP,
        operator: currentUser,
        details: `确认告警，类型：${alertTypeMap[alert.type]?.label || alert.type}`,
      });
    });
    setProcessInfoMap(prev => ({ ...prev, ...newProcessMap }));
    setLocalAlerts(prev => prev.map(a => ({ ...a, read: true })));
    setLocalUnreadCount(0);

    const count = unreadAlerts.length;
    message.success(`已将${count}条告警标记为已处理，共生成${count}条审计记录`);
  };

  const handleMarkSingleRead = (alert: AlertEvent, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (alert.read) {
      message.info('该告警已处理');
      return;
    }

    markAsRead(alert.id);
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    setLocalAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, read: true } : a));
    setLocalUnreadCount(prev => Math.max(0, prev - 1));
    setProcessInfoMap(prev => ({
      ...prev,
      [alert.id]: {
        alertId: alert.id,
        handler: currentUser,
        handleTime: now,
      },
    }));

    const randomIP = generateRandomIP();
    addAuditLog({
      action: '告警处置',
      deviceId: alert.deviceId,
      deviceName: alert.deviceName,
      ip: randomIP,
      operator: currentUser,
      details: `确认告警，类型：${alertTypeMap[alert.type]?.label || alert.type}`,
    });

    message.success('告警已确认处理');
  };

  const handleDelete = () => {
    message.success('告警已删除');
    setDrawerVisible(false);
  };

  const handleDeviceClick = (deviceId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    navigate(`/device/${deviceId}`);
  };

  const filteredAuditLogs = auditLogs.filter(log => {
    if (auditFilterAction && log.action !== auditFilterAction) return false;
    if (auditFilterOperator && log.operator !== auditFilterOperator) return false;
    if (auditFilterDateRange && auditFilterDateRange[0] && auditFilterDateRange[1]) {
      const logTime = new Date(log.timestamp).getTime();
      const startTime = auditFilterDateRange[0].startOf('day').toDate().getTime();
      const endTime = auditFilterDateRange[1].endOf('day').toDate().getTime();
      if (logTime < startTime || logTime > endTime) return false;
    }
    return true;
  });

  const auditColumns: ColumnsType<AuditLogItem> = [
    {
      title: '操作时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 170,
      render: (text) => <span className="text-gray-600 whitespace-nowrap">{text}</span>,
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action) => (
        <Tag color={actionColorMap[action] || 'default'} className="border-0">
          {action}
        </Tag>
      ),
    },
    {
      title: '关联设备',
      key: 'device',
      width: 180,
      render: (_, record) => {
        if (!record.deviceName) return <span className="text-gray-400">-</span>;
        return (
          <a
            className="text-primary-600 hover:text-primary-700"
            onClick={(e) => handleDeviceClick(record.deviceId!, e)}
          >
            <span>{record.deviceName}</span>
            {record.deviceId && (
              <span className="text-gray-400 text-xs ml-1 font-mono">
                (ID: {record.deviceId})
              </span>
            )}
            <ExternalLink size={12} className="inline ml-1" />
          </a>
        );
      },
    },
    {
      title: '操作IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 130,
      render: (ip) => (
        <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
          {ip}
        </span>
      ),
    },
    {
      title: '操作人',
      key: 'operator',
      width: 140,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Avatar size={24} className="bg-primary-500" icon={<User size={12} />} />
          <span className="text-gray-700 font-medium text-sm">{record.operator}</span>
        </div>
      ),
    },
    {
      title: '操作详情',
      dataIndex: 'details',
      key: 'details',
      render: (text) => <span className="text-gray-600 text-sm">{text}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">告警中心</h1>
          <p className="text-gray-500 mt-1">
            共 {filteredAlerts.length} 条告警，<span className="text-danger-500 font-medium">{localUnreadCount} 条未读</span>
          </p>
        </div>
        <Space>
          <Button type="primary" onClick={handleMarkAllRead} icon={<CheckSquare size={16} />}>
            全部已读
          </Button>
          <Button onClick={() => setAuditDrawerVisible(true)} icon={<FileText size={16} />}>
            审计日志
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
                <span className="font-medium">{alertStats.critical}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-sm text-gray-600">警告</span>
                </div>
                <span className="font-medium">{alertStats.warning}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-600">提示</span>
                </div>
                <span className="font-medium">{alertStats.info}</span>
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
                      renderItem={(alert) => {
                        const processInfo = processInfoMap[alert.id];
                        return (
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
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`${!alert.read ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>{alert.deviceName}</span>
                                  <Tag color={levelColorMap[alert.level]}>
                                    {levelTextMap[alert.level]}
                                  </Tag>
                                  {alert.read ? (
                                    <>
                                      <Tag color="default" icon={<Check size={12} />}>
                                        已处理
                                      </Tag>
                                      {processInfo && (
                                        <Tag color="blue" icon={<User size={12} />}>
                                          处理人：{processInfo.handler}
                                        </Tag>
                                      )}
                                    </>
                                  ) : (
                                    <Tag color="error">
                                      未读
                                    </Tag>
                                  )}
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
                            <div className="text-right space-y-2">
                              <div className="text-sm text-gray-400">{alert.timestamp.split(' ')[1]}</div>
                              {!alert.read && (
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<Check size={12} />}
                                  onClick={(e) => handleMarkSingleRead(alert, e)}
                                >
                                  确认告警
                                </Button>
                              )}
                            </div>
                          </List.Item>
                        );
                      }}
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
            {selectedAlert && !selectedAlert.read && (
              <Button
                type="primary"
                icon={<Check size={14} />}
                onClick={() => handleMarkSingleRead(selectedAlert)}
              >
                确认告警
              </Button>
            )}
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
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Tag color={levelColorMap[selectedAlert.level]}>
                    {levelTextMap[selectedAlert.level]}
                  </Tag>
                  <Tag color={alertTypeMap[selectedAlert.type]?.color}>
                    {alertTypeMap[selectedAlert.type]?.label}
                  </Tag>
                  {selectedAlert.read ? (
                    <Tag color="default" icon={<Check size={12} />}>已处理</Tag>
                  ) : (
                    <Tag color="error">未读</Tag>
                  )}
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

              <Divider className="my-2" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800 flex items-center gap-2">
                    <FileText size={16} className="text-primary-500" />
                    操作记录
                  </h4>
                  <Button
                    type="link"
                    size="small"
                    icon={<ExternalLink size={12} />}
                    onClick={() => {
                      setDrawerVisible(false);
                      setAuditDrawerVisible(true);
                    }}
                  >
                    查看完整审计日志
                  </Button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm flex items-center gap-2">
                      <User size={14} />
                      处理人
                    </span>
                    <div className="flex items-center gap-2">
                      <Avatar size={20} className="bg-primary-500" icon={<User size={10} />} />
                      <span className="text-gray-800 font-medium">{currentUser}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm flex items-center gap-2">
                      <Clock size={14} />
                      处理时间
                    </span>
                    <span className="text-gray-800">
                      {processInfoMap[selectedAlert.id]?.handleTime || new Date().toLocaleString('zh-CN', { hour12: false })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm flex items-center gap-2">
                      <HardDrive size={14} />
                      设备ID
                    </span>
                    <span className="text-gray-800 font-mono text-sm">{selectedAlert.deviceId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm flex items-center gap-2">
                      <Globe size={14} />
                      操作IP
                    </span>
                    <span className="text-gray-800 font-mono text-sm">{generateRandomIP()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm flex items-center gap-2">
                      <Info size={14} />
                      操作类型
                    </span>
                    <Tag color="cyan">告警处置</Tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        title={
          <span className="flex items-center gap-2">
            <FileText size={18} className="text-primary-500" />
            审计日志
          </span>
        }
        placement="right"
        width={960}
        open={auditDrawerVisible}
        onClose={() => setAuditDrawerVisible(false)}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-gray-500 text-sm">共 {filteredAuditLogs.length} 条操作记录</p>
            <Space size="middle" wrap>
              <Select
                placeholder="操作类型"
                style={{ width: 160 }}
                allowClear
                value={auditFilterAction}
                onChange={setAuditFilterAction}
              >
                <Option value="查看实时画面">查看实时画面</Option>
                <Option value="开启隐私模式">开启隐私模式</Option>
                <Option value="告警处置">告警处置</Option>
                <Option value="锁定告警">锁定告警</Option>
                <Option value="解锁告警">解锁告警</Option>
                <Option value="查看告警详情">查看告警详情</Option>
                <Option value="修改设备配置">修改设备配置</Option>
                <Option value="删除告警">删除告警</Option>
                <Option value="导出录像">导出录像</Option>
                <Option value="登录系统">登录系统</Option>
                <Option value="设备分享">设备分享</Option>
              </Select>
              <Select
                placeholder="操作人"
                style={{ width: 140 }}
                allowClear
                value={auditFilterOperator}
                onChange={setAuditFilterOperator}
              >
                <Option value="张三">张三</Option>
                <Option value="李四">李四</Option>
              </Select>
              <RangePicker
                showTime
                style={{ width: 360 }}
                value={auditFilterDateRange}
                onChange={(dates) => setAuditFilterDateRange(dates as [any, any] | null)}
              />
              <Button
                onClick={() => {
                  setAuditFilterAction(undefined);
                  setAuditFilterOperator(undefined);
                  setAuditFilterDateRange(null);
                }}
              >
                重置筛选
              </Button>
            </Space>
          </div>

          <Table
            columns={auditColumns}
            dataSource={filteredAuditLogs}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        </div>
      </Drawer>
    </div>
  );
}
