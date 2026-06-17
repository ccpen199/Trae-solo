import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Syringe,
  Bug,
  Heart,
  MessageCircle,
  Calendar,
  PawPrint,
  ChevronRight,
  Scale,
  Cake,
  Check,
  Thermometer,
  Activity,
  AlertCircle,
  Stethoscope,
  Pill,
  MapPin,
  FileText,
  TrendingUp,
  Clock,
  X,
} from 'lucide-react';
import type { Pet } from '@shared/types';
import { cn } from '@/lib/utils';

const mockPet: Pet = {
  id: '1',
  ownerId: '1',
  name: '豆豆',
  species: 'dog',
  breed: '金毛寻回犬',
  gender: 'male',
  birthday: '2022-03-15',
  weight: 28.5,
  healthStatus: 'sick',
  vaccineRecords: [
    { id: 'v1', petId: '1', vaccineName: '狂犬疫苗', date: '2025-01-15', nextDate: '2026-01-15', hospitalId: 'h1' },
    { id: 'v2', petId: '1', vaccineName: '六联疫苗', date: '2025-01-15', nextDate: '2026-01-15', hospitalId: 'h1' },
  ],
  dewormingRecords: [
    { id: 'd1', petId: '1', type: 'internal', productName: '拜宠清', date: '2025-03-01', nextDate: '2025-06-01' },
    { id: 'd2', petId: '1', type: 'external', productName: '福来恩', date: '2025-03-15', nextDate: '2025-06-15' },
  ],
};

const speciesMap: Record<Pet['species'], string> = {
  dog: '狗狗',
  cat: '猫咪',
  rabbit: '兔子',
  bird: '鸟类',
  other: '其他',
};

const healthStatusMap = {
  healthy: { label: '健康', className: 'bg-forest-100 text-forest-700' },
  recovering: { label: '康复中', className: 'bg-blue-100 text-blue-700' },
  sick: { label: '患病中', className: 'bg-warm-100 text-warm-700' },
  chronic: { label: '慢性病管理', className: 'bg-gray-100 text-gray-700' },
};

function calculateAge(birthday: string) {
  const ageMs = Date.now() - new Date(birthday).getTime();
  const years = Math.floor(ageMs / 31536000000);
  const months = Math.floor((ageMs % 31536000000) / 2628000000);
  if (years === 0) return `${months}个月`;
  if (months === 0) return `${years}岁`;
  return `${years}岁${months}个月`;
}

const healthDataPoints = [
  { date: '2026-01', temp: '38.6°C', hr: 98, weight: 27.8 },
  { date: '2026-02', temp: '38.5°C', hr: 101, weight: 28.0 },
  { date: '2026-03', temp: '38.7°C', hr: 99, weight: 28.2 },
  { date: '2026-04', temp: '38.6°C', hr: 102, weight: 28.3 },
  { date: '2026-05', temp: '38.6°C', hr: 102, weight: 28.5 },
  { date: '2026-06', temp: '38.6°C', hr: 103, weight: 28.5 },
];

const allergies = ['青霉素类抗生素', '海鲜蛋白'];
const chronicDiseases: string[] = [];

const sickTracking = {
  diagnosis: '急性肠胃炎',
  doctor: '王建国',
  hospital: '瑞鹏宠物医院(朝阳总院)',
  diagnosedAt: '2026-06-14',
  nextFollow: '2026-06-22',
  followBooked: true,
  symptoms: ['呕吐(2次/日)', '食欲下降', '精神萎靡'],
  medications: [
    { name: '奥美拉唑肠溶胶囊', dose: '20mg/次', frequency: '每日2次，饭前', days: 7 },
    { name: '益生菌(BioCoat)', dose: '1袋/次', frequency: '每日2次', days: 14 },
  ],
};

