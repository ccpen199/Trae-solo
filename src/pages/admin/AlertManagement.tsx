import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Bell,
  MessageSquare,
  Send,
  Clock,
  X,
  Phone,
  History,
} from 'lucide-react';
import { alertsApi, alertNotifyApi } from '../../api';
import type { WeatherAlert } from '../../../shared/types';
import { cn } from '../../lib/utils';

interface NotifyLog {
  id: string;
  alertId: string;
  alertTitle: string;
  method: 'sms' | 'system';
  phone?: string;
  timestamp: string;
}

export default function AlertManagement() {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [smsDialogAlertId, setSmsDialogAlertId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sendingSms, setSendingSms] = useState(false);
  const [notifyLogs, setNotifyLogs] = useState<NotifyLog[]>([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await alertsApi.getList('default');
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendSystemNotification = async (alert: WeatherAlert) => {
    try {
      await alertNotifyApi.notify(alert.id, 'system');
      const log: NotifyLog = {
        id: Date.now().toString(),
        alertId: alert.id,
        alertTitle: alert.title,
        method: 'system',
        timestamp: new Date().toISOString(),
      };
      setNotifyLogs((prev) => [log, ...prev]);
    } catch (error) {
      console.error('Failed to send system notification:', error);
    }
  };

  const handleOpenSmsDialog = (alertId: string) => {
    setSmsDialogAlertId(alertId);
    setPhoneNumber('');
  };

  const handleSendSms = async () => {
    if (!smsDialogAlertId || !phoneNumber.trim()) return;
    setSendingSms(true);
    try {
      await alertNotifyApi.notify(smsDialogAlertId, 'sms', phoneNumber);
      const alert = alerts.find((a) => a.id === smsDialogAlertId);
      const log: NotifyLog = {
        id: Date.now().toString(),
        alertId: smsDialogAlertId,
        alertTitle: alert?.title || '',
        method: 'sms',
        phone: phoneNumber,
        timestamp: new Date().toISOString(),
      };
      setNotifyLogs((prev) => [log, ...prev]);
      setSmsDialogAlertId(null);
      setPhoneNumber('');
    } catch (error) {
      console.error('Failed to send SMS alert:', error);
    } finally {
      setSendingSms(false);
    }
  };

  const getLevelBadge = (levelCode: number) => {
    const configs: Record<number, { label: string; className: string }> = {
      1: {
        label: '蓝色预警',
        className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      },
      2: {
        label: '黄色预警',
        className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      },
      3: {
        label: '橙色预警',
        className: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
      },
      4: {
        label: '红色预警',
        className: 'bg-red-500/10 text-red-400 border border-red-500/20',
      },
    };
    return configs[levelCode] || {
      label: levelCode,
      className: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    };
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-slate-700/50 rounded" />
          <div className="h-96 bg-slate-700/30 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-2">预警管理</h1>
        <p className="text-slate-400">当前活动预警与通知推送管理</p>
      </div>

      <div className="glass-card p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          活动预警
        </h2>
        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-500">暂无活动预警</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {alerts.map((alert) => {
              const levelBadge = getLevelBadge(alert.levelCode);
              return (
                <div
                  key={alert.id}
                  className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', levelBadge.className)}>
                          {levelBadge.label}
                        </span>
                        <h3 className="text-white font-medium">{alert.title}</h3>
                      </div>
                      <p className="text-slate-400 text-sm mb-3">{alert.content}</p>
                      <div className="flex items-center gap-2 text-slate-500 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        发布时间：{new Date(alert.publishTime).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenSmsDialog(alert.id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-sm rounded-lg transition-colors border border-purple-500/20"
                      >
                        <MessageSquare className="w-4 h-4" />
                        发送短信预警
                      </button>
                      <button
                        onClick={() => handleSendSystemNotification(alert)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm rounded-lg transition-colors border border-blue-500/20"
                      >
                        <Bell className="w-4 h-4" />
                        发送系统通知
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <History className="w-6 h-6 text-cyan-400" />
          通知发送记录
        </h2>
        {notifyLogs.length === 0 ? (
          <div className="text-center py-12">
            <Send className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-500">暂无通知记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">预警标题</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">通知方式</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">手机号</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">发送时间</th>
                </tr>
              </thead>
              <tbody>
                {notifyLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4">
                      <span className="text-white font-medium">{log.alertTitle}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                        log.method === 'sms'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      )}>
                        {log.method === 'sms' ? (
                          <><MessageSquare className="w-3 h-3" /> 短信</>
                        ) : (
                          <><Bell className="w-3 h-3" /> 系统通知</>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-slate-300 text-sm">{log.phone || '-'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-slate-400 text-sm flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(log.timestamp).toLocaleString('zh-CN')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {smsDialogAlertId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Phone className="w-5 h-5 text-purple-400" />
                发送短信预警
              </h3>
              <button
                onClick={() => setSmsDialogAlertId(null)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm block mb-2">手机号码</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="请输入手机号码"
                  className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSmsDialogAlertId(null)}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSendSms}
                disabled={!phoneNumber.trim() || sendingSms}
                className="flex-1 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingSms ? '发送中...' : '确认发送'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
