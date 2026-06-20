import { useEffect, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Navigation, FileText,
  Award, CheckCircle, MapPin, Phone, Clock, Plus, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { get } from '@/lib/api';
import type { InterviewOrder } from '@shared/types';

const BROKER_ID = 'b-001';

interface ScheduleTask {
  id: string;
  time: string;
  type: 'pickup' | 'document' | 'training';
  title: string;
  workerName: string;
  workerPhone: string;
  location: string;
  factoryName: string;
  completed: boolean;
  note?: string;
}

function getTaskStyle(type: string) {
  return {
    pickup: { bg: 'bg-success-50', border: 'border-success-200', text: 'text-success-700', header: 'bg-success-500', label: '车接车送', icon: Navigation },
    document: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', header: 'bg-blue-500', label: '证件复印', icon: FileText },
    training: { bg: 'bg-warning-50', border: 'border-warning-200', text: 'text-warning-700', header: 'bg-accent-500', label: '培训签到', icon: Award },
  }[type] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', header: 'bg-gray-500', label: type, icon: Clock };
}

function ordersToMonthTasks(orders: InterviewOrder[]): Record<string, { count: number; types: string[] }> {
  const result: Record<string, { count: number; types: string[] }> = {};
  
  orders.forEach(order => {
    const dateKey = new Date(order.scheduledDate).toISOString().split('T')[0];
    if (!result[dateKey]) {
      result[dateKey] = { count: 0, types: [] };
    }
    result[dateKey].count += 1;
    
    const types: string[] = ['pickup'];
    if (['documents_copied', 'training_done', 'interviewing', 'passed', 'failed', 'employed'].includes(order.status)) {
      types.push('document');
    }
    if (['training_done', 'interviewing', 'passed', 'failed', 'employed'].includes(order.status)) {
      types.push('training');
    }
    
    types.forEach(t => {
      if (!result[dateKey].types.includes(t)) {
        result[dateKey].types.push(t);
      }
    });
  });
  
  return result;
}

function ordersToDayTasks(orders: InterviewOrder[], dateStr: string): ScheduleTask[] {
  const tasks: ScheduleTask[] = [];
  const dayOrders = orders.filter(o => {
    const orderDate = new Date(o.scheduledDate).toISOString().split('T')[0];
    return orderDate === dateStr;
  });

  dayOrders.forEach(order => {
    const pickupTime = order.pickupInfo?.pickupTime
      ? new Date(order.pickupInfo.pickupTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      : '08:00';
    
    tasks.push({
      id: `${order.id}-pickup`,
      time: pickupTime,
      type: 'pickup',
      title: '车接车送',
      workerName: order.workerName,
      workerPhone: order.workerPhone,
      location: order.pickupInfo?.pickupPoint || '工厂门口',
      factoryName: order.factoryName,
      completed: ['arrived', 'documents_copied', 'training_done', 'interviewing', 'passed', 'failed', 'employed'].includes(order.status),
      note: order.pickupInfo ? `车牌号：${order.pickupInfo.carPlate}，司机：${order.pickupInfo.driverName}` : undefined,
    });

    if (['documents_copied', 'training_done', 'interviewing', 'passed', 'failed', 'employed'].includes(order.status)) {
      tasks.push({
        id: `${order.id}-document`,
        time: '09:30',
        type: 'document',
        title: '证件复印办理',
        workerName: order.workerName,
        workerPhone: order.workerPhone,
        location: `${order.factoryName} 行政楼`,
        factoryName: order.factoryName,
        completed: ['documents_copied', 'training_done', 'interviewing', 'passed', 'failed', 'employed'].includes(order.status),
      });
    }

    if (['training_done', 'interviewing', 'passed', 'failed', 'employed'].includes(order.status)) {
      tasks.push({
        id: `${order.id}-training`,
        time: '10:30',
        type: 'training',
        title: '岗前培训签到',
        workerName: order.workerName,
        workerPhone: order.workerPhone,
        location: `${order.factoryName} 培训中心`,
        factoryName: order.factoryName,
        completed: ['training_done', 'interviewing', 'passed', 'failed', 'employed'].includes(order.status),
        note: 'EHS安全+岗位技能培训',
      });
    }
  });

  return tasks.sort((a, b) => a.time.localeCompare(b.time));
}

function formatDateStr(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ScheduleCenter() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(formatDateStr(today));
  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [monthTasks, setMonthTasks] = useState<Record<string, { count: number; types: string[] }>>({});
  const [orders, setOrders] = useState<InterviewOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await get<InterviewOrder[]>(`/brokers/${BROKER_ID}/orders`);
        if (res.success && res.data) {
          setOrders(res.data);
          const monthData = ordersToMonthTasks(res.data);
          setMonthTasks(monthData);
          const dayTasks = ordersToDayTasks(res.data, selectedDate);
          setTasks(dayTasks);
        }
      } catch (err) {
        console.error('加载数据失败', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const formatDate = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const completedCount = tasks.filter(t => t.completed).length;

  const completeTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: true } : t));
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    const dayTasks = ordersToDayTasks(orders, dateStr);
    setTasks(dayTasks.length > 0 ? dayTasks : []);
  };

  const pickupCount = Object.values(monthTasks).filter(t => t.types.includes('pickup')).length;
  const documentCount = Object.values(monthTasks).filter(t => t.types.includes('document')).length;
  const trainingCount = Object.values(monthTasks).filter(t => t.types.includes('training')).length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">排班服务中心</h1>
          <p className="text-gray-500 text-sm mt-1">日历视图 · 今日任务 · 服务跟踪</p>
        </div>
        <button className="btn-primary gap-2"><Plus className="w-4 h-4" /> 添加排班</button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button className="btn-ghost !p-2" onClick={prevMonth}><ChevronLeft className="w-5 h-5" /></button>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-brand-600" />{year}年{month + 1}月
              </h3>
              <button className="btn-ghost !p-2" onClick={nextMonth}><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-success-500" />车接</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />证件</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-accent-500" />培训</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((d, idx) => {
              if (d === null) return <div key={`null-${idx}`} />;
              const dateStr = formatDate(d);
              const taskInfo = monthTasks[dateStr];
              const isSelected = selectedDate === dateStr;
              const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
              return (
                <button key={d}
                  onClick={() => handleDateSelect(dateStr)}
                  className={cn(
                    'aspect-square p-1.5 rounded-xl border-2 text-left transition-all relative group',
                    isSelected
                      ? 'border-accent-500 bg-accent-50 shadow-md'
                      : isToday
                      ? 'border-brand-300 bg-brand-50'
                      : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                  )}>
                  <div className="flex items-start justify-between">
                    <span className={cn(
                      'font-bold text-sm w-6 h-6 rounded-full flex items-center justify-center',
                      isToday && !isSelected ? 'bg-brand-600 text-white' :
                      isSelected ? 'bg-accent-500 text-white' : 'text-gray-700'
                    )}>{d}</span>
                    {taskInfo && (
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-600 rounded-full px-1.5 min-w-[18px] text-center leading-5">
                        {taskInfo.count}
                      </span>
                    )}
                  </div>
                  {taskInfo && (
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex gap-0.5">
                      {taskInfo.types.includes('pickup') && <div className="h-1 flex-1 rounded bg-success-500" />}
                      {taskInfo.types.includes('document') && <div className="h-1 flex-1 rounded bg-blue-500" />}
                      {taskInfo.types.includes('training') && <div className="h-1 flex-1 rounded bg-accent-500" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-success-50 border border-success-100">
              <div className="text-2xl font-bold text-success-600">{pickupCount}</div>
              <div className="text-xs text-success-700 mt-0.5">本月接车排班</div>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
              <div className="text-2xl font-bold text-blue-600">{documentCount}</div>
              <div className="text-xs text-blue-700 mt-0.5">证件办理日</div>
            </div>
            <div className="p-3 rounded-xl bg-accent-50 border border-accent-100">
              <div className="text-2xl font-bold text-accent-600">{trainingCount}</div>
              <div className="text-xs text-accent-700 mt-0.5">培训签到日</div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="section-title">
                <CalendarIcon className="w-5 h-5 text-brand-600" />
                {selectedDate} 排班任务
              </h3>
              <p className="text-xs text-gray-500 mt-1">共 {tasks.length} 项任务 · 已完成 {completedCount} 项</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full" style={{ width: tasks.length ? `${(completedCount / tasks.length) * 100}%` : '0%' }} />
              </div>
              <span className="text-xs font-bold text-brand-600">{tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0}%</span>
            </div>
          </div>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {loading && tasks.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-3" />
                <p>加载中...</p>
              </div>
            )}
            {!loading && tasks.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>当日暂无排班任务</p>
              </div>
            )}
            {tasks.map(task => {
              const style = getTaskStyle(task.type);
              const TaskIcon = style.icon;
              return (
                <div key={task.id} className={cn(
                  'rounded-xl border overflow-hidden transition-all',
                  task.completed ? 'border-gray-100 bg-gray-50/70 opacity-75' : cn(style.bg, style.border)
                )}>
                  <div className={cn('h-1.5 w-full', style.header)} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                          task.completed ? 'bg-gray-200' : 'bg-white shadow-sm'
                        )}>
                          <TaskIcon className={cn('w-5 h-5', task.completed ? 'text-gray-400' : style.text)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-xs font-bold bg-white/80 border border-gray-200 rounded-md px-2 py-0.5">{task.time}</span>
                            <span className={cn(
                              'text-xs font-semibold px-2 py-0.5 rounded-md',
                              task.completed ? 'bg-gray-200 text-gray-600' : cn('bg-white', style.text)
                            )}>{style.label}</span>
                            {task.completed && <span className="badge bg-success-100 text-success-600 gap-1 text-[10px]"><CheckCircle className="w-2.5 h-2.5" />已完成</span>}
                          </div>
                          <div className={cn('font-semibold', task.completed ? 'text-gray-500 line-through' : 'text-gray-900')}>{task.title}</div>
                        </div>
                      </div>
                      {!task.completed && (
                        <button onClick={() => completeTask(task.id)}
                          className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-white border border-brand-200 text-brand-600 hover:bg-brand-50 hover:border-brand-400 transition-all font-medium whitespace-nowrap">
                          标记完成
                        </button>
                      )}
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 border border-white/80 space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-gray-700 font-medium">{task.workerName}</span>
                        <span className="flex items-center gap-0.5 text-gray-500"><Phone className="w-3 h-3" />{task.workerPhone}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <span className="text-gray-600">{task.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BuildingIcon className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                        <span className="text-brand-700 font-medium">{task.factoryName}</span>
                      </div>
                      {task.note && (
                        <div className="pt-1.5 mt-1.5 border-t border-gray-100 flex items-start gap-2">
                          <Clock className="w-3.5 h-3.5 text-accent-500 shrink-0 mt-0.5" />
                          <span className="text-accent-700 bg-accent-50 rounded px-2 py-0.5">{task.note}</span>
                        </div>
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
  );
}

function BuildingIcon(props: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" /></svg>;
}