const timelineRecords: Array<{
  id: string;
  type: 'vaccine' | 'deworming' | 'checkup' | 'diagnosis' | 'followup';
  title: string;
  date: string;
  doctor?: string;
  hospital?: string;
  status: 'done' | 'booked' | 'pending';
  actionLabel?: string;
  actionRoute?: string;
  details?: string;
}> = [
  { id: 'tl1', type: 'checkup', title: '2026年度健康体检', date: '2026-06-10', doctor: '李静怡', hospital: '瑞鹏朝阳总院', status: 'done', details: '血常规正常；心超结构正常；生化全项无异常。建议体重从28.5kg控制到27kg' },
  { id: 'tl2', type: 'diagnosis', title: '诊断 - 急性肠胃炎', date: '2026-06-14', doctor: '王建国', hospital: '瑞鹏朝阳总院', status: 'done', details: '饮食不当诱发急性肠胃炎，开具7天治疗方案' },
  { id: 'tl3', type: 'vaccine', title: '狂犬疫苗加强针', date: '2026-01-15', hospital: '瑞鹏朝阳总院', status: 'done', details: '已入档，有效期至2027-01-14' },
  { id: 'tl4', type: 'deworming', title: '体内驱虫(拜宠清)', date: '2025-03-01', status: 'done', details: '下次驱虫：2025-06-01，已过期请尽快预约' },
  { id: 'tl5', type: 'followup', title: '肠胃炎复诊', date: '2026-06-22', doctor: '王建国', hospital: '瑞鹏朝阳总院', status: 'booked', actionLabel: '查看预约', actionRoute: '/hospitals/h1' },
  { id: 'tl6', type: 'vaccine', title: '六联疫苗加强针', date: '2026-01-15', hospital: '瑞鹏朝阳总院', status: 'pending', actionLabel: '立即预约', actionRoute: '/hospitals' },
  { id: 'tl7', type: 'deworming', title: '体外驱虫(福来恩)', date: '2025-06-15', status: 'pending', actionLabel: '商城购药', actionRoute: '/products' },
];

