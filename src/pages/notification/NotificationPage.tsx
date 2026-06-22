import { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  FileText,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Shield,
  MessageSquare,
  Settings,
  ChevronRight,
  Loader2,
  Newspaper,
  Activity,
  Repeat,
} from 'lucide-react';
import { notificationApi } from '@/services/api';
import { formatDateTime, formatRelativeTime, getStatusText, getStatusColor } from '@/utils/format';
import type { Notification, RemoteRecordStatus } from '@shared/types';

type TabType = 'all' | 'treatment_abnormal' | 'policy' | 'system';

const tabItems: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: '全部', icon: <Bell className="w-4 h-4" /> },
  { key: 'treatment_abnormal', label: '待遇异常', icon: <AlertTriangle className="w-4 h-4" /> },
  { key: 'policy', label: '政策更新', icon: <Newspaper className="w-4 h-4" /> },
  { key: 'system', label: '系统通知', icon: <Settings className="w-4 h-4" /> },
];

interface PolicyTimelineItem {
  id: string;
  title: string;
  date: string;
  content: string;
  type: 'new' | 'update' | 'reminder';
}

const policyTimeline: PolicyTimelineItem[] = [
  {
    id: '1',
    title: '2026年度医保缴费标准调整',
    date: '2026-06-20',
    content: '自2026年7月1日起，职工医保缴费比例调整为单位8%，个人2%',
    type: 'update',
  },
  {
    id: '2',
    title: '新增12种慢特病纳入医保支付范围',
    date: '2026-06-15',
    content: '肺动脉高压、阿尔茨海默病等12种疾病纳入慢特病管理',
    type: 'new',
  },
  {
    id: '3',
    title: '异地就医备案提醒',
    date: '2026-06-10',
    content: '跨省异地就医需提前办理备案手续，未备案报销比例降低20%',
    type: 'reminder',
  },
  {
    id: '4',
    title: '门诊共济保障改革实施',
    date: '2026-06-01',
    content: '个人账户家庭共济功能正式上线，可用于支付配偶、子女、父母医疗费用',
    type: 'new',
  },
  {
    id: '5',
    title: '药品集中采购降价通知',
    date: '2026-05-25',
    content: '第四批国家组织药品集中采购中选结果落地执行，平均降价56%',
    type: 'update',
  },
];

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'treatment_abnormal',
    title: '医保待遇异常预警',
    content: '您的职工医保缴费已中断3个月，可能影响医保待遇享受，请及时补缴。',
    level: 'warning',
    read: false,
    createdAt: '2026-06-20T10:30:00',
    retryable: true,
  },
  {
    id: '2',
    type: 'treatment_abnormal',
    title: '异地就医备案失败',
    content: '您在上海市第一人民医院的异地就医备案失败，请检查备案信息是否正确。',
    level: 'error',
    read: false,
    createdAt: '2026-06-19T15:20:00',
    actionUrl: '/remote-record',
    retryable: true,
  },
  {
    id: '3',
    type: 'policy',
    title: '医保政策更新',
    content: '2026年度医保缴费基数上下限已调整，上限为31086元/月，下限为6217元/月。',
    level: 'info',
    read: true,
    createdAt: '2026-06-18T09:00:00',
  },
  {
    id: '4',
    type: 'system',
    title: '系统升级通知',
    content: '医保信息系统将于6月25日22:00-次日6:00进行升级维护，期间暂停服务。',
    level: 'warning',
    read: true,
    createdAt: '2026-06-17T16:45:00',
  },
  {
    id: '5',
    type: 'treatment_abnormal',
    title: '个人账户余额不足提醒',
    content: '您的医保个人账户余额已不足100元，请注意后续就医结算方式。',
    level: 'info',
    read: true,
    createdAt: '2026-06-16T11:20:00',
  },
  {
    id: '6',
    type: 'policy',
    title: '慢特病报销比例提高',
    content: '自7月1日起，慢特病门诊报销比例由70%提高至80%，年度限额提高至15万元。',
    level: 'info',
    read: true,
    createdAt: '2026-06-15T08:30:00',
  },
  {
    id: '7',
    type: 'record_failure',
    title: '就医记录同步失败',
    content: '您在南京市鼓楼医院的门诊记录同步失败，已自动重试2次，可点击手动重试。',
    level: 'error',
    read: false,
    createdAt: '2026-06-14T14:10:00',
    retryable: true,
  },
  {
    id: '8',
    type: 'system',
    title: '电子票据上线通知',
    content: '医保电子票据功能已正式上线，您可在支付记录中下载查看。',
    level: 'info',
    read: true,
    createdAt: '2026-06-13T10:00:00',
  },
];

