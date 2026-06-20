import { useEffect, useState } from 'react';
import {
  User, MapPin, Phone, Star, Award, CheckCircle, Clock, Briefcase,
  DollarSign, Calendar, Navigation, ChevronRight, Handshake
} from 'lucide-react';
import type { InterviewOrder, Broker } from '@shared/types';
import { cn } from '@/lib/utils';

const mockBroker: Broker = {
  id: 'B001', name: '张伟', phone: '138****8888', bindRegion: '苏州工业园',
  serviceRating: 4.9, orderWeight: 95, totalOrders: 268, completedOrders: 245,
  tags: ['金牌经纪人', '接单王', '工人好评'],
};

interface PendingOrder extends InterviewOrder {
  distanceKm: number;
  workerAvatar?: string;
  workerCreditScore: number;
  workerSkills: string[];
}

const mockPendingOrders: PendingOrder[] = [
  { id: 'ORD101', workerId: 'W01', workerName: '刘铁柱', workerPhone: '139****1111', workerCreditScore: 88, workerSkills: ['电子装配', '电焊'],
    jobId: 'J01', jobTitle: '电子装配工', factoryId: 'F01', factoryName: '立讯精密', scheduledDate: '2026-06-19',
    status: 'pending', distanceKm: 3.2, serviceFee: 180, timeline: [], createdAt: '2026-06-19T06:30:00Z', pickupInfo: { carPlate: '苏E·88888', driverName: '王师傅', driverPhone: '137****2222', pickupTime: '07:30', pickupPoint: '苏州园区地铁站1号口' },
  },
  { id: 'ORD102', workerId: 'W02', workerName: '孙大伟', workerPhone: '136****3333', workerCreditScore: 76, workerSkills: ['叉车驾驶'],
    jobId: 'J02', jobTitle: '叉车司机', factoryId: 'F02', factoryName: '顺丰仓储', scheduledDate: '2026-06-19',
    status: 'pending', distanceKm: 8.5, serviceFee: 240, timeline: [], createdAt: '2026-06-19T06:45:00Z', pickupInfo: { carPlate: '苏E·88888', driverName: '王师傅', driverPhone: '137****2222', pickupTime: '08:00', pickupPoint: '东环路大润发门口' },
  },
  { id: 'ORD103', workerId: 'W03', workerName: '钱小花', workerPhone: '135****4444', workerCreditScore: 92, workerSkills: ['品检', '质量检验'],
    jobId: 'J03', jobTitle: '品检员', factoryId: 'F03', factoryName: '富士康科技', scheduledDate: '2026-06-19',
    status: 'pending', distanceKm: 5.8, serviceFee: 160, timeline: [], createdAt: '2026-06-19T07:00:00Z', pickupInfo: { carPlate: '苏E·88888', driverName: '王师傅', driverPhone: '137****2222', pickupTime: '08:30', pickupPoint: '钟南街邻里中心' },
  },
  { id: 'ORD104', workerId: 'W04', workerName: '赵德胜', workerPhone: '134****5555', workerCreditScore: 68, workerSkills: [],
    jobId: 'J04', jobTitle: '包装工', factoryId: 'F04', factoryName: '宝洁日化', scheduledDate: '2026-06-19',
    status: 'pending', distanceKm: 12.3, serviceFee: 200, timeline: [], createdAt: '2026-06-19T07:15:00Z', pickupInfo: { carPlate: '苏E·88888', driverName: '王师傅', driverPhone: '137****2222', pickupTime: '09:00', pickupPoint: '唯亭镇政府公交站' },
  },
];

interface TodayTask { time: string; type: 'pickup' | 'document' | 'training' | 'interview' | 'result'; title: string; factoryName: string; workerName: string; location: string; completed: boolean; note?: string; }

const todayTasks: TodayTask[] = [
  { time: '07:30', type: 'pickup', title: '车接车送', factoryName: '立讯精密', workerName: '刘铁柱等3人', location: '地铁1号线钟南街站', completed: true },
  { time: '08:30', type: 'pickup', title: '车接车送', factoryName: '富士康科技', workerName: '钱小花等5人', location: '东环路公交站', completed: true },
  { time: '09:30', type: 'document', title: '证件复印办理', factoryName: '立讯精密', workerName: '刘铁柱', location: '工厂行政楼201室', completed: true, note: '身份证+学历证共6份' },
  { time: '10:30', type: 'training', title: '岗前培训签到', factoryName: '立讯精密', workerName: '刘铁柱等3人', location: '培训中心A教室', completed: false, note: 'EHS安全+岗位技能' },
  { time: '13:30', type: 'interview', title: '带工人面试', factoryName: '顺丰仓储', workerName: '孙大伟', location: 'HR会议室', completed: false },
  { time: '15:00', type: 'result', title: '确认面试结果', factoryName: '宝洁日化', workerName: '赵德胜', location: '前台等候区', completed: false },
  { time: '16:30', type: 'document', title: '入职手续办理', factoryName: '立讯精密', workerName: '刘铁柱等3人', location: '行政服务中心', completed: false, note: '预计3人全部通过' },
];

