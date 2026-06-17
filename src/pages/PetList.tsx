import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Filter, PawPrint, Link2, FileText, AlertTriangle,
  Calendar, Syringe, Bug, Heart, ChevronRight, MapPin, ShoppingCart,
  Clock, CheckCircle2, XCircle, RotateCcw, Bell, UserCheck,
  Pill, Stethoscope, Package, Phone, ArrowRight, AlertCircle,
  FileCheck, User, Star, Activity,
} from 'lucide-react';
import PetCard from '@/components/PetCard';
import type { Pet } from '@shared/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const mockPets: Pet[] = [
  {
    id: '1',
    ownerId: '1',
    name: '豆豆',
    species: 'dog',
    breed: '金毛寻回犬',
    gender: 'male',
    birthday: '2022-03-15',
    weight: 28.5,
    healthStatus: 'healthy',
    vaccineRecords: [
      { id: 'v1', petId: '1', vaccineName: '狂犬疫苗', date: '2025-01-15', nextDate: '2026-01-15' },
    ],
    dewormingRecords: [
      { id: 'd1', petId: '1', type: 'internal', productName: '拜宠清', date: '2025-03-01', nextDate: '2025-06-01' },
    ],
  },
  {
    id: '2',
    ownerId: '1',
    name: '咪咪',
    species: 'cat',
    breed: '英国短毛猫',
    gender: 'female',
    birthday: '2023-07-20',
    weight: 4.2,
    healthStatus: 'healthy',
    vaccineRecords: [],
    dewormingRecords: [],
  },
  {
    id: '3',
    ownerId: '1',
    name: '小白',
    species: 'rabbit',
    breed: '荷兰垂耳兔',
    gender: 'male',
    birthday: '2024-02-10',
    weight: 2.1,
    healthStatus: 'sick',
    vaccineRecords: [],
    dewormingRecords: [],
  },
];

const speciesFilters = [
  { value: 'all', label: '全部' },
  { value: 'dog', label: '狗狗' },
  { value: 'cat', label: '猫咪' },
  { value: 'rabbit', label: '兔子' },
  { value: 'other', label: '其他' },
];

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type DisposalPath = 'none' | 'buying' | 'booking' | 'consultation' | 'completed';
type BuyMedicineStep = 0 | 1 | 2 | 3 | 4;
type BookingStep = 0 | 1 | 2 | 3 | 4;
type ConsultationStep = 0 | 1 | 2 | 3 | 4;

interface DisposalProgress {
  remind: { done: boolean; time?: string };
  contact: { done: boolean; time?: string };
  confirm: { done: boolean; time?: string };
  complete: { done: boolean; time?: string };
}

interface OverdueState {
  expandedPath: DisposalPath;
  buyStep: BuyMedicineStep;
  bookingStep: BookingStep;
  consultationStep: ConsultationStep;
  progress: DisposalProgress;
  ownerAcknowledge: boolean;
  doctorConfirm: boolean;
  selectedHospital: string;
  selectedTime: string;
  bookingConfirmed: boolean;
  hospitalConfirmed: boolean;
  reminderSet: boolean;
}

const getRiskLevel = (days: number): { level: RiskLevel; label: string; color: string; bgColor: string; borderColor: string } => {
  if (days <= 3) return { level: 'low', label: '低风险', color: 'text-yellow-700', bgColor: 'bg-yellow-500', borderColor: 'border-yellow-200' };
  if (days <= 7) return { level: 'medium', label: '中风险', color: 'text-orange-700', bgColor: 'bg-orange-500', borderColor: 'border-orange-200' };
  if (days <= 30) return { level: 'high', label: '高风险', color: 'text-red-700', bgColor: 'bg-red-500', borderColor: 'border-red-200' };
  return { level: 'critical', label: '极高风险', color: 'text-red-800', bgColor: 'bg-red-700', borderColor: 'border-red-300' };
};

const getRiskDescription = (level: RiskLevel): string => {
  switch (level) {
    case 'low': return '建议尽快处置';
    case 'medium': return '建议尽快处置';
    case 'high': return '建议立即处置';
    case 'critical': return '建议立即处置';
  }
};

const hospitals = [
  { id: 'h1', name: '爱宠动物医院总院', distance: '1.2km', rating: 4.8, address: '朝阳区建国路88号' },
];

const timeSlots = [
  { id: 't1', time: '今日14:00', available: true },
  { id: 't2', time: '今日16:00', available: true },
  { id: 't3', time: '明日09:30', available: true },
];

const medicineInfo = {
  name: '拜宠清体内驱虫',
  dosage: '28.5kg剂量',
  spec: '2粒/盒',
  price: '¥68',
};

const doctorInfo = {
  name: '王建国',
  title: '执业兽医师',
  license: 'A012345',
  signatureTime: '2026-06-17 10:30',
};

