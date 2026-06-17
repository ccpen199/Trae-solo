import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Filter, PawPrint, Link2, FileText, AlertTriangle,
  Calendar, Syringe, Bug, Heart, ChevronRight, MapPin, ShoppingCart,
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

export default function PetList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showBindModal, setShowBindModal] = useState(false);

  const filteredPets = mockPets.filter((pet) => {
    const matchesSearch = pet.name.includes(search) || pet.breed.includes(search);
    const matchesFilter = filter === 'all' || pet.species === filter;
    return matchesSearch && matchesFilter;
  });

  const upcomingReminders = [
    { id: 'r1', petName: '豆豆', type: '疫苗', event: '狂犬疫苗+六联疫苗加强针', date: '2026-01-15', action: '预约接种', actionRoute: '/hospitals', Icon: Syringe, color: 'from-forest-50 to-emerald-50 border-forest-200', badgeColor: 'bg-forest-500' },
    { id: 'r2', petName: '豆豆', type: '驱虫', event: '体内驱虫(拜宠清)', date: '已过期·2025-06-01', action: '商城购药', actionRoute: '/products', Icon: Bug, color: 'from-warm-50 to-orange-50 border-warm-200', badgeColor: 'bg-warm-500', overdue: true },
    { id: 'r3', petName: '小白', type: '复诊', event: '肠胃炎复诊', date: '2026-06-22·已预约', action: '查看预约', actionRoute: '/hospitals/h1', Icon: Heart, color: 'from-blue-50 to-sky-50 border-blue-200', badgeColor: 'bg-blue-500' },
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
          </div>
          <button onClick={() => navigate('/calendar')} className="text-xs text-forest-600 hover:text-forest-700 font-semibold inline-flex items-center gap-0.5">
            查看完整日历 <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {upcomingReminders.map(r => (
            <div key={r.id} className={cn('p-3 rounded-xl bg-gradient-to-br border space-y-2', r.color)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', r.badgeColor)}>
                    <r.Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-bold text-gray-800">{r.petName} · {r.type}</span>
                </div>
                {r.overdue && (
                  <span className="px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-bold">已过期</span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-900 leading-snug">{r.event}</p>
              <p className="text-[10px] text-gray-500 font-mono">{r.date}</p>
              <button
                onClick={() => navigate(r.actionRoute)}
                className="w-full py-1.5 rounded-lg bg-white/80 hover:bg-white text-gray-800 text-[11px] font-bold border border-gray-200/60 transition-colors inline-flex items-center justify-center gap-1"
              >
                {r.action === '预约接种' && <MapPin className="w-3 h-3" />}
                {r.action === '商城购药' && <ShoppingCart className="w-3 h-3" />}
                {r.action === '查看预约' && <Calendar className="w-3 h-3" />}
                {r.action}
              </button>
            </div>
          ))}
        </div>
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
            <PetCard key={pet.id} pet={pet} />
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
