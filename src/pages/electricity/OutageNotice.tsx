import { useEffect, useState } from 'react';
import { AlertTriangle, X, MapPin, Clock, CheckCircle, Bell, Users, Info } from 'lucide-react';
import dayjs from 'dayjs';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface Outage {
  id: string;
  title: string;
  area: string;
  reason: string;
  startTime: string;
  endTime: string;
  status: 'planned' | 'emergency' | 'restored';
  affectedUsers: number;
  notifiedUsers: number;
}

interface Acknowledgement {
  id: string;
  outageId: string;
  userId: string;
  acknowledgedAt: string;
}

const mockOutages: Outage[] = [
  { id: '1', title: '天河区计划检修停电通知', area: '广州市天河区珠江新城', reason: '线路检修维护', startTime: '2026-06-10T08:00:00', endTime: '2026-06-10T18:00:00', status: 'planned', affectedUsers: 3500, notifiedUsers: 1280 },
  { id: '2', title: '南山区紧急停电通知', area: '深圳市南山区科技园', reason: '设备故障抢修', startTime: '2026-06-05T14:00:00', endTime: '2026-06-05T20:00:00', status: 'emergency', affectedUsers: 1200, notifiedUsers: 856 },
  { id: '3', title: '禅城区停电恢复通知', area: '佛山市禅城区祖庙街道', reason: '变压器更换', startTime: '2026-05-28T09:00:00', endTime: '2026-05-28T16:00:00', status: 'restored', affectedUsers: 2800, notifiedUsers: 2100 },
  { id: '4', title: '黄埔区计划检修停电通知', area: '广州市黄埔区开发大道', reason: '配网改造升级', startTime: '2026-06-15T07:00:00', endTime: '2026-06-15T17:00:00', status: 'planned', affectedUsers: 4200, notifiedUsers: 1560 },
  { id: '5', title: '龙华区紧急停电通知', area: '深圳市龙华区民治街道', reason: '雷击线路跳闸', startTime: '2026-06-06T10:00:00', endTime: '2026-06-06T22:00:00', status: 'emergency', affectedUsers: 5600, notifiedUsers: 3200 },
  { id: '6', title: '顺德区停电恢复通知', area: '佛山市顺德区大良街道', reason: '线路老化更换', startTime: '2026-05-20T08:00:00', endTime: '2026-05-20T14:00:00', status: 'restored', affectedUsers: 1900, notifiedUsers: 1450 },
];