const mockRemoteStatus: RemoteRecordStatus[] = [
  {
    id: '1',
    status: 'success',
    area: '上海市',
    hospital: '上海市第一人民医院',
    attemptCount: 3,
    nextRetryAt: undefined,
  },
  {
    id: '2',
    status: 'failed',
    area: '北京市',
    hospital: '北京协和医院',
    attemptCount: 3,
    nextRetryAt: '2026-06-22T10:00:00',
    errorMessage: '医院接口返回数据格式异常',
  },
  {
    id: '3',
    status: 'pending',
    area: '浙江省杭州市',
    hospital: '浙江大学医学院附属第一医院',
    attemptCount: 1,
    nextRetryAt: '2026-06-21T16:00:00',
  },
  {
    id: '4',
    status: 'failed',
    area: '广东省广州市',
    hospital: '中山大学附属第一医院',
    attemptCount: 2,
    nextRetryAt: '2026-06-21T20:00:00',
    errorMessage: '网络连接超时',
  },
];

function NotificationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [remoteStatus, setRemoteStatus] = useState<RemoteRecordStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryingRemoteId, setRetryingRemoteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = activeTab === 'all' ? undefined : { type: activeTab };
        const [notifRes, remoteRes] = await Promise.all([
          notificationApi.getList(params),
          notificationApi.getRemoteRecordStatus(),
        ]);
        setNotifications(notifRes.data.list);
        setRemoteStatus(remoteRes.data);
      } catch (error) {
        console.error('Failed to fetch notification data:', error);
        setNotifications(mockNotifications);
        setRemoteStatus(mockRemoteStatus);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    return n.type === activeTab;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <Info className="w-5 h-5 text-insurance-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-danger-500" />;
      default:
        return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'info':
        return 'bg-insurance-50 border-insurance-100';
      case 'warning':
        return 'bg-warning-500/10 border-warning-500/20';
      case 'error':
        return 'bg-danger-500/10 border-danger-500/20';
      default:
        return 'bg-slate-50 border-slate-100';
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'info':
        return <span className="badge-info">信息</span>;
      case 'warning':
        return <span className="badge-warning">警告</span>;
      case 'error':
        return <span className="badge-danger">错误</span>;
      default:
        return <span className="badge">未知</span>;
    }
  };

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      await notificationApi.retry(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, level: 'info' as const, title: n.title + '（已重试）' } : n
        )
      );
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setRetryingId(null);
    }
  };

  const handleRetryRemote = async (id: string) => {
    setRetryingRemoteId(id);
    try {
      await notificationApi.retryRemoteRecord(id);
      setRemoteStatus((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: 'pending' as const, attemptCount: r.attemptCount + 1 } : r
        )
      );
    } catch (error) {
      console.error('Remote retry failed:', error);
    } finally {
      setRetryingRemoteId(null);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const getPolicyTypeIcon = (type: string) => {
    switch (type) {
      case 'new':
        return <span className="w-2 h-2 rounded-full bg-medical-500" />;
      case 'update':
        return <span className="w-2 h-2 rounded-full bg-insurance-500" />;
      case 'reminder':
        return <span className="w-2 h-2 rounded-full bg-warning-500" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="skeleton h-12 rounded-xl" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton h-28 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="skeleton h-64 rounded-2xl" />
            <div className="skeleton h-96 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">消息中心</h1>
          <p className="text-slate-500 mt-1">查看医保待遇异常提醒和政策更新通知</p>
        </div>
        {unreadCount > 0 && (
          <span className="badge-danger flex items-center gap-1">
            <Bell className="w-4 h-4" />
            {unreadCount} 条未读
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              {tabItems.map((tab) => {
                const tabUnread = notifications.filter(
                  (n) => !n.read && (tab.key === 'all' || n.type === tab.key)
                ).length;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`tab-item flex items-center gap-2 whitespace-nowrap ${
                      activeTab === tab.key ? 'tab-item-active' : ''
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {tabUnread > 0 && (
                      <span className="w-5 h-5 rounded-full bg-danger-500 text-white text-xs flex items-center justify-center">
                        {tabUnread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                  className={`card p-5 border-l-4 transition-all cursor-pointer ${
                    notification.read
                      ? 'border-l-slate-200 opacity-75'
                      : notification.level === 'error'
                      ? 'border-l-danger-500'
                      : notification.level === 'warning'
                      ? 'border-l-warning-500'
                      : 'border-l-insurance-500'
                  } hover:shadow-card-hover`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getLevelBg(
                        notification.level
                      )}`}
                    >
                      {getLevelIcon(notification.level)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-insurance-500 flex-shrink-0" />
                          )}
                          <h4 className="font-semibold text-slate-900">{notification.title}</h4>
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                        {notification.content}
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        {getLevelBadge(notification.level)}
                        {notification.retryable && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetry(notification.id);
                            }}
                            disabled={retryingId === notification.id}
                            className="btn-secondary py-1.5 px-3 text-sm flex items-center gap-1.5"
                          >
                            {retryingId === notification.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                重试中...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4" />
                                重试
                              </>
                            )}
                          </button>
                        )}
                        {notification.actionUrl && (
                          <button className="text-sm text-insurance-600 hover:text-insurance-700 flex items-center gap-1">
                            查看详情
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-12 text-center">
                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">暂无符合条件的消息</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="section-title flex items-center gap-2">
              <MapPin className="w-5 h-5 text-insurance-500" />
              异地就医备案状态
            </h3>
            <div className="space-y-3">
              {remoteStatus.map((status) => (
                <div
                  key={status.id}
                  className="p-4 rounded-xl border border-slate-100 hover:border-insurance-200 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-insurance-500" />
                        <span className="font-medium text-slate-900">{status.area}</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{status.hospital}</p>
                    </div>
                    <span className={getStatusColor(status.status)}>
                      {getStatusText(status.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>已尝试 {status.attemptCount} 次</span>
                    {status.nextRetryAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        下次重试：{formatDateTime(status.nextRetryAt)}
                      </span>
                    )}
                  </div>
                  {status.errorMessage && (
                    <p className="text-xs text-danger-600 mt-2 bg-danger-500/10 p-2 rounded">
                      {status.errorMessage}
                    </p>
                  )}
                  {status.status === 'failed' && (
                    <button
                      onClick={() => handleRetryRemote(status.id)}
                      disabled={retryingRemoteId === status.id}
                      className="w-full mt-3 btn-secondary py-2 text-sm flex items-center justify-center gap-2"
                    >
                      {retryingRemoteId === status.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          重试中...
                        </>
                      ) : (
                        <>
                          <Repeat className="w-4 h-4" />
                          手动重试
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="section-title flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-insurance-500" />
              政策推送时间线
            </h3>
            <div className="relative">
              {policyTimeline.map((item, index) => (
                <div key={item.id} className="relative pb-6 last:pb-0">
                  {index < policyTimeline.length - 1 && (
                    <div
                      className="absolute left-4 top-6 w-0.5 h-full bg-slate-200"
                    />
                  )}
                  <div className="flex gap-4">
                    <div className="relative z-10 w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                      {getPolicyTypeIcon(item.type)}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-900">{item.title}</h4>
                        <span className="text-xs text-slate-400">
                          {formatRelativeTime(item.date)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{item.content}</p>
                      <span
                        className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                          item.type === 'new'
                            ? 'bg-medical-100 text-medical-700'
                            : item.type === 'update'
                            ? 'bg-insurance-100 text-insurance-700'
                            : 'bg-warning-500/10 text-warning-600'
                        }`}
                      >
                        {item.type === 'new' ? '新政' : item.type === 'update' ? '更新' : '提醒'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-insurance-50 to-white">
            <h3 className="section-title mb-4 text-insurance-700">
              <Shield className="w-5 h-5 inline-block mr-2" />
              安全提示
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <Activity className="w-4 h-4 text-insurance-500 mt-0.5 flex-shrink-0" />
                请勿在陌生设备上自动登录您的医保账户
              </li>
              <li className="flex items-start gap-2">
                <Activity className="w-4 h-4 text-insurance-500 mt-0.5 flex-shrink-0" />
                医保电子凭证仅限本人使用，请勿转借他人
              </li>
              <li className="flex items-start gap-2">
                <Activity className="w-4 h-4 text-insurance-500 mt-0.5 flex-shrink-0" />
                警惕以医保名义要求转账汇款的诈骗电话
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationPage;