export default function PetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pet = mockPet;
  const [showSickTimeline, setShowSickTimeline] = useState(true);
  const displayHealthStatus = pet.healthStatus === 'sick' ? 'recovering' as const : pet.healthStatus;

  const stats = [
    { icon: Cake, label: '年龄', value: calculateAge(pet.birthday) },
    { icon: Scale, label: '体重', value: `${pet.weight} kg` },
    { icon: PawPrint, label: '品种', value: pet.breed },
    { icon: Heart, label: '性别', value: pet.gender === 'male' ? '公' : '母' },
  ];

  const statusInfo = healthStatusMap[displayHealthStatus] || healthStatusMap.healthy;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl bg-white hover:bg-forest-50 transition-colors shadow-card"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="section-title mb-0">{pet.name}</h1>
            <span className={cn('tag text-[11px]', statusInfo.className)}>{statusInfo.label}</span>
          </div>
          <p className="section-subtitle">{speciesMap[pet.species]} · 完整健康档案</p>
        </div>
        <button className="btn-secondary">
          <Edit className="w-4 h-4" />
          编辑
        </button>
      </div>

      {/* 基础资料卡 */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-forest-100 to-forest-200 flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0 relative">
            <PawPrint className="w-16 h-16 text-forest-500" />
            <div className={cn('absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shadow', statusInfo.className)}>
              {statusInfo.label}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 p-3 rounded-2xl bg-cream-50 min-w-[140px]">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-forest-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <button onClick={() => navigate('/consultations')} className="btn-primary !px-4 !py-2 text-sm">
                <MessageCircle className="w-4 h-4" />
                在线问诊
              </button>
              <button onClick={() => navigate('/calendar')} className="btn-secondary !px-4 !py-2 text-sm">
                <Calendar className="w-4 h-4" />
                预约体检
              </button>
              <button onClick={() => navigate('/hospitals')} className="btn-ghost !px-4 !py-2 text-sm">
                <MapPin className="w-4 h-4" />
                就医导航
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 健康数据模板 */}
      <div className="card space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-100 to-emerald-100 flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-forest-600" />
            </div>
            <div>
              <h3 className="font-display font-bold text-gray-900">健康数据模板</h3>
              <p className="text-xs text-gray-500">模板ID: HT-{pet.id.padStart(6, '0')} · 最近6个月趋势</p>
            </div>
          </div>
          <button className="text-xs text-forest-600 hover:text-forest-700 font-semibold inline-flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> 导出模板报告
          </button>
        </div>

        {/* 当前快照 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '体温', value: '38.6°C', ref: '参考 37.5~39°C', status: 'normal', Icon: Thermometer, color: 'from-blue-50 to-sky-50 border-blue-100' },
            { label: '静息心率', value: '102/min', ref: '参考 70~160/min', status: 'normal', Icon: Activity, color: 'from-rose-50 to-pink-50 border-rose-100' },
            { label: '呼吸频率', value: '28/min', ref: '参考 10~30/min', status: 'normal', Icon: Heart, color: 'from-forest-50 to-emerald-50 border-forest-100' },
            { label: '体重趋势', value: '28.5kg', ref: '+0.3kg 近60天', status: 'warn', Icon: TrendingUp, color: 'from-warm-50 to-orange-50 border-warm-100' },
          ].map((m) => (
            <div key={m.label} className={cn('p-3 rounded-2xl border bg-gradient-to-br', m.color)}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-gray-600">{m.label}</span>
                <m.Icon className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <p className="text-lg font-bold text-gray-900 mb-0.5">{m.value}</p>
              <p className="text-[10px] text-gray-500">{m.ref}</p>
            </div>
          ))}
        </div>

        {/* 6个月趋势表 */}
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-forest-100">
                <th className="text-left py-2 px-2 text-gray-500 font-medium">月份</th>
                {healthDataPoints.map((p) => (
                  <th key={p.date} className="text-center py-2 px-2 text-gray-500 font-medium">{p.date.slice(5)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-forest-50">
                <td className="py-2 px-2 text-gray-600 font-medium">体温</td>
                {healthDataPoints.map((p) => (
                  <td key={`temp-${p.date}`} className="text-center py-2 px-2 font-mono text-gray-800">{p.temp}</td>
                ))}
              </tr>
              <tr className="border-b border-forest-50">
                <td className="py-2 px-2 text-gray-600 font-medium">心率/min</td>
                {healthDataPoints.map((p) => (
                  <td key={`hr-${p.date}`} className="text-center py-2 px-2 font-mono text-gray-800">{p.hr}</td>
                ))}
              </tr>
              <tr>
                <td className="py-2 px-2 text-gray-600 font-medium">体重(kg)</td>
                {healthDataPoints.map((p, i) => {
                  const diff = i > 0 ? p.weight - healthDataPoints[i - 1].weight : 0;
                  return (
                    <td key={`w-${p.date}`} className="text-center py-2 px-2 font-mono text-gray-800">
                      <div>{p.weight.toFixed(1)}</div>
                      {i > 0 && (
                        <div className={cn('text-[9px] font-semibold', diff > 0.1 ? 'text-warm-600' : diff < -0.1 ? 'text-blue-600' : 'text-gray-400')}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* 过敏/慢病 */}
        <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-forest-50">
          <div className="p-3 rounded-xl bg-cream-50 space-y-2">
            <p className="text-[11px] font-semibold text-gray-700 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-warm-500" /> 过敏史
            </p>
            {allergies.length === 0 ? (
              <p className="text-[11px] text-gray-400">暂无记录</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {allergies.map((a) => (
                  <span key={a} className="px-2 py-0.5 rounded-full bg-warm-100 text-warm-700 text-[10px] font-semibold">{a}</span>
                ))}
              </div>
            )}
          </div>
          <div className="p-3 rounded-xl bg-cream-50 space-y-2">
            <p className="text-[11px] font-semibold text-gray-700 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500" /> 慢性病史
            </p>
            {chronicDiseases.length === 0 ? (
              <p className="text-[11px] text-gray-400 flex items-center gap-1"><Check className="w-3 h-3 text-forest-500" /> 无 · 健康</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {chronicDiseases.map((c) => (
                  <span key={c} className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-semibold">{c}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 病中状态跟踪 - 康复中/患病中显示 */}
      {displayHealthStatus !== 'healthy' && displayHealthStatus !== 'chronic' && (
        <div className="card space-y-4 bg-gradient-to-br from-warm-50 to-orange-50 border-warm-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-warm-600" />
              </div>
              <div>
                <h3 className="font-display font-bold text-gray-900">病中状态跟踪</h3>
                <p className="text-xs text-gray-500">{sickTracking.diagnosis} · {displayHealthStatus === 'recovering' ? '康复第3天' : '治疗中'}</p>
              </div>
            </div>
            <button
              onClick={() => setShowSickTimeline(!showSickTimeline)}
              className="p-2 rounded-lg bg-white/60 hover:bg-white transition-colors"
            >
              <ChevronRight className={cn('w-4 h-4 text-gray-500 transition-transform', showSickTimeline && 'rotate-90')} />
            </button>
          </div>

          {showSickTimeline && (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/70 space-y-2">
                  <p className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5 text-warm-500" /> 诊断信息
                  </p>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500">主治医生</span>
                      <span className="font-semibold text-gray-800">{sickTracking.doctor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">就诊医院</span>
                      <span className="font-semibold text-gray-800 truncate ml-2 max-w-[60%] text-right">{sickTracking.hospital}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">诊断日期</span>
                      <span className="font-semibold text-gray-800">{sickTracking.diagnosedAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">复诊日期</span>
                      <button onClick={() => navigate('/hospitals/h1')} className="font-semibold text-warm-700 hover:underline inline-flex items-center gap-0.5">
                        {sickTracking.nextFollow}
                        {sickTracking.followBooked && <span className="px-1.5 py-0.5 rounded-full bg-warm-200/60 text-[9px]">已预约</span>}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/70 space-y-2">
                  <p className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-warm-500" /> 观察症状
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {sickTracking.symptoms.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-lg bg-warm-100/80 text-warm-700 text-[10px] font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 用药记录 */}
              <div className="p-3 rounded-xl bg-white/70 space-y-2">
                <p className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                  <Pill className="w-3.5 h-3.5 text-warm-500" /> 用药计划
                </p>
                <div className="space-y-1.5">
                  {sickTracking.medications.map((m) => (
                    <div key={m.name} className="flex items-center justify-between p-2 rounded-lg bg-cream-50 text-[11px]">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{m.name}</p>
                        <p className="text-[10px] text-gray-500">{m.dose} · {m.frequency}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-white text-warm-600 text-[10px] font-semibold">{m.days}天</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate('/hospitals/h1')}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-warm-50 border border-warm-200 text-warm-700 text-sm font-semibold transition-colors inline-flex items-center justify-center gap-1"
              >
                <Calendar className="w-4 h-4" /> 查看复诊预约详情 →
              </button>
            </>
          )}
        </div>
      )}

      {/* 疫苗/驱虫/体检时间线 */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-display font-bold text-gray-900">疫苗 / 驱虫 / 体检 记录时间线</h3>
              <p className="text-xs text-gray-500">共 {timelineRecords.length} 条 · 与健康日历提醒联动</p>
            </div>
          </div>
          <button onClick={() => navigate('/calendar')} className="text-xs text-purple-600 hover:text-purple-700 font-semibold inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> 打开日历
          </button>
        </div>

        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-forest-200 via-purple-200 to-warm-200" />
          {timelineRecords.map((r) => {
            const typeMeta = {
              vaccine: { Icon: Syringe, color: 'bg-forest-500', tagBg: 'bg-forest-100', tagTxt: 'text-forest-700', label: '疫苗' },
              deworming: { Icon: Bug, color: 'bg-warm-500', tagBg: 'bg-warm-100', tagTxt: 'text-warm-700', label: '驱虫' },
              checkup: { Icon: Heart, color: 'bg-pink-500', tagBg: 'bg-pink-100', tagTxt: 'text-pink-700', label: '体检' },
              diagnosis: { Icon: Stethoscope, color: 'bg-blue-500', tagBg: 'bg-blue-100', tagTxt: 'text-blue-700', label: '诊断' },
              followup: { Icon: Calendar, color: 'bg-purple-500', tagBg: 'bg-purple-100', tagTxt: 'text-purple-700', label: '复诊' },
            }[r.type];
            const TIcon = typeMeta.Icon;
            const statusMeta = {
              done: { label: '已完成', color: 'bg-forest-100 text-forest-700' },
              booked: { label: '已预约', color: 'bg-blue-100 text-blue-700' },
              pending: { label: '待预约', color: 'bg-warm-100 text-warm-700' },
            }[r.status];
            return (
              <div key={r.id} className="relative pb-5 last:pb-0">
                <div className={cn('absolute -left-[18px] top-1 w-8 h-8 rounded-full flex items-center justify-center shadow-md', typeMeta.color)}>
                  <TIcon className="w-4 h-4 text-white" />
                </div>
                <div className={cn(
                  'p-3 rounded-xl border',
                  r.status === 'done' ? 'bg-white border-gray-100' :
                  r.status === 'booked' ? 'bg-blue-50 border-blue-100' :
                  'bg-warm-50 border-warm-100'
                )}>
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className={cn('px-1.5 py-0.5 rounded-md text-[10px] font-bold', typeMeta.tagBg, typeMeta.tagTxt)}>{typeMeta.label}</span>
                        <span className={cn('px-1.5 py-0.5 rounded-md text-[10px] font-semibold', statusMeta.color)}>{statusMeta.label}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{r.date}</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">{r.title}</p>
                      {(r.doctor || r.hospital) && (
                        <p className="text-[11px] text-gray-500">
                          {r.doctor && <>主治：<span className="font-medium text-gray-700">{r.doctor}</span></>}
                          {r.doctor && r.hospital && ' · '}
                          {r.hospital && <button onClick={() => navigate(`/hospitals/${r.hospital === '瑞鹏朝阳总院' ? 'h1' : 'h1'}`)} className="font-medium text-gray-700 hover:text-forest-700 hover:underline">{r.hospital}</button>}
                        </p>
                      )}
                    </div>
                    {r.status !== 'done' && r.actionLabel && r.actionRoute && (
                      <button
                        onClick={() => navigate(r.actionRoute!)}
                        className={cn(
                          'shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold hover:shadow-md transition-all inline-flex items-center gap-1',
                          r.status === 'booked'
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-warm-500 text-white hover:bg-warm-600'
                        )}
                      >
                        {r.status === 'booked' ? <MapPin className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                        {r.actionLabel}
                      </button>
                    )}
                  </div>
                  {r.details && (
                    <p className="text-[11px] text-gray-600 p-2 rounded-lg bg-cream-50 mt-1">{r.details}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 原有的疫苗/驱虫详情卡片组 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center">
                <Syringe className="w-5 h-5 text-forest-600" />
              </div>
              <div>
                <h3 className="font-display font-bold text-gray-900">疫苗记录</h3>
                <p className="text-xs text-gray-500">共 {pet.vaccineRecords.length} 条</p>
              </div>
            </div>
            <button onClick={() => navigate('/hospitals')} className="text-sm text-forest-600 hover:text-forest-700 font-medium flex items-center gap-1">
              接种预约 <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {pet.vaccineRecords.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">暂无疫苗记录</p>
          ) : (
            <div className="space-y-3">
              {pet.vaccineRecords.map((record) => (
                <div key={record.id} className="flex items-center gap-4 p-3 rounded-2xl bg-cream-50">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                    <Check className="w-5 h-5 text-forest-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{record.vaccineName}</p>
                    <p className="text-xs text-gray-500">
                      接种: {new Date(record.date).toLocaleDateString('zh-CN')}
                      {record.hospitalId && ' · 瑞鹏朝阳总院'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">下次加强</p>
                    <p className="text-sm font-medium text-warm-500">{new Date(record.nextDate).toLocaleDateString('zh-CN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center">
                <Bug className="w-5 h-5 text-warm-500" />
              </div>
              <div>
                <h3 className="font-display font-bold text-gray-900">驱虫记录</h3>
                <p className="text-xs text-gray-500">共 {pet.dewormingRecords.length} 条</p>
              </div>
            </div>
            <button onClick={() => navigate('/products')} className="text-sm text-forest-600 hover:text-forest-700 font-medium flex items-center gap-1">
              商城购药 <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {pet.dewormingRecords.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">暂无驱虫记录</p>
          ) : (
            <div className="space-y-3">
              {pet.dewormingRecords.map((record) => (
                <div key={record.id} className="flex items-center gap-4 p-3 rounded-2xl bg-cream-50">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                    <Check className="w-5 h-5 text-warm-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{record.productName}</p>
                    <p className="text-xs text-gray-500">
                      {record.type === 'internal' ? '体内驱虫' : '体外驱虫'} · {new Date(record.date).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">下次</p>
                    <p className="text-sm font-medium text-warm-500">{new Date(record.nextDate).toLocaleDateString('zh-CN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
