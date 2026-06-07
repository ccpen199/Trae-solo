import { useEffect, useState } from 'react';
import { AlertTriangle, MapPin, Clock, CheckCircle, X, Lightbulb, Gift, Zap, TrendingUp, ArrowLeft, Bell, User, Activity } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface DeviceAlertDetail {
  id: string;
  deviceName: string;
  deviceType: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'acknowledged' | 'resolved';
  alertType: string;
  description: string;
  threshold: number;
  currentValue: number;
  unit: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
  resolvedBy?: string;
  resolutionNote?: string;
  relatedTips: { id: string; title: string; savingsPotential: number }[];
  relatedRewards: { id: string; name: string; pointsCost: number; stock: number }[];
  historicalData: { time: string; value: number }[];
}

const mockAlert: DeviceAlertDetail = {
  id: '1',
  deviceName: '生产车间空调系统',
  deviceType: 'HVAC',
  location: 'A栋3楼生产车间',
  severity: 'high',
  status: 'open',
  alertType: '设备负载率超标',
  description: '空调系统连续8小时负载率超过阈值，建议检查运行状态或调整温度设置',
  threshold: 85,
  currentValue: 92,
  unit: '%',
  createdAt: '2026-06-05T10:30:00',
  relatedTips: [
    { id: 'tip1', title: '夏季空调温度设置优化', savingsPotential: 320 },
    { id: 'tip2', title: '错峰运行空调系统', savingsPotential: 580 },
    { id: 'tip3', title: '空调滤网定期清洁', savingsPotential: 150 },
  ],
  relatedRewards: [
    { id: 'rew1', name: '智能温控器', pointsCost: 5000, stock: 50 },
    { id: 'rew2', name: '节能插座套装', pointsCost: 2000, stock: 200 },
  ],
  historicalData: [
    { time: '08:00', value: 78 },
    { time: '09:00', value: 82 },
    { time: '10:00', value: 88 },
    { time: '11:00', value: 92 },
    { time: '12:00', value: 90 },
    { time: '13:00', value: 89 },
  ],
};