export default function OutageNotice() {
  const { user } = useAuthStore();
  const [outages, setOutages] = useState<Outage[]>(mockOutages);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Outage | null>(null);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<Outage[]>('/electricity/outages');
        const normalized = Array.isArray(res) ? res.map(normalizeOutage) : mockOutages;
        setOutages(normalized);
        
        const ackRes = await api.get<Acknowledgement[]>('/electricity/outages/acknowledgements');
        if (Array.isArray(ackRes)) {
          setAcknowledged(new Set(ackRes.map(a => String(a.outageId))));
        }
      } catch {
        setOutages(mockOutages);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  function normalizeOutage(row: any): Outage {
    return {
      id: String(row.id),
      title: String(row.title),
      area: String(row.area),
      reason: String(row.reason || ''),
      startTime: String(row.startTime || row.start_time || ''),
      endTime: String(row.endTime || row.end_time || ''),
      status: (row.status as any) || 'planned',
      affectedUsers: Number(row.affectedUsers || row.affected_users || 0),
      notifiedUsers: Number(row.notifiedUsers || row.notified_users || 0),
    };
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleAcknowledge = async (outageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (acknowledged.has(outageId)) return;
    
    setAcknowledging(outageId);
    try {
      await api.post(`/electricity/outages/${outageId}/acknowledge`);
      setAcknowledged(prev => new Set(prev).add(outageId));
      setOutages(prev => prev.map(o => 
        o.id === outageId ? { ...o, notifiedUsers: o.notifiedUsers + 1 } : o
      ));
      showToast('已确认收到停电通知');
    } catch (err: any) {
      showToast(err.message || '确认失败，请重试', 'error');
    } finally {
      setAcknowledging(null);
    }
  };

  const statusBadge = (s: string) =>
    s === 'emergency' ? 'badge-red' : s === 'planned' ? 'badge-amber' : 'badge-green';
  const statusLabel = (s: string) =>
    s === 'emergency' ? '紧急' : s === 'planned' ? '计划中' : '已恢复';

  const filtered = statusFilter === 'all' 
    ? outages 
    : outages.filter(o => o.status === statusFilter);

  const stats = {
    total: outages.length,
    planned: outages.filter(o => o.status === 'planned').length,
    emergency: outages.filter(o => o.status === 'emergency').length,
    restored: outages.filter(o => o.status === 'restored').length,
    unacknowledged: outages.filter(o => !acknowledged.has(o.id) && o.status !== 'restored').length,
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-csg-navy border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-csg-green text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <AlertTriangle size={28} className="text-csg-amber" />
        <div>
          <h1 className="page-title">停电通知</h1>
          <p className="page-desc">查看当前及计划停电信息，确认签收获取最新动态</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4 bg-gradient-to-br from-csg-navy/5 to-csg-navy/10">
          <div className="text-2xl font-bold text-csg-navy">{stats.total}</div>
          <div className="text-xs text-gray-500">全部通知</div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
          <div className="text-2xl font-bold text-amber-600">{stats.planned}</div>
          <div className="text-xs text-gray-500">计划停电</div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-red-500/5 to-red-500/10">
          <div className="text-2xl font-bold text-red-600">{stats.emergency}</div>
          <div className="text-xs text-gray-500">紧急停电</div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-csg-green/5 to-csg-green/10">
          <div className="text-2xl font-bold text-csg-green">{stats.restored}</div>
          <div className="text-xs text-gray-500">已恢复</div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
          <div className="text-2xl font-bold text-purple-600">{stats.unacknowledged}</div>
          <div className="text-xs text-gray-500">待确认</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'planned', 'emergency', 'restored'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm ${
              statusFilter === s
                ? 'bg-csg-navy text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {s === 'all' ? '全部' : statusLabel(s)}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filtered.map((o) => {
          const isAck = acknowledged.has(o.id);
          const isRestored = o.status === 'restored';
          const ackRate = o.affectedUsers > 0 ? ((o.notifiedUsers / o.affectedUsers) * 100).toFixed(1) : 0;
          
          return (
            <div
              key={o.id}
              className="card p-5 cursor-pointer hover:shadow-md transition-shadow relative"
              onClick={() => setSelected(o)}
            >
              {isAck && (
                <div className="absolute top-3 right-3 flex items-center gap-1 text-csg-green text-xs">
                  <CheckCircle size={14} />
                  <span>已确认</span>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-20">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white">{o.title}</span>
                    <span className={statusBadge(o.status)}>{statusLabel(o.status)}</span>
                    {o.status === 'emergency' && (
                      <span className="animate-pulse flex items-center gap-1 text-red-500 text-xs">
                        <Bell size={12} />
                        紧急
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <MapPin size={14} />
                    <span>{o.area}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Clock size={14} />
                    <span>
                      {dayjs(o.startTime).format('YYYY-MM-DD HH:mm')} ~ {dayjs(o.endTime).format('YYYY-MM-DD HH:mm')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      影响 {o.affectedUsers.toLocaleString()} 户
                    </span>
                    <span className="flex items-center gap-1">
                      <Bell size={12} />
                      已通知 {o.notifiedUsers.toLocaleString()} 户 ({ackRate}%)
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!isRestored && !isAck ? (
                    <button
                      onClick={(e) => handleAcknowledge(o.id, e)}
                      disabled={acknowledging === o.id}
                      className="btn-primary text-sm whitespace-nowrap flex items-center gap-1.5"
                    >
                      {acknowledging === o.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      {acknowledging === o.id ? '确认中...' : '确认签收'}
                    </button>
                  ) : isRestored ? (
                    <span className="text-xs text-csg-green font-medium">供电已恢复</span>
                  ) : (
                    <span className="text-xs text-csg-green font-medium">已确认签收</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <AlertTriangle size={48} className="mx-auto text-csg-green mb-3" />
          <p className="text-gray-500 dark:text-gray-400">当前没有{statusFilter !== 'all' ? statusLabel(statusFilter) : ''}停电通知</p>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selected.title}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={statusBadge(selected.status)}>{statusLabel(selected.status)}</span>
                {acknowledged.has(selected.id) && (
                  <span className="badge-green flex items-center gap-1">
                    <CheckCircle size={12} />
                    已确认
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">影响区域</span>
                  <div className="text-gray-900 dark:text-white font-medium flex items-center gap-1.5 mt-1">
                    <MapPin size={14} className="text-csg-navy" />
                    {selected.area}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">停电原因</span>
                  <div className="text-gray-900 dark:text-white font-medium mt-1">{selected.reason}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">开始时间</span>
                  <div className="text-gray-900 dark:text-white font-medium flex items-center gap-1.5 mt-1">
                    <Clock size={14} className="text-csg-amber" />
                    {dayjs(selected.startTime).format('YYYY-MM-DD HH:mm')}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">预计恢复</span>
                  <div className="text-gray-900 dark:text-white font-medium flex items-center gap-1.5 mt-1">
                    <Clock size={14} className="text-csg-green" />
                    {dayjs(selected.endTime).format('YYYY-MM-DD HH:mm')}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">影响用户</span>
                  <div className="text-gray-900 dark:text-white font-medium flex items-center gap-1.5 mt-1">
                    <Users size={14} className="text-purple-500" />
                    {selected.affectedUsers.toLocaleString()} 户
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">已通知用户</span>
                  <div className="text-gray-900 dark:text-white font-medium flex items-center gap-1.5 mt-1">
                    <Bell size={14} className="text-blue-500" />
                    {selected.notifiedUsers.toLocaleString()} 户
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-csg-navy mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <p className="font-medium mb-1">温馨提示：</p>
                    <ul className="space-y-1 text-xs">
                      <li>• 请提前做好停电准备，关闭不必要的电器设备</li>
                      <li>• 保存电脑重要数据，避免数据丢失</li>
                      <li>• 注意用电安全，恢复供电后检查设备状态</li>
                      <li>• 如有紧急情况，请拨打 95598 服务热线</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-csg-green/5 to-csg-green/10 rounded-lg border border-csg-green/20">
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-300">预计停电时长：</span>
                  <span className="font-bold text-csg-green ml-2">
                    {dayjs(selected.endTime).diff(dayjs(selected.startTime), 'hour')} 小时 
                    ({dayjs(selected.endTime).diff(dayjs(selected.startTime), 'minute')} 分钟)
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setSelected(null)} className="btn-outline flex-1">关闭</button>
                {selected.status !== 'restored' && !acknowledged.has(selected.id) && (
                  <button
                    onClick={(e) => handleAcknowledge(selected.id, e as any)}
                    disabled={acknowledging === selected.id}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {acknowledging === selected.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    {acknowledging === selected.id ? '确认中...' : '确认签收'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