export default function PetList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showBindModal, setShowBindModal] = useState(false);
  const [overdueActions, setOverdueActions] = useState<Record<string, 'none' | 'buying' | 'booked' | 'purchased' | 'rescheduled'>>({});

  const [overdueStates, setOverdueStates] = useState<Record<string, OverdueState>>({
    'r2': {
      expandedPath: 'none',
      buyStep: 0,
      bookingStep: 0,
      consultationStep: 0,
      progress: {
        remind: { done: true, time: '2026-06-15 09:00' },
        contact: { done: true, time: '2026-06-16 14:30' },
        confirm: { done: false },
        complete: { done: false },
      },
      ownerAcknowledge: false,
      doctorConfirm: false,
      selectedHospital: '',
      selectedTime: '',
      bookingConfirmed: false,
      hospitalConfirmed: false,
      reminderSet: false,
    },
  });

  const updateOverdueState = (id: string, updates: Partial<OverdueState>) => {
    setOverdueStates(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  };

  const resetPath = (id: string) => {
    updateOverdueState(id, {
      expandedPath: 'none',
      buyStep: 0,
      bookingStep: 0,
      consultationStep: 0,
      ownerAcknowledge: false,
      doctorConfirm: false,
      selectedHospital: '',
      selectedTime: '',
      bookingConfirmed: false,
      hospitalConfirmed: false,
      reminderSet: false,
    });
  };

  const [updatedDewormingRecords, setUpdatedDewormingRecords] = useState<Record<string, { date: string; nextDate: string; completed: boolean }>>({});
  const [petTimelineUpdates, setPetTimelineUpdates] = useState<Record<string, Array<{ id: string; date: string; type: 'deworm' | 'prescription' | 'consultation' | 'followup'; title: string; detail: string; status: 'completed' }>>>({});

  const addTimelineEntry = (petId: string, entry: Omit<{ id: string; date: string; type: 'deworm' | 'prescription' | 'consultation' | 'followup'; title: string; detail: string; status: 'completed' }, 'id'>) => {
    const newEntry = {
      ...entry,
      id: `tl-${petId}-${Date.now()}`,
    };
    setPetTimelineUpdates(prev => ({
      ...prev,
      [petId]: [...(prev[petId] || []), newEntry],
    }));
  };

  const markProgress = (id: string) => {
    const state = overdueStates[id];
    const now = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-');
    const today = new Date().toISOString().split('T')[0];
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 3);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    updateOverdueState(id, {
      progress: {
        ...state.progress,
        confirm: { done: true, time: now },
        complete: { done: true, time: now },
      },
    });

    setUpdatedDewormingRecords(prev => ({
      ...prev,
      '1': { date: today, nextDate: nextDateStr, completed: true },
    }));

    addTimelineEntry('1', {
      date: today,
      type: 'deworm',
      title: '体内驱虫（逾期处置完成）',
      detail: `拜宠清口服 · 体重28.5kg · 下次到期${nextDateStr} · 逾期381天后完成处置`,
      status: 'completed',
    });

    if (state.expandedPath === 'buying') {
      addTimelineEntry('1', {
        date: today,
        type: 'prescription',
        title: '处方开具 · 驱虫药',
        detail: '拜宠清体内驱虫 · 医生王建国签名 ✓ · 宠主确认 ✓ · 已购药',
        status: 'completed',
      });
    }

    if (state.expandedPath === 'booking') {
      addTimelineEntry('1', {
        date: today,
        type: 'followup',
        title: '预约驱虫处置',
        detail: '爱宠动物医院总院 · 医师王建国 · 已预约',
        status: 'completed',
      });
    }

    if (state.expandedPath === 'consultation') {
      addTimelineEntry('1', {
        date: today,
        type: 'consultation',
        title: '在线问诊 · 逾期驱虫处置',
        detail: '主诉：逾期未驱虫 · 诊断：需立即驱虫 · 医师王建国签名 ✓',
        status: 'completed',
      });
    }
  };

  const handleOverdueAction = (id: string, action: 'none' | 'buying' | 'booked' | 'purchased' | 'rescheduled') => {
    setOverdueActions(prev => ({ ...prev, [id]: action }));
  };

  const filteredPets = mockPets.filter((pet) => {
    const matchesSearch = pet.name.includes(search) || pet.breed.includes(search);
    const matchesFilter = filter === 'all' || pet.species === filter;
    return matchesSearch && matchesFilter;
  });

  const upcomingReminders = [
    { id: 'r1', petName: '豆豆', type: '疫苗', event: '狂犬疫苗+六联疫苗加强针', date: '2026-01-15', action: '预约接种', actionRoute: '/hospitals', Icon: Syringe, color: 'from-forest-50 to-emerald-50 border-forest-200', badgeColor: 'bg-forest-500', overdue: false, overdueDays: 0 },
    { id: 'r2', petName: '豆豆', type: '驱虫', event: '体内驱虫(拜宠清)', date: '2025-06-01', action: '商城购药', actionRoute: '/products', Icon: Bug, color: 'from-warm-50 to-orange-50 border-warm-200', badgeColor: 'bg-warm-500', overdue: true, overdueDays: 381 },
    { id: 'r3', petName: '小白', type: '复诊', event: '肠胃炎复诊', date: '2026-06-22', action: '查看预约', actionRoute: '/hospitals/h1', Icon: Heart, color: 'from-blue-50 to-sky-50 border-blue-200', badgeColor: 'bg-blue-500', overdue: false, overdueDays: 0 },
  ];

  const totalStats = {
    pets: mockPets.length,
    vaccines: mockPets.reduce((s, p) => s + p.vaccineRecords.length, 0),
    deworming: mockPets.reduce((s, p) => s + p.dewormingRecords.length, 0),
    sickOrRecovering: mockPets.filter(p => p.healthStatus === 'sick').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="section-title">宠物档案</h1>
          <p className="section-subtitle">
            {user?.role === 'owner'
              ? `已绑定 ${mockPets.length} 只宠物 · 管理你的毛孩子健康档案`
              : `宠主档案池 · 共 ${mockPets.length} 只宠物在管`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/calendar')} className="btn-secondary !py-2 !px-3 text-sm gap-1.5">
            <Calendar className="w-4 h-4" /> 健康日历
          </button>
          <button onClick={() => navigate(`/pets/${mockPets[0].id}`)} className="btn-secondary !py-2 !px-3 text-sm gap-1.5">
            <FileText className="w-4 h-4" /> 模板维护
          </button>
          <button onClick={() => setShowBindModal(true)} className="btn-secondary !py-2 !px-3 text-sm gap-1.5">
            <Link2 className="w-4 h-4" /> 多宠绑定
          </button>
          <button onClick={() => {}} className="btn-primary !py-2 !px-3 text-sm gap-1.5">
            <Plus className="w-4 h-4" /> 添加宠物
          </button>
        </div>
      </div>

      {/* 总览统计卡 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card !p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-100 to-emerald-100 flex items-center justify-center shrink-0">
            <PawPrint className="w-5 h-5 text-forest-600" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500">绑定宠物</p>
            <p className="text-lg font-bold text-gray-900">{totalStats.pets} <span className="text-xs font-normal text-gray-400">只</span></p>
          </div>
        </div>
        <div className="card !p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-sky-100 flex items-center justify-center shrink-0">
            <Syringe className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500">累计接种</p>
            <p className="text-lg font-bold text-gray-900">{totalStats.vaccines} <span className="text-xs font-normal text-gray-400">次</span></p>
          </div>
        </div>
        <div className="card !p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-100 to-orange-100 flex items-center justify-center shrink-0">
            <Bug className="w-5 h-5 text-warm-600" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500">累计驱虫</p>
            <p className="text-lg font-bold text-gray-900">{totalStats.deworming} <span className="text-xs font-normal text-gray-400">次</span></p>
          </div>
        </div>
        <div className="card !p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500">病中跟踪</p>
            <p className="text-lg font-bold text-gray-900">{totalStats.sickOrRecovering} <span className="text-xs font-normal text-gray-400">只</span></p>
          </div>
        </div>
      </div>

      {/* 即将到期提醒 */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warm-500" />
            <h2 className="font-display font-bold text-gray-900">即将到期 · 疫苗/驱虫/体检提醒</h2>
            <span className="px-2 py-0.5 rounded-full bg-warm-100 text-warm-700 text-[10px] font-bold">{upcomingReminders.length} 项待办</span>
            {upcomingReminders.some(r => r.overdue) && (
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">{upcomingReminders.filter(r => r.overdue).length} 项逾期</span>
            )}
          </div>
          <button onClick={() => navigate('/calendar')} className="text-xs text-forest-600 hover:text-forest-700 font-semibold inline-flex items-center gap-0.5">
            查看完整日历 <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {upcomingReminders.map(r => {
            const actionState = overdueActions[r.id] || 'none';
            const overdueState = overdueStates[r.id];
            const isEnhancedOverdue = r.overdue && r.overdueDays > 30;

            if (isEnhancedOverdue && overdueState) {
              const risk = getRiskLevel(r.overdueDays);
              const progressNodes = [
                { key: 'remind', label: '待提醒', Icon: Bell },
                { key: 'contact', label: '已触达', Icon: Phone },
                { key: 'confirm', label: '用户确认', Icon: UserCheck },
                { key: 'complete', label: '处置完成', Icon: CheckCircle2 },
              ] as const;

              return (
                <div key={r.id} className={cn('p-3 rounded-xl bg-gradient-to-br border space-y-2', r.color, risk.borderColor)}>
                  <div className={cn('-mx-3 -mt-3 px-3 py-2 rounded-t-xl flex items-center justify-between', risk.bgColor)}>
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-white" />
                      <span className="text-[11px] font-bold text-white">风险等级：{risk.label} · 逾期{r.overdueDays}天 · {getRiskDescription(risk.level)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', r.badgeColor)}>
                        <r.Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-bold text-gray-800">{r.petName} · {r.type}</span>
                    </div>
                    {!overdueState.progress.complete.done && (
                      <span className={cn('px-1.5 py-0.5 rounded-md text-[10px] font-bold', risk.bgColor, 'text-white')}>逾期{r.overdueDays}天</span>
                    )}
                    {overdueState.progress.complete.done && (
                      <span className="px-1.5 py-0.5 rounded-md bg-forest-100 text-forest-700 text-[10px] font-bold flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" />已处置</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{r.event}</p>
                  <p className="text-[10px] text-gray-500 font-mono">到期日：{r.date}</p>

                  <div className="p-2 rounded-lg bg-white/70 border border-gray-100 space-y-2">
                    <p className="text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> 逾期处置链路
                    </p>
                    <div className="flex items-center justify-between">
                      {progressNodes.map((node, idx) => {
                        const progress = overdueState.progress[node.key];
                        const isDone = progress.done;
                        return (
                          <div key={node.key} className="flex flex-col items-center flex-1">
                            <div className={cn('w-6 h-6 rounded-full flex items-center justify-center', isDone ? 'bg-forest-500' : 'bg-gray-200')}>
                              <node.Icon className={cn('w-3 h-3', isDone ? 'text-white' : 'text-gray-400')} />
                            </div>
                            <span className={cn('text-[8px] font-semibold mt-0.5', isDone ? 'text-forest-700' : 'text-gray-500')}>{node.label}</span>
                            {progress.time && (
                              <span className="text-[7px] text-gray-400 font-mono">{progress.time}</span>
                            )}
                            {idx < progressNodes.length - 1 && (
                              <div className={cn('w-full h-0.5 my-1', isDone ? 'bg-forest-400' : 'bg-gray-200')} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {!overdueState.progress.complete.done && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-gray-700">请选择处置路径：</p>
                      <div className="space-y-1.5">
                        <button
                          onClick={() => updateOverdueState(r.id, { expandedPath: overdueState.expandedPath === 'buying' ? 'none' : 'buying' })}
                          className={cn(
                            'w-full p-2 rounded-lg text-left transition-all',
                            overdueState.expandedPath === 'buying'
                              ? 'bg-forest-500 text-white'
                              : 'bg-white/80 hover:bg-white text-gray-800 border border-gray-200/60'
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold">商城购药双签流程</span>
                            <ChevronRight className={cn('w-3 h-3 ml-auto transition-transform', overdueState.expandedPath === 'buying' && 'rotate-90')} />
                          </div>
                        </button>

                        {overdueState.expandedPath === 'buying' && (
                          <div className="p-2 rounded-lg bg-forest-50 border border-forest-100 space-y-2 animate-in fade-in">
                            {overdueState.buyStep === 0 && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-semibold text-forest-800 flex items-center gap-1">
                                  <Pill className="w-3 h-3" /> 第一步：确认药品
                                </p>
                                <div className="p-2 rounded-lg bg-white space-y-1">
                                  <p className="text-[11px] font-bold text-gray-900">{medicineInfo.name}</p>
                                  <p className="text-[10px] text-gray-600">{medicineInfo.dosage} · {medicineInfo.spec}</p>
                                  <p className="text-[11px] font-bold text-forest-600">{medicineInfo.price}</p>
                                </div>
                                <button
                                  onClick={() => updateOverdueState(r.id, { buyStep: 1 })}
                                  className="w-full py-1.5 rounded-lg bg-forest-500 hover:bg-forest-600 text-white text-[11px] font-bold transition-colors inline-flex items-center justify-center gap-1"
                                >
                                  确认药品 <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            {overdueState.buyStep === 1 && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-semibold text-forest-800 flex items-center gap-1">
                                  <FileCheck className="w-3 h-3" /> 第二步：宠主知情确认
                                </p>
                                <div className="p-2 rounded-lg bg-white space-y-2">
                                  <label className="flex items-start gap-1.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={overdueState.ownerAcknowledge}
                                      onChange={(e) => updateOverdueState(r.id, { ownerAcknowledge: e.target.checked })}
                                      className="mt-0.5 text-forest-600"
                                    />
                                    <span className="text-[10px] text-gray-700 leading-relaxed">
                                      我已了解药品适应症、用法用量、不良反应。拜宠清用于治疗犬猫的线虫、绦虫感染，口服给药，每3个月一次。不良反应可能包括呕吐、腹泻等胃肠道反应。
                                    </span>
                                  </label>
                                </div>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => updateOverdueState(r.id, { buyStep: 0 })}
                                    className="py-1.5 px-3 rounded-lg bg-white text-gray-600 text-[11px] font-bold border border-gray-200 transition-colors"
                                  >
                                    上一步
                                  </button>
                                  <button
                                    onClick={() => updateOverdueState(r.id, { buyStep: 2 })}
                                    disabled={!overdueState.ownerAcknowledge}
                                    className={cn(
                                      'flex-1 py-1.5 rounded-lg text-white text-[11px] font-bold transition-colors inline-flex items-center justify-center gap-1',
                                      overdueState.ownerAcknowledge ? 'bg-forest-500 hover:bg-forest-600' : 'bg-gray-300 cursor-not-allowed'
                                    )}
                                  >
                                    宠主已确认 <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {overdueState.buyStep === 2 && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-semibold text-forest-800 flex items-center gap-1">
                                  <User className="w-3 h-3" /> 第三步：执业兽医师确认
                                </p>
                                <div className="p-2 rounded-lg bg-white space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center">
                                      <User className="w-4 h-4 text-forest-600" />
                                    </div>
                                    <div>
                                      <p className="text-[11px] font-bold text-gray-900">{doctorInfo.name}</p>
                                      <p className="text-[9px] text-gray-500">{doctorInfo.title} · 执照{doctorInfo.license}</p>
                                    </div>
                                    <CheckCircle2 className="w-4 h-4 text-forest-500 ml-auto" />
                                  </div>
                                  <div className="pt-1.5 border-t border-gray-100">
                                    <p className="text-[9px] text-gray-500">医生签名确认时间</p>
                                    <p className="text-[10px] font-mono text-gray-700">{doctorInfo.signatureTime}</p>
                                  </div>
                                  <div className="h-8 flex items-center justify-end">
                                    <div className="text-[18px] font-cursive text-forest-700 opacity-80" style={{ fontFamily: 'cursive' }}>王建国</div>
                                  </div>
                                </div>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => updateOverdueState(r.id, { buyStep: 1 })}
                                    className="py-1.5 px-3 rounded-lg bg-white text-gray-600 text-[11px] font-bold border border-gray-200 transition-colors"
                                  >
                                    上一步
                                  </button>
                                  <button
                                    onClick={() => updateOverdueState(r.id, { buyStep: 3, doctorConfirm: true })}
                                    className="flex-1 py-1.5 rounded-lg bg-forest-500 hover:bg-forest-600 text-white text-[11px] font-bold transition-colors inline-flex items-center justify-center gap-1"
                                  >
                                    处方已生效 <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {overdueState.buyStep === 3 && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-semibold text-forest-800 flex items-center gap-1">
                                  <Package className="w-3 h-3" /> 第四步：完成
                                </p>
                                <div className="p-2 rounded-lg bg-white space-y-1">
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4 text-forest-500" />
                                    <p className="text-[11px] font-bold text-gray-900">订单已创建</p>
                                  </div>
                                  <p className="text-[10px] text-gray-600">预计明日送达 · 可在商城订单查看</p>
                                  <p className="text-[9px] text-gray-500 font-mono">订单号：DD-20260617-00123</p>
                                </div>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => {
                                      markProgress(r.id);
                                      handleOverdueAction(r.id, 'purchased');
                                      updateOverdueState(r.id, { buyStep: 4, expandedPath: 'completed' });
                                    }}
                                    className="flex-1 py-1.5 rounded-lg bg-forest-500 hover:bg-forest-600 text-white text-[11px] font-bold transition-colors inline-flex items-center justify-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3 h-3" /> 完成处置
                                  </button>
                                </div>
                              </div>
                            )}

                            {overdueState.buyStep < 3 && (
                              <button
                                onClick={() => resetPath(r.id)}
                                className="w-full text-[9px] text-gray-500 hover:text-gray-700 text-center"
                              >
                                取消
                              </button>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => updateOverdueState(r.id, { expandedPath: overdueState.expandedPath === 'booking' ? 'none' : 'booking' })}
                          className={cn(
                            'w-full p-2 rounded-lg text-left transition-all',
                            overdueState.expandedPath === 'booking'
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/80 hover:bg-white text-gray-800 border border-gray-200/60'
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold">预约医院驱虫处置</span>
                            <ChevronRight className={cn('w-3 h-3 ml-auto transition-transform', overdueState.expandedPath === 'booking' && 'rotate-90')} />
                          </div>
                        </button>

                        {overdueState.expandedPath === 'booking' && (
                          <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 space-y-2 animate-in fade-in">
                            {overdueState.bookingStep === 0 && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-semibold text-blue-800 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> 选择医院
                                </p>
                                {hospitals.map(h => (
                                  <button
                                    key={h.id}
                                    onClick={() => updateOverdueState(r.id, { selectedHospital: h.id, bookingStep: 1 })}
                                    className={cn(
                                      'w-full p-2 rounded-lg text-left transition-all',
                                      overdueState.selectedHospital === h.id
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200'
                                    )}
                                  >
                                    <div className="flex items-start gap-2">
                                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                        <MapPin className="w-4 h-4 text-blue-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-bold">{h.name}</p>
                                        <div className="flex items-center gap-1.5 text-[9px] opacity-80">
                                          <span>{h.distance}</span>
                                          <span>·</span>
                                          <div className="flex items-center gap-0.5">
                                            <Star className="w-2.5 h-2.5 fill-current" />
                                            <span>{h.rating}</span>
                                          </div>
                                        </div>
                                        <p className="text-[9px] opacity-70 truncate">{h.address}</p>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {overdueState.bookingStep === 1 && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-semibold text-blue-800 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> 选择时间
                                </p>
                                <div className="grid grid-cols-3 gap-1.5">
                                  {timeSlots.map(t => (
                                    <button
                                      key={t.id}
                                      onClick={() => updateOverdueState(r.id, { selectedTime: t.id })}
                                      className={cn(
                                        'py-2 rounded-lg text-[10px] font-bold transition-all',
                                        overdueState.selectedTime === t.id
                                          ? 'bg-blue-500 text-white'
                                          : 'bg-white text-gray-800 border border-gray-200 hover:bg-blue-50'
                                      )}
                                    >
                                      {t.time}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => updateOverdueState(r.id, { bookingStep: 0 })}
                                    className="py-1.5 px-3 rounded-lg bg-white text-gray-600 text-[11px] font-bold border border-gray-200 transition-colors"
                                  >
                                    上一步
                                  </button>
                                  <button
                                    onClick={() => updateOverdueState(r.id, { bookingStep: 2 })}
                                    disabled={!overdueState.selectedTime}
                                    className={cn(
                                      'flex-1 py-1.5 rounded-lg text-white text-[11px] font-bold transition-colors inline-flex items-center justify-center gap-1',
                                      overdueState.selectedTime ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300 cursor-not-allowed'
                                    )}
                                  >
                                    提交预约 <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {overdueState.bookingStep === 2 && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-semibold text-blue-800 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> 确认预约
                                </p>
                                <div className="p-2 rounded-lg bg-white space-y-1.5">
                                  <label className="flex items-start gap-1.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={overdueState.bookingConfirmed}
                                      onChange={(e) => updateOverdueState(r.id, { bookingConfirmed: e.target.checked })}
                                      className="mt-0.5 text-blue-600"
                                    />
                                    <span className="text-[10px] text-gray-700">宠主确认：我已确认预约时间和医院信息</span>
                                  </label>
                                  <label className="flex items-start gap-1.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={overdueState.hospitalConfirmed}
                                      onChange={(e) => updateOverdueState(r.id, { hospitalConfirmed: e.target.checked })}
                                      className="mt-0.5 text-blue-600"
                                    />
                                    <span className="text-[10px] text-gray-700">医院确认：医院已确认该时段可接诊</span>
                                  </label>
                                  <label className="flex items-start gap-1.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={overdueState.reminderSet}
                                      onChange={(e) => updateOverdueState(r.id, { reminderSet: e.target.checked })}
                                      className="mt-0.5 text-blue-600"
                                    />
                                    <span className="text-[10px] text-gray-700">到店提醒：服务前2小时推送提醒</span>
                                  </label>
                                </div>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => updateOverdueState(r.id, { bookingStep: 1 })}
                                    className="py-1.5 px-3 rounded-lg bg-white text-gray-600 text-[11px] font-bold border border-gray-200 transition-colors"
                                  >
                                    上一步
                                  </button>
                                  <button
                                    onClick={() => updateOverdueState(r.id, { bookingStep: 3 })}
                                    disabled={!overdueState.bookingConfirmed || !overdueState.hospitalConfirmed}
                                    className={cn(
                                      'flex-1 py-1.5 rounded-lg text-white text-[11px] font-bold transition-colors inline-flex items-center justify-center gap-1',
                                      overdueState.bookingConfirmed && overdueState.hospitalConfirmed ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300 cursor-not-allowed'
                                    )}
                                  >
                                    确认预约 <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {overdueState.bookingStep === 3 && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-semibold text-blue-800 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> 完成
                                </p>
                                <div className="p-2 rounded-lg bg-white space-y-1">
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                    <p className="text-[11px] font-bold text-gray-900">预约成功</p>
                                  </div>
                                  <p className="text-[10px] text-gray-600">服务前2小时推送提醒</p>
                                  <p className="text-[9px] text-gray-500 font-mono">预约号：YY-20260617-00045</p>
                                  {overdueState.reminderSet && (
                                    <p className="text-[9px] text-blue-600 flex items-center gap-0.5">
                                      <Bell className="w-2.5 h-2.5" /> 已开启到店提醒
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => {
                                      markProgress(r.id);
                                      handleOverdueAction(r.id, 'booked');
                                      updateOverdueState(r.id, { bookingStep: 4, expandedPath: 'completed' });
                                    }}
                                    className="flex-1 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-bold transition-colors inline-flex items-center justify-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3 h-3" /> 完成处置
                                  </button>
                                </div>
                              </div>
                            )}

                            {overdueState.bookingStep < 3 && (
                              <button
                                onClick={() => resetPath(r.id)}
                                className="w-full text-[9px] text-gray-500 hover:text-gray-700 text-center"
                              >
                                取消
                              </button>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => updateOverdueState(r.id, { expandedPath: overdueState.expandedPath === 'consultation' ? 'none' : 'consultation' })}
                          className={cn(
                            'w-full p-2 rounded-lg text-left transition-all',
                            overdueState.expandedPath === 'consultation'
                              ? 'bg-purple-500 text-white'
                              : 'bg-white/80 hover:bg-white text-gray-800 border border-gray-200/60'
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold">问诊复诊追踪</span>
                            <ChevronRight className={cn('w-3 h-3 ml-auto transition-transform', overdueState.expandedPath === 'consultation' && 'rotate-90')} />
                          </div>
                        </button>

                        {overdueState.expandedPath === 'consultation' && (
                          <div className="p-2 rounded-lg bg-purple-50 border border-purple-100 space-y-2 animate-in fade-in">
                            {overdueState.consultationStep === 0 && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-semibold text-purple-800 flex items-center gap-1">
                                  <Stethoscope className="w-3 h-3" /> 第一步：在线问诊
                                </p>
                                <div className="p-2 rounded-lg bg-white space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                      <User className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div>
                                      <p className="text-[11px] font-bold text-gray-900">{doctorInfo.name}</p>
                                      <p className="text-[9px] text-gray-500">{doctorInfo.title} · 在线</p>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-forest-500 ml-auto" />
                                  </div>
                                  <p className="text-[10px] text-gray-600">
                                    医生将询问宠物体征、近期健康状况，为您开具合适的驱虫处方。
                                  </p>
                                </div>
                                <button
                                  onClick={() => updateOverdueState(r.id, { consultationStep: 1 })}
                                  className="w-full py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-[11px] font-bold transition-colors inline-flex items-center justify-center gap-1"
                                >
                                  开始在线问诊 <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            {overdueState.consultationStep === 1 && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-semibold text-purple-800 flex items-center gap-1">
                                  <FileCheck className="w-3 h-3" /> 第二步：医生开具驱虫处方
                                </p>
                                <div className="p-2 rounded-lg bg-white space-y-1.5">
                                  <p className="text-[11px] font-bold text-gray-900">处方详情</p>
                                  <div className="p-1.5 rounded-lg bg-purple-50 space-y-0.5">
                                    <p className="text-[10px] font-semibold text-purple-800">{medicineInfo.name}</p>
                                    <p className="text-[9px] text-gray-600">{medicineInfo.dosage} · {medicineInfo.spec} · {medicineInfo.price}</p>
                                    <p className="text-[9px] text-gray-500">用法：口服，每3个月一次</p>
                                  </div>
                                  <p className="text-[9px] text-gray-500 font-mono">处方号：RX-20260617-00089</p>
                                </div>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => updateOverdueState(r.id, { consultationStep: 0 })}
                                    className="py-1.5 px-3 rounded-lg bg-white text-gray-600 text-[11px] font-bold border border-gray-200 transition-colors"
                                  >
                                    上一步
                                  </button>
                                  <button
                                    onClick={() => updateOverdueState(r.id, { consultationStep: 2 })}
                                    className="flex-1 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-[11px] font-bold transition-colors inline-flex items-center justify-center gap-1"
                                  >
                                    处方已确认 <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {overdueState.consultationStep === 2 && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-semibold text-purple-800 flex items-center gap-1">
                                  <UserCheck className="w-3 h-3" /> 第三步：双签确认
                                </p>
                                <div className="p-2 rounded-lg bg-white space-y-1.5">
                                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-gray-50">
                                    <span className="text-[10px] text-gray-600">宠主知情确认</span>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                                  </div>
                                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-gray-50">
                                    <span className="text-[10px] text-gray-600">医生签名确认</span>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                                  </div>
                                  <div className="flex justify-end gap-4 pt-1">
                                    <div className="text-right">
                                      <p className="text-[8px] text-gray-500">宠主签名</p>
                                      <div className="text-[14px] font-cursive text-gray-700" style={{ fontFamily: 'cursive' }}>用户</div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[8px] text-gray-500">医生签名</p>
                                      <div className="text-[14px] font-cursive text-purple-700" style={{ fontFamily: 'cursive' }}>王建国</div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => updateOverdueState(r.id, { consultationStep: 1 })}
                                    className="py-1.5 px-3 rounded-lg bg-white text-gray-600 text-[11px] font-bold border border-gray-200 transition-colors"
                                  >
                                    上一步
                                  </button>
                                  <button
                                    onClick={() => updateOverdueState(r.id, { consultationStep: 3 })}
                                    className="flex-1 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-[11px] font-bold transition-colors inline-flex items-center justify-center gap-1"
                                  >
                                    双签已完成 <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {overdueState.consultationStep === 3 && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-semibold text-purple-800 flex items-center gap-1">
                                  <Package className="w-3 h-3" /> 第四步：后续购药/预约
                                </p>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <button
                                    onClick={() => {
                                      markProgress(r.id);
                                      handleOverdueAction(r.id, 'purchased');
                                      updateOverdueState(r.id, { consultationStep: 4, expandedPath: 'completed' });
                                    }}
                                    className="p-2 rounded-lg bg-white border border-gray-200 text-left hover:bg-forest-50 hover:border-forest-200 transition-all"
                                  >
                                    <ShoppingCart className="w-4 h-4 text-forest-500 mb-0.5" />
                                    <p className="text-[10px] font-bold text-gray-800">立即购药</p>
                                    <p className="text-[8px] text-gray-500">预计明日送达</p>
                                  </button>
                                  <button
                                    onClick={() => {
                                      markProgress(r.id);
                                      handleOverdueAction(r.id, 'booked');
                                      updateOverdueState(r.id, { consultationStep: 4, expandedPath: 'completed' });
                                    }}
                                    className="p-2 rounded-lg bg-white border border-gray-200 text-left hover:bg-blue-50 hover:border-blue-200 transition-all"
                                  >
                                    <MapPin className="w-4 h-4 text-blue-500 mb-0.5" />
                                    <p className="text-[10px] font-bold text-gray-800">预约到店</p>
                                    <p className="text-[8px] text-gray-500">今日可约</p>
                                  </button>
                                </div>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => updateOverdueState(r.id, { consultationStep: 2 })}
                                    className="py-1.5 px-3 rounded-lg bg-white text-gray-600 text-[11px] font-bold border border-gray-200 transition-colors"
                                  >
                                    上一步
                                  </button>
                                </div>
                              </div>
                            )}

                            {overdueState.consultationStep < 3 && (
                              <button
                                onClick={() => resetPath(r.id)}
                                className="w-full text-[9px] text-gray-500 hover:text-gray-700 text-center"
                              >
                                取消
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {overdueState.expandedPath === 'completed' && (
                    <div className="p-2 rounded-lg bg-forest-50 border border-forest-100 text-[10px] text-forest-700 space-y-1">
                      <p className="font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 处置完成 · 驱虫记录已更新</p>
                      <p>下次驱虫日期已自动推算至 2026-09-17，已写入健康日历和宠物生命周期记录</p>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => navigate('/calendar')}
                          className="text-[9px] font-bold text-forest-600 hover:underline inline-flex items-center gap-0.5"
                        >
                          查看日历 <ChevronRight className="w-2.5 h-2.5" />
                        </button>
                        <button
                          onClick={() => navigate(`/pets/1`)}
                          className="text-[9px] font-bold text-forest-600 hover:underline inline-flex items-center gap-0.5"
                        >
                          查看宠物档案 <ChevronRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={r.id} className={cn('p-3 rounded-xl bg-gradient-to-br border space-y-2', r.color)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', r.badgeColor)}>
                      <r.Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-bold text-gray-800">{r.petName} · {r.type}</span>
                  </div>
                  {r.overdue && actionState === 'none' && (
                    <span className="px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-bold">逾期{r.overdueDays}天</span>
                  )}
                  {actionState === 'purchased' && (
                    <span className="px-1.5 py-0.5 rounded-md bg-forest-100 text-forest-700 text-[10px] font-bold flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" />已购药</span>
                  )}
                  {actionState === 'rescheduled' && (
                    <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" />已重新预约</span>
                  )}
                  {actionState === 'booked' && (
                    <span className="px-1.5 py-0.5 rounded-md bg-forest-100 text-forest-700 text-[10px] font-bold flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" />已预约</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-900 leading-snug">{r.event}</p>
                <p className="text-[10px] text-gray-500 font-mono">{r.overdue ? `到期日：${r.date}` : r.date}</p>

                {r.overdue && r.overdueDays > 7 && actionState === 'none' && (
                  <div className="p-2 rounded-lg bg-red-50 border border-red-100 text-[10px] text-red-700 space-y-1">
                    <p className="font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> 逾期超过7天 · 需重点处置</p>
                    <p>长期未驱虫可能导致寄生虫感染，建议立即购药或预约医院驱虫</p>
                  </div>
                )}

                {r.overdue && r.overdueDays > 3 && r.overdueDays <= 7 && actionState === 'none' && (
                  <div className="p-2 rounded-lg bg-warm-50 border border-warm-100 text-[10px] text-warm-700 space-y-1">
                    <p className="font-bold flex items-center gap-1"><Bell className="w-3 h-3" /> 逾期{r.overdueDays}天 · 建议尽快处置</p>
                    <p>已触发平台提醒推送，请尽快购药或预约服务</p>
                  </div>
                )}

                {actionState === 'none' && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        if (r.overdue) handleOverdueAction(r.id, 'buying');
                        navigate(r.actionRoute);
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-white/80 hover:bg-white text-gray-800 text-[11px] font-bold border border-gray-200/60 transition-colors inline-flex items-center justify-center gap-1"
                    >
                      {r.action === '预约接种' && <MapPin className="w-3 h-3" />}
                      {r.action === '商城购药' && <ShoppingCart className="w-3 h-3" />}
                      {r.action === '查看预约' && <Calendar className="w-3 h-3" />}
                      {r.action}
                    </button>
                    {r.overdue && (
                      <button
                        onClick={() => handleOverdueAction(r.id, 'rescheduled')}
                        className="py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold border border-blue-200/60 transition-colors inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> 重新预约
                      </button>
                    )}
                  </div>
                )}

                {actionState === 'buying' && (
                  <div className="p-2 rounded-lg bg-forest-50 border border-forest-100 space-y-1.5">
                    <p className="text-[10px] font-semibold text-forest-800">购药确认</p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOverdueAction(r.id, 'purchased')}
                        className="flex-1 py-1.5 rounded-lg bg-forest-500 hover:bg-forest-600 text-white text-[11px] font-bold transition-colors inline-flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" /> 确认已购药
                      </button>
                      <button
                        onClick={() => handleOverdueAction(r.id, 'none')}
                        className="py-1.5 px-2 rounded-lg bg-white hover:bg-gray-50 text-gray-600 text-[11px] font-bold border border-gray-200 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                    <p className="text-[9px] text-forest-600">确认后将自动更新驱虫记录并写入健康日历</p>
                  </div>
                )}

                {actionState === 'purchased' && (
                  <div className="p-2 rounded-lg bg-forest-50 border border-forest-100 text-[10px] text-forest-700 space-y-1">
                    <p className="font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 已确认购药 · 驱虫记录已更新</p>
                    <p>下次驱虫日期已自动推算至 2025-09-01，已写入健康日历</p>
                    <button
                      onClick={() => navigate('/calendar')}
                      className="text-[9px] font-bold text-forest-600 hover:underline inline-flex items-center gap-0.5"
                    >
                      查看日历 <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}

                {actionState === 'rescheduled' && (
                  <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-[10px] text-blue-700 space-y-1">
                    <p className="font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 已重新预约 · 等待服务确认</p>
                    <p>预约提交后，医院将在24小时内确认，确认结果将通过App推送通知</p>
                    <button
                      onClick={() => navigate('/calendar')}
                      className="text-[9px] font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                    >
                      查看预约状态 <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}

                {actionState === 'booked' && (
                  <div className="p-2 rounded-lg bg-forest-50 border border-forest-100 text-[10px] text-forest-700 space-y-1">
                    <p className="font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 预约成功</p>
                    <p>已写入健康日历，服务前1天/1小时将自动推送提醒</p>
                    <button
                      onClick={() => navigate('/calendar')}
                      className="text-[9px] font-bold text-forest-600 hover:underline inline-flex items-center gap-0.5"
                    >
                      查看日历 <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {upcomingReminders.some(r => r.overdue) && (
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 text-[11px] text-red-700 space-y-1">
            <p className="font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> 逾期处置规则</p>
            <div className="grid sm:grid-cols-3 gap-2 text-[10px]">
              <div className="p-2 rounded-lg bg-white/70">
                <p className="font-semibold text-warm-700">逾期3天</p>
                <p className="text-gray-600">App推送+短信双通道提醒</p>
              </div>
              <div className="p-2 rounded-lg bg-white/70">
                <p className="font-semibold text-orange-700">逾期7天</p>
                <p className="text-gray-600">人工客服介入 · 重点跟进</p>
              </div>
              <div className="p-2 rounded-lg bg-white/70">
                <p className="font-semibold text-red-700">逾期30天</p>
                <p className="text-gray-600">健康风险预警 · 标记异常账号</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索宠物名称或品种..."
              className="input-field pl-12"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
            {speciesFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  filter === f.value
                    ? 'bg-forest-500 text-white'
                    : 'bg-forest-50 text-forest-700 hover:bg-forest-100'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredPets.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-forest-50 flex items-center justify-center">
            <PawPrint className="w-10 h-10 text-forest-300" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">暂无宠物档案</h3>
          <p className="text-sm text-gray-500 mb-4">点击上方按钮添加你的第一只宠物</p>
          <button className="btn-primary">
            <Plus className="w-5 h-5" />
            添加宠物
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              updatedDewormingRecord={updatedDewormingRecords[pet.id]}
              timelineUpdates={petTimelineUpdates[pet.id] || []}
            />
          ))}
        </div>
      )}

      {/* 多宠绑定弹窗 */}
      {showBindModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowBindModal(false)}>
          <div className="w-full max-w-lg card shadow-2xl space-y-4 animate-in fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-forest-500" /> 多宠绑定
              </h3>
              <button onClick={() => setShowBindModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M6 18L18 6" /></svg>
              </button>
            </div>
            <p className="text-xs text-gray-500">
              通过对方手机号或宠生园宠物编号可绑定家人共同管理宠物档案（权限可配置：仅查看/可修改/可预约就医/可查看健康日历）
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">对方手机号</label>
                <input type="tel" placeholder="请输入被邀请家人手机号" className="input-field !py-2.5" maxLength={11} />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">授权宠物（多选）</label>
                <div className="flex flex-wrap gap-1.5">
                  {mockPets.map(p => (
                    <label key={p.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cream-50 border border-forest-100 cursor-pointer hover:bg-forest-50 transition-colors">
                      <input type="checkbox" defaultChecked className="text-forest-600" />
                      <span className="text-[11px] font-semibold text-gray-800">{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">权限</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: 'view', label: '仅查看档案' },
                    { v: 'edit', label: '可修改资料' },
                    { v: 'booking', label: '可预约就医' },
                    { v: 'calendar', label: '可查看日历' },
                  ].map(o => (
                    <label key={o.v} className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-cream-50 border border-forest-100 cursor-pointer hover:bg-forest-50 transition-colors">
                      <input type="checkbox" defaultChecked={o.v === 'view' || o.v === 'calendar'} className="text-forest-600" />
                      <span className="text-[11px] font-semibold text-gray-800">{o.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-warm-600 flex items-start gap-1 pt-1 border-t border-gray-100">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              绑定邀请发出后，将通过平台内通知+短信通知对方，对方确认后生效，所有操作均记录至健康日历审计留痕。
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowBindModal(false)} className="btn-ghost !py-2 !px-4 text-sm">取消</button>
              <button onClick={() => setShowBindModal(false)} className="btn-primary !py-2 !px-4 text-sm gap-1.5 inline-flex items-center">
                <Link2 className="w-4 h-4" /> 发送绑定邀请
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