function getTaskStyle(type: string) {
  return {
    pickup: { bg: 'bg-success-50', border: 'border-success-300', text: 'text-success-700', icon: Navigation, dot: 'bg-success-500', label: '车接车送' },
    document: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', icon: FileIcon, dot: 'bg-blue-500', label: '证件办理' },
    training: { bg: 'bg-warning-50', border: 'border-warning-300', text: 'text-warning-700', icon: Award, dot: 'bg-warning-500', label: '培训签到' },
    interview: { bg: 'bg-brand-50', border: 'border-brand-300', text: 'text-brand-700', icon: Handshake, dot: 'bg-brand-500', label: '陪同面试' },
    result: { bg: 'bg-accent-50', border: 'border-accent-300', text: 'text-accent-700', icon: CheckCircle, dot: 'bg-accent-500', label: '结果确认' },
  }[type] || { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', icon: Clock, dot: 'bg-gray-500', label: type };
}

function FileIcon(props: { className?: string }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>; }

function getScoreColor(s: number) {
  if (s >= 85) return 'text-success-600 bg-success-50';
  if (s >= 70) return 'text-blue-600 bg-blue-50';
  if (s >= 55) return 'text-warning-600 bg-warning-50';
  return 'text-danger-600 bg-danger-50';
}

export default function BrokerDashboard() {
  const [broker, setBroker] = useState<Broker | null>(null);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TodayTask[]>(todayTasks);

  useEffect(() => {
    fetch('/api/brokers/B001')
      .then(r => r.json())
      .then(res => { if (res.success) setBroker(res.data); else setBroker(mockBroker); })
      .catch(() => setBroker(mockBroker));
    setPendingOrders(mockPendingOrders);
  }, []);

  const acceptOrder = async (orderId: string) => {
    setAcceptingId(orderId);
    try {
      const res = await fetch(`/api/interviews/${orderId}/assign-broker`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brokerId: broker?.id || 'B001' }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingOrders(prev => prev.filter(o => o.id !== orderId));
      }
    } catch {
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
    }
    setAcceptingId(null);
  };

  const completeTask = (idx: number) => {
    setTasks(prev => prev.map((t, i) => i === idx ? { ...t, completed: true } : t));
  };

  const completed = tasks.filter(t => t.completed).length;
  const totalEarning = tasks.filter(t => t.completed).length * 50 + 1280;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">经纪人工作台</h1>
        <p className="text-gray-500 text-sm mt-1">欢迎回来，高效接单，服务至上 · 2026年6月19日</p>
      </div>

      <div className="card p-6 mb-5 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute right-32 bottom-0 w-40 h-40 rounded-full bg-accent-500/20 translate-y-1/2" />
        <div className="relative flex flex-col lg:flex-row gap-6 items-start lg:items-center">
          <div className="flex items-center gap-5 shrink-0">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-3xl font-bold border-4 border-white/20 shadow-lg">
                {broker?.name?.charAt(0) || '张'}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-accent-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow">VIP</div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold">{broker?.name || '张伟'}</h2>
                {broker?.tags?.slice(0, 2).map((t, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">{t}</span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-white/80 text-sm">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{broker?.phone || '138****8888'}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />负责区域：{broker?.bindRegion || '苏州工业园'}</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <svg key={i} className={cn('w-5 h-5', i <= Math.floor(broker?.serviceRating || 4.9) ? 'text-yellow-400 fill-yellow-400' : 'text-white/30')} viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
                <span className="text-sm ml-1 font-medium">{broker?.serviceRating || 4.9} 服务评分</span>
                <span className="mx-2 text-white/30">|</span>
                <span className="inline-flex items-center gap-1 text-sm">
                  <Award className="w-4 h-4 text-accent-400" />接单权重 <b className="text-accent-300">{broker?.orderWeight || 95}</b>
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full grid grid-cols-3 gap-3 lg:ml-6 lg:border-l lg:border-white/10 lg:pl-6">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1 text-white/70 text-xs"><CheckCircle className="w-3.5 h-3.5" />本月已完成</div>
              <div className="text-3xl font-bold">{broker?.completedOrders || 24}</div>
              <div className="text-xs text-white/60 mt-0.5">单</div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1 text-white/70 text-xs"><Clock className="w-3.5 h-3.5" />进行中</div>
              <div className="text-3xl font-bold">{tasks.length - completed}</div>
              <div className="text-xs text-white/60 mt-0.5">单 · 今日</div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-accent-500/80 to-accent-600/80 backdrop-blur-sm border border-accent-400/30 p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1 text-white/90 text-xs"><DollarSign className="w-3.5 h-3.5" />本月总收入</div>
              <div className="text-3xl font-bold">¥{totalEarning.toLocaleString()}</div>
              <div className="text-xs text-white/70 mt-0.5">服务费+奖励</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title"><Briefcase className="w-5 h-5 text-accent-600" /> 待接订单池（{pendingOrders.length}）</h3>
            <button className="text-sm text-brand-600 hover:underline flex items-center gap-1">
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {pendingOrders.length === 0 && (
              <div className="py-16 text-center text-gray-400">
                <Handshake className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无新订单，继续加油！</p>
              </div>
            )}
            {pendingOrders.map(o => (
              <div key={o.id} className="rounded-xl border border-gray-100 p-4 hover:border-brand-200 hover:shadow-soft transition-all">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-lg">
                        {o.workerName.charAt(0)}
                      </div>
                      <div className={cn('absolute -bottom-1 -right-1 text-[10px] font-bold rounded-md px-1.5 py-0.5 shadow', getScoreColor(o.workerCreditScore))}>{o.workerCreditScore}分</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-gray-900">{o.workerName}</span>
                        <span className="text-xs text-gray-400">{o.workerPhone}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-brand-600 font-medium">{o.factoryName}</span>
                        <span className="mx-1 text-gray-300">·</span>
                        <span className="text-accent-600 font-medium">{o.jobTitle}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {o.workerSkills.map(s => <span key={s} className="tag border-brand-200 bg-brand-50 text-brand-600 text-[10px]">{s}</span>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-end lg:items-end gap-3 lg:gap-2 shrink-0 w-full lg:w-auto">
                    <div className="flex items-center gap-4 lg:gap-6 justify-between sm:justify-end">
                      <div className="flex items-center gap-1 text-xs text-gray-500"><Navigation className="w-3.5 h-3.5" />距您{o.distanceKm}km</div>
                      <div className="text-xl font-bold text-accent-600">¥{o.serviceFee}<span className="text-xs font-normal text-gray-400 ml-0.5">服务费</span></div>
                    </div>
                    <button
                      onClick={() => acceptOrder(o.id)}
                      disabled={acceptingId === o.id}
                      className={cn(
                        'btn-accent justify-center py-2 px-6 text-sm gap-1.5 transition-all',
                        acceptingId === o.id && 'opacity-70 cursor-not-allowed'
                      )}>
                      {acceptingId === o.id ? '接单中...' : <><Handshake className="w-4 h-4" /> 立即接单</>}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title"><Calendar className="w-5 h-5 text-brand-600" /> 今日服务进度</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="badge bg-success-50 text-success-600 gap-1"><CheckCircle className="w-3 h-3" />{completed}项已完成</span>
              <span className="badge bg-warning-50 text-warning-600 gap-1"><Clock className="w-3 h-3" />{tasks.length - completed}项待办</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-success-200 via-warning-200 to-gray-200 rounded-full" />
            <div className="space-y-1">
              {tasks.map((task, idx) => {
                const style = getTaskStyle(task.type);
                const TaskIcon = style.icon;
                return (
                  <div key={idx} className="relative pl-14 pb-4 last:pb-0">
                    <div className={cn(
                      'absolute left-2.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm z-10',
                      task.completed ? 'bg-success-500' : style.dot
                    )}>
                      {task.completed ? <CheckCircle className="w-3 h-3 text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className={cn(
                      'rounded-xl border p-3 transition-all',
                      task.completed ? 'bg-gray-50/60 border-gray-100 opacity-70' : cn(style.bg, style.border)
                    )}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs bg-white/60 px-2 py-0.5 rounded border border-gray-200">{task.time}</span>
                            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-md', style.text, 'bg-white/50 border border-current/20')}>
                              <TaskIcon className="w-3 h-3 inline mr-1" />{style.label}
                            </span>
                          </div>
                          <div className={cn('font-semibold text-sm', task.completed ? 'text-gray-500 line-through' : 'text-gray-900')}>{task.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            <span className="text-brand-600">{task.workerName}</span>
                            <span className="mx-1">→</span>
                            <span>{task.factoryName}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{task.location}
                          </div>
                          {task.note && <div className="text-xs text-brand-600 mt-1 bg-white/50 rounded px-2 py-1 inline-block">💡 {task.note}</div>}
                        </div>
                        {!task.completed && (
                          <button
                            onClick={() => completeTask(idx)}
                            className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-white border border-brand-200 text-brand-600 hover:bg-brand-50 hover:border-brand-400 transition-all font-medium">
                            标记完成
                          </button>
                        )}
                        {task.completed && (
                          <span className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-success-100 text-success-600 font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />已完成
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