export default function DeviceAlertDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [alert, setAlert] = useState<DeviceAlertDetail>(mockAlert);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showTipDetail, setShowTipDetail] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<DeviceAlertDetail>(`/energy/device-alerts/${id}`);
        if (res) setAlert(res);
      } catch {
        setAlert(mockAlert);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleAcknowledge = async () => {
    setProcessing(true);
    try {
      await api.post(`/energy/device-alerts/${id}/acknowledge`);
      setAlert(prev => ({
        ...prev,
        status: 'acknowledged',
        acknowledgedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
        acknowledgedBy: user?.realName || '当前用户',
      }));
    } catch {
      setAlert(prev => ({
        ...prev,
        status: 'acknowledged',
        acknowledgedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
        acknowledgedBy: user?.realName || '当前用户',
      }));
    } finally {
      setProcessing(false);
    }
  };

  const handleResolve = async () => {
    setProcessing(true);
    try {
      await api.post(`/energy/device-alerts/${id}/resolve`, { note: '已调整空调温度设置，负载率恢复正常' });
      setAlert(prev => ({
        ...prev,
        status: 'resolved',
        resolvedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
        resolvedBy: user?.realName || '当前用户',
        resolutionNote: '已调整空调温度设置，负载率恢复正常',
      }));
    } catch {
      setAlert(prev => ({
        ...prev,
        status: 'resolved',
        resolvedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
        resolvedBy: user?.realName || '当前用户',
        resolutionNote: '已调整空调温度设置，负载率恢复正常',
      }));
    } finally {
      setProcessing(false);
    }
  };

  const severityColor = (s: string) => {
    switch (s) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
      case 'medium': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
      default: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    }
  };

  const severityBadge = (s: string) => {
    switch (s) {
      case 'critical': return 'badge-red';
      case 'high': return 'badge-red';
      case 'medium': return 'badge-amber';
      default: return 'badge-blue';
    }
  };

  const severityLabel = (s: string) => {
    switch (s) {
      case 'critical': return '严重';
      case 'high': return '高';
      case 'medium': return '中';
      default: return '低';
    }
  };

  const statusBadge = (s: string) => {
    if (s === 'resolved') return 'badge-green';
    if (s === 'acknowledged') return 'badge-blue';
    return 'badge-red';
  };

  const statusLabel = (s: string) => {
    if (s === 'resolved') return '已解决';
    if (s === 'acknowledged') return '已确认';
    return '待处理';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-csg-navy border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
          <ArrowLeft size={20} />
        </button>
        <div className="page-header mb-0">
          <AlertTriangle size={28} className="text-csg-red" />
          <div>
            <h1 className="page-title">设备告警详情</h1>
            <p className="page-desc">查看告警详情，采取处理措施并追踪处理状态</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{alert.alertType}</h2>
                  <span className={severityBadge(alert.severity)}>{severityLabel(alert.severity)} 告警</span>
                  <span className={statusBadge(alert.status)}>{statusLabel(alert.status)}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">{alert.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs mb-1">
                  <Activity size={12} /> 设备名称
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">{alert.deviceName}</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs mb-1">
                  <MapPin size={12} /> 位置
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">{alert.location}</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs mb-1">
                  <Bell size={12} /> 阈值
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">{alert.threshold}{alert.unit}</div>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center gap-1.5 text-red-500 text-xs mb-1">
                  <Zap size={12} /> 当前值
                </div>
                <div className="font-semibold text-red-600 dark:text-red-400">{alert.currentValue}{alert.unit}</div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-csg-navy" /> 负载率趋势 (近6小时)
              </h4>
              <div className="flex items-end gap-2 h-32">
                {alert.historicalData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full rounded-t-lg bg-gradient-to-t from-csg-navy to-csg-green" style={{ height: `${d.value}%` }} />
                    <span className="text-xs text-gray-500 mt-1">{d.time}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>阈值线: {alert.threshold}%</span>
                <span className="text-csg-red">当前: {alert.currentValue}%</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock size={18} className="text-csg-navy" /> 处理时间线
            </h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
              <div className="relative pl-10 pb-6">
                <div className="absolute left-1.5 w-5 h-5 rounded-full bg-csg-green border-4 border-csg-green/30" />
                <div className="p-3 rounded-lg bg-csg-green/5 dark:bg-csg-green/10">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">告警生成</span>
                    <span className="badge-green">已完成</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">系统检测到设备负载率超过阈值</p>
                  <p className="text-xs text-gray-400 mt-1">{dayjs(alert.createdAt).format('YYYY-MM-DD HH:mm')}</p>
                </div>
              </div>
              {alert.acknowledgedAt && (
                <div className="relative pl-10 pb-6">
                  <div className="absolute left-1.5 w-5 h-5 rounded-full bg-blue-500 border-4 border-blue-500/30" />
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">已确认告警</span>
                      <span className="badge-blue">已确认</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <User size={12} className="inline mr-1" /> {alert.acknowledgedBy} 已确认收到告警
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{dayjs(alert.acknowledgedAt).format('YYYY-MM-DD HH:mm')}</p>
                  </div>
                </div>
              )}
              {alert.resolvedAt && (
                <div className="relative pl-10 pb-0">
                  <div className="absolute left-1.5 w-5 h-5 rounded-full bg-csg-green border-4 border-csg-green/30" />
                  <div className="p-3 rounded-lg bg-csg-green/5 dark:bg-csg-green/10">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">问题已解决</span>
                      <span className="badge-green">已解决</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <User size={12} className="inline mr-1" /> {alert.resolvedBy} 处理完成
                    </p>
                    {alert.resolutionNote && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">处理说明: {alert.resolutionNote}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{dayjs(alert.resolvedAt).format('YYYY-MM-DD HH:mm')}</p>
                  </div>
                </div>
              )}
              {!alert.acknowledgedAt && (
                <div className="relative pl-10 pb-0">
                  <div className="absolute left-1.5 w-5 h-5 rounded-full bg-white dark:bg-gray-800 border-4 border-gray-300 dark:border-gray-600" />
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-500">等待处理</span>
                      <span className="badge-gray">待处理</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">请确认告警并采取处理措施</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
              {alert.status === 'open' && (
                <button
                  onClick={handleAcknowledge}
                  disabled={processing}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  {processing ? '处理中...' : '确认告警'}
                </button>
              )}
              {alert.status === 'acknowledged' && (
                <button
                  onClick={handleResolve}
                  disabled={processing}
                  className="btn-secondary flex-1 bg-csg-green hover:bg-csg-green/90 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  {processing ? '处理中...' : '标记已解决'}
                </button>
              )}
              <button onClick={() => navigate(-1)} className="btn-outline flex-1">
                返回
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Lightbulb size={18} className="text-csg-amber" /> 相关节能建议
            </h3>
            <div className="space-y-3">
              {alert.relatedTips.map((tip) => (
                <div
                  key={tip.id}
                  className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setShowTipDetail(showTipDetail === tip.id ? null : tip.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{tip.title}</p>
                      <p className="text-xs text-csg-green mt-1">
                        <TrendingUp size={10} className="inline mr-0.5" /> 预计节省 ¥{tip.savingsPotential}/年
                      </p>
                    </div>
                    <Lightbulb size={16} className="text-csg-amber flex-shrink-0" />
                  </div>
                  {showTipDetail === tip.id && (
                    <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800 text-sm text-gray-600 dark:text-gray-300">
                      <p className="mb-2">实施该建议可有效降低设备负载率，预计每年节省电费约 ¥{tip.savingsPotential}。</p>
                      <button onClick={(e) => { e.stopPropagation(); navigate('/smartlife/tips'); }} className="text-csg-green hover:underline text-xs">
                        查看详细建议 →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Gift size={18} className="text-csg-navy" /> 积分兑换推荐
            </h3>
            <div className="space-y-3">
              {alert.relatedRewards.map((reward) => (
                <div key={reward.id} className="p-3 rounded-lg bg-navy-50 dark:bg-navy-900/20 border border-navy-200 dark:border-navy-800">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{reward.name}</p>
                    <Gift size={16} className="text-csg-navy flex-shrink-0" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-csg-amber">积分: {reward.pointsCost.toLocaleString()}</span>
                    <span className="text-gray-500">库存: {reward.stock}</span>
                  </div>
                  <button
                    onClick={() => navigate('/smartlife/points')}
                    className="w-full mt-2 py-1.5 rounded-lg text-xs font-medium bg-csg-navy text-white hover:bg-csg-navy/90 transition-colors"
                  >
                    去兑换
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-csg-green/5 to-csg-green/10 border border-csg-green/20">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Zap size={18} className="text-csg-green" /> 处理奖励
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              成功处理该告警并落实节能措施，可获得 <strong className="text-csg-green">+500 积分</strong> 奖励！
            </p>
            <button
              onClick={() => navigate('/smartlife/points')}
              className="w-full py-2 rounded-lg text-sm font-medium bg-csg-green text-white hover:bg-csg-green/90 transition-colors flex items-center justify-center gap-2"
            >
              <Gift size={16} /> 查看我的积分
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
